import os
import sys
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS

# Ensure python_code dir is always in path regardless of working directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

from config import DroneConfig
from drone_env import DroneEnvironment
from dqn_agent import DQNAgent

app = Flask(__name__)
CORS(app)

# Initialize Config, Environment and Agent globally
config = DroneConfig()
# Override paths to be absolute so they work from any working directory
config.output_dir = os.path.join(BASE_DIR, 'outputs')
config.checkpoint_dir = os.path.join(BASE_DIR, 'checkpoints')
os.makedirs(config.output_dir, exist_ok=True)
os.makedirs(config.checkpoint_dir, exist_ok=True)

env = DroneEnvironment(config)
agent = DQNAgent(config)

# Load the trained checkpoint
CHECKPOINT_PATH = os.path.join(config.checkpoint_dir, config.best_model_filename)
try:
    agent.load_checkpoint(CHECKPOINT_PATH)
    print(f"Successfully loaded checkpoint: {CHECKPOINT_PATH}")
except Exception as e:
    print(f"Warning: Could not load checkpoint at {CHECKPOINT_PATH}. Error: {e}")
    print("Running with untrained/random policy.")

# Global variables to track state
current_obs = None


def to_list(val):
    """Convert numpy arrays or scalars to JSON-serializable Python types."""
    if hasattr(val, 'tolist'):
        return val.tolist()
    return val


@app.route('/api/health', methods=['GET'])
def health_check():
    """Simple health check endpoint for frontend to verify backend is alive."""
    return jsonify({"status": "ok", "checkpoint_loaded": os.path.exists(CHECKPOINT_PATH)})


@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    csv_path = os.path.join(config.output_dir, config.metrics_csv_filename)
    if not os.path.exists(csv_path):
        return jsonify({"error": "Metrics file not found. Run training first."}), 404
        
    try:
        df = pd.read_csv(csv_path)
        # Downsample to max 500 rows to avoid browser lag
        if len(df) > 500:
            step = len(df) // 500
            df_sampled = df.iloc[::step].copy()
            if df.index[-1] not in df_sampled.index:
                df_sampled = pd.concat([df_sampled, df.iloc[[-1]]])
            df = df_sampled
            
        # Calculate rolling success rate if not present
        if 'success' in df.columns:
            df_full = pd.read_csv(csv_path)
            df_full['rolling_success'] = df_full['success'].rolling(window=100, min_periods=1).mean() * 100
            df['successRate'] = df_full.loc[df.index, 'rolling_success']
            
        data = []
        for _, row in df.iterrows():
            data.append({
                "episode": int(row["episode"]),
                "reward": round(float(row["reward"]), 2),
                "successRate": round(float(row.get("successRate", row.get("success", 0) * 100)), 2),
                "steps": int(row["steps"]),
                "loss": round(float(row["loss"]), 4) if pd.notna(row["loss"]) else 0,
                "epsilon": round(float(row["epsilon"]), 4)
            })
            
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/reset', methods=['POST'])
def reset_env():
    global current_obs
    
    data = request.json or {}
    
    if 'numObstacles' in data:
        env.config.num_obstacles = int(data['numObstacles'])
    if 'numRays' in data:
        env.config.num_rays = int(data['numRays'])
        
    current_obs, info = env.reset()
    
    return jsonify({
        "drone_pos": to_list(info["drone_pos"]),
        "goal_pos": to_list(info["goal_pos"]),
        "obstacles": [
            {
                "id": i,
                "position": to_list(center),
                "radius": float(radius)
            } for i, (center, radius) in enumerate(env.obstacles)
        ],
        "world_size": list(env.config.world_size)
    })


@app.route('/api/predict', methods=['POST'])
def predict_step():
    global current_obs
    
    if current_obs is None:
        return jsonify({"error": "Environment not reset. Call /api/reset first."}), 400
        
    data = request.json or {}
    mode = data.get('mode', 'policy')
    
    # Choose action based on mode
    evaluate = (mode != 'training')
    action = int(agent.select_action(current_obs, evaluate=evaluate))
        
    # Take step
    next_obs, reward, terminated, truncated, info = env.step(action)
    current_obs = next_obs
    
    return jsonify({
        "action": action,
        "drone_pos": to_list(info["drone_pos"]),
        "reward": float(reward),
        "terminated": bool(terminated),
        "truncated": bool(truncated),
        "goal_reached": bool(info.get("goal_reached", False)),
        "collision": bool(info.get("collision", False))
    })


if __name__ == '__main__':
    print("Starting Drone RL Backend API on port 5000...")
    print(f"Working directory: {BASE_DIR}")
    app.run(host='0.0.0.0', port=5000, debug=True)

