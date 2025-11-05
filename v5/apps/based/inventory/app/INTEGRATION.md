# Integration Guide

## How to Integrate the Svelte Inventory App

The Svelte inventory app communicates entirely via BroadcastChannel (`buddypond-inventory`). No iframe postMessage is required - just ensure localStorage has the necessary credentials.

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

### Step 3: Setup localStorage and BroadcastChannel

The app requires these localStorage items:

```javascript
// Set user credentials in localStorage
localStorage.setItem('me', 'myusername');
localStorage.setItem('qtokenid', 'my-auth-token');
```

### Step 4: Load the App

#### Option A: Using iframeContent in the legacy wrapper

Update your `inventory.js` to use iframe:

```javascript
async open({ context } = {}) {
  if (!this.win) {
    this.win = await this.bp.window({
      id: 'inventory',
      title: 'Buddy Inventory',
      icon: 'desktop/assets/images/icons/icon_inventory_64.webp',
      position: 'center',
      parent: $('#desktop')[0],
      width: 850,
      height: 600,
      iframeContent: '/v5/apps/based/inventory/app/build/index.html',
      resizable: true,
      closable: true,
      onLoad: (iframe) => {
        // If viewing another user's inventory, send via BroadcastChannel
        if (context && context !== this.bp.me) {
          const channel = new BroadcastChannel('buddypond-inventory');
          channel.postMessage({ 
            action: 'reload-inventory', 
            buddyname: context 
          });
        }
      },
      onClose: () => {
        this.win = null;
      }
    });
  }
  return this.win;
}
```

#### Option B: Manual iframe creation

```javascript
const iframe = document.createElement('iframe');
iframe.src = '/v5/apps/based/inventory/app/build/index.html';
iframe.style.width = '100%';
iframe.style.height = '100%';
iframe.style.border = 'none';

document.getElementById('container').appendChild(iframe);
```

### Step 5: Communication via BroadcastChannel

The Svelte app listens on the `buddypond-inventory` BroadcastChannel and exposes it globally as `window.channel`.

```javascript
// Create or get the channel
const channel = new BroadcastChannel('buddypond-inventory');

// Reload current user's inventory
channel.postMessage({ action: 'reload-inventory' });

// View another user's inventory
channel.postMessage({ 
  action: 'reload-inventory', 
  buddyname: 'otheruser123' 
});

// Listen for events from inventory app
channel.onmessage = (event) => {
  console.log('Received from inventory:', event.data);
  
  // Handle open-app requests
  if (event.data.action === 'open-app') {
    console.log('Open app:', event.data.app);
    // Your logic to open the requested app
  }
};
```

### BroadcastChannel Message Format

All messages use the `action` property:

**Reload Inventory:**
```javascript
{
  action: 'reload-inventory',
  buddyname: 'username'  // Optional - defaults to current user from localStorage
}
```

**Open Another App:**
```javascript
{
  action: 'open-app',
  app: 'fishing'  // App name to open
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

### Complete Integration Example

```javascript
// In your legacy inventory.js
export default class Inventory {
  constructor(bp, options = {}) {
    this.bp = bp;
    this.options = options;
    this.channel = new BroadcastChannel('buddypond-inventory');
    return this;
  }

  async init() {
    // Ensure localStorage has the required data
    if (this.bp.me) {
      localStorage.setItem('me', this.bp.me);
    }
    if (this.bp.qtokenid) {
      localStorage.setItem('qtokenid', this.bp.qtokenid);
    }
    
    return 'loaded Inventory';
  }

  async open({ context } = {}) {
    if (!this.win) {
      this.win = await this.bp.window({
        id: 'inventory',
        title: 'Buddy Inventory',
        icon: 'desktop/assets/images/icons/icon_inventory_64.webp',
        position: 'center',
        parent: $('#desktop')[0],
        width: 850,
        height: 600,
        iframeContent: '/v5/apps/based/inventory/app/build/index.html',
        resizable: true,
        closable: true,
        onLoad: () => {
          // Determine which user's inventory to show
          const targetBuddyname = context || this.bp.me;
          
          // Send via BroadcastChannel to load inventory
          setTimeout(() => {
            this.channel.postMessage({ 
              action: 'reload-inventory', 
              buddyname: targetBuddyname 
            });
          }, 200); // Small delay to ensure Svelte app is ready
        },
        onClose: () => {
          this.win = null;
        }
      });

      // Listen for messages from inventory app
      this.channel.onmessage = (event) => {
        if (event.data.action === 'open-app') {
          // Handle app opening requests from inventory
          const appName = event.data.app;
          if (this.bp.apps[appName]) {
            this.bp.apps[appName].open();
          }
        }
      };
    }
    return this.win;
  }
}
```

### LocalStorage Requirements

The app requires these localStorage items to be set before loading:

```javascript
localStorage.setItem('me', 'current-username');
localStorage.setItem('qtokenid', 'authentication-token');
```

These should be set in your app's initialization code or login flow.

