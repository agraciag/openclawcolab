/**
 * Task Queue - Manages pending tasks for agents
 */

export class TaskQueue {
  constructor() {
    this.tasks = [];
  }

  add(task) {
    this.tasks.push({
      id: Date.now().toString(),
      agent: task.agent,
      task: task.task,
      timestamp: task.timestamp || new Date(),
      status: 'pending'
    });
  }

  getNext() {
    const task = this.tasks.find(t => t.status === 'pending');
    if (task) {
      task.status = 'processing';
      return task;
    }
    return null;
  }

  complete(taskId) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = 'completed';
    }
  }

  fail(taskId, error) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = 'failed';
      task.error = error;
    }
  }

  getAll() {
    return this.tasks.filter(t => t.status === 'pending' || t.status === 'processing');
  }

  size() {
    return this.tasks.filter(t => t.status === 'pending').length;
  }

  clear() {
    this.tasks = this.tasks.filter(t => t.status !== 'pending');
  }
}
