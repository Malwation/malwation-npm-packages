// Themed hover tooltips for nodes carrying a title (`id: [ L ] "tip"`).
// The tooltip div lives inside the panel element (position:relative root).

export function attachTooltip(svg, nodeIndex, panelEl) {
  const doc = svg.ownerDocument;
  let tip = null;

  const ensureTip = () => {
    if (!tip) {
      tip = doc.createElement('div');
      tip.className = 'viz-tooltip';
      tip.style.display = 'none';
      panelEl.appendChild(tip);
    }
    return tip;
  };

  const hide = () => {
    if (tip) tip.style.display = 'none';
  };

  const onMove = (ev) => {
    const g = ev.target.closest?.('.viz-node');
    const data = g ? nodeIndex.get(g.getAttribute('data-id')) : null;
    if (!data?.title) {
      hide();
      return;
    }
    const t = ensureTip();
    t.textContent = data.title;
    const rect = panelEl.getBoundingClientRect();
    t.style.display = 'block';
    t.style.left = `${ev.clientX - rect.left + 14}px`;
    t.style.top = `${ev.clientY - rect.top + 10}px`;
  };

  svg.addEventListener('mousemove', onMove);
  svg.addEventListener('mouseleave', hide);

  return {
    destroy() {
      svg.removeEventListener('mousemove', onMove);
      svg.removeEventListener('mouseleave', hide);
      tip?.remove();
      tip = null;
    },
  };
}
