export class BPYouTubeSubscriber extends HTMLElement {
  static get observedAttributes() {
    return ['subscribed', 'endpoint'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.state = {
      subscribed: undefined,
      loading: false,
      endpoint: null,
    };

    this.state.endpoint = 'http://localhost/oauth-complete.html' // default for local dev

    window.addEventListener('message', (event) => {
      if (event.data?.type === 'youtube-oauth-complete') {
        const { subscribed } = event.data
        // update your UI or re-check status
        document.querySelector('bp-youtube-subscriber')?.setAttribute('subscribed', subscribed)
      }
    })

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
          cursor: pointer;
          font-family: sans-serif;
        }

        button {
          all: unset;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #ff0000;
          color: white;
          padding: 6px 12px;
          border-radius: 6px;
          font-weight: bold;
          transition: background 0.3s, transform 0.2s;
        }

        button:hover {
          background: #e60000;
          transform: scale(1.05);
        }

        button[disabled] {
          opacity: 0.6;
          pointer-events: none;
        }

        .icon {
          width: 18px;
          height: 18px;
          background: white;
          mask: url('https://www.svgrepo.com/show/13693/youtube.svg') no-repeat center;
          mask-size: contain;
        }

        .subscribed {
          background: #333;
        }

        .subscribed:hover {
          background: #333;
          transform: none;
        }

        .subscribed .icon {
          background: #ff0000;
        }
      </style>
      <button id="btn">
        <div class="icon"></div>
        <span id="label">Subscribe</span>
      </button>
    `;

    this.$btn = this.shadowRoot.querySelector('#btn');
    this.$label = this.shadowRoot.querySelector('#label');

    this.$btn.addEventListener('click', () => this.handleClick());
  }

  attributeChangedCallback(name, oldVal, newVal) {
    if (name === 'subscribed') {
      if (newVal === 'true') this.setState({ subscribed: true });
      else if (newVal === 'false') this.setState({ subscribed: false });
      else this.setState({ subscribed: undefined });
    }
    if (name === 'endpoint') {
      this.setState({ endpoint: newVal });
    }
  }

  connectedCallback() {
    // Try to auto-fetch state if endpoint is set and state is undefined
    if (this.state.endpoint && this.state.subscribed === undefined) {
      this.checkSubscription();
    }
  }

  async checkSubscription() {
    if (!this.state.endpoint) return;
    this.setState({ loading: true });

    try {
      const res = await fetch(this.state.endpoint, { credentials: 'include' });
      const data = await res.json();
      this.setState({ subscribed: !!data.subscribed });
    } catch (err) {
      console.warn('bp-youtube-subscriber: check failed', err);
    } finally {
      this.setState({ loading: false });
    }
  }

  async handleClick() {
    if (this.state.subscribed) return;

    const popup = window.open(
      `${this.state.endpoint}?action=connect&return_to=/oauth-complete`,
      'youtube-oauth',
      'width=500,height=600'
    );

    // Wait for message from popup
    const onMsg = (event) => {
      if (event.data?.type === 'youtube-oauth-complete') {
        this.setState({ subscribed: !!event.data.subscribed });
        window.removeEventListener('message', onMsg);
      }
    };
    window.addEventListener('message', onMsg);
  }

  setState(partial) {
    this.state = { ...this.state, ...partial };
    this.render();
  }

  render() {
    const { subscribed, loading } = this.state;

    if (loading) {
      this.$label.textContent = 'Checking...';
      this.$btn.disabled = true;
      this.$btn.classList.remove('subscribed');
      return;
    }

    this.$btn.disabled = false;

    if (subscribed) {
      this.$label.textContent = 'Subscribed';
      this.$btn.classList.add('subscribed');
    } else {
      this.$label.textContent = 'Subscribe';
      this.$btn.classList.remove('subscribed');
    }
  }

}

customElements.define('bp-youtube-subscriber', BPYouTubeSubscriber);

