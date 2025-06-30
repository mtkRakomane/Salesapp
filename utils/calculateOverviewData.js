const calculateBillingData = require('./calculateBillingData');
function calculateOverviewData(itemsResult, extraCosts = {}) {
  const billingData = calculateBillingData(itemsResult, extraCosts);
  const sum = (arr, key) => arr.reduce((acc, item) => acc + parseFloat(item[key] || 0), 0);
const bill_equipment_selling = sum(billingData, 'bill_equipment_selling');
  const bill_equipment_cost = sum(billingData, 'bill_equipment_cost');
  const bill_labourSell = sum(billingData, 'bill_labourSell');
  const bill_labourCost = sum(billingData, 'bill_labourCost');
  const pm_cost = sum(billingData, 'pm_cost');
  const pm_selling = sum(billingData, 'pm_selling');
  const sundries_cost = sum(billingData, 'sundries_cost');
  const sundries_selling = sum(billingData, 'sundries_selling');
  const totalLabourHours = sum(billingData, 'totalLabourHours');
  const totalSellProject = bill_equipment_selling + bill_labourSell + pm_selling + sundries_selling;
  const totalCostProject = bill_equipment_cost + bill_labourCost + pm_cost + sundries_cost;
   const grossProfit = totalSellProject - totalCostProject;
  const totalGrossMargin = totalSellProject - totalCostProject;
  const actualGrossMargin = totalSellProject === 0
    ? 0
    : ((totalGrossMargin / totalSellProject) * 100).toFixed(2);
  const gm = (selling, cost) =>
    selling === 0 ? 0 : (((selling - cost) / selling) * 100).toFixed(2);
  const p = (part, total) =>
    total === 0 ? 0 : ((part / total) * 100).toFixed(2);
  const vat = (totalSellProject * 0.15);
  const totalVatSell = totalSellProject + vat;
  return {
    bill_equipment_cost: bill_equipment_cost.toFixed(2),
    bill_equipment_selling: bill_equipment_selling.toFixed(2),
    bill_labourCost: bill_labourCost.toFixed(2),
    bill_labourSell: bill_labourSell.toFixed(2),
    pm_cost: pm_cost.toFixed(2),
    pm_selling: pm_selling.toFixed(2),
    sundries_cost: sundries_cost.toFixed(2),
    sundries_selling: sundries_selling.toFixed(2),
    totalSellProject: totalSellProject.toFixed(2),
    totalCostProject: totalCostProject.toFixed(2),
    totalGrossMargin: totalGrossMargin.toFixed(2),
    grossProfit: grossProfit.toFixed(2),
    actualGrossMargin,
    gmEquip: gm(bill_equipment_selling, bill_equipment_cost),
    gmLabour: gm(bill_labourSell, bill_labourCost),
    gmPm: gm(pm_selling, pm_cost),
    gmSundries: gm(sundries_selling, sundries_cost),
    pEquipment: p(bill_equipment_selling, totalSellProject),
    pLabour: p(bill_labourSell, totalSellProject),
    pProjectM: p(pm_selling, totalSellProject),
    pSundries: p(sundries_selling, totalSellProject),
    totalTax: vat.toFixed(2),
    totalVatSell: totalVatSell.toFixed(2),
    totalLabourHours: totalLabourHours.toFixed(2),
    projectDays: (totalLabourHours / 8).toFixed(2),
    projectWeeks: (totalLabourHours / 40).toFixed(2)
  };
}
module.exports = calculateOverviewData;
