import openai
import os
import pandas as pd
import time
from io import StringIO
from dotenv import load_dotenv
import numpy as np

# --- Configuration ---
load_dotenv()
client = openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

NUM_ROWS_TO_GENERATE = 500
BATCH_SIZE = 10
OUTPUT_FILE = "2_training_data_llm_v6_validated_corrected.csv"
MODEL_NAME = "gpt-4o"

# --- Define Allowed Categorical Values ---
ALLOWED_SORT_BY = ["Title", "Status", "Priority", "DueDate", "CreationDate", "none"]
ALLOWED_LABELS = ["Bug", "Feature", "Dokumentation"]
ALLOWED_PRIORITIES = ["Kritisch", "Hoch", "Mittel", "Niedrig"]
ALLOWED_STATUSES = ["Start ausstehend", "Zu Erledigen", "In Bearbeitung", "Erledigt", "Blockiert"]

# --- The Master Prompt (Corrected) ---
MASTER_PROMPT = f"""
You are a data science expert creating a high-quality synthetic dataset. Your task is to generate {BATCH_SIZE} rows of raw count data in CSV format based on the personas and rules below.

**Output Format (Raw Counts):**
The CSV must have these exact columns in this exact order:
number_of_tasks,num_critical_open,num_high_open,num_medium_open,num_low_open,num_pending,num_todo,num_inprogress,num_done,num_blocked,overdue_tasks,due_today,time_of_day,sorted_by,last_task_created_label,last_task_created_priority,last_task_created_status,predicted_view,predicted_status_filter,predicted_priority_filter

**Strict Formatting and Value Rules (VERY IMPORTANT):**
1.  **DO NOT** output a header row.
2.  **time_of_day**: MUST be an integer between 0 and 23.
3.  **sorted_by**: MUST be one of these exact values: {ALLOWED_SORT_BY}.
4.  **last_task_created_label**: MUST be one of these exact values: {ALLOWED_LABELS}.
5.  **last_task_created_priority**: MUST be one of these exact values: {ALLOWED_PRIORITIES}.
6.  **last_task_created_status**: MUST be one of these exact values: {ALLOWED_STATUSES}.
7.  **predicted_view**: MUST be either 'list' or 'kanban'.
8.  **predicted_status_filter**: MUST be one of {ALLOWED_STATUSES} or 'none'.
9.  **predicted_priority_filter**: MUST be one of {ALLOWED_PRIORITIES} or 'none'.

**Logical Rules & Constraints:**
1.  The sum of `num_critical_open`, `num_high_open`, ... must be <= `number_of_tasks`.
2.  The sum of `num_pending`, `num_todo`, ... must == `number_of_tasks`.
3.  `overdue_tasks` must be <= `number_of_tasks`.
4.  If `predicted_view` is 'kanban', then `predicted_status_filter` and `predicted_priority_filter` MUST be 'none'.
5.  For small projects (`number_of_tasks` < 5), users don't need filters. Set `predicted_view`='list', `predicted_status_filter`='none', `predicted_priority_filter`='none'.

**User Personas & Heuristics (Standardized Structure):**

-   **1. Crisis Manager: Major Fire**
    -   **Trigger:** High `overdue_tasks` (> 5) OR a high `num_critical_open`.
    -   **Feature Generation:** Create high values for `overdue_tasks` and/or `num_critical_open`.
    -   **Label Assignment:** `predicted_view`='list', `predicted_status_filter`='Zu Erledigen', `predicted_priority_filter`='Kritisch'.

-   **2. Crisis Manager: Minor Fire**
    -   **Trigger:** Moderate number of `overdue_tasks` (3-5) OR a high `num_high_open`.
    -   **Feature Generation:** Create values for `overdue_tasks` (3-5) and `num_high_open`.
    -   **Label Assignment:** `predicted_view`='list', `predicted_status_filter`='In Bearbeitung', `predicted_priority_filter`='Hoch'.

-   **3. Blocker Analyst**
    -   **Trigger:** Significant number of blocked tasks (`num_blocked` > 0).
    -   **Feature Generation:** Create a high value for `num_blocked`.
    -   **Label Assignment:** `predicted_view`='list', `predicted_status_filter`='Blockiert', `predicted_priority_filter`='Hoch'.

-   **4. Bug Hunter**
    -   **Trigger:** The last task created was a 'Bug'.
    -   **Feature Generation:** Set `last_task_created_label`='Bug'. Vary `last_task_created_priority` between 'Kritisch', 'Hoch', and 'Mittel'.
    -   **Label Assignment:** `predicted_view`='list', `predicted_status_filter`='Zu Erledigen', `predicted_priority_filter` should match the generated priority.

-   **5. The Morning Planner**
    -   **Trigger:** `time_of_day` is between 8 and 10.
    -   **Feature Generation:** Create low values for `num_inprogress` and `num_done`.
    -   **Label Assignment:** `predicted_view`='list', `predicted_status_filter`='Zu Erledigen', `predicted_priority_filter`='none'.

-   **6. The Kanban Planner (Replaces Visual Project Manager)**
    -   **Trigger:** A project with tasks spread across many statuses (e.g., `num_todo`, `num_inprogress`, and `num_blocked` are all non-zero).
    -   **Feature Generation:** Create a varied distribution across status columns.
    -   **Label Assignment:** `predicted_view`='kanban', `predicted_status_filter`='none', `predicted_priority_filter`='none'.

-   **7. The Kick-off Manager (NEW PERSONA)**
    -   **Trigger:** A new project is starting.
    -   **Feature Generation:** High `num_pending`, low `number_of_tasks` (< 15), and zero `num_done`.
    -   **Label Assignment:** `predicted_view`='list', `predicted_status_filter`='Start ausstehend', `predicted_priority_filter`='none'.

-   **8. The Backlog Groomer (NEW PERSONA)**
    -   **Trigger:** User is cleaning up low-importance tasks.
    -   **Feature Generation:** High `num_low_open`, `last_task_created_priority` is 'Niedrig'.
    -   **Label Assignment:** `predicted_view`='list', `predicted_status_filter`='none', `predicted_priority_filter`='Niedrig'.

-   **9. The Structured Planner**
    -   **Trigger:** The project is healthy and well-managed (low overdue/blocked, high done).
    -   **Feature Generation:** Low `overdue_tasks`, low `num_blocked`, high `num_done`.
    -   **Label Assignment:** `predicted_view`='list', `predicted_status_filter`='none', `predicted_priority_filter`='none'.

**Data Balancing Goal (VERY IMPORTANT):**
Your primary goal is to create a balanced dataset. Ensure a good mix of all personas in your output. The final {BATCH_SIZE} rows should contain a varied and representative sample of all possible values for `predicted_view`, `predicted_status_filter`, and `predicted_priority_filter`. **Intentionally generate examples for the less common classes like 'kanban', 'Blockiert', 'Start ausstehend', and 'Niedrig'.**

Generate {BATCH_SIZE} rows of CSV data now.
"""

