import os
import sys
import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import DroneConfig
from drone_env import DroneEnvironment
from dqn_agent import DQNAgent

app = Flask(__name__)
CORS(app)

# Initialize Config, Environment and Agent globally
config = DroneConfig()
env = DroneEnvironment(config)
agent = DQNAgent(config)

# Load the trained checkpoint
CHECKPOINT_PATH = os.path.join(config.checkpoint_dir, config.best_model_filename)
try:
    agent.load_checkpoint(CHECKPOINT_PATH)
    print(f"Successfully loaded checkpoint: {CHECKPOINT_PATH}")
except Exception as e:
    print(f"Warning: Could not load checkpoint at {CHECKPOINT_PATH}. Error: {e}")

# Global variables to track state
current_obs = None

@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    csv_path = os.path.join(config.output_dir, config.metrics_csv_filename)
    if not os.path.exists(csv_path):
        return jsonify({"error": "Metrics file not found"}), 404
        
    try:
        df = pd.read_csv(csv_path)
        # To avoid sending 10k rows (which might lag the browser), we can send a downsampled version
        # e.g., every 20th row, plus the last row
        if len(df) > 500:
            step = len(df) // 500
            df_sampled = df.iloc[::step].copy()
            if df.index[-1] not in df_sampled.index:
                df_sampled = pd.concat([df_sampled, df.iloc[[-1]]])
            df = df_sampled
            
        # Convert to dictionary format matching the frontend expectations
        # Expected keys: episode, reward, successRate, steps, loss, epsilon
        data = []
        
        # Calculate rolling success rate if not present
        if 'success' in df.columns:
            # We approximate rolling success by calculating it over the whole df first
            df_full = pd.read_csv(csv_path)
            df_full['rolling_success'] = df_full['success'].rolling(window=100, min_periods=1).mean() * 100
            
            # Map back to the sampled dataframe
            df['successRate'] = df_full.loc[df.index, 'rolling_success']
            
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
    
    # Parse hyperparams from request if provided
    data = request.json or {}
    
    # Update config dynamically if needed
    if 'numObstacles' in data:
        env.config.num_obstacles = int(data['numObstacles'])
    if 'numRays' in data:
        env.config.num_rays = int(data['numRays'])
        
    # Reset environment
    current_obs, info = env.reset()
    
    def to_list(val):
        return val.tolist() if hasattr(val, 'tolist') else val
        
    return jsonify({
        "drone_pos": to_list(info["drone_pos"]),
        "goal_pos": to_list(info["goal_pos"]),
        "obstacles": [
            {
                "id": i,
                "position": to_list(obs[0]),
                "radius": obs[1]
            } for i, obs in enumerate(env.obstacles)
        ],
        "world_size": env.config.world_size
    })


@app.route('/api/predict', methods=['POST'])
def predict_step():
    global current_obs
    
    if current_obs is None:
        return jsonify({"error": "Environment not reset"}), 400
        
    data = request.json or {}
    mode = data.get('mode', 'policy')
    
    # Choose action based on mode
    if mode == 'policy':
        action = agent.select_action(current_obs, evaluate=True)
    elif mode == 'training':
        action = agent.select_action(current_obs, evaluate=False)
    else:
        # Default fallback
        action = agent.select_action(current_obs, evaluate=True)
        
    # Ensure action is native int, not numpy.int64
    action = int(action)
        
    # Take step
    next_obs, reward, terminated, truncated, info = env.step(action)
    
    # Update current observation
    current_obs = next_obs
    
    def to_list(val):
        return val.tolist() if hasattr(val, 'tolist') else val

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
    app.run(host='0.0.0.0', port=5000, debug=True)
