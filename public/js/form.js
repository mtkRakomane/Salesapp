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
const ratePerCameraInput = document.getElementById('cctvOffEventMonitorLabour');
const linkFeeInput = document.getElementById('cctvOffEventMonitorEquip');

if (ebmCameraSelect) {
  ebmCameraSelect.addEventListener('change', function () {
    const selectedOption = ebmCameraSelect.options[ebmCameraSelect.selectedIndex];
    if (!selectedOption.value) {
      ratePerCameraInput.value = '';
      linkFeeInput.value = '';
      return;
    }
    const rate = parseFloat(selectedOption.dataset.labour) || 0;
    const linkFee = parseFloat(selectedOption.dataset.equip) || 0;
    ratePerCameraInput.value = `R ${rate.toFixed(2)}`;
    linkFeeInput.value = `R ${linkFee.toFixed(2)}`;
  });
}
const scarfaceRateSelect = document.getElementById('noScarfaceCamera');
const monthlyRateInput = document.getElementById('scarfaceLiveSystemLabour');
const monthlyEquipInput = document.getElementById('scarfaceLiveSystemEquip');
if (scarfaceRateSelect) {
  scarfaceRateSelect.addEventListener('change', function () {
    const selectedOption = scarfaceRateSelect.options[scarfaceRateSelect.selectedIndex];
    if (!selectedOption.value) {
      monthlyRateInput.value = '';
      monthlyEquipInput.value = '';
      return;
    }
    const monthRate = parseFloat(selectedOption.dataset.labour) || 0;
    const monthEquip = parseFloat(selectedOption.dataset.equip) || 0;
    monthlyRateInput.value = `R ${monthRate.toFixed(2)}`;
    monthlyEquipInput.value = `R ${monthEquip.toFixed(2)}`;
  });
}


