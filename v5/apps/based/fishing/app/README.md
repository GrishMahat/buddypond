# Fishing Svelte App

This is a Svelte-based fishing game application converted from the legacy jQuery implementation.

## Features

- **Cast Fishing Line**: Catch fish and items with varying rarities
- **Fish Inventory**: View all caught fish with details (weight, value, mutations)
- **Equipment System**: Equip fishing rods and items to improve catch rates
- **Player Settings**: Auto-sell fish, auto-equip items
- **Stamina System**: Manage fishing stamina
- **Trading**: Give fish and items to other players
- **BroadcastChannel Communication**: Real-time communication via `buddypond-fishing` channel
- **API Integration**: Connects to fishing backend API

## Architecture

### Components

- **CastSection.svelte**: Cast button, results display, and sell-all functionality
- **FishInventoryList.svelte**: Grid of caught fish
- **FishInventoryItem.svelte**: Individual fish card with sell/favorite/give actions
- **EquippedItems.svelte**: Display equipped fishing rods and items
- **AvailableItems.svelte**: List of unequipped items in inventory
- **PlayerSettings.svelte**: Player stamina and settings (auto-sell, auto-equip)

### Stores (State Management)

- **fishingStore.js**: Central state management using Svelte stores
  - `stamina`: Player's fishing stamina
  - `playerSettings`: Auto-sell and auto-equip preferences
  - `fishInventory`: All caught fish
  - `equippedItems`: Currently equipped items
  - `availableItems`: Items available for equipping
  - `lastCastResult`: Most recent fishing cast result
  - `totalInventoryValue`: Calculated total value of fish inventory

### API Clients

- **fishingClient.js**: Handles all fishing-related API requests
  - `cast()`: Cast fishing line
  - `regen()`: Regenerate stamina
  - `getSettings()`: Get player settings
  - `saveSettings(key, value)`: Save player settings
  - `getInventory()`: Get fish inventory
  - `getEquipped()`: Get equipped items
  - `getItems()`: Get available items
  - `equipItem(inventory_id)`: Equip an item
  - `unequipItem(inventory_id)`: Unequip an item
  - `sellItem(item_id)`: Sell a fish or item
  - `sellAll()`: Sell all fish
  - `favoriteItem(inventory_id)`: Mark item as favorite
  - `unfavoriteItem(inventory_id)`: Remove favorite

- **inventoryClient.js**: Handles inventory transfers
  - `transfer(item_id, to_player_id, quantity, broadcast)`: Transfer item to another player

## Communication via BroadcastChannel

The app communicates entirely through the `buddypond-fishing` BroadcastChannel. The channel is also exposed globally as `window.channel` for easy access.

### Configuration

The app reads configuration from localStorage:

- `me` - Current user's buddyname
- `qtokenid` - Authentication token

### Reloading Fishing Data

To reload the fishing data:

```javascript
const channel = new BroadcastChannel('buddypond-fishing');

// Reload fishing data
channel.postMessage({ action: 'reload-fishing' });
```

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Build Output

The build creates a static SPA in the `build/` directory that can be:
- Served via any static file server
- Loaded in an iframe
- Embedded in other applications

## Environment

The app reads configuration from localStorage:
- `me` - Current user's buddyname
- `qtokenid` - Authentication token

API endpoints are currently hard-coded but can be configured via the code:
- Fishing API: `https://buddypond.com/api/fishing`
- Inventory API: `https://buddypond.com/api/inventory`

## Game Mechanics

### Fishing

1. Click "Cast Your Line!" to fish
2. Consumes stamina per cast
3. Can catch fish or fishing items
4. Fish have varying rarities, weights, and values
5. Mutations can occur for bonus value

### Items

- **Fishing Rods**: Equip to improve catch rates
- **Consumables**: Use to boost fishing results
- **Durability**: Equipped items degrade with use

### Settings

- **Auto-Sell**: Automatically sell caught fish
- **Auto-Equip**: Automatically equip found items

## Legacy Code

The original jQuery-based implementation is still available in the parent directory:
- `fishing.html`
- `fishing.js`
- `fishing.css`
- `lib/` directory

These files can be safely removed once the Svelte version is fully tested and deployed.

## API Endpoints

The app expects these API endpoints:

- `GET /api/fishing/cast` - Cast fishing line
- `GET /api/fishing/regen` - Regenerate stamina
- `GET /api/fishing/settings` - Get player settings
- `POST /api/fishing/settings` - Save player settings
- `GET /api/fishing/inventory` - Get fish inventory
- `GET /api/fishing/equipped` - Get equipped items
- `GET /api/fishing/items` - Get available items
- `POST /api/fishing/equip` - Equip an item
- `POST /api/fishing/unequip` - Unequip an item
- `POST /api/fishing/sell/:item_id` - Sell an item
- `POST /api/fishing/sell-all` - Sell all fish
- `POST /api/fishing/inventory/favorite` - Favorite an item
- `POST /api/fishing/inventory/unfavorite` - Unfavorite an item
- `POST /api/inventory/transfer` - Transfer item to another player
