"""Public documents and explicitly approved owner notes for the daily blog.

Never crawl a local project checkout or use a repository credential. Repository
visibility is checked over the public GitHub API before fetching prose files.
"""
from __future__ import annotations
import base64
from datetime import datetime, timezone
import hashlib
import html
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.parse import urlparse, quote
from urllib.request import Request, urlopen

VERSION = 'daily-evidence-bundles-v1'
MAX_DOCUMENT = 100000
LANES = ('youtube', 'game-development', 'creator-production', 'public-projects', 'model-workflows')


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False).encode()).hexdigest()


def read_json(path, default=None):
    return json.loads(Path(path).read_text()) if Path(path).exists() else default


def save_json(path, value):
    path = Path(path); path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix('.tmp'); temp.write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n'); temp.replace(path)


def fetch(url):
    req = Request(url, headers={'User-Agent':'TobyOnFitnessTech-editorial/1.0', 'Accept':'application/vnd.github+json'})
    with urlopen(req, timeout=35) as response:
        raw = response.read(4_000_001)
    if len(raw)>4_000_000: raise ValueError('Public source exceeds download limit')
    return raw.decode('utf-8')


class PublicProse(HTMLParser):
    def __init__(self):
        super().__init__(); self.main=0; self.skip=0; self.parts=[]
    def handle_starttag(self,tag,attrs):
        if tag=='main': self.main+=1
        if tag in ('script','style','pre','code','nav','footer','header','button'): self.skip+=1
        if tag in ('p','h1','h2','h3','li','section','br') and self.main and not self.skip: self.parts.append('\n')
    def handle_endtag(self,tag):
        if tag in ('script','style','pre','code','nav','footer','header','button'): self.skip=max(0,self.skip-1)
        if tag=='main': self.main=max(0,self.main-1)
        if tag in ('p','h1','h2','h3','li'): self.parts.append('\n')
    def handle_data(self,text):
        if self.main and not self.skip:self.parts.append(text)
    def text(self):
        return '\n'.join(' '.join(line.split()) for line in ''.join(self.parts).splitlines() if line.strip())


def prose_markdown(text):
    # Prose-only intake, even for public repos. No source files or code fences.
    text = re.sub(r'```[\s\S]*?```|~~~[\s\S]*?~~~','',text)
    text = re.sub(r'!\[[^]]*\]\([^)]*\)','',text)
    text = re.sub(r'\[([^]]+)\]\([^)]*\)',r'\1',text)
    return text.strip()


def validate_definition(doc):
    kind=doc.get('kind')
    if kind=='public-page':
        u=urlparse(doc.get('url',''))
        if u.scheme!='https' or u.hostname!='tobyonfitnesstech.com' or not u.path.startswith(('/projects/','/games/journal/')) or u.query:
            raise ValueError('Public page is outside the editorial allowlist')
    elif kind=='public-repo-doc':
        if not re.fullmatch(r'[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+',doc.get('repo','')):raise ValueError('Invalid public repository')
        path=doc.get('path','')
        if '..' in Path(path).parts or Path(path).suffix.lower() not in ('.md','.txt','.rst'):
            raise ValueError('Only explicitly listed public prose documents are permitted')
    elif kind=='public-video-transcript':
        if not re.fullmatch(r'[A-Za-z0-9_-]{11}',doc.get('video_id','')) or doc.get('is_short') is not False:
            raise ValueError('Public video identity and long-form format are required')
        if doc.get('repo')!='tobyglenn/websiteBuilder':raise ValueError('Transcript repository is not approved')
    elif kind=='owner-approved-note':
        if doc.get('publication_approved') is not True or doc.get('disclosure')!='narrative-only-no-private-code' or not doc.get('approved_at'):
            raise ValueError('Owner note lacks explicit narrative publication approval')
        if any(key in doc for key in ('path','repo','local_path','source_code')):raise ValueError('Owner notes cannot load private repository files')
        if re.search(r'(?m)```|~~~|^\s*(?:def \w+\(|class \w+[:(]|function \w+\()',doc.get('text','')):raise ValueError('Owner notes must contain narrative prose, not source code')
    else:raise ValueError('Unsupported editorial source kind')


