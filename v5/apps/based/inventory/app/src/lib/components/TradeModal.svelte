<script>
  let { isOpen = $bindable(false), item, onConfirm } = $props();

  let targetPlayer = $state('');
  let quantity = $state(1);

  function handleCancel() {
    isOpen = false;
    targetPlayer = '';
    quantity = 1;
  }

  function handleConfirm() {
    if (onConfirm) {
      onConfirm({ targetPlayer, quantity });
    }
    handleCancel();
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      handleCancel();
    }
  }

  const itemDef = $derived(
    item && typeof item.item_def === 'string' 
      ? JSON.parse(item.item_def) 
      : item?.item_def || {}
  );
</script>

{#if isOpen}
  <div class="modal" onclick={handleBackdropClick}>
    <div class="box">
      <div class="modal-title">Trade Item</div>
      <div class="muted" id="tradeItemTitle">{itemDef.name || '—'}</div>
      
      <div class="form-row">
        <input 
          type="text" 
          bind:value={targetPlayer}
          placeholder="Player name or ID" 
        />
        <input 
          type="number" 
          bind:value={quantity}
          min="1" 
          placeholder="Qty" 
        />
      </div>
      
      <div class="modal-actions">
        <button class="btn ghost" onclick={handleCancel}>Cancel</button>
        <button class="btn" onclick={handleConfirm}>Send</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.6);
    z-index: 60;
    animation: fadeIn 0.15s ease;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .box {
    width: 420px;
    max-width: 90vw;
    background: var(--panel, #1b1f2e);
    padding: 18px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.03);
    animation: slideUp 0.2s ease;
  }

  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .modal-title {
    font-weight: 700;
    font-size: 16px;
    margin-bottom: 8px;
  }

  .muted {
    color: var(--muted, #9aa0b3);
    font-size: 13px;
    margin-bottom: 16px;
  }

  .form-row {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
  }

  input[type="text"],
  input[type="number"] {
    flex: 1;
    padding: 8px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.3);
    color: inherit;
    font-size: 14px;
  }

  input[type="number"] {
    max-width: 100px;
  }

  .modal-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }

  .btn {
    padding: 8px 16px;
    border-radius: 8px;
    border: 0;
    background: linear-gradient(180deg, #2a7a4b, #1b4f33);
    color: white;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s ease;
  }

  .btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(42, 122, 75, 0.4);
  }

  .btn.ghost {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: var(--muted, #9aa0b3);
  }

  .btn.ghost:hover {
    background: rgba(255, 255, 255, 0.05);
    box-shadow: none;
  }
</style>

