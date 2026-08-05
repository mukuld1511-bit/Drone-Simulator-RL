"""
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
        """
        Initialize layers.

        Args:
            input_dim (int): Observation vector length.
            output_dim (int): Number of discrete Q-values.
        """
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, 128),
            nn.ReLU(),
            nn.Linear(128, 64),
            nn.ReLU(),
            nn.Linear(64, output_dim)
        )

    def forward(self, state: torch.Tensor) -> torch.Tensor:
        """Forward pass to compute Q-values for all actions."""
        return self.net(state)


class ReplayBuffer:
    """Experience Replay Buffer backed by a deque."""

    def __init__(self, capacity: int):
        """
        Initialize memory buffer.

        Args:
            capacity (int): Maximum experience transitions to hold.
        """
        self.buffer = deque(maxlen=capacity)

    def push(
        self,
        state: np.ndarray,
        action: int,
        reward: float,
        next_state: np.ndarray,
        done: bool
    ) -> None:
        """Store a transition tuple."""
        self.buffer.append((state, action, reward, next_state, done))

    def sample(self, batch_size: int) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor, torch.Tensor, torch.Tensor]:
        """
        Randomly sample a mini-batch of transitions.

        Args:
            batch_size (int): Number of items to sample.

        Returns:
            Tuple[Tensor, Tensor, Tensor, Tensor, Tensor]: Batch tensors (s, a, r, s', done).
        """
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
        """
        Initialize policy and target neural networks, optimizer, and replay buffer.

        Args:
            config (Optional[DroneConfig]): Configuration parameters.
        """
        self.config = config or DroneConfig()
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        # Create primary policy network and target network
        self.policy_net = QNetwork(self.config.obs_dim, self.config.action_dim).to(self.device)
        self.target_net = QNetwork(self.config.obs_dim, self.config.action_dim).to(self.device)
        self.target_net.load_state_dict(self.policy_net.state_dict())
        self.target_net.eval()

        # Optimizer & Replay Buffer
        self.optimizer = optim.Adam(self.policy_net.parameters(), lr=self.config.lr)
        self.memory = ReplayBuffer(self.config.buffer_capacity)

        self.epsilon = self.config.epsilon_start
        self.steps_done = 0

    def select_action(self, state: np.ndarray, evaluate: bool = False) -> int:
        """
        Epsilon-greedy action selection.

        Args:
            state (np.ndarray): Current observation array.
            evaluate (bool): If True, forces greedy action selection.

        Returns:
            int: Discrete action index [0..5].
        """
        if not evaluate and random.random() < self.epsilon:
            return random.randint(0, self.config.action_dim - 1)

        state_t = torch.tensor(state, dtype=torch.float32, device=self.device).unsqueeze(0)
        with torch.no_grad():
            q_values = self.policy_net(state_t)
            return int(q_values.argmax(dim=1).item())

    def decay_epsilon(self) -> float:
        """Decay exploration rate down to epsilon_end."""
        self.epsilon = max(self.config.epsilon_end, self.epsilon * self.config.epsilon_decay)
        return self.epsilon

    def learn(self) -> Optional[float]:
        """
        Perform one gradient descent step over a sampled mini-batch.

        Returns:
            Optional[float]: Calculated TD-error loss value.
        """
        if len(self.memory) < self.config.min_replay_size:
            return None

        states, actions, rewards, next_states, dones = self.memory.sample(self.config.batch_size)
        
        states = states.to(self.device)
        actions = actions.to(self.device)
        rewards = rewards.to(self.device)
        next_states = next_states.to(self.device)
        dones = dones.to(self.device)

        # Q(s, a)
        q_values = self.policy_net(states)
        state_action_values = q_values.gather(1, actions.unsqueeze(1)).squeeze(1)

        # Max Q_target(s', a')
        with torch.no_grad():
            next_q_values = self.target_net(next_states).max(1)[0]
            expected_state_action_values = rewards + (self.config.gamma * next_q_values * (1 - dones))

        # MSE Loss
        loss_fn = nn.MSELoss()
        loss = loss_fn(state_action_values, expected_state_action_values)

        # Gradient descent
        self.optimizer.zero_grad()
        loss.backward()
        nn.utils.clip_grad_norm_(self.policy_net.parameters(), max_norm=1.0)
        self.optimizer.step()

        self.steps_done += 1
        return float(loss.item())

    def update_target_network(self) -> None:
        """Synchronize weights from policy_net into target_net."""
        self.target_net.load_state_dict(self.policy_net.state_dict())

    def save_checkpoint(self, filepath: str) -> None:
        """
        Save PyTorch model weights to disk.

        Args:
            filepath (str): Target file location (.pth).
        """
        torch.save({
            'policy_net_state_dict': self.policy_net.state_dict(),
            'target_net_state_dict': self.target_net.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'epsilon': self.epsilon,
            'steps_done': self.steps_done
        }, filepath)

    def load_checkpoint(self, filepath: str) -> None:
        """
        Load PyTorch model weights from disk.

        Args:
            filepath (str): Source file location (.pth).
        """
        checkpoint = torch.load(filepath, map_location=self.device)
        self.policy_net.load_state_dict(checkpoint['policy_net_state_dict'])
        self.target_net.load_state_dict(checkpoint['target_net_state_dict'])
        self.optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
        self.epsilon = checkpoint.get('epsilon', self.config.epsilon_end)
        self.steps_done = checkpoint.get('steps_done', 0)
