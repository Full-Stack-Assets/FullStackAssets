#!/usr/bin/env python3
"""Build the library.fullstackassets.com Pages artifact from FullStackAssets."""

from __future__ import annotations

import argparse
from pathlib import Path
import shutil
import sys
from typing import Iterable

DOMAIN = "library.fullstackassets.com"
REQUIRED_SOURCE_FILES = (
    "library/index.html",
    "library/search-index.json",
    "my-library/index.html",
    "publisher/index.html",
    "enterprise/index.html",
    "assets/marketplace-auth.js",
    "assets/library-acquire.js",
)
COPY_TREES = ("library", "my-library", "publisher", "enterprise")
COPY_FILES = (
    "assets/marketplace-auth.js",
    "assets/library-acquire.js",
)
FORBIDDEN_ROOT_FILES = ("resume/index.html",)
ROOT_REDIRECT = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0; url=/library/">
  <link rel="canonical" href="https://library.fullstackassets.com/library/">
  <title>Agent & Skill Library</title>
</head>
<body>
  <p>The library lives at <a href="/library/">/library/</a>.</p>
</body>
</html>
"""
ROBOTS = """User-agent: *
Allow: /

Sitemap: https://library.fullstackassets.com/sitemap.xml
"""
SITEMAP = """<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://library.fullstackassets.com/library/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://library.fullstackassets.com/my-library/</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://library.fullstackassets.com/publisher/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://library.fullstackassets.com/enterprise/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>
"""


class ArtifactError(RuntimeError):
    pass


def _reject_symlinks(root: Path) -> None:
    if root.is_symlink():
        raise ArtifactError(f"symbolic link is not allowed: {root}")
    for path in root.rglob("*"):
        if path.is_symlink():
            raise ArtifactError(f"symbolic link is not allowed: {path}")


def _require_files(root: Path, paths: Iterable[str], *, label: str) -> None:
    for relative in paths:
        if not (root / relative).is_file():
            raise ArtifactError(f"missing required {label} file: {relative}")


def prepare_site(source_root: Path, output_root: Path) -> None:
    source_root = source_root.resolve()
    output_root = output_root.resolve()
    if not source_root.is_dir():
        raise ArtifactError(f"source directory does not exist: {source_root}")
    if output_root == source_root:
        raise ArtifactError("output directory must be separate from source")

    _require_files(source_root, REQUIRED_SOURCE_FILES, label="source")
    _reject_symlinks(source_root)

    if output_root.exists():
        shutil.rmtree(output_root)
    output_root.mkdir(parents=True)

    for relative in COPY_TREES:
        shutil.copytree(source_root / relative, output_root / relative, copy_function=shutil.copy2)
    for relative in COPY_FILES:
        destination = output_root / relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source_root / relative, destination)

    (output_root / "index.html").write_text(ROOT_REDIRECT, encoding="utf-8")
    (output_root / "robots.txt").write_text(ROBOTS, encoding="utf-8")
    (output_root / "sitemap.xml").write_text(SITEMAP, encoding="utf-8")
    (output_root / "CNAME").write_text(f"{DOMAIN}\n", encoding="utf-8")
    (output_root / ".nojekyll").touch()

    _reject_symlinks(output_root)
    _require_files(
        output_root,
        REQUIRED_SOURCE_FILES + ("index.html", "robots.txt", "sitemap.xml", "CNAME", ".nojekyll"),
        label="artifact",
    )
    if (output_root / "resume").exists():
        raise ArtifactError("résumé tree must not ship on the library host")
    cname = (output_root / "CNAME").read_text(encoding="utf-8")
    if cname != f"{DOMAIN}\n":
        raise ArtifactError(f"CNAME must contain exactly {DOMAIN}")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args(argv)
    try:
        prepare_site(args.source, args.output)
    except (ArtifactError, OSError, UnicodeError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1
    print(f"Prepared library Pages artifact at {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
