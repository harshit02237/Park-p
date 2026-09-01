import axios from "axios";

const baseURL = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") || "http://localhost:5004";

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("zaika_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const getCurrentUser = async () => {
  try {
    const res = await api.get("/auth/current_user");
    return res.data || null;
  } catch {
    return null;
  }
};

