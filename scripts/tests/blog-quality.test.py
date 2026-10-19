import copy
import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'scripts/dgx'))
import blog_quality as q
import blog_pipeline as p

PASSAGE = ('I changed my training schedule because work, family, rest and consistency mattered more than adding another session. '
 'The gym was useful when I had a clear plan, enough time and reasonable expectations. I noticed my attention drifting when I repeated exercises without a purpose. '
 'My own notes describe effort, movement, balance, breathing, sleep, recovery, motivation, technique, priorities, confidence, comfort, enjoyment, patience and habit. '
 'I compared mornings, evenings, weekdays, weekends, holidays, travel, weather, meetings, school, chores, cooking, shopping, walking, cycling, stretching and lifting. '
 'A good routine left space for friends, children, appointments, interruptions, fatigue, learning, practice, reflection, feedback, adjustments, warmups, breaks and gradual progress. '
 'I want a sustainable schedule rather than an impressive checklist. These observations describe my experience, not a guarantee for other people. ')
SOURCE = q.source_evidence(PASSAGE * 8, video_id='abcdefghijk', title='My training schedule', is_short=False)
CONTENT = '<h2>My training schedule</h2>' + ''.join('<p>' + PASSAGE + '</p>' for _ in range(3))
DRAFT = {'slug':'my-training','title':'How I Changed My Training Schedule',
 'excerpt':'How I changed my training schedule around work, family and recovery, with practical lessons from my own experience of making consistency easier.',
 'category':'Training Tips','tags':['Training','Consistency'],'target_query':'How to choose a training schedule',
 'content':CONTENT,'source_video_id':'abcdefghijk','source_url':'https://www.youtube.com/watch?v=abcdefghijk',
 'source_title':'My training schedule','transcript_basename':'my-training','reviewed':True}

def call(stage,model):
 return {'stage':stage,'model':model,'requested_model':model,'server_model':model.split('/',1)[1],'prompt_sha256':'a'*64,'response_sha256':'b'*64}

def audit(draft=DRAFT):
 return {'verdict':'pass','issues':[],'checks':dict.fromkeys(q.CHECKS,True),
 'units':[{'id':u['id'],'supported':True,'quotes':[PASSAGE.strip()]} for u in q.article_units(draft)],'entities':[]}

def approved():
 d=copy.deepcopy(DRAFT)
 d['quality_approval']=q.approval(d,SOURCE,audit(d),call('review',q.REVIEW_MODEL),call('fact-check',q.AUDIT_MODEL))
 return d

class SourceQuality(unittest.TestCase):
 def test_removed_articles_cannot_be_expanded_again(self):
  fixtures=json.loads((ROOT/'scripts/tests/fixtures/blog-quality-regressions.json').read_text())
  self.assertEqual({x['source_words'] for x in fixtures},{93,183,130})
  for item in fixtures:
   with self.subTest(item['slug']):
    with self.assertRaisesRegex(ValueError,'Shorts'):q.source_evidence(item['source'],video_id=item['video_id'],title=item['slug'],is_short=True)
    with self.assertRaisesRegex(ValueError,'at least 600'):q.source_evidence(item['source'],video_id=item['video_id'],title=item['slug'],is_short=False)
 def test_unknown_format_and_silent_source_truncation_are_held(self):
  with self.assertRaises(ValueError):q.source_evidence(PASSAGE*8,video_id='abcdefghijk',title='Example',is_short=None)
  with self.assertRaisesRegex(ValueError,'full-context'):q.source_evidence(PASSAGE*200,video_id='abcdefghijk',title='Example',is_short=False)
 def test_word_floor_cannot_be_bypassed_by_environment(self):
  with patch.dict(p.os.environ,{'BLOG_MIN_TRANSCRIPT_WORDS':'40'}):self.assertEqual(p.min_transcript_words(),600)
 def test_invented_price_and_product_are_rejected(self):
  for extra in ['<p>The monthly membership costs $60.</p>','<p>I bought the Speediance Vultr.</p>']:
   d={**DRAFT,'content':CONTENT+extra}
   with self.assertRaises(ValueError):q.validate_grounding(d,SOURCE)
 def test_ambiguous_caption_does_not_authorize_product_correction(self):
  source=q.source_evidence(PASSAGE*8+' I compared Tonal with Vultr.',video_id='abcdefghijk',title='Tonal',is_short=False)
  with self.assertRaisesRegex(ValueError,'ambiguous'):q.validate_grounding({**DRAFT,'content':CONTENT+'<p>I bought Voltra.</p>'},source)
 def test_padding_and_third_person_transcript_voice_are_held(self):
  with self.assertRaises(ValueError):q.validate_grounding({**DRAFT,'content':CONTENT*8},SOURCE)
  with self.assertRaisesRegex(ValueError,'narrates'):q.validate_grounding({**DRAFT,'content':CONTENT+'<p>The speaker enjoys training.</p>'},SOURCE)

