// Draws CalendarHeatmap.astro grids from their compact data attributes.
const SVG_NS = 'http://www.w3.org/2000/svg';
const DAY_MS = 86400000;

function draw(root) {
  const cells = root.querySelector('[data-cells]');
  if (!cells || root.dataset.drawn) return;
  root.dataset.drawn = 'true';
  const levels = root.dataset.levels || '';
  const colors = JSON.parse(root.dataset.colors || '[]');
  const size = Number(root.dataset.cell);
  const step = size + Number(root.dataset.gap);
  // Inset by 1px and stroke 2px in the same colour: full-size cells with soft corners.
  const inner = size - 2;
  const paths = colors.map(() => []);
  for (let index = 0; index < levels.length; index += 1) {
    if (levels[index] === '-') continue;
    const x = Math.floor(index / 7) * step + 1;
    const y = (index % 7) * step + 1;
    paths[Number(levels[index])].push(`M${x} ${y}h${inner}v${inner}h-${inner}z`);
  }
  paths.forEach((parts, level) => {
    if (!parts.length) return;
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', parts.join(''));
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-linejoin', 'round');
    path.style.fill = colors[level];
    path.style.stroke = colors[level];
    cells.append(path);
  });

  const values = new Map(
    (root.dataset.values || '')
      .split(';')
      .filter(Boolean)
      .map((entry) => {
        const split = entry.indexOf(':');
        return [Number(entry.slice(0, split)), entry.slice(split + 1)];
      }),
  );
  const start = Date.parse(`${root.dataset.start}T00:00:00Z`);
  const left = Number(root.dataset.left);
  const top = Number(root.dataset.top);
  const tip = root.querySelector('[data-heatmap-tip]');
  const svg = root.querySelector('svg');
  svg.addEventListener('pointermove', (event) => {
    const box = svg.getBoundingClientRect();
    const x = event.clientX - box.left - left;
    const y = event.clientY - box.top - top;
    const col = Math.floor(x / step);
    const row = Math.floor(y / step);
    const index = col * 7 + row;
    if (x < 0 || y < 0 || row > 6 || x % step > size || y % step > size || index >= levels.length || levels[index] === '-') {
      tip.hidden = true;
      return;
    }
    const date = new Date(start + index * DAY_MS).toISOString().slice(0, 10);
    tip.textContent = `${date}: ${values.get(index) || root.dataset.empty}`;
    tip.hidden = false;
    tip.style.left = `${left + col * step}px`;
    tip.style.top = `${top + row * step + (row < 2 ? size + 6 : -28)}px`;
  });
  svg.addEventListener('pointerleave', () => {
    tip.hidden = true;
  });

  // Open on the latest weeks rather than the oldest.
  const scroller = root.closest('.overflow-x-auto');
  if (scroller) scroller.scrollLeft = scroller.scrollWidth;
}

function drawAll() {
  document.querySelectorAll('[data-calendar-heatmap]').forEach(draw);
}

drawAll();
document.addEventListener('astro:page-load', drawAll);
