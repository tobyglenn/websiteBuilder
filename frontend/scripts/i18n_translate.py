#!/usr/bin/env python3
import json, re, sys, time
from pathlib import Path
import requests

ROOT = Path('/Users/tobyglennpeters/.openclaw/workspace/websiteBuilder/frontend')
PAGES = ROOT / 'src/pages'
MODEL = 'mlx-community/Qwen3.5-122B-A10B-4bit'
API = 'http://localhost:52415/v1/chat/completions'
LOCALE_NAMES = {'de': 'German', 'es': 'Spanish', 'pt': 'Portuguese (Brazil)', 'hi': 'Hindi'}

TARGETS = [
    '404.astro',
    '500.astro',
    'about.astro',
    'affiliate.astro',
    'bjj.astro',
    'blog/[slug].astro',
    'blog/consistency.astro',
    'blog/exercises.astro',
    'blog/gym-monster-2-vs-original.md',
    'blog/index.astro',
    'blog/oura-vs-whoop-sleep-comparison.md',
    'blog/speediance-vs-tonal-comparison.md',
    'blog/whoop-recovery-scores-explained.md',
    'calculators.astro',
    'compare-trackers.astro',
    'compare.astro',
    'contact.astro',
    'day.astro',
    'faq.astro',
    'fitness-age.astro',
    'games.astro',
    'gear/index.astro',
    'heart-rate.astro',
    'hr-zones.astro',
    'index.astro',
    'live.astro',
    'nutrition.astro',
    'pr.astro',
    'privacy.astro',
    'prs.astro',
    'races.astro',
    'roi.astro',
    'running.astro',
    'search.astro',
    'sleep.astro',
    'speediance.astro',
    'start-here.astro',
    'streaks.astro',
    'terms.astro',
    'timeline.astro',
    'training-log.astro',
    'training.astro',
    'transformation.astro',
    'videos/index.astro',
    'whoop.astro',
    'year-in-review.astro',
]

PROMPT = '''Translate this Astro/Markdown page from English into {language}.

Hard requirements:
- Preserve valid Astro/Markdown/JS/TS syntax exactly.
- Translate only user-visible English text, frontmatter title/description strings, JSON-LD text fields, alt text, headings, labels, button text, placeholder text, aria labels, and inline prose.
- Do NOT translate import paths, component names, CSS classes, variable names, object keys, URLs, slugs, route paths, filenames, HTML tag names, icon names, or JS logic.
- Keep all links and href/src values unchanged unless they are absolute canonicals that should include the locale prefix. If you can safely update canonical URLs for this localized file, do so; otherwise leave them unchanged.
- Set the Layout component lang prop to "{locale}" if there is a Layout tag. If a Layout tag already has lang, update it.
- Keep numeric values, dates, and units meaningful; you may localize surrounding labels.
- Return ONLY the translated file contents. No markdown fences. No commentary.
'''


def adjust_relative_imports(text: str, src_rel: str, dest_rel: str) -> str:
    src_depth = len(Path(src_rel).parent.parts)
    dest_depth = len(Path(dest_rel).parent.parts)
    def repl(match):
        quote, path = match.group(1), match.group(2)
        if not path.startswith('.'):
            return match.group(0)
        abs_src = (PAGES / Path(src_rel).parent / path).resolve()
        try:
            new_rel = Path(abs_src).relative_to(ROOT.resolve())
            rel = Path('/' + str(new_rel))
        except Exception:
            rel = abs_src
        new_path = Path(abs_src).relative_to((PAGES / Path(dest_rel).parent).resolve())
        s = str(new_path)
        if not s.startswith('.'):
            s = './' + s
        return f'{quote}{s}{quote}'
    text = re.sub(r'(["\'])(\.{1,2}/[^"\']+)(["\'])', lambda m: f"{m.group(1)}{str(Path((PAGES / Path(src_rel).parent / m.group(2)).resolve()).relative_to((PAGES / Path(dest_rel).parent).resolve())) if False else m.group(2)}{m.group(3)}", text)
    # safer targeted replacements on import/from and direct src attrs
    def path_repl(m):
        prefix, path, suffix = m.group(1), m.group(2), m.group(3)
        abs_path = (PAGES / Path(src_rel).parent / path).resolve()
        rel = Path(abs_path).relative_to((PAGES / Path(dest_rel).parent).resolve())
        rel_s = str(rel)
        if not rel_s.startswith('.'):
            rel_s = './' + rel_s
        return f'{prefix}{rel_s}{suffix}'
    text = re.sub(r'(from\s+["\'])(\.{1,2}/[^"\']+)(["\'])', path_repl, text)
    text = re.sub(r'((?:import\s+["\']))(\.{1,2}/[^"\']+)(["\'])', path_repl, text)
    return text


def set_layout_lang(text: str, locale: str) -> str:
    if '<Layout' not in text:
        return text
    def repl(m):
        tag = m.group(0)
        if ' lang=' in tag:
            return re.sub(r'lang\s*=\s*(["\']).*?\1', f'lang="{locale}"', tag)
        return tag[:-1] + f' lang="{locale}">'
    return re.sub(r'<Layout\b[^>]*>', repl, text, count=1)


def translate_file(locale: str, rel: str):
    src = PAGES / rel
    dest = PAGES / locale / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    source = src.read_text()
    payload = {
        'model': MODEL,
        'temperature': 0.2,
        'messages': [
            {'role': 'system', 'content': 'You are an expert website localization engineer who preserves syntax perfectly.'},
            {'role': 'user', 'content': PROMPT.format(language=LOCALE_NAMES[locale], locale=locale) + '\n\nFILE PATH: ' + rel + '\n\n' + source},
        ]
    }
    r = requests.post(API, json=payload, timeout=600)
    r.raise_for_status()
    data = r.json()
    content = data['choices'][0]['message']['content']
    content = re.sub(r'^```[a-zA-Z0-9_-]*\n', '', content.strip())
    content = re.sub(r'\n```$', '', content)
    content = adjust_relative_imports(content, rel, f'{locale}/{rel}')
    content = set_layout_lang(content, locale)
    dest.write_text(content)
    print(f'WROTE {dest.relative_to(PAGES)}')


if __name__ == '__main__':
    locale = sys.argv[1]
    selected = TARGETS if len(sys.argv) == 2 else sys.argv[2:]
    for rel in selected:
        try:
            translate_file(locale, rel)
            time.sleep(0.5)
        except Exception as e:
            print(f'ERROR {rel}: {e}', file=sys.stderr)