class ApprovalQuality(unittest.TestCase):
 def test_current_approval_accepts_unchanged_article(self):q.require_approval(approved(),SOURCE)
 def test_old_review_flag_or_changed_text_or_source_cannot_publish(self):
  with self.assertRaisesRegex(ValueError,'reviewed=true'):q.require_approval(DRAFT,SOURCE)
  for key,value in [('content',CONTENT+'<p>A changed claim.</p>'),('title','A changed headline'),('source_video_id','otherid1234')]:
   d=approved();d[key]=value
   with self.assertRaisesRegex(ValueError,'changed'):q.require_approval(d,SOURCE)
  with self.assertRaisesRegex(ValueError,'changed'):q.require_approval(approved(),{**SOURCE,'sha256':'c'*64})
 def test_missing_evidence_fabricated_quotes_and_unsupported_units_fail(self):
  for mutate in [lambda a:a['units'].pop(),lambda a:a['units'][0].update(quotes=['This sentence does not exist in the source.']),lambda a:a['units'][0].update(supported=False),lambda a:a['checks'].update(no_padding=False),lambda a:a.update(verdict='hold',issues=[{'reason':'unsupported claim'}])]:
   a=audit();mutate(a)
   with self.assertRaises(ValueError):q.validate_audit(DRAFT,SOURCE,a)
 def test_entity_name_must_be_explicitly_supported(self):
  a=audit();a['entities']=[{'name':'Speediance Vultr','quote':PASSAGE.strip(),'unambiguous':True}]
  with self.assertRaisesRegex(ValueError,'entity'):q.validate_audit(DRAFT,SOURCE,a)
 def test_passage_ids_resolve_to_actual_quotes_without_model_rewriting(self):
  a=audit();a['units'][0].pop('quotes');a['units'][0]['source_ids']=['s001']
  resolved=q.resolve_audit(a,SOURCE)
  self.assertEqual(resolved['units'][0]['quotes'],[q.source_passages(SOURCE)[0]['text']])
  q.validate_audit(DRAFT,SOURCE,a)
  a['units'][0]['source_ids']=['invented']
  with self.assertRaisesRegex(ValueError,'passage'):q.validate_audit(DRAFT,SOURCE,a)
  a['units'][0]['source_ids']=['s001'];a['units'][0]['quotes']=['Fabricated evidence']
  with self.assertRaisesRegex(ValueError,'differs'):q.validate_audit(DRAFT,SOURCE,a)
 def test_fact_checker_must_differ_from_editor(self):
  with self.assertRaises(ValueError):q.approval(DRAFT,SOURCE,audit(),call('review',q.REVIEW_MODEL),call('fact-check',q.REVIEW_MODEL))

