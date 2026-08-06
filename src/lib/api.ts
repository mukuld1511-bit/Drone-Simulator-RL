/**
 * Central API base URL resolver.
 * - In development: uses Vite proxy (empty string → relative /api/*)
 * - In production (Vercel): uses VITE_API_URL env var pointing to Azure backend
 */
export const API_BASE = import.meta.env.VITE_API_URL ?? '';

export const apiUrl = (path: string) => `${API_BASE}${path}`;
