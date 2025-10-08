/*
  Inventory UI demo
  - Replace simulateApi() with real AJAX to your backend.
  - Items have fields: id, name, type (weapon/armor/consumable/misc), slot (if equipable), qty, rarity, icon, description, stats
*/

const MAX_SLOTS = 20;
const STORAGE_KEY = 'demo_inventory_v1';

const sampleItems = [
  /*
  { id: 'sword_bronze', name: 'Bronze Sword', type: 'weapon', slot: 'mainhand', qty: 1, rarity: 'rare', icon: '🗡️', description: 'A trusty bronze blade.', stats: { atk: 6 } },
  { id: 'shield_wood', name: 'Wooden Shield', type: 'armor', slot: 'offhand', qty: 1, rarity: 'common', icon: '🛡️', description: 'Light shield provides small protection.', stats: { def: 3 } },
  { id: 'helm_iron', name: 'Iron Helm', type: 'armor', slot: 'head', qty: 1, rarity: 'rare', icon: '🥽', description: 'Sturdy iron helmet.', stats: { def: 4 } },
  { id: 'hp_potion', name: 'Health Potion', type: 'consumable', qty: 3, rarity: 'common', icon: '🧪', description: 'Heals 50 HP when consumed.' },
  { id: 'apple', name: 'Ration (Apple)', type: 'consumable', qty: 5, rarity: 'common', icon: '🍎', description: 'Small food item. Restores a little stamina.' },
  { id: 'gold_coin', name: 'Gold Coin', type: 'currency', qty: 128, rarity: 'common', icon: '🪙', description: 'Currency; trade for goods.' },
  { id: 'ring_of_power', name: 'Ring of Might', type: 'ring', slot: 'ring1', qty: 1, rarity: 'epic', icon: '💍', description: 'A small ring imbued with strength.', stats: { atk: 3, str: +2 } },
  { id: 'mystic_scroll', name: 'Scroll of Recall', type: 'misc', qty: 1, rarity: 'rare', icon: '📜', description: 'Return to town when read.' },
   */
];

let state = {
  inventory: [], // array of slot objects: {slotIndex:0.., itemId or null}
  itemsById: {}, // map id => item object (contains qty that is kept in this object)
  equipment: {}  // map slotName => itemId
};

let selected = null; // { itemId, slotIndex } or { itemId, equipSlot, type:'equip' }

function log(msg) {
  const $log = $('#logArea');
  $log.prepend(`<div style="margin-bottom:6px">${new Date().toLocaleTimeString()} — ${msg}</div>`);
}

function saveState() {
  const s = { inventory: state.inventory, itemsById: state.itemsById, equipment: state.equipment };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const s = JSON.parse(raw);
      state.inventory = s.inventory;
      state.itemsById = s.itemsById;
      state.equipment = s.equipment;
      return;
    } catch (e) { console.warn('bad storage, resetting'); }
  }
  // create initial state
  state.inventory = Array.from({ length: MAX_SLOTS }, (_, i) => ({ slotIndex: i, itemId: null }));
  state.itemsById = {};
  state.equipment = {};
  // add sample items into inventory sequentially
  let idx = 0;
  sampleItems.forEach(it => {
    state.itemsById[it.id] = Object.assign({}, it); // clone
    // find a free slot
    while (it.qty && idx < MAX_SLOTS) {
      state.inventory[idx].itemId = it.id;
      idx++;
      // For stackable items (qty>1) we'll place only one stack; real backend should manage stacks
      // For demo: only one slot per item; items with qty remain in the single itemId entry
    }
  });
  saveState();
}

