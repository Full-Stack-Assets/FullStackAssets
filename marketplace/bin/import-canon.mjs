#!/usr/bin/env node
import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadCanonExport } from "../canon/readers.mjs";
import { buildSnapshot, buildChecksums } from "../canon/snapshot.mjs";
import { diffSnapshots } from "../canon/events.mjs";
import { stableStringify } from "../canon/hash.mjs";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--source") args.source = argv[++i];
    else if (argv[i] === "--out") args.out = argv[++i];
    else throw new Error(`UNKNOWN_ARGUMENT:${argv[i]}`);
  }
  if (!args.source) throw new Error("MISSING_ARGUMENT:--source");
  if (!args.out) throw new Error("MISSING_ARGUMENT:--out");
  return args;
}

function readPreviousSnapshot(path) {
  if (!existsSync(path)) return { schema_version: 1, roles: [], skills: [], integrations: [], overlays: [], relationships: [] };
  return JSON.parse(readFileSync(path, "utf8"));
}

function atomicCandidate(path, content) {
  const tmp = `${path}.tmp`;
  const fd = openSync(tmp, "w", 0o600);
  try {
    writeFileSync(fd, content, "utf8");
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  return tmp;
}

function cleanup(paths) {
  for (const path of paths) {
    try { if (existsSync(path)) unlinkSync(path); } catch {}
  }
}

function main() {
  const { source, out } = parseArgs(process.argv.slice(2));
  const raw = loadCanonExport(source);
  const snapshot = buildSnapshot(raw);
  const checksums = buildChecksums(snapshot);
  const previousPath = join(out, "canon.snapshot.json");
  const previous = readPreviousSnapshot(previousPath);
  const newEvents = diffSnapshots(previous, snapshot);
  const previousEventsPath = join(out, "canon.events.jsonl");
  const previousEvents = existsSync(previousEventsPath) ? readFileSync(previousEventsPath, "utf8") : "";
  const occurredAt = new Date().toISOString();
  const eventLines = newEvents.map((event) => stableStringify({ ...event, occurred_at: occurredAt }));
  const eventsText = previousEvents + (eventLines.length ? `${eventLines.join("\n")}\n` : "");

  mkdirSync(out, { recursive: true });
  const outputs = new Map([
    [join(out, "canon.snapshot.json"), `${stableStringify(snapshot)}\n`],
    [join(out, "canon.relationships.json"), `${stableStringify({ schema_version: 1, relationships: snapshot.relationships })}\n`],
    [join(out, "canon.checksums.json"), `${stableStringify(checksums)}\n`],
    [join(out, "canon.events.jsonl"), eventsText],
  ]);

  const temps = [];
  try {
    for (const [path, content] of outputs) temps.push([path, atomicCandidate(path, content)]);
    for (const [path, tmp] of temps) renameSync(tmp, path);
  } catch (error) {
    cleanup(temps.map(([, tmp]) => tmp));
    throw error;
  }

  process.stdout.write(`${stableStringify({ status: "OK", snapshot_hash: checksums.snapshot, event_count: newEvents.length })}\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`${error?.stack || error}\n`);
  process.exitCode = 1;
}
