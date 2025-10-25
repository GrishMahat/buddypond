export default function applyData(el, data, cardClass, parentWindow) {
  const $el = $(el);
  const json = data.json || {};

  // Clear any text from message
  data.message.text = '';

  const $viewer = $el.find('.json-viewer');
  const $raw = $el.find('.rag-result-json');
  const $toggle = $el.find('.view-raw-btn');

  // Render JSON
  $viewer.html(renderJSON(json));
  $raw.val(JSON.stringify(json, null, 2));

  // Toggle raw/pretty view
  $toggle.off('click').on('click', () => {
    const isRaw = $raw.is(':visible');
    if (isRaw) {
      $raw.hide();
      $viewer.show();
      $toggle.text('View Raw');
    } else {
      $raw.show();
      $viewer.hide();
      $toggle.text('Pretty View');
    }
  });
}

// Pretty print recursive JSON renderer
function renderJSON(obj, indent = 0) {
  if (Array.isArray(obj)) {
    return `[ ${obj.map(v => renderJSON(v, indent + 2)).join(', ')} ]`;

  } else if (typeof obj === 'object' && obj !== null) {
    let html = '{<div class="json-indent">';
    for (const [key, value] of Object.entries(obj)) {
      html += `<div><span class="json-key">"${key}"</span>: ${renderJSON(value, indent + 2)}</div>`;
    }
    html += '</div>}';
    return html;
  } else if (typeof obj === 'string') {
    return `<span class="json-string">"${escapeHTML(obj)}"</span>`;
  } else if (typeof obj === 'number') {
    return `<span class="json-number">${obj}</span>`;
  } else if (typeof obj === 'boolean') {
    return `<span class="json-boolean">${obj}</span>`;
  } else if (obj === null) {
    return `<span class="json-null">null</span>`;
  }
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag]));
}
