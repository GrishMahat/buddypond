export default function sortInventory(items, sortBy, direction = 'asc') {
  // ---- Case 1: we have inventory data in memory ----
  const list = this.latestItems && Array.isArray(this.latestItems)
    ? this.latestItems
    : items;

  if (Array.isArray(list)) {
    const sorted = [...list].sort((a, b) => {
      const itemDefA = JSON.parse(a.item_def || '{}');
      const itemDefB = JSON.parse(b.item_def || '{}');
      const valA = itemDefA[sortBy] ?? '';
      const valB = itemDefB[sortBy] ?? '';

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

      return direction === 'desc' ? -result : result;
    });

    console.log(`✅ Data sorted by ${sortBy} (${direction})`, sorted);
    return sorted;
  }

  // ---- Case 2: fallback to DOM sorting if no data available ----
  const $content = this.window?.content || $(document);
  const $inventoryGrid = $content.find('.inventory-grid');
  let $inventoryItems = $inventoryGrid.find('.inv-slot').toArray();

  $inventoryItems.sort((a, b) => {
    const itemA = $(a).find('.item').data(sortBy) ?? '';
    const itemB = $(b).find('.item').data(sortBy) ?? '';
    const numA = parseFloat(itemA);
    const numB = parseFloat(itemB);
    const bothNumeric = !isNaN(numA) && !isNaN(numB);

    let result;
    if (bothNumeric) {
      result = numA - numB;
    } else {
      result = String(itemA).toLowerCase().localeCompare(String(itemB).toLowerCase());
    }

    return direction === 'desc' ? -result : result;
  });

  $inventoryGrid.empty();
  $inventoryItems.forEach(el => $inventoryGrid.append(el));
  console.log(`✅ DOM sorted by ${sortBy} (${direction})`, $inventoryItems);
}
