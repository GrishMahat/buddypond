import api from './lib/api.js';
import fishingClient from './lib/fishingClient.js';

export default class Fishing {
  constructor(bp, options = {}) {
    this.bp = bp;
    this.options = options;
    this.client = fishingClient;
    this.win = null;
    this.html = null;
    this.equippedItems = [];
    return this;
  }

  /** Called when the app is loaded */
  async init() {
    this.html = await this.bp.load('/v5/apps/based/fishing/fishing.html');
    await this.bp.load('/v5/apps/based/fishing/fishing.css');
    return 'loaded Fishing';
  }

  /** Equip an item */
  async equipItem(inventory_id) {
    try {
      let result = await this.client.apiRequest(`/equip`, 'POST', { inventory_id });
      console.log('Equip item result:', result);
    } catch (err) {
      console.error('Error during equip item:', err);
    }
  }

  /** Open the fishing window */
  async open() {
    if (!this.win) {
      this.win = await this.bp.window(this.window());
      console.log('Fish data loaded:', api.Fish);

      this.bindEvents();
    }

    await this.loadEquipped();
    await this.loadItems();
    await this.renderFishInventory();

    return this.win;
  }

  /** Window config */
  window() {
    return {
      id: 'fishing',
      title: 'Fishing',
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
    };
  }

  /* ------------------
   * UI + RENDER METHODS
   * ------------------ */

  renderFishItem(item) {
    if (typeof item.item_def === 'string') {
      item.item_def = JSON.parse(item.item_def);
    }

    let favoriteButton = `<button class="fishing-favorite-item" data-inventory-id="${item.id}">Favorite</button>`;
    if (item.favorited === 1) {
      favoriteButton = `<button class="fishing-unfavorite-item" data-inventory-id="${item.id}">❤️</button>`;
    }

    return `<div class="fishing-item">
      <strong>${item.item_def.name}</strong><br/>
      Type: ${item.item_def.type}<br/>
      Rarity: ${item.item_def.rarity}<br/>
      Description: ${item.item_def.description}<br/>
      <button class="fishing-equip-item" data-inventory-id="${item.id}">Equip</button>
      ${favoriteButton}
      <button class="fishing-give-item" disabled="DISABLED" data-inventory-id="${item.id}">Give</button>
      <button class="fishing-sell-item" data-inventory-id="${item.id}">Sell</button>
    </div>`;
  }

  renderFishInventoryItem(item) {
    if (typeof item.item_def === 'string') {
      item.item_def = JSON.parse(item.item_def);
    }
    let favoriteButton = `<button class="fishing-favorite-item" data-inventory-id="${item.id}">Favorite</button>`;
    if (item.favorited === 1) {
      favoriteButton = `<button class="fishing-unfavorite-item" data-inventory-id="${item.id}">❤️</button>`;
    }
    let caughtTime = null;
    if (item.ctime) {
      let date = new Date(item.ctime);
      caughtTime = date.toLocaleString();

      let now = new Date();

      // time between now and caughtTime in time units
      let timeDiff = now - date;
      let timeUnits = Math.floor(timeDiff / 1000 / 60); // convert to minutes
      
      // formate caught time as "X minutes/hours/days ago"
      if (timeUnits < 60) {
        caughtTime = `${timeUnits} minutes ago`;
      } else if (timeUnits < 60 * 24) {
        caughtTime = `${Math.floor(timeUnits / 60)} hours ago`;
      } else {
        caughtTime = `${Math.floor(timeUnits / 60 / 24)} days ago`;
      }      

    }
   
    console.log('Rendering fish inventory item:', item);
    let metadata = {};
    if (item.metadata && typeof item.metadata === 'string') {
      metadata = JSON.parse(item.metadata);
    }
    item.value = metadata.value || item.value || 0;
    this.totalValue += item.value;
    let mutationStr = '';
    if (metadata.mutation) {
      mutationStr = `<br/>Mutation: ${metadata.mutation} <br/>`;
    }

    return `<div class="fishing-item">
      <strong>${item.item_def.name}</strong><br/>
      Type: ${item.item_def.type}<br/>
      Age: ${caughtTime || 'N/A'}<br/>
      Rarity: ${item.item_def.rarity}<br/>
      Value: ${item.value} coins<br/>
      ${mutationStr}
      Description: ${item.item_def.description}<br/>
      <button class="fishing-sell-item" data-inventory-id="${item.id}">Sell</button>
      ${favoriteButton}
      <button class="fishing-give-item" disabled="DISABLED" data-inventory-id="${item.id}">Give</button>
    </div>`;
  }

