"""
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
        """
        Initialize 3D drone cubic world, sensor directions, and spaces.

        Args:
            config (Optional[DroneConfig]): Environment configuration parameters.
        """
        super().__init__()
        self.config = config or DroneConfig()
        
        # Action space: 6 discrete movements (+X, -X, +Y, -Y, +Z, -Z)
        self.action_space = spaces.Discrete(self.config.action_dim)
        
        # Action direction vectors corresponding to the 6 discrete choices
        self.action_vectors = np.array([
            [1.0, 0.0, 0.0],   # +X (Forward)
            [-1.0, 0.0, 0.0],  # -X (Backward)
            [0.0, 1.0, 0.0],   # +Y (Right)
            [0.0, -1.0, 0.0],  # -Y (Left)
            [0.0, 0.0, 1.0],   # +Z (Ascend)
            [0.0, 0.0, -1.0],  # -Z (Descend)
        ], dtype=np.float32)

        # Pre-compute ray sensor direction vectors evenly distributed in 3D sphere
        self.ray_directions = self._generate_ray_directions(self.config.num_rays)

        # Observation space bounds
        high = np.ones(self.config.obs_dim, dtype=np.float32) * 500.0
        self.observation_space = spaces.Box(low=-high, high=high, dtype=np.float32)

        # Internal state initialization
        self.drone_pos = np.zeros(3, dtype=np.float32)
        self.drone_vel = np.zeros(3, dtype=np.float32)
        self.goal_pos = np.zeros(3, dtype=np.float32)
        self.obstacles: List[Tuple[np.ndarray, float]] = []
        self.current_step = 0
        self.prev_distance_to_goal = 0.0

    def _generate_ray_directions(self, num_rays: int) -> np.ndarray:
        """
        Generate uniformly distributed 3D unit ray vectors using Fibonacci sphere method.

        Args:
            num_rays (int): Number of sensors.

        Returns:
            np.ndarray: Matrix of shape (num_rays, 3) containing unit direction vectors.
        """
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
        """
        Reset the environment state for a new episode.

        Args:
            seed (Optional[int]): Random seed for resetting.
            options (Optional[Dict[str, Any]]): Additional setup options.

        Returns:
            Tuple[np.ndarray, Dict[str, Any]]: Initial observation array and metadata info.
        """
        super().reset(seed=seed)
        self.current_step = 0

        world = self.config.world_size
        
        # Spawn drone near lower-left quadrant
        self.drone_pos = np.array([
            self.np_random.uniform(10.0, 20.0),
            self.np_random.uniform(10.0, 20.0),
            self.np_random.uniform(10.0, 20.0)
        ], dtype=np.float32)
        
        self.drone_vel = np.zeros(3, dtype=np.float32)

        # Spawn goal near upper-right quadrant
        self.goal_pos = np.array([
            self.np_random.uniform(world[0] - 25.0, world[0] - 10.0),
            self.np_random.uniform(world[1] - 25.0, world[1] - 10.0),
            self.np_random.uniform(world[2] - 25.0, world[2] - 10.0)
        ], dtype=np.float32)

        # Generate non-overlapping sphere obstacles
        self.obstacles = []
        for _ in range(self.config.num_obstacles):
            radius = float(self.np_random.uniform(*self.config.obstacle_radius_range))
            center = np.array([
                self.np_random.uniform(radius + 5.0, world[0] - radius - 5.0),
                self.np_random.uniform(radius + 5.0, world[1] - radius - 5.0),
                self.np_random.uniform(radius + 5.0, world[2] - radius - 5.0)
            ], dtype=np.float32)

            # Avoid spawning obstacle right on top of drone or goal
            if (euclidean_distance(center, self.drone_pos) > radius + 15.0 and
                euclidean_distance(center, self.goal_pos) > radius + 15.0):
                self.obstacles.append((center, radius))

        self.prev_distance_to_goal = euclidean_distance(self.drone_pos, self.goal_pos)
        obs = self._get_observation()
        info = self._get_info()

        return obs, info

    def step(self, action: int) -> Tuple[np.ndarray, float, bool, bool, Dict[str, Any]]:
        """
        Execute one physics step in the 3D world.

        Args:
            action (int): Discrete action index [0..5].

        Returns:
            Tuple[np.ndarray, float, bool, bool, Dict[str, Any]]:
                (obs, reward, terminated, truncated, info)
        """
        self.current_step += 1

        # Apply action velocity vector with physical step size
        move_dir = self.action_vectors[action]
        self.drone_vel = move_dir * self.config.step_size
        self.drone_pos = self.drone_pos + self.drone_vel

        # Calculate current distance to goal
        current_distance = euclidean_distance(self.drone_pos, self.goal_pos)

        # Check termination flags
        collision = self._check_collision()
        out_of_bounds = self._check_out_of_bounds()
        goal_reached = current_distance <= self.config.goal_radius

        terminated = False
        truncated = False

        # Calculate Reward
        reward = -0.1  # Base step penalty encouraging efficiency

        # Distance progress delta reward (+1 if closer, -1 if farther)
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
        """
        Construct feature vector: ray distances + rel_goal_pos + velocity + dist + height.

        Returns:
            np.ndarray: Vector of length obs_dim.
        """
        # Ray-cast distance readings
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
        """Check if drone position intersects with any sphere obstacle."""
        for center, radius in self.obstacles:
            if euclidean_distance(self.drone_pos, center) <= radius + 0.5:
                return True
        return False

    def _check_out_of_bounds(self) -> bool:
        """Check if drone exited the 3D bounding box boundaries."""
        world = self.config.world_size
        return (
            self.drone_pos[0] < 0.0 or self.drone_pos[0] > world[0] or
            self.drone_pos[1] < 0.0 or self.drone_pos[1] > world[1] or
            self.drone_pos[2] < 0.0 or self.drone_pos[2] > world[2]
        )

    def _get_info(self) -> Dict[str, Any]:
        """Return diagnostic info dictionary."""
        return {
            "drone_pos": self.drone_pos.copy(),
            "goal_pos": self.goal_pos.copy(),
            "dist_to_goal": float(euclidean_distance(self.drone_pos, self.goal_pos)),
            "step": self.current_step
        }
