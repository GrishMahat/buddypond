<script>
  import { isCasting, lastCastResult } from '$lib/stores/fishingStore';
  
  let { onCast, onSellAll, totalValue } = $props();
  
  function handleCast() {
    if (onCast) {
      onCast();
    }
  }
  
  function handleSellAll() {
    if (onSellAll) {
      onSellAll();
    }
  }
</script>

<section class="fishing-cast-section">
  <button 
    class="fishing-cast" 
    onclick={handleCast}
    disabled={$isCasting}
  >
    {$isCasting ? 'Casting...' : 'Cast Your Line!'}
  </button>
  
  <div class="fishing-results">
    {#if $lastCastResult}
      <div class="cast-result">
        <p>You caught a <strong>{$lastCastResult.name}</strong> (Rarity: {$lastCastResult.rarity})</p>
        {#if $lastCastResult.weight}
          <p>Weight: {$lastCastResult.weight} lbs</p>
        {/if}
        {#if $lastCastResult.value}
          <p>Value: {$lastCastResult.value.toLocaleString()} coins</p>
        {/if}
        {#if $lastCastResult.mutation}
          <p class="mutation">Mutation occurred! Your {$lastCastResult.name} is <strong>{$lastCastResult.mutation}</strong></p>
        {/if}
        {#if $lastCastResult.sold}
          <p class="auto-sold">Auto-sold for {$lastCastResult.sold.value.toLocaleString()} coins!</p>
        {/if}
      </div>
    {/if}
  </div>
  
  <div class="fishing-inventory-summary">
    <h3>Fishing Inventory</h3>
    <h4>Total Value: <span class="fishing-total-inventory-value">{totalValue.toLocaleString()}</span> coins</h4>
    <button class="fishing-sell-all" onclick={handleSellAll}>Sell All</button>
  </div>
</section>

<style>
  .fishing-cast-section {
    background: var(--desktop_element-background, #fff);
    border-radius: 12px;
    padding: 15px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .fishing-cast {
    background: #4caf50;
    color: white;
    font-size: 1.2em;
    padding: 12px 24px;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    margin-bottom: 15px;
    transition: transform 0.2s ease, background 0.2s ease;
  }

  .fishing-cast:hover:not(:disabled) {
    background: #45a049;
    transform: scale(1.05);
  }

  .fishing-cast:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .fishing-results {
    border: 1px solid #aee1ff;
    padding: 10px;
    width: 100%;
    min-height: 80px;
    border-radius: 8px;
    overflow-y: auto;
    margin-bottom: 15px;
  }

  .cast-result p {
    margin: 0 0 8px 0;
    font-size: 1em;
  }

  .mutation {
    color: #ff6b00;
    font-weight: bold;
  }

  .auto-sold {
    color: #4caf50;
    font-weight: bold;
  }

  .fishing-inventory-summary {
    background: var(--desktop_element-background, #fff);
    width: 100%;
    border-radius: 12px;
    padding: 15px;
    text-align: center;
  }

  .fishing-inventory-summary h3 {
    margin: 0 0 8px 0;
  }

  .fishing-inventory-summary h4 {
    margin: 0 0 12px 0;
  }

  .fishing-sell-all {
    background: #ff9800;
    color: white;
    font-size: 1em;
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .fishing-sell-all:hover {
    background: #e68900;
  }
</style>

