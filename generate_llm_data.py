import openai
import os
import pandas as pd
import time
from io import StringIO
from dotenv import load_dotenv
import numpy as np
import re
from scipy.stats import entropy

# --- Configuration ---
load_dotenv()
client = openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

NUM_ROWS_TO_GENERATE = 750 # Increased for better distribution
BATCH_SIZE = 10
OUTPUT_FILE = "training_data_llm_v7_enhanced.csv"
MODEL_NAME = "gpt-4o"
API_TEMPERATURE = 0.4 # Lower temperature for more deterministic, logical output

# --- Define Allowed Categorical Values ---
ALLOWED_SORT_BY = ["Title", "Status", "Priority", "DueDate", "CreationDate", "none"]
ALLOWED_LABELS = ["Bug", "Feature", "Dokumentation"]
ALLOWED_PRIORITIES = ["Kritisch", "Hoch", "Mittel", "Niedrig"]
ALLOWED_STATUSES = ["Start ausstehend", "Zu Erledigen", "In Bearbeitung", "Erledigt", "Blockiert"]

# --- Target Distribution for Deterministic Control ---
# Define the desired final proportion for each class in the target variables.
# This allows the script to programmatically balance the dataset.
TARGET_DISTRIBUTIONS = {
    'predicted_view': {
        'list': 0.70,
        'kanban': 0.30
    },
    'predicted_status_filter': {
        'none': 0.30,
        'Zu Erledigen': 0.20,
        'In Bearbeitung': 0.15,
        'Blockiert': 0.15,
        'Start ausstehend': 0.15,
        'Erledigt': 0.05 # Less common but still needed
    },
    'predicted_priority_filter': {
        'none': 0.30,
        'Hoch': 0.20,
        'Kritisch': 0.20,
        'Niedrig': 0.15,
        'Mittel': 0.15
    }
}

