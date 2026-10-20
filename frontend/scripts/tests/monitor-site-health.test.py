#!/usr/bin/env python3
"""Exercise DNS provider changes and real outage detection without network or notifications."""
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

MONITOR = Path(__file__).resolve().parents[1] / 'monitor-site-health.sh'
DIG = '''#!/usr/bin/env python3
import os,sys
args=sys.argv[1:]; scenario=os.environ['SCENARIO']
if 'NS' in args:
 if scenario != 'no-delegation': print('cosmin.ns.cloudflare.com.\\nizabella.ns.cloudflare.com.' if not scenario.startswith('direct') else 'ns1.example.net.\\nns2.example.net.')
elif scenario == 'refused':
 print(';; communications error: timed out')
 sys.exit(9)
elif 'CNAME' in args:
 print('wrong.example.net.' if scenario == 'direct-wrong-cname' else 'tobyglenn.github.io.')
elif 'AAAA' in args:
 if scenario == 'direct-ipv6': print('2001:db8::1')
 else: print('2606:4700:3032::ac43:d767' if not scenario.startswith('direct') else '')
elif 'A' in args:
 if scenario == 'missing-www' and args[-1].startswith('www.'): sys.exit(0)
 if scenario.startswith('direct'):
  print('203.0.113.1' if scenario == 'direct-wrong-a' else '185.199.108.153\\n185.199.109.153\\n185.199.110.153\\n185.199.111.153')
 else: print('104.21.61.214\\n172.67.215.103')
'''
CURL = '''#!/usr/bin/env python3
import os,sys
from pathlib import Path
args=sys.argv[1:]; scenario=os.environ['SCENARIO']; url=next(a for a in args if a.startswith(('http://','https://')))
if scenario == 'https-failure' and url == 'https://tobyonfitnesstech.com/': sys.exit(22)
if '--write-out' in args:
 print('200 https://wrong.example/' if scenario == 'redirect-failure' else '200 https://tobyonfitnesstech.com/',end='')
else:
 target=args[args.index('-o')+1]
 body='<sitemapindex></sitemapindex>' if 'sitemap' in url else '<html>Toby on Fitness Tech</html>'
 if scenario == 'bad-content': body='<html>unrelated site</html>'
 if scenario == 'bad-sitemap' and 'sitemap' in url: body='<html>Toby</html>'
 Path(target).write_text(body)
'''

class MonitorTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory(); self.root=Path(self.tmp.name)
  self.bin=self.root/'bin';self.bin.mkdir()
  for name,source in [('dig',DIG),('curl',CURL)]:
   p=self.bin/name;p.write_text(source);p.chmod(0o755)
 def tearDown(self): self.tmp.cleanup()
 def run_check(self,scenario):
  env={**os.environ,'PATH':str(self.bin)+os.pathsep+os.environ['PATH'],'SCENARIO':scenario,'SITE_HEALTH_NOTIFY':'0','SITE_HEALTH_STATE_DIR':str(self.root/'state'),'SITE_HEALTH_LOG_DIR':str(self.root/'logs')}
  for key in ['SITE_HEALTH_AUTHORITATIVE_NS','SITE_HEALTH_DNS_MODE']: env.pop(key,None)
  return subprocess.run(['bash',str(MONITOR)],env=env,capture_output=True,text=True)
 def test_cloudflare_proxy_and_ipv6_pass(self):
  r=self.run_check('cloudflare');self.assertEqual(r.returncode,0,r.stdout+r.stderr);self.assertIn('mode=proxied',r.stdout)
 def test_direct_github_records_pass(self):
  r=self.run_check('direct');self.assertEqual(r.returncode,0,r.stdout+r.stderr);self.assertIn('mode=direct',r.stdout)
 def test_failures_remain_detected(self):
  for scenario in ['no-delegation','refused','missing-www','direct-wrong-a','direct-wrong-cname','direct-ipv6','https-failure','redirect-failure','bad-content','bad-sitemap']:
   with self.subTest(scenario=scenario): self.assertEqual(self.run_check(scenario).returncode,1)
 def test_confirmation_threshold_and_recovery(self):
  for number in [1,2,3]:
   r=self.run_check('https-failure');self.assertEqual(r.returncode,1)
   self.assertIn('WARN:' if number<3 else 'ERROR:',r.stdout)
  r=self.run_check('cloudflare');self.assertEqual(r.returncode,0,r.stdout+r.stderr)
  self.assertIn('checks now pass',r.stdout)
  self.assertEqual((self.root/'state'/'consecutive_failures').read_text(),'0')
  self.assertEqual((self.root/'state'/'state').read_text(),'healthy')

if __name__ == '__main__': unittest.main()
