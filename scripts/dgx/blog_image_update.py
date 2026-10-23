#!/usr/bin/env python3
"""Exact-version, approved image-only updates to an existing English article."""
import argparse
import base64
import fcntl
import json
from pathlib import Path
import shutil
import sys
import blog_release as release

SLUG = 'wild-rebellion-guidance-without-open-panels'
LAYOUT_VERSION = 'wild-racing-reviewed-cover-v1'
LAYOUT_PATHS = {'frontend/src/lib/homeBlogCovers.mjs', 'frontend/src/components/HomeBlogCover.astro', 'frontend/src/pages/blog/index.astro'}


def validate_update(original, replacement):
    old_hash = release.validate(original)
    new_hash = release.validate(replacement)
    old, new = original['article'], replacement['article']
    if old['slug'] != SLUG or new['slug'] != SLUG:
        raise ValueError('This scoped layout update supports only the reviewed Wild Rebellion article')
    if {k:v for k,v in old.items() if k != 'thumbnail'} != {k:v for k,v in new.items() if k != 'thumbnail'}:
        raise ValueError('Image-only update cannot change article text or metadata')
    if original['sources'] != replacement['sources'] or original['translations'] != replacement['translations']:
        raise ValueError('Image-only update cannot change sources or translations')
    if replacement['translations']:
        raise ValueError('Translated article updates require a separate reviewed workflow')
    if old['thumbnail'] == new['thumbnail'] or not new['thumbnail'].endswith('-aria-review.png'):
        raise ValueError('Use a new immutable reviewed PNG asset path')
    if len(replacement['assets']) != 1 or replacement['assets'][0]['path'] != 'frontend/public'+new['thumbnail']:
        raise ValueError('Only the replacement cover asset is allowed')
    return old_hash, new_hash


def approval_path(new_hash):
    return release.STATE/'image-updates'/'approvals'/(new_hash+'.json')


def require_approval(old_hash, new_hash):
    p = approval_path(new_hash)
    if not p.exists():
        raise ValueError('No explicit image-update approval for this exact version')
    a = release.read_json(p)
    if a.get('original_sha256') != old_hash or a.get('sha256') != new_hash or a.get('layout_version') != LAYOUT_VERSION or a.get('approved_by') != 'Toby Peters' or not a.get('approval_message_ref'):
        raise ValueError('Image-update approval does not match exact versions and layout')
    return a


def record_approval(old_hash, new_hash, message):
    validate_update(release.load_package(old_hash), release.load_package(new_hash))
    if not message.strip() or len(message) > 2000:
        raise ValueError('Explicit trusted approval message reference required')
    p = approval_path(new_hash)
    if p.exists():
        a = require_approval(old_hash, new_hash)
        if a['approval_message_ref'] != message:
            raise ValueError('Existing image-update approval message differs')
        return a
    a = {'original_sha256':old_hash,'sha256':new_hash,'layout_version':LAYOUT_VERSION,'approved_by':'Toby Peters','approval_message_ref':message,'approved_at':release.stamp()}
    release.write_json(p,a)
    return a


def replace_once(text, old, new):
    if text.count(old) != 1:
        raise ValueError('Update base changed; expected one exact matching location')
    return text.replace(old,new,1)


def inject_update(root, original, replacement):
    validate_update(original,replacement)
    old, new = original['article'], replacement['article']
    path = root/'frontend/src/data/mock.js'
    text = path.read_text()
    # The exact canonical original is separately checked before mutation.
    needle = 'thumbnail: '+json.dumps(old['thumbnail'])
    text = replace_once(text,needle,'thumbnail: '+json.dumps(new['thumbnail']))
    path.write_text(text)
    asset = replacement['assets'][0]
    p = root/asset['path']
    data = base64.b64decode(asset['base64'],validate=True)
    if p.exists():
        raise ValueError('Replacement path already exists; refuse overwrite')
    p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
    # These are the only allowed layout mutations. No caller-supplied patch/code.
    path=root/'frontend/src/lib/homeBlogCovers.mjs';text=path.read_text()
    text=replace_once(text,'export function homeBlogCover(post) {','export function homeBlogCover(post) {\n  if (post.slug === '+json.dumps(SLUG)+') return [{ src: '+json.dumps(new['thumbnail'])+', fit: "contain", position: "50% 50%" }];')
    path.write_text(text)
    path=root/'frontend/src/components/HomeBlogCover.astro';text=path.read_text()
    text=replace_once(text,"import games from", "import wildRacingReviewed from '../../public"+new['thumbnail']+"';\nimport games from")
    text=replace_once(text,'const assets: Record<string, ImageMetadata> = {','const assets: Record<string, ImageMetadata> = {\n  '+json.dumps(new['thumbnail'])+': wildRacingReviewed,')
    path.write_text(text)
    path=root/'frontend/src/pages/blog/index.astro';text=path.read_text()
    if text.count('src={featuredPost.image}') != 1 or text.count('src={post.image}') != 2:
        raise ValueError('Blog card layout base changed')
    for variable in ('featuredPost','post'):
        text=text.replace('src={'+variable+'.image}', 'src={'+variable+'.image}\n                    style={'+variable+'.slug === '+json.dumps(SLUG)+' ? "object-fit: contain; transform: none" : undefined}')
    path.write_text(text)
    allowed=LAYOUT_PATHS|{'frontend/src/data/mock.js',asset['path']}
    changed=set(release.run(['git','diff','--name-only'],root).stdout.splitlines())
    untracked=set(release.run(['git','ls-files','--others','--exclude-standard'],root).stdout.splitlines())
    if changed|untracked != allowed:
        raise ValueError('Unexpected changed paths outside image/layout allowlist')
    return sorted(allowed)


