export function getTaskProgress(task) {
  if (task?.status === "done") {
    return 100;
  }

  if (typeof task?.progress === "number") {
    return task.progress;
  }

  if (Array.isArray(task?.progress_entries) && task.progress_entries.length > 0) {
    return task.progress_entries[0].percent;
  }

  return 0;
}

export function withDoneProgress(task, forcedStatus) {
  if (!task) {
    return task;
  }

  const status = forcedStatus || task.status;

  if (status === "done") {
    return { ...task, status: "done", progress: 100 };
  }

  return task;
}

export function withDoneProgressList(tasks) {
  return tasks.map(withDoneProgress);
}
