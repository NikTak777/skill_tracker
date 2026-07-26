import axios from "axios";

import { withDoneProgress, withDoneProgressList } from "./utils/taskProgress.js";


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

export async function getTasks(params = {}) {
  const response = await api.get("/tasks/", { params });
  return response.data;
}

export async function getTask(taskId) {
  const response = await api.get(`/tasks/${taskId}/`);
  return withDoneProgress(response.data);
}

export function getApiList(data) {
  if (Array.isArray(data)) {
    return data;
  }

  return data?.results || data?.tasks || data?.skills || data?.employees || data?.comments || data?.progress || [];
}

/** Нормализует ответ списка задач (массив или страница DRF). */
export function normalizeTaskPage(data) {
  if (Array.isArray(data)) {
    return {
      results: data,
      count: data.length,
      next: null,
      previous: null,
    };
  }

  const results = getApiList(data);
  return {
    results,
    count: typeof data?.count === "number" ? data.count : results.length,
    next: data?.next || null,
    previous: data?.previous || null,
  };
}

export function getLatestProgressPercent(progressData) {
  const entries = getApiList(progressData);
  if (entries.length === 0) {
    return 0;
  }

  return entries[0].percent || 0;
}

export async function attachProgressToTasks(tasks) {
  const tasksWithProgress = await Promise.all(
    tasks.map(async (task) => {
      try {
        const progressData = await getProgress(task.id);
        return {
          ...task,
          progress: getLatestProgressPercent(progressData),
        };
      } catch {
        return {
          ...task,
          progress: 0,
        };
      }
    }),
  );

  return withDoneProgressList(tasksWithProgress);
}

/** Активные задачи без пагинации + первая страница выполненных (по 10). */
export async function getDashboardTasks() {
  const [todoData, inProgressData, doneData] = await Promise.all([
    getTasks({ status: "todo" }),
    getTasks({ status: "in_progress" }),
    getTasks({ status: "done", page: 1 }),
  ]);

  const activeTasks = [
    ...getApiList(inProgressData),
    ...getApiList(todoData),
  ];
  const donePage = normalizeTaskPage(doneData);

  return {
    activeTasks: await attachProgressToTasks(activeTasks),
    doneTasks: await attachProgressToTasks(donePage.results),
    doneCount: donePage.count,
    doneHasMore: Boolean(donePage.next),
    doneNextPage: donePage.next ? 2 : null,
  };
}

export async function getDoneTasksPage(page = 1) {
  const donePage = normalizeTaskPage(await getTasks({ status: "done", page }));
  return {
    tasks: await attachProgressToTasks(donePage.results),
    count: donePage.count,
    hasMore: Boolean(donePage.next),
    nextPage: donePage.next ? page + 1 : null,
  };
}

/**
 * filter: "all" | "todo" | "in_progress" | "done"
 * Использует бэкенд ?status=... ; для done — пагинация по 10.
 */
export async function getTasksByStatusFilter(filter = "all") {
  if (filter === "all") {
    return getDashboardTasks();
  }

  if (filter === "done") {
    const page = await getDoneTasksPage(1);
    return {
      activeTasks: [],
      doneTasks: page.tasks,
      doneCount: page.count,
      doneHasMore: page.hasMore,
      doneNextPage: page.nextPage,
    };
  }

  const list = await attachProgressToTasks(getApiList(await getTasks({ status: filter })));
  return {
    activeTasks: list,
    doneTasks: [],
    doneCount: 0,
    doneHasMore: false,
    doneNextPage: null,
  };
}

export async function getTasksWithProgress() {
  const { activeTasks, doneTasks } = await getDashboardTasks();
  return [...activeTasks, ...doneTasks];
}

export async function getSkills() {
  const response = await api.get("/skills/");
  return response.data;
}

export async function createSkill(skillData) {
  const response = await api.post("/skills/", skillData);
  return response.data;
}

export async function getEmployees() {
  const response = await api.get("/employees/");
  return response.data;
}

export async function createEmployee(employeeData) {
  const response = await api.post("/employees/", employeeData);
  return response.data;
}

export async function createTask(taskData) {
  const response = await api.post("/tasks/", taskData);
  return response.data;
}

export async function updateTask(taskId, taskData) {
  const response = await api.patch(`/tasks/${taskId}/`, taskData);
  return withDoneProgress(response.data, taskData.status);
}

export async function getProgress(taskId) {
  const response = await api.get("/progress/", { params: { task: taskId } });
  return response.data;
}

export async function createProgress(progressData) {
  const response = await api.post("/progress/", progressData);
  return response.data;
}

export async function getComments(taskId) {
  const response = await api.get("/comments/", { params: { task: taskId } });
  return response.data;
}

export async function createComment(commentData) {
  const response = await api.post("/comments/", commentData);
  return response.data;
}
