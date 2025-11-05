<script>
  import { stamina, playerSettings } from '$lib/stores/fishingStore';
  
  let { onSettingChange } = $props();

  function handleAutoSellChange(e) {
    const enabled = e.target.checked;
    if (onSettingChange) {
      onSettingChange('auto_sell_enabled', enabled);
    }
  }

  function handleAutoEquipChange(e) {
    const enabled = e.target.checked;
    if (onSettingChange) {
      onSettingChange('auto_equip_enabled', enabled);
    }
  }
</script>

<div class="fishing-settings">
  <h2>Player</h2>
  
  <div class="fishing-stamina">
    Stamina: <span class="fishing-stamina-value">{$stamina.current}</span>/<span class="fishing-stamina-max">{$stamina.max}</span>
  </div>
  
  <div class="setting-row">
    <label for="auto-sell-fish">Auto-Sell Caught Fish:</label>
    <input 
      type="checkbox" 
      id="auto-sell-fish" 
      name="auto-sell-fish"
      checked={$playerSettings.auto_sell_enabled}
      onchange={handleAutoSellChange}
    />
  </div>
  
  <div class="setting-row">
    <label for="auto-equip-items">Auto-Equip Items:</label>
    <input 
      type="checkbox" 
      id="auto-equip-items" 
      name="auto-equip-items"
      checked={$playerSettings.auto_equip_enabled}
      onchange={handleAutoEquipChange}
    />
  </div>
</div>

<style>
  .fishing-settings {
    border-radius: 12px;
    padding: 12px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.15);
    margin-bottom: 15px;
  }

  .fishing-settings h2 {
    font-size: 1.2em;
    margin-bottom: 8px;
    border-bottom: 1px solid #ddd;
    padding-bottom: 4px;
  }

  .fishing-stamina {
    font-size: 14px;
    font-weight: bold;
    margin-bottom: 12px;
    padding: 8px;
    background: rgba(76, 175, 80, 0.1);
    border-radius: 4px;
  }

  .setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
    padding: 4px 0;
  }

  .setting-row label {
    font-size: 13px;
    flex: 1;
  }

  .setting-row input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
</style>

