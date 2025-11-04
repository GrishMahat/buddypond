<script>
  import InventoryItem from './InventoryItem.svelte';
  import { selectItem } from '$lib/stores/inventoryStore';

  let { items } = $props();

  function handleItemClick(item) {
    selectItem(item);
  }
</script>

<div class="inventory-grid">
  {#if items.length === 0}
    <div class="empty-inventory">
      <p>Your inventory is empty. Go find some items!</p>
      <button class="btn primary" onclick={() => window.parent?.postMessage({ type: 'open-app', app: 'fishing' }, '*')}>
        Go Fishing
      </button>
    </div>
  {:else}
    {#each items as item (item.id || Math.random())}
      <InventoryItem {item} onClick={handleItemClick} />
    {/each}
  {/if}
</div>

<style>
  .inventory-grid {
    display: grid;
    grid-template-columns: repeat(var(--inventory-columns, 5), minmax(0, 1fr));
    gap: 12px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.01), rgba(0, 0, 0, 0.12));
    padding: 12px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.03);
    min-height: 400px;
  }

  .empty-inventory {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 40px;
    text-align: center;
    color: var(--muted, #9aa0b3);
  }

  .btn {
    padding: 10px 20px;
    border-radius: 8px;
    border: 0;
    background: linear-gradient(180deg, #2a7a4b, #1b4f33);
    color: white;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s ease;
  }

  .btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(42, 122, 75, 0.4);
  }

  @media (max-width: 768px) {
    .inventory-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 480px) {
    .inventory-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>

