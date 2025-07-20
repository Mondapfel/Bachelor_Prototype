import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report # --- NEW: Import the report
import joblib
import os

# --- Configuration ---
# INPUT_DATA_FILE = "training_data_llm_v7_enhanced.csv"
MODEL_OUTPUT_DIR = "models"
if not os.path.exists(MODEL_OUTPUT_DIR):
    os.makedirs(MODEL_OUTPUT_DIR)

# --- 1. Load and Combine Datasets ---
CLEAN_DATA_FILE = "training_data_llm_v7_enhanced.csv"
NOISY_DATA_FILE = "training_data_llm_v8_noisy.csv"

print(f"Loading and combining datasets...")
try:
    df_clean = pd.read_csv(CLEAN_DATA_FILE)
    df_noisy = pd.read_csv(NOISY_DATA_FILE)
    
    # Combine the two datasets
    df_combined = pd.concat([df_clean, df_noisy], ignore_index=True)

    # IMPORTANT: Shuffle the dataset to mix clean and noisy rows
    df = df_combined.sample(frac=1, random_state=42).reset_index(drop=True)

    print(f"Combined dataset created successfully with {len(df)} rows.")
except FileNotFoundError as e:
    print(f"ERROR: Could not find a data file: {e}")
    exit()

"""
# --- 1. Load the Dataset ---
print(f"Loading dataset from '{INPUT_DATA_FILE}'...")
try:
    df = pd.read_csv(INPUT_DATA_FILE)
    print(f"Dataset loaded successfully with {len(df)} rows.")
except FileNotFoundError:
    print(f"ERROR: The file '{INPUT_DATA_FILE}' was not found. Please make sure it's in the same directory.")
    exit()
"""

# --- Diagnostic Block to Find Rare Classes ---
print("\n--- Analyzing Class Distribution ---")
for col in ['predicted_view', 'predicted_status_filter', 'predicted_priority_filter']:
    print(f"\nValue counts for '{col}':")
    print(df[col].value_counts())
print("------------------------------------\n")

# --- 2. Define Features and Labels ---
TARGET_COLUMNS = ['predicted_view', 'predicted_status_filter', 'predicted_priority_filter']
FEATURES = [col for col in df.columns if col not in TARGET_COLUMNS]

X = df[FEATURES]
y = df[TARGET_COLUMNS]

# --- 3. Preprocessing ---
categorical_features = [
    'sorted_by', 'last_task_created_label',
    'last_task_created_priority', 'last_task_created_status'
]
numerical_features = [col for col in FEATURES if col not in categorical_features]

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
        ('classifier', RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced'))
    ])

    y_target = y[target_name]

    # Check for rare classes before attempting to stratify
    class_counts = y_target.value_counts()
    stratify_option = y_target if class_counts.min() >= 2 else None
    if stratify_option is None:
        print(f"Warning: The least populated class for '{target_name}' has only 1 member. Disabling stratification.")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_target,
        test_size=0.2,
        random_state=42,
        stratify=stratify_option
    )

    print("Training model...")
    model_pipeline.fit(X_train, y_train)

    # --- NEW: Generate predictions and print the detailed classification report ---
    y_pred = model_pipeline.predict(X_test)
    
    print("\nClassification Report:")
    # Use zero_division=0 to prevent warnings for classes with no predicted samples
    report = classification_report(y_test, y_pred, zero_division=0)
    print(report)
    # --- END OF NEW CODE ---

    model_path = os.path.join(MODEL_OUTPUT_DIR, f"model_{target_name}.pkl")
    joblib.dump(model_pipeline, model_path)
    print(f"\nModel saved to '{model_path}'")

# --- Main Execution ---
if __name__ == "__main__":
    for target in TARGET_COLUMNS:
        train_and_save_model(target)

    print("\nAll models have been trained and saved successfully.")
    print(f"You can find your trained models in the '{MODEL_OUTPUT_DIR}/' directory.")