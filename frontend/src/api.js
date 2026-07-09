import axios from "axios";


const ACCESS_TOKEN_KEY = "skilltracker_access_token";
const REFRESH_TOKEN_KEY = "skilltracker_refresh_token";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function saveTokens(tokens) {
  if (tokens.access) {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access);
  }

  if (tokens.refresh) {
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
  }
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearTokens();
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }

    return Promise.reject(error);
  },
);

export async function login(credentials) {
  const response = await api.post("/auth/token/", credentials);
  saveTokens(response.data);
  return response.data;
}

export async function register(userData) {
  const response = await api.post("/auth/register/", userData);
  return response.data;
}

export async function getMe() {
  const response = await api.get("/auth/me/");
  return response.data;
}

export async function getTasks() {
  const response = await api.get("/tasks/");
  return response.data;
}

export async function createTask(taskData) {
  const response = await api.post("/tasks/", taskData);
  return response.data;
}