  async renderFishInventory() {
    let fishInventory = await this.client.apiRequest('/inventory', 'GET');
    console.log('Player fishing inventory:', fishInventory);

    this.totalValue = 0;
    let html = fishInventory.map(item => this.renderFishInventoryItem(item)).join('');
    let formattedValue = this.totalValue.toLocaleString();
    $('.fishing-total-inventory-value', this.win.content).text(formattedValue);

    $('.fishing-inventory-list', this.win.content).empty().append(html);
  }

  /* ------------------
   * API LOADING METHODS
   * ------------------ */

  async loadEquipped() {
    let equipped = await this.client.apiRequest('/equipped', 'GET');
    console.log('Player fishing equipped:', equipped);

    let equippedHtml = `<h3>Equipped Items</h3>`;
    if (equipped) {
      this.equippedItems = [];
      equipped.forEach(item => {
        this.equippedItems.push(item.inventory_id);
        // TODO: add back durability and charges display
        // Durability: ${item.metadata.durability}<br/>
        equippedHtml += `<div class="fishing-item">
          <strong>${item.metadata.key}</strong><br/>
          Type: ${item.metadata.key}<br/>
          Rarity: ${item.metadata.rarity}<br/>
          <em>${item.metadata.description}</em><br/>

          <button class="fishing-unequip-item" data-inventory-id="${item.inventory_id}">Unequip</button>
        </div>`;

      });
    } else {
      equippedHtml += `<p>No fishing rod equipped.</p>`;
    }
    $('.fishing-equipped', this.win.content).html(equippedHtml);
  }

  async loadItems() {
    let items = await this.client.apiRequest('/items', 'GET');
    console.log('Player fishing items:', items);
    console.log(' this.equippedItems.length',  this.equippedItems);
    $('.fishing-items-list', this.win.content).empty();
    items.forEach(item => {
      // check that item.inventory id is not in this.equippedItems
      if (this.equippedItems.includes(item.id)) {
        console.log('Skipping equipped item:', item);
        return;
      }

      let itemDef = JSON.parse(item.item_def);
      console.log('Item def:', itemDef);
      console.log('renderFishItem', item)
      let itemHtml = this.renderFishItem(item);
      $('.fishing-items-list', this.win.content).append(itemHtml);
    });
  }

  /* ------------------
   * EVENT BINDING
   * ------------------ */

