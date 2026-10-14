"""Keep repeated reader questions in the established guide, not a new URL.

Rules are intentionally narrow. A new product or dated software development can
still be a distinct article; a matching draft is held for an editorial update.
"""
import re

def existing_guide(title, guides):
    text = str(title).lower()
    for guide in guides:
        if any(all(re.search(pattern, text, re.I) for pattern in group)
               for group in guide.get('intentPatterns', [])):
            return guide['slug']
    return None
