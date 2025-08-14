const calculateBillingData = require('./calculateBillingData');
const calculateItemData = require('./calculateItemData');
function calculatePrintData(items, labour_rate = 400, pm_rate = 0.15, equip_sundries = 0.03) {
  const enrichedItems = items.map(item => calculateItemData(item, labour_rate));
  const billing = calculateBillingData(enrichedItems, {}, labour_rate, pm_rate, equip_sundries);
  const bills = billing.map(b => {
      const subtotal = parseFloat(b.bill_labourSell || 0)
                 + parseFloat(b.bill_equipment_selling || 0)
                 + parseFloat(b.pm_selling || 0)
                 + parseFloat(b.sundries_selling || 0);
   return {
    bill: b.bill,
    items: b.items,
    subtotal: subtotal.toFixed(2),
    totalLabourHours: b.totalLabourHours,
    extras: {
      Sundries: parseFloat(b.sundries_selling || 0).toFixed(2),
      Project_Management: parseFloat(b.pm_selling || 0).toFixed(2),
      Installation_Engineering: parseFloat(b.bill_labourSell || 0).toFixed(2)
    }
  };
});

const totalExcludingVAT = bills.reduce((sum, b) => sum + parseFloat(b.subtotal), 0);
  const vat = totalExcludingVAT * 0.15;
  const totalIncludingVAT = totalExcludingVAT + vat;
  return {
    bills,
    totalExcludingVAT: totalExcludingVAT.toFixed(2),
    vat: vat.toFixed(2),
    totalIncludingVAT: totalIncludingVAT.toFixed(2)
  };
}
module.exports = calculatePrintData;