def generate_data_batch():
    try:
        completion = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": "You are a helpful assistant designed to output structured CSV data."},
                {"role": "user", "content": MASTER_PROMPT}
            ]
        )
        return completion.choices[0].message.content
    except Exception as e:
        print(f"An error occurred: {e}")
        return None

def validate_and_process_df(df, column_names):
    """Performs validation, cleaning, and feature calculation."""
    df.columns = column_names

    initial_rows = len(df)
    df.dropna(inplace=True)
    if len(df) < initial_rows:
        print(f"   ... dropped {initial_rows - len(df)} rows with missing values.")

    # --- Coerce numeric types to handle potential LLM errors ---
    numeric_cols = [
        'number_of_tasks','num_critical_open','num_high_open','num_medium_open','num_low_open',
        'num_pending','num_todo','num_inprogress','num_done','num_blocked',
        'overdue_tasks','due_today','time_of_day'
    ]
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors='coerce')
    df.dropna(subset=numeric_cols, inplace=True) # Drop rows where coercion failed

    # --- Validation (Defense-in-depth) ---
    validators = {
        'sorted_by': ALLOWED_SORT_BY,
        'last_task_created_label': ALLOWED_LABELS,
        'last_task_created_priority': ALLOWED_PRIORITIES,
        'last_task_created_status': ALLOWED_STATUSES,
        'predicted_view': ['list', 'kanban'],
        'predicted_status_filter': ALLOWED_STATUSES + ['none'],
        'predicted_priority_filter': ALLOWED_PRIORITIES + ['none']
    }
    for col, allowed_values in validators.items():
        # Temporarily convert to string to handle any mixed types from LLM before isin
        df = df[df[col].astype(str).isin(allowed_values)]

    df = df[df['overdue_tasks'] <= df['number_of_tasks']]

    # Enforce logical rule: sum of status counts must equal total tasks
    status_counts = ['num_pending', 'num_todo', 'num_inprogress', 'num_done', 'num_blocked']
    df = df[df[status_counts].sum(axis=1) == df['number_of_tasks']]

    # Enforce logical rule from prompt: kanban view has no filters
    df.loc[(df['predicted_view'] == 'kanban'), ['predicted_status_filter', 'predicted_priority_filter']] = 'none'

    # --- Feature Calculation (The "Smart" Part) ---
    num_tasks = df['number_of_tasks']
    num_open_tasks = df['number_of_tasks'] - df['num_done']
    # Replace 0 with 1 in num_open_tasks to avoid division by zero, will result in 0 anyway.
    num_open_tasks_safe = num_open_tasks.replace(0, 1)

    # Calculate total percentages (for model input)
    df['pct_critical_priority'] = (df['num_critical_open'] / num_tasks).fillna(0)
    df['pct_high_priority'] = (df['num_high_open'] / num_tasks).fillna(0)
    df['pct_medium_priority'] = (df['num_medium_open'] / num_tasks).fillna(0)
    df['pct_low_priority'] = (df['num_low_open'] / num_tasks).fillna(0)

    df['pct_pending_status'] = (df['num_pending'] / num_tasks).fillna(0)
    df['pct_todo_status'] = (df['num_todo'] / num_tasks).fillna(0)
    df['pct_in_progress_status'] = (df['num_inprogress'] / num_tasks).fillna(0)
    df['pct_done_status'] = (df['num_done'] / num_tasks).fillna(0)
    df['pct_blocked_status'] = (df['num_blocked'] / num_tasks).fillna(0)

    # Calculate NEW status-aware features
    df['pct_critical_priority_open'] = (df['num_critical_open'] / num_open_tasks_safe).fillna(0)
    df['pct_high_priority_open'] = (df['num_high_open'] / num_open_tasks_safe).fillna(0)

    # We'll assume the in-progress tasks have a similar priority distribution to the open tasks
    df['pct_critical_priority_in_progress'] = (df['num_critical_open'] / num_open_tasks_safe * df['pct_in_progress_status']).fillna(0)
    df['pct_high_priority_in_progress'] = (df['num_high_open'] / num_open_tasks_safe * df['pct_in_progress_status']).fillna(0)

    # Calculate other derived features
    df['number_of_statuses_used'] = (df[['num_pending', 'num_todo', 'num_inprogress', 'num_done', 'num_blocked']] > 0).sum(axis=1)
    df['pct_overdue'] = (df['overdue_tasks'] / num_tasks).round(4).fillna(0)

    return df