class PipelineQuality(unittest.TestCase):
 def test_model_calls_pin_exact_identity_and_never_fallback(self):
  result=subprocess.CompletedProcess([],0,json.dumps({'ok':True,'text':'{}','model':q.DRAFT_MODEL.split('/',1)[1],'provider':'minimax','server_model':'MiniMax-M3'}),'')
  with patch.object(p,'run',return_value=result) as runner,patch.object(p,'log'):
   _,receipt=p.editorial_model_call('Evidence',stage='draft',model=q.DRAFT_MODEL)
   self.assertIn(q.DRAFT_MODEL,runner.call_args.args[0]);self.assertEqual(receipt['model'],q.DRAFT_MODEL)
   self.assertEqual(json.loads(runner.call_args.kwargs['input_text'])['max_tokens'],32768);self.assertEqual(runner.call_count,1)
  for result in [subprocess.CompletedProcess([],1,'','quota'),subprocess.CompletedProcess([],0,json.dumps({'ok':True,'text':'{}','model':'MiniMax-M3','provider':'minimax','server_model':'MiniMax-M3','finish_reason':'length'}),''),subprocess.CompletedProcess([],0,json.dumps({'ok':True,'text':'{}','model':'google/gemma-3-27b-it'}),'')]:
   with patch.object(p,'run',return_value=result) as runner:
    with self.assertRaises(RuntimeError):p.editorial_model_call('Evidence',stage='draft',model=q.DRAFT_MODEL)
    self.assertEqual(runner.call_count,1)
 def test_editor_and_fact_checker_both_receive_full_source(self):
  responses=[(json.dumps(DRAFT),call('review',q.REVIEW_MODEL)),(json.dumps(audit()),call('fact-check',q.AUDIT_MODEL))]
  with patch.object(p,'editorial_model_call',side_effect=responses) as model:
   fixed=p.review_grounded_draft(DRAFT,SOURCE)
   q.require_approval(fixed,SOURCE)
   self.assertEqual(model.call_count,2)
   for args in model.call_args_list:self.assertIn(SOURCE['text'],args.args[0])
 def test_repairs_with_feedback_and_fails_closed_after_bound(self):
  with patch.object(p,'review_grounded_draft_once',side_effect=[ValueError('unsupported product'),dict(DRAFT)]) as reviewer,patch.object(p,'log'):
   p.review_grounded_draft(DRAFT,SOURCE)
   self.assertEqual(reviewer.call_args.args[0]['editorial_feedback'],'unsupported product')
   self.assertEqual(reviewer.call_count,2)
  with patch.object(p,'review_grounded_draft_once',side_effect=ValueError('unsupported product')) as reviewer,patch.object(p,'log'):
   with self.assertRaises(ValueError):p.review_grounded_draft(DRAFT,SOURCE)
   self.assertEqual(reviewer.call_count,3)
 def test_repairs_retain_all_prior_audit_findings(self):
  with patch.object(p,'review_grounded_draft_once',side_effect=[ValueError('unsupported year'),ValueError('unsupported photo context'),dict(DRAFT)]) as reviewer,patch.object(p,'log'):
   p.review_grounded_draft(DRAFT,SOURCE)
   feedback=reviewer.call_args.args[0]['editorial_feedback']
   self.assertIn('unsupported year',feedback);self.assertIn('unsupported photo context',feedback)
 def test_repair_uses_the_last_corrected_article(self):
  changed=dict(DRAFT,title='Corrected title')
  exc=ValueError('unsupported detail');exc.candidate=changed
  with patch.object(p,'review_grounded_draft_once',side_effect=[exc,dict(DRAFT)]) as reviewer,patch.object(p,'log'):
   p.review_grounded_draft(DRAFT,SOURCE)
   self.assertEqual(reviewer.call_args.args[0]['title'],'Corrected title')
 def test_failed_verdict_reports_findings_before_empty_citations(self):
  failed=audit();failed['verdict']='hold';failed['issues']=[{'unit_id':'block-1','reason':'unsupported context'}];failed['units'][0]['source_ids']=[]
  with self.assertRaisesRegex(ValueError,'unsupported context'):
   q.approval(DRAFT,SOURCE,failed,call('review',q.REVIEW_MODEL),call('fact-check',q.AUDIT_MODEL))
 def test_invalid_auditor_citations_retry_the_same_article(self):
  invalid=audit();invalid['units'][0]['source_ids']=['not-a-real-passage']
  responses=[(json.dumps(DRAFT),call('review',q.REVIEW_MODEL)),(json.dumps(invalid),call('fact-check',q.AUDIT_MODEL)),(json.dumps(audit()),call('fact-check',q.AUDIT_MODEL))]
  with patch.object(p,'editorial_model_call',side_effect=responses) as model:
   fixed=p.review_grounded_draft_once(DRAFT,SOURCE)
   q.require_approval(fixed,SOURCE)
   self.assertEqual(model.call_count,3)
   self.assertIn('only these exact IDs',model.call_args.args[0])
 def test_locked_copy_is_preserved_and_independently_audited(self):
  locked=dict(DRAFT,editorial_lock=True)
  review={'verdict':'pass','issues':[],'checks':{k:True for k in q.CHECKS}}
  responses=[(json.dumps(review),call('review',q.REVIEW_MODEL)),(json.dumps(audit()),call('fact-check',q.AUDIT_MODEL))]
  with patch.object(p,'editorial_model_call',side_effect=responses) as model:
   fixed=p.review_grounded_draft(locked,SOURCE)
   self.assertEqual(q.article_digest(fixed),q.article_digest(locked));q.require_approval(fixed,SOURCE)
   self.assertEqual(model.call_count,2)
   for args in model.call_args_list:self.assertIn(SOURCE['text'],args.args[0])
 def test_locked_copy_stops_when_editor_holds(self):
  response=({'verdict':'hold','issues':['unsupported context'],'checks':{k:False for k in q.CHECKS}})
  with patch.object(p,'editorial_model_call',return_value=(json.dumps(response),call('review',q.REVIEW_MODEL))) as model:
   with self.assertRaisesRegex(ValueError,'unsupported context'):p.review_grounded_draft(dict(DRAFT,editorial_lock=True),SOURCE)
   self.assertEqual(model.call_count,1)
 def test_locked_copy_still_requires_fact_checker_approval(self):
  review={'verdict':'pass','issues':[],'checks':{k:True for k in q.CHECKS}};failed=audit();failed['verdict']='hold';failed['issues']=[{'reason':'unsupported context'}]
  responses=[(json.dumps(review),call('review',q.REVIEW_MODEL)),(json.dumps(failed),call('fact-check',q.AUDIT_MODEL))]
  with patch.object(p,'editorial_model_call',side_effect=responses):
   with self.assertRaisesRegex(ValueError,'unsupported context'):p.review_grounded_draft(dict(DRAFT,editorial_lock=True),SOURCE)
 def test_final_publisher_recovers_legacy_review_flag_before_any_write(self):
  with tempfile.TemporaryDirectory() as temp:
   pending=Path(temp)/'pending.json';pending.write_text(json.dumps(DRAFT));before=pending.read_text()
   with patch.object(p,'PENDING',pending),patch.object(p,'ensure_dirs'),patch.object(p,'require_paths'),patch.object(p,'validate_draft'),patch.object(p,'read_used_slugs',return_value=set()),patch.object(p,'read_used_video_ids',return_value=set()),patch.object(p,'assert_available_section'),patch.object(p,'assert_topic_rotation'),patch.object(p,'load_quality_source',return_value=SOURCE),patch.object(p,'ensure_thumbnail') as thumb,patch.object(p,'frontend_build') as build,patch.object(p,'review_stage',side_effect=RuntimeError('approval recovery requested')) as recover:
    with self.assertRaisesRegex(RuntimeError,'approval recovery requested'):p.publish_stage()
    recover.assert_called_once()
    thumb.assert_not_called();build.assert_not_called()
   self.assertEqual(pending.read_text(),before)
 def test_old_quality_hold_triggers_daily_recovery(self):
  with tempfile.TemporaryDirectory() as temp:
   with patch.object(p,'DRAFT_DIR',Path(temp)),patch.object(p,'PENDING',Path(temp)/'pending.json'),patch.object(p,'ensure_dirs'),patch.object(p,'require_paths'),patch.object(p,'log'),patch.object(p,'has_post_dated',return_value=False),patch.object(p,'promote_ready',return_value=False),patch.object(p,'select_daily_draft',side_effect=RuntimeError('operational recovery attempted')) as recover:
    p.record_quality_hold('draft','The narrow video queue was empty')
    with self.assertRaisesRegex(RuntimeError,'operational recovery attempted'):p.publish_stage()
    recover.assert_called_once()

if __name__=='__main__':unittest.main()
