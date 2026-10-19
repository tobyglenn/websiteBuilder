import argparse
import ast
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import time
import unittest
from unittest.mock import patch

DGX = Path(__file__).resolve().parents[1] / 'dgx'
sys.path.insert(0, str(DGX))
import blog_pipeline as blog

class RuntimeTests(unittest.TestCase):
    def run_nightly(self, failed=''):
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            wrappers = root / 'wrappers'
            wrappers.mkdir()
            (root / '.venv/bin').mkdir(parents=True)
            (root / '.openclaw').mkdir()
            (root / '.openclaw/.env').write_text('')
            py = root / '.venv/bin/python3'
            py.write_text('#!/bin/bash\nexit 0\n')
            py.chmod(0o755)
            source = (DGX / 'runtime/wrappers/nightly_pipeline.sh').read_text()
            source = source.replace('/tmp/', str(root) + '/').replace('source ~/.openclaw/.env', 'source "$HOME/.openclaw/.env"')
            main = wrappers / 'nightly_pipeline.sh'
            main.write_text(source)
            for name in ['sync_data', 'generate_reports', 'send_notifications', 'send_triple_voice', 'deploy_github', 'refresh_website_homepage']:
                (wrappers / (name + '.sh')).write_text('exit ' + ('42' if name == failed else '0') + '\n')
            gate = root / 'gate.sh'
            gate.write_text('tg_notify() { return 0; }\n')
            env = {**os.environ, 'HOME': str(root), 'TG_GATE': str(gate), 'TELEGRAM_BOT_TOKEN': ''}
            result = subprocess.run(['bash', str(main)], env=env, capture_output=True, text=True)
            done = list(root.glob('nightly_pipeline_done_*'))
            return result.returncode, bool(done)

    def test_complete_nightly_run_succeeds(self):
        self.assertEqual(self.run_nightly(), (0, True))

    def test_failed_voice_does_not_mark_run_complete(self):
        self.assertEqual(self.run_nightly('send_triple_voice'), (1, False))

    def test_failed_homepage_does_not_mark_run_complete(self):
        self.assertEqual(self.run_nightly('refresh_website_homepage'), (1, False))

    def test_watchdog_alert_delivery_does_not_hide_failure(self):
        tree = ast.parse((DGX / 'runtime/utils/pipeline_watchdog_check.py').read_text())
        main = next(n for n in tree.body if isinstance(n, ast.FunctionDef) and n.name == 'main')
        scope = {'argparse': argparse, 'sys': sys, 'time': time,
                 'load_env': lambda: None, 'get_bot_token': lambda: 'test',
                 'MORNING_PHASES': [], 'NIGHTLY_PHASES': [],
                 'check_phases': lambda *a: [('voice', 'failed')],
                 'build_alert_message': lambda *a: 'failure',
                 'send_telegram': lambda *a: True}
        exec(compile(ast.Module(body=[main], type_ignores=[]), '<watchdog-main>', 'exec'), scope)
        with patch.object(sys, 'argv', ['watchdog', '--pipeline', 'nightly']):
            with self.assertRaises(SystemExit) as result:
                scope['main']()
        self.assertEqual(result.exception.code, 1)

    def test_blog_hold_uses_recovery_instead_of_no_publication_notice(self):
        with tempfile.TemporaryDirectory() as d:
            root=Path(d)
            (root/'quality-hold.json').write_text(json.dumps({'day':blog.publication_day(),'reason':'old transcript-only hold'}))
            with patch.multiple(blog,DRAFT_DIR=root,PENDING=root/'pending.json',ensure_dirs=lambda:None,require_paths=lambda:None,has_post_dated=lambda day:False,promote_ready=lambda:False),patch.object(blog,'select_daily_draft',side_effect=RuntimeError('recovery invoked')) as recover:
                with self.assertRaisesRegex(RuntimeError,'recovery invoked'):blog.publish_stage()
                recover.assert_called_once()

if __name__ == '__main__':
    unittest.main()
