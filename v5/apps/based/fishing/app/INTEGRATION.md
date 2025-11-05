# Integration Guide

## How to Integrate the Svelte Fishing App

The Svelte fishing app communicates entirely via BroadcastChannel (`buddypond-fishing`). No iframe postMessage is required - just ensure localStorage has the necessary credentials.

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
https://yourdomain.com/v5/apps/based/fishing/app/build/
```

### Step 3: Setup localStorage and BroadcastChannel

The app requires these localStorage items:

```javascript
// Set user credentials in localStorage
localStorage.setItem('me', 'myusername');
localStorage.setItem('qtokenid', 'my-auth-token');
```

### Step 4: Load the App

#### Using iframeContent in the legacy wrapper

Update your `fishing.js` to use iframe:

```javascript
async open() {
  if (!this.win) {
    this.win = await this.bp.window({
      id: 'fishing',
      title: 'Fishing',
      icon: 'desktop/assets/images/icons/icon_fishing_64.webp',
      position: 'center',
      parent: $('#desktop')[0],
      width: 850,
      height: 600,
      iframeContent: '/v5/apps/based/fishing/app/build/index.html',
      resizable: true,
      closable: true,
      onClose: () => {
        this.win = null;
      }
    });
  }
  return this.win;
}
```

### Step 5: Communication via BroadcastChannel

The Svelte app listens on the `buddypond-fishing` BroadcastChannel and exposes it globally as `window.channel`.

```javascript
// Create or get the channel
const channel = new BroadcastChannel('buddypond-fishing');

// Reload fishing data
channel.postMessage({ action: 'reload-fishing' });

// Listen for events from fishing app
channel.onmessage = (event) => {
  console.log('Received from fishing:', event.data);
};
```

### BroadcastChannel Message Format

All messages use the `action` property:

**Reload Fishing Data:**
```javascript
{
  action: 'reload-fishing'
}
```

### Complete Integration Example

```javascript
// In your legacy fishing.js
export default class Fishing {
  constructor(bp, options = {}) {
    this.bp = bp;
    this.options = options;
    this.channel = new BroadcastChannel('buddypond-fishing');
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
    
    return 'loaded Fishing';
  }

  async open() {
    if (!this.win) {
      this.win = await this.bp.window({
        id: 'fishing',
        title: 'Fishing',
        icon: 'desktop/assets/images/icons/icon_fishing_64.webp',
        position: 'center',
        parent: $('#desktop')[0],
        width: 850,
        height: 600,
        iframeContent: '/v5/apps/based/fishing/app/build/index.html',
        resizable: true,
        closable: true,
        onLoad: () => {
          // Small delay to ensure Svelte app is ready
          setTimeout(() => {
            this.channel.postMessage({ 
              action: 'reload-fishing'
            });
          }, 200);
        },
        onClose: () => {
          this.win = null;
        }
      });
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

## Item Data Format

### Fish Items

```javascript
{
  id: 'unique-item-id',
  item_type: 'fish',
  ctime: '2025-01-01T12:00:00Z',
  favorited: 0,  // 0 or 1
  item_def: {
    id: 'bass',
    name: 'Bass',
    type: 'fish',
    rarity: 'common',
    description: 'A common freshwater fish'
  },
  metadata: {
    weight: 2.5,
    value: 100,
    mutation: 'Golden',  // Optional
    image: 'https://example.com/bass.png'
  }
}
```

### Fishing Items

```javascript
{
  id: 'unique-item-id',
  item_type: 'fishing-item',
  durability: 100,
  favorited: 0,
  item_def: {
    id: 'fishing-rod',
    name: 'Wooden Fishing Rod',
    type: 'fishing-item',
    rarity: 'common',
    description: 'A simple wooden rod'
  },
  metadata: {
    image: 'https://example.com/rod.png',
    value: 50
  }
}
```

### Equipped Items

```javascript
{
  inventory_id: 123,
  item_durability: 85,
  metadata: {
    key: 'Wooden Fishing Rod',
    rarity: 'common',
    description: 'A simple wooden rod',
    image: 'https://example.com/rod.png'
  }
}
```

## Player Settings Format

```javascript
{
  settings: {
    auto_sell_enabled: true,  // or 'true' (string)
    auto_equip_enabled: false,  // or 'false' (string)
    fishing_stamina: 75.5
  }
}
```

## Cast Result Format

```javascript
{
  name: 'Bass',
  rarity: 'common',
  weight: 2.5,
  value: 100,
  mutation: 'Golden',  // Optional
  item_def: {
    id: 'bass',
    name: 'Bass',
    type: 'fish',
    // ...
  },
  metadata: {
    weight: 2.5,
    value: 100,
    mutation: 'Golden',
    image: 'https://example.com/bass.png'
  },
  stamina: {
    fishing_stamina: 70  // Updated stamina after cast
  },
  sold: {  // Optional - if auto-sell is enabled
    value: 100
  }
}
```
