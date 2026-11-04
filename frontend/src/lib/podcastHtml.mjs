import { parseFragment, serialize } from 'parse5';

// Imported Markdown can contain its own H1s and unfinished citation targets.
// Preserve the article text while making it usable inside an episode page.
export function preparePodcastHtml(html, sourceUrl) {
  const fragment = parseFragment(html || '');
  const visit = (node) => {
    if (node.tagName === 'h1') node.nodeName = node.tagName = 'h2';
    if (node.tagName === 'a') {
      const href = node.attrs.find((attr) => attr.name === 'href');
      if (href && !/^(?:https?:\/\/|mailto:|tel:|\/|#)/i.test(href.value)) {
        // Real relative document links resolve against the public source;
        // placeholders and malformed citation text are displayed as text.
        if (sourceUrl && /^(?:\.{1,2}\/)?[\w./-]+\.(?:md|html?|pdf)(?:[?#].*)?$/i.test(href.value)) {
          href.value = new URL(href.value, sourceUrl).href;
        } else {
          node.nodeName = node.tagName = 'span';
          node.attrs = node.attrs.filter((attr) => !['href', 'target', 'rel'].includes(attr.name));
        }
      }
    }
    node.childNodes?.forEach(visit);
  };
  visit(fragment);
  return serialize(fragment);
}
