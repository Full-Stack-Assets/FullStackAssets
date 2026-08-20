import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, normalize, relative } from "node:path";

const root = new URL("../", import.meta.url).pathname;
const ignored = new Set([".git", "docs", "products", "tests"]);

function htmlFiles(directory = root) {
  return readdirSync(directory).flatMap((name) => {
    if (ignored.has(name)) return [];
    const absolute = join(directory, name);
    if (statSync(absolute).isDirectory()) return htmlFiles(absolute);
    return extname(name) === ".html" ? [absolute] : [];
  });
}

function destinationFor(file, href) {
  const withoutQuery = href.split(/[?#]/)[0];
  if (!withoutQuery) return file;
  const absolute = withoutQuery.startsWith("/")
    ? join(root, withoutQuery)
    : normalize(join(dirname(file), withoutQuery));
  if (extname(absolute)) return absolute;
  return join(absolute, "index.html");
}

function isGeneratedLibraryRoute(href) {
  const withoutQuery = href.split(/[?#]/)[0];
  return withoutQuery === "/library" || withoutQuery.startsWith("/library/");
}

test("all checked-in local links resolve or target the separately validated generated Library", () => {
  const failures = [];
  for (const file of htmlFiles()) {
    const source = readFileSync(file, "utf8");
    const hrefs = [...source.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
    for (const href of hrefs) {
      if (/^(https?:|mailto:|tel:|data:|#)/.test(href)) continue;
      if (isGeneratedLibraryRoute(href)) continue;
      const destination = destinationFor(file, href);
      if (!existsSync(destination)) failures.push(`${relative(root, file)} -> ${href}`);
    }
  }
  assert.deepEqual(failures, []);
});

test("same-page anchors exist", () => {
  const failures = [];
  for (const file of htmlFiles()) {
    const source = readFileSync(file, "utf8");
    for (const [, id] of source.matchAll(/href="#([^"]+)"/g)) {
      if (!new RegExp(`id=["']${id}["']`).test(source)) failures.push(`${relative(root, file)}#${id}`);
    }
  }
  assert.deepEqual(failures, []);
});
