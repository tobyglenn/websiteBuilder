#!/usr/bin/env python3
"""Offline transaction tests; only disposable local Git repositories are pushed."""
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

SOURCE = Path(__file__).resolve().parents[1] / 'dgx/runtime/publish_podcast_website_update.py'
spec = importlib.util.spec_from_file_location('publisher', SOURCE)
publisher = importlib.util.module_from_spec(spec)
spec.loader.exec_module(publisher)

class PublisherTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.remote = self.root/'remote.git'; self.repo = self.root/'repo'
        self.git('init','--bare',str(self.remote),cwd=self.root)
        self.git('clone',str(self.remote),str(self.repo),cwd=self.root)
        self.git('config','user.name','Test'); self.git('config','user.email','test@example.invalid')
        self.git('checkout','-b','main')
        (self.repo/'frontend/scripts').mkdir(parents=True)
        (self.repo/'frontend/scripts/sync-podcast-assets.mjs').write_text('// stub executed by fake node')
        (self.repo/'readme').write_text('baseline')
        self.git('add','.');self.git('commit','-m','base');self.git('push','origin','main')
        self.staging=self.root/'staging'; self.staging.mkdir()
        self.name='episode_128_cover_hi.png';(self.staging/self.name).write_bytes(b'approved-public-cover')
        self.node=self.root/'fake-node'
        self.node.write_text('''#!/usr/bin/env python3
import json,sys
from pathlib import Path
root=Path.cwd();p=root/'frontend/src/data/podcast-assets.json';p.parent.mkdir(parents=True,exist_ok=True)
d=json.loads(p.read_text()) if p.exists() else {};d['episode_128']='new';p.write_text(json.dumps(d))
print(json.dumps({'paths':['frontend/src/data/podcast-assets.json']}))
''')
        self.node.chmod(0o755)
        self.env=patch.dict(os.environ,{'WEBSITE_NODE':str(self.node)});self.env.start()
    def tearDown(self):
        self.env.stop();self.tmp.cleanup()
    def git(self,*args,cwd=None):
        return subprocess.check_output(['git',*args],cwd=cwd or self.repo,stderr=subprocess.STDOUT,text=True).strip()
    def publish(self):
        return publisher.publish(self.repo,self.staging,128,[self.name],'EP128 approved artwork','EP128 trigger')
    def test_preserves_divergent_local_and_dirty_index(self):
        (self.repo/'local').write_text('local');self.git('add','local');self.git('commit','-m','unrelated local')
        (self.repo/'readme').write_text('staged local');self.git('add','readme')
        (self.repo/'unstaged').write_text('keep')
        head=self.git('rev-parse','HEAD');status=self.git('status','--porcelain')
        self.assertIn('pushed',self.publish())
        self.assertEqual(head,self.git('rev-parse','HEAD'));self.assertEqual(status,self.git('status','--porcelain'))
        self.assertEqual('baseline',self.git('show','origin/main:readme'))
        self.assertEqual(1,len(self.git('rev-list',head+'..origin/main').splitlines()))
    def test_idempotent_receipt(self):
        self.publish();first=self.git('rev-parse','origin/main')
        self.assertIn('already pushed',self.publish());self.assertEqual(first,self.git('rev-parse','origin/main'))
    def test_invalid_cover(self):
        with self.assertRaises(ValueError):publisher.publish(self.repo,self.staging,129,[self.name],'x','x')
    def test_unexpected_import_paths_rejected(self):
        self.node.write_text('#!/usr/bin/env python3\nprint(\'{"paths":["readme"]}\')\n')
        before=self.git('rev-parse','origin/main')
        with self.assertRaisesRegex(RuntimeError,'unexpected paths'):self.publish()
        self.assertEqual(before,self.git('rev-parse','origin/main'))
    def test_rejected_push_keeps_receipt_and_pending_ref(self):
        hook=self.remote/'hooks/pre-receive';hook.write_text('#!/bin/sh\nexit 1\n');hook.chmod(0o755)
        before=self.git('rev-parse','origin/main')
        with self.assertRaisesRegex(RuntimeError,'not confirmed'):self.publish()
        self.assertEqual(before,self.git('rev-parse','origin/main'))
        self.assertTrue(self.git('for-each-ref','refs/website-podcast-pending'))
        receipt=next((self.repo/'.git/website-podcast-receipts').glob('*.json'))
        self.assertEqual('push_pending',json.loads(receipt.read_text())['status'])
    def test_remote_race_rebuilds_preserving_other_writer(self):
        rival=self.root/'rival';self.git('clone','--branch','main',str(self.remote),str(rival),cwd=self.root)
        self.git('config','user.name','Other',cwd=rival);self.git('config','user.email','other@example.invalid',cwd=rival)
        original=publisher.run; raced=False
        def run(cmd,cwd=None,check=True):
            nonlocal raced
            if cmd[:2]==['git','push'] and not raced:
                raced=True;p=rival/'frontend/src/data/podcast-assets.json';p.parent.mkdir(parents=True,exist_ok=True);p.write_text('{"episode_127":"keep"}')
                self.git('add','.',cwd=rival);self.git('commit','-m','other writer',cwd=rival);self.git('push','origin','main',cwd=rival)
            return original(cmd,cwd,check)
        with patch.object(publisher,'run',run):self.publish()
        data=json.loads(self.git('show','origin/main:frontend/src/data/podcast-assets.json'))
        self.assertEqual({'episode_127':'keep','episode_128':'new'},data)
    def test_same_cover_remote_race_requires_review(self):
        rival=self.root/'rival';self.git('clone','--branch','main',str(self.remote),str(rival),cwd=self.root)
        self.git('config','user.name','Other',cwd=rival);self.git('config','user.email','other@example.invalid',cwd=rival)
        original=publisher.run; raced=False
        def run(cmd,cwd=None,check=True):
            nonlocal raced
            if cmd[:2]==['git','push'] and not raced:
                raced=True;p=rival/'frontend/src/data/podcast-assets.json';p.parent.mkdir(parents=True,exist_ok=True)
                p.write_text(json.dumps({'images':{'/images/podcast/'+self.name:{'sha256':'other-approved-version'}}}))
                self.git('add','.',cwd=rival);self.git('commit','-m','same-cover writer',cwd=rival);self.git('push','origin','main',cwd=rival)
            return original(cmd,cwd,check)
        with patch.object(publisher,'run',run):
            with self.assertRaisesRegex(RuntimeError,'cover changed'):self.publish()
        self.assertIn('other-approved-version',self.git('show','origin/main:frontend/src/data/podcast-assets.json'))
    def test_uncertain_push_is_reconciled(self):
        original=publisher.run
        def run(cmd,cwd=None,check=True):
            result=original(cmd,cwd,check)
            if cmd[:2]==['git','push']:return subprocess.CompletedProcess(cmd,1,result.stdout,'simulated lost acknowledgement')
            return result
        with patch.object(publisher,'run',run):self.assertIn('pushed',self.publish())

if __name__=='__main__':unittest.main()
