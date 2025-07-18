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

NUM_ROWS_TO_GENERATE = 750
BATCH_SIZE = 10 
OUTPUT_FILE = "training_data_llm_v4_validated.csv"
MODEL_NAME = "gpt-4o"

# --- Define Allowed Categorical Values ---
ALLOWED_SORT_BY = ["Title", "Status", "Priority", "DueDate", "CreationDate", "none"]
ALLOWED_LABELS = ["Bug", "Feature", "Dokumentation"] 
ALLOWED_PRIORITIES = ["Kritisch", "Hoch", "Mittel", "Niedrig"]
ALLOWED_STATUSES = ["Start ausstehend", "Zu Erledigen", "In Bearbeitung", "Erledigt", "Blockiert"]

# --- The Master Prompt (Revised with More Personas) ---
MASTER_PROMPT = f"""
You are a data science expert creating a high-quality synthetic dataset for a machine learning model.
Your task is to generate {BATCH_SIZE} rows of data in a valid CSV format based on the user personas and logical rules provided below.

**Internal Thought Process (Chain of Thought):**
For each row you generate, first internally decide which persona it represents. Then, think step-by-step to create feature values that logically fit that persona's story while adhering to all constraints. Only after this internal monologue should you output the final CSV line.

**Output Format:**
The CSV must have these exact columns in this exact order:
number_of_tasks,pct_critical_priority,pct_high_priority,pct_medium_priority,pct_low_priority,pct_pending_status,pct_todo_status,pct_in_progress_status,pct_done_status,pct_blocked_status,overdue_tasks,due_today,time_of_day,sorted_by,last_task_created_label,last_task_created_priority,last_task_created_status,predicted_view,predicted_status_filter,predicted_priority_filter

**Strict Formatting and Value Rules (VERY IMPORTANT):**
1.  **DO NOT** output a header row or any text other than the CSV data.
2.  **time_of_day**: MUST be an integer between 0 and 23.
3.  **sorted_by**: MUST be one of these exact values: {ALLOWED_SORT_BY}.
4.  **last_task_created_label**: MUST be one of these exact values: {ALLOWED_LABELS}.
5.  **last_task_created_priority**: MUST be one of these exact values: {ALLOWED_PRIORITIES}.
6.  **last_task_created_status**: MUST be one of these exact values: {ALLOWED_STATUSES}.
7.  **predicted_view**: MUST be either 'list' or 'kanban'.
8.  **predicted_status_filter**: MUST be one of {ALLOWED_STATUSES} or 'none'.
9.  **predicted_priority_filter**: MUST be one of {ALLOWED_PRIORITIES} or 'none'.

**Logical Rules & Constraints:**
1.  The sum of all `pct_*_priority` columns for a single row must equal 1.0.
2.  The sum of all `pct_*_status` columns for a single row must equal 1.0.
3.  `overdue_tasks` must be less than or equal to `number_of_tasks`.
4.  If `predicted_view` is 'kanban', then `predicted_status_filter` and `predicted_priority_filter` MUST be 'none'.

**User Personas & Heuristics (Expanded):**
-   **Persona 1: "Crisis Manager"**: Triggered by high `overdue_tasks` (> 5) or high `pct_critical_priority` (> 0.3). Features should reflect this. Labels: `predicted_view`=list, `predicted_status_filter`=Zu Erledigen, `predicted_priority_filter`=Kritisch.
-   **Persona 2: "Visual Project Manager"**: Triggered by a high number of active statuses on a non-crisis project. Features: high number of non-zero `pct_*_status` columns and low `overdue_tasks`. Labels: `predicted_view`=kanban, `predicted_status_filter`=none, `predicted_priority_filter`=none.
-   **Persona 3: "Bug Hunter"**: Triggered when `last_task_created_label` is 'Bug'. Features: Set `last_task_created_label` to 'Bug'. Labels: `predicted_view`=list, `predicted_status_filter`=Zu Erledigen, `predicted_priority_filter`=Hoch.
-   **Persona 4: "End-of-Day Reviewer"**: Triggered when `time_of_day` is late (>= 16). Features: a significant `pct_in_progress_status`. Labels: `predicted_view`=list, `predicted_status_filter`=In Bearbeitung, `predicted_priority_filter`=none.
-   **Persona 5: "Blocker Analyst"**: Triggered by a significant `pct_blocked_status` (> 0.1). Features: high `pct_blocked_status`. Labels: `predicted_view`=list, `predicted_status_filter`=Blockiert, `predicted_priority_filter`=none.
-   **Default Scenarios**: For all other cases, generate varied, plausible data. If `number_of_tasks` > 30, lean towards `predicted_view`=list. Otherwise, lean towards `kanban`.

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

def validate_and_clean_df(df, column_names):
    """Performs rigorous validation and cleaning on the dataframe."""
    df.columns = column_names
    
    initial_rows = len(df)
    df.dropna(inplace=True)
    if len(df) < initial_rows:
        print(f"  ... dropped {initial_rows - len(df)} rows with missing values.")

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
        df = df[df[col].isin(allowed_values)]

    df = df[pd.to_numeric(df['time_of_day'], errors='coerce').between(0, 23)]
    df = df[df['overdue_tasks'] <= df['number_of_tasks']]
    
    priority_cols = ['pct_critical_priority', 'pct_high_priority', 'pct_medium_priority', 'pct_low_priority']
    status_cols = ['pct_pending_status', 'pct_todo_status', 'pct_in_progress_status', 'pct_done_status', 'pct_blocked_status']
    df = df[np.isclose(df[priority_cols].sum(axis=1), 1.0)]
    df = df[np.isclose(df[status_cols].sum(axis=1), 1.0)]

    df.loc[(df['predicted_view'] == 'kanban'), ['predicted_status_filter', 'predicted_priority_filter']] = 'none'

    return df

def calculate_derived_features(df):
    """Calculates features that were removed from the LLM prompt."""
    status_pct_cols = ['pct_pending_status', 'pct_todo_status', 'pct_in_progress_status', 'pct_done_status', 'pct_blocked_status']
    df['number_of_statuses_used'] = (df[status_pct_cols] > 0).sum(axis=1)
    df['pct_overdue'] = (df['overdue_tasks'] / df['number_of_tasks']).round(4)
    return df

# --- Main Execution ---
if __name__ == "__main__":
    all_data_df = pd.DataFrame()
    
    llm_column_names = [
        'number_of_tasks','pct_critical_priority','pct_high_priority','pct_medium_priority','pct_low_priority',
        'pct_pending_status','pct_todo_status','pct_in_progress_status','pct_done_status','pct_blocked_status',
        'overdue_tasks','due_today','time_of_day','sorted_by',
        'last_task_created_label','last_task_created_priority','last_task_created_status',
        'predicted_view','predicted_status_filter','predicted_priority_filter'
    ]

    print(f"Starting data generation for {NUM_ROWS_TO_GENERATE} rows...")
    while len(all_data_df) < NUM_ROWS_TO_GENERATE:
        print(f"Current rows: {len(all_data_df)}/{NUM_ROWS_TO_GENERATE}. Requesting a new batch...")
        raw_response = generate_data_batch()

        if raw_response:
            cleaned_csv_string = raw_response.replace("```csv", "").replace("```", "").strip()
            data_io = StringIO(cleaned_csv_string)
            try:
                batch_df = pd.read_csv(data_io, header=None)
                if batch_df.shape[1] == len(llm_column_names):
                    validated_df = validate_and_clean_df(batch_df, llm_column_names)
                    all_data_df = pd.concat([all_data_df, validated_df], ignore_index=True)
                    print(f"  ... successfully validated and added {len(validated_df)} rows.")
                else:
                    print(f"  ... ERROR: Batch has incorrect column count ({batch_df.shape[1]}). Discarding.")
            except Exception as e:
                print(f"  ... ERROR: Failed to parse or validate batch. Error: {e}")
        else:
            print("  ... batch generation failed.")
        
        time.sleep(5)

    all_data_df = all_data_df.head(NUM_ROWS_TO_GENERATE)
    final_df = calculate_derived_features(all_data_df)

    final_column_order = [
        'number_of_tasks','pct_critical_priority','pct_high_priority','pct_medium_priority','pct_low_priority',
        'pct_pending_status','pct_todo_status','pct_in_progress_status','pct_done_status','pct_blocked_status',
        'overdue_tasks','pct_overdue','due_today','number_of_statuses_used','time_of_day','sorted_by',
        'last_task_created_label','last_task_created_priority','last_task_created_status',
        'predicted_view','predicted_status_filter','predicted_priority_filter'
    ]
    final_df = final_df[final_column_order]

    final_df.to_csv(OUTPUT_FILE, index=False)

    print(f"\nData generation complete. {len(final_df)} validated rows saved to '{OUTPUT_FILE}'")
    print("\nFirst 5 rows of the final validated data:")
    print(final_df.head())
