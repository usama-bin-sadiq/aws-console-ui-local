/**
 * Adapter Core Tests — Full coverage for adapter layer.
 * No stubs (skip or todo) allowed unless fully implemented elsewhere.
 */

import { describe, it, expect } from 'vitest';
import { createAdapter } from './index';
import { resolveEndpoint } from './endpoint-resolver';
import { injectAuth } from './auth-injector';
import { mapRequest } from './request-mapper';
import { normalizeResponse } from './response-normalizer';

describe('Adapter Factory', () => {
  it('creates adapter with endpoint, auth, service, and functions', () => {
    const adapter = createAdapter({ adapterMode: 'localstack', serviceName: 'ec2' });
    expect(adapter.adapterActive).toBe(true);
    expect(adapter.adapterVersion).toBe('1.0.0');
    expect(adapter.service).toBe('ec2');
    expect(typeof adapter.mapRequest).toBe('function');
    expect(typeof adapter.normalizeResponse).toBe('function');
  });

  it('returns endpoint with correct protocol and hostname', () => {
    const adapter = createAdapter({ adapterMode: 'localstack' });
    expect(adapter.endpoint.protocol).toBe('http');
    expect(adapter.endpoint.hostname).toBe('localhost');
    expect(adapter.endpoint.port).toBe(4566);
  });
});

describe('Endpoint Resolver', () => {
  it('resolves localstack endpoint', () => {
    const ep = resolveEndpoint('localstack');
    expect(ep.hostname).toBe('localhost');
    expect(ep.port).toBe(4566);
  });

  it('resolves minstack endpoint', () => {
    const ep = resolveEndpoint('minstack');
    expect(ep.hostname).toBe('localhost');
    expect(ep.port).toBe(4566);
  });

  it('resolves real endpoint', () => {
    const ep = resolveEndpoint('real');
    expect(ep.protocol).toBe('https');
  });
});

describe('Auth Injector', () => {
  it('injects dummy credentials for localstack', () => {
    const auth = injectAuth('localstack');
    expect(auth.accessKeyId).toBe('test');
    expect(auth.secretAccessKey).toBe('test');
    expect(auth.region).toBe('us-east-1');
  });

  it('injects dummy credentials for minstack', () => {
    const auth = injectAuth('minstack');
    expect(auth.accessKeyId).toBe('test');
  });

  it('injects real-mode credentials', () => {
    const auth = injectAuth('real');
    expect(auth.accessKeyId).not.toBe('test');
  });
});

describe('Request Mapper', () => {
  it('rewrites request endpoint', () => {
    const mapped = mapRequest({ path: '/instances', method: 'GET' }, 'localstack');
    expect(mapped.hostname).toBe('localhost');
    expect(mapped.path).toBe('/instances');
    expect(mapped.url).toContain('localhost');
  });

  it('includes adapter headers', () => {
    const mapped = mapRequest({ path: '/' }, 'localstack');
    expect(mapped.headers['x-adapter-mode']).toBe('localstack');
    expect(mapped.headers['x-adapter-service']).toBe('aws-console-emulator');
  });
});

describe('Response Normalizer', () => {
  it('normalizes JSON response', () => {
    const normalized = normalizeResponse({ status: 200, data: '{"key":"value"}' });
    expect(normalized.statusCode).toBe(200);
    expect(normalized.body).toBe('{"key":"value"}');
  });

  it('defaults to 200 for missing status', () => {
    const normalized = normalizeResponse({});
    expect(normalized.statusCode).toBe(200);
  });
});
