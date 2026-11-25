import sys, tempfile, unittest
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts" / "engine"))
from smoke_test import SmokeTestError, run_smoke

class BrowserSmokeTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.fake = Path(self.tmp.name) / "fake_browser.py"
        self.fake.write_text(
            "import sys\n"
            "print('<html><title>Example Domain</title><body>Example Domain</body></html>')\n",
            encoding="utf-8")
    def tearDown(self):
        self.tmp.cleanup()
    def test_clean_profile_https_dom_smoke(self):
        record = run_smoke(Path(sys.executable), [str(self.fake)], "https://example.com",
                           "Example Domain", timeout=10)
        self.assertTrue(record["profile_was_fresh"])
        self.assertTrue(record["marker_found"])
        self.assertEqual(record["exit_code"], 0)
    def test_missing_marker_fails(self):
        with self.assertRaisesRegex(SmokeTestError, "not found"):
            run_smoke(Path(sys.executable), [str(self.fake)], "https://example.com",
                     "Not on page", timeout=10)
    def test_non_https_url_rejected(self):
        with self.assertRaisesRegex(SmokeTestError, "HTTPS"):
            run_smoke(Path(sys.executable), [str(self.fake)], "http://example.com",
                     "Example Domain", timeout=10)
    def test_nonzero_browser_exit_fails(self):
        self.fake.write_text("import sys\nsys.exit(7)\n", encoding="utf-8")
        with self.assertRaisesRegex(SmokeTestError, "code 7"):
            run_smoke(Path(sys.executable), [str(self.fake)], "https://example.com",
                     "Example Domain", timeout=10)

if __name__ == "__main__":
    unittest.main()
