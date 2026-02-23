// Centralized API configuration
// Uses VITE_API_URL from .env if available, otherwise defaults to local backend
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default API_BASE;
