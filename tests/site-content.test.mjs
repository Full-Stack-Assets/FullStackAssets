import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

const root = new URL("../", import.meta.url).pathname;
const ignored = new Set([".git", "docs", "products", "tests"]);
const deployedExtensions = new Set([".html", ".xml", ".js"]);

export function read(path) {
  return readFileSync(join(root, path), "utf8");
}

export function deployedFiles(directory = root) {
  return readdirSync(directory).flatMap((name) => {
    if (ignored.has(name)) return [];
    const absolute = join(directory, name);
    if (statSync(absolute).isDirectory()) return deployedFiles(absolute);
    return deployedExtensions.has(extname(name)) ? [relative(root, absolute)] : [];
  });
}

test("deployed copy contains no prohibited positioning", () => {
  const prohibited = [/patent/i, /flagship/i, /sole inventor/i];
  const failures = [];
  for (const file of deployedFiles()) {
    const source = read(file);
    for (const pattern of prohibited) {
      if (pattern.test(source)) failures.push(`${file}: ${pattern}`);
    }
  }
  assert.deepEqual(failures, []);
});

test("homepage is person-first and has exactly three featured projects", () => {
  const home = read("index.html");
  assert.match(home, /Nic Albertson · Full-stack \/ product engineer/);
  assert.match(home, /I turn messy workflows into <em>reliable software\.<\/em>/);
  assert.match(home, /Hiring a product engineer/);
  assert.match(home, /Need a system built/);
  const featured = [...home.matchAll(/class="asset featured-project/g)];
  assert.equal(featured.length, 3);
  const positions = ["BeyondMythos", "Tradewind DealFlow", "TaskFlow"].map((name) => home.indexOf(name));
  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);
  assert.doesNotMatch(home, /href="\/purchase\//);
});

test("homepage metadata is role-first", () => {
  const home = read("index.html");
  assert.match(home, /<title>Nic Albertson — Full-Stack \/ Product Engineer<\/title>/);
  assert.match(home, /Product-minded full-stack engineer building reliable workflow automation/);
  assert.match(home, /"jobTitle": "Full-Stack \/ Product Engineer"/);
  assert.doesNotMatch(home, /revenue-ready|20\+|acquisition/i);
});

test("required routes and focused services exist", () => {
  for (const path of [
    "case-studies/beyondmythos.html",
    "case-studies/tradewind-dealflow.html",
    "resume/index.html",
  ]) assert.equal(existsSync(join(root, path)), true, path);
  const services = read("services/index.html");
  assert.match(services, /Product and Systems Audit/);
  assert.match(services, /Fixed-Scope Build Sprint/);
  assert.doesNotMatch(services, /Fractional Founding Engineer|Source License|Acquisition/);
});

test("BeyondMythos copy distinguishes operations from traction", () => {
  const page = read("case-studies/beyondmythos.html");
  assert.match(page, /Autonomous Deployment Engine/);
  assert.match(page, /41/);
  assert.match(page, /operational evidence/i);
  assert.match(page, /not (customer|market) traction/i);
});

test("shared behavior has no checkout enhancer and supports inquiry and print", () => {
  const script = read("assets/site.js");
  assert.doesNotMatch(script, /purchase route|begin_checkout|commerceEnhanced/);
  assert.match(script, /data-inquiry-form/);
  assert.match(script, /data-print-resume/);
  assert.match(script, /Escape/);
});

test("selected case studies use evidence-backed framing", () => {
  const index = read("case-studies/index.html");
  const positions = ["BeyondMythos", "Tradewind DealFlow", "TaskFlow"].map((name) => index.indexOf(name));
  assert.ok(positions.every((position) => position >= 0));
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);
  const taskflow = read("case-studies/taskflow.html");
  assert.match(taskflow, /retries/i);
  assert.match(taskflow, /persistence/i);
  assert.match(taskflow, /tests/i);
  assert.doesNotMatch(taskflow, /36K|30 files/i);
  const experiment = read("case-studies/constellation-coo.html");
  assert.match(experiment, /Experimental agent-scheduling engine/);
  assert.match(experiment, /synthetic benchmark/i);
});
