import sys, unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from engine.checkout import make_plan

class CheckoutPlanTests(unittest.TestCase):
    def test_plan_is_pinned_and_recursive(self):
        lock={"platform_packages":{"Linux":{"repository":"imputnet/helium-linux","commit":"a"*40,"helium_chromium_submodule":"b"*40}}}
        plan=make_plan(lock,"Linux",Path("/tmp/nocturne-engine"))
        self.assertEqual(plan["commit"],"a"*40)
        self.assertEqual(plan["submodule_commit"],"b"*40)
        self.assertEqual(plan["commands"][2][-1],"--recursive")
        self.assertIn("--no-checkout",plan["commands"][0])
    def test_rejects_unknown_platform(self):
        with self.assertRaises(ValueError):
            make_plan({"platform_packages":{}},"Plan9",Path("/tmp/nocturne-engine"))

if __name__=="__main__": unittest.main()
