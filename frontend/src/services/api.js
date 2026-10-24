import axios from "axios";

const api = axios.create({
    baseURL: "http://127.0.0.1:8000/api",
    headers: {
        "Content-Type": "application/json",
    },
});

// Separate Axios instance to avoid interceptor loops.
const refreshApi = axios.create({
    baseURL: "http://127.0.0.1:8000/api",
});

api.interceptors.request.use(
    (config) => {
        const publicEndpoints = [
            "/auth/login/",
            "/auth/register/",
            "/auth/refresh/",
        ];

        const isPublicEndpoint = publicEndpoints.some((endpoint) => {
            return config.url && config.url.endsWith(endpoint);
        });

        if (!isPublicEndpoint) {
            const token = localStorage.getItem("accessToken");

            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } else {
            delete config.headers.Authorization;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

let refreshPromise = null;

api.interceptors.response.use(
    (response) => response,
    async(error) => {
        const originalRequest = error.config;

        if (!error.response ||
            error.response.status !== 401 ||
            !originalRequest ||
            originalRequest._retry
        ) {
            return Promise.reject(error);
        }
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("user");
            window.location.href = "/login";
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
            if (!refreshPromise) {
                refreshPromise = refreshApi
                    .post("/auth/refresh/", {
                        refresh: refreshToken,
                    })
                    .then((response) => {
                        const newAccessToken = response.data.access;
                        localStorage.setItem("accessToken", newAccessToken);
                        return newAccessToken;
                    })
                    .finally(() => {
                        refreshPromise = null;
                    });
            }

            const newAccessToken = await refreshPromise;

            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

            return api(originalRequest);
        } catch (refreshError) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");

            window.location.href = "/login";

            return Promise.reject(refreshError);
        }
    }
);

export default api;