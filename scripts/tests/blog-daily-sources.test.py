import copy
import base64
import json
from pathlib import Path
import runpy
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'scripts/dgx'))
import blog_sources as sources
import blog_pipeline as p
import blog_quality as q
import blog_models as models
from types import SimpleNamespace
F=runpy.run_path(str(ROOT/'scripts/tests/blog-quality.test.py'),run_name='quality_fixtures')


def plan_fixture():
    doc={'id':'public-project','kind':'public-page','title':'Public project','url':'https://tobyonfitnesstech.com/projects/example/',
         'text':F['PASSAGE']*8,'sha256':sources.digest(F['PASSAGE']*8),'publication_approved':True,'disclosure':'narrative-only-no-private-code'}
    topic={'id':'project-workflow','lane':'public-projects','title':'A public project workflow','question':'How does the documented workflow work?','documents':['public-project']}
    return {'documents':[],'topics':[topic]},{'documents':{doc['id']:doc}},topic


class IntakeTests(unittest.TestCase):
    def test_private_repository_is_rejected_before_reading_contents(self):
        doc={'id':'x','kind':'public-repo-doc','title':'Private','repo':'example/private','path':'README.md'}
        with patch.object(sources,'fetch',return_value=json.dumps({'private':True,'visibility':'private'})) as fetch:
            with self.assertRaisesRegex(ValueError,'not verified public'):sources.retrieve_document(doc,{})
            self.assertEqual(fetch.call_count,1)
            self.assertNotIn('/contents/',fetch.call_args.args[0])

    def test_cached_repo_snapshot_requires_fresh_public_visibility(self):
        doc={'id':'readme','kind':'public-repo-doc','title':'Readme','repo':'example/public','path':'README.md'}
        prior={'id':'readme','text':'Dated public prose','definition_sha256':sources.digest(doc)}
        for visibility,expected in [({'private':False,'visibility':'public'},True),({'private':True,'visibility':'private'},False)]:
            with self.subTest(visibility=visibility),tempfile.TemporaryDirectory() as temp:
                cache=Path(temp)/'cache.json';cache.write_text(json.dumps({'documents':{'readme':prior}}))
                with patch.object(sources,'fetch',side_effect=[json.dumps(visibility),TimeoutError('contents unavailable')]):
                    result=sources.refresh({'documents':[doc]},cache)
                    self.assertEqual('readme' in result['documents'],expected)

    def test_source_files_and_traversal_are_not_prose_inputs(self):
        for path in ['main.py','src/game.luau','../README.md','/etc/passwd']:
            with self.subTest(path=path):
                with self.assertRaises(ValueError):sources.validate_definition({'kind':'public-repo-doc','repo':'example/public','path':path})

    def test_owner_notes_require_publication_approval_and_forbid_code(self):
        note={'kind':'owner-approved-note','text':'A production note','approved_at':'2026-10-19','disclosure':'narrative-only-no-private-code'}
        with self.assertRaises(ValueError):sources.validate_definition(note)
        note['publication_approved']=True;sources.validate_definition(note)
        for extra in [{'local_path':'/private/project/source.py'},{'repo':'owner/private'},{'text':'```python\nsecret=1\n```'},{'text':'def private_function():\n return 1'}]:
            with self.assertRaises(ValueError):sources.validate_definition({**note,**extra})

    def test_public_pages_are_restricted_to_explicit_public_project_routes(self):
        for url in ['http://localhost/private','https://tobyonfitnesstech.com/admin/','https://other.example/projects/x/','file:///private/source']:
            with self.assertRaises(ValueError):sources.validate_definition({'kind':'public-page','url':url})

    def test_public_html_intake_excludes_code_and_navigation(self):
        parser=sources.PublicProse();parser.feed('<nav>navigation</nav><main><h1>Project</h1><p>Public narrative.</p><pre>private_code()</pre><code>token</code></main><footer>Footer</footer>')
        self.assertIn('Public narrative',parser.text())
        for excluded in ['private_code','token','navigation','Footer']:self.assertNotIn(excluded,parser.text())

    def test_markdown_code_fences_do_not_enter_evidence(self):
        self.assertNotIn('secret',sources.prose_markdown('Overview\n```python\nsecret=1\n```\nMore prose.'))

    def test_video_documents_require_verified_long_form_identity(self):
        for flag in [True,None]:
            with self.assertRaises(ValueError):sources.validate_definition({'kind':'public-video-transcript','repo':'tobyglenn/websiteBuilder','video_id':'abcdefghijk','is_short':flag})


    def test_untimed_public_video_uses_full_video_link_but_cannot_claim_a_range(self):
        doc={'id':'video','kind':'public-video-transcript','title':'Public video','repo':'tobyglenn/websiteBuilder','video_id':'abcdefghijk','is_short':False}
        transcript={'video_id':'abcdefghijk','segments':[{'text':'Actual public transcript prose.'}]}
        payload={'type':'file','encoding':'base64','content':base64.b64encode(json.dumps(transcript).encode()).decode()}
        with patch.object(sources,'fetch',return_value=json.dumps(payload)):
            result=sources.retrieve_document(doc,{'tobyglenn/websiteBuilder':{'private':False,'visibility':'public'}})
            self.assertEqual(result['url'],'https://www.youtube.com/watch?v=abcdefghijk')
            with self.assertRaisesRegex(ValueError,'Timed transcript cues'):
                sources.retrieve_document(dict(doc,start=1,end=30),{'tobyglenn/websiteBuilder':{'private':False,'visibility':'public'}})


