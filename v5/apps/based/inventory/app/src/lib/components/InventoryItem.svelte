<script>
  let { item, onClick } = $props();
  
  const itemDef = $derived(
    typeof item.item_def === 'string' 
      ? JSON.parse(item.item_def) 
      : item.item_def || {}
  );
  
  const metadata = $derived(
    typeof itemDef.metadata === 'string' 
      ? JSON.parse(itemDef.metadata) 
      : itemDef.metadata || {}
  );

  function handleClick() {
    if (onClick) {
      onClick(item);
    }
  }
</script>

<div class="inv-slot">
  <div 
    class="item {itemDef.rarity || ''}" 
    draggable="true" 
    data-item-id={itemDef.id}
    title={itemDef.name}
    onclick={handleClick}
    role="button"
    tabindex="0"
  >
    {#if metadata.image}
      <div class="image">
        <img src={metadata.image} alt={itemDef.name} />
      </div>
    {/if}
    <div class="name">{itemDef.name || 'Unknown Item'}</div>
    <div class="type">{itemDef.type || 'misc'}</div>
    {#if item.quantity && item.quantity > 1}
      <div class="qty">{item.quantity}</div>
    {/if}
  </div>
</div>

<style>
  .inv-slot {
    border-radius: 8px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.01), rgba(0, 0, 0, 0.18));
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid rgba(255, 255, 255, 0.02);
    position: relative;
    overflow: hidden;
    user-select: none;
    max-height: 256px;
    transition: transform 0.2s ease;
  }

  .inv-slot:hover {
    transform: translateY(-2px);
    border-color: rgba(212, 182, 106, 0.18);
  }

  .item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    cursor: pointer;
    width: 100%;
    height: 100%;
    padding: 6px;
    box-sizing: border-box;
    border-radius: 6px;
    text-align: center;
    color: wheat;
    min-height: 100px;
  }

  .item .image {
    width: 100%;
    max-width: 100px;
    height: auto;
  }

  .item .image img {
    width: 100%;
    height: auto;
    max-height: 100px;
    object-fit: contain;
  }

  .item .name {
    font-size: 12px;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    max-width: 100%;
  }

  .item .type {
    font-size: 10px;
    color: var(--muted, #9aa0b3);
    text-transform: uppercase;
  }

  .item .qty {
    position: absolute;
    right: 6px;
    bottom: 6px;
    background: rgba(0, 0, 0, 0.6);
    padding: 2px 6px;
    border-radius: 8px;
    font-size: 12px;
    color: #fff;
  }

  /* Rarity styles */
  .common {
    border: 3px solid #a0a0a0;
    box-shadow: 0 0 6px rgba(160, 160, 160, 0.4);
  }

  .uncommon {
    border: 3px solid #00ff22;
    box-shadow: 0 0 8px rgba(0, 255, 34, 0.5);
  }

  .rare {
    border: 3px solid #0070ff;
    box-shadow: 0 0 10px rgba(0, 112, 255, 0.6);
  }

  .epic {
    border: 3px solid #b400ff;
    box-shadow: 0 0 12px rgba(180, 0, 255, 0.7);
  }

  .legendary {
    border: 3px solid #ff9900;
    box-shadow: 0 0 14px rgba(255, 153, 0, 0.8);
  }

  .mythic {
    border: 3px solid #ff0033;
    box-shadow: 0 0 16px rgba(255, 0, 51, 0.9);
  }

  .exotic {
    border: 3px solid #00ffee;
    box-shadow: 0 0 14px rgba(0, 255, 238, 0.8);
  }

  .artifact {
    border: 3px solid #ffd700;
    box-shadow: 0 0 18px rgba(255, 215, 0, 0.9);
  }
</style>

