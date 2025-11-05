import { writable, derived } from 'svelte/store';

// Player state
export const stamina = writable({ current: 0, max: 100 });
export const playerSettings = writable({
  auto_sell_enabled: false,
  auto_equip_enabled: false
});

// Inventory state
export const fishInventory = writable([]);
export const totalInventoryValue = derived(fishInventory, ($fishInventory) => {
  return $fishInventory.reduce((total, item) => {
    const metadata = typeof item.metadata === 'string' 
      ? JSON.parse(item.metadata) 
      : item.metadata || {};
    const value = metadata.value || item.value || 0;
    return total + value;
  }, 0);
});

// Equipment state
export const equippedItems = writable([]);
export const availableItems = writable([]);

// Cast results
export const lastCastResult = writable(null);
export const castHistory = writable([]);

// Status message
export const statusMessage = writable('');

// Loading states
export const isLoading = writable(false);
export const isCasting = writable(false);

// Actions
export function setStamina(current, max = 100) {
  stamina.set({ current: Math.round(current), max });
}

export function setPlayerSettings(settings) {
  playerSettings.set({
    auto_sell_enabled: settings.auto_sell_enabled === 'true' || settings.auto_sell_enabled === true,
    auto_equip_enabled: settings.auto_equip_enabled === 'true' || settings.auto_equip_enabled === true
  });
  
  if (settings.fishing_stamina !== undefined) {
    setStamina(settings.fishing_stamina);
  }
}

export function setFishInventory(inventory) {
  fishInventory.set(inventory);
}

export function setEquippedItems(items) {
  equippedItems.set(items);
}

export function setAvailableItems(items) {
  availableItems.set(items);
}

export function addCastResult(result) {
  lastCastResult.set(result);
  castHistory.update(history => [result, ...history].slice(0, 10)); // Keep last 10
}

export function removeFishFromInventory(itemId) {
  fishInventory.update(items => items.filter(item => item.id !== itemId));
}

export function addFishToInventory(fish) {
  fishInventory.update(items => [fish, ...items]);
}

export function clearStatusMessage() {
  statusMessage.set('');
}

