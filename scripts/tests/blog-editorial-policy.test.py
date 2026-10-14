import json,sys,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'scripts/dgx'))
from blog_editorial_policy import existing_guide
GUIDES=json.loads((ROOT/'frontend/src/data/blog-consolidations.json').read_text())
class EditorialPolicy(unittest.TestCase):
 def test_repeat_intents_are_updates(self):
  self.assertEqual(existing_guide('Tonal vs Speediance: which should I buy?',GUIDES),'speediance-vs-tonal-comparison')
  self.assertEqual(existing_guide('Speediance 2S: how to unlock 260 with 1RM',GUIDES),'speediance-1rm-system-exposed')
  self.assertEqual(existing_guide('Is Mike Israetel a legit black belt?',GUIDES),'mike-israetel-bjj-black-belt-defence')
 def test_distinct_developments_remain_eligible(self):
  for title in ['Speediance partner custom workouts are finally here','My first BJJ tournament','Tonal announces a new hardware model','WHOOP garment durability','Building an AI workout assistant']:
   self.assertIsNone(existing_guide(title,GUIDES),title)


import tempfile
from unittest.mock import patch
import blog_pipeline as pipeline

class TopicRotation(unittest.TestCase):
 def test_candidate_selection_preserves_other_topics_and_holds_repeats(self):
  items=[(Path('tonal.txt'),'tonal'),(Path('bjj.txt'),'bjj')]
  with patch.object(pipeline,'transcript_index',return_value={}), patch.object(pipeline,'editorial_score',return_value=1), patch.object(pipeline,'transcript_word_count',return_value=1000), patch.object(pipeline,'topic_rotation',return_value={'previous':[], 'candidates':[{'allowed':False},{'allowed':True}]}):
   self.assertEqual(pipeline.prioritize_transcripts(items), [items[1]])
  with patch.object(pipeline,'transcript_index',return_value={}), patch.object(pipeline,'topic_rotation',return_value={'candidates':[{'allowed':False},{'allowed':False}]}):
   self.assertEqual(pipeline.prioritize_transcripts(items), [])
  self.assertEqual(len(items),2)

 def test_reviewed_pending_cannot_bypass_final_publish_guard(self):
  with tempfile.TemporaryDirectory() as temp:
   pending=Path(temp)/'pending.json'; pending.write_text(json.dumps({'slug':'new-tonal','title':'New Tonal model','reviewed':True}))
   before=pending.read_text()
   with patch.object(pipeline,'PENDING',pending), patch.object(pipeline,'ensure_dirs'), patch.object(pipeline,'require_paths'), patch.object(pipeline,'validate_draft'), patch.object(pipeline,'read_used_slugs',return_value=set()), patch.object(pipeline,'read_used_video_ids',return_value=set()), patch.object(pipeline,'assert_available_section'), patch.object(pipeline,'topic_rotation',return_value={'previous':[{'slug':'yesterday'}],'candidates':[{'allowed':False,'topic':'gym'}]}), patch.object(pipeline,'ensure_thumbnail') as thumbnail, patch.object(pipeline,'frontend_build') as build:
    with self.assertRaisesRegex(RuntimeError,'Topic rotation hold'): pipeline.publish_stage()
    thumbnail.assert_not_called();build.assert_not_called()
   self.assertEqual(pending.read_text(),before)

 def test_deferred_draft_preserved_without_blacklisting(self):
  with tempfile.TemporaryDirectory() as temp:
   directory=Path(temp);pending=directory/'pending.json';pending.write_text(json.dumps({'slug':'new-tonal','title':'New Tonal model','reviewed':True}))
   before=pending.read_text()
   with patch.object(pipeline,'PENDING',pending),patch.object(pipeline,'DRAFT_DIR',directory),patch.object(pipeline,'read_used_slugs',return_value=set()),patch.object(pipeline,'topic_rotation',return_value={'candidates':[{'allowed':False}]}),patch.object(pipeline,'log'):
    pipeline.defer_repeated_pending()
   self.assertFalse(pending.exists())
   self.assertEqual(next((directory/'deferred-topics').glob('*.json')).read_text(),before)
   self.assertFalse((directory/'blacklist.txt').exists())

 def test_failure_to_read_history_holds_publication(self):
  import subprocess
  with patch.object(pipeline.subprocess,'run',return_value=subprocess.CompletedProcess([],1,'','history unavailable')):
   with self.assertRaisesRegex(RuntimeError,'holding publication'): pipeline.topic_rotation([{'title':'BJJ'}])

if __name__=='__main__':unittest.main()