  bindEvents() {
    // Cast fishing line
    $('.fishing-cast', this.win.content).on('click', this.handleCast.bind(this));

    // Sell all items
    $('.fishing-sell-all', this.win.content).on('click', this.handleSellAll.bind(this));

    $('.fishing-app', this.win.content).on('click', '.fishing-favorite-item', async (e) => {
      const inventoryId = $(e.currentTarget).data('inventory-id');
      await this.client.apiRequest(`/inventory/favorite`, 'POST', { inventory_id: inventoryId });
      // update the button to unfavorite
      $(e.currentTarget).replaceWith(`<button class="fishing-unfavorite-item" data-inventory-id="${inventoryId}">❤️</button>`);
    });

    $('.fishing-app', this.win.content).on('click', '.fishing-unfavorite-item', async (e) => {
      const inventoryId = $(e.currentTarget).data('inventory-id');
      await this.client.apiRequest(`/inventory/unfavorite`, 'POST', { inventory_id: inventoryId });
      // update the button to favorite
      $(e.currentTarget).replaceWith(`<button class="fishing-favorite-item" data-inventory-id="${inventoryId}">Favorite</button>`);
    });

    // sell item 
    $('.fishing-app', this.win.content).on('click', '.fishing-sell-item', async (e) => {
      const inventoryId = $(e.currentTarget).data('inventory-id');
      // '/api/fishing/sell/:item_id
      let result = await this.client.apiRequest(`/sell/${inventoryId}`, 'POST');
      console.log('Sell item result:', result);
      if (result.success) {
        // remove the item from the inventory list
        $(e.currentTarget).closest('.fishing-item').remove();
        // show a message
        let value = result.item.value || 0;
        $('.fishing-results', this.win.content).prepend(`<p>Sold item for ${value} coins.</p>`);

        if (result.value && result.value > 0) {
          console.log('Emitting reward event for sold item:', result);
              bp.emit('buddylist-websocket::reward', {
                success: true,
                message: {
                  newBalance: result.value, 
                },
                reward: result.reward,
              });

        }

      } else {

        console.log('Error selling item:', result);
        if (result.error) {
          $('.fishing-status', this.win.content).html(
            `<span style="color:red;">Error: ${result.error}</span>`
          );
          return;
        }

      }
    });

    // fishing-give-item
    $('.fishing-app', this.win.content).on('click', '.fishing-give-item', async (e) => {
      const inventoryId = $(e.currentTarget).data('inventory-id');
      let buddyname = prompt('Enter the buddyname of the player to give this item to:');
      if (buddyname) {
        let result = await this.client.apiRequest('/give', 'POST', { inventory_id: inventoryId, to_buddyname: buddyname });
        console.log('Give item result:', result);
        if (result.success) {
          // remove the item from the inventory list
          $(e.currentTarget).closest('.fishing-item').remove();
          // show a message
          $('.fishing-results', this.win.content).prepend(`<p>Gave item to ${buddyname}.</p>`);
        } else {
          alert(`Error giving item: ${result.error}`);
        }
      }
    });

    // fishing-equip-item
    $('.fishing-app', this.win.content).on('click', '.fishing-equip-item', async (e) => {
      const inventoryId = $(e.currentTarget).data('inventory-id');
      await this.equipItem(inventoryId);
      await this.loadEquipped();
      await this.loadItems();
    });
    // fishing-unequip-item
    $('.fishing-app', this.win.content).on('click', '.fishing-unequip-item', async (e) => {
      const inventoryId = $(e.currentTarget).data('inventory-id');
      await this.client.apiRequest(`/unequip`, 'POST', { inventory_id: inventoryId });
      await this.loadEquipped();
      await this.loadItems();
    });

  }

  async handleCast() {
    try {
      let result = await this.client.apiRequest('/cast', 'GET');
      console.log('Fishing cast result:', result);

      if (result.error) {
        $('.fishing-status', this.win.content).html(
          `<span style="color:red;">Error: ${result.error}</span>`
        );
        return;
      }

      let resultsDiv = $('.fishing-results', this.win.content).empty();
      let resultHtml = `<p>You caught a <strong>${result.name}</strong> (Rarity: ${result.rarity})</p>`;
      resultHtml += `<p>Value: ${result.value} coins</p>`;
      if (result.mutation) {
        resultHtml += `<p>Mutation occurred! You also caught a <strong>${result.mutation}</strong></p>`;
      }
      resultsDiv.prepend(resultHtml);

      if (typeof result.item_def === 'string') {
        result.item_def = JSON.parse(result.item_def);
      }

      if (result.item_def.type === 'fish') {
        let itemHtml = this.renderFishInventoryItem(result);
        $('.fishing-inventory-list', this.win.content).prepend(itemHtml);
        let formattedValue = this.totalValue.toLocaleString();
        $('.fishing-total-inventory-value', this.win.content).text(formattedValue);

      }
      if (result.item_def.type === 'fishing-item') {
        let itemHtml = this.renderFishItem(result);
        $('.fishing-items-list', this.win.content).prepend(itemHtml);
      }

    } catch (err) {
      console.error('Error during fishing cast:', err);
      $('.fishing-status', this.win.content).html(
        `<span style="color:red;">Error: ${err.message}</span>`
      );
    }
  }

  async handleSellAll() {
    let result = await this.client.apiRequest('/sell-all', 'POST');
    console.log('Sell all items result:', result);


    if (result.success) {
      let formattedValue = result.totalValue.toLocaleString();
      let resultsDiv = $('.fishing-results', this.win.content).empty();
      let resultHtml = `<p>Sold ${result.sold_count} items for a total of ${formattedValue} coins.</p>`;
      resultsDiv.prepend(resultHtml);

    }
    if (result.error) {
      $('.fishing-status', this.win.content).html(
        `<span style="color:red;">Error: ${result.error}</span>`
      );
      return;
    }

    await this.renderFishInventory();
    await this.loadItems();
  }
}
