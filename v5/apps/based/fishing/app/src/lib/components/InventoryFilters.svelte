<script>
  import { filterType, sortBy, sortDirection, inventoryTypes, toggleSortDirection } from '$lib/stores/inventoryStore';

  let currentFilterType = $state('all');
  let currentSortBy = $state('rarity');
  let currentSortDirection = $state('asc');

  // Subscribe to stores
  $effect(() => {
    filterType.set(currentFilterType);
  });

  $effect(() => {
    sortBy.set(currentSortBy);
  });

  function handleToggleDirection() {
    currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    sortDirection.set(currentSortDirection);
  }

  let { itemCount, maxSlots } = $props();
</script>

<div class="inventory-filters">
  <label for="filter-inventory-type">Filter by Type:</label>
  <select id="filter-inventory-type" bind:value={currentFilterType}>
    <option value="all">All Types</option>
    {#each $inventoryTypes as type}
      <option value={type}>{type}</option>
    {/each}
  </select>

  <label for="sort-inventory">Sort by:</label>
  <select id="sort-inventory" bind:value={currentSortBy}>
    <option value="rarity">Rarity</option>
    <option value="name">Name</option>
    <option value="type">Type</option>
  </select>

  <button 
    id="sort-direction" 
    class="sort-direction" 
    title="Toggle Sort Direction"
    onclick={handleToggleDirection}
  >
    {currentSortDirection === 'asc' ? '⬆️' : '⬇️'}
  </button>

  <div class="muted" id="inv-count">{itemCount} / {maxSlots}</div>
</div>

<style>
  .inventory-filters {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
    margin-bottom: 12px;
  }

  label {
    font-size: 13px;
    color: var(--muted, #9aa0b3);
  }

  select {
    padding: 6px 10px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.3);
    color: inherit;
    font-size: 13px;
  }

  .sort-direction {
    padding: 6px 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.3);
    border-radius: 6px;
    cursor: pointer;
    font-size: 16px;
    transition: all 0.2s ease;
  }

  .sort-direction:hover {
    background: rgba(255, 255, 255, 0.05);
    transform: translateY(-1px);
  }

  .muted {
    color: var(--muted, #9aa0b3);
    font-size: 13px;
    margin-left: auto;
  }
</style>

