import { injectable, multiInject, optional } from 'inversify';

import { LOG_TRANSPORTER } from '../../modules/types';

import type LogTransporter from './transporters/LogTransporter';
import { LogLevel } from './LogLevel';

@injectable()
export default class LogService {
  constructor(@optional() @multiInject(LOG_TRANSPORTER) private readonly loggers: LogTransporter[]) {}

  private log(logLevel: LogLevel, scope: string, message: string, extra?: Record<string, unknown>, error?: Error) {
    this.loggers.forEach((transporter) => {
      // preventing the call here does limit options like adding breadcrumbs (which might be inferred from info logs) to Sentry calls
      if (logLevel >= transporter.logLevel) {
        transporter.log(logLevel, scope, message, extra, error);
      }
    });
  }

  private wrapError(error: unknown) {
    return error instanceof Error ? error : new Error(String(error));
  }

  // Logs detailed debugging information, useful during development
  debug = (scope: string, message: string, extra?: Record<string, unknown>) => this.log(LogLevel.DEBUG, scope, message, extra);

  // Logs general information about the application's operation, such as startup or shutdown messages
  info = (scope: string, message: string, extra?: Record<string, unknown>) => this.log(LogLevel.INFO, scope, message, extra);

  // Logs warnings about potential problems or unusual situations that are not immediately harmful
  warn = (scope: string, message: string, extra?: Record<string, unknown>) => this.log(LogLevel.WARN, scope, message, extra);

  // Logs errors that affect the functionality of the application but allow it to continue running
  error = (scope: string, message: string, error: unknown, extra?: Record<string, unknown>) =>
    this.log(LogLevel.ERROR, scope, message, extra, this.wrapError(error));

  // Logs severe errors that lead to the application's termination
  fatal = (scope: string, message: string, error: unknown, extra?: Record<string, unknown>) =>
    this.log(LogLevel.FATAL, scope, message, extra, this.wrapError(error));
}
