// Pan (pointer drag) + zoom (wheel, around cursor) on a diagram's
// .viz-viewport group. Coordinates work in viewBox units so behavior is
// identical however the svg is scaled by CSS.

export function attachViewport(svg, { minScale = 0.25, maxScale = 4 } = {}) {
  const viewport = svg.querySelector('.viz-viewport');
  if (!viewport) return { destroy() {}, reset() {}, fit() {} };

  let scale = 1;
  let tx = 0;
  let ty = 0;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let dragDist = 0;

  const vb = svg.viewBox.baseVal;
  const unitsPerPx = () => {
    const rect = svg.getBoundingClientRect();
    return rect.width ? vb.width / rect.width : 1;
  };

  const apply = () => {
    viewport.setAttribute('transform', `translate(${tx} ${ty}) scale(${scale})`);
  };

  const onWheel = (ev) => {
    ev.preventDefault();
    const k = unitsPerPx();
    const rect = svg.getBoundingClientRect();
    const px = (ev.clientX - rect.left) * k;
    const py = (ev.clientY - rect.top) * k;
    const next = Math.min(maxScale, Math.max(minScale, scale * Math.exp(-ev.deltaY * 0.0015)));
    tx = px - ((px - tx) * next) / scale;
    ty = py - ((py - ty) * next) / scale;
    scale = next;
    apply();
  };

  const onPointerDown = (ev) => {
    if (ev.button !== 0) return;
    dragging = true;
    dragDist = 0;
    lastX = ev.clientX;
    lastY = ev.clientY;
    svg.setPointerCapture?.(ev.pointerId);
  };

  const onPointerMove = (ev) => {
    if (!dragging) return;
    const k = unitsPerPx();
    const dx = ev.clientX - lastX;
    const dy = ev.clientY - lastY;
    dragDist += Math.abs(dx) + Math.abs(dy);
    tx += dx * k;
    ty += dy * k;
    lastX = ev.clientX;
    lastY = ev.clientY;
    apply();
  };

  const onPointerUp = (ev) => {
    dragging = false;
    svg.releasePointerCapture?.(ev.pointerId);
  };

  // a real drag must not fire node click handlers
  const onClickCapture = (ev) => {
    if (dragDist > 5) {
      ev.stopPropagation();
      dragDist = 0;
    }
  };

  const reset = () => {
    scale = 1;
    tx = 0;
    ty = 0;
    apply();
  };

  const onDblClick = () => reset();

  svg.addEventListener('wheel', onWheel, { passive: false });
  svg.addEventListener('pointerdown', onPointerDown);
  svg.addEventListener('pointermove', onPointerMove);
  svg.addEventListener('pointerup', onPointerUp);
  svg.addEventListener('pointercancel', onPointerUp);
  svg.addEventListener('click', onClickCapture, true);
  svg.addEventListener('dblclick', onDblClick);

  return {
    reset,
    fit: reset, // CSS max-width already fits horizontally; fit == reset in v1
    destroy() {
      svg.removeEventListener('wheel', onWheel);
      svg.removeEventListener('pointerdown', onPointerDown);
      svg.removeEventListener('pointermove', onPointerMove);
      svg.removeEventListener('pointerup', onPointerUp);
      svg.removeEventListener('pointercancel', onPointerUp);
      svg.removeEventListener('click', onClickCapture, true);
      svg.removeEventListener('dblclick', onDblClick);
    },
  };
}
