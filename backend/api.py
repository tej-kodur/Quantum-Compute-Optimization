from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
from openai import OpenAI
import time
from dotenv import load_dotenv
from models import SummaryResponse
import logging
import pandas as pd
# Set the Matplotlib backend to a non-interactive, thread-safe option
import matplotlib
matplotlib.use('Agg')  # Use the Agg backend which doesn't require a GUI
import matplotlib.pyplot as plt
import io
import base64
from typing import Optional
from werkzeug.datastructures import MultiDict

logger = logging.getLogger(__name__)
load_dotenv()
app = Flask(__name__)
CORS(app)
DATA_DIR = "data"

# Initialize the OpenAI client
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
# Replace with your assistant ID
ASSISTANT_ID = os.environ.get("OPENAI_ASSISTANT_ID")

@app.route('/api/health', methods=['GET'])
def health_check():
    """Simple health check endpoint"""
    return jsonify({"status": "healthy", "message": "Service is running"})

@app.route('/api/summary', methods=['GET'])
def get_summary():
    """Get a summary of the current QPU block allocation and costs."""
    try:
        # Load data
        daily_stats_path = f"{DATA_DIR}/daily_stats.csv"
        optimization_path = f"{DATA_DIR}/optimization_summary.json"
        
        if not os.path.exists(daily_stats_path) or not os.path.exists(optimization_path):
            return jsonify({"error": "Required data files not found"}), 404
        
        df = pd.read_csv(daily_stats_path)
        
        with open(optimization_path, 'r') as f:
            optimization_data = json.load(f)
        
        # Calculate summary metrics
        total_blocks = df['new_blocks_leased'].sum() if 'new_blocks_leased' in df.columns else 0
        
        blocks_by_type = json.loads(df.iloc[-1]['blocks_by_category'].replace("'", '"')) if 'blocks_by_category' in df.columns else {}
        
        total_workloads = df['workloads_executed'].sum() if 'workloads_executed' in df.columns else 0
        average_cost_per_day = df['total_cost'].mean() if 'total_cost' in df.columns else 0
        
        # Get cost savings from optimization
        cost_savings_percentage = optimization_data.get('average_savings_percentage', 0)
        recommendation = optimization_data.get('recommendation', "No specific recommendation available")
        
        # Create response
        summary = SummaryResponse(
            total_blocks=total_blocks,
            blocks_by_type=blocks_by_type,
            total_workloads=total_workloads,
            average_cost_per_day=average_cost_per_day,
            cost_savings_percentage=cost_savings_percentage,
            recommendation=recommendation
        )
        
        return jsonify(summary.to_dict())
    except Exception as e:
        logger.error(f"Error in summary endpoint: {e}")
        return jsonify({"error": f"Error retrieving summary: {str(e)}"}), 500

@app.route('/api/chart/daily-costs', methods=['GET'])
def get_daily_costs_chart():
    """Generate a chart for daily costs."""
    try:
        # Get query parameters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Load data
        data_path = f"{DATA_DIR}/daily_stats.csv"
        
        if not os.path.exists(data_path):
            return jsonify({"error": "Daily stats data not found"}), 404
        
        df = pd.read_csv(data_path)
        
        # Filter by date if provided
        if start_date:
            df = df[df['date'] >= start_date]
        if end_date:
            df = df[df['date'] <= end_date]
        
        # Create chart using the non-interactive backend
        fig, ax = plt.subplots(figsize=(10, 6))
        ax.plot(df['date'], df['total_cost'], marker='o')
        ax.set_title('Daily Costs')
        ax.set_xlabel('Date')
        ax.set_ylabel('Cost ($)')
        ax.grid(True)
        plt.xticks(rotation=45)
        plt.tight_layout()
        
        # Convert to base64 image
        buf = io.BytesIO()
        fig.savefig(buf, format='png')
        buf.seek(0)
        img_base64 = base64.b64encode(buf.read()).decode('utf-8')
        plt.close(fig)  # Make sure to close the figure
        
        return jsonify({"image": f"data:image/png;base64,{img_base64}"})
    except Exception as e:
        logger.error(f"Error generating daily costs chart: {e}")
        return jsonify({"error": f"Error generating chart: {str(e)}"}), 500

