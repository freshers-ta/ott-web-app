import type { LogLevel } from '../LogLevel';

export default interface LogTransporter {
  logLevel: LogLevel;
  log(level: LogLevel, scope: string, message: string, extra?: Record<string, unknown>, error?: Error): void;
}
