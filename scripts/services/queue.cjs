"use strict";

class LocalQueue {
  constructor({maxConcurrency = 2, handlers = {}, onTaskState = () => {}} = {}) {
    this.maxConcurrency = maxConcurrency;
    this.handlers = handlers;
    this.onTaskState = onTaskState;
    this.pending = [];
    this.active = 0;
  }

  enqueue(input) {
    return new Promise((resolve, reject) => {
      const task = {
        id: input.id ?? `task-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        projectId: input.projectId,
        type: input.type,
        payload: input.payload ?? {},
        state: "QUEUED",
        createdAt: new Date().toISOString(),
      };
      this.onTaskState(task);
      this.pending.push({task, resolve, reject});
      this.drain();
    });
  }

  drain() {
    while (this.active < this.maxConcurrency && this.pending.length) {
      const item = this.pending.shift();
      this.run(item);
    }
  }

  async run({task, resolve, reject}) {
    this.active += 1;
    task.state = "RUNNING";
    task.startedAt = new Date().toISOString();
    this.onTaskState(task);
    try {
      const handler = this.handlers[task.type];
      if (!handler) throw new Error(`Unsupported task type: ${task.type}`);
      const result = await handler(task);
      task.state = "SUCCEEDED";
      task.result = result;
      task.completedAt = new Date().toISOString();
      this.onTaskState(task);
      resolve(result);
    } catch (error) {
      task.state = "FAILED";
      task.error = error.message;
      task.errorStack = error.stack;
      task.completedAt = new Date().toISOString();
      this.onTaskState(task);
      reject(error);
    } finally {
      this.active -= 1;
      this.drain();
    }
  }
}

module.exports = {LocalQueue};
