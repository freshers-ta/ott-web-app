import { LogLevel } from '../LogLevel';

import type LogTransporter from './LogTransporter';

export default class ConsoleTransporter implements LogTransporter {
  constructor(readonly logLevel: LogLevel) {}

  log(level: LogLevel, scope: string, message: string, extra?: Record<string, unknown>, error?: Error) {
    if (level < this.logLevel) return;

    switch (level) {
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(`${LogLevel[level]} [${scope}] ${message}`);
        break;
      case LogLevel.WARN:
        console.warn(`${LogLevel[level]} [${scope}] ${message}`);
        break;
      default:
        // eslint-disable-next-line no-console
        console.log(`${LogLevel[level]} [${scope}] ${message}`);
    }

    if (error) {
      console.error(error);
    }

    if (extra) {
      // eslint-disable-next-line no-console
      console.table(extra);
    }
  }
}
