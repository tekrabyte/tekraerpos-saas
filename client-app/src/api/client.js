import axios from 'axios';
import { useAuth } from '../store/auth';

// URL Backend WP Anda
const BASE_URL = "https://erpos.tekrabyte.id/wp-json/tekra-saas/v1";

const api = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' }
});

// INI PERBAIKANNYA: Uncomment baris Authorization
api.interceptors.request.use((config) => {
    const { token } = useAuth.getState();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`; // <-- Hapus tanda // di depan
    }
    return config;
});

export default api;