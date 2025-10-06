// UI renderers
export default function renderInventory(items) {
  console.log('Rendering inventory:', items);
  const $grid = $('#inventoryGrid');
  $grid.empty();
  items.forEach(slot => {
    const $s = $('<div class="inv-slot"></div>');
    console.log('Rendering slot:', slot);
    let itemDef = JSON.parse(slot.item_def || '{}');
    console.log('Item definition:', itemDef);
    $s.attr('data-slot-index', slot.slotIndex);
    if (true || slot.itemId) {
      // const it = state.itemsById[slot.itemId];
      const $item = $(`<div class="item ${itemDef.rarity || ''}" draggable="true" data-item-id="${itemDef.id}" title="${itemDef.name}"></div>`);
      $item.append(`<div class="icon">${itemDef.icon || '❔'}</div>`);
      $item.append(`<div class="name">${itemDef.name}</div>`);

      if (itemDef.metadata) {
        let metadata = {};
        if (typeof itemDef.metadata === 'string') {
          metadata = JSON.parse(itemDef.metadata);
        } else {
          metadata = itemDef.metadata;
        }
        if (metadata.image) {
          $item.append(`<div class="image"><img src="${metadata.image}" alt="${itemDef.name}" style="max-width:100px; max-height:100px;"/></div>`);
        }
      }

      if (slot.quantity && slot.quantity > 1) $item.append(`<div class="qty">${slot.quantity}</div>`);
      $s.append($item);

      // dragstart
      $item.on('dragstart', function (e) {
        const dt = e.originalEvent.dataTransfer;
        dt.setData('text/plain', it.id);
        dt.effectAllowed = 'move';
      });

      // click / double click
      $item.on('click', function (e) {
        e.stopPropagation();
        selectInventoryItem(slot.slotIndex, it.id);
      });
      $item.on('dblclick', function (e) {
        e.stopPropagation();
        /*
        if (isEquipable(it)) {
          equipFromInventory(slot.slotIndex, it.id);
        } else if (isConsumable(it)) {
          consumeFromInventory(slot.slotIndex, it.id, 1);
        } else {
          log(`No default action for ${itemDef.name}.`);
        }
        */
      });
    } else {
      $s.addClass('empty');
    }

    // allow dropping to rearrange items inside inventory
    $s.on('dragover', function (e) { e.preventDefault(); $(this).addClass('highlight'); });
    $s.on('dragleave', function (e) { $(this).removeClass('highlight'); });
    $s.on('drop', function (e) {
      e.preventDefault(); $(this).removeClass('highlight');
      const draggedItemId = e.originalEvent.dataTransfer.getData('text/plain');
      const destIndex = Number($(this).attr('data-slot-index'));
      handleDropToInventory(draggedItemId, destIndex);
    });

    $grid.append($s);
  });

  // $('#inv-count').text(`${occupiedInventorySlots()} / ${MAX_SLOTS}`);
}