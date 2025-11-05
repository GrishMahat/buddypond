<script>
  let { items, equippedIds, onEquip, onSell, onFavorite, onGive } = $props();

  const filteredItems = $derived(
    items.filter(item => !equippedIds.includes(item.id))
  );

  function handleEquip(inventoryId) {
    if (onEquip) onEquip(inventoryId);
  }

  function handleSell(inventoryId) {
    if (onSell) onSell(inventoryId);
  }

  function handleFavorite(inventoryId, isFavorited) {
    if (onFavorite) onFavorite(inventoryId, isFavorited);
  }

  function handleGive(inventoryId) {
    if (onGive) onGive(inventoryId);
  }
</script>

<div class="fishing-items">
  <h2>Items</h2>
  
  <div class="fishing-items-list">
    {#if filteredItems.length === 0}
      <p class="empty-message">No items available.</p>
    {:else}
      {#each filteredItems as item (item.id)}
        {@const itemDef = typeof item.item_def === 'string' ? JSON.parse(item.item_def) : item.item_def || {}}
        {@const metadata = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata || {}}
        {@const isFavorited = item.favorited === 1}
        
        <div class="fishing-item-items">
          <strong>{itemDef.name}</strong>
          <p>Type: {itemDef.type}</p>
          <p>Rarity: {itemDef.rarity}</p>
          <p>Description: {itemDef.description || 'N/A'}</p>
          <p>Durability: {item.durability || 'N/A'}</p>
          
          {#if metadata.image}
            <img 
              src={metadata.image} 
              alt={itemDef.name}
              style="max-width:100px; max-height:100px;"
            />
          {/if}
          
          <div class="fishing-items-button-bar">
            <button 
              class="fishing-equip-item" 
              onclick={() => handleEquip(item.id)}
            >
              Equip
            </button>
            <button 
              class="fishing-favorite-item"
              class:favorited={isFavorited}
              onclick={() => handleFavorite(item.id, !isFavorited)}
            >
              {isFavorited ? '❤️' : 'Favorite'}
            </button>
            <button 
              class="fishing-give-item" 
              onclick={() => handleGive(item.id)}
            >
              Give
            </button>
            <button 
              class="fishing-sell-item" 
              onclick={() => handleSell(item.id)}
            >
              Sell
            </button>
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>

<style>
  .fishing-items {
    border-radius: 12px;
    padding: 12px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.15);
  }

  .fishing-items h2 {
    font-size: 1.2em;
    margin-bottom: 8px;
    border-bottom: 1px solid #ddd;
    padding-bottom: 4px;
  }

  .fishing-items-list {
    max-height: 400px;
    overflow-y: auto;
  }

  .empty-message {
    color: #999;
    text-align: center;
    padding: 12px;
  }

  .fishing-item-items {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
    border: 1px solid #ddd;
    padding: 8px;
    margin-bottom: 8px;
    border-radius: 6px;
    background: var(--desktop_element-background, #fff);
  }

  .fishing-item-items strong {
    font-size: 14px;
    margin-bottom: 4px;
  }

  .fishing-item-items p {
    font-size: 12px;
    margin: 2px 0;
  }

  .fishing-item-items img {
    margin: 8px 0;
  }

  .fishing-items-button-bar {
    display: flex;
    gap: 4px;
    margin-top: 8px;
    width: 100%;
  }

  .fishing-items-button-bar button {
    padding: 6px 10px;
    font-size: 11px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .fishing-equip-item {
    background: #4caf50;
    color: white;
  }

  .fishing-equip-item:hover {
    background: #45a049;
  }

  .fishing-favorite-item {
    background: #e0e0e0;
    color: #666;
  }

  .fishing-favorite-item.favorited {
    background: #ff4081;
    color: white;
  }

  .fishing-give-item {
    background: #ccc;
    color: #666;
  }

  .fishing-sell-item {
    background: #ff9800;
    color: white;
  }

  .fishing-sell-item:hover {
    background: #e68900;
  }
</style>

