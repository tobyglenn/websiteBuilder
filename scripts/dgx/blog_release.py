#!/usr/bin/env python3
"""Model-free, exact-version daily blog handoff. Staging never grants approval."""
from __future__ import annotations
import argparse
import base64
import contextlib
from datetime import date, datetime, timezone
import fcntl
import hashlib
import html
from html.parser import HTMLParser
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import subprocess
import sys
import tempfile
from urllib.parse import urlsplit

SCHEMA = 'toft-manual-blog-v1'
REPO = Path(os.environ.get('BLOG_RELEASE_REPO', '/home/toby/.openclaw/workspace/websiteBuilder'))
STATE = Path(os.environ.get('BLOG_RELEASE_STATE', '/home/toby/.openclaw/workspace/blog-drafts/manual-release'))
ARTICLE_REQUIRED = {'slug','title','excerpt','category','date','readTime','thumbnail','tags','content'}
ARTICLE_OPTIONAL = {'id','featured','source_video_id','source_url','source_section','source_bundle','editorial_lane'}
CATEGORIES = {'Field Reports','The Long Game','Signal vs. Noise','Speediance','Training Tips','The Numbers','BJJ','Reviews','Wearables','Build Logs','Transformation','Tips & Guides','Mat Science'}
LOCALES = {'de','es','pt','hi'}


def canonical(value):
    return json.dumps(value,sort_keys=True,ensure_ascii=False,separators=(',',':'),allow_nan=False).encode()


def sha(data): return hashlib.sha256(data).hexdigest()
def stamp(): return datetime.now(timezone.utc).isoformat()
def digest(package): return sha(canonical(package))


def write_json(path, value):
    path=Path(path);path.parent.mkdir(parents=True,exist_ok=True)
    fd,temp=tempfile.mkstemp(dir=path.parent,prefix='.'+path.name)
    try:
        with os.fdopen(fd,'w') as f:
            json.dump(value,f,ensure_ascii=False,indent=2,allow_nan=False);f.write('\n');f.flush();os.fsync(f.fileno())
        os.replace(temp,path)
    finally:
        if os.path.exists(temp):os.unlink(temp)


def read_json(path):return json.loads(Path(path).read_text())


def safe_url(value):
    p=urlsplit(value)
    if p.scheme!='https' or not p.hostname or p.username or p.password or p.fragment or any(k in p.query.lower() for k in ('token=','key=','signature=')):
        raise ValueError('Source links must be public HTTPS URLs without credentials')


class ArticleHTML(HTMLParser):
    allowed={'p','h2','h3','ul','ol','li','strong','em','table','thead','tbody','tr','td','th','a','br','blockquote'}
    def __init__(self):super().__init__(convert_charrefs=True);self.stack=[]
    def handle_starttag(self,tag,attrs):
        if tag not in self.allowed:raise ValueError('Unsupported article HTML element: '+tag)
        for key,value in attrs:
            if tag!='a' or key!='href':raise ValueError('Only article link href attributes are permitted')
            if not value:raise ValueError('Empty article link')
            if not (value.startswith('/') and not value.startswith('//')):safe_url(value)
        if tag!='br':self.stack.append(tag)
    def handle_endtag(self,tag):
        if tag=='br':return
        if not self.stack or self.stack.pop()!=tag:raise ValueError('Unbalanced article HTML')
    def handle_comment(self,data):raise ValueError('HTML comments are not permitted')


