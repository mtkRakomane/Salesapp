const salePersonSelect = document.getElementById('name');
const saleCellInput = document.getElementById('cell');
const saleEmailInput = document.getElementById('email');
const saleRoleInput = document.getElementById('role');
if (salePersonSelect) {
  salePersonSelect.addEventListener('change', function () {
    const selectedOption = salePersonSelect.options[salePersonSelect.selectedIndex];
    saleCellInput.value = selectedOption.dataset.cell || '';
    saleEmailInput.value = selectedOption.dataset.email || '';
    saleRoleInput.value = selectedOption.dataset.role || '';
  });
}
const ebmCameraSelect = document.getElementById('cameras');
const ebmLabourDisplay = document.getElementById('cctvOffEventMonitorLabourDisplay');
const ebmEquipDisplay = document.getElementById('cctvOffEventMonitorEquipDisplay');
const ebmLabourHidden = document.getElementById('cctvOffEventMonitorLabour');
const ebmEquipHidden = document.getElementById('cctvOffEventMonitorEquip');
if (ebmCameraSelect) {
  ebmCameraSelect.addEventListener('change', function () {
    const selectedOption = ebmCameraSelect.options[ebmCameraSelect.selectedIndex];
    if (!selectedOption.value) {
      ebmLabourDisplay.value = '';
      ebmEquipDisplay.value = '';
      ebmLabourHidden.value = '';
      ebmEquipHidden.value = '';
      return;
    }
    const rate = parseFloat(selectedOption.dataset.labour) || 0;
    const equip = parseFloat(selectedOption.dataset.equip) || 0;
    ebmLabourDisplay.value = `R ${rate.toFixed(2)}`;
    ebmEquipDisplay.value = `R ${equip.toFixed(2)}`;
    ebmLabourHidden.value = rate;
    ebmEquipHidden.value = equip;
  });
}
const scarfaceSelect = document.getElementById('noScarfaceCamera');
const scarfaceLabourDisplay = document.getElementById('scarfaceLiveSystemLabourDisplay');
const scarfaceEquipDisplay = document.getElementById('scarfaceLiveSystemEquipDisplay');
const scarfaceLabourHidden = document.getElementById('scarfaceLiveSystemLabour');
const scarfaceEquipHidden = document.getElementById('scarfaceLiveSystemEquip');
if (scarfaceSelect) {
  scarfaceSelect.addEventListener('change', function () {
    const selectedOption = scarfaceSelect.options[scarfaceSelect.selectedIndex];
    if (!selectedOption.value) {
      scarfaceLabourDisplay.value = '';
      scarfaceEquipDisplay.value = '';
      scarfaceLabourHidden.value = '';
      scarfaceEquipHidden.value = '';
      return;
    }
    const rate = parseFloat(selectedOption.dataset.labour) || 0;
    const equip = parseFloat(selectedOption.dataset.equip) || 0;
    scarfaceLabourDisplay.value = `R ${rate.toFixed(2)}`;
    scarfaceEquipDisplay.value = `R ${equip.toFixed(2)}`;
    scarfaceLabourHidden.value = rate;
    scarfaceEquipHidden.value = equip;
  });
}