// UI renderers
function renderInventory() {
  const $grid = $('#inventoryGrid');
  $grid.empty();
  state.inventory.forEach(slot => {
    const $s = $('<div class="inv-slot"></div>');
    $s.attr('data-slot-index', slot.slotIndex);
    if (slot.itemId) {
      const it = state.itemsById[slot.itemId];
      const $item = $(`<div class="item ${it.rarity || ''}" draggable="true" data-item-id="${it.id}" title="${it.name}"></div>`);
      $item.append(`<div class="icon">${it.icon || '❔'}</div>`);
      $item.append(`<div class="name">${it.name}</div>`);
      if (it.qty && it.qty > 1) $item.append(`<div class="qty">${it.qty}</div>`);
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
        if (isEquipable(it)) {
          equipFromInventory(slot.slotIndex, it.id);
        } else if (isConsumable(it)) {
          consumeFromInventory(slot.slotIndex, it.id, 1);
        } else {
          log(`No default action for ${it.name}.`);
        }
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

function renderEquipment() {
  $('.equip-slot').each(function () {
    const slotName = $(this).attr('data-slot');
    const itemId = state.equipment[slotName] || null;
    const $slotItem = $(this).find('.slot-item').empty();
    $(this).toggleClass('empty', !itemId);
    if (itemId) {
      const it = state.itemsById[itemId];
      const $el = $(`<div class="item ${it.rarity || ''}" draggable="true" data-item-id="${it.id}" title="${it.name}" style="width:100%;height:100%;padding:6px;display:flex;align-items:center;justify-content:center"></div>`);
      $el.append(`<div class="icon">${it.icon || '❔'}</div>`);
      $slotItem.append($el);

      // dragstart from equip -> inventory swap
      $el.on('dragstart', function (e) {
        e.originalEvent.dataTransfer.setData('text/plain', it.id);
        e.originalEvent.dataTransfer.setData('text/from-equip', slotName);
      });

      // clicking selects item
      $el.on('click', function (e) {
        selected = { itemId: it.id, equipSlot: slotName, type: 'equip' };
        updateDetails();
      });

      // double-click to unequip
      $el.on('dblclick', function () { unequipSlot(slotName); });
    } else {
      // set placeholder
      $slotItem.text('');
    }
  });
}

// helpers
function occupiedInventorySlots() {
  console.log('occupiedInventorySlots', this)
  return this.latestItems.length;
  // return state.inventory.filter(s => s.itemId).length;
}

function isEquipable(item) {
  return !!item.slot || item.type === 'weapon' || item.type === 'armor' || item.type === 'ring';
}
function isConsumable(item) { return item.type === 'consumable'; }

function findFirstEmptyInventorySlot() {
  const s = state.inventory.find(s => !s.itemId);
  return s ? s.slotIndex : -1;
}

function selectInventoryItem(slotIndex, itemId) {
  selected = { itemId, slotIndex, type: 'inventory' };
  updateDetails();
}

function updateDetails() {
  if (!selected) {
    $('#preview-icon').text('🎒');
    $('#preview-name').text('No item selected');
    $('#preview-desc').text('Select an item from your inventory.');
    $('#preview-stats').text('');
    $('#selected-type').text('—');
    $('#btn-equip, #btn-consume, #btn-trade').prop('disabled', true);
    return;
  }
  const it = state.itemsById[selected.itemId];
  $('#preview-icon').text(it.icon || '❔');
  $('#preview-name').text(it.name);
  $('#preview-desc').text(it.description || '');
  const stats = it.stats ? Object.entries(it.stats).map(([k, v]) => `${k}: ${v}`).join(' • ') : '';
  $('#preview-stats').text(stats);
  $('#selected-type').text(it.type || '—');

  // enable action buttons based on type
  $('#btn-equip').prop('disabled', !isEquipable(it));
  $('#btn-consume').prop('disabled', !isConsumable(it));
  $('#btn-trade').prop('disabled', !(it.qty && it.qty > 0));
}

// equip logic
function equipFromInventory(slotIndex, itemId) {
  const it = state.itemsById[itemId];
  if (!it) return;
  // determine target slot
  let target = it.slot || (it.type === 'weapon' ? 'mainhand' : null);
  if (it.type === 'ring') {
    // prefer ring1 then ring2
    if (!state.equipment['ring1']) target = 'ring1';
    else if (!state.equipment['ring2']) target = 'ring2';
    else target = 'ring1'; // swap ring1 by default
  }
  if (!target) {
    log(`No equip slot known for ${it.name}.`);
    return;
  }
  // if target occupied, move that item into the inventory (swap)
  const existing = state.equipment[target];
  // remove item from its inventory slot
  const invSlot = state.inventory.find(s => s.itemId === itemId);
  if (invSlot) invSlot.itemId = null;
  // equip item
  state.equipment[target] = itemId;
  if (existing) {
    // place existing item into original inventory slot or find first empty
    const origSlot = invSlot ? invSlot.slotIndex : findFirstEmptyInventorySlot();
    if (origSlot >= 0) {
      state.inventory[origSlot].itemId = existing;
    } else {
      // inventory full: try to put it into any slot (swap back)
      state.inventory[0].itemId = existing;
      log('Inventory full: forced swap into slot 0.');
    }
  }
  saveState();
  renderInventory();
  renderEquipment();
  updateDetails();
  log(`Equipped ${it.name} to ${target}.`);
  // simulate server call
  simulateApi('equip', { itemId, toSlot: target }).done(() => log('Server confirmed equip.'));
}

function unequipSlot(slotName) {
  const itemId = state.equipment[slotName];
  if (!itemId) return;
  const free = findFirstEmptyInventorySlot();
  if (free < 0) {
    log('Cannot unequip: inventory is full.');
    return;
  }
  state.inventory[free].itemId = itemId;
  delete state.equipment[slotName];
  saveState(); renderInventory(); renderEquipment(); updateDetails();
  log(`Unequipped ${state.itemsById[itemId].name} from ${slotName}.`);
  simulateApi('unequip', { itemId, fromSlot: slotName }).done(() => log('Server confirmed unequip.'));
}

function consumeFromInventory(slotIndex, itemId, qty) {
  const it = state.itemsById[itemId];
  if (!it || it.qty <= 0) return;
  // reduce qty
  const take = Math.min(qty, it.qty);
  it.qty -= take;
  if (it.qty <= 0) {
    // remove item from inventory slot(s)
    state.inventory.forEach(s => { if (s.itemId === itemId) s.itemId = null; });
  }
  saveState(); renderInventory(); renderEquipment(); updateDetails();
  log(`Consumed ${take}x ${it.name}.`);
  simulateApi('consume', { itemId, qty: take }).done(() => log('Server confirmed consume.'));
}

function handleDropToInventory(draggedItemId, destIndex) {
  // if dragging from equipment: get from-equip property (modern browsers allow multiple sets)
  // jquery does not provide direct data; but we set data 'text/from-equip' for equip drags
  // attempt to retrieve from the global drag source (we'll check if the dragged item is currently equipped)
  if (!draggedItemId) return;
  // if item was equipped, remove from equipment
  const equipSlot = Object.keys(state.equipment).find(k => state.equipment[k] === draggedItemId);
  if (equipSlot) {
    delete state.equipment[equipSlot];
    // place into dest slot (swap if dest occupied)
    const existing = state.inventory[destIndex].itemId;
    state.inventory[destIndex].itemId = draggedItemId;
    if (existing) {
      // place existing item back into equipment slot? prefer to move to first empty
      const free = findFirstEmptyInventorySlot();
      if (free >= 0) state.inventory[free].itemId = existing;
      else log('Inventory full while swapping.');
    }
    saveState(); renderInventory(); renderEquipment(); updateDetails();
    log(`Moved ${state.itemsById[draggedItemId].name} from equipment to inventory slot ${destIndex}.`);
    simulateApi('unequip', { itemId: draggedItemId }).done(() => log('Server confirmed unequip.'));
    return;
  }

  // dragging from inventory: find origin slot
  const origin = state.inventory.find(s => s.itemId === draggedItemId);
  if (origin) {
    // simple swap
    const tmp = state.inventory[destIndex].itemId;
    state.inventory[destIndex].itemId = draggedItemId;
    origin.itemId = tmp || null;
    saveState(); renderInventory(); renderEquipment(); updateDetails();
    log('Rearranged items in inventory.');
    simulateApi('rearrange', { itemId: draggedItemId, toSlot: destIndex }).done(() => log('Server confirmed move.'));
    return;
  }
}

function handleDropToEquip(draggedItemId, targetSlot) {
  if (!draggedItemId) return;
  const it = state.itemsById[draggedItemId];
  if (!it) return;
  // if item is equipable to targetSlot?
  // allow if it.slot===targetSlot or item.type matches (weapon -> mainhand)
  if (it.slot && it.slot !== targetSlot && !(it.type === 'ring' && targetSlot.startsWith('ring'))) {
    log(`${it.name} cannot be equipped to ${targetSlot}.`);
    return;
  }
  // remove from inventory (if present)
  state.inventory.forEach(s => { if (s.itemId === draggedItemId) s.itemId = null; });
  // swap if something already in slot
  const existing = state.equipment[targetSlot];
  if (existing) {
    const free = findFirstEmptyInventorySlot();
    if (free >= 0) {
      state.inventory[free].itemId = existing;
    } else {
      // no space: swap back into origin or forced slot 0
      state.inventory[0].itemId = existing;
      log('Inventory full: forced swap into slot 0.');
    }
  }
  state.equipment[targetSlot] = draggedItemId;
  saveState(); renderInventory(); renderEquipment(); updateDetails();
  log(`Equipped ${it.name} to ${targetSlot}.`);
  simulateApi('equip', { itemId: draggedItemId, toSlot: targetSlot }).done(() => log('Server confirmed equip.'));
}

/* Simulated API helper — replace with real $.ajax calls to your backend */
function simulateApi(action, payload) {
  log(`[simulated API] ${action} ${JSON.stringify(payload)}`);
  const d = $.Deferred();
  setTimeout(() => d.resolve({ ok: true, action, payload }), 500 + Math.random() * 400);
  return d.promise();
}


export default function bindUIEvents(app, fishing) {

  loadState();
  renderInventory();
  renderEquipment();
  updateDetails();

  // equip drop target handling
  $('.equip-slot').on('dragover', function (e) { e.preventDefault(); $(this).addClass('drop-target'); });
  $('.equip-slot').on('dragleave', function (e) { $(this).removeClass('drop-target'); });
  $('.equip-slot').on('drop', function (e) {
    e.preventDefault(); $(this).removeClass('drop-target');
    const draggedId = e.originalEvent.dataTransfer.getData('text/plain');
    const target = $(this).attr('data-slot');
    handleDropToEquip(draggedId, target);
  });

  // click on equip slot: if has item select it, else if selected item equip there
  $('.equip-slot').on('click', function (e) {
    const slot = $(this).attr('data-slot');
    const itemId = state.equipment[slot];
    if (itemId) {
      selected = { itemId, equipSlot: slot, type: 'equip' };
      updateDetails();
    } else if (selected && selected.type === 'inventory') {
      // try to equip selected to this slot
      equipFromInventory(selected.slotIndex, selected.itemId);
    }
  });

  // action buttons
  $('#btn-equip').on('click', function () {
    if (!selected) return;
    if (selected.type === 'inventory') {
      equipFromInventory(selected.slotIndex, selected.itemId);
    } else if (selected.type === 'equip') {
      // switch to another slot? ignore
    }
  });
  $('#btn-consume').on('click', function () {
    if (!selected) return;
    if (selected.type === 'inventory') {
      consumeFromInventory(selected.slotIndex, selected.itemId, 1);
    } else {
      log('Select consumable from inventory to consume.');
    }
  });

  $('#btn-trade').on('click', function () {
    if (!selected) return;
    $('#tradeModal').fadeIn(120);
    $('#tradeItemTitle').text(state.itemsById[selected.itemId].name);
    $('#tradeQty').val(1);
    $('#tradeTarget').val('');
  });

  $('#tradeCancel').on('click', () => $('#tradeModal').fadeOut(120));
  $('#tradeConfirm').on('click', function () {
    const target = $('#tradeTarget').val().trim();
    const qty = Number($('#tradeQty').val()) || 1;
    $('#tradeModal').fadeOut(120);
    if (!target) { log('Trade cancelled: no target specified.'); return; }
    // perform trade: reduce qty, possibly remove item
    const it = state.itemsById[selected.itemId];
    if (!it || it.qty < qty) { log('Not enough items to trade.'); return; }
    it.qty -= qty;
    if (it.qty <= 0) {
      state.inventory.forEach(s => { if (s.itemId === it.id) s.itemId = null; });
    }
    saveState(); renderInventory(); renderEquipment(); updateDetails();
    log(`Traded ${qty}x ${it.name} to ${target}.`);
    simulateApi('trade', { itemId: it.id, qty, to: target }).done(() => log('Server confirmed trade.'));
  });

  // click outside to clear selection
  $(document).on('click', function (e) {
    if (!$(e.target).closest('.item, .equip-slot, .modal, #btn-equip, #btn-consume, #btn-trade').length) {
      selected = null; updateDetails();
    }
  });

  // keyboard equip (E)
  $(document).on('keydown', function (e) {
    if (e.key.toLowerCase() === 'e' && selected && selected.type === 'inventory') {
      equipFromInventory(selected.slotIndex, selected.itemId);
    }
    if (e.key === 'Escape') { $('#tradeModal').fadeOut(120); }
  });

  $('#sort-inventory').on('change', (ev) => {
    const sortBy = $(ev.target).val();
    // Sort inventory items based on selected criteria
    let sortDirection = $('#sort-direction').data('direction') || 'asc';
    let sortedItem = this.sortInventory(this.latestItems, sortBy, sortDirection);
    this.renderInventory(sortedItem);
  });

  $('.sort-direction').on('click', (ev) => {
    let currentDirection = $(ev.target).data('direction') || 'asc';
    let newDirection = currentDirection === 'asc' ? 'desc' : 'asc';
    $(ev.target).data('direction', newDirection);
    $(ev.target).text(newDirection === 'asc' ? '⬆️' : '⬇️');
    // $(this).html('ooo');
    const sortBy = $('#sort-inventory').val();
    // alert('Sorting ' + sortBy + ' ' + newDirection);
    let sortedItem = this.sortInventory(this.latestItems, sortBy, newDirection);
    this.renderInventory(sortedItem);
  });

  // reset demo storage
  $('#clearStorage').on('click', function () {
    if (confirm('Reset demo inventory?')) { localStorage.removeItem(STORAGE_KEY); location.reload(); }
  });

  // add some simple tooltips and hover highlights
  $(document).on('mouseenter', '.inv-slot, .equip-slot', function () { $(this).addClass('highlight'); });
  $(document).on('mouseleave', '.inv-slot, .equip-slot', function () { $(this).removeClass('highlight'); });

  // small helper: click on empty inventory slot to move selected item there
  $(document).on('click', '.inv-slot.empty', function () {
    const dest = Number($(this).attr('data-slot-index'));
    if (selected && selected.type === 'equip') {
      // unequip into this slot
      const fromSlot = selected.equipSlot;
      const itemId = selected.itemId;
      delete state.equipment[fromSlot];
      state.inventory[dest].itemId = itemId;
      saveState(); renderInventory(); renderEquipment(); selected = null; updateDetails();
      log(`Moved ${state.itemsById[itemId].name} from ${fromSlot} to inventory slot ${dest}.`);
    }
  });

}
