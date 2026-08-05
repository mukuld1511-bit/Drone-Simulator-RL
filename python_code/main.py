"""
Autonomous Drone Navigation with Deep RL - Main CLI Entry Point
File 7 of 8: main.py
"""

import argparse
import os
import numpy as np
from config import DroneConfig
from utils import set_seed
from drone_env import DroneEnvironment
from dqn_agent import DQNAgent
from trainer import DroneTrainer
from visualizer import DroneVisualizer

def main():
    """Parse CLI arguments, initialize components, run training/eval, and generate 3D plots."""
    parser = argparse.ArgumentParser(
        description="Autonomous 3D Drone Navigation with Deep Q-Networks (DQN)"
    )
    parser.add_argument("--episodes", type=int, default=10000, help="Number of episodes to train")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility")
    parser.add_argument("--resume-from-checkpoint", type=str, default="", help="Path to .pth checkpoint file to resume")
    parser.add_argument("--eval", action="store_true", help="Run in evaluation mode without training updates")
    parser.add_argument("--num-eval-episodes", type=int, default=10, help="Number of evaluation episodes to run")
    
    args = parser.parse_args()

    # 1. Setup seed and config
    set_seed(args.seed)
    config = DroneConfig(episodes=args.episodes, seed=args.seed)

    print("=========================================================")
    print("   AUTONOMOUS DRONE NAVIGATION WITH DEEP RL (DQN)        ")
    print(f"   World Size: {config.world_size} | Obstacles: {config.num_obstacles}")
    print(f"   Ray Sensors: {config.num_rays} | Total Target Episodes: {config.episodes}")
    print("=========================================================\n")

    # 2. Instantiate Environment & Agent
    env = DroneEnvironment(config)
    agent = DQNAgent(config)

    # 3. Load checkpoint if requested
    if args.resume_from_checkpoint:
        if os.path.exists(args.resume_from_checkpoint):
            print(f"[Main] Resuming weights from '{args.resume_from_checkpoint}'...")
            agent.load_checkpoint(args.resume_from_checkpoint)
        else:
            print(f"[Main] Warning: Checkpoint file '{args.resume_from_checkpoint}' not found!")

    # 4. Evaluation Mode or Training Mode
    visualizer = DroneVisualizer(config)

    if args.eval:
        print(f"[Main] Running Evaluation Mode over {args.num_eval_episodes} test episodes...")
        success_count = 0
        for ep in range(1, args.num_eval_episodes + 1):
            obs, info = env.reset()
            trajectory = [info["drone_pos"]]
            terminated = False
            truncated = False
            total_reward = 0.0

            while not (terminated or truncated):
                action = agent.select_action(obs, evaluate=True)
                next_obs, reward, terminated, truncated, info = env.step(action)
                obs = next_obs
                total_reward += reward
                trajectory.append(info["drone_pos"])

            if info.get("goal_reached", False):
                success_count += 1
                status = "SUCCESS (Goal Reached)"
            else:
                status = "COLLISION / OOB"

            print(f"  Eval Ep {ep}/{args.num_eval_episodes}: Reward = {total_reward:.2f} | Status = {status}")

            # Plot 3D path of the first evaluation episode
            if ep == 1:
                visualizer.plot_3d_trajectory(
                    trajectory=trajectory,
                    obstacles=env.obstacles,
                    start_pos=trajectory[0],
                    goal_pos=env.goal_pos,
                    save_filename="eval_trajectory_ep1.png"
                )

        eval_success_rate = (success_count / args.num_eval_episodes) * 100.0
        print(f"\n[Evaluation Complete] Final Goal Success Rate: {eval_success_rate:.1f}%\n")

    else:
        # Run Full Training Loop
        trainer = DroneTrainer(env=env, agent=agent, config=config)
        history = trainer.train(num_episodes=args.episodes)

        # Generate final training metric plots
        visualizer.plot_training_curves(history, save_filename="training_curves.png")

        # Record a test trajectory with trained policy
        obs, info = env.reset()
        trajectory = [info["drone_pos"]]
        terminated = False
        truncated = False
        while not (terminated or truncated):
            action = agent.select_action(obs, evaluate=True)
            obs, _, terminated, truncated, info = env.step(action)
            trajectory.append(info["drone_pos"])

        visualizer.plot_3d_trajectory(
            trajectory=trajectory,
            obstacles=env.obstacles,
            start_pos=trajectory[0],
            goal_pos=env.goal_pos,
            save_filename="final_trained_trajectory.png"
        )


if __name__ == "__main__":
    main()
