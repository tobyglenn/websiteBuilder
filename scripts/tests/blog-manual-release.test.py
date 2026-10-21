#!/usr/bin/env python3
"""Approval boundary tests; all approvals and git pushes use temporary test data."""
import base64
import copy
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

spec=importlib.util.spec_from_file_location('release',Path(__file__).parents[1]/'dgx/blog_release.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)


def fixture():
    image=b'\xff\xd8\xfftest-image'
    text='A complete public source paragraph for this isolated test.'
    return {'schema':m.SCHEMA,'article':{'slug':'test-reviewed-article','title':'A test article','excerpt':'An isolated test of the publishing boundary.','category':'Build Logs','date':'2026-10-21','readTime':'2 min read','thumbnail':'/images/blog/test-reviewed-article.jpg','tags':['testing','review'],'content':'<h2>Review boundary</h2><p>This is isolated test content.</p>'},'sources':[{'id':'test-source','text':text,'sha256':m.sha(text.encode()),'url':'https://example.com/source'}],'assets':[{'path':'frontend/public/images/blog/test-reviewed-article.jpg','sha256':m.sha(image),'base64':base64.b64encode(image).decode()}],'translations':[]}


class Boundary(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory();self.old=m.STATE;m.STATE=Path(self.tmp.name)/'state'
    def tearDown(self):m.STATE=self.old;self.tmp.cleanup()
    def test_stage_does_not_approve(self):
        r=m.stage(fixture());self.assertFalse((m.STATE/'approvals').exists());self.assertEqual(r['status'],'awaiting_user_review');self.assertTrue(Path(r['review_path']).exists())
    def test_unapproved_publish_cannot_build_or_push(self):
        h=m.stage(fixture())['sha256']
        with patch.object(m,'run') as run:
            with self.assertRaisesRegex(ValueError,'no explicit user approval'):m.publish(h)
            run.assert_not_called()
    def test_all_published_material_changes_version(self):
        original=fixture();h=m.validate(original)
        for mutate in [lambda p:p['article'].update(date='2026-10-22'),lambda p:p['article'].update(title='Revised title'),lambda p:p['article'].update(tags=['changed','review']),lambda p:p['article'].update(content='<h2>Revised</h2><p>Changed text.</p>'),lambda p:p['sources'][0].update(title='Changed evidence metadata')]:
            p=copy.deepcopy(original);mutate(p);self.assertNotEqual(h,m.validate(p))
    def test_image_change_changes_version(self):
        p=fixture();h=m.validate(p);data=b'\xff\xd8\xffchanged';p['assets'][0].update(base64=base64.b64encode(data).decode(),sha256=m.sha(data));self.assertNotEqual(h,m.validate(p))
    def test_tampered_staged_package_is_held(self):
        h=m.stage(fixture())['sha256'];p=m.STATE/'packages'/h/'package.json';p.chmod(0o600);d=json.loads(p.read_text());d['article']['title']='Altered';p.write_text(json.dumps(d))
        with self.assertRaisesRegex(ValueError,'changed after versioning'):m.load_package(h)
    def test_draft_cannot_supply_approval(self):
        p=fixture();p['approval']={'approved':True}
        with self.assertRaises(ValueError):m.validate(p)
    def test_approval_is_exact_and_idempotent(self):
        h=m.stage(fixture())['sha256'];a=m.record_approval(h,'isolated-test-user-message');self.assertEqual(a,m.record_approval(h,'later-message'));self.assertEqual(m.require_approval(h),a)
        p=fixture();p['article']['title']='Another version';h2=m.stage(p)['sha256']
        with self.assertRaises(ValueError):m.require_approval(h2)
    def test_asset_and_source_tampering_rejected(self):
        for field in ('assets','sources'):
            p=fixture();p[field][0]['sha256']='0'*64
            with self.assertRaises(ValueError):m.validate(p)
    def test_paths_cannot_escape_blog_assets(self):
        for path in ['../outside.jpg','/tmp/out.jpg','frontend/public/images/blog/../bad.jpg','frontend/public/images/blog/test.svg']:
            p=fixture();p['assets'][0]['path']=path
            with self.assertRaises(ValueError):m.validate(p)
    def test_executable_html_rejected(self):
        for text in ['<h2>X</h2><script>alert(1)</script>','<h2 onclick="x">X</h2>','<h2>X</h2><a href="javascript:x">bad</a>','<h2>X</h2><p>unclosed']:
            p=fixture();p['article']['content']=text
            with self.assertRaises(ValueError):m.validate(p)
    def test_partial_translation_set_rejected(self):
        p=fixture();p['translations']=[{'lang':'de'}]
        with self.assertRaises(ValueError):m.validate(p)
    def test_publication_receipt_must_match_version(self):
        h=m.stage(fixture())['sha256'];m.record_approval(h,'test-user-approval');m.write_json(m.STATE/'receipts'/(h+'.json'),{'schema':m.SCHEMA,'sha256':'0'*64,'slug':'wrong','status':'pushed'})
        with self.assertRaisesRegex(ValueError,'receipt does not match'):m.publish(h)
    def test_empty_approval_reference_rejected(self):
        h=m.stage(fixture())['sha256']
        with self.assertRaises(ValueError):m.record_approval(h,' ')


class IsolatedGit(unittest.TestCase):
    """Real git workflow against a local bare remote; fake render/build executables."""
    def setUp(self):
        Boundary.setUp(self);self.old_repo=m.REPO;self.old_path=os.environ['PATH'];root=Path(self.tmp.name);m.REPO=root/'repo';m.REPO.mkdir();self.remote=root/'remote.git'
        self.git('init','--bare',str(self.remote),cwd=root);self.git('init','-b','main');self.git('config','user.email','test@example.invalid');self.git('config','user.name','Isolated Test')
        (m.REPO/'frontend/src/data').mkdir(parents=True);(m.REPO/'frontend/src/data/mock.js').write_text('export const BLOG_POSTS = [\n];\n');(m.REPO/'frontend/node_modules').mkdir()
        self.git('add','.');self.git('commit','-m','fixture');self.git('remote','add','origin',str(self.remote));self.git('push','-u','origin','main')
        self.bin=root/'bin';self.bin.mkdir()
        for cmd in ['node','npm']:
            p=self.bin/cmd;p.write_text('#!/bin/sh\necho "isolated '+cmd+' passed"\n');p.chmod(0o755)
        os.environ['PATH']=str(self.bin)+os.pathsep+self.old_path
    def tearDown(self):os.environ['PATH']=self.old_path;m.REPO=self.old_repo;Boundary.tearDown(self)
    def git(self,*args,cwd=None):return subprocess.check_output(['git',*args],cwd=cwd or m.REPO,stderr=subprocess.DEVNULL,text=True).strip()
    def test_preflight_does_not_approve_or_push(self):
        before=self.git('rev-parse','origin/main');h=m.stage(fixture())['sha256'];r=m.publish(h,dry_run=True);self.assertEqual(r['status'],'preflight_passed');self.assertEqual(before,self.git('rev-parse','origin/main'));self.assertFalse((m.STATE/'approvals').exists())
    def test_approved_publication_and_repeat_are_idempotent(self):
        h=m.stage(fixture())['sha256'];m.record_approval(h,'isolated-test-approval');r=m.publish(h);self.assertEqual(r['status'],'pushed');self.assertIn('test-reviewed-article',self.git('show','origin/main:frontend/src/data/mock.js'))
        with patch.object(m,'run') as run:self.assertEqual(m.publish(h),r);run.assert_not_called()
    def test_failed_build_never_pushes(self):
        before=self.git('rev-parse','origin/main');(self.bin/'npm').write_text('#!/bin/sh\necho "TypeError: isolated failure"\nexit 1\n');h=m.stage(fixture())['sha256'];m.record_approval(h,'test-approval')
        with self.assertRaisesRegex(RuntimeError,'TypeError: isolated failure'):m.publish(h)
        self.assertEqual(before,self.git('rev-parse','origin/main'));self.assertFalse((m.STATE/'receipts'/(h+'.json')).exists());self.assertTrue((m.STATE/'approvals'/(h+'.json')).exists())
    def test_uncertain_push_is_reconciled_without_duplicate(self):
        h=m.stage(fixture())['sha256'];m.record_approval(h,'test-approval');real=m.log_command
        def uncertain(args,cwd,log):
            out=real(args,cwd,log)
            if args[:2]==['git','push']:raise RuntimeError('isolated lost response after push')
            return out
        with patch.object(m,'log_command',side_effect=uncertain):
            with self.assertRaisesRegex(RuntimeError,'lost response'):m.publish(h)
        count=self.git('rev-list','--count','origin/main');r=m.publish(h);self.assertEqual(r['status'],'pushed');self.assertEqual(count,self.git('rev-list','--count','origin/main'));self.assertEqual(self.git('rev-parse','HEAD'),self.git('rev-parse','origin/main'))


if __name__=='__main__':unittest.main()
