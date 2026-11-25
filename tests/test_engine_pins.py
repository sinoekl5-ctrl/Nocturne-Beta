import sys, unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from validate_engine_pins import validate_pin_set

H="a"*40
PL={"macOS":("imputnet/helium-macos","b"*40),"Linux":("imputnet/helium-linux","c"*40),"Windows":("imputnet/helium-windows","d"*40)}
def fixture():
    lock={"status":"source-pins-verified-build-not-verified","helium":{"repository":"imputnet/helium","commit":H,"chromium_version":"158.0.8127.88"},"platform_packages":{n:{"repository":r,"commit":c,"helium_chromium_submodule":H} for n,(r,c) in PL.items()},"verification":{"native_builds_completed":False}}
    rows=[{"repository":"imputnet/helium","commit":H}]+[{"repository":r,"commit":c} for r,c in PL.values()]
    return lock,rows

class PinTests(unittest.TestCase):
    def test_valid_set(self):
        lock,rows=fixture(); self.assertEqual(validate_pin_set(lock,rows),[])
    def test_gitlink_mismatch(self):
        lock,rows=fixture(); lock["platform_packages"]["Windows"]["helium_chromium_submodule"]="e"*40
        self.assertTrue(any("gitlink" in x for x in validate_pin_set(lock,rows)))
    def test_short_sha(self):
        lock,rows=fixture(); lock["helium"]["commit"]=H[:-1]
        self.assertTrue(any("40-character" in x for x in validate_pin_set(lock,rows)))
    def test_ledger_mismatch(self):
        lock,rows=fixture(); rows[1]["commit"]="f"*40
        self.assertTrue(any("differs from upstream-pins.csv" in x for x in validate_pin_set(lock,rows)))

if __name__=="__main__": unittest.main()
