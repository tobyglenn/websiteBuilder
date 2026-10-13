// Numbers stay source-owned: translations cannot change prices, versions or specifications.
export function messageKey(text) {
  const values = [];
  const key = String(text).replace(/\s+/g, ' ').trim().replace(/\d+(?:[,.]\d+)*/g, value => {
    values.push(value); return `{{n${values.length - 1}}}`;
  });
  return {key, values};
}
export function translateText(text, messages = {}) {
  const {key, values} = messageKey(text);
  if (!Object.hasOwn(messages, key)) return text;
  const translated = messages[key].replace(/\{\{n(\d+)\}\}/g, (_, i) => values[Number(i)] ?? '');
  return String(text).replace(/\S[\s\S]*\S|\S/, () => translated);
}
export function translateComparison(root) {
  const script = document.getElementById('comparison-locale');
  if (!script) return;
  const messages = JSON.parse(script.textContent);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (node.parentElement?.closest('script,style,code,pre')) continue;
    const value = translateText(node.nodeValue, messages);
    if (value !== node.nodeValue) node.nodeValue = value;
  }
  for (const el of root.querySelectorAll('[aria-label],[title],[alt]')) {
    for (const attr of ['aria-label','title','alt']) if (el.hasAttribute(attr)) {
      el.setAttribute(attr, translateText(el.getAttribute(attr), messages));
    }
  }
}
