const calculateBillingData = require('./calculateBillingData');
const calculateItemData = require('./calculateItemData');
function calculatePrintData(items, labour_rate = 400, pm_rate = 0.15, equip_sundries = 0.03) {
  const enrichedItems = items.map(item => calculateItemData(item, labour_rate));
  const billing = calculateBillingData(enrichedItems, {}, labour_rate, pm_rate, equip_sundries);
  const bills = billing.map(b => {
    return {
      bill: b.bill,
      items: b.items,
      subtotal: parseFloat(b.bill_tot_selling).toFixed(2),
      totalLabourHours: b.totalLabourHours,
      extras: {
        Sundries: b.sundries_selling,
        Project_Management: b.pm_selling,
        Installation_Engineering: b.bill_labourSell
      }
    };
  });
  const totalExcludingVAT = billing.reduce((sum, b) => sum + parseFloat(b.bill_tot_selling), 0);
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