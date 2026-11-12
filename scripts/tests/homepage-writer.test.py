#!/usr/bin/env python3
"""Exercise writer recovery using disposable local remotes, never production."""
import pathlib, subprocess, tempfile, unittest

WRAPPER = pathlib.Path(__file__).parents[1] / 'dgx/runtime/wrappers/refresh_website_homepage.sh'
FUNCTIONS = WRAPPER.read_text().split('# BEGIN WEBSITE_GIT_FUNCTIONS', 1)[1].split('\n', 1)[1].split('# END WEBSITE_GIT_FUNCTIONS', 1)[0]
DATA = 'frontend/src/data/siteMetrics.json'

class WriterTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = pathlib.Path(self.tmp.name)
        self.remote = self.root / 'remote.git'
        self.local = self.root / 'writer'
        self.other = self.root / 'other'
        self.git(self.root, 'init', '--bare', '--initial-branch=main', str(self.remote))
        self.git(self.root, 'clone', str(self.remote), str(self.local))
        self.configure(self.local)
        self.write(self.local, DATA, '{"value": 1}\n')
        self.write(self.local, 'README.md', 'base\n')
        self.git(self.local, 'add', '.')
        self.git(self.local, 'commit', '-m', 'base')
        self.git(self.local, 'push', 'origin', 'main')
        self.git(self.root, 'clone', str(self.remote), str(self.other))
        self.configure(self.other)
        self.helper = self.root / 'functions.sh'
        self.helper.write_text('set -uo pipefail\nTODAY=test\nwarn() { echo "$*" >&2; }\n' + FUNCTIONS)
    def tearDown(self): self.tmp.cleanup()
    def git(self, cwd, *args):
        return subprocess.check_output(['git', *args], cwd=cwd, stderr=subprocess.STDOUT, text=True).strip()
    def configure(self, cwd):
        self.git(cwd, 'config', 'user.email', 'test@example.invalid')
        self.git(cwd, 'config', 'user.name', 'Test')
    def write(self, cwd, name, text):
        p = cwd / name; p.parent.mkdir(parents=True, exist_ok=True); p.write_text(text)
    def runfn(self, body):
        return subprocess.run(['bash', '-c', f'source "{self.helper}"; {body}'], cwd=self.local, capture_output=True, text=True)
    def advance(self, name='remote.txt', text='remote\n'):
        self.write(self.other, name, text)
        self.git(self.other, 'add', name); self.git(self.other, 'commit', '-m', 'remote update'); self.git(self.other, 'push', 'origin', 'main')
    def test_dirty_metrics_checkpoint_and_remote_advance(self):
        self.write(self.local, DATA, '{"value": 2}\n'); self.advance()
        r=self.runfn('website_preflight'); self.assertEqual(r.returncode,0,r.stderr)
        self.assertEqual(self.git(self.local,'status','--porcelain'),'')
        self.assertEqual((self.local/DATA).read_text(),'{"value": 2}\n')
        self.assertTrue((self.local/'remote.txt').exists())
    def test_unrelated_staged_edit_preserved(self):
        self.write(self.local,'README.md','private\n'); self.git(self.local,'add','README.md')
        before=self.git(self.local,'rev-parse','HEAD'); r=self.runfn('website_preflight')
        self.assertNotEqual(r.returncode,0); self.assertEqual(before,self.git(self.local,'rev-parse','HEAD'))
        self.assertEqual(self.git(self.local,'diff','--cached','--name-only'),'README.md')
    def test_unknown_local_commit_preserved(self):
        self.write(self.local,DATA,'{}\n'); self.git(self.local,'add',DATA); self.git(self.local,'commit','-m','user change')
        before=self.git(self.local,'rev-parse','HEAD'); r=self.runfn('website_preflight')
        self.assertNotEqual(r.returncode,0); self.assertEqual(before,self.git(self.local,'rev-parse','HEAD'))
    def test_allowlisted_local_commit_rebases(self):
        self.write(self.local,DATA,'{}\n'); self.git(self.local,'add',DATA); self.git(self.local,'commit','-m','update: homepage refresh old'); self.advance()
        r=self.runfn('website_preflight'); self.assertEqual(r.returncode,0,r.stderr)
        self.assertTrue((self.local/'remote.txt').exists())
    def test_conflict_aborts_and_preserves_checkpoint(self):
        self.write(self.local,DATA,'{"value": 2}\n'); self.advance(DATA,'{"value": 3}\n')
        r=self.runfn('website_preflight'); self.assertNotEqual(r.returncode,0)
        self.assertFalse((self.local/'.git/rebase-merge').exists())
        self.assertEqual((self.local/DATA).read_text(),'{"value": 2}\n')
        self.assertEqual(self.git(self.local,'log','-1','--format=%s'),'chore: pre-refresh checkpoint test')
    def test_unexpected_build_output_rejected(self):
        self.write(self.local,DATA,'{}\n'); self.write(self.local,'unrelated.txt','private\n')
        r=self.runfn('stage_homepage_outputs'); self.assertNotEqual(r.returncode,0)
        self.assertEqual(self.git(self.local,'diff','--cached','--name-only'),'')
    def test_generated_commit_excludes_late_staged_change(self):
        self.write(self.local,DATA,'{}\n'); self.assertEqual(self.runfn('stage_homepage_outputs').returncode,0)
        self.write(self.local,'README.md','private\n'); self.git(self.local,'add','README.md')
        r=self.runfn('commit_homepage_outputs "update: homepage refresh test"'); self.assertNotEqual(r.returncode,0)
    def test_push_race_reconciles_local_remote(self):
        self.write(self.local,DATA,'{}\n'); self.assertEqual(self.runfn('website_preflight').returncode,0)
        self.advance()
        r=self.runfn('push_with_rebase_retry'); self.assertEqual(r.returncode,0,r.stderr)
        self.assertEqual(self.git(self.local,'rev-parse','HEAD'),self.git(self.remote,'rev-parse','main'))

    def test_checkpoint_only_still_publishes(self):
        self.write(self.local,DATA,'{}\n')
        r=self.runfn('website_preflight && finish_homepage_publish')
        self.assertEqual(r.returncode,0,r.stderr)
        self.assertEqual(self.git(self.local,'rev-parse','HEAD'),self.git(self.remote,'rev-parse','main'))
        self.assertEqual(self.git(self.local,'log','-1','--format=%s'),'chore: pre-refresh checkpoint test')
    def test_existing_pending_refresh_still_publishes(self):
        self.write(self.local,DATA,'{}\n'); self.git(self.local,'add',DATA)
        self.git(self.local,'commit','-m','update: homepage refresh earlier')
        r=self.runfn('website_preflight && finish_homepage_publish')
        self.assertEqual(r.returncode,0,r.stderr)
        self.assertEqual(self.git(self.local,'rev-parse','HEAD'),self.git(self.remote,'rev-parse','main'))
    def test_late_unrelated_commit_not_published(self):
        self.write(self.local,DATA,'{}\n'); self.git(self.local,'add',DATA)
        self.git(self.local,'commit','-m','user change')
        before=self.git(self.remote,'rev-parse','main')
        r=self.runfn('finish_homepage_publish')
        self.assertNotEqual(r.returncode,0)
        self.assertEqual(before,self.git(self.remote,'rev-parse','main'))

if __name__ == '__main__': unittest.main()
