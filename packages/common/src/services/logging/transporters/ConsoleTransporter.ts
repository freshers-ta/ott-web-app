import { LogLevel } from '../LogLevel';

import type LogTransporter from './LogTransporter';

export default class ConsoleTransporter implements LogTransporter {
  constructor(readonly logLevel: LogLevel) {}

  log(level: LogLevel, scope: string, message: string, extra?: Record<string, unknown>, error?: Error) {
    if (this.logLevel === LogLevel.SILENT) return;

    switch (level) {
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(`[${scope}] ${message}`, error);
        break;
      case LogLevel.WARN:
        console.warn(`[${scope}] ${message}`);
        break;
      default:
        // eslint-disable-next-line no-console
        console.log(`[${scope}] ${message}`);
    }

    if (extra) {
      // eslint-disable-next-line no-console
      console.table(extra);
    }
  }
}
