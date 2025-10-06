import ImageGenClient from "./lib/ImageGenClient.js";
import inventoryClient from '../inventory/lib/inventoryClient.js';

export default class ImageGen {
  // constructor is required, it is called when the app is loaded
  constructor(bp, options = {}) {
    this.bp = bp;
    this.options = options;
    return this;
  }

  // init is required, it is called when the app is opened or initialized
  async init() {
    this.html = await this.bp.load('/v5/apps/based/imagegen/imagegen.html');
    await this.bp.load('/v5/apps/based/imagegen/imagegen.css');
    this.client = new ImageGenClient('https://bp-imagegen.cloudflare1973.workers.dev');

    // this.client = new ImageGenClient('http://localhost:10001');
    this.inventoryClient = inventoryClient;
    return 'loaded ImageGen';
  }

  async open() {
    if (!this.win) {
      this.win = await this.bp.window(this.window());
      $('.generate-btn', this.win.content).on('click', async () => {
        await this.run();
      });
      // TODO: fetch all item defs, and populate the select box with keys and names
      // const itemDefs = await this.client.listItemDefs();
      const itemDefs = await this.inventoryClient.apiRequest('/defs', 'GET');
      console.log('Fetched item defs:', itemDefs);
      itemDefs.forEach(def => {

        let metadata = JSON.parse(def.metadata || '{}');
        $('.imagegen-image-list', this.win.content).append(`
          <div class="imagegen-image-item" data-key="${def.key}" title="${def.description}">
            <img src="${metadata.image || 'desktop/assets/images/placeholder_64.webp'}" alt="${def.key}" width="64" height="64" />
            <div>${def.key}</div> 
          </div>
        `);
      });
      $('.imagegen-image-item', this.win.content).on('click', async (e) => {
        const key = $(e.currentTarget).data('key');
        const description = $(e.currentTarget).attr('title');
        console.log('Clicked image item:', key, description);
        // return;
        await this.run(key, description);
      });
      // TODO: when click on the item def,  call run() with the key and description
      // check for item.metadata.image and display it if exists
      // if it does not exist, show a placeholder image??
    }
    return this.win;
  }

  async run(key = "fish_common_carp", description = "A Common Carp, with chrome mutation, digital art") {
    console.log('running image generation');
    let forceRegen = $('#imagegen-force-regen', this.win.content).is(':checked');
    // clear out the image and metadata
    $('.imagegen-image', this.win.content).attr('src', '');
    $('.imagegen-metadata', this.win.content).text('Generating...');

    try {
      // Generate or fetch cached
      const result = await this.client.generate({
        key: key,
        description: description,
        width: 256,
        height: 256,
        force: forceRegen
      });

      console.log("Result:", result);

      // Fetch metadata
      const meta = await this.client.getMeta(result.filename);
      console.log("Metadata:", meta);

      // update the item_def with metadata.image if not already set
      if (result && result.url) {
        let update = { metadata: { image: result.url } };
        update.metadata.filename = result.filename;
        update.metadata.prompt = description;
        console.log('Updating item def with image URL:', result.url, key, update);
        const itemDef = await this.inventoryClient.apiRequest(`/defs/${key}`, 'PATCH', update );
        console.log('Updated item def:', itemDef);
      }

      // display the image in imagegen-image
      $('.imagegen-image', this.win.content).attr('src', result.url);
      $('.imagegen-metadata', this.win.content).text(JSON.stringify(meta, null, 2));
    } catch (err) {
      console.error("Error:", err);
    }
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
      id: 'imagegen',
      title: 'ImageGen',
      icon: 'desktop/assets/images/icons/icon_buddy-frog_64.webp',
      position: 'center',
      parent: $('#desktop')[0],
      width: 850,
      height: 600,
      content: this.html,
      resizable: true,
      closable: true,
      onClose: () => {
        this.win = null;
      }
    }
  }
}
