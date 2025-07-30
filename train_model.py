import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report
import joblib
import os

# --- Configuration ---
MODEL_OUTPUT_DIR = "models"
if not os.path.exists(MODEL_OUTPUT_DIR):
    os.makedirs(MODEL_OUTPUT_DIR)

# --- 1. Load and Combine Datasets ---
CLEAN_DATA_FILE = "training_data_llm_v11.csv"
NOISY_DATA_FILE = "training_data_llm_v8_noisy.csv"

print(f"Loading and combining datasets...")
try:
    df_clean = pd.read_csv(CLEAN_DATA_FILE)
    df_noisy = pd.read_csv(NOISY_DATA_FILE)
    
    df_noisy_sample = df_noisy.sample(n=100, random_state=42)
    df_clean_sample = df_clean.sample(n=700, random_state=42)

    # Combine the two datasets
    df_combined = pd.concat([df_clean_sample, df_noisy_sample], ignore_index=True)

    # IMPORTANT: Shuffle the dataset to mix clean and noisy rows
    df = df_combined.sample(frac=1, random_state=42).reset_index(drop=True)

    df_list = df[(df.predicted_view != 'kanban') ]

    print(f"Combined dataset created successfully with {len(df)} rows.")
except FileNotFoundError as e:
    print(f"ERROR: Could not find a data file: {e}")
    exit()

# --- Diagnostic Block to Find Rare Classes ---
print("\n--- Analyzing Class Distribution ---")
for col in ['predicted_view', 'predicted_status_filter', 'predicted_priority_filter']:
    print(f"\nValue counts for '{col}':")
    print(df[col].value_counts())
print("------------------------------------\n")

# --- 2. Define Features and Labels ---
TARGET_COLUMNS = ['predicted_view', 'predicted_status_filter', 'predicted_priority_filter']

# --- MODIFIED: This list now reflects the actual columns in your final CSV files. ---
# To easily add or remove features, comment or uncomment lines in this list.
FEATURES_TO_USE = [
    #'number_of_tasks',
    'overdue_tasks',
    #'pct_overdue',
    #'number_of_statuses_used',
    'status_entropy',
    #'wip_load',
    'pct_critical_open',
    'pct_high_open',
    'pct_medium_open',
    'pct_low_open',
    'pct_pending_status',
    'pct_todo_status',
    'pct_in_progress_status',
    'pct_done_status',
    'pct_blocked_status',
    #'health_score',
    #'crisis_index',
    #'backlog_pressure',
    #'last_task_created_label',
    #'last_task_created_priority',
    #'last_task_created_status',
    #'last_action_critical_bug'
]

# Filter the list to only include columns that actually exist in the loaded DataFrame
FEATURES = [f for f in FEATURES_TO_USE if f in df.columns]
print(f"Using the following {len(FEATURES)} features for training: {FEATURES}")


X = df[FEATURES]
y = df[TARGET_COLUMNS]

x_list = df_list[FEATURES]
y_list = df_list[TARGET_COLUMNS]

# --- 3. Preprocessing ---
# Define all possible categorical features
all_categorical_features = [
    'sorted_by', 'last_task_created_label',
    'last_task_created_priority', 'last_task_created_status'
]

# Filter the list to only include categorical features that are in our final FEATURES list
categorical_features = [f for f in all_categorical_features if f in FEATURES]
numerical_features = [col for col in FEATURES if col not in categorical_features]

print(f"Identified {len(numerical_features)} numerical features.")
print(f"Identified {len(categorical_features)} categorical features: {categorical_features}")


preprocessor = ColumnTransformer(
    transformers=[
        ('num', 'passthrough', numerical_features),
        ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), categorical_features)
    ])

# --- 4. Train a Model for Each Target ---
def train_and_save_model(target_name):
    """
    Trains a Random Forest model, prints a detailed report, and saves the model.
    """
    print(f"\n--- Training model for: {target_name} ---")

    model_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', RandomForestClassifier(n_estimators=70, max_depth=14,random_state=42))])

    y_target = y[target_name]
    if(target_name == 'predicted_view'):
        x_target = X
        y_target = y[target_name]
    else:
        x_target = x_list
        y_target = y_list[target_name]


    # Check for rare classes before attempting to stratify
    class_counts = y_target.value_counts()
    stratify_option = y_target if class_counts.min() >= 2 else None
    if stratify_option is None:
        print(f"Warning: The least populated class for '{target_name}' has only 1 member. Disabling stratification.")

    X_train, X_test, y_train, y_test = train_test_split(
        x_target, y_target,
        test_size=0.2,
        random_state=42,
        stratify=stratify_option
    )
    print(f"Train samples: x={len(X_train)} and y={len(y_train)}")
    print("Training model...")
    model_pipeline.fit(X_train, y_train)

    y_pred = model_pipeline.predict(X_test)
    
    print("\nClassification Report:")
    report = classification_report(y_test, y_pred, zero_division=0)
    print(report)
    
    model_path = os.path.join(MODEL_OUTPUT_DIR, f"model_{target_name}.pkl")
    joblib.dump(model_pipeline, model_path)
    print(f"\nModel saved to '{model_path}'")

# --- Main Execution ---
if __name__ == "__main__":
    for target in TARGET_COLUMNS:
        train_and_save_model(target)

    print("\nAll models have been trained and saved successfully.")
    print(f"You can find your trained models in the '{MODEL_OUTPUT_DIR}/' directory.")
