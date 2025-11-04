# Inventory Svelte App

This is a Svelte-based inventory management application converted from the legacy jQuery implementation.

## Features

- **Real-time Inventory Display**: Shows all items with images, names, types, and quantities
- **Filtering**: Filter items by type
- **Sorting**: Sort by rarity, name, or type (with ascending/descending toggle)
- **Trading**: Trade items with other players
- **Responsive Design**: Works on desktop and mobile
- **BroadcastChannel Support**: Communication with parent window via BroadcastChannel
- **API Integration**: Connects to inventory backend API

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

## Communication with Parent Window

The app can be loaded in an iframe and communicates with the parent window using:

1. **PostMessage API**: For initial configuration
2. **BroadcastChannel**: For real-time updates

### Configuration Message

Send this message to configure the inventory app:

```javascript
iframe.contentWindow.postMessage({
  type: 'configure-inventory',
  endpoint: 'https://api.example.com/inventory',
  buddyname: 'user123',
  token: 'auth-token-here'
}, '*');
```

### Reload Inventory

```javascript
const channel = new BroadcastChannel('inventory-channel');
channel.postMessage({ type: 'reload-inventory' });
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

The app automatically detects configuration from:
1. `window.buddypond` object (if available)
2. Parent window messages (when in iframe)

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
