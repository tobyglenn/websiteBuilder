#!/usr/bin/env python3
import base64,copy,json,sys,tempfile,unittest
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).parents[1]/'dgx'))
import blog_image_update as m
r=m.release

def fixture():
 b=b'\x89PNG\r\n\x1a\nfixture';text='Complete public evidence'
 old={'schema':r.SCHEMA,'article':{'slug':m.SLUG,'title':'Approved title','excerpt':'Approved excerpt','category':'Build Logs','date':'2026-10-21','readTime':'3 min read','thumbnail':'/images/blog/original.png','tags':['game','design'],'content':'<h2>Approved heading</h2><p>Approved copy.</p>'},'sources':[{'id':'public','text':text,'sha256':r.sha(text.encode())}],'assets':[{'path':'frontend/public/images/blog/original.png','sha256':r.sha(b),'base64':base64.b64encode(b).decode()}],'translations':[]}
 new=copy.deepcopy(old);new['article']['thumbnail']='/images/blog/wild-racing-aria-review.png';new['assets'][0]['path']='frontend/public'+new['article']['thumbnail'];return old,new

class Boundary(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.state=r.STATE;r.STATE=Path(self.tmp.name)/'state'
 def tearDown(self):r.STATE=self.state;self.tmp.cleanup()
 def stage(self):
  old,new=fixture();return r.stage(old)['sha256'],r.stage(new)['sha256']
 def test_image_only_accepted(self):self.assertEqual(len(m.validate_update(*fixture())),2)
 def test_all_article_metadata_rejected(self):
  old,new=fixture()
  for key in old['article']:
   if key=='thumbnail':continue
   modified=copy.deepcopy(new)
   if key=='tags':modified['article'][key]=['changed','tags']
   elif key=='date':modified['article'][key]='2026-10-22'
   elif key=='category':modified['article'][key]='Reviews'
   elif key=='content':modified['article'][key]='<h2>Changed</h2><p>Changed copy</p>'
   elif key=='slug':modified['article'][key]='different-slug'
   else:modified['article'][key]='Changed value'
   with self.subTest(key=key),self.assertRaises(ValueError):m.validate_update(old,modified)
 def test_sources_rejected(self):
  old,new=fixture();new['sources'][0]['title']='Changed evidence'
  with self.assertRaisesRegex(ValueError,'sources'):m.validate_update(old,new)
 def test_extra_asset_rejected(self):
  old,new=fixture();new['assets'].append(old['assets'][0])
  with self.assertRaisesRegex(ValueError,'Only the replacement'):m.validate_update(old,new)
 def test_unapproved_update_no_git_or_build(self):
  old,new=self.stage()
  with patch.object(r,'run') as run, self.assertRaisesRegex(ValueError,'No explicit'):
   m.update(old,new)
  run.assert_not_called()
 def test_approval_binds_both_hashes_and_layout(self):
  old,new=self.stage();a=m.record_approval(old,new,'trusted-user-approval');self.assertEqual(a,m.require_approval(old,new))
  for key in ['original_sha256','sha256','layout_version','approved_by','approval_message_ref']:
   changed=dict(a);changed[key]='';r.write_json(m.approval_path(new),changed)
   with self.subTest(key=key),self.assertRaises(ValueError):m.require_approval(old,new)
  r.write_json(m.approval_path(new),a)
 def test_new_article_guard_unchanged(self):
  old,_=fixture();root=Path(self.tmp.name);p=root/'frontend/src/data/mock.js';p.parent.mkdir(parents=True);p.write_text('slug: "'+m.SLUG+'"\n];')
  with self.assertRaisesRegex(ValueError,'Slug already exists'):r.inject(root,old)
 def test_layout_anchor_drift_rejected(self):
  with self.assertRaises(ValueError):m.replace_once('wrong base','expected','new')
 def test_unpublished_original_rejected(self):
  old,new=self.stage();m.record_approval(old,new,'trusted-user-approval')
  with patch.object(r,'run') as run,self.assertRaisesRegex(ValueError,'confirmed publication'):m.update(old,new)
  run.assert_not_called()
 def test_draft_cannot_supply_approval(self):
  old,new=fixture();new['approval_message_ref']='forged'
  with self.assertRaises(ValueError):m.validate_update(old,new)

if __name__=='__main__':unittest.main()