class ModelAccountTests(unittest.TestCase):
    def test_google_account_recovery_preserves_provider_and_exact_model(self):
        providers={name:{'api':'google-generative-ai','baseUrl':url} for name,url in [('google','https://generativelanguage.googleapis.com/v1beta'),('google-2','https://generativelanguage.googleapis.com')]}
        responses=[SimpleNamespace(ok=False,raw={'__http_status__':429}),SimpleNamespace(ok=True,raw={})]
        from unittest.mock import Mock
        call=Mock(side_effect=responses)
        result,account=models.call_google_accounts(q.REVIEW_MODEL,{'prompt':'review','timeout':60},providers,lambda *a:'configured-key',call)
        self.assertTrue(result.ok);self.assertEqual(account,'google-2');self.assertEqual(call.call_count,2)
        for request in call.call_args_list:
            self.assertEqual(request.args[0],'google');self.assertEqual(request.args[1],'https://generativelanguage.googleapis.com/v1beta');self.assertEqual(request.args[3],'gemini-3-flash-preview')

    def test_configured_account_cannot_redirect_credentials_to_another_service(self):
        providers={'google':{'api':'google-generative-ai','baseUrl':'https://other.example/v1beta'}}
        from unittest.mock import Mock
        resolve=Mock();call=Mock()
        with self.assertRaisesRegex(ValueError,'pinned Google service'):
            models.call_google_accounts(q.REVIEW_MODEL,{'prompt':'review','timeout':60},providers,resolve,call)
        resolve.assert_not_called();call.assert_not_called()

    def test_permanent_provider_error_does_not_cycle_accounts(self):
        providers={name:{'api':'google-generative-ai','baseUrl':'https://generativelanguage.googleapis.com/v1beta'} for name in ['google','google-2']}
        from unittest.mock import Mock
        call=Mock(return_value=SimpleNamespace(ok=False,raw={'__http_status__':400}))
        result,account=models.call_google_accounts(q.REVIEW_MODEL,{'prompt':'review','timeout':60},providers,lambda *a:'configured-key',call)
        self.assertFalse(result.ok);self.assertEqual(account,'google');self.assertEqual(call.call_count,1)


