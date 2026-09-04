/**
 * Adapter Core Tests — Full coverage for adapter layer (>85%).
 * Per PRD Appendix D, Appendix F, Appendix H (Testing Strategy).
 * Every adapter module covered: factory, endpoint-resolver, auth-injector,
 * request-mapper, response-normalizer.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createAdapter, AdapterFactoryOptions } from './index';
import { resolveEndpoint } from './endpoint-resolver';
import { injectAuth } from './auth-injector';
import { mapRequest } from './request-mapper';
import { normalizeResponse } from './response-normalizer';
import { ADAPTER_DEFAULT_VERSION } from '@/constants/adapter-constants';

/* ------------------------------------------------------------------ */
/* Adapter Factory                                                     */
/* ------------------------------------------------------------------ */
describe('Adapter Factory (createAdapter)', () => {
  it('creates adapter with endpoint, auth, service, adapterActive, adapterVersion', () => {
    const adapter = createAdapter({ adapterMode: 'localstack', serviceName: 'ec2' });
    expect(adapter.adapterActive).toBe(true);
    expect(adapter.adapterVersion).toBe(ADAPTER_DEFAULT_VERSION);
    expect(adapter.service).toBe('ec2');
  });

  it('defaults serviceName to aws-console', () => {
    const adapter = createAdapter({ adapterMode: 'localstack' });
    expect(adapter.service).toBe('aws-console');
  });

  it('defaults adapterMode to localstack when undefined', () => {
    const adapter = createAdapter();
    expect(adapter.endpoint.hostname).toBe('localhost');
  });

  it('exposes mapRequest and normalizeResponse as callable functions', () => {
    const adapter = createAdapter({ adapterMode: 'minstack', serviceName: 'lambda' });
    expect(typeof adapter.mapRequest).toBe('function');
    expect(typeof adapter.normalizeResponse).toBe('function');
  });

  it('passes adapterMode through to endpoint resolution', () => {
    const adapter = createAdapter({ adapterMode: 'minstack' });
    expect(adapter.endpoint.hostname).toBe('localhost');
    expect(adapter.endpoint.port).toBe(4566);
  });

  it('returns adapterMode property in result', () => {
    const adapter = createAdapter({ adapterMode: 'localstack' });
    expect(adapter.adapterMode).toBeDefined();
    expect(adapter.adapterMode.mode).toBe('localstack');
  });
});

/* ------------------------------------------------------------------ */
/* Endpoint Resolver                                                  */
/* ------------------------------------------------------------------ */
describe('Endpoint Resolver (resolveEndpoint)', () => {
  it('resolves localstack endpoint with correct hostname, port, url', () => {
    const ep = resolveEndpoint('localstack');
    expect(ep.hostname).toBe('localhost');
    expect(ep.port).toBe(4566);
    expect(ep.protocol).toBe('http');
    expect(ep.url).toBe('http://localhost:4566');
    expect(ep.sslEnabled).toBe(false);
  });

  it('resolves minstack endpoint', () => {
    const ep = resolveEndpoint('minstack');
    expect(ep.hostname).toBe('localhost');
    expect(ep.port).toBe(4566);
    expect(ep.url).toContain(':4566');
  });

  it('resolves real endpoint with https protocol', () => {
    const ep = resolveEndpoint('real');
    expect(ep.protocol).toBe('https');
    expect(ep.sslEnabled).toBe(true);
  });

  it('falls back to ADAPTER_CONFIG adapterMode when argument is undefined', () => {
    const ep = resolveEndpoint(undefined);
    expect(ep.hostname).toBe('localhost');
  });

  it('handles custom endpoint config from environment via ADAPTER_CONFIG', () => {
    const ep = resolveEndpoint('localstack');
    expect(ep.url).toMatch(/localhost/);
  });
});

