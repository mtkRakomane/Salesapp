  const salePersonSelect = document.getElementById('name');
    const saleCellInput = document.getElementById('cell');
    const saleEmailInput = document.getElementById('email');
    const saleRoleInput = document.getElementById('role');
    salePersonSelect.addEventListener('change', function () {
      const selectedOption = salePersonSelect.options[salePersonSelect.selectedIndex];
      saleCellInput.value = selectedOption.getAttribute('data-cell');
      saleEmailInput.value = selectedOption.getAttribute('data-email');
      saleRoleInput.value = selectedOption.getAttribute('data-role');
    });
 