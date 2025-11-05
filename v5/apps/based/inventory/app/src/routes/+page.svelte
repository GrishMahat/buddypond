<script>
  import { onMount } from 'svelte';
  import InventoryGrid from '$lib/components/InventoryGrid.svelte';
  import InventoryFilters from '$lib/components/InventoryFilters.svelte';
  import TradeModal from '$lib/components/TradeModal.svelte';
  import { items, filteredAndSortedItems, selectedItem, setItems } from '$lib/stores/inventoryStore';
  import inventoryClient from '$lib/api/inventoryClient';

  let isTradeModalOpen = $state(false);
  let isLoading = $state(true);
  let error = $state(null);
  let buddyname = $state(null);
  let me = $state(null);

  const MAX_SLOTS = 999;

  onMount(async () => {
    // TODO: this should be broadcastchannel based communication, not iframe postMessage
    /*
    // Listen for configuration from parent window (if in iframe)
    const handleMessage = (event) => {
      if (event.data?.type === 'configure-inventory') {
        const { endpoint, buddyname: bn, token } = event.data;
        inventoryClient.configure({ endpoint, buddyname: bn, token });
        buddyname = bn;
        loadInventory(bn);
      }
    };
    */


    // get me and qtokenid from localStorage if available
    me = localStorage.getItem('me');
    let token = localStorage.getItem('qtokenid');

    let endpoint = 'http://localhost:10000/api/inventory'

    // TODO: needs to pass in context / buddyname to show inventory for specific user...
    inventoryClient.configure({ endpoint, buddyname: me, token });
    buddyname = me;
    loadInventory(me);

    /*
    // Try to get configuration from window.buddypond if available
    if (typeof window !== 'undefined' && window.buddypond) {
      inventoryClient.configure({
        endpoint: window.buddypond.inventoryEndpoint,
        buddyname: window.buddypond.me,
        token: window.buddypond.qtokenid
      });
      buddyname = window.buddypond.me;
      await loadInventory(buddyname);
    } else {
      // Signal to parent that we're ready for configuration
      window.parent?.postMessage({ type: 'inventory-ready' }, '*');
      isLoading = false;
    }
    */

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  });

  async function loadInventory(bn) {
    try {
      isLoading = true;
      error = null;
      const result = await inventoryClient.getAll(bn);
      console.log('Inventory result:', result);
      setItems(result);
    } catch (err) {
      console.error('Inventory error:', err);
      error = err.message;
    } finally {
      isLoading = false;
    }
  }

  function handleOpenTrade() {
    if ($selectedItem) {
      isTradeModalOpen = true;
    }
  }

  async function handleTradeConfirm({ targetPlayer, quantity }) {
    if (!$selectedItem) return;

    try {
      const itemDef = typeof $selectedItem.item_def === 'string' 
        ? JSON.parse($selectedItem.item_def) 
        : $selectedItem.item_def;

      await inventoryClient.trade(itemDef.id, quantity, targetPlayer);
      console.log(`Traded ${quantity}x ${itemDef.name} to ${targetPlayer}`);
      
      // Reload inventory after trade
      await loadInventory(buddyname);
    } catch (err) {
      console.error('Trade error:', err);
      alert('Trade failed: ' + err.message);
    }
  }

  // Setup BroadcastChannel for communication with parent
  let channel;
  onMount(() => {
    channel = new BroadcastChannel('buddypond-inventory');
    window.channel = channel;
    channel.onmessage = (event) => {
      console.log('Received broadcast:', event.data);
      if (event.data.action === 'reload-inventory') {
        if (event.data.buddyname) {
          buddyname = event.data.buddyname;
          console.log("Set buddyname from broadcast:", buddyname);
        }
        loadInventory(buddyname);
      }
    };

    return () => {
      channel?.close();
    };
  });
</script>

<svelte:head>
  <title>Buddy Inventory</title>
</svelte:head>

<div class="inventory-app">
  <div class="inventory-wrap">
    <div class="panel inventory-panel">
      {#if isLoading}
        <div class="loading">Loading inventory...</div>
      {:else if error}
        <div class="error">
          <p>Error loading inventory: {error}</p>
          <button class="btn" onclick={() => loadInventory(buddyname)}>Retry</button>
        </div>
      {:else}
        <InventoryFilters 
          itemCount={$filteredAndSortedItems.length} 
          maxSlots={MAX_SLOTS}
        />
        
        <div class="inventory-header">
          <!-- Optional header content -->
        </div>

        <InventoryGrid {buddyname} {me} items={$filteredAndSortedItems} />

        {#if $selectedItem}
          <div class="selected-item-actions">
            <button class="btn" onclick={handleOpenTrade}>
              Trade Item
            </button>
          </div>
        {/if}
      {/if}
    </div>
  </div>

  <TradeModal 
    bind:isOpen={isTradeModalOpen}
    item={$selectedItem}
    onConfirm={handleTradeConfirm}
  />
</div>

<style>
  .loading,
  .error {
    padding: 40px;
    text-align: center;
    color: var(--muted, #9aa0b3);
  }

  .error {
    color: #ff6b6b;
  }

  .error button {
    margin-top: 16px;
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

  .selected-item-actions {
    margin-top: 16px;
    display: flex;
    gap: 8px;
    justify-content: center;
  }
</style>