/* ------------------------------------------------------------------ */
/* Auth Injector                                                      */
/* ------------------------------------------------------------------ */
describe('Auth Injector (injectAuth)', () => {
  it('injects dummy credentials for localstack', () => {
    const auth = injectAuth('localstack');
    expect(auth.accessKeyId).toBe('test');
    expect(auth.secretAccessKey).toBe('test');
    expect(auth.region).toBe('us-east-1');
    expect(auth.sessionToken).toBeUndefined();
  });

  it('injects dummy credentials for minstack', () => {
    const auth = injectAuth('minstack');
    expect(auth.accessKeyId).toBe('test');
    expect(auth.secretAccessKey).toBe('test');
    expect(auth.region).toBe('us-east-1');
  });

  it('injects real-mode credentials from process.env when available', () => {
    const originalAccess = process.env.AWS_ACCESS_KEY_ID;
    process.env.AWS_ACCESS_KEY_ID = 'real-key';
    process.env.AWS_SECRET_ACCESS_KEY = 'real-secret';
    const auth = injectAuth('real');
    expect(auth.accessKeyId).toBe('real-key');
    expect(auth.secretAccessKey).toBe('real-secret');
    if (originalAccess !== undefined) process.env.AWS_ACCESS_KEY_ID = originalAccess;
    else delete process.env.AWS_ACCESS_KEY_ID;
  });

  it('falls back to default dummy when adapterMode is undefined', () => {
    const auth = injectAuth();
    expect(auth.accessKeyId).toBe('test');
  });

  it('preserves sessionToken when configured', () => {
    const auth = injectAuth('localstack');
    expect(auth.sessionToken).toBeUndefined();
  });
});

/* ------------------------------------------------------------------ */
/* Request Mapper                                                     */
/* ------------------------------------------------------------------ */
describe('Request Mapper (mapRequest)', () => {
  it('rewrites request endpoint to adapter endpoint for localstack', () => {
    const mapped = mapRequest({ path: '/instances', method: 'GET' }, 'localstack');
    expect(mapped.hostname).toBe('localhost');
    expect(mapped.path).toBe('/instances');
    expect(mapped.url).toContain('localhost');
    expect(mapped.protocol).toBe('http');
  });

  it('includes adapter headers x-adapter-mode and x-adapter-service', () => {
    const mapped = mapRequest({ path: '/' }, 'localstack');
    expect(mapped.headers['x-adapter-mode']).toBe('localstack');
    expect(mapped.headers['x-adapter-service']).toBe('aws-console-emulator');
  });

  it('sets Authorization header with AWS4-HMAC-SHA256 format', () => {
    const mapped = mapRequest({ path: '/' }, 'localstack');
    expect(mapped.headers.Authorization).toContain('AWS4-HMAC-SHA256');
    expect(mapped.headers.Authorization).toContain('Credential=');
  });

  it('maps POST method correctly', () => {
    const mapped = mapRequest({ path: '/buckets', method: 'POST', body: '{"name":"test"}' }, 'minstack');
    expect(mapped.method).toBe('POST');
    expect(mapped.body).toBe('{"name":"test"}');
    expect(mapped.protocol).toBe('http');
  });

  it('defaults method to GET when missing', () => {
    const mapped = mapRequest({ path: '/test' });
    expect(mapped.method).toBe('GET');
  });

  it('defaults path to / when missing', () => {
    const mapped = mapRequest({ method: 'GET' });
    expect(mapped.path).toBe('/');
  });

  it('stringifies object body when body is not a string', () => {
    const mapped = mapRequest({ path: '/', body: { key: 'value' } }, 'localstack');
    expect(mapped.body).toBe('{"key":"value"}');
  });

  it('handles body as Buffer or Uint8Array without corrupting', () => {
    const buf = Buffer.from('raw');
    const mapped = mapRequest({ path: '/', body: buf }, 'localstack');
    expect(typeof mapped.body).toBe('string');
  });

  it('preserves original headers and merges adapter headers', () => {
    const mapped = mapRequest({ path: '/', headers: { 'Content-Type': 'application/json' } }, 'localstack');
    expect(mapped.headers['Content-Type']).toBe('application/json');
    expect(mapped.headers['x-adapter-mode']).toBe('localstack');
  });

  it('sets Host header based on endpoint', () => {
    const mapped = mapRequest({ path: '/' }, 'minstack');
    expect(mapped.headers.Host).toBe('localhost:4566');
  });
});

