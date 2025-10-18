/*
bp-mention.js
Vanilla Web Component for '@' mentions inside a text input/textarea.

Usage: <bp-mention id="m" placeholder="Type @ to mention..." rows="3"></bp-mention>

  <script type="module">
    import './bp-mention.js';
    const el = document.getElementById('m');
    el.data = [
      { id: 'u1', name: 'Marak Squires', avatar: '...' },
      { id: 'u2', name: 'Alice' },
      'bob'
    ];
    el.addEventListener('mention-select', e => console.log('picked:', e.detail));
  </script>

API:

* el.data = Array<string|object> -- set provider list
* el.getValue() -- current text value
* el.focus() -- focus the input
* listens for attribute `data` (JSON) if present on connect
* dispatches 'mention-select' event with chosen item object/string as detail
  */

export class BPMention extends HTMLElement {
  constructor() {
    super();
    this._data = [];
    this._visible = false;
    this._selectedIndex = -1;
    this._maxItems = 8;
    this._triggerChar = '@';

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      < style >
    :host {
      display: block;
      font - family: system - ui, -apple - system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
      --bg: white;
      --border: #ddd;
      --accent: #0aaefb;
      --item - hover: #f6f9fb;
      --radius: 8px;
    }
    .wrapper { position: relative; }
    textarea, input[type = "text"] {
      box - sizing: border - box;
      width: 100 %;
      padding: 10px 12px;
      border - radius: var(--radius);
      border: 1px solid var(--border);
      font - size: 14px;
      line - height: 1.3;
      resize: vertical;
      min - height: 40px;
    }
    .bp - list {
      position: absolute;
      left: 0;
      top: calc(100 % + 6px);
      z - index: 1000;
      width: 100 %;
      max - height: 260px;
      overflow: auto;
      background: var(--bg);
      border: 1px solid var(--border);
      box - shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
      border - radius: 8px;
      list - style: none;
      margin: 0;
      padding: 6px;
      display: none;
    }
    .bp - list.visible { display: block; }
    .bp - item {
      display: flex;
      gap: 8px;
      align - items: center;
      padding: 8px;
      border - radius: 6px;
      cursor: pointer;
      user - select: none;
    }
    .bp - item: hover, .bp - item[aria - selected="true"] {
      background: var(--item - hover);
    }
    .bp - avatar {
      flex: 0 0 32px;
      width: 32px;
      height: 32px;
      border - radius: 6px;
      background: #e8eef3;
      display: inline - block;
      font - size: 12px;
      color: #111;
      align - items: center;
      justify - content: center;
      display: flex;
    }
    .bp - meta { display: flex; flex - direction: column; min - width: 0; }
    .bp - name { font - weight: 600; font - size: 13px; white - space: nowrap; overflow: hidden; text - overflow: ellipsis; }
    .bp - sub { font - size: 12px; color:#666; white - space: nowrap; overflow: hidden; text - overflow: ellipsis; }
    mark { background: transparent; color: var(--accent); font - weight: 700; }
    :: slotted(*) { /* allow light DOM styling if slotted */ }
  </style >
      <div class="wrapper">
        <!-- default to textarea; rows attr if present will be forwarded -->
        <textarea class="bp-input" rows="2" part="input"></textarea>
        <ul class="bp-list" role="listbox" part="list"></ul>
      </div>
    `;

// Elements
this._input = this.shadowRoot.querySelector('.bp-input');
this._list = this.shadowRoot.querySelector('.bp-list');

// Bound handlers
this._onInput = this._onInput.bind(this);
this._onKeyDown = this._onKeyDown.bind(this);
this._onClickOutside = this._onClickOutside.bind(this);
this._onListClick = this._onListClick.bind(this);

  }

  connectedCallback() {
    // forward placeholder/rows if present
    if (this.hasAttribute('placeholder')) {
      this._input.setAttribute('placeholder', this.getAttribute('placeholder'));
    }
    if (this.hasAttribute('rows')) {
      this._input.setAttribute('rows', this.getAttribute('rows'));
    }

// parse JSON data attribute if provided
if (this.hasAttribute('data')) {
  try {
    const parsed = JSON.parse(this.getAttribute('data'));
    if (Array.isArray(parsed)) this._data = parsed;
  } catch (err) {
    // ignore invalid JSON
    console.warn('bp-mention: invalid JSON in data attribute', err);
  }
}

this._input.addEventListener('input', this._onInput);
this._input.addEventListener('keydown', this._onKeyDown);
this._list.addEventListener('mousedown', this._onListClick);
document.addEventListener('click', this._onClickOutside);

// Optional jQuery UI autocomplete integration (if present)
try {
  if (window.jQuery && window.jQuery.ui && window.jQuery.ui.autocomplete) {
    const $ = window.jQuery;
    // destroy previous autocomplete if any
    if ($(this._input).data('ui-autocomplete')) {
      $(this._input).autocomplete('destroy');
    }
    $(this._input).autocomplete({
      minLength: 0,
      delay: 0,
      source: (request, response) => {
        // rely on our token detection
        const token = this._tokenAtCaret();
        if (!token) return response([]);
        const results = this._search(token.query).map(it => {
          return { label: this._displayName(it), value: this._displayName(it), __item: it };
        });
        response(results);
      },
      focus: () => false,
      select: (ev, ui) => {
        if (ui && ui.item && ui.item.__item) {
          this._applySelection(ui.item.__item);
        }
        return false;
      }
    });
  }
} catch (e) {
  // silently ignore jquery integration errors
  // component still works with native dropdown
}

  }

  disconnectedCallback() {
    this._input.removeEventListener('input', this._onInput);
    this._input.removeEventListener('keydown', this._onKeyDown);
    this._list.removeEventListener('mousedown', this._onListClick);
    document.removeEventListener('click', this._onClickOutside);
    // try to destroy jQuery autocomplete if present
    try {
      if (window.jQuery && window.jQuery.ui && window.jQuery.ui.autocomplete) {
        const $ = window.jQuery;
        if ($(this._input).data('ui-autocomplete')) $(this._input).autocomplete('destroy');
      }
    } catch (e) { }
  }

  // Public API
  set data(arr) {
    this._data = Array.isArray(arr) ? arr.slice() : [];
  }
  get data() {
    return this._data.slice();
  }

  get value() {
    return this._input.value;
  }
  getValue() { return this._input.value; }
  focus() { this._input.focus(); }

  // -------------------------
  // Internal helpers
  // -------------------------
  _onInput(e) {
    const token = this._tokenAtCaret();
    if (!token) return this._hideList();
    const matches = this._search(token.query);
    if (matches.length === 0) {
      // show nothing but keep visible if empty query and user wants options
      this._renderList([], token);
      return;
    }
    this._renderList(matches, token);
  }

  _onKeyDown(e) {
    if (!this._visible) return;
    const items = Array.from(this._list.querySelectorAll('.bp-item'));
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this._selectedIndex = Math.min(this._selectedIndex + 1, items.length - 1);
      this._highlightIndex(this._selectedIndex);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this._selectedIndex = Math.max(this._selectedIndex - 1, 0);
      this._highlightIndex(this._selectedIndex);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (this._selectedIndex >= 0 && items[this._selectedIndex]) {
        e.preventDefault();
        const item = items[this._selectedIndex].__item;
        this._applySelection(item);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this._hideList();
    }
  }

  _onClickOutside(e) {
    if (!this.contains(e.target)) {
      this._hideList();
    }
  }

  _onListClick(e) {
    // mousedown used to prevent blur; find item
    const li = e.target.closest('.bp-item');
    if (!li) return;
    const item = li.__item;
    if (item) {
      this._applySelection(item);
    }
  }

  _tokenAtCaret() {
    const value = this._input.value;
    const caret = this._input.selectionStart;
    if (typeof caret !== 'number') return null;

// find last trigger char before caret
const idx = value.lastIndexOf(this._triggerChar, caret - 1);
if (idx === -1) return null;

// ensure there's no whitespace between @ and caret
const between = value.slice(idx + 1, caret);
if (/\s/.test(between)) return null;

// ensure char before '@' is start or whitespace (avoid emails like foo@bar.com being triggered)
if (idx > 0 && !/\s/.test(value[idx - 1])) return null;

return { start: idx, end: caret, query: between };

  }

  _search(query) {
    const q = String(query || '').trim().toLowerCase();
    const items = this._data || [];
    if (!q) {
      // return top N suggestions when query empty
      return items.slice(0, this._maxItems);
    }

// Normalize items to objects {name, original}
const normalized = items.map(it => {
  if (typeof it === 'string') return { name: it, original: it };
  const name = it.name || it.label || (it.id && String(it.id)) || '';
  return { name, original: it };
});

// rank: startsWith first, then includes
const starts = [];
const includes = [];
for (const n of normalized) {
  const nm = n.name.toLowerCase();
  if (nm.startsWith(q)) starts.push(n.original);
  else if (nm.includes(q)) includes.push(n.original);
}
return starts.concat(includes).slice(0, this._maxItems);

  }

  _displayName(item) {
    if (!item) return '';
    if (typeof item === 'string') return item;
    return item.name || item.label || String(item.id || '');
  }

  _renderList(items, token) {
    this._list.innerHTML = '';
    this._selectedIndex = -1;
if (!items || items.length === 0) {
  // optionally show "no results" or hide
  this._hideList();
  return;
}

const q = (token && token.query) ? token.query.toLowerCase() : '';

for (let i = 0; i < items.length; i++) {
  const item = items[i];
  const name = this._displayName(item);
  const li = document.createElement('li');
  li.className = 'bp-item';
  li.setAttribute('role', 'option');
  li.tabIndex = -1;
  li.__item = item;

  // avatar small placeholder if available
  const avatar = document.createElement('div');
  avatar.className = 'bp-avatar';
  if (item && typeof item === 'object' && item.avatar) {
    const img = document.createElement('img');
    img.src = item.avatar;
    img.alt = name;
    img.style.width = '100%';
    img.style.height ='100%';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '6px';
    avatar.textContent = '';
    avatar.appendChild(img);
  } else {
    // initials fallback
    const initials = name.split(/\s+/).map(s => s[0]).slice(0,2).join('').toUpperCase();
    avatar.textContent = initials;
  }

  const meta = document.createElement('div');
  meta.className = 'bp-meta';
  const title = document.createElement('div');
  title.className = 'bp-name';
  title.innerHTML = q ? this._highlightMatch(name, q) : this._escapeHtml(name);
  const sub = document.createElement('div');
  sub.className = 'bp-sub';
  if (item && typeof item === 'object' && item.id && String(item.id) !== name) {
    sub.textContent = String(item.id);
  } else {
    sub.textContent = '';
  }

  meta.appendChild(title);
  meta.appendChild(sub);

  li.appendChild(avatar);
  li.appendChild(meta);
  this._list.appendChild(li);
}

this._showList();

  }

  _highlightMatch(text, q) {
    if (!q) return this._escapeHtml(text);
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return this._escapeHtml(text);
    const before = this._escapeHtml(text.slice(0, idx));
    const match = this._escapeHtml(text.slice(idx, idx + q.length));
    const after = this._escapeHtml(text.slice(idx + q.length));
    return `${before}<mark>${match}</mark>${after}`;
  }

  _escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, '\'');
}

  _highlightIndex(index) {
    const items = Array.from(this._list.querySelectorAll('.bp-item'));
    items.forEach((el, i) => {
      const selected = i === index;
      el.setAttribute('aria-selected', selected ? 'true' : 'false');
      if (selected) {
        el.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  _showList() {
    this._visible = true;
    this._list.classList.add('visible');
  }

  _hideList() {
    this._visible = false;
    this._selectedIndex = -1;
    this._list.classList.remove('visible');
    this._list.innerHTML = '';
  }

  _applySelection(item) {
    const token = this._tokenAtCaret();
    if (!token) return;
    const value = this._input.value;
    const before = value.slice(0, token.start);
    const after = value.slice(token.end);
    const name = this._displayName(item);
    // Insert typed mention. You may choose to format differently (e.g., rich markup).
    const insert = `${this._triggerChar}${name}`;
    const newValue = before + insert + after;
    this._input.value = newValue;

// place caret after inserted mention
const newPos = (before + insert).length;
this._input.setSelectionRange(newPos, newPos);
this._input.focus();

// small debounce hide (allow click handlers to process)
this._hideList();

// dispatch selection event with the original item
this.dispatchEvent(new CustomEvent('mention-select', {
  detail: item,
  bubbles: true,
  composed: true
}));

  }
}


/* End of bp-mention.js */