class LedgerTests(unittest.TestCase):
    def test_document_changes_alter_bundle_identity(self):
        plan,cache,topic=plan_fixture();first=sources.bundle(topic,cache['documents']);cache['documents']['public-project']['sha256']='changed'
        self.assertNotEqual(first['sha256'],sources.bundle(topic,cache['documents'])['sha256'])

    def test_angle_is_consumed_only_by_committed_publication(self):
        plan,cache,topic=plan_fixture();packet=sources.bundle(topic,cache['documents'])
        text='source_bundle: '+json.dumps(packet['identity'])+','
        self.assertEqual(len(sources.candidates(plan,cache)),1)
        self.assertEqual(sources.candidates(plan,cache,sources.published_bundles(text)),[])

    def test_malformed_committed_ledger_fails_closed(self):
        with self.assertRaises(ValueError):sources.published_bundles('source_bundle: {broken},')
        with self.assertRaises(ValueError):sources.published_bundles('source_bundle: {"kind":"unknown"},')

    def test_bundle_metadata_is_bound_to_approval(self):
        draft=F['approved']();draft['source_bundle']={'topic_id':'changed-angle'}
        with self.assertRaisesRegex(ValueError,'changed after review'):q.require_approval(draft,F['SOURCE'])

    def test_bundle_citation_uses_public_documents_without_fake_video_id(self):
        plan,cache,topic=plan_fixture();packet=sources.bundle(topic,cache['documents'])
        text=sources.citation_html(packet['identity'],cache['documents'])
        self.assertIn('https://tobyonfitnesstech.com/projects/example/',text);self.assertNotIn('youtube',text)

    def test_old_source_section_entries_remain_recoverable(self):
        draft=dict(copy.deepcopy(F['DRAFT']),date=p.publication_day());expected=p.js_entry(draft).replace('    source_bundle: null,\n','')
        self.assertTrue(p.matching_remote_entry(draft,expected))


