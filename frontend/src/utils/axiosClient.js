import axios from 'axios'

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
    headers :{
        'Content-Type': 'application/json'
    }
});

// Interceptor to attach token to every request
axiosClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response interceptor to handle session expiration / 401s
axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            const token = localStorage.getItem('token');
            if (token) {
                localStorage.removeItem('token');
            }
        }
        return Promise.reject(error);
    }
);

export default axiosClient ;