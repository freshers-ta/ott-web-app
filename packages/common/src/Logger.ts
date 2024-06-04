import { getModule } from './modules/container';
import LogService, { type LogParams } from './services/logging/LogService';

export const getLogger = () => getModule(LogService);

export const logDebug = (scope: string, message: string, params: LogParams = {}) => getLogger().debug(scope, message, params);
export const logInfo = (scope: string, message: string, params: LogParams = {}) => getLogger().info(scope, message, params);
export const logWarn = (scope: string, message: string, params: LogParams = {}) => getLogger().warn(scope, message, params);
export const logError = (scope: string, message: string, params: LogParams = {}) => getLogger().error(scope, message, params);
export const logFatal = (scope: string, message: string, params: LogParams = {}) => getLogger().fatal(scope, message, params);
