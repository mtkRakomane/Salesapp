function calculateBillingData(
  items,
  extraCosts = {},
  labourRate = 400,
  pmRate = 0.15,
  unitEquipSundries = 0.03,
  equipTotMargin = 0.15,
  constLabMargin = 0.25
) {
  const bills = items.reduce((acc, item) => {
    const bill = item.bill || 'Unknown Bill';
    if (!acc[bill]) acc[bill] = [];
    acc[bill].push(item);
    return acc;
  }, {});
  const billsData = Object.keys(bills).map(billName => {
    const billItems = bills[billName].map(item => {
      const qty = parseFloat(item.qty) || 0;
      const unitCost = parseFloat(item.unit_cost) || 0;
      const labourFactorHrs = parseFloat(item.labour_factor_hrs) || 0;
      const installDiffFactor = parseFloat(item.install_diff_factor) || 1;
      const maintLabFactor = parseFloat(item.maint_lab_factor) || 0;
      const labourMargin = (parseFloat(item.labour_margin) / 100) || 0;
      const equipmentMargin = (parseFloat(item.equipment_margin) / 100) || 0;
      const equipmentCost = unitCost * qty;
      const equipmentSelling = (1 - equipmentMargin) !== 0
        ? (unitCost / (1 - equipmentMargin)) * qty
        : 0;
      const sellRate = (1 - labourMargin) !== 0 ? labourRate / (1 - labourMargin) : 0;
      const unitLabRate = sellRate * labourFactorHrs * installDiffFactor;
      const totalLabour = unitLabRate * qty;
      const hwReplaceProv = maintLabFactor > 0 ? equipmentSelling : 0;
      return {
        ...item,
        equipment_margin: equipmentMargin,
        labour_margin: labourMargin,
        total_price: (unitCost * qty).toFixed(2),
        equipment_cost: equipmentCost.toFixed(2),
        equipment_selling: equipmentSelling.toFixed(2),
        total_labour: totalLabour.toFixed(2),
        unitLabRate: unitLabRate.toFixed(2),
        hwReplaceProv: hwReplaceProv.toFixed(2),
        maint_lab_factor: maintLabFactor
      };
    });
    const bill_equipment_cost = billItems.reduce((sum, i) => sum + parseFloat(i.equipment_cost), 0);
    const bill_equipment_selling = billItems.reduce((sum, i) => sum + parseFloat(i.equipment_selling), 0);
    const subtotal = billItems.reduce((sum, i) => sum + (parseFloat(i.unit_cost || 0) * parseFloat(i.qty || 0)), 0)
      + (extraCosts.Sundries_and_Consumables || 0)
      + (extraCosts.Project_Management || 0)
      + (extraCosts.Installation_Commissioning_Engineering || 0);
    const totalLabourHours = billItems.reduce((sum, i) =>
      sum + (parseFloat(i.labour_factor_hrs || 0) * parseFloat(i.qty || 0)), 0);
    const bill_labourCost = billItems.reduce((sum, i) =>
      sum + ((parseFloat(i.labour_factor_hrs) || 0) * labourRate * (parseFloat(i.qty) || 0)), 0);
    const bill_labourSell = billItems.reduce((sum, i) => {
      const hrs = parseFloat(i.labour_factor_hrs || 0);
      const qty = parseFloat(i.qty || 0);
      const labourMargin = parseFloat(i.labour_margin) || 0;
      const sellRate = (1 - labourMargin) !== 0 ? labourRate / (1 - labourMargin) : 0;
      return sum + (hrs * qty * sellRate);
    }, 0);
    const pm_hrs = totalLabourHours * pmRate;
    const itemRate = labourRate * 1.41; 
    const pm_cost = itemRate * pm_hrs;
    const pm_selling = (1 - constLabMargin) !== 0
      ? (itemRate * pm_hrs) / (1 - constLabMargin)
      : 0;
    const sundries_cost = bill_equipment_cost * unitEquipSundries;
    const sundries_selling = (1 - equipTotMargin) !== 0
      ? sundries_cost / (1 - equipTotMargin)
      : 0;
    const bill_tot_selling = bill_labourSell + bill_equipment_selling + pm_selling + sundries_selling;
    const bill_tot_cost = bill_labourCost + bill_equipment_cost + pm_cost + sundries_cost + totalLabourHours;
    const grossProfit = bill_tot_selling - bill_tot_selling;
    const hwReplace = billItems.reduce((sum, i) => sum + parseFloat(i.hwReplaceProv || 0), 0);
    const totalMaintLabFactor = billItems.reduce((sum, i) =>
      sum + ((parseFloat(i.maint_lab_factor) || 0) * (parseFloat(i.qty) || 0)), 0);
    return {
      bill: billName,
      items: billItems,
      subtotal: subtotal.toFixed(2),
      totalLabourHours: totalLabourHours.toFixed(2),
      bill_equipment_cost: bill_equipment_cost.toFixed(2),
      bill_equipment_selling: bill_equipment_selling.toFixed(2),
      pm_cost: pm_cost.toFixed(2),
      pm_selling: pm_selling.toFixed(2),
      pm_hrs: pm_hrs.toFixed(2),
      sundries_cost: sundries_cost.toFixed(2),
      sundries_selling: sundries_selling.toFixed(2),
      bill_tot_selling: bill_tot_selling.toFixed(2),
      bill_tot_cost: bill_tot_cost.toFixed(2),
      bill_labourCost: bill_labourCost.toFixed(2),
      bill_labourSell: bill_labourSell.toFixed(2),
      grossProfit: grossProfit.toFixed(2),
      hwReplace: hwReplace.toFixed(2),
      totalMaintLabFactor: totalMaintLabFactor.toFixed(2)
    };
  });
  return billsData;
}
module.exports = calculateBillingData;
