from __future__ import annotations

from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "tools" / "prepare_library_pages.py"


class PrepareLibraryPagesTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tempdir = tempfile.TemporaryDirectory()
        self.root = Path(self.tempdir.name)
        self.source = self.root / "source"
        self.output = self.root / "site"
        self.source.mkdir()
        for relative in (
            "library/index.html",
            "library/search-index.json",
            "my-library/index.html",
            "publisher/index.html",
            "enterprise/index.html",
            "assets/marketplace-auth.js",
            "assets/library-acquire.js",
        ):
            path = self.source / relative
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(f"fixture {relative}\n", encoding="utf-8")
        (self.source / "resume").mkdir()
        (self.source / "resume" / "index.html").write_text("must not copy\n", encoding="utf-8")
        (self.source / "index.html").write_text("<p>résumé home</p>", encoding="utf-8")

    def tearDown(self) -> None:
        self.tempdir.cleanup()

    def run_builder(self) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(SCRIPT), "--source", str(self.source), "--output", str(self.output)],
            cwd=ROOT,
            text=True,
            capture_output=True,
            check=False,
        )

    def test_builds_library_host_without_resume(self) -> None:
        result = self.run_builder()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertTrue((self.output / "library" / "index.html").is_file())
        self.assertTrue((self.output / "my-library" / "index.html").is_file())
        self.assertTrue((self.output / "publisher" / "index.html").is_file())
        self.assertTrue((self.output / "enterprise" / "index.html").is_file())
        self.assertTrue((self.output / "assets" / "marketplace-auth.js").is_file())
        self.assertEqual((self.output / "CNAME").read_text(encoding="utf-8"), "library.fullstackassets.com\n")
        self.assertFalse((self.output / "resume").exists())
        self.assertIn("/library/", (self.output / "index.html").read_text(encoding="utf-8"))
        sitemap = (self.output / "sitemap.xml").read_text(encoding="utf-8")
        self.assertIn("https://library.fullstackassets.com/library/", sitemap)
        self.assertNotIn("https://fullstackassets.com/resume/", sitemap)

    def test_fails_closed_when_catalog_is_missing(self) -> None:
        (self.source / "library" / "index.html").unlink()
        result = self.run_builder()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("missing required source file: library/index.html", result.stderr)


if __name__ == "__main__":
    unittest.main()
