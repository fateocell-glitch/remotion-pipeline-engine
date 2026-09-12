"use strict";

function withTaskState(project, nextTask) {
  const tasks = project.tasks ?? [];
  const index = tasks.findIndex((task) => task.id === nextTask.id);
  const updated = {...nextTask, updatedAt: new Date().toISOString()};
  return {
    ...project,
    tasks: index === -1
      ? [...tasks, updated]
      : tasks.map((task, taskIndex) => taskIndex === index ? {...task, ...updated} : task),
  };
}

function recoverableTasks(tasks) {
  return tasks
    .filter((task) => task.state === "QUEUED" || task.state === "RUNNING")
    .map((task) => ({...task, state: "QUEUED", recoveredAt: new Date().toISOString()}));
}

module.exports = {recoverableTasks, withTaskState};
