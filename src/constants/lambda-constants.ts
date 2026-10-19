/**
 * Lambda Constants — Service-level constants for Lambda feature parity.
 * PRD §9.2.1 (Lambda), §10.3 (Resource detail tabs), §15.3 (Wizard steps)
 */

export const LAMBDA_RUNTIMES = [
  { value: "nodejs20.x", label: "Node.js 20.x" },
  { value: "python3.12", label: "Python 3.12" },
  { value: "python3.11", label: "Python 3.11" },
  { value: "java21", label: "Java 21" },
  { value: "java17", label: "Java 17" },
  { value: "dotnet8", label: ".NET 8" },
  { value: "ruby3.3", label: "Ruby 3.3" },
  { value: "go1.x", label: "Go 1.x" },
] as const;

export const LAMBDA_DEFAULT_RUNTIME = "nodejs20.x";

export const LAMBDA_MEMORY_OPTIONS = [
  { value: 128, label: "128 MB" },
  { value: 256, label: "256 MB" },
  { value: 512, label: "512 MB" },
  { value: 1024, label: "1,024 MB (1 GB)" },
  { value: 2048, label: "2,048 MB (2 GB)" },
  { value: 3008, label: "3,008 MB (~3 GB)" },
  { value: 10240, label: "10,240 MB (10 GB)" },
] as const;

export const LAMBDA_DEFAULT_MEMORY = 128;

export const LAMBDA_TIMEOUT_OPTIONS = [
  { value: 3, label: "3 seconds" },
  { value: 10, label: "10 seconds" },
  { value: 30, label: "30 seconds" },
  { value: 60, label: "1 minute" },
  { value: 300, label: "5 minutes" },
  { value: 900, label: "15 minutes (max)" },
] as const;

export const LAMBDA_DEFAULT_TIMEOUT = 3;

export const LAMBDA_AUTHOR_OPTIONS = [
  { value: "scratch", label: "Author from scratch" },
  { value: "blueprint", label: "Use a blueprint" },
  { value: "container", label: "Container image" },
] as const;

export const LAMBDA_BLUEPRINTS = [
  { value: "hello-world", label: "hello-world — Basic Lambda function" },
  { value: "http-api", label: "http-api — Lambda function URL" },
];

export const LAMBDA_ARCHITECTURES = [
  { value: "x86_64", label: "x86_64" },
  { value: "arm64", label: "arm64" },
] as const;

export const LAMBDA_DEFAULT_ARCH = "x86_64";

export const LAMBDA_FUNCTION_STATES = ["Active", "Failed", "Inactive", "Pending"] as const;

export const LAMBDA_SERVICE_ROUTE = "/lambda";
