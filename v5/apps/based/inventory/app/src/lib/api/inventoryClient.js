// Inventory API Client
class InventoryClient {
  constructor() {
    // Default endpoint - can be configured via environment or global
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
      // Try to get from window.buddypond if available
      if (typeof window !== 'undefined' && window.buddypond?.inventoryEndpoint) {
        this.endpoint = window.buddypond.inventoryEndpoint;
        this.buddyname = window.buddypond.me;
        this.token = window.buddypond.qtokenid;
      } else {
        throw new Error('Inventory endpoint not configured');
      }
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

  async getAll(buddyname) {
    return this.apiRequest(`/all/${buddyname || this.buddyname}`, 'GET');
  }

  async addItem(itemData) {
    return this.apiRequest('/add', 'POST', itemData);
  }

  async removeItem(itemId) {
    return this.apiRequest(`/remove/${itemId}`, 'DELETE');
  }

  async updateItem(itemId, itemData) {
    return this.apiRequest(`/update/${itemId}`, 'PUT', itemData);
  }

  async trade(itemId, quantity, targetBuddyname) {
    return this.apiRequest('/trade', 'POST', {
      itemId,
      quantity,
      to: targetBuddyname
    });
  }
}

export const inventoryClient = new InventoryClient();
export default inventoryClient;

