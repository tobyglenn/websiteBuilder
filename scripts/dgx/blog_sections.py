"""Canonical, timestamped blog sources. Shorts never enter this library.

Matching uses transcript words, not similar titles. Uncertain lineage and legacy
coverage stay on hold; no artificial timestamps or guessed unused intervals.
"""
from __future__ import annotations
from collections import Counter, defaultdict
import ast
from difflib import SequenceMatcher
from pathlib import Path
import hashlib
import html
import json
import math
import re

VERSION = 'canonical-sections-v1'

def sha(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False).encode()).hexdigest()

def tokens(text):
    return re.findall(r"[a-z0-9]+", html.unescape(text).lower())

def duration(video):
    if video.get('duration_seconds'):
        return float(video['duration_seconds'])
    value = str(video.get('duration_formatted') or video.get('duration') or '')
    if re.fullmatch(r'\d+(?::\d+){1,2}', value):
        result = 0
        for part in value.split(':'): result = result * 60 + int(part)
        return result
    value = str(video.get('duration_iso') or '')
    match = re.fullmatch(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', value)
    return sum(int(x or 0) * scale for x, scale in zip(match.groups(), (3600,60,1))) if match else 0

def valid_timing(document, video_id, length):
    if document.get('video_id') != video_id:
        raise ValueError('Timed transcript video identity mismatch')
    rows = document.get('segments', [])
    if not rows: raise ValueError('Timed captions missing')
    previous = -1
    for row in rows:
        a, b = row.get('start'), row.get('end')
        if not isinstance(a, (int,float)) or not isinstance(b, (int,float)) or not math.isfinite(a+b) or not 0 <= a < b <= length+10 or a < previous or not str(row.get('text','')).strip():
            raise ValueError('Missing, unordered, or invalid caption timestamps')
        previous = a
    return rows

def published_sections(text):
    """Read flat source metadata across JSON/JS quoting and formatter line breaks."""
    result=[]
    for marker in re.finditer(r"[\"']?source_section[\"']?\s*:\s*", text):
        tail=text[marker.end():]
        if tail.startswith('null'): continue
        match=re.match(r"\{[^{}]*\}",tail,re.S)
        if not match: raise ValueError('Malformed published section ledger')
        literal=re.sub(r'([{,]\s*)([A-Za-z_]\w*)\s*:',r'\1"\2":',match[0])
        try: value=ast.literal_eval(literal)
        except (ValueError,SyntaxError): raise ValueError('Malformed published section ledger')
        if not isinstance(value,dict) or not all(key in value for key in ('video_id','start','end')):
            raise ValueError('Incomplete published section ledger')
        result.append(value)
    return result


def overlap(left, right):
    return left['video_id'] == right['video_id'] and max(left['start'],right['start']) < min(left['end'],right['end'])

def match_uploads(texts, catalog):
    """Find substantive containment, preserving ambiguous/edited matches as holds."""
    words = {key:tokens(value) for key,value in texts.items() if key in catalog and catalog[key].get('is_short') is False}
    shingles = defaultdict(set)
    for key, seq in words.items():
        for i in range(0,len(seq)-7,4): shingles[tuple(seq[i:i+8])].add(key)
    aliases, holds = {}, {}
    partial_parents = defaultdict(set)
    for child, seq in words.items():
        if len(seq) < 150: continue
        votes = Counter()
        for i in range(len(seq)-7):
            for parent in shingles.get(tuple(seq[i:i+8]), ()):
                if parent != child and duration(catalog[parent]) > duration(catalog[child])*1.15:
                    votes[parent] += 1
        matches=[]
        for parent,count in votes.most_common():
            if count < 60: continue
            blocks=[b for b in SequenceMatcher(None, seq, words[parent], autojunk=False).get_matching_blocks() if b.size>=8]
            matched=sum(b.size for b in blocks)
            if matched < 150: continue
            start=min(b.b for b in blocks); end=max(b.b+b.size for b in blocks)
            ratio=matched/len(seq)
            if ratio>=.80 and matched>=300:
                # An edited upload can contain several disjoint original ranges.
                # Separate large source gaps instead of reserving the intervening
                # discussion as if it appeared in the clip.
                groups=[]
                for block in blocks:
                    if not groups or block.b-groups[-1]['end_token']>60:
                        groups.append({'start_token':block.b,'end_token':block.b+block.size})
                    else: groups[-1]['end_token']=block.b+block.size
                if sum(r['end_token']-r['start_token'] for r in groups)>len(seq)*1.6:
                    holds[child]='Alignment spans too much unmatched source';partial_parents[child].add(parent);continue
                matches.append({'video_id':parent,'token_ranges':groups,'matched_words':matched,'coverage':round(ratio,4),'child_sha256':sha(seq),'parent_sha256':sha(words[parent])})
            else:
                holds[child]='Partial transcript overlap; edited clip or compilation needs verified lineage'
                partial_parents[child].add(parent)
        if matches:
            matches.sort(key=lambda x:duration(catalog[x['video_id']]),reverse=True)
            root=matches[0]
            # Other matches must themselves occur inside the same original.
            ambiguous = False
            for alternative in matches[1:]:
                other = words[alternative['video_id']]
                same_original = sum(block.size for block in SequenceMatcher(None,other,words[root['video_id']],autojunk=False).get_matching_blocks() if block.size>=8) / len(other)
                if same_original < .80:
                    ambiguous = True
            if ambiguous: holds[child]='Multiple incompatible source matches; verify original'
            else: aliases[child]=root;holds.pop(child,None)
    for child,parents in partial_parents.items():
        if child not in aliases:
            for parent in parents:
                holds[parent]=f'Partially matched excerpt {child} needs reconciliation before reusing this original'
    return aliases,holds

def timed_alias(mapping, parent_text, rows):
    # Word offsets are usable only when the text matched is the actual timed text.
    timed_words=tokens(' '.join(s['text'] for s in rows))
    if sha(timed_words)!=mapping['parent_sha256']:
        raise ValueError('Clip alignment requires the exact timed parent transcript')
    ranges=[]
    for span in mapping['token_ranges']:
        offset=0; touched=[]
        for row in rows:
            end=offset+len(tokens(row['text']))
            if offset < span['end_token'] and end > span['start_token']: touched.append(row)
            offset=end
        if not touched: raise ValueError('Clip alignment has no timed evidence')
        ranges.append({'video_id':mapping['video_id'],'start':touched[0]['start'],'end':max(r['end'] for r in touched)})
    return ranges


def subtract_coverage(span, key, coverage):
    """Keep unused portions of authored chapters, even beside overlapping clips."""
    pieces = [(span['start'], span['end'])]
    for used in coverage:
        if used['video_id'] != key: continue
        next_pieces = []
        for start,end in pieces:
            if used['end'] <= start or used['start'] >= end:
                next_pieces.append((start,end))
            else:
                if start < used['start']: next_pieces.append((start,used['start']))
                if used['end'] < end: next_pieces.append((used['end'],end))
        pieces = next_pieces
    return [{**span,'start':a,'end':b} for a,b in pieces]


def build_inventory(catalog, texts, timed, legacy_used, published=(), min_words=600, curated=None):
    videos={v['id']:v for v in catalog if v.get('is_short') is False and duration(v)>0}
    # Prefer timed text for alignment; never interpolate timestamps into flat text.
    rows={}; holds={}
    for key,doc in timed.items():
        if key not in videos: continue
        try: rows[key]=valid_timing(doc,key,duration(videos[key]))
        except ValueError as exc: holds[key]=str(exc)
    texts={key:text for key,text in texts.items() if key in videos}
    texts.update({key:' '.join(r['text'] for r in value) for key,value in rows.items()})
    aliases, lineage_holds=match_uploads(texts,videos)
    for key,video in videos.items():
        description = str(video.get('description') or '')
        if key not in aliases and re.search(r"(?i)(?:clip(?:ped)?|excerpt|segment) (?:from|of)|(?:full|original) (?:video|livestream)(?: here|:| at)", description):
            lineage_holds[key] = 'Upload describes an excerpt; original range must be verified'

    holds.update(lineage_holds)
    coverage=[]
    unresolved=set()
    for item in published:
        key=item.get('video_id');a=item.get('start');b=item.get('end')
        if key not in videos or not isinstance(a,(int,float)) or not isinstance(b,(int,float)) or not math.isfinite(a+b) or not 0<=a<b<=duration(videos[key])+10:
            raise ValueError('Invalid committed source coverage; publication held')
        if key in aliases:
            mapping=aliases[key];parent=mapping['video_id']
            try:
                # A newly discovered original must not reset earlier coverage.
                # Conservatively reserve its matched ranges until the older
                # partial article range is reconciled against that new lineage.
                coverage.extend({**span,'kind':'remapped-publication','upload_id':key} for span in timed_alias(mapping,texts[parent],rows[parent]))
            except (KeyError,ValueError): unresolved.add(parent)
        else: coverage.append(dict(item))
    for key in legacy_used:
        if key not in videos: continue
        if key in aliases:
            mapping=aliases[key];parent=mapping['video_id']
            try:
                coverage.extend({**span,'kind':'legacy-clip','upload_id':key} for span in timed_alias(mapping,texts[parent],rows[parent]))
            except (KeyError,ValueError): unresolved.add(parent)
        else: unresolved.add(key)
    # Partial overlaps cannot make the parent silently eligible either.
    for child in lineage_holds:
        unresolved.add(child)
    for child,mapping in aliases.items():
        parent=mapping['video_id']
        try:
            mapping['canonical_ranges']=timed_alias(mapping,texts[parent],rows[parent])
            if len(mapping['canonical_ranges'])==1: mapping['canonical_range']=mapping['canonical_ranges'][0]
        except (KeyError,ValueError): mapping['hold']='Original timed captions required'
    sections=[]
    for key,video in videos.items():
        if key in aliases: continue  # Only original uploads can feed the writer.
        if key not in texts: holds.setdefault(key,'Transcript missing');continue
        if key not in rows: holds.setdefault(key,'Original timed captions required');continue
        chapters=video.get('chapters') or []
        spans=(curated or {}).get(key)
        if spans is None:
            if chapters:
                starts=[float(c['seconds']) for c in chapters]
                if starts!=sorted(set(starts)) or starts[0]<0 or starts[-1]>=duration(video):
                    holds[key]='Invalid chapter boundaries';continue
                spans=[{'start':a,'end':starts[i+1] if i+1<len(starts) else duration(video),'title':chapters[i]['title']} for i,a in enumerate(starts)]
            else:
                spans=[{'start':0,'end':duration(video),'title':video['title']}]
        # Preserve fully covered chapters for the report; expose substantial free
        # remainders of partially covered chapters without repeating used cues.
        spans = [piece for span in spans for piece in (subtract_coverage(span,key,coverage) or [{**span,'covered':True}])]
        for span in spans:
            a,b=span['start'],span['end']
            if not 0<=a<b<=duration(video): raise ValueError('Invalid curated section')
            selected=[r for r in rows[key] if a<=r['start']<b and r['end']<=b+0.001]
            text='\n'.join(r['text'] for r in selected)
            item={'video_id':key,'start':a,'end':b,'title':span['title'],'recorded_at':str(video.get('publishedAt') or video.get('published_at') or '')[:10],'text':text,'words':len(tokens(text)),'source_url':f'https://www.youtube.com/watch?v={key}&t={int(a)}s','timing_sha256':sha(rows[key])}
            item['section_id']=f'{key}:{a:g}-{b:g}'
            item['sha256']=sha({k:item[k] for k in ('video_id','start','end','text','timing_sha256','recorded_at')})
            if key in holds: item['status']='lineage-hold';item['reason']=holds[key]
            elif key in unresolved: item['status']='legacy-coverage-unresolved';item['reason']='Earlier coverage has no verified range; reconcile before reusing'
            elif any(overlap(item,c) for c in coverage): item['status']='covered'
            elif item['words']<min_words: item['status']='insufficient-source'
            else: item['status']='available'
            sections.append(item)
    return {'policy':VERSION,'sections':sections,'aliases':aliases,'holds':holds,'coverage':coverage,'legacy_unresolved':sorted(unresolved),'excluded_shorts':sum(v.get('is_short') is True for v in catalog)}

def identity(section):
    return {key:section[key] for key in ('video_id','start','end','section_id','sha256','timing_sha256')}

def require_available(draft,inventory):
    requested=draft.get('source_section')
    if not isinstance(requested,dict): raise ValueError('Source section and verified timestamp range required')
    found=next((s for s in inventory['sections'] if identity(s)==requested),None)
    if not found or found['status']!='available': raise ValueError('Source section changed, overlaps coverage, or has unresolved lineage')
    if draft.get('source_video_id')!=found['video_id'] or draft.get('source_url')!=found['source_url']:
        raise ValueError('Article must reference the canonical original and timestamp')
    return found
