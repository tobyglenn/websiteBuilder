import copy,json,sys,tempfile,unittest,importlib.util
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'dgx'))
import blog_sections as s
import blog_pipeline as p
ROOT='Original123';CLIP='Excerpt1234'
# Distinct vocabulary makes containment tests meaningful, not repeated filler.
TEXT=[' '.join('word'+str(n) for n in range(i*100,(i+1)*100)) for i in range(16)]
VIDEO={'id':ROOT,'is_short':False,'title':'Full discussion','duration_seconds':960,'chapters':[{'seconds':0,'title':'Training routine'},{'seconds':480,'title':'Building software'}]}
ROWS=[{'start':i*60,'end':(i+1)*60,'text':t} for i,t in enumerate(TEXT)]
def inventory(legacy=(),published=(),extras=()):
 return s.build_inventory([VIDEO]+list(extras),{ROOT:' '.join(TEXT),CLIP:' '.join(TEXT[:7])},{ROOT:{'video_id':ROOT,'segments':ROWS}},legacy,published)
class SectionTests(unittest.TestCase):
 def test_same_original_different_sections_can_be_used(self):
  first=inventory()['sections'][0];x=inventory(published=[s.identity(first)])
  self.assertEqual([v['status'] for v in x['sections']],['covered','available'])
  free=x['sections'][1];s.require_available({'source_section':s.identity(free),'source_video_id':ROOT,'source_url':free['source_url']},x)
  with self.assertRaises(ValueError):s.require_available({'source_section':s.identity(first)},x)
 def test_clips_count_against_original_not_separate_upload(self):
  clip={'id':CLIP,'title':'An excerpt','is_short':False,'duration_seconds':420}
  x=inventory([CLIP],extras=[clip]);a=x['aliases'][CLIP]
  self.assertEqual(a['canonical_range'],{'video_id':ROOT,'start':0,'end':420})
  self.assertFalse(any(z['video_id']==CLIP for z in x['sections']))
  self.assertEqual(x['sections'][0]['start'],420)
  self.assertEqual(x['sections'][1]['status'],'available')
 def test_edited_clip_reserves_disjoint_original_ranges_only(self):
  clip={'id':CLIP,'title':'Edited highlights','is_short':False,'duration_seconds':480}
  text=' '.join(TEXT[:4]+TEXT[10:14])
  x=s.build_inventory([VIDEO,clip],{ROOT:' '.join(TEXT),CLIP:text},{ROOT:{'video_id':ROOT,'segments':ROWS}},[CLIP])
  self.assertEqual(x['aliases'][CLIP]['canonical_ranges'],[{'video_id':ROOT,'start':0,'end':240},{'video_id':ROOT,'start':600,'end':840}])
  self.assertEqual([(r['start'],r['end']) for r in x['coverage']],[(0,240),(600,840)])
  self.assertTrue(any(r['start']==240 and r['end']==480 for r in x['sections']))
 def test_newly_discovered_original_does_not_reset_published_clip_coverage(self):
  clip={'id':CLIP,'title':'Excerpt','is_short':False,'duration_seconds':420}
  x=inventory(published=[{'video_id':CLIP,'start':60,'end':300}],extras=[clip])
  self.assertEqual(x['coverage'][0]['video_id'],ROOT)
  self.assertEqual(x['coverage'][0]['kind'],'remapped-publication')
  self.assertEqual(x['sections'][1]['status'],'available')
 def test_published_coverage_survives_source_formatting(self):
  text="source_section: {\n video_id: 'Original123',\n start: 0, end: 420,\n},"
  self.assertEqual(s.published_sections(text),[{'video_id':ROOT,'start':0,'end':420}])
  with self.assertRaises(ValueError):s.published_sections('source_section: {bad: true},')
 def test_malformed_committed_coverage_fails_closed(self):
  for a,b in [(float('nan'),600),(300,100),(0,2000)]:
   with self.assertRaises(ValueError):inventory(published=[{'video_id':ROOT,'start':a,'end':b}])
 def test_short_never_enters_sources_or_lineage(self):
  clip={'id':CLIP,'title':'A Short','is_short':True,'duration_seconds':420}
  x=inventory([CLIP],extras=[clip]);self.assertEqual(x['excluded_shorts'],1);self.assertFalse(x['aliases'])
  self.assertTrue(all(v['status']=='available' for v in x['sections']))
 def test_unbounded_legacy_is_not_assumed_unused(self):
  self.assertTrue(all(x['status']=='legacy-coverage-unresolved' for x in inventory([ROOT])['sections']))
 def test_timestamps_not_invented_from_flat_text(self):
  x=s.build_inventory([VIDEO],{ROOT:' '.join(TEXT)},{ROOT:{'video_id':ROOT,'segments':[{'text':' '.join(TEXT)}]}},[])
  self.assertFalse(x['sections']);self.assertIn(ROOT,x['holds'])
 def test_unknown_formats_and_clip_parent_timing_are_held(self):
  clip={'id':CLIP,'title':'An excerpt','is_short':False,'duration_seconds':420}
  x=s.build_inventory([VIDEO,clip],{ROOT:' '.join(TEXT),CLIP:' '.join(TEXT[:7])},{},[CLIP])
  self.assertEqual(x['aliases'][CLIP]['hold'],'Original timed captions required')
  self.assertIn(ROOT,x['legacy_unresolved'])
  x=s.build_inventory([{**VIDEO,'is_short':None}],{ROOT:' '.join(TEXT)},{ROOT:{'video_id':ROOT,'segments':ROWS}},[])
  self.assertFalse(x['sections'])
 def test_identity_binds_timing_and_text(self):
  x=inventory();section=x['sections'][0];d={'source_section':s.identity(section),'source_video_id':ROOT,'source_url':section['source_url']}
  s.require_available(d,x)
  d['source_section']['start']=1
  with self.assertRaises(ValueError):s.require_available(d,x)
 def test_partial_chapter_overlap_preserves_unused_remainder(self):
  x=inventory(published=[{'video_id':ROOT,'start':0,'end':60}])
  self.assertEqual(x['sections'][0]['start'],60);self.assertEqual(x['sections'][0]['status'],'available')
  self.assertEqual(x['sections'][0]['words'],700)
 def test_final_publication_rechecks_coverage_before_writes(self):
  with tempfile.TemporaryDirectory() as temp:
   pending=Path(temp)/'pending.json';pending.write_text(json.dumps({'slug':'test','reviewed':True}))
   with patch.object(p,'PENDING',pending),patch.object(p,'ensure_dirs'),patch.object(p,'require_paths'),patch.object(p,'validate_draft'),patch.object(p,'read_used_slugs',return_value=set()),patch.object(p,'source_inventory',return_value=inventory()),patch.object(p,'ensure_thumbnail') as thumb,patch.object(p,'frontend_build') as build:
    with self.assertRaisesRegex(ValueError,'section'):p.publish_stage()
    thumb.assert_not_called();build.assert_not_called()
 def test_metadata_survives_publish_and_no_whole_video_blacklist(self):
  section=inventory()['sections'][0];d={'slug':'test','title':'Test','excerpt':'Test','category':'Reviews','date':'2026-10-14','content':'<p>Test</p>','source_video_id':ROOT,'source_url':section['source_url'],'source_section':s.identity(section),'transcript_basename':ROOT}
  self.assertIn('source_section: '+json.dumps(s.identity(section),sort_keys=True),p.js_entry(d))
  self.assertIn('original video, 0:00–8:00',p.content_with_source(d))
  with tempfile.TemporaryDirectory() as temp:
   root=Path(temp);black=root/'blacklist.txt';black.write_text('');pending=root/'pending.json';pending.write_text('{}')
   with patch.object(p,'BLACKLIST',black),patch.object(p,'PENDING',pending):p.finalize_published_draft(d)
   self.assertNotIn(ROOT,black.read_text())