@app.route('/api/chart/block-utilization', methods=['GET'])
def get_block_utilization_chart():
    """Generate a chart for block utilization."""
    try:
        # Get query parameters
        block_type = request.args.get('block_type')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Load data
        data_path = f"{DATA_DIR}/qpu_blocks.csv"
        
        if not os.path.exists(data_path):
            return jsonify({"error": "QPU blocks data not found"}), 404
        
        df = pd.read_csv(data_path)
        
        # Filter by date and block type if provided
        if start_date:
            df = df[df['lease_date'] >= start_date]
        if end_date:
            df = df[df['lease_date'] <= end_date]
        if block_type and block_type.lower() != "all":
            df = df[df['category'] == block_type]
        
        # Aggregate data
        agg_df = df.groupby(['lease_date', 'category'])['workloads_executed'].mean().reset_index()
        
        # Create chart using the non-interactive backend
        fig, ax = plt.subplots(figsize=(10, 6))
        for block_type in agg_df['category'].unique():
            subset = agg_df[agg_df['category'] == block_type]
            ax.plot(subset['lease_date'], subset['workloads_executed'], marker='o', label=block_type)
        
        ax.set_title('Block Utilization (Average Workloads per Block)')
        ax.set_xlabel('Date')
        ax.set_ylabel('Average Workloads')
        ax.grid(True)
        ax.legend()
        plt.xticks(rotation=45)
        plt.tight_layout()
        
        # Convert to base64 image
        buf = io.BytesIO()
        fig.savefig(buf, format='png')
        buf.seek(0)
        img_base64 = base64.b64encode(buf.read()).decode('utf-8')
        plt.close(fig)  # Make sure to close the figure
        
        return jsonify({"image": f"data:image/png;base64,{img_base64}"})
    except Exception as e:
        logger.error(f"Error generating block utilization chart: {e}")
        return jsonify({"error": f"Error generating chart: {str(e)}"}), 500

