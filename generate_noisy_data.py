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

NUM_ROWS_TO_GENERATE = 750
BATCH_SIZE = 10
# MODIFIED: New output file for the noisy data
OUTPUT_FILE = "training_data_llm_v8_noisy.csv"
MODEL_NAME = "gpt-4o"
# MODIFIED: Higher temperature for more variability
API_TEMPERATURE = 0.7

# --- Define Allowed Categorical Values ---
ALLOWED_SORT_BY = ["Title", "Status", "Priority", "DueDate", "CreationDate", "none"]
ALLOWED_LABELS = ["Bug", "Feature", "Dokumentation"]
ALLOWED_PRIORITIES = ["Kritisch", "Hoch", "Mittel", "Niedrig"]
ALLOWED_STATUSES = ["Start ausstehend", "Zu Erledigen", "In Bearbeitung", "Erledigt", "Blockiert"]

# --- Target Distribution for Deterministic Control ---
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
        'Erledigt': 0.05
    },
    'predicted_priority_filter': {
        'none': 0.30,
        'Hoch': 0.20,
        'Kritisch': 0.20,
        'Niedrig': 0.15,
        'Mittel': 0.15
    }
}

# MODIFIED: The entire prompt is updated with softer rules and new noisy personas.
BASE_GENERATION_INSTRUCTIONS = f"""
You are a data science expert creating a high-quality synthetic dataset with realistic noise and ambiguity.
For each row, you MUST follow a strict Chain-of-Thought reasoning process before outputting the final CSV line.

**Chain-of-Thought Process (MANDATORY):**
1.  **Reasoning Step 1: Persona Selection.** Explicitly state which persona you are generating for this row.
2.  **Reasoning Step 2: Causal Feature Generation.** Based on the persona, justify the key numerical values you generate.
3.  **Reasoning Step 3: Logical Label Assignment.** Based on the persona's behavioral patterns (which may be sub-optimal), explain your choice for `predicted_view`, `predicted_status_filter`, and `predicted_priority_filter`.
4.  **Final CSV Output:** After the reasoning, provide a single line of CSV data prefixed with "Final CSV Output: ".

**Output Format:**
The CSV must have these exact columns in this exact order:
number_of_tasks,num_critical_open,num_high_open,num_medium_open,num_low_open,num_pending,num_todo,num_inprogress,num_done,num_blocked,overdue_tasks,due_today,time_of_day,sorted_by,last_task_created_label,last_task_created_priority,last_task_created_status,predicted_view,predicted_status_filter,predicted_priority_filter

**Logical Rules & Constraints:**
1.  Sum of `num_critical_open`, `num_high_open`, etc. must be <= `number_of_tasks`.
2.  Sum of `num_pending`, `num_todo`, etc. must == `number_of_tasks`.
3.  `overdue_tasks` must be <= `number_of_tasks`.

**User Personas & Heuristics:**
- **1. Crisis Manager: Major Fire:** High `overdue_tasks` (>5) OR high `num_critical_open`. TENDS TO use `predicted_view`='list' with filters 'Zu Erledigen' and 'Kritisch'. SOMETIMES they panic and just use 'none' filters to see everything at once.
- **2. Crisis Manager: Minor Fire:** Moderate `overdue_tasks` (3-5) OR high `num_high_open`. USUALLY uses `predicted_view`='list', `predicted_status_filter`='In Bearbeitung', `predicted_priority_filter`='Hoch'.
- **3. Blocker Analyst:** `num_blocked` > 0. LIKELY uses `predicted_view`='list' and `predicted_status_filter`='Blockiert'.
- **4. Bug Hunter:** `last_task_created_label`='Bug'. OFTEN results in `predicted_view`='list' and `predicted_status_filter`='Zu Erledigen'.
- **5. The Morning Planner:** `time_of_day` is 8-10. TENDS TO use `predicted_view`='list' and filter by 'Zu Erledigen' to plan the day.
- **6. The Kanban Planner:** Tasks spread across many statuses. LIKELY uses `predicted_view`='kanban'. Filters are generally 'none', but not always.
- **7. The Kick-off Manager:** High `num_pending`, low `number_of_tasks` (<15). USUALLY picks `predicted_status_filter`='Start ausstehend'.
- **8. The Backlog Groomer:** High `num_low_open`. TENDS TO use a 'list' view and filter by 'Niedrig' priority.
- **9. The Structured Planner:** Healthy project (low overdue/blocked). OFTEN uses `predicted_view`='list' with 'none' filters.
- **10. The Ambiguous Manager:** Project with mixed signals. Almost always defaults to `predicted_view`='list' with 'none' filters.
- **11. The Inexperienced User:** This user is new and makes mistakes. They might use a 'kanban' view for a project with only 3 tasks, or filter by 'Niedrig' priority during a crisis. Their actions often don't match the project state.
- **12. The Distracted Manager:** This user has mixed signals in their data (e.g., moderate overdue but also high `num_done`). Their chosen filters might be unrelated to the most pressing issue, often defaulting to 'none' or sorting by 'Title'.

--- NOISY EXAMPLE ---
Reasoning Step 1: Persona Selection. I will generate a row for the 'Crisis Manager' persona.
Reasoning Step 2: Causal Feature Generation. The persona is in a crisis state. `number_of_tasks`=60, `overdue_tasks`=10, `num_critical_open`=8. The numbers reflect a project in trouble.
Reasoning Step 3: Logical Label Assignment. The manager is panicking. Instead of focusing on the critical tasks, they want a high-level overview first. So, despite the crisis, they choose `predicted_view`='list' but set both filters to 'none'. This is a sub-optimal but realistic human action.
Final CSV Output: 60,8,20,15,7,5,25,20,5,5,10,3,11,none,Feature,Kritisch,Zu Erledigen,list,none,none

--- CLEAN EXAMPLE ---
Reasoning Step 1: Persona Selection. I will generate a row for 'The Kanban Planner'.
Reasoning Step 2: Causal Feature Generation. This persona requires tasks spread across many statuses. I'll set `number_of_tasks`=80. I will ensure `num_todo`, `num_inprogress`, and `num_blocked` are all significant and non-zero. `num_pending`=10, `num_todo`=30, `num_inprogress`=25, `num_done`=10, `num_blocked`=5. This sums to 80.
Reasoning Step 3: Logical Label Assignment. The persona is for visual management, so the behavior is predictable: `predicted_view`='kanban' and filters must be 'none'.
Final CSV Output: 80,10,25,25,10,10,30,25,10,5,2,5,14,Status,Feature,Hoch,Zu Erledigen,kanban,none,none
"""

