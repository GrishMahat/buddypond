// Fishing API Client
class FishingClient {
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
      throw new Error('Fishing endpoint not configured');
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
    console.log('fishingClient making api request', url, options);

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

  // Fishing-specific methods
  async cast() {
    return this.apiRequest('/cast', 'GET');
  }

  async regen() {
    return this.apiRequest('/regen', 'GET');
  }

  async getSettings() {
    return this.apiRequest('/settings', 'GET');
  }

  async saveSettings(key, value) {
    return this.apiRequest('/settings', 'POST', { key, value });
  }

  async getInventory() {
    return this.apiRequest('/inventory', 'GET');
  }

  async getEquipped() {
    return this.apiRequest('/equipped', 'GET');
  }

  async getItems() {
    return this.apiRequest('/items', 'GET');
  }

  async equipItem(inventory_id) {
    return this.apiRequest('/equip', 'POST', { inventory_id });
  }

  async unequipItem(inventory_id) {
    return this.apiRequest('/unequip', 'POST', { inventory_id });
  }

  async sellItem(item_id) {
    return this.apiRequest(`/sell/${item_id}`, 'POST');
  }

  async sellAll() {
    return this.apiRequest('/sell-all', 'POST');
  }

  async favoriteItem(inventory_id) {
    return this.apiRequest('/inventory/favorite', 'POST', { inventory_id });
  }

  async unfavoriteItem(inventory_id) {
    return this.apiRequest('/inventory/unfavorite', 'POST', { inventory_id });
  }
}

export const fishingClient = new FishingClient();
export default fishingClient;

