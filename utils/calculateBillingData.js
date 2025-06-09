function calculateBillingData(items, extraCosts = {}, labourRate = 400, pmRate = 0.15, equipSundries = 0.03) {
  const bills = items.reduce((acc, item) => {
    const bill = item.bill || 'Unknown Bill';
    if (!acc[bill]) acc[bill] = [];
    acc[bill].push(item);
    return acc;
  }, {});

  const billsData = Object.keys(bills).map(billName => {
    const items = bills[billName].map(item => {
      const qty = parseFloat(item.qty) || 0;
      const unitCost = parseFloat(item.unit_cost) || 0;
      const labourFactorHrs = parseFloat(item.labour_factor_hrs) || 0;
      const installDiffFactor = parseFloat(item.install_diff_factor) || 0;
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

    const bill_equipment_cost = items.reduce((sum, item) => sum + parseFloat(item.equipment_cost || 0), 0);
    const bill_equipment_selling = items.reduce((sum, item) => sum + parseFloat(item.equipment_selling || 0), 0);
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.unit_cost || 0) * parseFloat(item.qty || 0)), 0)
      + (extraCosts.Sundries_and_Consumables || 0)
      + (extraCosts.Project_Management || 0)
      + (extraCosts.Installation_Commissioning_Engineering || 0);

    const totalLabourHours = items.reduce((sum, item) => sum + (parseFloat(item.labour_factor_hrs || 0) * parseFloat(item.qty || 0)), 0);

    const bill_labourCost = items.reduce((sum, item) => {
      const hrs = parseFloat(item.labour_factor_hrs || 0);
      const qty = parseFloat(item.qty || 0);
      return sum + (hrs * labourRate * qty);
    }, 0);

    const bill_labourSell = items.reduce((sum, item) => {
      const hrs = parseFloat(item.labour_factor_hrs || 0);
      const qty = parseFloat(item.qty || 0);
      const labourMargin = parseFloat(item.labour_margin) || 0;
      const sellRate = (1 - labourMargin) !== 0 ? labourRate / (1 - labourMargin) : 0;
      return sum + (hrs * qty * sellRate);
    }, 0);

    const pmRates = totalLabourHours * pmRate;
    const firstItemMargin = parseFloat(items[0]?.labour_margin) || 0;
    const pmRatesell = (1 - firstItemMargin) !== 0 ? (totalLabourHours * labourRate * pmRate) / (1 - firstItemMargin) : 0;

    const pm_cost = labourRate * pmRates;
    const pm_selling = pmRatesell;

    const sundries_cost = totalLabourHours * equipSundries;
    const sundries_selling = (1 - firstItemMargin) !== 0
      ? (sundries_cost / (1 - firstItemMargin))
      : 0;

    const bill_tot_selling = bill_labourSell + bill_equipment_selling + pm_selling + sundries_selling;
    const bill_tot_cost = bill_labourCost + bill_equipment_cost + pm_cost + sundries_cost + totalLabourHours;

    const hwReplace = items.reduce((sum, item) => sum + parseFloat(item.hwReplaceProv || 0), 0);

    const totalMaintLabFactor = items.reduce((sum, item) =>
      sum + ((parseFloat(item.maint_lab_factor) || 0) * (parseFloat(item.qty) || 0)), 0); 

    return {
      bill: billName,
      items,
      subtotal: subtotal.toFixed(2),
      totalLabourHours: totalLabourHours.toFixed(2),
      bill_equipment_cost: bill_equipment_cost.toFixed(2),
      bill_equipment_selling: bill_equipment_selling.toFixed(2),
      pm_cost: pm_cost.toFixed(2),
      pm_selling: pm_selling.toFixed(2),
      pm_hrs: pmRates.toFixed(2),
      sundries_cost: sundries_cost.toFixed(2),
      sundries_selling: sundries_selling.toFixed(2),
      bill_tot_selling: bill_tot_selling.toFixed(2),
      bill_tot_cost: bill_tot_cost.toFixed(2),
      bill_labourCost: bill_labourCost.toFixed(2),
      bill_labourSell: bill_labourSell.toFixed(2),
      hwReplace: hwReplace.toFixed(2),
      totalMaintLabFactor: totalMaintLabFactor.toFixed(2)
    };
  });

  return billsData;
}

module.exports = calculateBillingData;
