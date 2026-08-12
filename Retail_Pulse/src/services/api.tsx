import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach JWT token
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("accessToken");

    console.log("JWT TOKEN:", token);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error("401 Unauthorized");
      console.error("Response:", error.response?.data);

      localStorage.removeItem("token");
      localStorage.removeItem("access_token");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");

      window.location.href = "/";
    }

    return Promise.reject(error);
  }
);

export default api;