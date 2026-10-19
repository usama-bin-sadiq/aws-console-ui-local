/* oxlint-disable @typescript-eslint/no-require-imports -- standalone CommonJS CDP script */
const CDP = require("chrome-remote-interface");
const fs = require("node:fs");
const path = require("node:path");

const port = Number(process.env.CDP_PORT || 9222);
const baseUrl = process.env.VISUAL_BASE_URL || "http://localhost:3000";
const username = process.env.VISUAL_TEST_USERNAME;
const password = process.env.VISUAL_TEST_PASSWORD;
const outputDir = process.env.VISUAL_SCREENSHOT_DIR
  ? path.resolve(process.env.VISUAL_SCREENSHOT_DIR)
  : null;
const waitMs = Number(process.env.VISUAL_WAIT_MS || 1500);
const routeTimeoutMs = Number(process.env.VISUAL_ROUTE_TIMEOUT_MS || 15000);
const viewportWidth = Number(process.env.VISUAL_WIDTH || 1440);
const viewportHeight = Number(process.env.VISUAL_HEIGHT || 1000);
const mobileViewport = process.env.VISUAL_MOBILE === "true";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor(Runtime, expression, timeoutMs = routeTimeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const value = await evaluate(Runtime, expression);
    if (value) return true;
    await wait(250);
  }
  return false;
}

async function evaluate(Runtime, expression) {
  const result = await Runtime.evaluate({ expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails)
    throw new Error(result.exceptionDetails.text || "Runtime evaluation failed");
  return result.result?.value;
}

async function setInput(Runtime, selector, value) {
  return evaluate(
    Runtime,
    `(() => {
    const element = document.querySelector(${JSON.stringify(selector)});
    if (!element) return false;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setter?.call(element, ${JSON.stringify(value)});
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  })()`,
  );
}

async function screenshot(Page, name) {
  if (!outputDir) return null;
  const capture = await Page.captureScreenshot({ format: "png", captureBeyondViewport: false });
  fs.mkdirSync(outputDir, { recursive: true });
  const file = path.join(outputDir, `${name}.png`);
  fs.writeFileSync(file, Buffer.from(capture.data, "base64"));
  return file;
}

async function main() {
  const client = await CDP({ port });
  const { Page, Runtime, Network, Emulation } = client;
  const errors = [];
  let activeRoute = "login";

  client.on("Runtime.exceptionThrown", (event) => {
    errors.push(`${activeRoute}: ${event.exceptionDetails?.text || "Runtime exception"}`);
  });
  client.on("Runtime.consoleAPICalled", (event) => {
    if (event.type === "error") {
      const message = (event.args || []).map((arg) => arg.value ?? arg.description ?? "").join(" ");
      const stack = (event.stackTrace?.callFrames || [])
        .slice(0, 3)
        .map((frame) => `${frame.url || ""}:${frame.lineNumber + 1}`)
        .join(" | ");
      errors.push(`${activeRoute}: ${message || "console.error"}${stack ? ` [${stack}]` : ""}`);
    }
  });
  client.on("Log.entryAdded", (event) => {
    if (event.entry?.level === "error")
      errors.push(`${activeRoute}: ${event.entry.text || "Log error"}`);
  });

  await Promise.all([Page.enable(), Runtime.enable(), Network.enable()]);
  if (typeof Runtime.discardConsoleEntries === "function") {
    await Runtime.discardConsoleEntries();
  }
  errors.length = 0;
  await Emulation.setDeviceMetricsOverride({
    width: viewportWidth,
    height: viewportHeight,
    deviceScaleFactor: 1,
    mobile: mobileViewport,
    screenWidth: viewportWidth,
    screenHeight: viewportHeight,
  });

  activeRoute = "/login";
  await Page.navigate({ url: `${baseUrl}/login` });
  await waitFor(Runtime, `document.querySelector("h1")?.textContent?.trim() === "Sign In"`);
  await wait(waitMs);
  const loginMetrics = await evaluate(
    Runtime,
    `({
    title: document.title,
    heading: document.querySelector("h1")?.textContent?.trim() || null,
    inputs: document.querySelectorAll("input").length,
    buttons: document.querySelectorAll("button").length,
    width: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight
  })`,
  );
  const loginScreenshot = await screenshot(Page, "login");

  let dashboardMetrics = null;
  let dashboardScreenshot = null;
  if (username && password) {
    await setInput(Runtime, "#login-email", username);
    await evaluate(Runtime, `document.querySelector("button[type=submit]")?.click()`);
    await wait(300);
    await setInput(Runtime, "#login-password", password);
    await evaluate(Runtime, `document.querySelector("button[type=submit]")?.click()`);
    activeRoute = "/";
    await waitFor(Runtime, `document.body.innerText.includes("Connected to local emulator")`);
    await wait(waitMs);
    await evaluate(Runtime, "window.scrollTo(0, 0)");
    dashboardMetrics = await evaluate(
      Runtime,
      `({
      url: location.href,
      title: document.title,
      main: document.querySelector("main")?.textContent?.trim().slice(0, 160) || null,
      health: document.body.innerText.includes("Connected to local emulator") ? "connected" : document.body.innerText.includes("checking") ? "checking" : "other",
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight
    })`,
    );
    dashboardScreenshot = await screenshot(Page, "dashboard");
  }

  const serviceResults = [];
  const serviceLoadingText = {
    "/ec2": "Loading instances...",
    "/s3": "Loading buckets...",
    "/iam": "Loading users...",
    "/lambda": "Loading functions...",
    "/vpc": "Loading VPCs...",
  };
  if (username && password) {
    for (const route of ["/ec2", "/s3", "/iam", "/lambda", "/vpc"]) {
      activeRoute = route;
      await Page.navigate({ url: `${baseUrl}${route}` });
      const routeReady = await waitFor(
        Runtime,
        `location.pathname === ${JSON.stringify(route)} && Boolean(document.querySelector("h1"))`,
      );
      const dataSettled = await waitFor(
        Runtime,
        `!document.body.innerText.includes(${JSON.stringify(serviceLoadingText[route])})`,
      );
      await wait(waitMs);
      await evaluate(Runtime, "window.scrollTo(0, 0)");
      const metrics = await evaluate(
        Runtime,
        `({
        route: location.pathname,
        routeReady: ${routeReady},
        dataSettled: ${dataSettled},
        heading: document.querySelector("h1")?.textContent?.trim() || null,
        tables: document.querySelectorAll("table").length,
        alerts: document.querySelectorAll("[role=alert]").length,
        serviceNavOpen: [...document.querySelectorAll("nav")].some((element) => element.className?.toString().includes("is-navigation-open")),
        viewportWidth: window.innerWidth,
        contentWidth: document.documentElement.scrollWidth,
        text: document.querySelector("main")?.textContent?.trim().slice(0, 120) || null
      })`,
      );
      const file = await screenshot(Page, `service${route.replaceAll("/", "-")}`);
      serviceResults.push({ ...metrics, screenshot: file });
    }
  }

  console.log(
    JSON.stringify(
      {
        login: { ...loginMetrics, screenshot: loginScreenshot },
        dashboard: dashboardMetrics
          ? { ...dashboardMetrics, screenshot: dashboardScreenshot }
          : null,
        services: serviceResults,
        errors,
      },
      null,
      2,
    ),
  );
  await client.close();
  if (errors.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exitCode = 1;
});
