<script>
  import { onMount } from 'svelte';
  import CastSection from '$lib/components/CastSection.svelte';
  import FishInventoryList from '$lib/components/FishInventoryList.svelte';
  import EquippedItems from '$lib/components/EquippedItems.svelte';
  import AvailableItems from '$lib/components/AvailableItems.svelte';
  import PlayerSettings from '$lib/components/PlayerSettings.svelte';
  import fishingClient from '$lib/api/fishingClient';
  import inventoryClient from '$lib/api/inventoryClient';
  import { 
    fishInventory, 
    equippedItems, 
    availableItems, 
    totalInventoryValue,
    statusMessage,
    isCasting,
    setStamina,
    setPlayerSettings,
    setFishInventory,
    setEquippedItems,
    setAvailableItems,
    addCastResult,
    removeFishFromInventory,
    addFishToInventory
  } from '$lib/stores/fishingStore';

  let isLoading = $state(true);
  let error = $state(null);

  onMount(async () => {
    // Get credentials from localStorage
    const me = localStorage.getItem('me');
    const token = localStorage.getItem('qtokenid');

    // Configure endpoints
    let fishingEndpoint = 'https://buddypond.com/api/fishing';
    let inventoryEndpoint = 'https://buddypond.com/api/inventory';

    fishingEndpoint = 'http://localhost:9999/api/fishing';
    inventoryEndpoint = 'http://localhost:10000/api/inventory';


    fishingClient.configure({ endpoint: fishingEndpoint, buddyname: me, token });
    inventoryClient.configure({ endpoint: inventoryEndpoint, buddyname: me, token });

    // Load initial data
    await loadAllData();

    // Setup BroadcastChannel
    const channel = new BroadcastChannel('buddypond-fishing');
    window.channel = channel;

    channel.onmessage = (event) => {
      console.log('Received broadcast:', event.data);
      if (event.data.action === 'reload-fishing') {
        loadAllData();
      }
    };

    return () => {
      channel?.close();
    };
  });

  async function loadAllData() {
    try {
      isLoading = true;
      error = null;

      // Load all data in parallel
      const [regenResult, settings, equipped, items, inventory] = await Promise.all([
        fishingClient.regen(),
        fishingClient.getSettings(),
        fishingClient.getEquipped(),
        fishingClient.getItems(),
        fishingClient.getInventory()
      ]);

      console.log('Loaded data:', { regenResult, settings, equipped, items, inventory });

      // Update stores
      setPlayerSettings(settings.settings);
      setEquippedItems(equipped || []);
      setAvailableItems(items || []);
      setFishInventory(inventory || []);

    } catch (err) {
      console.error('Error loading data:', err);
      error = err.message;
    } finally {
      isLoading = false;
    }
  }

  async function handleCast() {
    try {
      isCasting.set(true);
      statusMessage.set('');
      
      const result = await fishingClient.cast();
      console.log('Cast result:', result);

      if (result.error) {
        statusMessage.set(result.error);
        return;
      }

      // Update stamina if provided
      if (result.stamina) {
        setStamina(result.stamina.fishing_stamina);
      }

      // Add cast result
      addCastResult(result);

      // If it's a fish and not auto-sold, add to inventory
      if (result.item_def) {
        const itemDef = typeof result.item_def === 'string' 
          ? JSON.parse(result.item_def) 
          : result.item_def;

        if (itemDef.type === 'fish' && !result.sold) {
          addFishToInventory(result);
        }
      }

      // Reload equipment and items (they may have changed)
      await loadEquippedAndItems();

    } catch (err) {
      console.error('Error casting:', err);
      statusMessage.set(err.message);
    } finally {
      isCasting.set(false);
    }
  }

  async function handleSellAll() {
    try {
      const result = await fishingClient.sellAll();
      console.log('Sell all result:', result);

      if (result.success) {
        statusMessage.set(`Sold ${result.sold_count} items for ${result.totalValue.toLocaleString()} coins!`);
        await loadFishInventory();
      } else if (result.error) {
        statusMessage.set(result.error);
      }
    } catch (err) {
      console.error('Error selling all:', err);
      statusMessage.set(err.message);
    }
  }

  async function handleSellFish(itemId) {
    try {
      const result = await fishingClient.sellItem(itemId);
      console.log('Sell item result:', result);

      if (result.success) {
        removeFishFromInventory(itemId);
        const value = result.item?.value || 0;
        statusMessage.set(`Sold item for ${value.toLocaleString()} coins!`);
      } else if (result.error) {
        statusMessage.set(result.error);
      }
    } catch (err) {
      console.error('Error selling item:', err);
      statusMessage.set(err.message);
    }
  }

  async function handleFavoriteFish(itemId, shouldFavorite) {
    try {
      if (shouldFavorite) {
        await fishingClient.favoriteItem(itemId);
      } else {
        await fishingClient.unfavoriteItem(itemId);
      }
      await loadFishInventory();
    } catch (err) {
      console.error('Error favoriting item:', err);
    }
  }

  async function handleGiveFish(itemId) {
    const buddyname = prompt('Enter the buddyname of the player to give this item to:');
    if (!buddyname) return;

    try {
      const result = await inventoryClient.transfer(itemId, buddyname, 1, true);
      console.log('Give item result:', result);

      if (result.success) {
        removeFishFromInventory(itemId);
        statusMessage.set(`Gave item to ${buddyname}!`);
      } else {
        alert(`Error giving item: ${result.error}`);
      }
    } catch (err) {
      console.error('Error giving item:', err);
      alert(`Error giving item: ${err.message}`);
    }
  }

  async function handleEquipItem(inventoryId) {
    try {
      await fishingClient.equipItem(inventoryId);
      await loadEquippedAndItems();
    } catch (err) {
      console.error('Error equipping item:', err);
      statusMessage.set(err.message);
    }
  }

  async function handleUnequipItem(inventoryId) {
    try {
      await fishingClient.unequipItem(inventoryId);
      await loadEquippedAndItems();
    } catch (err) {
      console.error('Error unequipping item:', err);
      statusMessage.set(err.message);
    }
  }

  async function handleSellItem(itemId) {
    try {
      const result = await fishingClient.sellItem(itemId);
      if (result.success) {
        statusMessage.set(`Sold item for ${result.item?.value || 0} coins!`);
        await loadEquippedAndItems();
      }
    } catch (err) {
      console.error('Error selling item:', err);
    }
  }

  async function handleFavoriteItem(itemId, shouldFavorite) {
    try {
      if (shouldFavorite) {
        await fishingClient.favoriteItem(itemId);
      } else {
        await fishingClient.unfavoriteItem(itemId);
      }
      await loadEquippedAndItems();
    } catch (err) {
      console.error('Error favoriting item:', err);
    }
  }

  async function handleGiveItem(itemId) {
    const buddyname = prompt('Enter the buddyname of the player to give this item to:');
    if (!buddyname) return;

    try {
      const result = await inventoryClient.transfer(itemId, buddyname, 1, true);
      if (result.success) {
        statusMessage.set(`Gave item to ${buddyname}!`);
        await loadEquippedAndItems();
      } else {
        alert(`Error giving item: ${result.error}`);
      }
    } catch (err) {
      console.error('Error giving item:', err);
      alert(`Error giving item: ${err.message}`);
    }
  }

  async function handleSettingChange(key, value) {
    try {
      await fishingClient.saveSettings(key, value);
      console.log('Setting saved:', key, value);
    } catch (err) {
      console.error('Error saving setting:', err);
    }
  }

  async function loadEquippedAndItems() {
    const [equipped, items] = await Promise.all([
      fishingClient.getEquipped(),
      fishingClient.getItems()
    ]);
    setEquippedItems(equipped || []);
    setAvailableItems(items || []);
  }

  async function loadFishInventory() {
    const inventory = await fishingClient.getInventory();
    setFishInventory(inventory || []);
  }

  const equippedIds = $derived($equippedItems.map(item => item.inventory_id));
