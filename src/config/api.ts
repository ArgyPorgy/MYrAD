// API configuration
// In production (Vercel), use the backend URL from environment variable
// In development (local), use the Vite proxy which forwards to localhost:4000

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Helper function to build API URLs
export const getApiUrl = (path: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // If API_BASE_URL is set, use it; otherwise use relative path (for Vite proxy)
  return API_BASE_URL ? `${API_BASE_URL}/${cleanPath}` : `/${cleanPath}`;
};

