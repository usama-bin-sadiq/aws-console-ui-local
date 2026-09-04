import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const appRoot = path.join(root, "src", "app");
const registryPath = path.join(root, "src", "constants", "service-compatibility.ts");

function walk(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const entryPath = path.join(directory, entry.name);
        return entry.isDirectory() ? walk(entryPath) : [entryPath];
    });
}

const routeFiles = walk(appRoot).filter((file) => file.endsWith("page.tsx"));
const routeDirs = new Set(routeFiles
    .map((file) => path.relative(appRoot, path.dirname(file)).replaceAll(path.sep, "/"))
    .filter((route) => route && !route.includes("/") && !route.includes("[")));
const registryText = fs.readFileSync(registryPath, "utf8");
const registryRoutes = [...registryText.matchAll(/routeDir:\s*'([^']+)'/g)].map((match) => match[1]);
const uniqueRegistryRoutes = new Set(registryRoutes);
const routeIssues = [];
const placeholderRoutes = [];
const rawPaddingRoutes = [];
const nativeControlRoutes = [];

for (const file of routeFiles) {
    const source = fs.readFileSync(file, "utf8");
    const route = path.relative(appRoot, path.dirname(file)).replaceAll(path.sep, "/") || "/";
    if (/AWS Service|No resources configured|Coming soon|not implemented/i.test(source)) placeholderRoutes.push(route);
    if (/<div\s+style=\{\{\s*padding:\s*["'](?:16|24)px/.test(source)) rawPaddingRoutes.push(route);
    if (/<(?:table|textarea|select|button)(?:\s|>)/.test(source)) nativeControlRoutes.push(route);
}

const unregisteredRoutes = [...routeDirs].filter((route) => !uniqueRegistryRoutes.has(route));
const duplicateRegistryRoutes = registryRoutes.filter((route, index) => registryRoutes.indexOf(route) !== index);

console.log(JSON.stringify({
    routeCount: routeFiles.length,
    registryRouteCount: uniqueRegistryRoutes.size,
    unregisteredRoutes,
    duplicateRegistryRoutes: [...new Set(duplicateRegistryRoutes)],
    placeholderRoutes,
    rawPaddingRoutes,
    nativeControlRoutes,
    routeIssues,
}, null, 2));

process.exitCode = unregisteredRoutes.length || duplicateRegistryRoutes.length || placeholderRoutes.length || nativeControlRoutes.length ? 1 : 0;
