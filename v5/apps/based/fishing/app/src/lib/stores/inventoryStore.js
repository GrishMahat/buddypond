import { writable, derived } from 'svelte/store';

// Main inventory state
export const items = writable([]);
export const selectedItem = writable(null);
export const filterType = writable('all');
export const sortBy = writable('rarity');
export const sortDirection = writable('asc');

// Derived store for filtered and sorted items
export const filteredAndSortedItems = derived(
  [items, filterType, sortBy, sortDirection],
  ([$items, $filterType, $sortBy, $sortDirection]) => {
    // Filter
    let filtered = $items;
    if ($filterType !== 'all') {
      filtered = $items.filter(item => {
        const itemDef = typeof item.item_def === 'string' 
          ? JSON.parse(item.item_def) 
          : item.item_def;
        return itemDef?.type === $filterType;
      });
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      const itemDefA = typeof a.item_def === 'string' ? JSON.parse(a.item_def) : a.item_def;
      const itemDefB = typeof b.item_def === 'string' ? JSON.parse(b.item_def) : b.item_def;
      
      const valA = itemDefA?.[$sortBy] ?? '';
      const valB = itemDefB?.[$sortBy] ?? '';

      // Try numeric comparison first
      const numA = parseFloat(valA);
      const numB = parseFloat(valB);
      const bothNumeric = !isNaN(numA) && !isNaN(numB);

      let result;
      if (bothNumeric) {
        result = numA - numB;
      } else {
        result = String(valA).toLowerCase().localeCompare(String(valB).toLowerCase());
      }

      return $sortDirection === 'desc' ? -result : result;
    });

    return sorted;
  }
);

// Derived store for inventory types
export const inventoryTypes = derived(items, ($items) => {
  const types = new Set();
  $items.forEach(item => {
    const itemDef = typeof item.item_def === 'string' 
      ? JSON.parse(item.item_def) 
      : item.item_def;
    if (itemDef?.type) {
      types.add(itemDef.type);
    }
  });
  return Array.from(types);
});

// Actions
export function setItems(newItems) {
  items.set(newItems);
}

export function selectItem(item) {
  selectedItem.set(item);
}

export function clearSelection() {
  selectedItem.set(null);
}

export function toggleSortDirection() {
  sortDirection.update(dir => dir === 'asc' ? 'desc' : 'asc');
}

