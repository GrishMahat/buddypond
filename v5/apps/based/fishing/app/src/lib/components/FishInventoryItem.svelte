<script>
  let { item, onSell, onFavorite, onGive } = $props();
  
  const itemDef = $derived(
    typeof item.item_def === 'string' 
      ? JSON.parse(item.item_def) 
      : item.item_def || {}
  );
  
  const metadata = $derived(
    typeof item.metadata === 'string' 
      ? JSON.parse(item.metadata) 
      : item.metadata || {}
  );

  const value = $derived(metadata.value || item.value || 0);
  const isFavorited = $derived(item.favorited === 1);

  const caughtTime = $derived(() => {
    if (!item.ctime) return 'N/A';
    
    const date = new Date(item.ctime);
    const now = new Date();
    const timeDiff = now - date;
    const minutes = Math.floor(timeDiff / 1000 / 60);
    
    if (minutes < 60) {
      return `${minutes} minutes ago`;
    } else if (minutes < 60 * 24) {
      return `${Math.floor(minutes / 60)} hours ago`;
    } else {
      return `${Math.floor(minutes / 60 / 24)} days ago`;
    }
  });

  function handleSell() {
    if (onSell) onSell(item.id);
  }

  function handleFavorite() {
    if (onFavorite) onFavorite(item.id, !isFavorited);
  }

  function handleGive() {
    if (onGive) onGive(item.id);
  }

  function handleImageClick(e) {
    const src = e.target.src;
    // Dispatch event for lightbox
    window.dispatchEvent(new CustomEvent('show-lightbox', { detail: src }));
  }
</script>

<div class="fishing-item" title="Caught: {caughtTime()} - Value: {value} coins">
  <strong>{itemDef.name}</strong>
  <span class="rarity">{itemDef.rarity}</span>
  
  {#if metadata.weight}
    <p class="weight">Weight: {metadata.weight} lbs</p>
  {/if}
  
  <p class="value">{value.toLocaleString()} coins</p>
  
  {#if metadata.image}
    <img 
      class="fishing-item-image" 
      src={metadata.image} 
      alt={itemDef.name}
      onclick={handleImageClick}
    />
  {/if}
  
  {#if metadata.mutation}
    <p class="mutation">{metadata.mutation}</p>
  {/if}

  <div class="fishing-button-bar">
    <button class="fishing-sell-item" onclick={handleSell}>Sell</button>
    <button 
      class="fishing-favorite-item" 
      class:favorited={isFavorited}
      onclick={handleFavorite}
    >
      {isFavorited ? '❤️' : 'Favorite'}
    </button>
    <button class="fishing-give-item" onclick={handleGive}>Give</button>
  </div>
</div>

<style>
  .fishing-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    border: 1px solid #ddd;
    padding: 8px;
    margin-bottom: 8px;
    border-radius: 6px;
    background: var(--desktop_element-background, #fff);
    min-width: 120px;
  }

  .fishing-item strong {
    font-size: 14px;
    margin-bottom: 4px;
  }

  .rarity {
    font-size: 12px;
    color: #666;
    margin-bottom: 4px;
  }

  .weight,
  .value {
    font-size: 12px;
    margin: 2px 0;
  }

  .mutation {
    font-size: 11px;
    color: #ff6b00;
    font-weight: bold;
    margin-top: 4px;
  }

  .fishing-item-image {
    max-width: 64px;
    max-height: 64px;
    display: block;
    margin: 8px auto;
    cursor: pointer;
    transition: transform 0.2s ease;
  }

  .fishing-item-image:hover {
    transform: scale(1.1);
  }

  .fishing-button-bar {
    display: flex;
    gap: 4px;
    margin-top: auto;
    padding-top: 8px;
    width: 100%;
    justify-content: center;
  }

  .fishing-button-bar button {
    padding: 4px 8px;
    font-size: 11px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .fishing-sell-item {
    background: #ff9800;
    color: white;
  }

  .fishing-sell-item:hover {
    background: #e68900;
  }

  .fishing-favorite-item {
    background: #e0e0e0;
    color: #666;
  }

  .fishing-favorite-item.favorited {
    background: #ff4081;
    color: white;
  }

  .fishing-favorite-item:hover {
    background: #d0d0d0;
  }

  .fishing-favorite-item.favorited:hover {
    background: #e91e63;
  }

  .fishing-give-item {
    background: #2196f3;
    color: white;
  }

  .fishing-give-item:hover {
    background: #1976d2;
  }
</style>

