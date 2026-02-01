/**
 * Simple Logger
 */

export class Logger {
  constructor(context) {
    this.context = context;
  }

  format(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}] [${this.context}]`;
    return `${prefix} ${message}`;
  }

  info(message, ...args) {
    console.log(this.format('INFO', message), ...args);
  }

  warn(message, ...args) {
    console.warn(this.format('WARN', message), ...args);
  }

  error(message, ...args) {
    console.error(this.format('ERROR', message), ...args);
  }

  debug(message, ...args) {
    if (process.env.LOG_LEVEL === 'debug') {
      console.log(this.format('DEBUG', message), ...args);
    }
  }
}
