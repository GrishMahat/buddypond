// imageClient.js
export default class ImageGenClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl.replace(/\/+$/, ""); // remove trailing slash
  }

  /**
   * Generate an image or return cached
   * @param {Object} options
   * @param {string} options.key - unique item id (e.g. "iron_sword_01")
   * @param {string} options.description - text prompt
   * @param {number} [options.width=512]
   * @param {number} [options.height=512]
   * @param {string} [options.model="fal-ai/qwen-image"]
   * @param {boolean} [options.force=false]
   * @param {string} [options.version="v1"]
   * @param {number|null} [options.seed]
   * @param {Object} [options.metadata]
   * @returns {Promise<Object>} response JSON with { status, url, filename, ... }
   */
  async generate(options) {
    const res = await fetch(`${this.baseUrl}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Generate failed: ${res.status} ${text}`);
    }
    return res.json();
  }

  /**
   * Get a cached image URL
   * (note: this just returns the URL, doesn't fetch the bytes)
   * @param {string} filename
   * @returns {string}
   */
  getImageUrl(filename) {
    return `${this.baseUrl}/image/${encodeURIComponent(filename)}`;
  }

  /**
   * Fetch metadata JSON
   * @param {string} filename
   * @returns {Promise<Object>}
   */
  async getMeta(filename) {
    const res = await fetch(`${this.baseUrl}/meta/${encodeURIComponent(filename)}`);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Meta fetch failed: ${res.status} ${text}`);
    }
    return res.json();
  }
}
