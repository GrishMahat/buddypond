<script>
  import FishInventoryItem from './FishInventoryItem.svelte';
  
  let { items, onSell, onFavorite, onGive } = $props();
</script>

<div class="fishing-inventory-list">
  {#if items.length === 0}
    <p class="empty-message">No fish caught yet. Cast your line!</p>
  {:else}
    {#each items as item (item.id)}
      <FishInventoryItem 
        {item} 
        {onSell}
        {onFavorite}
        {onGive}
      />
    {/each}
  {/if}
</div>

<style>
  .fishing-inventory-list {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    padding: 15px;
    min-height: 100px;
  }

  .empty-message {
    width: 100%;
    text-align: center;
    color: #999;
    padding: 20px;
  }
</style>

