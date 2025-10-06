
export default function loadState(items) {
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
  items.forEach(it => {
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