def validate(package):
    if set(package)!={'schema','article','sources','assets','translations'} or package['schema']!=SCHEMA:
        raise ValueError('Unexpected package schema/fields; approval fields are never accepted from a draft')
    a=package['article']
    if not isinstance(a,dict) or not ARTICLE_REQUIRED<=set(a) or set(a)-ARTICLE_REQUIRED-ARTICLE_OPTIONAL:
        raise ValueError('Article fields do not match the publishing schema')
    slug=a['slug']
    if not isinstance(slug,str) or not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*',slug) or len(slug)>160:raise ValueError('Invalid slug')
    for k in ARTICLE_REQUIRED-{'tags'}:
        if not isinstance(a[k],str) or not a[k].strip():raise ValueError('Empty or non-string article field: '+k)
    date.fromisoformat(a['date'])
    if a['category'] not in CATEGORIES:raise ValueError('Unsupported category')
    if not isinstance(a['tags'],list) or not 2<=len(a['tags'])<=6 or any(not isinstance(t,str) or not t.strip() for t in a['tags']):raise ValueError('Need 2-6 tags')
    if a.get('source_url'):safe_url(a['source_url'])
    for doc in (a.get('source_bundle') or {}).get('documents',[]):
        if doc.get('url'):safe_url(doc['url'])
    if len(a['title'])>150 or len(a['content'])>100000:raise ValueError('Article exceeds bounds')
    if a.get('featured',False) is not False:raise ValueError('Daily articles may not silently replace featured content')
    parser=ArticleHTML();parser.feed(a['content']);parser.close()
    if parser.stack:raise ValueError('Unclosed article HTML')
    if '<h2>' not in a['content']:raise ValueError('Article needs a section heading')
    if not isinstance(package['sources'],list) or not package['sources']:raise ValueError('A complete evidence packet is required')
    for source in package['sources']:
        if not isinstance(source,dict) or not {'id','text','sha256'}<=set(source):raise ValueError('Source evidence needs id/text/sha256')
        if not isinstance(source['text'],str) or sha(source['text'].encode())!=source['sha256']:raise ValueError('Source text hash mismatch')
        if source.get('url'):safe_url(source['url'])
        if source.get('kind')=='owner-approved-note' and source.get('publication_approved') is not True:raise ValueError('Private narrative needs prior owner disclosure approval')
    paths=set()
    if not isinstance(package['assets'],list):raise ValueError('Assets must be a list')
    total=0
    for asset in package['assets']:
        if set(asset)!={'path','sha256','base64'}:raise ValueError('Unexpected asset fields')
        path=asset['path'];p=PurePosixPath(path)
        if str(p)!=path or p.is_absolute() or '..' in p.parts or not path.startswith('frontend/public/images/blog/') or p.suffix.lower() not in {'.jpg','.jpeg','.png','.webp'}:raise ValueError('Invalid asset path')
        if path in paths:raise ValueError('Duplicate asset')
        paths.add(path);data=base64.b64decode(asset['base64'],validate=True);total+=len(data)
        if not data or len(data)>8_000_000 or sha(data)!=asset['sha256']:raise ValueError('Asset is empty, too large or has the wrong hash')
        signatures={'.jpg':data.startswith(b'\xff\xd8\xff'),'.jpeg':data.startswith(b'\xff\xd8\xff'),'.png':data.startswith(b'\x89PNG\r\n\x1a\n'),'.webp':data.startswith(b'RIFF') and data[8:12]==b'WEBP'}
        if not signatures[p.suffix.lower()]:raise ValueError('Asset file signature does not match extension')
    if total>24_000_000:raise ValueError('Package assets exceed size limit')
    if not a['thumbnail'].startswith('/images/blog/') or 'frontend/public'+a['thumbnail'] not in paths:raise ValueError('The exact review image must be embedded in assets')
    translations=package['translations']
    if not isinstance(translations,list):raise ValueError('Translations must be a list')
    if translations and {t.get('lang') for t in translations}!=LOCALES:raise ValueError('Supply the complete four-locale set, or publish English only')
    if len(translations) not in (0,4):raise ValueError('Duplicate or incomplete translations')
    for t in translations:
        if t.get('slug')!=slug or t.get('sourceTitle')!=a['title'] or t.get('image')!=a['thumbnail'] or t.get('published_at')!=a['date']:raise ValueError('Translation metadata differs from the approved English article')
        for key in ('title','excerpt','category','content','sourceHash'):
            if not isinstance(t.get(key),str) or not t[key]:raise ValueError('Incomplete translation')
        parser=ArticleHTML();parser.feed(t['content']);parser.close()
        if parser.stack:raise ValueError('Unclosed translation HTML')
    return digest(package)


