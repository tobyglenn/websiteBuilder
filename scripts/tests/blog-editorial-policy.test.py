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
if __name__=='__main__':unittest.main()
