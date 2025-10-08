import inventoryClient from '../inventory/lib/inventoryClient.js';

export default class Crafting {
  // constructor is required, it is called when the app is loaded
  constructor(bp, options = {}) {
    this.bp = bp;
    this.options = options;
    return this;
  }

  // init is required, it is called when the app is opened or initialized
  async init() {
    this.html = await this.bp.load('/v5/apps/based/crafting/crafting.html');
    await this.bp.load('/v5/apps/based/crafting/crafting.css');
    this.inventoryClient = inventoryClient;

    return 'loaded Hello World';
  }

  async open(options = {}) {
    if (!this.win) {
      this.win = await this.bp.window(this.window());
      // Remark: You can add event bindings here

      $('.save-item-def', this.win.content).on('click', async (e) => {
        // save the item def
        // reload the page
        // Remark: If we update an itemDef, we'd have to iterate all inventory for all players to update
        // their existing inventory?
        // first version can just update itemDef, not globablly
        let updateJSONString = $('.crafting-item-def-editor', this.win.content).val();
        let update = JSON.parse(updateJSONString);

        try {
          let updateResponse = await this.updateItemDef(update.key, update);
          console.log('updateResponse', updateResponse);
          if (updateResponse.error) {
            throw new Error(updateResponse.error);
          }
        } catch (error) {
          alert('Error updating item definition: ' + error.message);
          return;
        }
        this.bp.open('crafting')
      });

      $('.cancel-save-item-def', this.win.content).on('click', async (e) => {
        // save the item def
        // reload the page
        this.bp.open('crafting')
      });


      $('.craft-item', this.win.content).on('click', async (e) => {
        let selectedKey = $select.val();
        let targetBuddy = $('.crafting-target-buddy', this.win.content).val();
        console.log('Craft item clicked', selectedKey);

        if (!selectedKey) {
          alert('Please select an item to craft');
          return;
        }
        if (!targetBuddy) {
          alert('Please enter a buddy username to send the crafted item to');
          return;
        }
        let craftingResult = await this.inventoryClient.apiRequest('/craft', 'POST', { key: selectedKey, quantity: 1, targetBuddy }, this.bp);
        console.log('Crafting result', craftingResult);
        if (craftingResult.error) {
          alert('Error crafting item: ' + craftingResult.error);
        } else {
          alert(`Successfully crafted ${craftingResult.quantity} x ${craftingResult.name} and sent to ${targetBuddy}`);
        }
        /*
        let result = await this.inventoryClient.apiRequest('/craft', 'POST', { uuid: selectedUuid, quantity: 1 }, this.bp);
        console.log('Craft result', result);
        if (result.error) {
          alert('Error crafting item: ' + result.error);
        } else {
          alert(`Successfully crafted ${result.quantity} x ${result.name}`);
        }
        */
      });



    }

    if (options.context && options.context !== 'default') {
      //      alert(`Opened crafting app with context: ${options.context}`);
      $('.crafting-item-def-editor-container', this.win.content).show();
      $('.crafting-item-defs-table', this.win.content).hide();

      // fetch the item def
      let itemDef = await this.inventoryClient.apiRequest(`/defs/${options.context}`, 'GET', null, this.bp);
      console.log('itemDef', itemDef);
      if (itemDef.error) {
        alert('Error fetching item definition: ' + itemDef.error);
        return;
      }
      itemDef.metadata = JSON.parse(itemDef.metadata || '{}');
      itemDef.base_attributes = JSON.parse(itemDef.base_attributes || '{}');
      itemDef.tags = JSON.parse(itemDef.tags || '[]');
      //$('.crafting-item-def-key', this.win.content).val(itemDef.key);
      //$('.crafting-item-def-name', this.win.content).val(itemDef.name);
      //$('.crafting-item-def-type', this.win.content).val(itemDef.type);
      console.log('writing item def', JSON.stringify(itemDef, null, 2));
      $('.crafting-item-def-editor', this.win.content).html(JSON.stringify(itemDef, null, 2));
      return;
    }
    $('.crafting-item-defs-table', this.win.content).show();
    $('.crafting-item-def-editor-container', this.win.content).hide();

    // fetch all item definitions
    let itemDefs = await this.inventoryClient.apiRequest('/defs', 'GET', null, this.bp);
    console.log('itemDefs', itemDefs);
    let $select = $('.crafting-item-defs', this.win.content);
    let $itemDefTable = $('.crafting-item-defs-table tbody', this.win.content);

    $select.empty();
    $itemDefTable.empty();
    itemDefs.forEach(itemDef => {
      let option = document.createElement('option');
      option.value = itemDef.key;
      option.textContent = `${itemDef.name} (${itemDef.type}, ${itemDef.rarity})`;
      $select.append(option);
      $itemDefTable.append(`
        <tr>
          <td>${itemDef.key}</td>
          <td>${itemDef.name}</td>
          <td>${itemDef.type}</td>
          <td>${itemDef.rarity}</td>
          <td>${itemDef.description || ''}</td>
          <td><button class="open-app" data-app="crafting" data-context=${itemDef.key}>Edit</button></td>
        </tr>
      `);
    });

    makeTableSortable('.crafting-item-defs-table');

    return this.win;
  }

  window() {

    return {
      id: 'crafting',
      title: 'Crafting Table',
      icon: 'desktop/assets/images/icons/icon_crafting_64.webp',
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


}

// TODO: move this into a generic `<bp-table>` web component
// TODO: multi-sort columns with click
function makeTableSortable(tableSelector) {
  const $table = $(tableSelector);

  $table.find('th').each(function (colIndex) {
    $(this).css('cursor', 'pointer').on('click', function () {
      const $tbody = $table.find('tbody');
      const rows = $tbody.find('tr').get();
      const ascending = !$(this).data('asc'); // toggle direction

      // Remove sort arrows from other headers
      $table.find('th').not(this).data('asc', null).removeClass('sort-asc sort-desc');

      // Sort rows based on text content
      rows.sort((a, b) => {
        const aText = $(a).children('td').eq(colIndex).text().trim().toLowerCase();
        const bText = $(b).children('td').eq(colIndex).text().trim().toLowerCase();

        const aNum = parseFloat(aText);
        const bNum = parseFloat(bText);
        const bothNumeric = !isNaN(aNum) && !isNaN(bNum);

        if (bothNumeric) {
          return ascending ? aNum - bNum : bNum - aNum;
        }
        return ascending ? aText.localeCompare(bText) : bText.localeCompare(aText);
      });

      // Reinsert sorted rows
      $.each(rows, (_, row) => $tbody.append(row));

      // Toggle and mark sorted column
      $(this).data('asc', ascending).toggleClass('sort-asc', ascending).toggleClass('sort-desc', !ascending);
    });
  });
}


Crafting.prototype.updateItemDef = async function (item_key, update) {
  console.log('Updating item def', item_key, update);
  let _update = {
    metadata: update.metadata
  };
  console.log('Updating item def', item_key, _update);
  let updateResponse = await this.inventoryClient.apiRequest(`/defs/${item_key}`, 'PATCH', _update)
  return updateResponse;

}