def stage(package):
    h=validate(package);target=STATE/'packages'/h/'package.json'
    if target.exists():
        if digest(read_json(target))!=h:raise ValueError('Existing staged package is corrupt')
    else:
        write_json(target,package);target.chmod(0o444)
    review={'schema':SCHEMA,'sha256':h,'status':'awaiting_user_review','slug':package['article']['slug'],'locales':['en']+sorted(t['lang'] for t in package['translations']),'package_path':str(target)}
    write_json(target.parent/'review.json',review)
    a=package['article']
    images=''.join('<figure><img style="max-width:100%" src="data:image/'+('jpeg' if x['path'].endswith(('.jpg','.jpeg')) else PurePosixPath(x['path']).suffix[1:])+';base64,'+x['base64']+'"><figcaption>'+html.escape(x['path'])+'</figcaption></figure>' for x in package['assets'])
    metadata={k:v for k,v in a.items() if k!='content'}
    body='<h1>'+html.escape(a['title'])+'</h1><p><strong>AWAITING YOUR APPROVAL — version '+h+'</strong></p>'+images+a['content']+'<h2>Exact metadata</h2><pre>'+html.escape(json.dumps(metadata,ensure_ascii=False,indent=2))+'</pre><h2>Source evidence and reviewed translations</h2><pre>'+html.escape(json.dumps({'sources':package['sources'],'translations':package['translations']},ensure_ascii=False,indent=2))+'</pre>'
    (target.parent/'review.html').write_text('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Review '+html.escape(a['title'])+'</title><body style="max-width:900px;margin:2rem auto;font:18px/1.6 system-ui;padding:1rem;overflow-wrap:anywhere">'+body+'</body></html>')
    review['review_path']=str(target.parent/'review.html')
    return review


def load_package(h):
    if not re.fullmatch(r'[0-9a-f]{64}',h):raise ValueError('A full SHA-256 version is required')
    package=read_json(STATE/'packages'/h/'package.json')
    if validate(package)!=h:raise ValueError('Staged package changed after versioning')
    return package


def record_approval(h, evidence):
    load_package(h)
    if not evidence.strip() or len(evidence)>2000:raise ValueError('Trusted user approval message reference is required')
    target=STATE/'approvals'/(h+'.json')
    if target.exists():
        old=read_json(target)
        if old.get('sha256')!=h or old.get('approved_by')!='Toby Peters':raise ValueError('Invalid existing approval')
        return old
    receipt={'schema':SCHEMA,'sha256':h,'approved_by':'Toby Peters','approval_message_ref':evidence,'approved_at':stamp()}
    write_json(target,receipt);return receipt


def require_approval(h):
    p=STATE/'approvals'/(h+'.json')
    if not p.exists():raise ValueError('Hold: no explicit user approval exists for this exact version')
    a=read_json(p)
    if a.get('schema')!=SCHEMA or a.get('sha256')!=h or a.get('approved_by')!='Toby Peters' or not a.get('approval_message_ref'):raise ValueError('Invalid user approval receipt')
    return a