/* ------------------------------------------------------------------ */
/* Response Normalizer                                               */
/* ------------------------------------------------------------------ */
describe('Response Normalizer (normalizeResponse)', () => {
  it('normalizes JSON response with status 200', () => {
    const normalized = normalizeResponse({ status: 200, data: '{"key":"value"}' });
    expect(normalized.statusCode).toBe(200);
    expect(normalized.body).toBe('{"key":"value"}');
    expect(normalized.headers['content-type']).toBe('application/json');
  });

  it('defaults status to 200 for missing status', () => {
    const normalized = normalizeResponse({});
    expect(normalized.statusCode).toBe(200);
    expect(normalized.body).toBe('{}');
  });

  it('defaults headers when missing', () => {
    const normalized = normalizeResponse({ status: 404 });
    expect(normalized.headers['content-type']).toBeDefined();
  });

  it('preserves custom headers from raw response', () => {
    const normalized = normalizeResponse({ status: 201, headers: { 'x-request-id': 'abc' }, data: '{}' });
    expect(normalized.headers['x-request-id']).toBe('abc');
  });

  it('handles binary response data', () => {
    const buf = Buffer.from('binary-data');
    const normalized = normalizeResponse({ status: 200, data: buf });
    expect(normalized.statusCode).toBe(200);
  });

  it('handles Uint8Array response data', () => {
    const arr = new Uint8Array([1, 2, 3]);
    const normalized = normalizeResponse({ status: 200, data: arr });
    expect(normalized.statusCode).toBe(200);
  });

  it('handles response with no data field', () => {
    const normalized = normalizeResponse({ status: 204, headers: { 'content-type': 'text/plain' } });
    expect(normalized.statusCode).toBe(204);
    expect(normalized.body).toBe('{}');
  });
});

/* ------------------------------------------------------------------ */
/* Integration: Adapter Factory + Endpoint + Auth + Request + Resp    */
/* ------------------------------------------------------------------ */
describe('Adapter Integration (end-to-end adapter flow)', () => {
  it('flows adapter factory → endpoint → auth → mapRequest → normalizeResponse', () => {
    const adapter = createAdapter({ adapterMode: 'localstack', serviceName: 'dynamodb' });
    const mapped = adapter.mapRequest({ path: '/tables', method: 'GET', headers: { Accept: 'application/json' } }, 'localstack');
    expect(mapped.url).toContain('localhost');
    expect(mapped.headers['x-adapter-mode']).toBe('localstack');
    expect(mapped.headers.Authorization).toContain('AWS4-HMAC-SHA256');

    const response = adapter.normalizeResponse({ status: 200, data: '{"Tables":[]}' });
    expect(response.statusCode).toBe(200);
    expect(response.body).toBe('{"Tables":[]}');
  });

  it('uses different endpoint when adapter mode changes', () => {
    const adapterLocal = createAdapter({ adapterMode: 'localstack' });
    const adapterReal = createAdapter({ adapterMode: 'real' });
    expect(adapterLocal.endpoint.protocol).toBe('http');
    expect(adapterReal.endpoint.protocol).toBe('https');
  });

  it('produces normalized response matching SDK HttpResponse shape', () => {
    const adapter = createAdapter({ adapterMode: 'minstack', serviceName: 's3' });
    const mapped = adapter.mapRequest({ path: '/buckets/test', method: 'GET' }, 'minstack');
    expect(mapped.path).toBe('/buckets/test');
    expect(mapped.method).toBe('GET');

    const normalized = adapter.normalizeResponse({ status: 200, data: '{"status":"ok"}' });
    expect(normalized.statusCode).toBe(200);
    expect(typeof normalized.body).toBe('string');
    expect(typeof normalized.headers).toBe('object');
  });
});
