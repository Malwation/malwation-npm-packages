// SVG / PNG export. Clones the live svg and inlines each element's computed
// styles (theme CSS variables resolved by the browser), so exports are
// self-contained and correct in every theme.

const INLINE_PROPS = [
  'stroke',
  'fill',
  'stroke-width',
  'stroke-dasharray',
  'stroke-linecap',
  'paint-order',
  'font-family',
  'font-size',
  'rx',
];

export function svgToString(svg) {
  const win = svg.ownerDocument.defaultView;
  const clone = svg.cloneNode(true);

  const liveEls = [svg, ...svg.querySelectorAll('*')];
  const cloneEls = [clone, ...clone.querySelectorAll('*')];
  for (let i = 0; i < liveEls.length; i++) {
    const cs = win.getComputedStyle(liveEls[i]);
    for (const prop of INLINE_PROPS) {
      const v = cs.getPropertyValue(prop);
      if (v.startsWith('url(')) continue; // keep relative url(#pattern) refs
      if (v && v !== 'none' && v !== 'normal') cloneEls[i].setAttribute(prop, v);
      else if (v === 'none' && (prop === 'stroke' || prop === 'fill' || prop === 'stroke-dasharray')) {
        cloneEls[i].setAttribute(prop, 'none');
      }
    }
    cloneEls[i].removeAttribute?.('class');
  }

  // solid paper behind the grid so the file stands alone
  const paper = win.getComputedStyle(svg).getPropertyValue('--viz-paper').trim() || '#ffffff';
  const gridRect = clone.querySelector('rect'); // paperbg is the first rect
  if (gridRect) {
    const bg = gridRect.cloneNode(false);
    bg.setAttribute('fill', paper);
    gridRect.parentNode.insertBefore(bg, gridRect);
  }

  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  return new win.XMLSerializer().serializeToString(clone);
}

export function svgToPng(svg, scale = 2) {
  return new Promise((resolvePromise, reject) => {
    try {
      const doc = svg.ownerDocument;
      const win = doc.defaultView;
      const str = svgToString(svg);
      const blob = new win.Blob([str], { type: 'image/svg+xml;charset=utf-8' });
      const url = win.URL.createObjectURL(blob);
      const img = new win.Image();
      img.onload = () => {
        const vb = svg.viewBox.baseVal;
        const canvas = doc.createElement('canvas');
        canvas.width = Math.max(1, Math.round(vb.width * scale));
        canvas.height = Math.max(1, Math.round(vb.height * scale));
        const ctx = canvas.getContext('2d');
        const paper = win.getComputedStyle(svg).getPropertyValue('--viz-paper').trim() || '#ffffff';
        ctx.fillStyle = paper;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        win.URL.revokeObjectURL(url);
        canvas.toBlob((b) => (b ? resolvePromise(b) : reject(new Error('PNG export failed'))), 'image/png');
      };
      img.onerror = () => {
        win.URL.revokeObjectURL(url);
        reject(new Error('SVG rasterization failed'));
      };
      img.src = url;
    } catch (err) {
      reject(err);
    }
  });
}
