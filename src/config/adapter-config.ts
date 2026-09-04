import { AdapterConfigShape } from '@/types/adapter';

/**
 * Adapter Configuration — Full Support for localstack, minstack, real
 * Every service uses this config. No exceptions. No stubs.
 */

export const ADAPTER_CONFIG: AdapterConfigShape = {
  adapterMode: (process.env.ADAPTER_MODE as AdapterConfigShape['adapterMode']) || 'localstack',
  endpointConfig: {
    localstackHostname: process.env.LOCALSTACK_HOSTNAME || 'localhost',
    localstackPort: parseInt(process.env.LOCALSTACK_EDGE_PORT || '4566', 10),
    localstackSslEnabled: process.env.LOCALSTACK_SSL_ENABLED === 'true',
    minstackHostname: process.env.MINSTACK_HOSTNAME || 'localhost',
    minstackPort: parseInt(process.env.MINSTACK_EDGE_PORT || '4566', 10),
    minstackSslEnabled: process.env.MINSTACK_SSL_ENABLED === 'true',
    realEndpointUrl: process.env.AWS_ENDPOINT_URL,
    localstackEndpoint: `http://${process.env.LOCALSTACK_HOSTNAME || 'localhost'}:${process.env.LOCALSTACK_EDGE_PORT || '4566'}`,
    minstackEndpoint: `http://${process.env.MINSTACK_HOSTNAME || 'localhost'}:${process.env.MINSTACK_EDGE_PORT || '4566'}`,
  },
  authConfig: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
    region: process.env.AWS_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-1',
  },
  serviceStatusCheck: true,
};