</script>

<svelte:head>
  <title>🎣 Buddy Fishing</title>
</svelte:head>

<div class="fishing-app">
  <header class="fishing-header">
    <h1>🎣 Buddy Fishing</h1>
    {#if $statusMessage}
      <span class="fishing-status" class:error={$statusMessage.includes('Error')}>
        {$statusMessage}
      </span>
    {/if}
  </header>

  {#if isLoading}
    <div class="loading">Loading fishing data...</div>
  {:else if error}
    <div class="error">
      <p>Error: {error}</p>
      <button onclick={loadAllData}>Retry</button>
    </div>
  {:else}
    <main class="fishing-main">
      <!-- Left: Casting section + Fish inventory -->
      <section class="fishing-left-section">
        <CastSection 
          onCast={handleCast}
          onSellAll={handleSellAll}
          totalValue={$totalInventoryValue}
        />
        
        <FishInventoryList 
          items={$fishInventory}
          onSell={handleSellFish}
          onFavorite={handleFavoriteFish}
          onGive={handleGiveFish}
        />
      </section>

      <!-- Right: Sidebar with settings, equipped, and items -->
      <aside class="fishing-sidebar">
        <PlayerSettings onSettingChange={handleSettingChange} />
        
        <EquippedItems 
          items={$equippedItems}
          onUnequip={handleUnequipItem}
        />
        
        <AvailableItems 
          items={$availableItems}
          {equippedIds}
          onEquip={handleEquipItem}
          onSell={handleSellItem}
          onFavorite={handleFavoriteItem}
          onGive={handleGiveItem}
        />
      </aside>
    </main>
  {/if}
</div>

<style>
  .loading,
  .error {
    padding: 40px;
    text-align: center;
    color: #666;
  }

  .error {
    color: #f44336;
  }

  .error button {
    margin-top: 16px;
    padding: 10px 20px;
    background: #4caf50;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
  }

  .fishing-left-section {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
</style>
