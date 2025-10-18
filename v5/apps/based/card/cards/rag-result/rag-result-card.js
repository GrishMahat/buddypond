export default function applyData(el, data, cardClass, parentWindow) {
    const $el = $(el);

  //.rag-result-json set to data.ragResult
  $el.find('.rag-result-json').val(JSON.stringify(data.ragResult, null, 2));

    }