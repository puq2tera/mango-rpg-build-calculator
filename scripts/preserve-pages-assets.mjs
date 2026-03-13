import { access, mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { constants } from "node:fs";

const outDir = path.resolve(process.cwd(), "out");
const rawSiteUrl = process.env.PAGES_SITE_URL;

if (!rawSiteUrl) {
  console.warn("Skipping asset preservation because PAGES_SITE_URL is not set.");
  process.exit(0);
}

const normalizedSiteUrl = rawSiteUrl.endsWith("/") ? rawSiteUrl.slice(0, -1) : rawSiteUrl;
const siteUrl = new URL(normalizedSiteUrl);
const basePath = siteUrl.pathname === "/" ? "" : siteUrl.pathname.replace(/\/$/, "");
const publicOrigin = siteUrl.origin;

const buildIdPattern = /\\"b\\":\\"([^"\\]+)\\"|"b":"([^"]+)"/;
const manifestAssetPattern = /"((?:static|_next\/static)\/[^"\\]+)"/g;

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeAssetPath(assetPath) {
  if (assetPath.startsWith(`${basePath}/_next/static/`)) {
    return assetPath;
  }

  if (assetPath.startsWith("/_next/static/")) {
    return `${basePath}${assetPath}`;
  }

  if (assetPath.startsWith("static/")) {
    return `${basePath}/_next/${assetPath}`;
  }

  if (assetPath.startsWith("_next/static/")) {
    return `${basePath}/${assetPath}`;
  }

  return null;
}

function extractHtmlAssetPaths(html) {
  const pattern = new RegExp(`${escapeRegExp(basePath || "")}\/_next\/static\/[^"'()\\\\\\s<]+`, "g");
  const matches = html.match(pattern) ?? [];

  return matches.map((match) => {
    const normalizedMatch = match.replace(/\\+$/, "");
    return normalizedMatch.startsWith("/") ? normalizedMatch : `/${normalizedMatch}`;
  });
}

function extractBuildId(html) {
  const match = buildIdPattern.exec(html);
  return match?.[1] ?? match?.[2] ?? null;
}

async function fileExists(filePath) {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function walkHtmlFiles(currentDir, result = []) {
  const entries = await readdir(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);

    if (entry.isDirectory()) {
      await walkHtmlFiles(fullPath, result);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".html")) {
      result.push(fullPath);
    }
  }

  return result;
}

function toRoutePath(htmlFile) {
  const relativePath = path.relative(outDir, htmlFile);

  if (relativePath === "index.html") {
    return "/";
  }

  if (relativePath === "404.html") {
    return "/404.html";
  }

  if (relativePath.endsWith(`${path.sep}index.html`)) {
    return `/${relativePath.slice(0, -`${path.sep}index.html`.length).replaceAll(path.sep, "/")}/`;
  }

  return `/${relativePath.replace(/\.html$/, "").replaceAll(path.sep, "/")}`;
}

async function fetchText(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.text();
}

async function fetchBuffer(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return buffer;
}

const htmlFiles = await walkHtmlFiles(outDir);
const routePaths = Array.from(new Set(htmlFiles.map(toRoutePath)));
const assetPaths = new Set();
const buildManifestPaths = new Set();

for (const routePath of routePaths) {
  const routeUrl = new URL(routePath.replace(/^\//, ""), `${normalizedSiteUrl}/`).toString();

  try {
    const html = await fetchText(routeUrl);

    for (const assetPath of extractHtmlAssetPaths(html)) {
      assetPaths.add(assetPath);
    }

    const buildId = extractBuildId(html);

    if (!buildId) {
      continue;
    }

    buildManifestPaths.add(`${basePath}/_next/static/${buildId}/_buildManifest.js`);
    buildManifestPaths.add(`${basePath}/_next/static/${buildId}/_ssgManifest.js`);
  } catch (error) {
    console.warn(`Skipping ${routeUrl}: ${error instanceof Error ? error.message : "unknown error"}`);
  }
}

for (const manifestPath of buildManifestPaths) {
  assetPaths.add(manifestPath);

  try {
    const manifestUrl = new URL(manifestPath, publicOrigin).toString();
    const manifestText = await fetchText(manifestUrl);

    for (const match of manifestText.matchAll(manifestAssetPattern)) {
      const assetPath = normalizeAssetPath(match[1]);

      if (assetPath) {
        assetPaths.add(assetPath);
      }
    }
  } catch (error) {
    console.warn(`Skipping ${manifestPath}: ${error instanceof Error ? error.message : "unknown error"}`);
  }
}

let downloadedCount = 0;

for (const assetPath of assetPaths) {
  const normalizedAssetPath = normalizeAssetPath(assetPath);

  if (!normalizedAssetPath) {
    continue;
  }

  const relativeAssetPath = basePath ? normalizedAssetPath.slice(basePath.length + 1) : normalizedAssetPath.slice(1);
  const outputPath = path.join(outDir, relativeAssetPath);

  if (await fileExists(outputPath)) {
    continue;
  }

  try {
    const assetUrl = new URL(normalizedAssetPath, publicOrigin).toString();
    const buffer = await fetchBuffer(assetUrl);

    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, buffer);
    downloadedCount += 1;
  } catch (error) {
    console.warn(`Unable to preserve ${normalizedAssetPath}: ${error instanceof Error ? error.message : "unknown error"}`);
  }
}

console.log(`Preserved ${downloadedCount} previously deployed asset${downloadedCount === 1 ? "" : "s"}.`);
