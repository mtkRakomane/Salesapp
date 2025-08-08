const salePersonSelect = document.getElementById('name');
const saleCellInput = document.getElementById('cell');
const saleEmailInput = document.getElementById('email');
const saleRoleInput = document.getElementById('role');
salePersonSelect.addEventListener('change', function () {
  const selectedOption = salePersonSelect.options[salePersonSelect.selectedIndex];
  saleCellInput.value = selectedOption.dataset.cell;
  saleEmailInput.value = selectedOption.dataset.email;
  saleRoleInput.value = selectedOption.dataset.role;
});
const ebmCameraSelect = document.getElementById('cameras');
const ratePerCameraInput = document.getElementById('rate_per_camera');
const linkFeeInput = document.getElementById('linkup_fee');
ebmCameraSelect.addEventListener('change', function () {
  const selectedOption = ebmCameraSelect.options[ebmCameraSelect.selectedIndex];
  const rate = selectedOption.dataset.rate_per_camera || 0;
  const linkFee = selectedOption.dataset.linkup_fee || 0;
  ratePerCameraInput.value = `R ${parseFloat(rate).toFixed(2)}`;
  linkFeeInput.value = `R ${parseFloat(linkFee).toFixed(2)}`;
});
