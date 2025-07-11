// public/js/nocCalculation.js

document.addEventListener('DOMContentLoaded', () => {
  const qtyInputs = document.querySelectorAll('.qty');

  qtyInputs.forEach(input => {
    input.addEventListener('input', () => {
      const index = input.dataset.index;
      const qty = parseFloat(input.value) || 0;
      const labourCell = document.querySelector(`.labour[data-index="${index}"]`);
      const equipmentCell = document.querySelector(`.equipment[data-index="${index}"]`);

      const labourRate = parseFloat(labourCell.textContent.replace(/[^\d.]/g, '')) || 0;
      const total = qty * labourRate;

      equipmentCell.textContent = `R ${total.toFixed(2)}`;
    });
  });
});
