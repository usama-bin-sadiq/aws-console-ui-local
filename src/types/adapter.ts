/**
 * Adapter Types — Universal SDK Adapter Interfaces
 * Every adapter module uses these exported interfaces.
 * No inline types allowed inside adapter implementations.
 */

export interface AdapterModeValue {
  readonly mode: 'localstack' | 'ministack' | 'real';
}

export interface AuthCredentials {
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
  readonly sessionToken?: string | undefined;
  readonly region: string;
}

export interface EndpointResolution {
  readonly protocol: string;
  readonly hostname: string;
  readonly port: number;
  readonly url: string;
  readonly sslEnabled: boolean;
}

export interface AdapterConfigShape {
  readonly adapterMode: 'localstack' | 'ministack' | 'real';
  readonly endpointConfig: {
    readonly localstackHostname: string;
    readonly localstackPort: number;
    readonly localstackSslEnabled: boolean;
    readonly minstackHostname: string;
    readonly minstackPort: number;
    readonly minstackSslEnabled: boolean;
    readonly realEndpointUrl?: string;
    readonly localstackEndpoint: string;
    readonly minstackEndpoint: string;
  };
  readonly authConfig: AuthCredentials;
  readonly serviceStatusCheck: boolean;
}

export interface AdapterFactoryOptions {
  readonly adapterMode?: 'localstack' | 'ministack' | 'real';
  readonly serviceName?: string;
}

export interface MappedRequest {
  readonly protocol: string;
  readonly hostname: string;
  readonly port: number;
  readonly path: string;
  readonly headers: Record<string, string>;
  readonly body?: string | Buffer | Uint8Array;
  readonly method: string;
  readonly url: string;
}

export interface NormalizedResponse {
  readonly statusCode: number;
  readonly headers: Record<string, string>;
  readonly body: string | Buffer | Uint8Array;
}

export interface AdapterFactoryResult {
  readonly endpoint: EndpointResolution;
  readonly auth: AuthCredentials;
  readonly service: string;
  readonly adapterActive: boolean;
  readonly adapterVersion: string;
  readonly adapterMode: AdapterModeValue;
  mapRequest(req: unknown, adapterMode?: string): MappedRequest;
  normalizeResponse(res: unknown): NormalizedResponse;
}

// PRD-aligned feature tracking interfaces (docs/prd-aws-management-console.md Section 5)
export interface FeatureReference {
  readonly featureId: `F-${string}`;
  readonly featureName: string;
  readonly serviceCategory?: string;
  readonly workflowSteps?: readonly string[];
}

export interface ResourceTableConfig {
  readonly serviceName: string;
  readonly resourceTypeName: string;
  readonly columns: readonly string[];
  readonly actions: readonly string[];
  readonly paginationEnabled: boolean;
  readonly filterEnabled: boolean;
  readonly multiSelectEnabled: boolean;
  readonly exportsSupported: boolean;
}
