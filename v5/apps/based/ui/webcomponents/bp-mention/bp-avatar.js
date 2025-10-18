
/*
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>BP-Avatar Demo</title>
  <style>
    bp-avatar {
      display: inline-block;
      font-family: Arial, sans-serif;
    }
    bp-avatar .avatar-container {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    bp-avatar .avatar-img {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      border: 2px solid #333;
      background: #eee;
      object-fit: cover;
    }
    bp-avatar label {
      font-weight: bold;
      color: #333;
    }
    bp-avatar input {
      padding: 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
      width: 200px;
    }
    bp-avatar input:focus {
      outline: none;
      border-color: #007bff;
    }
  </style>
</head>
<body>
  <bp-avatar id="avatar" label="Select Avatar:" data='[]' onselect="handleAvatarSelect"></bp-avatar>

  <script>
    // Stub for generating default SVG avatar based on username
    function generateDefaultAvatar(username) {
      // Placeholder: Generate a simple SVG based on username
      // In a real app, this could use a library like jdenticon or a custom algorithm
      const hue = username.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;
      return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="hsl(${hue}, 50%, 50%)"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="20">${username[0]}</text></svg>`;
    }

    // Stub for API POST to update avatar
    async function updateAvatarAPI(username, imageUrl) {
      // Simulate API call to POST /update
      console.log(`POST /update: username=${username}, imageUrl=${imageUrl}`);
      return { success: true, imageUrl }; // Mock response
    }

    class BPAvatar extends HTMLElement {
      static get observedAttributes() {
        return ['label', 'data', 'onselect', 'value'];
      }

      constructor() {
        super();
        this._data = []; // List of avatar objects: [{ username, imageUrl }, ...]
        this._value = ''; // Current username
        this._onSelect = null; // Callback for selection
        this._container = document.createElement('div');
        this._container.className = 'avatar-container';
        this._labelEl = document.createElement('label');
        this._inputEl = document.createElement('input');
        this._inputEl.type = 'text';
        this._avatarImg = document.createElement('img');
        this._avatarImg.className = 'avatar-img';
        this._container.append(this._labelEl, this._avatarImg, this._inputEl);
        this.appendChild(this._container);
      }

      connectedCallback() {
        // Initialize attributes
        this._labelEl.textContent = this.getAttribute('label') || 'Avatar:';
        this._value = this.getAttribute('value') || '';
        this._data = this.getAttribute('data') ? JSON.parse(this.getAttribute('data')) : [];
        this._onSelect = this.getAttribute('onselect')
          ? new Function('value', `return ${this.getAttribute('onselect')}(value);`)
          : null;

        // Set up autocomplete (assuming global $.autocomplete exists)
        if (typeof $.autocomplete === 'function') {
          $.autocomplete({
            element: this._inputEl,
            data: this._data.map(item => item.username),
            onSelect: (username) => this._handleSelect(username),
          });
        } else {
          console.warn('$.autocomplete not available; input will work without autocomplete.');
        }

        // Render initial avatar
        this._renderAvatar();

        // Handle input changes for custom values
        this._inputEl.addEventListener('change', () => {
          this._value = this._inputEl.value.trim();
          this._renderAvatar();
          this._triggerSelect();
        });
      }

      attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        if (name === 'label') {
          this._labelEl.textContent = newValue || 'Avatar:';
        } else if (name === 'data') {
          try {
            this._data = JSON.parse(newValue);
            if (typeof $.autocomplete === 'function') {
              $.autocomplete({
                element: this._inputEl,
                data: this._data.map(item => item.username),
                onSelect: (username) => this._handleSelect(username),
              });
            }
          } catch (e) {
            console.error('Invalid data attribute:', e);
          }
        } else if (name === 'value') {
          this._value = newValue;
          this._inputEl.value = newValue;
          this._renderAvatar();
        } else if (name === 'onselect') {
          this._onSelect = newValue
            ? new Function('value', `return ${newValue}(value);`)
            : null;
        }
      }

      // Get or set the current username
      get value() {
        return this._value;
      }

      set value(username) {
        this._value = username;
        this.setAttribute('value', username);
        this._inputEl.value = username;
        this._renderAvatar();
      }

      // Set autocomplete data
      setData(data) {
        this._data = data;
        this.setAttribute('data', JSON.stringify(data));
      }

      // Render the avatar image (default SVG or user-uploaded image)
      _renderAvatar() {
        const user = this._data.find(item => item.username === this._value);
        const imageUrl = user && user.imageUrl ? user.imageUrl : generateDefaultAvatar(this._value || 'Anonymous');
        this._avatarImg.src = imageUrl;
      }

      // Handle selection (from autocomplete or custom input)
      async _handleSelect(username) {
        this._value = username;
        this._inputEl.value = username;
        this._renderAvatar();

        // Update via API
        const user = this._data.find(item => item.username === username);
        const imageUrl = user && user.imageUrl ? user.imageUrl : generateDefaultAvatar(username);
        try {
          await updateAvatarAPI(username, imageUrl);
        } catch (e) {
          console.error('Failed to update avatar:', e);
        }

        this._triggerSelect();
      }

      // Trigger onSelect callback or dispatch event
      _triggerSelect() {
        const detail = { value: this._value };
        if (this._onSelect) {
          this._onSelect(detail);
        }
        this.dispatchEvent(new CustomEvent('select', { detail }));
      }
    }

    // Define the custom element
    customElements.define('bp-avatar', BPAvatar);

    // Demo usage
    document.addEventListener('DOMContentLoaded', () => {
      const avatarInstance = document.getElementById('avatar');
      avatarInstance.setData([
        { username: 'Alice', imageUrl: 'https://example.com/avatars/alice.jpg' },
        { username: 'Bob', imageUrl: 'https://example.com/avatars/bob.jpg' },
        { username: 'Charlie', imageUrl: 'https://example.com/avatars/charlie.jpg' },
      ]);

      // Example onSelect handler
      window.handleAvatarSelect = (value) => {
        console.log('Selected avatar:', value);
      };

      // Programmatic control
      avatarInstance.value = 'Omskbird';
      console.log('Current value:', avatarInstance.value);

      // Event listener for select
      avatarInstance.addEventListener('select', (e) => {
        console.log('Event-based select:', e.detail.value);
      });
    });
  </script>
</body>
</html>

*/