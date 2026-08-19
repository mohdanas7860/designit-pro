import axios from 'axios';

const getBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_API_URL) {
        return `${process.env.NEXT_PUBLIC_API_URL}${process.env.NEXT_PUBLIC_API_URL.endsWith('/api') ? '' : '/api'}`;
    }
    return 'https://designit-pro.onrender.com/api';
};

const api = axios.create({
    baseURL: getBaseUrl(),
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('designit_token');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

export default api;