def retrieve_document(doc, repo_metadata):
    validate_definition(doc); kind=doc['kind']
    if kind=='public-page':
        parser=PublicProse();parser.feed(fetch(doc['url']));text=parser.text();url=doc['url']
    elif kind in ('public-repo-doc','public-video-transcript'):
        repo=doc['repo']
        metadata=repo_metadata.setdefault(repo, None)
        if metadata is None:
            metadata=json.loads(fetch('https://api.github.com/repos/'+repo));repo_metadata[repo]=metadata
        if metadata.get('private') is not False or metadata.get('visibility','public')!='public':
            raise ValueError('Repository is not verified public; source will not be read')
        file_path=doc['path'] if kind=='public-repo-doc' else 'frontend/src/data/video-transcripts/'+doc['video_id']+'.json'
        item=json.loads(fetch('https://api.github.com/repos/'+repo+'/contents/'+quote(file_path,safe='/')))
        if item.get('type')!='file' or item.get('encoding')!='base64':raise ValueError('Public prose file is unavailable')
        decoded=base64.b64decode(item['content']).decode('utf-8')
        if kind=='public-repo-doc':text=prose_markdown(decoded);url=item['html_url']
        else:
            transcript=json.loads(decoded)
            if transcript.get('video_id')!=doc['video_id']:raise ValueError('Transcript identity mismatch')
            rows=transcript.get('segments',[])
            if not rows or any(not isinstance(r.get('text'),str) or not r['text'].strip() for r in rows):raise ValueError('Transcript prose is required')
            timed=all(isinstance(r.get('start'),(int,float)) and isinstance(r.get('end'),(int,float)) and r['end']>r['start'] for r in rows)
            if 'start' in doc:
                if not timed:raise ValueError('Timed transcript cues are required for a selected range')
                rows=[r for r in rows if r['start']>=doc['start'] and r['end']<=doc['end']+0.001]
                if not rows:raise ValueError('Selected video passage has no complete timed cues')
            text=' '.join(r['text'] for r in rows);url='https://www.youtube.com/watch?v='+doc['video_id']
            if timed:url+='&t='+str(int(rows[0]['start']))+'s'
    else:
        text=doc['text'].strip();url=None
    if not text or len(text)>MAX_DOCUMENT:raise ValueError('Empty or oversized editorial document')
    return {'id':doc['id'],'kind':kind,'title':doc['title'],'url':url,'text':text,
            'sha256':digest(text),'definition_sha256':digest(doc),'verified_at':datetime.now(timezone.utc).isoformat(),
            'publication_approved':True,'disclosure':'narrative-only-no-private-code'}


def discover(plan):
    """New public release journals become candidates without a hand-maintained list."""
    added=0
    try:
        item=json.loads(fetch('https://api.github.com/repos/tobyglenn/websiteBuilder/contents/frontend/src/data/games/journal.json'))
        rows=json.loads(base64.b64decode(item['content']).decode())
        existing_urls={d.get('url') for d in plan['documents']}
        for row in rows:
            url='https://tobyonfitnesstech.com/games/journal/'+row['slug']+'/'
            if url in existing_urls:continue
            docid='journal-'+row['slug']
            plan['documents'].append({'id':docid,'kind':'public-page','title':row['title'],'url':url})
            game='wild-project' if row['game']=='wild-rebellion' else 'monstrum-project'
            plan['topics'].append({'id':docid,'lane':'game-development','title':row['title'],
                'question':'What changed in '+row['title']+', and how does it affect the experience of playing?',
                'documents':[game,docid]})
            added+=1
    except Exception:
        pass  # Existing public snapshots and other lanes remain available.
    return added


