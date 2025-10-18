export default function applyData(el, data, cardClass, parentWindow) {
  const $el = $(el);

  data.message.text = '';
  //.rag-result-json set to data.ragResult
  $el.find('.rag-result-json').val(JSON.stringify(data.json, null, 2));

}