def run(args,cwd=None,check=True):
    cwd=REPO if cwd is None else cwd
    r=subprocess.run(args,cwd=cwd,text=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
    if check and r.returncode:raise RuntimeError('Command failed: '+args[0]+' (details in release log)')
    return r


def inject(root,package):
    a=package['article'];mock=root/'frontend/src/data/mock.js';text=mock.read_text()
    # The normalized canonical check below also rejects aliases and SEO rewrites.
    if re.search(r'\bslug\s*:\s*[\"\']'+re.escape(a['slug'])+r'[\"\']',text):raise ValueError('Slug already exists; edits need a separate reviewed update workflow')
    insert=text.rfind('\n];')
    if insert<0:raise ValueError('Cannot locate BLOG_POSTS array boundary')
    entry={**a,'id':a.get('id',a['slug'].replace('-','_')),'featured':False}
    rendered='  {\n'+',\n'.join('    '+key+': '+json.dumps(value,ensure_ascii=False) for key,value in entry.items())+'\n  },\n'
    mock.write_text(text[:insert]+'\n'+rendered+text[insert:])
    changed=['frontend/src/data/mock.js']
    for asset in package['assets']:
        p=root/asset['path'];p.parent.mkdir(parents=True,exist_ok=True)
        data=base64.b64decode(asset['base64'])
        if p.exists() and p.read_bytes()!=data:raise ValueError('Refusing to overwrite an existing image with different bytes')
        p.write_bytes(data);changed.append(asset['path'])
    for t in package['translations']:
        path=f"frontend/src/generated/blog-translations/{t['lang']}/{a['slug']}.json"
        p=root/path
        if p.exists():raise ValueError('Refusing to overwrite existing translated content')
        write_json(p,t);changed.append(path)
    return changed


VERIFY_JS = '''import {createServer} from 'vite';
import fs from 'node:fs';
const a=JSON.parse(fs.readFileSync(process.argv[1],'utf8')).article;
const server=await createServer({root:process.cwd(),appType:'custom',logLevel:'silent',server:{middlewareMode:true}});
try {
 const m=await server.ssrLoadModule('/src/lib/blogPosts.ts');
 const posts=m.CANONICAL_BLOG_POSTS.filter(p=>p.slug===a.slug);
 if(posts.length!==1 || m.BLOG_REDIRECTS[a.slug]) throw Error('Missing, duplicated or redirected approved slug');
 const p=posts[0];
 const expected={title:a.title,excerpt:a.excerpt,category:a.category,published_at:a.date,image:a.thumbnail,tags:a.tags,content:a.content};
 for(const [key,value] of Object.entries(expected)) if(JSON.stringify(p[key])!==JSON.stringify(value)) throw Error('Canonical article differs from approved package: '+key);
 console.log('Exact canonical article verified');
} finally {await server.close();}
'''


@contextlib.contextmanager
def release_tree():
    path=Path(tempfile.mkdtemp(prefix='toft-blog-release-'))
    try:
        run(['git','worktree','add','--detach',str(path),'HEAD'])
        yield path
    finally:
        run(['git','worktree','remove','--force',str(path)],check=False)
        if path.exists():shutil.rmtree(path)


def log_command(args,cwd,log):
    # Do not stream command output: a remote may include a credential-bearing URL.
    r=run(args,cwd,check=False)
    output=re.sub(r'https?://[^\s\"<>]+','[URL redacted]',r.stdout)
    output=re.sub(r'(?i)(authorization\s*[:=]\s*)([^\n]+)',r'\1[redacted]',output)
    with log.open('a') as f:f.write('\n$ '+args[0]+' '+('build' if args[0]=='npm' else '[arguments omitted]')+'\n'+output+'\n')
    if r.returncode:
        lines=output.splitlines()
        errors=[line for line in lines if re.search(r'error|failed|TypeError|ReferenceError|Cannot ',line,re.I)]
        detail='\n'.join(errors[-6:]+lines[-18:])
        raise RuntimeError(f'Command failed ({r.returncode}); full log: {log}\n{detail}')
    return r.stdout.strip()


def publish(h,dry_run=False):
    package=load_package(h)
    if not dry_run:require_approval(h)
    STATE.mkdir(parents=True,exist_ok=True)
    with (STATE/'.release.lock').open('a') as lock:
        fcntl.flock(lock,fcntl.LOCK_EX)
        receipt_path=STATE/'receipts'/(h+'.json')
        if receipt_path.exists():
            receipt=read_json(receipt_path)
            if receipt.get('status')=='pushed':return receipt
        log=STATE/'logs'/(h+('-preflight' if dry_run else '')+'.log');log.parent.mkdir(parents=True,exist_ok=True)
        # A previous uncertain push must be reconciled, never duplicated.
        if not dry_run:
            log_command(['git','fetch','origin','main'],REPO,log)
            previous=read_json(receipt_path) if receipt_path.exists() else None
            if previous and previous.get('commit'):
                commit=previous['commit']
                if run(['git','merge-base','--is-ancestor',commit,'origin/main'],check=False).returncode==0:
                    previous.update(status='pushed',confirmed_at=stamp());write_json(receipt_path,previous);return previous
                log_command(['git','push','origin',commit+':refs/heads/main'],REPO,log)
                previous.update(status='pushed',confirmed_at=stamp());write_json(receipt_path,previous);return previous
            if run(['git','merge-base','--is-ancestor','origin/main','HEAD'],check=False).returncode:
                raise ValueError('Repository base is stale/diverged; hold for explicit infrastructure reconciliation')
        with release_tree() as tree:
            # Astro virtual CSS IDs require dependencies under this worktree root.
            # A symlink to the canonical node_modules breaks ClientRouter metadata.
            shutil.copytree(REPO/'frontend/node_modules',tree/'frontend/node_modules',symlinks=True,ignore=shutil.ignore_patterns('.vite','.vite-temp','.cache'))
            changed=inject(tree,package)
            package_path=STATE/'packages'/h/'package.json'
            log_command(['node','--input-type=module','-e',VERIFY_JS,str(package_path)],tree/'frontend',log)
            log_command(['npm','run','build'],tree/'frontend',log)
            log_command(['node','--input-type=module','-e',VERIFY_JS,str(package_path)],tree/'frontend',log)
            # Recheck exact bytes and approval after the build, before any commit/push.
            if digest(load_package(h))!=h:raise ValueError('Package changed during build')
            for asset in package['assets']:
                if sha((tree/asset['path']).read_bytes())!=asset['sha256']:raise ValueError('Asset changed during build')
            for t in package['translations']:
                if read_json(tree/f"frontend/src/generated/blog-translations/{t['lang']}/{t['slug']}.json")!=t:raise ValueError('Translation changed during build')
            result={'schema':SCHEMA,'sha256':h,'slug':package['article']['slug'],'status':'preflight_passed' if dry_run else 'built','at':stamp(),'log':str(log),'url':'https://tobyonfitnesstech.com/blog/'+package['article']['slug']}
            if dry_run:return result
            require_approval(h)
            log_command(['git','add','--',*changed],tree,log)
            log_command(['git','commit','-m','Blog approved package '+h],tree,log)
            commit=run(['git','rev-parse','HEAD'],tree).stdout.strip()
            result.update(commit=commit,status='push_pending');write_json(receipt_path,result)
            log_command(['git','push','origin',commit+':refs/heads/main'],tree,log)
            result.update(status='pushed',confirmed_at=stamp());write_json(receipt_path,result)
            merge=run(['git','merge','--ff-only',commit],check=False)
            result['checkout_status']='advanced' if merge.returncode==0 else 'needs_reconciliation'
            write_json(receipt_path,result)
            return result


def source_intake():
    base=REPO/'scripts/dgx';plan=read_json(base/'blog-source-plan.json');library=read_json(base/'source-library.json')
    mock=(REPO/'frontend/src/data/mock.js').read_text()
    return {'schema':'toft-blog-intake-v1','exported_at':stamp(),'plan':plan,'library':library,'published_slugs':re.findall(r'\bslug\s*:\s*[\"\']([^\"\']+)',mock),'pending_path':'/home/toby/.openclaw/workspace/blog-drafts/pending.json','policy':{'private_source_code':'never ingest or publish','sources':'Only complete public prose, verified long-form transcript passages, and owner-approved narrative notes','schedule':'ARIA drafts at 18:00 America/New_York; publish only immediately after exact-version user approval'}}


def import_pending():
    original=read_json('/home/toby/.openclaw/workspace/blog-drafts/pending.json')
    article={k:v for k,v in original.items() if k in ARTICLE_REQUIRED|ARTICLE_OPTIONAL}
    image=article['thumbnail'];data=(REPO/'frontend/public'/image.lstrip('/')).read_bytes()
    library=read_json(REPO/'scripts/dgx/source-library.json')['documents']
    ids=[d['id'] for d in (article.get('source_bundle') or {}).get('documents',[])]
    if not ids:raise ValueError('Legacy pending has no document bundle; curate its source packet explicitly')
    sources=[]
    for id in ids:
        s=dict(library[id]);s['sha256']=sha(s['text'].encode());sources.append(s)
    return {'schema':SCHEMA,'article':article,'sources':sources,'assets':[{'path':'frontend/public'+image,'sha256':sha(data),'base64':base64.b64encode(data).decode()}],'translations':[]}


def main():
    p=argparse.ArgumentParser(description=__doc__);sub=p.add_subparsers(dest='command',required=True)
    stage_p=sub.add_parser('stage');stage_p.add_argument('file',help='JSON file, or - for stdin')
    sub.add_parser('intake');sub.add_parser('import-pending')
    for name in ('show','preflight','publish','approve-and-publish'):
        cmd=sub.add_parser(name);cmd.add_argument('--sha256',required=True)
        if name=='approve-and-publish':cmd.add_argument('--approval-message-ref',required=True)
    a=p.parse_args()
    try:
        if a.command=='stage':result=stage(json.load(sys.stdin) if a.file=='-' else read_json(a.file))
        elif a.command=='intake':result=source_intake()
        elif a.command=='import-pending':result=stage(import_pending())
        elif a.command=='show':result=load_package(a.sha256)
        else:
            if a.command=='approve-and-publish':record_approval(a.sha256,a.approval_message_ref)
            result=publish(a.sha256,dry_run=a.command=='preflight')
        print(json.dumps(result,ensure_ascii=False,indent=2));return 0
    except Exception as exc:
        print(str(exc),file=sys.stderr);return 1


if __name__=='__main__':raise SystemExit(main())
