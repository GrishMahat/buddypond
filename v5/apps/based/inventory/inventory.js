//import bindUIEvents from './lib/bindUIEvents.js';
//import inventoryClient from './lib/inventoryClient.js';
//import renderInventory from './lib/renderInventory.js';
//import sortInventory from './lib/sortInventory.js';

export default class Inventory {
  // constructor is required, it is called when the app is loaded
  constructor(bp, options = {}) {
    this.bp = bp;
    this.options = options;
    return this;
  }

  // init is required, it is called when the app is opened or initialized
  async init() {
    //this.html = await this.bp.load('/v5/apps/based/inventory/inventory.html');
    //await this.bp.load('/v5/apps/based/inventory/inventory.css');
    this.broadcastChannel();
    return 'loaded Inventory';
  }

  broadcastChannel() {

    this.receiver = new BroadcastChannel("buddypond-inventory");

     this.receiver.onmessage = (event) => {
      console.log('Inventory app received broadcast:', event.data);
      if (event.data.action === 'open-app') {
        // alert(event.data.app);
        this.bp.open(event.data.app);
      }
    }

  }

  // can send messages if needed
  sendMessage() {
    this.receiver.postMessage({ type: "app", app: "inventory", action: "reload-inventory", src: this.options.src || null });
  }

  async open({ context } = {}) {
    if (!this.win) {
      this.win = await this.bp.window(this.window());

      return;
      /*
      this.client = inventoryClient;

      this.bindUIEvents();

      // may be for other user.
      let buddynameInventory = this.bp.me;
      if (context && context !== 'default') {
        buddynameInventory = context;
      }
      // get inventory for this user
      this.client.apiRequest(`/all/${buddynameInventory}`, 'GET').then(result => {
        console.log('Inventory result:', result);
        this.renderInventory(result);
      }).catch(err => {
        console.error('Inventory error:', err);
      });

      // TODO: make a web comonent bp-avatar
      // Profile picture (SVG)
      const profilePicture = document.createElement('div');
      //profilePicture.className = 'aim-profile-picture';
      let me = this.bp.me;
      if (this.bp.apps.buddylist.data.profileState.profilePicture) {
        // use url as profile picture src
        const img = document.createElement('img');
        img.src = this.bp.apps.buddylist.data.profileState.profilePicture;
        img.alt = `${me}'s avatar`;
        //img.className = 'aim-chat-message-profile-picture-img';
        profilePicture.appendChild(img);
      } else {
        const defaultAvatar = this.bp.apps.buddylist.defaultAvatarSvg(me);
        profilePicture.innerHTML = defaultAvatar;
      }

      $('.char-silhouette', this.win.content).append(profilePicture);
      */
    }
    this.receiver.postMessage({ type: "app", app: "inventory", action: "reload-inventory", src: null, buddyname: context || this.bp.me });

    return this.win;
  }

  window() {

    /*

    title = "Window", // Title of the window
    width = '400px', // Default width
    height = '300px', // Default height
    app = 'default', // default app
    type = 'singleton', // Default type ( intended to not have siblings )
    context = 'default', // Default context
    content = '', // Default content
    iframeContent = false, // Can be used to load content in an iframe
    position = null,
    icon = '', // Default icon
    x = 50, // Default x position
    y = 50, // Default y position
    z = 99, // Default z-index
    parent = window.document.body, // Parent element to append to
    id = `window-${idCounter}`, // Unique ID for the panel
    onFocus = () => { }, // Callback when the window is focused
    onClose = () => { }, // Callback when the window is closed
    onOpen = () => { }, // Callback when the window is opened
    onResize = () => { }, // Callback when the window is resized
    onMessage = () => { }, // Callback when the window receives a message
    onLoad = () => { }, // Callback when the window is loaded ( remote content )
    className = '', // Custom classes for styling
    resizeable = true, // Enable resizable feature
    preventOverlap = true, // prevents direct overlap with other windows
    canBeBackground = false // Can be set as background
    */

    return {
      id: 'inventory',
      title: 'Buddy Inventory',
      icon: 'desktop/assets/images/icons/icon_inventory_64.webp',
      position: 'center',
      parent: $('#desktop')[0],
      width: 850,
      height: 600,
      //content: this.html,
      iframeContent: '/v5/apps/based/inventory/app/build/',
      resizable: true,
      closable: true,
      onClose: () => {
        this.win = null;
      }
    }
  }
}

//Inventory.prototype.bindUIEvents = bindUIEvents;
//Inventory.prototype.renderInventory = renderInventory;
//Inventory.prototype.sortInventory = sortInventory;