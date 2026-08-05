"""
Autonomous Drone Navigation with Deep RL - Trainer Module
File 3 of 8: trainer.py
"""

import os
import csv
import numpy as np
from tqdm import tqdm
from typing import Dict, List, Optional, Tuple
from config import DroneConfig
from drone_env import DroneEnvironment
from dqn_agent import DQNAgent

class DroneTrainer:
    """
    Manages the overall RL training process over N episodes.
    Logs progress, periodically syncs target network, and saves checkpoints.
    """

    def __init__(self, env: DroneEnvironment, agent: DQNAgent, config: Optional[DroneConfig] = None):
        """
        Initialize trainer components.

        Args:
            env (DroneEnvironment): 3D drone gymnasium environment.
            agent (DQNAgent): Deep Q-Network agent instance.
            config (Optional[DroneConfig]): Configuration parameters.
        """
        self.env = env
        self.agent = agent
        self.config = config or DroneConfig()

        self.csv_path = os.path.join(self.config.output_dir, self.config.metrics_csv_filename)
        self._init_csv_logger()

        self.best_reward = -float('inf')
        self.history: Dict[str, List[float]] = {
            "episode": [],
            "reward": [],
            "steps": [],
            "success": [],
            "collision": [],
            "loss": [],
            "epsilon": []
        }

    def _init_csv_logger(self) -> None:
        """Create and initialize the metrics CSV header."""
        with open(self.csv_path, mode='w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(["episode", "reward", "steps", "success", "collision", "loss", "epsilon"])

    def train(self, num_episodes: Optional[int] = None) -> Dict[str, List[float]]:
        """
        Execute the full Deep Q-Learning training loop.

        Args:
            num_episodes (Optional[int]): Number of episodes to run (defaults to config.episodes).

        Returns:
            Dict[str, List[float]]: Recorded metrics dictionary across all episodes.
        """
        max_episodes = num_episodes or self.config.episodes
        pbar = tqdm(range(1, max_episodes + 1), desc="Training DQN Drone")

        for episode in pbar:
            obs, info = self.env.reset()
            episode_reward = 0.0
            episode_steps = 0
            episode_losses = []
            terminated = False
            truncated = False

            while not (terminated or truncated):
                action = self.agent.select_action(obs, evaluate=False)
                next_obs, reward, terminated, truncated, info = self.env.step(action)

                done = terminated or truncated
                self.agent.memory.push(obs, action, reward, next_obs, done)

                loss = self.agent.learn()
                if loss is not None:
                    episode_losses.append(loss)

                obs = next_obs
                episode_reward += reward
                episode_steps += 1

                # Target Network Synchronization
                if self.agent.steps_done % self.config.target_sync_freq == 0:
                    self.agent.update_target_network()

            # Episode completion metrics
            epsilon = self.agent.decay_epsilon()
            mean_loss = float(np.mean(episode_losses)) if episode_losses else 0.0
            success = 1.0 if info.get("goal_reached", False) else 0.0
            collision = 1.0 if info.get("collision", False) else 0.0

            import math
            if math.isnan(episode_reward) or math.isinf(episode_reward):
                print(f"\n[Trainer] FATAL: NaN/Inf detected in reward at episode {episode}")
                print("[Trainer] Last 20 episodes metrics:")
                import pandas as pd
                if os.path.exists(self.csv_path):
                    df = pd.read_csv(self.csv_path)
                    print(df.tail(20))
                raise ValueError("NaN/Inf in reward")

            if math.isnan(mean_loss) or math.isinf(mean_loss):
                print(f"\n[Trainer] FATAL: NaN/Inf detected in loss at episode {episode}")
                print("[Trainer] Last 20 episodes metrics:")
                import pandas as pd
                if os.path.exists(self.csv_path):
                    df = pd.read_csv(self.csv_path)
                    print(df.tail(20))
                raise ValueError("NaN/Inf in loss")

            # Store metrics
            self.history["episode"].append(episode)
            self.history["reward"].append(episode_reward)
            self.history["steps"].append(episode_steps)
            self.history["success"].append(success)
            self.history["collision"].append(collision)
            self.history["loss"].append(mean_loss)
            self.history["epsilon"].append(epsilon)

            # Log to CSV
            with open(self.csv_path, mode='a', newline='') as f:
                writer = csv.writer(f)
                writer.writerow([episode, episode_reward, episode_steps, success, collision, mean_loss, epsilon])

            # Checkpoint management
            latest_path = os.path.join(self.config.checkpoint_dir, self.config.latest_model_filename)
            self.agent.save_checkpoint(latest_path)

            if episode_reward > self.best_reward:
                self.best_reward = episode_reward
                best_path = os.path.join(self.config.checkpoint_dir, self.config.best_model_filename)
                self.agent.save_checkpoint(best_path)

            # Update progress bar
            recent_success = np.mean(self.history["success"][-50:]) if len(self.history["success"]) >= 50 else np.mean(self.history["success"])
            pbar.set_postfix({
                "Reward": f"{episode_reward:.1f}",
                "Success 50": f"{recent_success * 100:.1f}%",
                "Eps": f"{epsilon:.3f}"
            })

        print(f"\n[Trainer] Training Completed! Models saved to '{self.config.checkpoint_dir}'. CSV saved to '{self.csv_path}'.")
        return self.history
