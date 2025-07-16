document.querySelector('form').addEventListener('submit', async function (e) {
  e.preventDefault();

  const items = [];

  document.querySelectorAll('tbody tr').forEach(row => {
    const qtyInput = row.querySelector('input[type="number"]');
    const labourCell = row.querySelector('.labourUniteRate');

    if (qtyInput && labourCell) {
      const quantity = parseFloat(qtyInput.value);
      const labourRate = parseFloat(labourCell.innerText.replace(/[^\d.]/g, ''));

      if (!isNaN(quantity) && !isNaN(labourRate) && quantity > 0) {
        items.push({
          quantity,
          labourUnitRate: labourRate
        });
      }
    }
  });

  if (items.length > 0) {
    try {
      const res = await fetch('/noc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });

      const result = await res.json();
      alert(result.message || 'Saved!');
    } catch (err) {
      alert('Error submitting form');
    }
  } else {
    alert('Please enter quantities');
  }
});
