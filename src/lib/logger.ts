type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
  debug: (message: string) => void;
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

class ConsoleLogger implements Logger {
  private readonly currentLevel: number;

  constructor() {
    const configuredLevel = (process.env.LOG_LEVEL || 'info').toLowerCase() as LogLevel;
    this.currentLevel = LOG_LEVELS[configuredLevel] ?? LOG_LEVELS.info;
  }

  debug(message: string): void {
    if (this.currentLevel <= LOG_LEVELS.debug) {
      console.log(`[DEBUG] ${message}`);
    }
  }

  info(message: string): void {
    if (this.currentLevel <= LOG_LEVELS.info) {
      console.log(`[INFO] ${message}`);
    }
  }

  warn(message: string): void {
    if (this.currentLevel <= LOG_LEVELS.warn) {
      console.warn(`[WARN] ${message}`);
    }
  }

  error(message: string): void {
    if (this.currentLevel <= LOG_LEVELS.error) {
      console.error(`[ERROR] ${message}`);
    }
  }
}

const logger = new ConsoleLogger();
export default logger;
