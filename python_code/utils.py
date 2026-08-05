"""
Autonomous Drone Navigation with Deep RL - Utilities
File 5 of 8: utils.py
"""

import random
import numpy as np
import torch
from typing import Tuple, List, Optional

def set_seed(seed: int = 42) -> None:
    """
    Set seeds across random, numpy, and torch for strict reproducibility.

    Args:
        seed (int): The seed value to apply globally.
    """
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)

def moving_average(values: List[float], window_size: int = 50) -> np.ndarray:
    """
    Compute moving average with symmetric edge reflection padding.

    Args:
        values (List[float]): Raw performance numbers.
        window_size (int): Moving window size.

    Returns:
        np.ndarray: Smoothed trend values.
    """
    if len(values) == 0:
        return np.array([])
    if len(values) < window_size:
        return np.array(values)
    
    cumsum = np.cumsum(np.insert(values, 0, 0))
    smoothed = (cumsum[window_size:] - cumsum[:-window_size]) / float(window_size)
    
    # Pad back to original length
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
    """
    Compute 3D distance along a ray to a sphere obstacle, guarding against division by zero.

    Args:
        ray_origin (np.ndarray): 3D origin coordinates of the ray.
        ray_dir (np.ndarray): Normalized 3D directional vector of ray.
        sphere_center (np.ndarray): 3D center of sphere obstacle.
        sphere_radius (float): Radius of the sphere.
        max_dist (float): Sensor maximum range fallback.

    Returns:
        float: Distance to sphere surface, or max_dist if no intersection occurs within range.
    """
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
    """
    Compute 3D Euclidean distance between two points.

    Args:
        p1 (np.ndarray): Point 1 [x, y, z].
        p2 (np.ndarray): Point 2 [x, y, z].

    Returns:
        float: Euclidean distance.
    """
    return float(np.linalg.norm(p1 - p2))