class CaptionImporterTests(unittest.TestCase):
 def setUp(self):
  file=Path(__file__).resolve().parents[1]/'fetch_transcripts.py'
  spec=importlib.util.spec_from_file_location('fetch_transcripts',file)
  self.f=importlib.util.module_from_spec(spec);spec.loader.exec_module(self.f)
 def test_shorts_and_unknown_format_always_excluded(self):
  for flag in [True,None]:
   video={'id':CLIP,'title':'Example','is_short':flag,'duration_seconds':4000}
   self.assertFalse(self.f.eligible_for_article(video))
   self.assertEqual(self.f.queue_item(video,{CLIP},{})['status'],'excluded_short_or_unknown')
 def test_fetch_preserves_actual_caption_intervals(self):
  from types import SimpleNamespace
  captions=[SimpleNamespace(start=12.3,duration=2.5,text=' '.join(TEXT[:1])),SimpleNamespace(start=14.8,duration=3,text='More evidence')]
  api=SimpleNamespace(fetch=lambda *args,**kwargs:captions)
  with patch.dict(sys.modules,{'youtube_transcript_api':SimpleNamespace(YouTubeTranscriptApi=lambda:api)}):
   text,lang,segments=self.f.fetch_transcript(ROOT)
  self.assertEqual(segments[0]['start'],12.3);self.assertEqual(segments[0]['end'],14.8)
  self.assertEqual(segments[1]['start'],14.8);self.assertIn('More evidence',text)

if __name__=='__main__':unittest.main()