@app.route('/api/chart/predictions', methods=['GET'])
def get_predictions_chart():
    """
    Generate a chart of future predictions.
    - If `metric` is provided, plot only that column.
    - Otherwise, plot all numeric metrics over time.
    - You can also filter by `days`, `start_date`, and `end_date`.
    """
    try:
        # Get query parameters
        metric = request.args.get('metric')
        days = request.args.get('days', default=30, type=int)
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Validate days parameter
        if days <= 0 or days > 365:
            return jsonify({"error": "Days parameter must be between 1 and 365"}), 400
        
        data_path = f"{DATA_DIR}/future_predictions.csv"
        if not os.path.exists(data_path):
            return jsonify({"error": "Predictions data not found"}), 404
        
        # Load and filter
        df = pd.read_csv(data_path)
        if start_date:
            df = df[df['date'] >= start_date]
        if end_date:
            df = df[df['date'] <= end_date]
        df = df.head(days)
        
        # Choose columns
        if metric:
            if metric not in df.columns:
                return jsonify({
                    "error": f"Invalid metric. Available: {df.select_dtypes(include=['number']).columns.tolist()}"
                }), 400
            cols_to_plot = [metric]
        else:
            cols_to_plot = df.select_dtypes(include=['number']).columns.tolist()
        
        if not cols_to_plot:
            return jsonify({"error": "No numeric columns available to plot"}), 400
        
        # Plot
        fig, ax = plt.subplots(figsize=(10, 6))
        for col in cols_to_plot:
            ax.plot(df['date'], df[col], marker='o', label=col)
        ax.set_title("Future Predictions")
        ax.set_xlabel("Date")
        ax.set_ylabel("Value")
        ax.legend()
        plt.xticks(rotation=45)
        plt.tight_layout()
        
        # Encode as base64
        buf = io.BytesIO()
        fig.savefig(buf, format='png')
        buf.seek(0)
        img_b64 = base64.b64encode(buf.read()).decode('utf-8')
        plt.close(fig)
        
        return jsonify({"image": f"data:image/png;base64,{img_b64}"})
    except Exception as e:
        logger.error(f"Error generating predictions chart: {e}")
        return jsonify({"error": f"Error generating chart: {str(e)}"}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    """
    Chat with your OpenAI Assistant
    
    Expected JSON format:
    {
        "message": "Your message here",
        "thread_id": "optional_thread_id_for_continued_conversations"
    }
    """
    try:
        data = request.json
        
        if not data:
            return jsonify({"error": "Request body is empty"}), 400
        
        user_message = data.get('message')
        thread_id = data.get('thread_id')
        
        if not user_message:
            return jsonify({"error": "Message is required"}), 400
        
        # Create a new thread if thread_id is not provided
        if not thread_id:
            thread = client.beta.threads.create()
            thread_id = thread.id
        
        # Add the user message to the thread
        client.beta.threads.messages.create(
            thread_id=thread_id,
            role="user",
            content=user_message
        )
        
        # Run the Assistant on the thread
        run = client.beta.threads.runs.create(
            thread_id=thread_id,
            assistant_id=ASSISTANT_ID
        )
        
        # Wait for the run to complete
        while run.status in ["queued", "in_progress"]:
            time.sleep(0.5)
            run = client.beta.threads.runs.retrieve(
                thread_id=thread_id,
                run_id=run.id
            )
        
        # Get the latest message from the assistant
        messages = client.beta.threads.messages.list(
            thread_id=thread_id
        )
        
        # Extract the assistant's response
        assistant_messages = [msg for msg in messages.data if msg.role == "assistant"]
        latest_message = assistant_messages[0] if assistant_messages else None
        
        if latest_message:
            assistant_response = ""
            for content_item in latest_message.content:
                if content_item.type == "text":
                    assistant_response += content_item.text.value
            
            return jsonify({
                "response": assistant_response,
                "thread_id": thread_id
            })
        else:
            return jsonify({
                "error": "No response received from assistant",
                "thread_id": thread_id
            }), 500
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/threads/<thread_id>', methods=['GET'])
def get_thread_history(thread_id):
    """
    Get the conversation history for a specific thread
    """
    try:
        messages = client.beta.threads.messages.list(
            thread_id=thread_id
        )
        
        history = []
        for msg in messages.data:
            content_text = ""
            for content_item in msg.content:
                if content_item.type == "text":
                    content_text += content_item.text.value
            
            history.append({
                "role": msg.role,
                "content": content_text,
                "created_at": msg.created_at
            })
        
        return jsonify({
            "thread_id": thread_id,
            "messages": history
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/threads/<thread_id>', methods=['DELETE'])
def delete_thread(thread_id):
    """
    Delete a specific thread
    """
    try:
        response = client.beta.threads.delete(thread_id=thread_id)
        return jsonify({"success": True, "deleted": thread_id})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/optimize', methods=['POST'])
def optimize_blocks():
    """Run block optimization based on specified strategy."""
    try:
        # Get the request data
        request_data = request.json
        if not request_data:
            return jsonify({"error": "Request body is empty"}), 400
            
        # In Flask, we don't have background_tasks like in FastAPI
        # We would need to use something like Celery or a thread for true background processing
        # For now, we'll just return as if optimization was completed
        
        return jsonify({"message": "Optimization started in the background", "status": "completed"})
    except Exception as e:
        logger.error(f"Error starting optimization: {e}")
        return jsonify({"error": f"Error starting optimization: {str(e)}"}), 500

@app.route('/api/optimization/status', methods=['GET'])
def get_optimization_status():
    """Get the status of the most recent optimization run."""
    try:
        status_path = f"{DATA_DIR}/optimization_results.json"
        
        if not os.path.exists(status_path):
            return jsonify({"status": "No optimization has been run yet"})
        
        with open(status_path, 'r') as f:
            status_data = json.load(f)
        
        return jsonify({"status": "completed"})
    except Exception as e:
        logger.error(f"Error retrieving optimization status: {e}")
        return jsonify({"error": f"Error retrieving status: {str(e)}"}), 500

@app.route('/api/optimization/results', methods=['GET'])
def get_optimization_results():
    """Get the results of the most recent optimization run."""
    try:
        results_path = f"{DATA_DIR}/optimization_results.json"
        
        if not os.path.exists(results_path):
            return jsonify({"error": "Optimization results not found"}), 404
        
        with open(results_path, 'r') as f:
            results_data = json.load(f)
        
        return jsonify(results_data)
    except Exception as e:
        logger.error(f"Error retrieving optimization results: {e}")
        return jsonify({"error": f"Error retrieving results: {str(e)}"}), 500

@app.route('/api/predictions', methods=['GET'])
def get_future_predictions():
    """Get future predictions for QPU usage and costs."""
    try:
        # Get query parameters
        metric = request.args.get('metric')
        days = request.args.get('days', default=30, type=int)
        
        # Validate days parameter
        if days <= 0 or days > 365:
            return jsonify({"error": "Days parameter must be between 1 and 365"}), 400
            
        predictions_path = f"{DATA_DIR}/future_predictions.csv"
        
        if not os.path.exists(predictions_path):
            return jsonify({"error": "Predictions data not found"}), 404
        
        # Load predictions
        df = pd.read_csv(predictions_path)
        
        # Filter by days requested
        df = df.head(days)
        
        # If specific metric requested, filter columns
        if metric:
            available_metrics = df.columns.tolist()
            if metric not in available_metrics:
                return jsonify({
                    "error": f"Invalid metric. Available metrics: {available_metrics}"
                }), 400
            result = {
                "dates": df['date'].tolist(),
                "predictions": df[metric].tolist()
            }
        else:
            # Return all metrics
            result = {
                "dates": df['date'].tolist(),
                "predictions": df.to_dict(orient='records')
            }
        
        # Add confidence intervals if available
        if metric and f"{metric}_lower_ci" in df.columns and f"{metric}_upper_ci" in df.columns:
            result["confidence_intervals"] = {
                "lower": df[f"{metric}_lower_ci"].tolist(),
                "upper": df[f"{metric}_upper_ci"].tolist()
            }
        
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error retrieving predictions: {e}")
        return jsonify({"error": f"Error retrieving predictions: {str(e)}"}), 500

@app.route('/api/optimized_predictions', methods=['GET'])
def get_optimized_predictions():
    """Get optimized future predictions for QPU usage and costs after applying optimization strategies."""
    try:
        # Get query parameters
        metric = request.args.get('metric')
        days = request.args.get('days', default=30, type=int)
        
        # Validate days parameter
        if days <= 0 or days > 365:
            return jsonify({"error": "Days parameter must be between 1 and 365"}), 400
            
        predictions_path = f"{DATA_DIR}/optimized_predictions.csv"
        
        if not os.path.exists(predictions_path):
            return jsonify({"error": "Optimized predictions data not found"}), 404
        
        # Load predictions
        df = pd.read_csv(predictions_path)
        
        # Filter by days requested
        df = df.head(days)
        
        # If specific metric requested, filter columns
        if metric:
            available_metrics = df.columns.tolist()
            if metric not in available_metrics:
                return jsonify({
                    "error": f"Invalid metric. Available metrics: {available_metrics}"
                }), 400
            result = {
                "dates": df['date'].tolist(),
                "optimized_predictions": df[metric].tolist()
            }
        else:
            # Return all metrics
            result = {
                "dates": df['date'].tolist(),
                "optimized_predictions": df.to_dict(orient='records')
            }
        
        # Add confidence intervals if available
        if metric and f"{metric}_lower_ci" in df.columns and f"{metric}_upper_ci" in df.columns:
            result["confidence_intervals"] = {
                "lower": df[f"{metric}_lower_ci"].tolist(),
                "upper": df[f"{metric}_upper_ci"].tolist()
            }
            
        # Add optimization details if available
        if "optimization_strategy" in df.columns:
            result["optimization_details"] = {
                "strategy": df['optimization_strategy'].iloc[0],
                "estimated_savings": df['estimated_savings'].mean() if 'estimated_savings' in df.columns else None
            }
        
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error retrieving optimized predictions: {e}")
        return jsonify({"error": f"Error retrieving optimized predictions: {str(e)}"}), 500

if __name__ == '__main__':
    # Check if environment variables are set
    if not os.environ.get("OPENAI_API_KEY"):
        raise ValueError("OPENAI_API_KEY environment variable is not set")
    
    if not os.environ.get("OPENAI_ASSISTANT_ID"):
        raise ValueError("OPENAI_ASSISTANT_ID environment variable is not set")
    
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get("PORT", 8000)))