BASE_GENERATION_INSTRUCTIONS = f"""
You are a data science expert creating a high-quality synthetic dataset.
For each row, you MUST follow a strict Chain-of-Thought reasoning process before outputting the final CSV line.

**Chain-of-Thought Process (MANDATORY):**
1.  **Reasoning Step 1: Persona Selection.** Explicitly state which persona you are generating for this row.
2.  **Reasoning Step 2: Causal Feature Generation.** Based on the persona, justify the key numerical values you generate. Explain WHY you are choosing these numbers to reflect the persona's state. Ensure all logical rules are met (e.g., status counts sum to total tasks).
3.  **Reasoning Step 3: Logical Label Assignment.** Based on the persona's rules and the features you just generated, explain your choice for `predicted_view`, `predicted_status_filter`, and `predicted_priority_filter`.
4.  **Final CSV Output:** After the reasoning, provide a single line of CSV data prefixed with "Final CSV Output: ".

**Output Format (Raw Counts):**
The CSV must have these exact columns in this exact order:
number_of_tasks,num_critical_open,num_high_open,num_medium_open,num_low_open,num_pending,num_todo,num_inprogress,num_done,num_blocked,overdue_tasks,due_today,time_of_day,sorted_by,last_task_created_label,last_task_created_priority,last_task_created_status,predicted_view,predicted_status_filter,predicted_priority_filter

**Strict Formatting and Value Rules (VERY IMPORTANT):**
- **DO NOT** output a CSV header.
- **time_of_day**: Integer 0-23.
- **sorted_by**: One of {ALLOWED_SORT_BY}.
- **last_task_created_label**: One of {ALLOWED_LABELS}.
- **last_task_created_priority**: One of {ALLOWED_PRIORITIES}.
- **last_task_created_status**: One of {ALLOWED_STATUSES}.
- **predicted_view**: 'list' or 'kanban'.
- **predicted_status_filter**: One of {ALLOWED_STATUSES} or 'none'.
- **predicted_priority_filter**: One of {ALLOWED_PRIORITIES} or 'none'.

**Logical Rules & Constraints:**
1.  Sum of `num_critical_open`, `num_high_open`, etc. must be <= `number_of_tasks`.
2.  Sum of `num_pending`, `num_todo`, etc. must == `number_of_tasks`.
3.  `overdue_tasks` must be <= `number_of_tasks`.
4.  If `predicted_view` is 'kanban', then filters MUST be 'none'.
5.  For `number_of_tasks` < 5, set `predicted_view`='list' and filters to 'none'.

**User Personas & Heuristics:**
- **1. Crisis Manager: Major Fire:** High `overdue_tasks` (>5) OR high `num_critical_open`. -> `predicted_view`='list', `predicted_status_filter`='Zu Erledigen', `predicted_priority_filter`='Kritisch'.
- **2. Crisis Manager: Minor Fire:** Moderate `overdue_tasks` (3-5) OR high `num_high_open`. -> `predicted_view`='list', `predicted_status_filter`='In Bearbeitung', `predicted_priority_filter`='Hoch'.
- **3. Blocker Analyst:** `num_blocked` > 0. -> `predicted_view`='list', `predicted_status_filter`='Blockiert', `predicted_priority_filter`='Hoch'.
- **4. Bug Hunter:** `last_task_created_label`='Bug'. -> `predicted_view`='list', `predicted_status_filter`='Zu Erledigen', `predicted_priority_filter` matches bug priority.
- **5. The Morning Planner:** `time_of_day` is 8-10. Low `num_inprogress`, `num_done`. -> `predicted_view`='list', `predicted_status_filter`='Zu Erledigen', `predicted_priority_filter`='none'.
- **6. The Kanban Planner:** Tasks spread across many statuses (e.g., `num_todo`, `num_inprogress`, `num_blocked` are all non-zero). -> `predicted_view`='kanban', filters are 'none'.
- **7. The Kick-off Manager:** High `num_pending`, low `number_of_tasks` (<15), zero `num_done`. -> `predicted_view`='list', `predicted_status_filter`='Start ausstehend', `predicted_priority_filter`='none'.
- **8. The Backlog Groomer:** High `num_low_open`, `last_task_created_priority` is 'Niedrig'. -> `predicted_view`='list', `predicted_status_filter`='none', `predicted_priority_filter`='Niedrig'.
- **9. The Structured Planner:** Healthy project (low overdue/blocked, high done). -> `predicted_view`='list', filters are 'none'.
- **10. The Ambiguous Manager:** A project with mixed signals that doesn't clearly fit other personas (e.g., moderate overdue tasks but no dominant priority). -> `predicted_view`='list', filters are 'none' due to ambiguity.

--- EXAMPLE 1 ---
Reasoning Step 1: Persona Selection. I will generate a row for the 'Crisis Manager: Major Fire' persona.
Reasoning Step 2: Causal Feature Generation. The persona is triggered by high `overdue_tasks` and `num_critical_open`. I'll set `number_of_tasks`=50. I'll make `overdue_tasks` high at 8. I'll set `num_critical_open` to a high value of 12. To meet the sum constraint, I'll set statuses: `num_pending`=5, `num_todo`=20, `num_inprogress`=15, `num_done`=5, `num_blocked`=5. This sums to 50.
Reasoning Step 3: Logical Label Assignment. The persona rules dictate a focus on the most urgent tasks. Therefore, `predicted_view`='list', `predicted_status_filter`='Zu Erledigen', and `predicted_priority_filter`='Kritisch'.
Final CSV Output: 50,12,18,10,5,5,20,15,5,5,8,2,16,Priority,Bug,Kritisch,In Bearbeitung,list,Zu Erledigen,Kritisch

--- EXAMPLE 2 ---
Reasoning Step 1: Persona Selection. I will generate a row for 'The Kanban Planner'.
Reasoning Step 2: Causal Feature Generation. This persona requires tasks spread across many statuses. I'll set `number_of_tasks`=80. I will ensure `num_todo`, `num_inprogress`, and `num_blocked` are all significant and non-zero. `num_pending`=10, `num_todo`=30, `num_inprogress`=25, `num_done`=10, `num_blocked`=5. This sums to 80 and shows a wide distribution.
Reasoning Step 3: Logical Label Assignment. The persona is for visual management of a complex workflow, so `predicted_view`='kanban'. Per the rules, filters must be 'none'.
Final CSV Output: 80,10,25,25,10,10,30,25,10,5,2,5,14,Status,Feature,Hoch,Zu Erledigen,kanban,none,none
"""

MASTER_PROMPT_V2 = f"""
{BASE_GENERATION_INSTRUCTIONS}
---

Generate {BATCH_SIZE} rows of CSV data now, following the Chain-of-Thought process for EACH row.
"""

