import copy,json,sys,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; sys.path.insert(0,str(ROOT/"scripts"))
from validate_engine_build_record import validate_record
class BuildRecordTests(unittest.TestCase):
 def setUp(self):
  self.lock=json.loads((ROOT/"docs/third-party/engine-set.json").read_text()); self.record=json.loads((ROOT/"docs/engine-build-record-template.json").read_text())
 def test_template_valid_not_run(self): self.assertEqual(validate_record(self.record,self.lock),[])
 def test_template_cannot_claim_success(self): self.assertTrue(any("not succeeded" in e for e in validate_record(self.record,self.lock,True)))
 def test_success_requires_lock_and_runtime_evidence(self):
  r=copy.deepcopy(self.record); r["status"]="succeeded"; r["source"]["platform"]="Linux"; errors=validate_record(r,self.lock)
  self.assertTrue(any("platform commit" in e for e in errors)); self.assertTrue(any("real_navigation_success" in e for e in errors))
 def test_failed_build_requires_blocker(self):
  r=copy.deepcopy(self.record); r["status"]="failed"; self.assertTrue(any("known_blockers" in e for e in validate_record(r,self.lock)))
if __name__=="__main__": unittest.main()
