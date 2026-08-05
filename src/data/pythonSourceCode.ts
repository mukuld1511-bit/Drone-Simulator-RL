export interface PythonFile {
  id: string;
  filename: string;
  title: string;
  description: string;
  language: string;
  code: string;
}

export const PYTHON_FILES: PythonFile[] = [
  {
    id: 'drone_env',
    filename: 'drone_env.py',
    title: 'File 1: Drone Environment (Gymnasium)',
    description: '3D cubic environment with 8-12 ray-cast distance sensors, physical step translation, sphere collision detection, and Gymnasium Env API.',
    language: 'python',
    code: `"""
Autonomous Drone Navigation with Deep RL - Drone Environment
File 1 of 8: drone_env.py
"""

import gymnasium as gym
from gymnasium import spaces
import numpy as np
from typing import Tuple, Dict, Any, Optional, List
from config import DroneConfig
from utils import ray_sphere_intersection, euclidean_distance

class DroneEnvironment(gym.Env):
    """
    3D Continuous Drone Environment with Ray-Cast Obstacle Detection.
    Fully compatible with Gymnasium API.
    """
    metadata = {"render_modes": ["human", "rgb_array"], "render_fps": 30}

    def __init__(self, config: Optional[DroneConfig] = None):
        super().__init__()
        self.config = config or DroneConfig()
        
        # Action space: 6 discrete movements (+X, -X, +Y, -Y, +Z, -Z)
        self.action_space = spaces.Discrete(self.config.action_dim)
        
        self.action_vectors = np.array([
            [1.0, 0.0, 0.0],   # +X (Forward)
            [-1.0, 0.0, 0.0],  # -X (Backward)
            [0.0, 1.0, 0.0],   # +Y (Right)
            [0.0, -1.0, 0.0],  # -Y (Left)
            [0.0, 0.0, 1.0],   # +Z (Ascend)
            [0.0, 0.0, -1.0],  # -Z (Descend)
        ], dtype=np.float32)

        self.ray_directions = self._generate_ray_directions(self.config.num_rays)

        high = np.ones(self.config.obs_dim, dtype=np.float32) * 500.0
        self.observation_space = spaces.Box(low=-high, high=high, dtype=np.float32)

        self.drone_pos = np.zeros(3, dtype=np.float32)
        self.drone_vel = np.zeros(3, dtype=np.float32)
        self.goal_pos = np.zeros(3, dtype=np.float32)
        self.obstacles: List[Tuple[np.ndarray, float]] = []
        self.current_step = 0
        self.prev_distance_to_goal = 0.0

    def _generate_ray_directions(self, num_rays: int) -> np.ndarray:
        directions = []
        phi = np.pi * (3.0 - np.sqrt(5.0))  # Golden angle
        for i in range(num_rays):
            y = 1 - (i / float(num_rays - 1)) * 2 if num_rays > 1 else 0
            radius = np.sqrt(max(0.0, 1 - y * y))
            theta = phi * i
            x = np.cos(theta) * radius
            z = np.sin(theta) * radius
            directions.append([x, y, z])
        return np.array(directions, dtype=np.float32)

    def reset(
        self,
        *,
        seed: Optional[int] = None,
        options: Optional[Dict[str, Any]] = None
    ) -> Tuple[np.ndarray, Dict[str, Any]]:
        super().reset(seed=seed)
        self.current_step = 0

        world = self.config.world_size
        
        self.drone_pos = np.array([
            self.np_random.uniform(10.0, 20.0),
            self.np_random.uniform(10.0, 20.0),
            self.np_random.uniform(10.0, 20.0)
        ], dtype=np.float32)
        
        self.drone_vel = np.zeros(3, dtype=np.float32)

        self.goal_pos = np.array([
            self.np_random.uniform(world[0] - 25.0, world[0] - 10.0),
            self.np_random.uniform(world[1] - 25.0, world[1] - 10.0),
            self.np_random.uniform(world[2] - 25.0, world[2] - 10.0)
        ], dtype=np.float32)

        self.obstacles = []
        for _ in range(self.config.num_obstacles):
            radius = float(self.np_random.uniform(*self.config.obstacle_radius_range))
            center = np.array([
                self.np_random.uniform(radius + 5.0, world[0] - radius - 5.0),
                self.np_random.uniform(radius + 5.0, world[1] - radius - 5.0),
                self.np_random.uniform(radius + 5.0, world[2] - radius - 5.0)
            ], dtype=np.float32)

            if (euclidean_distance(center, self.drone_pos) > radius + 15.0 and
                euclidean_distance(center, self.goal_pos) > radius + 15.0):
                self.obstacles.append((center, radius))

        self.prev_distance_to_goal = euclidean_distance(self.drone_pos, self.goal_pos)
        obs = self._get_observation()
        info = self._get_info()

        return obs, info

    def step(self, action: int) -> Tuple[np.ndarray, float, bool, bool, Dict[str, Any]]:
        self.current_step += 1

        move_dir = self.action_vectors[action]
        self.drone_vel = move_dir * self.config.step_size
        self.drone_pos = self.drone_pos + self.drone_vel

        current_distance = euclidean_distance(self.drone_pos, self.goal_pos)

        collision = self._check_collision()
        out_of_bounds = self._check_out_of_bounds()
        goal_reached = current_distance <= self.config.goal_radius

        terminated = False
        truncated = False

        reward = -0.1

        if current_distance < self.prev_distance_to_goal:
            reward += 1.0
        else:
            reward -= 1.0

        if goal_reached:
            reward += 100.0
            terminated = True
        elif collision or out_of_bounds:
            reward -= 100.0
            terminated = True
        elif self.current_step >= self.config.max_steps_per_episode:
            truncated = True

        self.prev_distance_to_goal = current_distance
        obs = self._get_observation()
        info = self._get_info()
        info["collision"] = collision or out_of_bounds
        info["goal_reached"] = goal_reached

        return obs, float(reward), terminated, truncated, info

    def _get_observation(self) -> np.ndarray:
        ray_distances = []
        for direction in self.ray_directions:
            min_d = self.config.max_ray_dist
            for obs_center, obs_radius in self.obstacles:
                d = ray_sphere_intersection(
                    self.drone_pos, direction, obs_center, obs_radius, self.config.max_ray_dist
                )
                if d < min_d:
                    min_d = d
            ray_distances.append(min_d)

        rel_goal = self.goal_pos - self.drone_pos
        dist_to_goal = euclidean_distance(self.drone_pos, self.goal_pos)
        drone_height = float(self.drone_pos[2])

        obs = np.concatenate([
            np.array(ray_distances, dtype=np.float32),
            rel_goal.astype(np.float32),
            self.drone_vel.astype(np.float32),
            np.array([dist_to_goal, drone_height], dtype=np.float32)
        ])
        return obs

    def _check_collision(self) -> bool:
        for center, radius in self.obstacles:
            if euclidean_distance(self.drone_pos, center) <= radius + 0.5:
                return True
        return False

    def _check_out_of_bounds(self) -> bool:
        world = self.config.world_size
        return (
            self.drone_pos[0] < 0.0 or self.drone_pos[0] > world[0] or
            self.drone_pos[1] < 0.0 or self.drone_pos[1] > world[1] or
            self.drone_pos[2] < 0.0 or self.drone_pos[2] > world[2]
        )

    def _get_info(self) -> Dict[str, Any]:
        return {
            "drone_pos": self.drone_pos.copy(),
            "goal_pos": self.goal_pos.copy(),
            "dist_to_goal": float(euclidean_distance(self.drone_pos, self.goal_pos)),
            "step": self.current_step
        }
`
  },
  {
    id: 'dqn_agent',
    filename: 'dqn_agent.py',
    title: 'File 2: Deep Q-Network Agent (PyTorch)',
    description: 'PyTorch QNetwork (Dense 128 -> Dense 64 -> 6 Actions), Target network synchronization, Epsilon-greedy schedule, and Experience Replay Buffer.',
    language: 'python',
    code: `"""
Autonomous Drone Navigation with Deep RL - Deep Q-Network Agent
File 2 of 8: dqn_agent.py
"""

import random
from collections import deque
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from typing import Tuple, List, Optional
from config import DroneConfig

class QNetwork(nn.Module):
    """
    Multilayer Perceptron Q-Network for 3D Navigation.
    Architecture: input_dim -> Dense(128, ReLU) -> Dense(64, ReLU) -> output_dim (6 actions).
    """

    def __init__(self, input_dim: int, output_dim: int):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, 128),
            nn.ReLU(),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Linear(64, output_dim)
        )

    def forward(self, state: torch.Tensor) -> torch.Tensor:
        return self.net(state)


class ReplayBuffer:
    """Experience Replay Buffer backed by a deque."""

    def __init__(self, capacity: int):
        self.buffer = deque(maxlen=capacity)

    def push(
        self,
        state: np.ndarray,
        action: int,
        reward: float,
        next_state: np.ndarray,
        done: bool
    ) -> None:
        self.buffer.append((state, action, reward, next_state, done))

    def sample(self, batch_size: int) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor, torch.Tensor, torch.Tensor]:
        state, action, reward, next_state, done = zip(*random.sample(self.buffer, batch_size))
        return (
            torch.tensor(np.array(state), dtype=torch.float32),
            torch.tensor(action, dtype=torch.long),
            torch.tensor(reward, dtype=torch.float32),
            torch.tensor(np.array(next_state), dtype=torch.float32),
            torch.tensor(done, dtype=torch.float32)
        )

    def __len__(self) -> int:
        return len(self.buffer)


class DQNAgent:
    """Deep Q-Network Agent handling action selection, replay, and optimization."""

    def __init__(self, config: Optional[DroneConfig] = None):
        self.config = config or DroneConfig()
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        self.policy_net = QNetwork(self.config.obs_dim, self.config.action_dim).to(self.device)
        self.target_net = QNetwork(self.config.obs_dim, self.config.action_dim).to(self.device)
        self.target_net.load_state_dict(self.policy_net.state_dict())
        self.target_net.eval()

        self.optimizer = optim.Adam(self.policy_net.parameters(), lr=self.config.lr)
        self.memory = ReplayBuffer(self.config.buffer_capacity)

        self.epsilon = self.config.epsilon_start
        self.steps_done = 0

    def select_action(self, state: np.ndarray, evaluate: bool = False) -> int:
        if not evaluate and random.random() < self.epsilon:
            return random.randint(0, self.config.action_dim - 1)

        state_t = torch.tensor(state, dtype=torch.float32, device=self.device).unsqueeze(0)
        with torch.no_grad():
            q_values = self.policy_net(state_t)
            return int(q_values.argmax(dim=1).item())

    def decay_epsilon(self) -> float:
        self.epsilon = max(self.config.epsilon_end, self.epsilon * self.config.epsilon_decay)
        return self.epsilon

    def learn(self) -> Optional[float]:
        if len(self.memory) < self.config.min_replay_size:
            return None

        states, actions, rewards, next_states, dones = self.memory.sample(self.config.batch_size)
        
        states = states.to(self.device)
        actions = actions.to(self.device)
        rewards = rewards.to(self.device)
        next_states = next_states.to(self.device)
        dones = dones.to(self.device)

        q_values = self.policy_net(states)
        state_action_values = q_values.gather(1, actions.unsqueeze(1)).squeeze(1)

        with torch.no_grad():
            next_q_values = self.target_net(next_states).max(1)[0]
            expected_state_action_values = rewards + (self.config.gamma * next_q_values * (1 - dones))

        loss_fn = nn.MSELoss()
        loss = loss_fn(state_action_values, expected_state_action_values)

        self.optimizer.zero_grad()
        loss.backward()
        nn.utils.clip_grad_norm_(self.policy_net.parameters(), max_norm=1.0)
        self.optimizer.step()

        self.steps_done += 1
        return float(loss.item())

    def update_target_network(self) -> None:
        self.target_net.load_state_dict(self.policy_net.state_dict())

    def save_checkpoint(self, filepath: str) -> None:
        torch.save({
            'policy_net_state_dict': self.policy_net.state_dict(),
            'target_net_state_dict': self.target_net.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'epsilon': self.epsilon,
            'steps_done': self.steps_done
        }, filepath)

    def load_checkpoint(self, filepath: str) -> None:
        checkpoint = torch.load(filepath, map_location=self.device)
        self.policy_net.load_state_dict(checkpoint['policy_net_state_dict'])
        self.target_net.load_state_dict(checkpoint['target_net_state_dict'])
        self.optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
        self.epsilon = checkpoint.get('epsilon', self.config.epsilon_end)
        self.steps_done = checkpoint.get('steps_done', 0)
`
  },
  {
    id: 'trainer',
    filename: 'trainer.py',
    title: 'File 3: Training Orchestrator',
    description: '10,000 episode training loop, metric logger (CSV), target sync monitor, and best/latest PyTorch model checkpointing.',
    language: 'python',
    code: `"""
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
        with open(self.csv_path, mode='w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(["episode", "reward", "steps", "success", "collision", "loss", "epsilon"])

    def train(self, num_episodes: Optional[int] = None) -> Dict[str, List[float]]:
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

                if self.agent.steps_done % self.config.target_sync_freq == 0:
                    self.agent.update_target_network()

            epsilon = self.agent.decay_epsilon()
            mean_loss = float(np.mean(episode_losses)) if episode_losses else 0.0
            success = 1.0 if info.get("goal_reached", False) else 0.0
            collision = 1.0 if info.get("collision", False) else 0.0

            self.history["episode"].append(episode)
            self.history["reward"].append(episode_reward)
            self.history["steps"].append(episode_steps)
            self.history["success"].append(success)
            self.history["collision"].append(collision)
            self.history["loss"].append(mean_loss)
            self.history["epsilon"].append(epsilon)

            with open(self.csv_path, mode='a', newline='') as f:
                writer = csv.writer(f)
                writer.writerow([episode, episode_reward, episode_steps, success, collision, mean_loss, epsilon])

            latest_path = os.path.join(self.config.checkpoint_dir, self.config.latest_model_filename)
            self.agent.save_checkpoint(latest_path)

            if episode_reward > self.best_reward:
                self.best_reward = episode_reward
                best_path = os.path.join(self.config.checkpoint_dir, self.config.best_model_filename)
                self.agent.save_checkpoint(best_path)

            recent_success = np.mean(self.history["success"][-50:]) if len(self.history["success"]) >= 50 else np.mean(self.history["success"])
            pbar.set_postfix({
                "Reward": f"{episode_reward:.1f}",
                "Success 50": f"{recent_success * 100:.1f}%",
                "Eps": f"{epsilon:.3f}"
            })

        print(f"\\n[Trainer] Training Completed! Models saved to '{self.config.checkpoint_dir}'. CSV saved to '{self.csv_path}'.")
        return self.history
`
  },
  {
    id: 'visualizer',
    filename: 'visualizer.py',
    title: 'File 4: 3D Matplotlib Visualizer',
    description: 'Generates 3D continuous flight trajectory plots with obstacle spheres and 4-panel training convergence charts.',
    language: 'python',
    code: `"""
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
        self.config = config or DroneConfig()

    def plot_training_curves(
        self,
        history: Dict[str, List[float]],
        save_filename: str = "training_curves.png"
    ) -> None:
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
        fig = plt.figure(figsize=(10, 8))
        ax = fig.add_subplot(111, projection='3d')
        ax.set_title("3D Autonomous Drone Flight Trajectory", fontsize=14, fontweight='bold')

        w = self.config.world_size
        ax.set_xlim(0, w[0])
        ax.set_ylim(0, w[1])
        ax.set_zlim(0, w[2])
        ax.set_xlabel("X (m)")
        ax.set_ylabel("Y (m)")
        ax.set_zlabel("Z (m)")

        u = np.linspace(0, 2 * np.pi, 20)
        v = np.linspace(0, np.pi, 20)
        for center, radius in obstacles:
            x = center[0] + radius * np.outer(np.cos(u), np.sin(v))
            y = center[1] + radius * np.outer(np.sin(u), np.sin(v))
            z = center[2] + radius * np.outer(np.ones(np.size(u)), np.cos(v))
            ax.plot_surface(x, y, z, color='crimson', alpha=0.35, edgecolor='darkred', linewidth=0.2)

        ax.scatter([start_pos[0]], [start_pos[1]], [start_pos[2]], color='lime', s=120, label='Start Pos', marker='o')
        ax.scatter([goal_pos[0]], [goal_pos[1]], [goal_pos[2]], color='gold', s=180, label='Goal Zone', marker='*')

        traj_arr = np.array(trajectory)
        if len(traj_arr) > 0:
            ax.plot(traj_arr[:, 0], traj_arr[:, 1], traj_arr[:, 2], color='cyan', linewidth=2.5, label='DQN Path')

        ax.legend(loc='upper right')
        save_path = os.path.join(self.config.output_dir, save_filename)
        plt.savefig(save_path, dpi=300)
        plt.close()
        print(f"[Visualizer] Saved 3D trajectory plot to '{save_path}'")
`
  },
  {
    id: 'utils',
    filename: 'utils.py',
    title: 'File 5: Helper Functions & Geometry',
    description: 'Seed setting for random/numpy/torch, moving average computation, and 3D ray-sphere intersection with division-by-zero guards.',
    language: 'python',
    code: `"""
Autonomous Drone Navigation with Deep RL - Utilities
File 5 of 8: utils.py
"""

import random
import numpy as np
import torch
from typing import Tuple, List, Optional

def set_seed(seed: int = 42) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)

def moving_average(values: List[float], window_size: int = 50) -> np.ndarray:
    if len(values) == 0:
        return np.array([])
    if len(values) < window_size:
        return np.array(values)
    
    cumsum = np.cumsum(np.insert(values, 0, 0))
    smoothed = (cumsum[window_size:] - cumsum[:-window_size]) / float(window_size)
    
    pad_left = (len(values) - len(smoothed)) // 2
    pad_right = len(values) - len(smoothed) - pad_left
    return np.pad(smoothed, (pad_left, pad_right), mode='edge')

def ray_sphere_intersection(
    ray_origin: np.ndarray,
    ray_dir: np.ndarray,
    sphere_center: np.ndarray,
    sphere_radius: float,
    max_dist: float
) -> float:
    eps = 1e-9
    dir_norm = np.linalg.norm(ray_dir)
    if dir_norm < eps:
        return max_dist
    
    d = ray_dir / (dir_norm + eps)
    oc = ray_origin - sphere_center
    
    a = float(np.dot(d, d))
    b = float(2.0 * np.dot(oc, d))
    c = float(np.dot(oc, oc) - sphere_radius ** 2)
    
    discriminant = b ** 2 - 4 * a * c
    if discriminant < 0:
        return max_dist
    
    sqrt_disc = np.sqrt(discriminant)
    t1 = (-b - sqrt_disc) / (2.0 * a + eps)
    t2 = (-b + sqrt_disc) / (2.0 * a + eps)
    
    distances = [t for t in (t1, t2) if 0 <= t <= max_dist]
    if not distances:
        return max_dist
    
    return min(distances)

def euclidean_distance(p1: np.ndarray, p2: np.ndarray) -> float:
    return float(np.linalg.norm(p1 - p2))
`
  },
  {
    id: 'config',
    filename: 'config.py',
    title: 'File 6: Hyperparameters & Config',
    description: 'Python dataclass defining world size, obstacle density, learning rates (lr=0.001, gamma=0.99), replay capacity, and paths.',
    language: 'python',
    code: `"""
Autonomous Drone Navigation with Deep RL - Configuration File
File 6 of 8: config.py
"""

from dataclasses import dataclass, field
from typing import Tuple, List
import os

@dataclass
class DroneConfig:
    """Hyperparameters and environment configuration for 3D drone navigation DQN training."""

    world_size: Tuple[float, float, float] = (100.0, 100.0, 100.0)
    num_obstacles: int = 15
    obstacle_radius_range: Tuple[float, float] = (4.0, 10.0)
    num_rays: int = 10
    max_ray_dist: float = 30.0
    step_size: float = 2.0
    goal_radius: float = 5.0
    max_steps_per_episode: int = 200

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

    output_dir: str = "./outputs"
    checkpoint_dir: str = "./checkpoints"
    best_model_filename: str = "best_dqn_drone.pth"
    latest_model_filename: str = "latest_dqn_drone.pth"
    metrics_csv_filename: str = "training_metrics.csv"
    seed: int = 42

    def __post_init__(self):
        os.makedirs(self.output_dir, exist_ok=True)
        os.makedirs(self.checkpoint_dir, exist_ok=True)

    @property
    def obs_dim(self) -> int:
        return self.num_rays + 8

    @property
    def action_dim(self) -> int:
        return 6
`
  },
  {
    id: 'main',
    filename: 'main.py',
    title: 'File 7: CLI Entry Point',
    description: 'Argparse interface for episode count, seed, evaluation mode, checkpoint resumption, and wiring components together.',
    language: 'python',
    code: `"""
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
    parser = argparse.ArgumentParser(
        description="Autonomous 3D Drone Navigation with Deep Q-Networks (DQN)"
    )
    parser.add_argument("--episodes", type=int, default=10000, help="Number of episodes to train")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility")
    parser.add_argument("--resume-from-checkpoint", type=str, default="", help="Path to .pth checkpoint file to resume")
    parser.add_argument("--eval", action="store_true", help="Run in evaluation mode without training updates")
    parser.add_argument("--num-eval-episodes", type=int, default=10, help="Number of evaluation episodes to run")
    
    args = parser.parse_args()

    set_seed(args.seed)
    config = DroneConfig(episodes=args.episodes, seed=args.seed)

    print("=========================================================")
    print("   AUTONOMOUS DRONE NAVIGATION WITH DEEP RL (DQN)        ")
    print(f"   World Size: {config.world_size} | Obstacles: {config.num_obstacles}")
    print(f"   Ray Sensors: {config.num_rays} | Total Target Episodes: {config.episodes}")
    print("=========================================================\\n")

    env = DroneEnvironment(config)
    agent = DQNAgent(config)

    if args.resume_from_checkpoint:
        if os.path.exists(args.resume_from_checkpoint):
            print(f"[Main] Resuming weights from '{args.resume_from_checkpoint}'...")
            agent.load_checkpoint(args.resume_from_checkpoint)
        else:
            print(f"[Main] Warning: Checkpoint file '{args.resume_from_checkpoint}' not found!")

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

            if ep == 1:
                visualizer.plot_3d_trajectory(
                    trajectory=trajectory,
                    obstacles=env.obstacles,
                    start_pos=trajectory[0],
                    goal_pos=env.goal_pos,
                    save_filename="eval_trajectory_ep1.png"
                )

        eval_success_rate = (success_count / args.num_eval_episodes) * 100.0
        print(f"\\n[Evaluation Complete] Final Goal Success Rate: {eval_success_rate:.1f}%\\n")

    else:
        trainer = DroneTrainer(env=env, agent=agent, config=config)
        history = trainer.train(num_episodes=args.episodes)

        visualizer.plot_training_curves(history, save_filename="training_curves.png")

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
`
  },
  {
    id: 'requirements',
    filename: 'requirements.txt',
    title: 'File 8: Dependencies File',
    description: 'Required Python package dependencies with version bounds.',
    language: 'plaintext',
    code: `torch>=2.0.0
gymnasium>=0.28.1
numpy>=1.24.0
matplotlib>=3.7.0
tqdm>=4.65.0
pandas>=2.0.0
`
  }
];
