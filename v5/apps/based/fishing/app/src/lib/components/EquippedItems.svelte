<script>
  let { items, onUnequip } = $props();

  function handleUnequip(inventoryId) {
    if (onUnequip) {
      onUnequip(inventoryId);
    }
  }
</script>

<div class="fishing-equipped">
  <h2>Equipped</h2>
  
  {#if items.length === 0}
    <p class="empty-message">No fishing rod equipped.</p>
  {:else}
    {#each items as item (item.inventory_id)}
      <div class="fishing-item-equipped">
        <strong>{item.metadata?.key || 'Unknown Item'}</strong>
        <span class="rarity">{item.metadata?.rarity || 'common'}</span>
        <p>Durability: {item.item_durability}</p>
        <p class="description">{item.metadata?.description || ''}</p>
        
        {#if item.metadata?.image}
          <img 
            class="fishing-item-image" 
            src={item.metadata.image} 
            alt={item.metadata.key}
          />
        {/if}
        
        <button 
          class="fishing-unequip-item" 
          onclick={() => handleUnequip(item.inventory_id)}
        >
          Unequip
        </button>
      </div>
    {/each}
  {/if}
</div>

<style>
  .fishing-equipped {
    border-radius: 12px;
    padding: 12px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.15);
  }

  .fishing-equipped h2 {
    font-size: 1.2em;
    margin-bottom: 8px;
    border-bottom: 1px solid #ddd;
    padding-bottom: 4px;
  }

  .empty-message {
    color: #999;
    text-align: center;
    padding: 12px;
  }

  .fishing-item-equipped {
    border: 1px solid #ddd;
    padding: 10px;
    margin-bottom: 10px;
    border-radius: 6px;
    background: var(--desktop_element-background, #fff);
  }

  .fishing-item-equipped strong {
    display: block;
    font-size: 14px;
    margin-bottom: 4px;
  }

  .rarity {
    display: block;
    font-size: 12px;
    color: #666;
    margin-bottom: 8px;
  }

  .fishing-item-equipped p {
    font-size: 12px;
    margin: 4px 0;
  }

  .description {
    font-style: italic;
    color: #666;
  }

  .fishing-item-image {
    max-width: 80px;
    max-height: 80px;
    display: block;
    margin: 8px auto;
  }

  .fishing-unequip-item {
    width: 100%;
    padding: 8px;
    margin-top: 8px;
    background: #f44336;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .fishing-unequip-item:hover {
    background: #d32f2f;
  }
</style>

