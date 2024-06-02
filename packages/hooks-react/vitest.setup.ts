import 'vi-fetch/setup';
import 'reflect-metadata';
import { mockService } from '@jwp/ott-common/test/mockService';
import LogService from '@jwp/ott-common/src/services/logging/LogService';

beforeEach(() => {
  mockService(LogService, {
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
    fatal: () => {},
  });
});