def update(old_hash,new_hash,dry_run=False):
    original=release.load_package(old_hash);replacement=release.load_package(new_hash)
    validate_update(original,replacement)
    if not dry_run:require_approval(old_hash,new_hash)
    prior_path=release.STATE/'receipts'/(old_hash+'.json')
    if not prior_path.exists() or release.read_json(prior_path).get('status')!='pushed':
        raise ValueError('Original article must have a confirmed publication receipt')
    root=release.STATE/'image-updates';root.mkdir(parents=True,exist_ok=True)
    with (release.STATE/'.release.lock').open('a') as lock:
        fcntl.flock(lock,fcntl.LOCK_EX)
        receipt=root/'receipts'/(new_hash+'.json')
        log=root/'logs'/(new_hash+('-preflight' if dry_run else '')+'.log');log.parent.mkdir(parents=True,exist_ok=True)
        if receipt.exists():
            previous=release.read_json(receipt)
            if previous.get('original_sha256')!=old_hash or previous.get('sha256')!=new_hash:raise ValueError('Receipt version mismatch')
            if previous.get('status')=='pushed':return previous
            # Do not blindly repeat uncertain pushes or build duplicate updates.
            if previous.get('commit'):
                release.log_command(['git','fetch','origin','main'],release.REPO,log)
                if release.run(['git','merge-base','--is-ancestor',previous['commit'],'origin/main'],check=False).returncode==0:
                    previous.update(status='pushed',confirmed_at=release.stamp());release.write_json(receipt,previous);return previous
                raise ValueError('Pending image-update commit requires explicit push-outcome reconciliation')
        if not dry_run:
            release.log_command(['git','fetch','origin','main'],release.REPO,log)
            if release.run(['git','merge-base','--is-ancestor','origin/main','HEAD'],check=False).returncode:
                raise ValueError('Repository base is stale/diverged; reconcile before image update')
        with release.release_tree() as tree:
            shutil.copytree(release.REPO/'frontend/node_modules',tree/'frontend/node_modules',symlinks=True,ignore=shutil.ignore_patterns('.vite','.vite-temp','.cache'))
            old_path=release.STATE/'packages'/old_hash/'package.json';new_path=release.STATE/'packages'/new_hash/'package.json'
            release.log_command(['node','--input-type=module','-e',release.VERIFY_JS,str(old_path)],tree/'frontend',log)
            changed=inject_update(tree,original,replacement)
            release.log_command(['node','--test','scripts/tests/blog-review-cover.test.mjs','scripts/tests/home-blog-covers.test.mjs'],tree/'frontend',log)
            release.log_command(['node','--input-type=module','-e',release.VERIFY_JS,str(new_path)],tree/'frontend',log)
            release.log_command(['npm','run','build'],tree/'frontend',log)
            release.log_command(['node','--input-type=module','-e',release.VERIFY_JS,str(new_path)],tree/'frontend',log)
            validate_update(release.load_package(old_hash),release.load_package(new_hash))
            asset=replacement['assets'][0]
            if release.sha((tree/asset['path']).read_bytes())!=asset['sha256']:raise ValueError('Approved image changed')
            result={'original_sha256':old_hash,'sha256':new_hash,'layout_version':LAYOUT_VERSION,'status':'preflight_passed' if dry_run else 'built','at':release.stamp(),'log':str(log),'paths':changed}
            if dry_run:
                release.write_json(root/'preflights'/(new_hash+'.json'),result);return result
            require_approval(old_hash,new_hash)
            release.log_command(['git','add','--',*changed],tree,log)
            release.log_command(['git','commit','-m','Approved image-only correction '+new_hash],tree,log)
            commit=release.run(['git','rev-parse','HEAD'],tree).stdout.strip();result.update(commit=commit,status='push_pending');release.write_json(receipt,result)
            release.log_command(['git','push','origin',commit+':refs/heads/main'],tree,log)
            result.update(status='pushed',confirmed_at=release.stamp());release.write_json(receipt,result)
            # Do not mutate another task's active checkout after pushing.
            return result


def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('command',choices=['preflight','approve-and-update','update']);p.add_argument('--original-sha256',required=True);p.add_argument('--sha256',required=True);p.add_argument('--approval-message-ref');a=p.parse_args()
    try:
        if a.command=='approve-and-update':
            if not a.approval_message_ref:raise ValueError('Explicit approval message required')
            record_approval(a.original_sha256,a.sha256,a.approval_message_ref)
        print(json.dumps(update(a.original_sha256,a.sha256,a.command=='preflight'),indent=2));return 0
    except Exception as e:print(str(e),file=sys.stderr);return 1

if __name__=='__main__':sys.exit(main())
