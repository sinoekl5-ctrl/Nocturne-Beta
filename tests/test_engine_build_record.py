import copy,json,sys,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; sys.path.insert(0,str(ROOT/"scripts"))
from validate_engine_build_record import validate_record
class BuildRecordTests(unittest.TestCase):
 def setUp(self): self.lock=json.loads((ROOT/"docs/third-party/engine-set.json").read_text()); self.record=json.loads((ROOT/"docs/engine-build-record-template.json").read_text())
 def test_template_valid_not_run(self): self.assertEqual(validate_record(self.record,self.lock),[])
 def test_template_cannot_claim_success(self): self.assertTrue(any("not succeeded" in e for e in validate_record(self.record,self.lock,True)))
 def test_success_requires_lock_and_runtime_evidence(self):
  r=copy.deepcopy(self.record); r["status"]="succeeded"; r["source"]["platform"]="Linux"; errors=validate_record(r,self.lock)
  self.assertTrue(any("platform commit" in e for e in errors)); self.assertTrue(any("real_navigation_success" in e for e in errors))
 def test_failed_build_requires_blocker(self):
  r=copy.deepcopy(self.record); r["status"]="failed"; self.assertTrue(any("known_blockers" in e for e in validate_record(r,self.lock)))
 def test_build_only_record_does_not_claim_runtime(self):
  r=copy.deepcopy(self.record); r["status"]="built-not-smoke-tested"; r["source"].update(nocturne_commit="x",platform="Linux",platform_repository="imputnet/helium-linux",platform_commit=self.lock["platform_packages"]["Linux"]["commit"],helium_root_commit=self.lock["helium"]["commit"],chromium_version=self.lock["helium"]["chromium_version"]); r["host"].update(os_name="Linux",os_version_or_distro="test",architecture="x64",cpu_model_and_cores="cpu",physical_ram_bytes=100,free_disk_bytes_before=100,toolchain_versions={"python":"3"}); r["build"].update(command="build",command_log_path="log",exit_code=0,elapsed_seconds=2,artifact_sha256={"pkg":"a"*64}); r["verification"].update(source_shas_match_lock=True,build_completed=True); self.assertEqual(validate_record(r,self.lock),[])
if __name__=="__main__": unittest.main()
