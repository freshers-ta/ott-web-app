import { container } from './modules/container';
import LogService from './services/logging/LogService';

export const getLogger = () => {
  return container.get(LogService);
};
