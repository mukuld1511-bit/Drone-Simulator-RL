"""
Autonomous Drone Navigation with Deep RL - Visualization Suite
File 4 of 8: visualizer.py
"""

import os
import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
from typing import List, Tuple, Dict, Optional
from utils import moving_average
from config import DroneConfig

class DroneVisualizer:
    """Provides 3D environment plots and training metrics visualization."""

    def __init__(self, config: Optional[DroneConfig] = None):
        """
        Initialize visualizer setup.

        Args:
            config (Optional[DroneConfig]): Configuration object.
        """
        self.config = config or DroneConfig()

    def plot_training_curves(
        self,
        history: Dict[str, List[float]],
        save_filename: str = "training_curves.png"
    ) -> None:
        """
        Plot 4-panel training metrics: Reward, Success Rate, Steps, and Epsilon/Loss.

        Args:
            history (Dict[str, List[float]]): Recorded metrics history.
            save_filename (str): Output PNG file name inside config.output_dir.
        """
        episodes = history["episode"]
        rewards = history["reward"]
        successes = history["success"]
        steps = history["steps"]
        epsilons = history["epsilon"]

        smoothed_rewards = moving_average(rewards, window_size=50)
        smoothed_success = moving_average(successes, window_size=100) * 100.0

        fig, axs = plt.subplots(2, 2, figsize=(14, 10))
        fig.suptitle("Autonomous Drone DQN Training Curves", fontsize=16, fontweight='bold')

        # 1. Rewards
        axs[0, 0].plot(episodes, rewards, alpha=0.3, color='dodgerblue', label='Raw Episode Reward')
        axs[0, 0].plot(episodes, smoothed_rewards, color='blue', linewidth=2, label='50-Ep Moving Avg')
        axs[0, 0].set_title("Episode Reward Progress")
        axs[0, 0].set_xlabel("Episode")
        axs[0, 0].set_ylabel("Total Reward")
        axs[0, 0].grid(True, linestyle='--', alpha=0.6)
        axs[0, 0].legend()

        # 2. Success Rate (%)
        axs[0, 1].plot(episodes, smoothed_success, color='green', linewidth=2, label='100-Ep Success Rate (%)')
        axs[0, 1].set_title("Autonomous Goal Success Rate (%)")
        axs[0, 1].set_xlabel("Episode")
        axs[0, 1].set_ylabel("Success Rate (%)")
        axs[0, 1].set_ylim(0, 105)
        axs[0, 1].grid(True, linestyle='--', alpha=0.6)
        axs[0, 1].legend()

        # 3. Steps per episode
        smoothed_steps = moving_average(steps, window_size=50)
        axs[1, 0].plot(episodes, steps, alpha=0.3, color='orange', label='Raw Steps')
        axs[1, 0].plot(episodes, smoothed_steps, color='darkorange', linewidth=2, label='50-Ep Moving Avg')
        axs[1, 0].set_title("Steps to Goal / Collision")
        axs[1, 0].set_xlabel("Episode")
        axs[1, 0].set_ylabel("Steps Count")
        axs[1, 0].grid(True, linestyle='--', alpha=0.6)
        axs[1, 0].legend()

        # 4. Epsilon Decay
        axs[1, 1].plot(episodes, epsilons, color='purple', linewidth=2, label='Epsilon (Exploration Rate)')
        axs[1, 1].set_title("Epsilon Decay Curve")
        axs[1, 1].set_xlabel("Episode")
        axs[1, 1].set_ylabel("Epsilon Value")
        axs[1, 1].grid(True, linestyle='--', alpha=0.6)
        axs[1, 1].legend()

        plt.tight_layout(rect=[0, 0.03, 1, 0.95])
        save_path = os.path.join(self.config.output_dir, save_filename)
        plt.savefig(save_path, dpi=300)
        plt.close()
        print(f"[Visualizer] Saved training metrics plot to '{save_path}'")

    def plot_3d_trajectory(
        self,
        trajectory: List[np.ndarray],
        obstacles: List[Tuple[np.ndarray, float]],
        start_pos: np.ndarray,
        goal_pos: np.ndarray,
        save_filename: str = "3d_flight_path.png"
    ) -> None:
        """
        Plot 3D continuous trajectory with spherical obstacles and goal marker.

        Args:
            trajectory (List[np.ndarray]): Drone path coordinates.
            obstacles (List[Tuple[np.ndarray, float]]): Obstacle sphere centers and radii.
            start_pos (np.ndarray): Drone starting coordinate.
            goal_pos (np.ndarray): Goal sphere coordinate.
            save_filename (str): PNG output filename inside output_dir.
        """
        fig = plt.figure(figsize=(10, 8))
        ax = fig.add_subplot(111, projection='3d')
        ax.set_title("3D Autonomous Drone Flight Trajectory", fontsize=14, fontweight='bold')

        # Set 3D world bounds
        w = self.config.world_size
        ax.set_xlim(0, w[0])
        ax.set_ylim(0, w[1])
        ax.set_zlim(0, w[2])
        ax.set_xlabel("X (m)")
        ax.set_ylabel("Y (m)")
        ax.set_zlabel("Z (m)")

        # Plot spherical obstacles
        u = np.linspace(0, 2 * np.pi, 20)
        v = np.linspace(0, np.pi, 20)
        for center, radius in obstacles:
            x = center[0] + radius * np.outer(np.cos(u), np.sin(v))
            y = center[1] + radius * np.outer(np.sin(u), np.sin(v))
            z = center[2] + radius * np.outer(np.ones(np.size(u)), np.cos(v))
            ax.plot_surface(x, y, z, color='crimson', alpha=0.35, edgecolor='darkred', linewidth=0.2)

        # Plot Start and Goal points
        ax.scatter([start_pos[0]], [start_pos[1]], [start_pos[2]], color='lime', s=120, label='Start Pos', marker='o')
        ax.scatter([goal_pos[0]], [goal_pos[1]], [goal_pos[2]], color='gold', s=180, label='Goal Zone', marker='*')

        # Plot drone trajectory
        traj_arr = np.array(trajectory)
        if len(traj_arr) > 0:
            ax.plot(traj_arr[:, 0], traj_arr[:, 1], traj_arr[:, 2], color='cyan', linewidth=2.5, label='DQN Path')

        ax.legend(loc='upper right')
        save_path = os.path.join(self.config.output_dir, save_filename)
        plt.savefig(save_path, dpi=300)
        plt.close()
        print(f"[Visualizer] Saved 3D trajectory plot to '{save_path}'")
