import axios from 'axios';

// Базова адреса вашого Go-сервера
const API_BASE_URL = 'http://localhost:8080/api';

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// СПИСОК УСІХ АДРЕС
export const endpoints = {
    auth: {
        login: '/auth/sign-in',
        register: '/auth/sign-up',
    },
    components: {
        getAll: '/components',
    },
    builder: {
        validate: '/validate',
    },
    // --- ОСЬ ЦЬОГО БЛОКУ ВАМ НЕ ВИСТАЧАЛО ---
    orders: {
        create: '/orders'
    }
    // ----------------------------------------
};

// Автоматичне додавання токена до запитів
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);