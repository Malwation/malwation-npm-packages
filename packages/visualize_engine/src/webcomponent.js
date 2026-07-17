// <viz-engine theme="neon" interactive>…source…</viz-engine> custom element.
// The element's text content is the source; it renders into a child host so any
// page can drop in VizEngine with zero JS. Auto-registers when loaded.

import { Panel } from './core/panel.js';

// strip common leading indentation (HTML authors indent element content)
function dedent(text) {
  const lines = String(text ?? '').replace(/^\n+/, '').replace(/\s+$/, '').split('\n');
  const indents = lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length);
  const min = indents.length ? Math.min(...indents) : 0;
  return lines.map((l) => l.slice(min)).join('\n');
}

export function registerWebComponent() {
  if (typeof customElements === 'undefined' || typeof HTMLElement === 'undefined') return;
  if (customElements.get('viz-engine')) return;

  class VizEngineElement extends HTMLElement {
    static get observedAttributes() {
      return ['theme', 'interactive'];
    }

    connectedCallback() {
      if (this._mounted) return;
      // defer one frame so the parser has attached the child text (source)
      const start = () => {
        if (this._mounted || !this.isConnected) return;
        if (this._source == null) this._source = dedent(this.textContent);
        this._mounted = true;
        this._mount();
      };
      const win = this.ownerDocument.defaultView;
      if (win?.requestAnimationFrame) win.requestAnimationFrame(start);
      else start();
    }

    disconnectedCallback() {
      this._panel?.destroy();
    }

    attributeChangedCallback() {
      if (this._mounted && this.isConnected) this._mount();
    }

    // programmatic source update
    set source(text) {
      this._source = String(text ?? '');
      if (this.isConnected) this._mount();
    }

    get source() {
      return this._source ?? '';
    }

    _mount() {
      if (!this._host) {
        this.textContent = '';
        this._host = this.ownerDocument.createElement('div');
        this.appendChild(this._host);
      }
      this._panel?.destroy();
      this._panel = new Panel(this._host, {
        theme: this.getAttribute('theme') || 'sketch',
        interactive: this.hasAttribute('interactive'),
      });
      this._panel.render(this._source);
    }
  }

  customElements.define('viz-engine', VizEngineElement);
}
