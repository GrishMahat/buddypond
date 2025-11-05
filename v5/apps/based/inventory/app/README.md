# Inventory Svelte App

This is a Svelte-based inventory management application converted from the legacy jQuery implementation.

## Features

- **Real-time Inventory Display**: Shows all items with images, names, types, and quantities
- **Filtering**: Filter items by type
- **Sorting**: Sort by rarity, name, or type (with ascending/descending toggle)
- **Trading**: Trade items with other players
- **Responsive Design**: Works on desktop and mobile
- **BroadcastChannel Communication**: Real-time communication via `buddypond-inventory` channel
- **API Integration**: Connects to inventory backend API
- **Multi-user Support**: View any user's inventory by sending buddyname via BroadcastChannel

## Architecture

### Components

- **InventoryGrid.svelte**: Main grid displaying inventory items
- **InventoryItem.svelte**: Individual item card with rarity styling
- **InventoryFilters.svelte**: Filter and sort controls
- **TradeModal.svelte**: Modal for trading items

### Stores (State Management)

- **inventoryStore.js**: Central state management using Svelte stores
  - `items`: All inventory items
  - `selectedItem`: Currently selected item
  - `filterType`: Current filter
  - `sortBy`: Current sort field
  - `sortDirection`: Sort direction (asc/desc)
  - `filteredAndSortedItems`: Derived store with filtered and sorted items
  - `inventoryTypes`: Derived store with available item types

### API Client

- **inventoryClient.js**: Handles all API requests to the backend
  - `getAll(buddyname)`: Get all items for a user
  - `addItem(itemData)`: Add a new item
  - `removeItem(itemId)`: Remove an item
  - `updateItem(itemId, itemData)`: Update an item
  - `trade(itemId, quantity, targetBuddyname)`: Trade an item

## Communication via BroadcastChannel

The app communicates entirely through the `buddypond-inventory` BroadcastChannel. The channel is also exposed globally as `window.channel` for easy access.

### Configuration

The app reads configuration from localStorage:

- `me` - Current user's buddyname
- `qtokenid` - Authentication token

### Opening/Loading an Inventory

To load or reload an inventory (including for different users):

```javascript
const channel = new BroadcastChannel('buddypond-inventory');

// Reload current user's inventory
channel.postMessage({ action: 'reload-inventory' });

// View another user's inventory
channel.postMessage({ 
  action: 'reload-inventory', 
  buddyname: 'otheruser123' 
});
```

### Opening Another App

The inventory can trigger other apps to open:

```javascript
// From within the inventory app
window.channel.postMessage({ 
  action: 'open-app', 
  app: 'fishing' 
});
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

API endpoint is currently hard-coded but can be configured via the code.

## Legacy Code

The original jQuery-based implementation is still available in the parent directory:
- `inventory.html`
- `inventory.js`
- `inventory.css`
- `lib/` directory

These files can be safely removed once the Svelte version is fully tested and deployed.

## Styling

The app uses CSS custom properties for theming:

```css
--bg: #0f1221;
--panel: #1b1f2e;
--accent: #d4b66a;
--muted: #9aa0b3;
--inventory-columns: 5;
```

Rarity classes are styled with distinct colors and glows:
- common (gray)
- uncommon (green)
- rare (blue)
- epic (purple)
- legendary (orange)
- mythic (red)
- exotic (cyan)
- artifact (gold)
