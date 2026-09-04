/**
 * Adapter Constants — Universal adapter settings and magic values.
 * Extracted from inline strings per AGENTS.md Section 3.1.
 */

export const ADAPTER_DEFAULT_VERSION = '1.0.0';

export const ADAPTER_DEFAULT_HOSTNAME_LOCALSTACK = 'localhost';
export const ADAPTER_DEFAULT_HOSTNAME_MINSTACK = 'localhost';

export const ADAPTER_DEFAULT_PORT_LOCALSTACK = 4566;
export const ADAPTER_DEFAULT_PORT_MINSTACK = 4566;

export const ADAPTER_DEFAULT_PROTOCOL_HTTP = 'http';
export const ADAPTER_DEFAULT_PROTOCOL_HTTPS = 'https';

export const ADAPTER_DEFAULT_MODE_LOCALSTACK = 'localstack';
export const ADAPTER_DEFAULT_MODE_MINSTACK = 'ministack';
export const ADAPTER_DEFAULT_MODE_REAL = 'real';

export const ADAPTER_DEFAULT_ACCESS_KEY = 'test';
export const ADAPTER_DEFAULT_SECRET_KEY = 'test';
export const ADAPTER_DEFAULT_REGION = 'us-east-1';

export const ADAPTER_HEADER_ADAPTER_MODE = 'x-adapter-mode';
export const ADAPTER_HEADER_ADAPTER_SERVICE = 'x-adapter-service';
export const ADAPTER_SERVICE_VALUE = 'aws-console-emulator';

export const ADAPTER_HEALTH_LOCALSTACK_PATH = '/_localstack/health';
export const ADAPTER_HEALTH_MINSTACK_PATH = '/_ministack/health';

export const ADAPTER_MAX_ATTEMPTS = 3;
