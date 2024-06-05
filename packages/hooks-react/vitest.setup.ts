import 'vi-fetch/setup';
import 'reflect-metadata';
import { mockService } from '@jwp/ott-common/test/mockService';
import LogTransporter from '@jwp/ott-common/src/services/logging/LogTransporter';

beforeEach(() => {
  mockService(LogTransporter, {
    log() {},
  });
});
