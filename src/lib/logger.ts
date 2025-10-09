type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: Error;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private logs: LogEntry[] = [];
  private maxLogs = 100;

  private formatMessage(level: LogLevel, message: string, context?: Record<string, any>): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    };
  }

  private sendToMonitoring(entry: LogEntry) {
    if (!this.isDevelopment && (entry.level === 'error' || entry.level === 'warn')) {
      this.logs.push(entry);
      if (this.logs.length > this.maxLogs) {
        this.logs.shift();
      }
    }
  }

  debug(message: string, context?: Record<string, any>) {
    const entry = this.formatMessage('debug', message, context);
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, context || '');
    }
    this.sendToMonitoring(entry);
  }

  info(message: string, context?: Record<string, any>) {
    const entry = this.formatMessage('info', message, context);
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, context || '');
    }
    this.sendToMonitoring(entry);
  }

  warn(message: string, context?: Record<string, any>) {
    const entry = this.formatMessage('warn', message, context);
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, context || '');
    }
    this.sendToMonitoring(entry);
  }

  error(message: string, error?: Error | unknown, context?: Record<string, any>) {
    const entry = this.formatMessage('error', message, context);
    if (error instanceof Error) {
      entry.error = error;
    }

    if (this.isDevelopment) {
      console.error(`[ERROR] ${message}`, error, context || '');
    } else {
      console.error(`[ERROR] ${message}`);
    }

    this.sendToMonitoring(entry);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }

  async sendLogsToBackend() {
    if (this.logs.length === 0) return;

    try {
      const logsToSend = [...this.logs];
      this.clearLogs();

      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs: logsToSend }),
      });
    } catch (error) {
      console.error('Failed to send logs to backend', error);
    }
  }
}

export const logger = new Logger();

if (typeof window !== 'undefined' && !import.meta.env.DEV) {
  setInterval(() => {
    logger.sendLogsToBackend();
  }, 60000);
}
