from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import os
import json

# --- Configuration ---
app = Flask(__name__)
# Allows your React app (running on a different port) to call this backend.
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

# --- 2. The Prediction API Endpoint ---
@app.route('/predict', methods=['POST'])
def predict():
    """
    Receives project context data from the frontend, makes predictions using the
    loaded models, and returns the adaptive suggestions.
    """
    input_data = request.get_json()
    
    # --- DEBUGGING STEP: ALWAYS PRINT THE RECEIVED DATA ---
    print("\n--- Received Feature Payload from Frontend ---")
    print(json.dumps(input_data, indent=2))
    print("------------------------------------------\n")
    # --- END DEBUGGING STEP ---
    
    if not input_data:
        return jsonify({"error": "No input data provided"}), 400

    try:
        # Convert the incoming JSON into a pandas DataFrame
        input_df = pd.DataFrame(input_data, index=[0])

        # Make Predictions
        view_prediction = model_view.predict(input_df)[0]
        status_prediction = model_status.predict(input_df)[0]
        priority_prediction = model_priority.predict(input_df)[0]
        
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
        # Improved Error Logging
        print("\n--- ERROR DURING PREDICTION ---")
        print(f"Error Type: {type(e).__name__}")
        print(f"Error Details: {e}")
        print("\nReceived data from frontend:")
        print(json.dumps(input_data, indent=2))
        print("-----------------------------\n")
        return jsonify({"error": "An internal error occurred. Check the backend logs for details.", "details": str(e)}), 500

# --- 3. Run the Server ---
if __name__ == '__main__':
    app.run(port=5000, debug=True)

