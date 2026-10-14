import sys, tempfile, unittest, json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'dgx'))
import blog_source_identity as identity
import blog_pipeline as pipeline
class IdentityTests(unittest.TestCase):
 def test_quoted_legacy_slugs_markdown_and_explicit_sources(self):
  with tempfile.TemporaryDirectory() as d:
   r=Path(d);m=r/'mock.js';m.write_text('''const posts=[{"slug":"old-post", "source_video_id":"AbCdEfGhI12"}, {slug:"new-post",thumbnail:"https://i.ytimg.com/vi/FALSEIMAGE1/default.jpg"}];''');pages=r/'pages';pages.mkdir();(pages/'guide.md').write_text('[source](/video/ZYXWVUTSR12/)')
   self.assertEqual(identity.read_used_slugs(m,pages),{'old-post','new-post','guide'})
   ids=identity.published_video_ids(m,pages,{'renamed.txt':{'is_short':False,'video_id':'BacklogId12'}},{'renamed'},lambda p:p.stem)
   self.assertEqual(ids,{'AbCdEfGhI12','ZYXWVUTSR12','BacklogId12'})
   with self.assertRaisesRegex(ValueError,'already has blog coverage'): identity.assert_unpublished_source({'source_video_id':'AbCdEfGhI12'},ids)
   with self.assertRaisesRegex(ValueError,'verified source'): identity.assert_unpublished_source({},ids)
   self.assertEqual(identity.assert_unpublished_source({'source_video_id':'NewVideo123'},ids),'NewVideo123')
 def test_published_record_keeps_identity_and_escapes_values(self):
  draft={'slug':'test','title':'Test','excerpt':'Example','category':'Reviews','date':'2026-10-14','content':'<p>"quote"</p>','source_video_id':'AbCdEfGhI12','source_url':'https://www.youtube.com/watch?v=AbCdEfGhI12'}
  entry=pipeline.js_entry(draft)
  self.assertIn('source_video_id: "AbCdEfGhI12"',entry)
  self.assertIn('source_url: "https://www.youtube.com/watch?v=AbCdEfGhI12"',entry)

if __name__=='__main__':unittest.main()
