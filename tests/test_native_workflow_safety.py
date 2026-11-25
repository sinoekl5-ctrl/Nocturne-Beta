from pathlib import Path
import unittest


class NativeWorkflowSafetyTests(unittest.TestCase):
    def test_windows_native_build_fails_on_nonzero_python_exit(self):
        workflow = Path('.github/workflows/native-engine-build.yml').read_text(encoding='utf-8')
        self.assertIn('if ($LASTEXITCODE -ne 0)', workflow)
        self.assertIn("Invoke-CheckedPython -Arguments @('build.py')", workflow)
        self.assertIn("Invoke-CheckedPython -Arguments @('package.py')", workflow)

    def test_windows_artifact_capture_searches_nested_outputs(self):
        workflow = Path('.github/workflows/native-engine-build.yml').read_text(encoding='utf-8')
        self.assertIn('Get-ChildItem -Path "$root\\build" -File -Recurse', workflow)
        self.assertIn("'.exe','.zip','.msi'", workflow)


if __name__ == '__main__':
    unittest.main()
