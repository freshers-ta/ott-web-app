import type { LogLevel } from './LogLevel';

export default abstract class LogTransporter {
  logLevel: LogLevel;

  abstract log(level: LogLevel, scope: string, message: string, extra?: Record<string, unknown>, error?: Error): void;

  protected constructor(logLevel: LogLevel) {
    this.logLevel = logLevel;
  }
}
