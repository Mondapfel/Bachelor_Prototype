from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import os
import json
import numpy as np # NEW: Import numpy
from scipy.stats import entropy # NEW: Import entropy

# --- Configuration ---
app = Flask(__name__)
CORS(app) 

MODEL_DIR = "models"

# --- 1. Load the Trained Models on Startup ---
print("Loading trained models...")
try:
    model_view = joblib.load(os.path.join(MODEL_DIR, "model_predicted_view.pkl"))
    model_status = joblib.load(os.path.join(MODEL_DIR, "model_predicted_status_filter.pkl"))
    model_priority = joblib.load(os.path.join(MODEL_DIR, "model_predicted_priority_filter.pkl"))
    print("Models loaded successfully.")
except FileNotFoundError as e:
    print(f"ERROR: Could not load models. Make sure the 'models' directory exists and contains the .pkl files.")
    print(f"Details: {e}")
    exit()

# NEW: This function replicates the feature engineering from your training data script.
def engineer_features(df):
    """Takes the raw input DataFrame and engineers all the features the model expects."""
    # This logic is copied directly from your `validate_and_process_df` function
    
    # --- Pillar 2: Advanced Feature Engineering ---
    num_tasks = df['number_of_tasks']
    # Calculate num_open_tasks from the raw counts
    num_open_tasks = df['number_of_tasks'] - df['num_done']
    num_open_tasks_safe = num_open_tasks.replace(0, 1)

    # Base Percentages for open tasks by priority
    df['pct_critical_open'] = (df['num_critical_open'] / num_open_tasks_safe).fillna(0)
    df['pct_high_open'] = (df['num_high_open'] / num_open_tasks_safe).fillna(0)
    df['pct_medium_open'] = (df['num_medium_open'] / num_open_tasks_safe).fillna(0)
    df['pct_low_open'] = (df['num_low_open'] / num_open_tasks_safe).fillna(0)

    # Base Percentages for all tasks by status
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
    status_counts_cols = ['num_pending', 'num_todo', 'num_inprogress', 'num_done', 'num_blocked']
    status_pct_cols = ['pct_pending_status', 'pct_todo_status', 'pct_in_progress_status', 'pct_done_status', 'pct_blocked_status']
    df['status_entropy'] = df[status_pct_cols].apply(lambda x: entropy(x[x>0]), axis=1).fillna(0)
    df['number_of_statuses_used'] = (df[status_counts_cols] > 0).sum(axis=1)

    # Event-Based Features
    df['last_action_critical_bug'] = ((df['last_task_created_label'] == 'Bug') & (df['last_task_created_priority'] == 'Kritisch')).astype(int)

    return df


# --- 2. The Prediction API Endpoint ---
@app.route('/predict', methods=['POST'])
def predict():
    input_data = request.get_json()
    
    print("\n--- Received Raw Payload from Frontend ---")
    print(json.dumps(input_data, indent=2))
    print("----------------------------------------\n")
    
    if not input_data:
        return jsonify({"error": "No input data provided"}), 400

    try:
        input_df = pd.DataFrame(input_data, index=[0])

        # MODIFIED: Perform feature engineering before prediction
        processed_df = engineer_features(input_df)

        print("\n--- Processed DataFrame with Engineered Features ---")
        # Transpose for better readability in logs
        print(processed_df.iloc[0].to_json(indent=2))
        print("--------------------------------------------------\n")

        # Make Predictions using the fully processed DataFrame
        view_prediction = model_view.predict(processed_df)[0]
        status_prediction = model_status.predict(processed_df)[0]
        priority_prediction = model_priority.predict(processed_df)[0]
        
        # Gated Logic: If the view is kanban, filters must be 'none'.
        if view_prediction == 'kanban':
            status_prediction = 'none'
            priority_prediction = 'none'

        # Prepare the Response
        response = {
            'predicted_view': view_prediction,
            'predicted_status_filter': status_prediction,
            'predicted_priority_filter': priority_prediction
        }
        
        return jsonify(response)

    except Exception as e:
        print("\n--- ERROR DURING PREDICTION ---")
        print(f"Error Type: {type(e).__name__}")
        print(f"Error Details: {e}")
        import traceback
        traceback.print_exc() # Print full traceback for easier debugging
        print("\nReceived data from frontend:")
        print(json.dumps(input_data, indent=2))
        print("-----------------------------\n")
        return jsonify({"error": "An internal error occurred. Check the backend logs for details.", "details": str(e)}), 500

# --- 3. Run the Server ---
if __name__ == '__main__':
    app.run(port=5000, debug=True)