def refresh(plan, cache_path):
    cached=read_json(cache_path, {'documents':{}}); docs={};errors=[];metadata={}
    for definition in plan['documents']:
        try:docs[definition['id']]=retrieve_document(definition,metadata)
        except Exception as exc:
            # Public snapshots remain dated evidence, never represented as live status.
            prior=cached.get('documents',{}).get(definition['id'])
            if prior and definition['kind']=='public-page' and prior.get('url')==definition.get('url'):docs[definition['id']]=prior
            # A contents outage may reuse a dated public snapshot only after the
            # repository itself was successfully verified public in this refresh.
            repo=metadata.get(definition.get('repo'),{}) or {}
            transient=isinstance(exc,(TimeoutError,ConnectionError,OSError)) and getattr(exc,'code',None) not in (401,403,404)
            if prior and prior.get('definition_sha256')==digest(definition) and definition['kind'] in ('public-repo-doc','public-video-transcript') and transient and repo.get('private') is False and repo.get('visibility','public')=='public':
                docs[definition['id']]=prior
            errors.append({'id':definition['id'],'error':str(exc)[:250]})
    result={'version':VERSION,'refreshed_at':datetime.now(timezone.utc).isoformat(),'documents':docs,'errors':errors}
    save_json(cache_path,result);return result


def bundle(topic, documents):
    if not topic.get('id') or topic.get('lane') not in LANES or not topic.get('question'):
        raise ValueError('Editorial angle lacks identity, lane or reader question')
    chosen=[]
    for key in topic['documents']:
        doc=documents.get(key)
        if not doc or doc.get('publication_approved') is not True or doc.get('disclosure')!='narrative-only-no-private-code':
            raise ValueError('Editorial evidence is missing or not approved')
        chosen.append(doc)
    if not chosen:raise ValueError('Editorial angle has no evidence')
    text='\n\n'.join('DOCUMENT: '+d['title']+'\nSOURCE: '+(d['url'] or 'Owner-approved narrative note')+'\n'+d['text'] for d in chosen)
    if len(text)>120000:raise ValueError('Evidence bundle exceeds full-context limit')
    identity={'kind':VERSION,'topic_id':topic['id'],'lane':topic['lane'],
              'question':topic['question'],'documents':[{'id':d['id'],'sha256':d['sha256'],'url':d['url']} for d in chosen]}
    return {'identity':identity,'sha256':digest(identity),'text':text,'documents':chosen,'topic':topic}


def published_bundles(mock_text):
    # The committed ledger is authoritative after a crash between push and cleanup.
    decoder=json.JSONDecoder();out=[]
    for match in re.finditer(r'\bsource_bundle:\s*',mock_text):
        value,_=decoder.raw_decode(mock_text[match.end():])
        if value is not None:
            if not isinstance(value,dict) or value.get('kind')!=VERSION:raise ValueError('Malformed committed editorial source ledger')
            out.append(value)
    return out


def candidates(plan, cached, published=(), reserved=()):
    used={x['topic_id'] for x in published}|set(reserved)
    result=[]
    for topic in plan['topics']:
        if topic['id'] in used:continue
        try:result.append(bundle(topic,cached['documents']))
        except ValueError:continue
    return result


def evidence(packet, minimum_words=600):
    text=packet['text'];words=len(re.findall(r"\b[\w'-]+\b",text))
    if words<minimum_words or len(set(re.findall(r'\b\w+\b',text.lower())))<80:raise ValueError('Evidence bundle is too thin; try another source')
    return {'kind':VERSION,'video_id':'bundle:'+packet['topic']['id'],'title':packet['topic']['title'],
            'text':text,'words':words,'sha256':packet['sha256'],'source_bundle':packet['identity'],
            'recorded_at':'Document snapshots; observe each source context',
            'first_person_policy':'Owner notes support personal claims. Public project documentation supports implementation facts, not invented experiences or opinions.'}


def citation_html(identity, documents):
    links=[]
    for ref in identity['documents']:
        doc=documents[ref['id']]
        if doc['url']:links.append('<a href="'+html.escape(doc['url'],quote=True)+'">'+html.escape(doc['title'])+'</a>')
    return '<p>Sources: '+ '; '.join(links)+'.</p>' if links else ''


if __name__=='__main__':
    import argparse
    parser=argparse.ArgumentParser()
    parser.add_argument('command',choices=['refresh']);parser.add_argument('plan');parser.add_argument('cache')
    args=parser.parse_args()
    plan=read_json(args.plan)
    if discover(plan):save_json(args.plan,plan)
    result=refresh(plan,args.cache)
    print(json.dumps({'documents':len(result['documents']),'errors':result['errors']}))