MASTER_PROMPT_V2 = f"""
{BASE_GENERATION_INSTRUCTIONS}
---

Generate {BATCH_SIZE} rows of CSV data now, following the Chain-of-Thought process for EACH row.
"""

# MODIFIED: Wording is softened and a new infill prompt is added.
INFILL_PROMPTS = {
    'kanban': f"Your primary goal is to generate data for 'The Kanban Planner' persona. `predicted_view` should LIKELY be 'kanban'.\n\n{BASE_GENERATION_INSTRUCTIONS}\n---\nGenerate {BATCH_SIZE} rows now.",
    'Blockiert': f"Your primary goal is to generate data for the 'Blocker Analyst' persona. `predicted_status_filter` will USUALLY be 'Blockiert'.\n\n{BASE_GENERATION_INSTRUCTIONS}\n---\nGenerate {BATCH_SIZE} rows now.",
    'Start ausstehend': f"Your primary goal is to generate data for 'The Kick-off Manager' persona. `predicted_status_filter` will LIKELY be 'Start ausstehend'.\n\n{BASE_GENERATION_INSTRUCTIONS}\n---\nGenerate {BATCH_SIZE} rows now.",
    'Niedrig': f"Your primary goal is to generate data for 'The Backlog Groomer' persona. `predicted_priority_filter` should TEND TO be 'Niedrig'.\n\n{BASE_GENERATION_INSTRUCTIONS}\n---\nGenerate {BATCH_SIZE} rows now.",
    'Mittel': f"The dataset is low on 'Mittel' priority data. Generate a few rows where this is the chosen filter, perhaps for the 'Structured Planner' or 'Distracted Manager' personas.\n\n{BASE_GENERATION_INSTRUCTIONS}\n---\nGenerate {BATCH_SIZE} rows now."
}

