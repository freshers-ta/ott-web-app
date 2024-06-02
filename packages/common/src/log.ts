import { getModule } from './modules/container';
import LogService from './services/logging/LogService';

export const getLogger = () => {
  return getModule(LogService);
};
