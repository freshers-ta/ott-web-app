import { injectable, multiInject, optional } from 'inversify';

import { LOG_TRANSPORTER } from '../../modules/types';

import type LogTransporter from './transporters/LogTransporter';
import { LogLevel } from './LogLevel';

export type LogParams = { extra?: Record<string, unknown>; error?: unknown };

@injectable()
export default class LogService {
  constructor(@optional() @multiInject(LOG_TRANSPORTER) private readonly transporters: LogTransporter[]) {}

  private wrapError(error: unknown) {
    return error instanceof Error ? error : new Error(String(error));
  }

  private log(logLevel: LogLevel, scope: string, message: string, { extra, error }: LogParams) {
    this.transporters.forEach((transporter) => {
      transporter.log(logLevel, scope, message, extra, error ? this.wrapError(error) : undefined);
    });
  }

  // Logs detailed debugging information, useful during development
  debug = (scope: string, message: string, params: LogParams = {}) => this.log(LogLevel.DEBUG, scope, message, params);

  // Logs general information about the application's operation, such as startup or shutdown messages
  info = (scope: string, message: string, params: LogParams = {}) => this.log(LogLevel.INFO, scope, message, params);

  // Logs warnings about potential problems or unusual situations that are not immediately harmful
  warn = (scope: string, message: string, params: LogParams = {}) => this.log(LogLevel.WARN, scope, message, params);

  // Logs errors that affect the functionality of the application but allow it to continue running
  error = (scope: string, message: string, params: LogParams = {}) => this.log(LogLevel.ERROR, scope, message, params);

  // Logs severe errors that lead to the application's termination
  fatal = (scope: string, message: string, params: LogParams = {}) => this.log(LogLevel.FATAL, scope, message, params);
}
