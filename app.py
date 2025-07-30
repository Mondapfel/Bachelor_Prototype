from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import os
import json
import numpy as np
from scipy.stats import entropy

# --- Configuration ---
app = Flask(__name__)
CORS(app) 

MODEL_DIR = "models"

# NEW: Define the exact feature order the model was trained on.
# This is the 'final_column_order' from your training script, minus the target variables.
MODEL_FEATURE_ORDER = [
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

def engineer_features(data):
    """Takes the raw input dict and engineers all the features the model expects."""
    # Create DataFrame from the input dictionary
    df = pd.DataFrame(data, index=[0])
    
    # --- Feature Engineering Logic (from before) ---
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
    status_counts_cols = ['num_pending', 'num_todo', 'num_inprogress', 'num_done', 'num_blocked']
    status_pct_cols = ['pct_pending_status', 'pct_todo_status', 'pct_in_progress_status', 'pct_done_status', 'pct_blocked_status']
    df['status_entropy'] = df[status_pct_cols].apply(lambda x: entropy(x[x>0]), axis=1).fillna(0)
    df['number_of_statuses_used'] = (df[status_counts_cols] > 0).sum(axis=1)
    df['last_action_critical_bug'] = ((df['last_task_created_label'] == 'Bug') & (df['last_task_created_priority'] == 'Kritisch')).astype(int)

    # MODIFIED: Enforce the column order to match the training data
    return df[MODEL_FEATURE_ORDER]

# --- 2. The Prediction API Endpoint ---
@app.route('/predict', methods=['POST'])
def predict():
    input_data = request.get_json()
    
    print("\n--- Received Raw Payload from Frontend ---")
    print(json.dumps(input_data, indent=2))
    
    if not input_data:
        return jsonify({"error": "No input data provided"}), 400

    try:
        processed_df = engineer_features(input_data)

        # --- DECONSTRUCT THE PIPELINE FOR DEBUGGING ---
        print("\n--- DEBUGGING model_view PIPELINE ---")
        
        # 1. Isolate the preprocessor and classifier steps
        preprocessor = model_view.named_steps['preprocessor']
        classifier = model_view.named_steps['classifier']
        
        # 2. Manually transform the data using the preprocessor
        print("Data BEFORE preprocessing (shape, dtypes):\n", processed_df.shape)
        print(processed_df.info()) # Check data types
        
        transformed_data = preprocessor.transform(processed_df)
        
        # 3. Inspect the data AFTER preprocessing
        print("\nData AFTER preprocessing (shape, content):\n", transformed_data.shape)
        print(transformed_data)
        # --- END DEBUGGING BLOCK ---

        # Make Predictions using the other models as usual
        view_prediction = model_view.predict(processed_df)[0]
        status_prediction = model_status.predict(processed_df)[0]
        priority_prediction = model_priority.predict(processed_df)[0]
        
        if view_prediction == 'kanban':
            status_prediction = 'none'
            priority_prediction = 'none'

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
        traceback.print_exc()
        print("\nReceived data from frontend:")
        print(json.dumps(input_data, indent=2))
        print("-----------------------------\n")
        return jsonify({"error": "An internal error occurred. Check the backend logs for details.", "details": str(e)}), 500

# --- 3. Run the Server ---
if __name__ == '__main__':
    app.run(port=5000, debug=True)