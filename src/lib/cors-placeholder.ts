// CORS is required for AWS console cross-origin calls (current: 0 configuration per audit evidence phase-4).
// Implementation: add cors middleware or next.config headers for production parity.
export const corsConfig = {
  allowedOrigins: ["https://console.aws.amazon.com", "https://*.amazonaws.com"],
  allowedMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-ID"],
};
