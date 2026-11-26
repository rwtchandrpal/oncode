// Base URL of the Express API. Shared by axiosClient and the wake-up health ping.
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
