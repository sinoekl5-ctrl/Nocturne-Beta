import hashlib,sys,tempfile,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]; sys.path.insert(0,str(ROOT/"scripts/engine"))
from capture_build_record import sha256_file
class CaptureBuildRecordTests(unittest.TestCase):
 def test_sha256_streams_artifact_bytes(self):
  with tempfile.TemporaryDirectory() as tmp:
   p=Path(tmp)/"artifact.bin"; p.write_bytes(b"Nocturne engine evidence")
   self.assertEqual(sha256_file(p),hashlib.sha256(b"Nocturne engine evidence").hexdigest())
if __name__=="__main__": unittest.main()
