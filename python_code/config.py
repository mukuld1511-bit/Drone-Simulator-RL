"""
Autonomous Drone Navigation with Deep RL - Configuration File
File 6 of 8: config.py
"""

from dataclasses import dataclass, field
from typing import Tuple, List
import os

@dataclass
class DroneConfig:
    """Hyperparameters and environment configuration for 3D drone navigation DQN training."""

    # 3D Environment settings
    world_size: Tuple[float, float, float] = (100.0, 100.0, 100.0)
    num_obstacles: int = 15
    obstacle_radius_range: Tuple[float, float] = (4.0, 10.0)
    num_rays: int = 10
    max_ray_dist: float = 30.0
    step_size: float = 2.0
    goal_radius: float = 5.0
    max_steps_per_episode: int = 200

    # Reinforcement Learning Hyperparameters
    gamma: float = 0.99
    lr: float = 0.001
    epsilon_start: float = 1.0
    epsilon_end: float = 0.05
    epsilon_decay: float = 0.9995
    buffer_capacity: int = 50000
    batch_size: int = 64
    target_sync_freq: int = 500
    episodes: int = 10000
    min_replay_size: int = 1000

    # File & Directory Paths
    output_dir: str = "./outputs"
    checkpoint_dir: str = "./checkpoints"
    best_model_filename: str = "best_dqn_drone.pth"
    latest_model_filename: str = "latest_dqn_drone.pth"
    metrics_csv_filename: str = "training_metrics.csv"
    seed: int = 42

    def __post_init__(self):
        """Ensure directories exist after initialization."""
        os.makedirs(self.output_dir, exist_ok=True)
        os.makedirs(self.checkpoint_dir, exist_ok=True)

    @property
    def obs_dim(self) -> int:
        """Calculate state space dimension: num_rays + 3 rel_goal + 3 vel + 1 dist + 1 height_z."""
        return self.num_rays + 8

    @property
    def action_dim(self) -> int:
        """6 discrete translational actions: [+X, -X, +Y, -Y, +Z, -Z]."""
        return 6