# --- Main Execution ---
if __name__ == "__main__":
    all_data_df = pd.DataFrame()

    llm_column_names = [
        'number_of_tasks','num_critical_open','num_high_open','num_medium_open','num_low_open',
        'num_pending','num_todo','num_inprogress','num_done','num_blocked',
        'overdue_tasks','due_today','time_of_day','sorted_by',
        'last_task_created_label','last_task_created_priority','last_task_created_status',
        'predicted_view','predicted_status_filter','predicted_priority_filter'
    ]

    print(f"Starting data generation for {NUM_ROWS_TO_GENERATE} rows...")
    while len(all_data_df) < NUM_ROWS_TO_GENERATE:
        print(f"Current rows: {len(all_data_df)}/{NUM_ROWS_TO_GENERATE}. Requesting a new batch...")
        raw_response = generate_data_batch()

        if raw_response:
            # === START OF INTEGRATED ROBUST PARSING LOGIC ===
            lines = raw_response.strip().split('\n')
            start_index = -1
            # Find the first line that looks like our CSV data
            for i, line in enumerate(lines):
                # Data has 20 columns, so 19 commas. Check for a high number to be safe.
                if line.count(',') > 15:
                    start_index = i
                    break

            if start_index != -1:
                # Re-join only the valid CSV lines into a single string
                valid_csv_data = "\n".join(lines[start_index:])
                data_io = StringIO(valid_csv_data)
                try:
                    batch_df = pd.read_csv(data_io, header=None)
                    if batch_df.shape[1] == len(llm_column_names):
                        # Use .copy() to avoid potential SettingWithCopyWarning in pandas
                        processed_df = validate_and_process_df(batch_df.copy(), llm_column_names)
                        all_data_df = pd.concat([all_data_df, processed_df], ignore_index=True)
                        print(f"   ... successfully processed and added {len(processed_df)} rows.")
                    else:
                        print(f"   ... ERROR: Batch has incorrect column count ({batch_df.shape[1]}). Discarding.")
                except Exception as e:
                    print(f"   ... ERROR: Failed to parse or process batch. Error: {e}")
            else:
                # This case handles when the LLM response contained no valid CSV lines
                print("   ... ERROR: Could not find any valid CSV data in the response.")
        else:
            print("   ... batch generation failed.")

        time.sleep(3) # Be kind to the API

    all_data_df = all_data_df.head(NUM_ROWS_TO_GENERATE)

    # Define the final column order for the CSV
    final_column_order = [
        'number_of_tasks',
        'pct_critical_priority', 'pct_high_priority', 'pct_medium_priority', 'pct_low_priority',
        'pct_pending_status', 'pct_todo_status', 'pct_in_progress_status', 'pct_done_status', 'pct_blocked_status',
        'overdue_tasks', 'pct_overdue', 'due_today', 'number_of_statuses_used', 'time_of_day',
        'sorted_by', 'last_task_created_label', 'last_task_created_priority', 'last_task_created_status',
        'pct_critical_priority_open', 'pct_high_priority_open',
        'pct_critical_priority_in_progress', 'pct_high_priority_in_progress',
        'predicted_view', 'predicted_status_filter', 'predicted_priority_filter'
    ]
    # Select and reorder columns, dropping the intermediate 'num_*' columns
    final_df = all_data_df.reindex(columns=final_column_order)

    final_df.to_csv(OUTPUT_FILE, index=False)

    print(f"\nData generation complete. {len(final_df)} validated rows saved to '{OUTPUT_FILE}'")
    print("\nFirst 5 rows of the final validated data:")
    print(final_df.head())