# --- Pillar 3: Targeted Infill Prompts for Distribution Control ---
# Each infill prompt now includes the FULL context from the base instructions.
INFILL_PROMPTS = {
    'kanban': f"Your primary goal is to generate data for 'The Kanban Planner' persona. `predicted_view` MUST be 'kanban'.\n\n{BASE_GENERATION_INSTRUCTIONS}\n---\nGenerate {BATCH_SIZE} rows now.",
    'Blockiert': f"Your primary goal is to generate data for the 'Blocker Analyst' persona. `predicted_status_filter` MUST be 'Blockiert'.\n\n{BASE_GENERATION_INSTRUCTIONS}\n---\nGenerate {BATCH_SIZE} rows now.",
    'Start ausstehend': f"Your primary goal is to generate data for 'The Kick-off Manager' persona. `predicted_status_filter` MUST be 'Start ausstehend'.\n\n{BASE_GENERATION_INSTRUCTIONS}\n---\nGenerate {BATCH_SIZE} rows now.",
    'Niedrig': f"Your primary goal is to generate data for 'The Backlog Groomer' persona. `predicted_priority_filter` MUST be 'Niedrig'.\n\n{BASE_GENERATION_INSTRUCTIONS}\n---\nGenerate {BATCH_SIZE} rows now."
}

def generate_data_batch(prompt):
    """Generates a batch of data using the specified prompt and temperature."""
    try:
        completion = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": "You are a helpful assistant designed to output structured CSV data."},
                {"role": "user", "content": prompt}
            ],
            temperature=API_TEMPERATURE
        )
        return completion.choices[0].message.content
    except Exception as e:
        print(f"An error occurred: {e}")
        return None

