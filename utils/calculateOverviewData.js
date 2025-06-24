function calculateOverviewData(itemsResult, extraCosts) {
  const labour_rate = 400;
  const pm_rate = 0.15;
  const equip_sundries = 0.03;
  const parsedItems = itemsResult.map(item => {
    const qty = parseFloat(item.qty) || 0;
    const unitCost = parseFloat(item.unit_cost) || 0;
    const labourFactorHrs = parseFloat(item.labour_factor_hrs) || 0;
    const labour_margin = parseFloat(item.labour_margin) / 100 || 0.25;
    const equipment_margin = parseFloat(item.equipment_margin) / 100 || 0.25;
    const equipment_cost = unitCost * qty;
    const equipment_selling = (unitCost / (1 - equipment_margin)) * qty;
    const total_labour = labourFactorHrs * labour_rate * qty;
    const unitLabRate = labour_rate / (1 - labour_margin);
    const labour_selling = labourFactorHrs * unitLabRate * qty;
    return {
      ...item,
      qty,
      unitCost,
      labourFactorHrs,
      labour_margin,
      equipment_margin,
      equipment_cost,
      equipment_selling,
      total_labour,
      labour_selling
    };
  });
  const sum = (arr, field) =>
  arr.reduce((acc, item) => acc + (parseFloat(item[field]) || 0), 0);
  const bill_equipment_cost = sum(parsedItems, 'equipment_cost');
  const bill_equipment_selling = sum(parsedItems, 'equipment_selling');
  const bill_labourCost = sum(parsedItems, 'total_labour');
  const bill_labourSell = sum(parsedItems, 'labour_selling');
  const totalLabourHours = sum(parsedItems, 'labourFactorHrs');
  const pm_cost = labour_rate * (totalLabourHours * pm_rate);
  const labourMargin = parsedItems[0]?.labour_margin || 0.25;
  const pm_selling = pm_cost / (1 - labourMargin);
  const sundries_cost = totalLabourHours * equip_sundries;
  const equipmentMargin = parsedItems[0]?.equipment_margin || 0.25;
  const sundries_selling = sundries_cost / (1 - equipmentMargin);
  const totalSellProject =
    bill_equipment_selling + bill_labourSell + pm_selling + sundries_selling;
  const totalCostProject =
    bill_equipment_cost + bill_labourCost + pm_cost + sundries_cost;
  const totalGrossMargin = totalSellProject - totalCostProject;
  const actualGrossMargin = totalSellProject === 0
    ? 0
    : ((totalGrossMargin / totalSellProject) * 100).toFixed(2);
  const gmEquip = bill_equipment_selling === 0
    ? 0
    : ((bill_equipment_selling - bill_equipment_cost) / bill_equipment_selling * 100).toFixed(2);
  const gmLabour = bill_labourSell === 0
    ? 0
    : ((bill_labourSell - bill_labourCost) / bill_labourSell * 100).toFixed(2);
  const gmPm = pm_selling === 0
    ? 0
    : ((pm_selling - pm_cost) / pm_selling * 100).toFixed(2);
  const gmSundries = sundries_selling === 0
    ? 0
    : ((sundries_selling - sundries_cost) / sundries_selling * 100).toFixed(2);
  const pEquipment = totalSellProject === 0
    ? 0
    : ((bill_equipment_selling / totalSellProject) * 100).toFixed(2);
  const pLabour = totalSellProject === 0
    ? 0
    : ((bill_labourSell / totalSellProject) * 100).toFixed(2);
  const pProjectM = totalSellProject === 0
    ? 0
    : ((pm_selling / totalSellProject) * 100).toFixed(2);
  const pSundries = totalSellProject === 0
    ? 0
    : ((sundries_selling / totalSellProject) * 100).toFixed(2);
  const vat = 0.15;
  const totalTax = (totalSellProject * vat).toFixed(2);
  const totalVatSell = (totalSellProject + parseFloat(totalTax)).toFixed(2);
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
    actualGrossMargin,
    gmEquip,
    gmLabour,
    gmPm,
    gmSundries,
    pEquipment,
    pLabour,
    pProjectM,
    pSundries,
    totalTax,
    totalVatSell,
    totalLabourHours: totalLabourHours.toFixed(2),
    projectDays: (totalLabourHours / 8).toFixed(2),
    projectWeeks: (totalLabourHours / 40).toFixed(2)
  };
}

module.exports = calculateOverviewData;
