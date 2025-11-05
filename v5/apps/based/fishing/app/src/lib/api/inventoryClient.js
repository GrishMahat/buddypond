// Inventory API Client (for transferring items)
class InventoryClient {
  constructor() {
    this.endpoint = null;
    this.buddyname = null;
    this.token = null;
  }

  configure({ endpoint, buddyname, token }) {
    if (endpoint) this.endpoint = endpoint;
    if (buddyname) this.buddyname = buddyname;
    if (token) this.token = token;
  }

  async apiRequest(uri, method = 'GET', data = null) {
    if (!this.endpoint) {
      throw new Error('Inventory endpoint not configured');
    }

    const options = {
      method: method,
    };

    let headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json; charset=utf-8',
      'X-Me': this.buddyname || 'unknown'
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (data) {
      options.body = JSON.stringify(data);
    }

    options.headers = headers;

    const url = `${this.endpoint}${uri}`;
    console.log('inventoryClient making api request', url, options);

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        console.error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error in API request:', error);
      throw error;
    }
  }

  async transfer(item_id, to_player_id, quantity = 1, broadcast = true) {
    return this.apiRequest('/transfer', 'POST', { 
      item_id, 
      to_player_id, 
      quantity, 
      broadcast 
    });
  }
}

export const inventoryClient = new InventoryClient();
export default inventoryClient;