class RecoveryTests(unittest.TestCase):
    def test_transient_reviewer_failure_retries_the_same_pinned_model(self):
        provider,model=q.REVIEW_MODEL.split('/',1)
        failure={'ok':False,'error':'HTTP 503 temporarily unavailable'}
        success={'ok':True,'text':'{}','provider':provider,'model':model,'server_model':q.REVIEW_MODEL,'finish_reason':'stop'}
        runs=[subprocess.CompletedProcess([],0,json.dumps(value),'') for value in [failure,success]]
        with patch.object(p,'run',side_effect=runs) as run,patch.object(p.time,'sleep') as sleep,patch.object(p,'log'):
            text,receipt=p.editorial_model_call('Review this evidence',stage='review',model=q.REVIEW_MODEL)
            self.assertEqual(text,'{}');self.assertEqual(receipt['model'],q.REVIEW_MODEL)
            self.assertEqual(run.call_count,2);sleep.assert_called_once_with(35)
            self.assertTrue(all(call.args[0][-1]==q.REVIEW_MODEL for call in run.call_args_list))

    def test_transcript_failure_still_leaves_public_project_candidates(self):
        plan,cache,topic=plan_fixture()
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);a=root/'plan.json';b=root/'cache.json';a.write_text(json.dumps(plan));b.write_text(json.dumps(cache));mock=root/'mock.js';mock.write_text('[]')
            with patch.multiple(p,SOURCE_PLAN=a,SOURCE_CACHE=b,MOCK_JS=mock,READY_DIR=root/'ready',PENDING=root/'pending',usable_sections=lambda:(_ for _ in ()).throw(ValueError('video corpus unavailable')),published_titles=lambda:[],read_used_slugs=lambda:set(),consolidated_guide=lambda title:None),patch.object(p,'topic_rotation',side_effect=lambda candidates:{'candidates':[{'allowed':True} for _ in candidates]}):
                candidates,errors=p.candidate_library()
                self.assertEqual(len(candidates),1);self.assertEqual(candidates[0][2],'public-projects');self.assertIn('video corpus unavailable',errors[0])

    def test_candidates_interleave_source_lanes_before_repeating_one(self):
        plan,cache,topic=plan_fixture()
        plan['topics']=[dict(topic,id='angle-'+str(i),title='Reader question '+str(i),lane=lane) for i,lane in enumerate(['public-projects','public-projects','public-projects','creator-production','model-workflows'])]
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);a=root/'plan';b=root/'cache';a.write_text(json.dumps(plan));b.write_text(json.dumps(cache));mock=root/'mock';mock.write_text('[]')
            with patch.multiple(p,SOURCE_PLAN=a,SOURCE_CACHE=b,MOCK_JS=mock,READY_DIR=root/'ready',PENDING=root/'pending',usable_sections=lambda:[],published_titles=lambda:[],read_used_slugs=lambda:set(),consolidated_guide=lambda title:None),patch.object(p,'topic_rotation',side_effect=lambda candidates:{'candidates':[{'allowed':True} for _ in candidates]}):
                candidates,_=p.candidate_library()
                self.assertEqual(len({r[2] for r in candidates[:3]}),3)

    def test_failed_draft_moves_to_another_evidence_packet(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);pending=root/'pending.json'
            candidates=[({'slug':'first'},F['SOURCE'],'public-projects'),({'slug':'second'},F['SOURCE'],'creator-production')]
            with patch.multiple(p,PENDING=pending,DRAFT_DIR=root,promote_ready=lambda:False,candidate_library=lambda excluded:(candidates,[]),validate_draft=lambda *a,**k:None,log=lambda *a:None),patch.object(p,'generate_grounded_draft',side_effect=[ValueError('unsupported first candidate'),dict(F['DRAFT'],slug='second')]):
                self.assertEqual(p.select_daily_draft(refresh=False),0)
                self.assertEqual(json.loads(pending.read_text())['slug'],'second')

    def test_approved_reserve_can_recover_missing_daily_draft(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);ready=root/'ready';ready.mkdir();draft=F['approved']();(ready/'approved.json').write_text(json.dumps(draft))
            with patch.multiple(p,READY_DIR=ready,DRAFT_DIR=root,PENDING=root/'pending.json',read_used_slugs=lambda:set(),load_quality_source=lambda d:F['SOURCE'],assert_available_section=lambda d:None,topic_rotation=lambda rows:{'candidates':[{'allowed':True}]},log=lambda *a:None):
                self.assertTrue(p.promote_ready());self.assertTrue((root/'pending.json').exists());self.assertFalse((ready/'approved.json').exists())
                q.require_approval(json.loads((root/'pending.json').read_text()),F['SOURCE'])

    def test_failed_preparation_preserves_todays_pending_post(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);pending=root/'pending.json';pending.write_text(json.dumps(F['approved']()));before=pending.read_bytes()
            def draft(**kwargs):p.save_pending(F['DRAFT']);return 0
            with patch.multiple(p,PENDING=pending,DRAFT_DIR=root,FAILED_DIR=root/'failed',READY_DIR=root/'ready',ensure_dirs=lambda:None,refresh_editorial_library=lambda:None,ready_drafts=lambda:iter([]),select_daily_draft=draft),patch.object(p,'review_stage',side_effect=ValueError('candidate failed')):
                with self.assertRaises(ValueError):p.prepare_stage()
                self.assertEqual(p.PENDING,pending);self.assertEqual(pending.read_bytes(),before)

    def test_reserve_review_recovery_keeps_today_excluded_and_does_not_consume_reserves(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);pending=root/'pending.json';pending.write_text(json.dumps(dict(F['DRAFT'],slug='today-approved')));before=pending.read_bytes()
            calls=[]
            def select(excluded=(),**kwargs):
                calls.append((list(excluded),kwargs));p.save_pending(dict(F['DRAFT'],slug='candidate-'+str(len(calls)),reviewed=False));return 0
            def review(draft,source):
                if len(calls)==1:raise ValueError('first packet unsupported')
                return dict(draft,reviewed=True)
            with patch.multiple(p,PENDING=pending,DRAFT_DIR=root,FAILED_DIR=root/'failed',READY_DIR=root/'ready',ensure_dirs=lambda:None,require_paths=lambda:None,refresh_editorial_library=lambda:None,ready_drafts=lambda:iter([]),select_daily_draft=select,load_quality_source=lambda draft:F['SOURCE'],assert_distinct_article=lambda draft:None,validate_draft=lambda *a,**k:None,ensure_thumbnail=lambda draft:None,log=lambda *a:None),patch.object(p,'review_grounded_draft',side_effect=review),patch.object(q,'require_approval'):
                self.assertEqual(p.prepare_stage(),0)
                self.assertEqual(pending.read_bytes(),before)
                self.assertEqual(len(calls),2)
                for excluded,kwargs in calls:
                    self.assertIn('today-approved',excluded);self.assertFalse(kwargs['use_reserve'])
                self.assertIn('candidate-1',calls[1][0])
                self.assertTrue((root/'ready/candidate-2.json').exists())

    def test_service_failure_preserves_staged_reserve_for_next_preparation(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);pending=root/'pending.json';pending.write_text(json.dumps(dict(F['DRAFT'],slug='today')));before=pending.read_bytes()
            def select(excluded=(),**kwargs):p.save_pending(dict(F['DRAFT'],slug='reserve',reviewed=False));return 0
            with patch.multiple(p,PENDING=pending,DRAFT_DIR=root,FAILED_DIR=root/'failed',READY_DIR=root/'ready',ensure_dirs=lambda:None,require_paths=lambda:None,refresh_editorial_library=lambda:None,ready_drafts=lambda:iter([]),load_quality_source=lambda draft:F['SOURCE'],assert_available_section=lambda draft:None,assert_distinct_article=lambda draft:None,validate_draft=lambda *a,**k:None,ensure_thumbnail=lambda draft:None,log=lambda *a:None),patch.object(p,'select_daily_draft',side_effect=select) as generate,patch.object(p,'review_grounded_draft',side_effect=p.PinnedModelUnavailable('HTTP 503')) as review,patch.object(q,'require_approval'):
                with self.assertRaises(p.PinnedModelUnavailable):p.prepare_stage()
                self.assertTrue((root/'ready/preparing.json').exists());self.assertEqual(pending.read_bytes(),before)
                review.side_effect=lambda draft,source:dict(draft,reviewed=True)
                self.assertEqual(p.prepare_stage(),0)
                generate.assert_called_once();self.assertTrue((root/'ready/reserve.json').exists());self.assertEqual(pending.read_bytes(),before)

    def test_service_outage_during_factual_fallback_preserves_the_replacement(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);pending=root/'pending.json';pending.write_text(json.dumps(dict(F['DRAFT'],slug='today')));before=pending.read_bytes();calls=[]
            def select(excluded=(),**kwargs):
                calls.append(kwargs);p.save_pending(dict(F['DRAFT'],slug='candidate-'+str(len(calls)),reviewed=False));return 0
            with patch.multiple(p,PENDING=pending,DRAFT_DIR=root,FAILED_DIR=root/'failed',READY_DIR=root/'ready',ensure_dirs=lambda:None,require_paths=lambda:None,refresh_editorial_library=lambda:None,ready_drafts=lambda:iter([]),select_daily_draft=select,load_quality_source=lambda draft:F['SOURCE'],assert_distinct_article=lambda draft:None,validate_draft=lambda *a,**k:None,ensure_thumbnail=lambda draft:None,log=lambda *a:None),patch.object(p,'review_grounded_draft',side_effect=[ValueError('unsupported first packet'),p.PinnedModelUnavailable('HTTP 503')]),patch.object(p,'promote_ready') as promote:
                with self.assertRaises(p.PinnedModelUnavailable):p.prepare_stage()
                promote.assert_not_called();self.assertEqual(len(calls),2)
                self.assertEqual(json.loads((root/'ready/preparing.json').read_text())['slug'],'candidate-2')
                self.assertEqual(pending.read_bytes(),before)

    def test_generation_service_failure_does_not_waste_other_source_packets(self):
        rows=[({'slug':'one'},F['SOURCE'],'youtube'),({'slug':'two'},F['SOURCE'],'creator-production')]
        with patch.multiple(p,promote_ready=lambda:False,candidate_library=lambda excluded:(rows,[])),patch.object(p,'generate_grounded_draft',side_effect=p.PinnedModelUnavailable('HTTP 503')) as generate:
            with self.assertRaises(p.PinnedModelUnavailable):p.select_daily_draft(refresh=False)
            generate.assert_called_once()

    def test_repeated_article_prose_is_rejected_even_with_a_new_title(self):
        draft=dict(F['DRAFT'],source_bundle={'topic_id':'new-title'})
        with patch.object(p,'editorial_history',return_value=[{'slug':'previous','content':draft['content']} ]):
            with self.assertRaisesRegex(ValueError,'already-published prose'):p.assert_distinct_article(draft)

    def test_all_source_failures_are_operational_errors_not_silent_skips(self):
        with patch.multiple(p,promote_ready=lambda:False,candidate_library=lambda excluded:([],['ingestion unavailable'])):
            with self.assertRaisesRegex(RuntimeError,'recovery required'):p.select_daily_draft(refresh=False)


