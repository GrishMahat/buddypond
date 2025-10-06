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

    // get latest /api/fishing/settings player settings
    let playerSettings = await this.client.apiRequest('/settings', 'GET');
    console.log('Player fishing settings:', playerSettings);
    this.updatePlayerSettings(playerSettings.settings);
    this.bindPlayerSettings();
    await this.loadEquipped();
    await this.loadItems();
    await this.renderFishInventory();

    return this.win;
  }

  bindPlayerSettings() {
    $('#auto-sell-fish', this.win.content).on('change', async (e) => {
      let enabled = e.currentTarget.checked;
      console.log('Auto-sell changed:', enabled);
      await this.savePlayerSettings('auto_sell_enabled', enabled);
    });

    $('#auto-equip-items', this.win.content).on('change', async (e) => {
      let enabled = e.currentTarget.checked;
      console.log('Auto-equip changed:', enabled);
      await this.savePlayerSettings('auto_equip_enabled', enabled);
    });



  }

  savePlayerSettings(key, value) {
    console.log('Saving player setting:', key, value);
    return this.client.apiRequest('/settings', 'POST', { key, value });
  }

  updatePlayerSettings(settings) {
    if (settings.auto_sell_enabled == 'true' || settings.auto_sell_enabled === true) {
      $('#auto-sell-fish', this.win.content).prop('checked', settings.auto_sell_enabled);
    }
    if (settings.auto_equip_enabled == 'true' || settings.auto_equip_enabled === true) {
      $('#auto-equip-items', this.win.content).prop('checked', settings.auto_equip_enabled);
    }
  }

  /** Window config */
  window() {
    return {
      id: 'fishing',
      title: 'Fishing',
      icon: 'desktop/assets/images/icons/icon_fishing_64.webp',
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

    let img = '';
    let metadata = item.metadata;
    if (metadata && typeof metadata === 'string') {
      metadata = JSON.parse(metadata);
    }
    if (metadata.image) {
      img = `<img src="${metadata.image}" alt="${item.item_def.name}" style="max-width:100px; max-height:100px;"/><br/>`;
    }
    console.log('Rendering fish item:', item);
    return `<div class="fishing-item-items">
      <strong>${item.item_def.name}</strong><br/>
      Type: ${item.item_def.type}<br/>
      Rarity: ${item.item_def.rarity}<br/>
      Description: ${item.item_def.description}<br/>
      Durability: ${item.durability || 'N/A'}<br/>
      ${img}
      <div class="fishing-items-button-bar">
      <button class="fishing-equip-item" data-inventory-id="${item.id}">Equip</button>
      ${favoriteButton}
      <button class="fishing-give-item" disabled="DISABLED" data-inventory-id="${item.id}">Give</button>
      <button class="fishing-sell-item" data-inventory-id="${item.id}">Sell</button>
      </div>
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
    let metadata = item.metadata;
    if (metadata && typeof metadata === 'string') {
      metadata = JSON.parse(metadata);
    }
    item.value = metadata.value || item.value || 0;
    this.totalValue += item.value;
    let mutationStr = '';
    if (metadata.mutation) {
      mutationStr = `${metadata.mutation} <br/>`;
    }

    let img = ''; 
    if (metadata.image) {
      img = `<img class="fishing-item-image" src="${metadata.image}" alt="${item.item_def.name}"/>`;
    }


    //       Description: ${item.item_def.description}<br/>
    //       Age: ${caughtTime || 'N/A'}<br/>

    /*       Type: ${item.item_def.type}<br/> */
    return `<div class="fishing-item" title="Caught: ${caughtTime || 'N/A'} - Value: ${item.value} coins">
      <strong>${item.item_def.name}</strong>
      ${item.item_def.rarity}<br/>
      ${item.value.toLocaleString()} coins<br/>
      ${img}
      ${mutationStr}

      <div class="fishing-button-bar">
        <button class="fishing-sell-item" data-inventory-id="${item.id}">Sell</button>
        ${favoriteButton}
        <button class="fishing-give-item" disabled="DISABLED" data-inventory-id="${item.id}">Give</button>
      </div>
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

        let img = ''; 
        if (item.metadata && item.metadata.image) {
          img = `<img class="fishing-item-image" src="${item.metadata.image}" alt="${item.metadata.name}"/><br/>`;
        }

        // TODO: add back durability and charges display
        //          Type: ${item.metadata.key}<br/>

        equippedHtml += `<div class="fishing-item-equipped">
          <strong>${item.metadata.key}</strong><br/>
          ${item.metadata.rarity}<br/>
          Durability: ${item.item_durability}<br/>
          <em>${item.metadata.description}</em><br/>
          ${img}
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
        // format value
        value = value.toLocaleString();
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

    // fishing-item-image click to enlarge
    $('.fishing-app', this.win.content).on('click', '.fishing-item-image', async (e) => {
      const src = $(e.currentTarget).attr('src');
      // 🆕 Lightbox click
      this.bp.apps.ui.showLightBox(src);
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
        resultHtml += `<p>Mutation occurred! Your ${result.name} is <strong>${result.mutation}</strong></p>`;
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

      if (result.sold) {
        // item was auto-sold, we need to remove it from the inventory using a nice fade out effect
        $('.fishing-results', this.win.content).prepend(`<p>Auto-sold item for ${result.sold.value} coins.</p>`);
        // get the last item in the fishing-inventory-list and fade it out
        let lastItem = $('.fishing-inventory-list .fishing-item').first();
        lastItem.addClass('fishing-item-sold');
        // add a SOLD label to the item
        lastItem.prepend('<div class="fishing-item-sold"><h3>SOLD</h3></div>');
        lastItem.fadeOut(3000, function() {
          $(this).remove();
        });
        // update total value
        this.totalValue -= result.sold.value;
        let formattedValue = this.totalValue.toLocaleString();
        $('.fishing-total-inventory-value', this.win.content).text(formattedValue);
      }



    } catch (err) {
      console.error('Error during fishing cast:', err);
      $('.fishing-status', this.win.content).html(
        `<span style="color:red;">Error: ${err.message}</span>`
      );
    }

    await this.loadEquipped();
    await this.loadItems();


  }

  async handleSellAll() {
    let result = await this.client.apiRequest('/sell-all', 'POST');
    console.log('Sell all items result:', result);

    if (result.success) {
      let formattedValue = result.totalValue.toLocaleString();
      let resultsDiv = $('.fishing-results', this.win.content).empty();
      let resultHtml = `<p>Sold ${result.sold_count} items for a total of ${formattedValue} coins.</p>`;
      resultsDiv.prepend(resultHtml);


      if (result.totalValue && result.totalValue > 0) {
        console.log('Emitting reward event for sold item:', result);
            bp.emit('buddylist-websocket::reward', {
              success: true,
              message: {
                newBalance: result.totalValue, 
              },
              reward: result.reward,
            });

      }


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