# The rest of the script (functions and main loop) remains the same as before.
def generate_data_batch(prompt):
    """Generates a batch of data using the specified prompt and temperature."""
    try:
        completion = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": "You are a helpful assistant designed to output structured CSV data with realistic variations."},
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
    numeric_cols = [
        'number_of_tasks','num_critical_open','num_high_open','num_medium_open','num_low_open',
        'num_pending','num_todo','num_inprogress','num_done','num_blocked',
        'overdue_tasks','due_today','time_of_day'
    ]
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors='coerce')
    df.dropna(subset=numeric_cols, inplace=True)
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
    df.loc[(df['predicted_view'] == 'kanban') & (np.random.rand(len(df)) < 0.8), ['predicted_status_filter', 'predicted_priority_filter']] = 'none'
    num_tasks = df['number_of_tasks']
    num_open_tasks = df['number_of_tasks'] - df['num_done']
    num_open_tasks_safe = num_open_tasks.replace(0, 1)
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
    df['crisis_index'] = df['pct_overdue'] * df['pct_critical_open']
    df['backlog_pressure'] = df['pct_todo_status'] * df['pct_low_open']
    df['wip_load'] = (df['num_inprogress'] / num_open_tasks_safe).fillna(0)
    df['health_score'] = (0.5 * df['pct_overdue']) + (0.3 * df['pct_blocked_status']) + (0.2 * df['pct_critical_open'])
    status_pct_cols = ['pct_pending_status', 'pct_todo_status', 'pct_in_progress_status', 'pct_done_status', 'pct_blocked_status']
    df['status_entropy'] = df[status_pct_cols].apply(lambda x: entropy(x[x>0]), axis=1).fillna(0)
    df['number_of_statuses_used'] = (df[status_counts] > 0).sum(axis=1)
    df['last_action_critical_bug'] = ((df['last_task_created_label'] == 'Bug') & (df['last_task_created_priority'] == 'Kritisch')).astype(int)
    return df

if __name__ == "__main__":
    all_data_df = pd.DataFrame()
    llm_column_names = [
        'number_of_tasks','num_critical_open','num_high_open','num_medium_open','num_low_open',
        'num_pending','num_todo','num_inprogress','num_done','num_blocked',
        'overdue_tasks','due_today','time_of_day','sorted_by',
        'last_task_created_label','last_task_created_priority','last_task_created_status',
        'predicted_view','predicted_status_filter','predicted_priority_filter'
    ]
    print(f"Starting NOISY data generation for {NUM_ROWS_TO_GENERATE} rows...")
    while len(all_data_df) < NUM_ROWS_TO_GENERATE:
        prompt_to_use = MASTER_PROMPT_V2
        prompt_reason = "default diverse (noisy) persona prompt"
        if not all_data_df.empty:
            deficits = {}
            for target_col, targets in TARGET_DISTRIBUTIONS.items():
                current_counts = all_data_df[target_col].value_counts(normalize=True)
                for class_name, target_prop in targets.items():
                    current_prop = current_counts.get(class_name, 0)
                    if current_prop < target_prop:
                        deficits[class_name] = target_prop - current_prop
            if deficits:
                most_needed_class = max(deficits, key=deficits.get)
                if most_needed_class in INFILL_PROMPTS:
                    prompt_to_use = INFILL_PROMPTS[most_needed_class]
                    prompt_reason = f"targeted infill for '{most_needed_class}'"
        print(f"Current rows: {len(all_data_df)}/{NUM_ROWS_TO_GENERATE}. Requesting batch using: {prompt_reason}...")
        raw_response = generate_data_batch(prompt_to_use)
        if raw_response:
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
        time.sleep(3)
    all_data_df = all_data_df.head(NUM_ROWS_TO_GENERATE)
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
    print(f"\nData generation complete. {len(final_df)} validated and NOISY rows saved to '{OUTPUT_FILE}'")
    print("\n--- Final Class Distribution Analysis ---")
    print("\nValue counts for 'predicted_view':")
    print(final_df['predicted_view'].value_counts(normalize=True))
    print("\nValue counts for 'predicted_status_filter':")
    print(final_df['predicted_status_filter'].value_counts(normalize=True))
    print("\nValue counts for 'predicted_priority_filter':")
    print(final_df['predicted_priority_filter'].value_counts(normalize=True))
    print("\nFirst 5 rows of the final enhanced data:")
    print(final_df.head())