class PrepareOutageTests(unittest.TestCase):
    def test_empty_fact_checker_response_retries_exact_model(self):
        provider,model=q.AUDIT_MODEL.split('/',1)
        failure={'ok':False,'error':'no content in response'}
        success={'ok':True,'text':'{}','provider':provider,'model':model,'server_model':model,'finish_reason':'stop'}
        runs=[subprocess.CompletedProcess([],0,json.dumps(value),'') for value in [failure,success]]
        with patch.object(p,'run',side_effect=runs) as run,patch.object(p.time,'sleep') as sleep,patch.object(p,'log'):
            text,receipt=p.editorial_model_call('Audit all units',stage='fact-check',model=q.AUDIT_MODEL)
            self.assertEqual(text,'{}');self.assertEqual(receipt['model'],q.AUDIT_MODEL)
            self.assertEqual(run.call_count,2);sleep.assert_called_once_with(35)
            self.assertTrue(all(call.args[0][-1]==q.AUDIT_MODEL for call in run.call_args_list))

    def test_empty_success_response_is_never_approved(self):
        result={'ok':True,'text':'  ','provider':'minimax','model':'MiniMax-M3','server_model':'MiniMax-M3'}
        with patch.object(p,'run',return_value=subprocess.CompletedProcess([],0,json.dumps(result),'')) as run,patch.object(p.time,'sleep'),patch.object(p,'log'):
            with self.assertRaises(p.PinnedModelUnavailable):p.editorial_model_call('Audit',stage='fact-check',model=q.AUDIT_MODEL)
            self.assertEqual(run.call_count,2)

    def test_checkpoint_resumes_fact_check_and_cannot_publish_alone(self):
        draft=copy.deepcopy(F['DRAFT'])
        responses=[(json.dumps(draft),F['call']('review',q.REVIEW_MODEL)),p.PinnedModelUnavailable('no content in response')]
        with patch.object(p,'editorial_model_call',side_effect=responses):
            with self.assertRaises(p.PinnedModelUnavailable) as caught:p.review_grounded_draft_once(draft,F['SOURCE'])
        staged=caught.exception.candidate
        self.assertFalse(staged['reviewed']);self.assertTrue(p.valid_editorial_checkpoint(staged,F['SOURCE']))
        with self.assertRaises(ValueError):q.require_approval(staged,F['SOURCE'])
        for altered in [dict(staged,title='Changed title'),dict(staged,content=staged['content']+'<p>Changed claim</p>')]:
            self.assertFalse(p.valid_editorial_checkpoint(altered,F['SOURCE']))
        self.assertFalse(p.valid_editorial_checkpoint(staged,dict(F['SOURCE'],sha256='c'*64)))
        with patch.object(p,'editorial_model_call',return_value=(json.dumps(F['audit'](staged)),F['call']('fact-check',q.AUDIT_MODEL))) as call,patch.object(p,'log'):
            approved=p.review_grounded_draft_once(staged,F['SOURCE'])
            call.assert_called_once();self.assertEqual(call.call_args.kwargs['stage'],'fact-check')
            q.require_approval(approved,F['SOURCE']);self.assertNotIn('_editorial_checkpoint',approved)

    def test_factual_rejection_does_not_reuse_checkpoint(self):
        staged=copy.deepcopy(F['DRAFT'])
        staged['_editorial_checkpoint']={'article_sha256':q.article_digest(staged),'source_sha256':F['SOURCE']['sha256'],'review_call':F['call']('review',q.REVIEW_MODEL)}
        rejection=F['audit'](staged);rejection.update(verdict='hold',issues=[{'reason':'unsupported claim'}])
        with patch.object(p,'editorial_model_call',return_value=(json.dumps(rejection),F['call']('fact-check',q.AUDIT_MODEL))),patch.object(p,'log'):
            with self.assertRaises(ValueError) as caught:p.review_grounded_draft_once(staged,F['SOURCE'])
            self.assertNotIn('_editorial_checkpoint',caught.exception.candidate)

    def test_reserve_quality_hold_does_not_change_daily_hold(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);ready=root/'ready';ready.mkdir();daily=root/'quality-hold.json';daily.write_text('daily state')
            with patch.multiple(p,DRAFT_DIR=root,READY_DIR=ready,PENDING=ready/'preparing.json'):
                p.record_quality_hold('review','no content in response','reserve')
                self.assertEqual(daily.read_text(),'daily state');self.assertTrue((ready/'quality-hold.json').exists())
                p.clear_quality_hold();self.assertEqual(daily.read_text(),'daily state')
                self.assertFalse((ready/'quality-hold.json').exists())

    def test_only_protected_daily_delivery_allows_reserve_deferral(self):
        for protected,error,expected in [({'state':'approved_pending','slug':'today'},'no content in response',0),(None,'no content in response',1),({'state':'approved_pending'},'HTTP 403 invalid credential',1)]:
            with self.subTest(protected=protected,error=error),tempfile.TemporaryDirectory() as temp:
                root=Path(temp)
                with patch.multiple(p,DRAFT_DIR=root,ensure_dirs=lambda:None,protected_daily_article=lambda:protected,log=lambda *a:None),patch.object(sys,'argv',['blog_pipeline.py','prepare']),patch.object(p,'prepare_stage',side_effect=p.PinnedModelUnavailable(error)),patch.object(p,'notify_failure') as notify:
                    self.assertEqual(p.main(),expected)
                    self.assertEqual(notify.call_count,0 if expected==0 else 1)
                    self.assertEqual((root/'prepare-status.json').exists(),expected==0)

    def test_unapproved_daily_article_cannot_suppress_prepare_failure(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);pending=root/'pending.json';draft=dict(F['DRAFT'],date=p.publication_day());pending.write_text(json.dumps(draft))
            with patch.multiple(p,PENDING=pending,load_quality_source=lambda draft:F['SOURCE'],validate_draft=lambda *a,**kw:None):
                with self.assertRaises(ValueError):p.protected_daily_article()


if __name__=='__main__':unittest.main()
