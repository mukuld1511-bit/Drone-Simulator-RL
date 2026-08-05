import pandas as pd
import numpy as np

def run_analysis():
    df = pd.read_csv('outputs/training_metrics.csv')
    
    # 1. Final training success rate (average of last 50 episodes)
    final_success_rate = df['success'].tail(50).mean() * 100
    
    # 2. Episode where it stabilized above 90%
    # Calculate rolling 50-episode success rate
    df['rolling_success'] = df['success'].rolling(window=50).mean() * 100
    stable_idx = df.index[df['rolling_success'] >= 90.0]
    first_stable_episode = df.loc[stable_idx[0], 'episode'] if len(stable_idx) > 0 else "Never stabilized above 90%"
    
    # 3. Final avg steps-to-goal (average of last 50 episodes)
    final_avg_steps = df['steps'].tail(50).mean()
    
    # 4. NaN/Instability events
    nan_events = df[df.isna().any(axis=1)]
    if len(nan_events) > 0:
        nan_info = f"NaN detected at episodes: {nan_events['episode'].tolist()}"
    else:
        nan_info = "None detected"
        
    print("=== TRAINING METRICS REPORT ===")
    print(f"Final Training Success Rate (last 50 eps): {final_success_rate:.1f}%")
    print(f"Episode stabilized above 90%: {first_stable_episode}")
    print(f"Final Average Steps-to-Goal (last 50 eps): {final_avg_steps:.1f}")
    print(f"NaN/Instability Events: {nan_info}")
    
if __name__ == "__main__":
    run_analysis()
