import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from drone_env import DroneEnvironment
except ImportError as e:
    print(f"FAILED: Could not import DroneEnvironment. {e}")
    sys.exit(1)

def run_smoke_test():
    try:
        env = DroneEnvironment()
        obs, info = env.reset()
        
        print("Initial Observation Shape:", obs.shape)
        
        for action in range(6):
            step_result = env.step(action)
            
            if len(step_result) != 5:
                print(f"FAILED: env.step() returned tuple of length {len(step_result)} instead of 5")
                sys.exit(1)
                
            obs, reward, terminated, truncated, info = step_result
            
            if obs.shape != (18,):
                print(f"FAILED: Observation shape is {obs.shape}, expected (18,)")
                sys.exit(1)
            
            import math
            if math.isnan(reward) or math.isinf(reward):
                print(f"FAILED: Reward is {reward} (NaN or Inf)")
                sys.exit(1)
                
            print(f"Action {action}: obs_shape={obs.shape}, reward={reward:.3f}, term={terminated}, trunc={truncated}")
            
        print("SUCCESS: Smoke test passed.")
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"FAILED: Exception occurred: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_smoke_test()
