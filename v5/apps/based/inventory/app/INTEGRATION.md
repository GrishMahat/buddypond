# Integration Guide

## How to Integrate the Svelte Inventory App

The Svelte inventory app is designed to be loaded via iframe and communicate with the parent window using BroadcastChannel and PostMessage APIs.

### Step 1: Build the Svelte App

```bash
cd app
npm install
npm run build
```

This will create a `build/` directory with the compiled static files.

### Step 2: Serve the Build

The build directory should be served from your web server. For example, if your app is at:
```
https://yourdomain.com/v5/apps/based/inventory/app/build/
```

### Step 3: Load in iframe

#### Option A: Using iframeContent in the legacy wrapper

Update your `inventory.js` to use iframe:

```javascript
window() {
  return {
    id: 'inventory',
    title: 'Buddy Inventory',
    icon: 'desktop/assets/images/icons/icon_inventory_64.webp',
    position: 'center',
    parent: $('#desktop')[0],
    width: 850,
    height: 600,
    // Use iframe instead of inline content
    iframeContent: '/v5/apps/based/inventory/app/build/index.html',
    resizable: true,
    closable: true,
    onLoad: (iframe) => {
      // Configure the Svelte app once it's loaded
      iframe.contentWindow.postMessage({
        type: 'configure-inventory',
        endpoint: buddypond.inventoryEndpoint,
        buddyname: buddypond.me,
        token: buddypond.qtokenid
      }, '*');
    },
    onClose: () => {
      this.win = null;
    }
  }
}
```

#### Option B: Manual iframe creation

```javascript
const iframe = document.createElement('iframe');
iframe.src = '/v5/apps/based/inventory/app/build/index.html';
iframe.style.width = '100%';
iframe.style.height = '100%';
iframe.style.border = 'none';

// Wait for iframe to load
iframe.addEventListener('load', () => {
  // Send configuration
  iframe.contentWindow.postMessage({
    type: 'configure-inventory',
    endpoint: 'https://api.example.com/inventory',
    buddyname: 'user123',
    token: 'auth-token-here'
  }, '*');
});

// Listen for messages from iframe
window.addEventListener('message', (event) => {
  if (event.data.type === 'inventory-ready') {
    console.log('Inventory app is ready');
  }
});

document.getElementById('container').appendChild(iframe);
```

### Step 4: Communication via BroadcastChannel

The Svelte app listens on the `inventory-channel` BroadcastChannel.

```javascript
// In your parent application
const channel = new BroadcastChannel('inventory-channel');

// Reload inventory
channel.postMessage({ type: 'reload-inventory' });

// Listen for events from inventory app
channel.onmessage = (event) => {
  console.log('Received from inventory:', event.data);
};
```

### Configuration Options

The configuration message supports these properties:

```javascript
{
  type: 'configure-inventory',
  endpoint: 'https://api.example.com/inventory',  // API endpoint
  buddyname: 'user123',                            // User identifier
  token: 'auth-token-here'                         // Authentication token
}
```

### API Endpoints Expected

The Svelte app expects these API endpoints:

- `GET /all/:buddyname` - Get all items for a user
- `POST /add` - Add a new item
- `DELETE /remove/:itemId` - Remove an item
- `PUT /update/:itemId` - Update an item
- `POST /trade` - Trade an item

### Item Data Format

Items should follow this structure:

```javascript
{
  id: 'unique-item-id',
  quantity: 1,
  item_def: {
    id: 'item-definition-id',
    name: 'Item Name',
    type: 'weapon', // or 'armor', 'consumable', 'misc', etc.
    rarity: 'rare', // 'common', 'uncommon', 'rare', 'epic', 'legendary', etc.
    metadata: {
      image: 'https://example.com/item-image.png',
      description: 'Item description',
      // ... other metadata
    }
  }
}
```

### Example Integration in Legacy Code

```javascript
// In your legacy inventory.js
async open({ context } = {}) {
  if (!this.win) {
    this.win = await this.bp.window({
      id: 'inventory',
      title: 'Buddy Inventory',
      icon: 'desktop/assets/images/icons/icon_inventory_64.webp',
      position: 'center',
      width: 850,
      height: 600,
      iframeContent: '/v5/apps/based/inventory/app/build/index.html',
      onLoad: (iframe) => {
        // Wait a bit for Svelte to initialize
        setTimeout(() => {
          iframe.contentWindow.postMessage({
            type: 'configure-inventory',
            endpoint: this.bp.inventoryEndpoint || buddypond.inventoryEndpoint,
            buddyname: context || this.bp.me,
            token: this.bp.qtokenid || buddypond.qtokenid
          }, '*');
        }, 100);
      }
    });
  }
  return this.win;
}
```

### Fallback to window.buddypond

If the iframe can access the parent window's `window.buddypond` object, it will automatically configure itself:

```javascript
// In your parent window
window.buddypond = {
  inventoryEndpoint: 'https://api.example.com/inventory',
  me: 'user123',
  qtokenid: 'auth-token-here'
};
```

The Svelte app will detect this and configure itself automatically.