def validate_and_process_df(df, column_names):
    """Performs validation, cleaning, and ADVANCED feature calculation."""
    df.columns = column_names

    initial_rows = len(df)
    df.dropna(inplace=True)
    if len(df) < initial_rows:
        print(f" ... dropped {initial_rows - len(df)} rows with missing values.")

    # --- Coerce numeric types ---
    numeric_cols = [
        'number_of_tasks','num_critical_open','num_high_open','num_medium_open','num_low_open',
        'num_pending','num_todo','num_inprogress','num_done','num_blocked',
        'overdue_tasks','due_today','time_of_day'
    ]
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors='coerce')
    df.dropna(subset=numeric_cols, inplace=True)

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
        df = df[df[col].astype(str).isin(allowed_values)]

    df = df[df['overdue_tasks'] <= df['number_of_tasks']]
    status_counts = ['num_pending', 'num_todo', 'num_inprogress', 'num_done', 'num_blocked']
    df = df[df[status_counts].sum(axis=1) == df['number_of_tasks']]
    df.loc[(df['predicted_view'] == 'kanban'), ['predicted_status_filter', 'predicted_priority_filter']] = 'none'

    # --- Pillar 2: Advanced Feature Engineering ---
    num_tasks = df['number_of_tasks']
    num_open_tasks = df['number_of_tasks'] - df['num_done']
    num_open_tasks_safe = num_open_tasks.replace(0, 1)

    # Base Percentages
    df['pct_critical_open'] = (df['num_critical_open'] / num_open_tasks_safe).fillna(0)
    df['pct_high_open'] = (df['num_high_open'] / num_open_tasks_safe).fillna(0)
    df['pct_medium_open'] = (df['num_medium_open'] / num_open_tasks_safe).fillna(0)
    df['pct_low_open'] = (df['num_low_open'] / num_open_tasks_safe).fillna(0)
    df['pct_pending_status'] = (df['num_pending'] / num_tasks).fillna(0)
    df['pct_todo_status'] = (df['num_todo'] / num_tasks).fillna(0)
    df['pct_in_progress_status'] = (df['num_inprogress'] / num_tasks).fillna(0)
    df['pct_done_status'] = (df['num_done'] / num_tasks).fillna(0)
    df['pct_blocked_status'] = (df['num_blocked'] / num_tasks).fillna(0)
    df['pct_overdue'] = (df['overdue_tasks'] / num_tasks).round(4).fillna(0)

    # Interaction and Composite Features
    df['crisis_index'] = df['pct_overdue'] * df['pct_critical_open']
    df['backlog_pressure'] = df['pct_todo_status'] * df['pct_low_open']
    df['wip_load'] = (df['num_inprogress'] / num_open_tasks_safe).fillna(0)
    df['health_score'] = (0.5 * df['pct_overdue']) + (0.3 * df['pct_blocked_status']) + (0.2 * df['pct_critical_open'])
    
    # Structural Features
    status_pct_cols = ['pct_pending_status', 'pct_todo_status', 'pct_in_progress_status', 'pct_done_status', 'pct_blocked_status']
    df['status_entropy'] = df[status_pct_cols].apply(lambda x: entropy(x[x>0]), axis=1).fillna(0)
    df['number_of_statuses_used'] = (df[status_counts] > 0).sum(axis=1)

    # Event-Based Features
    df['last_action_critical_bug'] = ((df['last_task_created_label'] == 'Bug') & (df['last_task_created_priority'] == 'Kritisch')).astype(int)

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

    print(f"Starting data generation for {NUM_ROWS_TO_GENERATE} rows with deterministic balancing...")
    while len(all_data_df) < NUM_ROWS_TO_GENERATE:
        
        # --- Pillar 3: Deterministic Distribution Control Loop ---
        prompt_to_use = MASTER_PROMPT_V2
        prompt_reason = "default diverse persona prompt"
        
        if not all_data_df.empty:
            deficits = {}
            for target_col, targets in TARGET_DISTRIBUTIONS.items():
                current_counts = all_data_df[target_col].value_counts(normalize=True)
                for class_name, target_prop in targets.items():
                    current_prop = current_counts.get(class_name, 0)
                    if current_prop < target_prop:
                        deficits[class_name] = target_prop - current_prop
            
            if deficits:
                # Find the class with the largest proportional deficit
                most_needed_class = max(deficits, key=deficits.get)
                if most_needed_class in INFILL_PROMPTS:
                    prompt_to_use = INFILL_PROMPTS[most_needed_class]
                    prompt_reason = f"targeted infill for '{most_needed_class}'"

        print(f"Current rows: {len(all_data_df)}/{NUM_ROWS_TO_GENERATE}. Requesting batch using: {prompt_reason}...")
        raw_response = generate_data_batch(prompt_to_use)

        if raw_response:
            # Robust parsing for CoT output: find all "Final CSV Output:..." lines
            csv_lines = re.findall(r"Final CSV Output:\s*(.*)", raw_response)
            
            if csv_lines:
                valid_csv_data = "\n".join(csv_lines)
                data_io = StringIO(valid_csv_data)
                try:
                    batch_df = pd.read_csv(data_io, header=None)
                    if batch_df.shape[1] == len(llm_column_names):
                        processed_df = validate_and_process_df(batch_df.copy(), llm_column_names)
                        all_data_df = pd.concat([all_data_df, processed_df], ignore_index=True)
                        print(f" ... successfully processed and added {len(processed_df)} rows.")
                    else:
                        print(f" ... ERROR: Batch has incorrect column count ({batch_df.shape[1]}). Discarding.")
                except Exception as e:
                    print(f" ... ERROR: Failed to parse or process batch. Error: {e}")
            else:
                print(" ... ERROR: Could not find any 'Final CSV Output:' lines in the response.")
        else:
            print(" ... batch generation failed.")

        time.sleep(3) # Be kind to the API

    all_data_df = all_data_df.head(NUM_ROWS_TO_GENERATE)

    # Define the final column order, now including the new engineered features
    final_column_order = [
        'number_of_tasks',
        'overdue_tasks', 'pct_overdue', 'due_today', 'time_of_day',
        'number_of_statuses_used', 'status_entropy', 'wip_load', 
        'pct_critical_open', 'pct_high_open','pct_medium_open', 'pct_low_open', 
        'pct_pending_status', 'pct_todo_status', 'pct_in_progress_status', 'pct_done_status', 'pct_blocked_status', 
        'health_score', 'crisis_index', 'backlog_pressure', 
        'sorted_by',
        'last_task_created_label', 'last_task_created_priority', 'last_task_created_status', 'last_action_critical_bug', 
        'predicted_view', 'predicted_status_filter', 'predicted_priority_filter'
    ]
    
    final_df = all_data_df.reindex(columns=final_column_order)

    final_df.to_csv(OUTPUT_FILE, index=False)

    print(f"\nData generation complete. {len(final_df)} validated and balanced rows saved to '{OUTPUT_FILE}'")
    print("\n--- Final Class Distribution Analysis ---")
    print("\nValue counts for 'predicted_view':")
    print(final_df['predicted_view'].value_counts(normalize=True))
    print("\nValue counts for 'predicted_status_filter':")
    print(final_df['predicted_status_filter'].value_counts(normalize=True))
    print("\nValue counts for 'predicted_priority_filter':")
    print(final_df['predicted_priority_filter'].value_counts(normalize=True))
    
    print("\nFirst 5 rows of the final enhanced data:")
    print(final_df.head())
