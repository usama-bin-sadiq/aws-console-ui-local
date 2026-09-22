import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { createAdapter } from '@/lib/localstack-adapter';

describe('LocalStack Adapter', () => {
  describe('createAdapter', () => {
    it('should create an adapter with default mode', () => {
      const adapter = createAdapter();

      expect(adapter.adapterActive).toBe(true);
      expect(adapter.adapterMode).toBeDefined();
      expect(adapter.service).toBe('aws-console');
      expect(adapter.adapterVersion).toBeDefined();
    });

    it('should support localstack mode', () => {
      const adapter = createAdapter({ adapterMode: 'localstack' });
      expect(adapter.adapterMode.mode).toBe('localstack');
    });

    it('should support ministack mode', () => {
      const adapter = createAdapter({ adapterMode: 'ministack' });
      expect(adapter.adapterMode.mode).toBe('ministack');
    });

    it('should resolve endpoint', () => {
      const adapter = createAdapter({ adapterMode: 'localstack' });
      expect(adapter.endpoint).toBeDefined();
    });

    it('should inject auth credentials', () => {
      const adapter = createAdapter();
      expect(adapter.auth).toBeDefined();
    });

    it('should support request mapping', () => {
      const adapter = createAdapter();
      const mapped = adapter.mapRequest({
        protocol: 'http',
        hostname: 'localhost',
        port: 4566,
        path: '/test',
        headers: {},
        method: 'GET',
      });
      expect(mapped).toBeDefined();
      expect(mapped.protocol).toBe('http');
    });

    it('should support response normalization', () => {
      const adapter = createAdapter();
      const normalized = adapter.normalizeResponse({
        status: 200,
        headers: {},
        data: '{}',
      });
      expect(normalized).toBeDefined();
    });
  });
});