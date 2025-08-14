function calculateItemFields(item, labourRate = 400) {
const qty = parseFloat(item.qty) || 0;
const unitCost = parseFloat(item.unit_cost) || 0;
const labourFactorHrsPerUnit = parseFloat(item.labour_factor_hrs) || 0;
const labourFactorHrs = labourFactorHrsPerUnit * qty;
const installDiffFactor = parseFloat(item.install_diff_factor) || 0;
const maintLabFactor = parseFloat(item.maint_lab_factor * qty) || 0;
const labourMargin = parseFloat(item.labour_margin) / 100 || 0;
const equipmentMargin = parseFloat(item.equipment_margin) / 100 || 0;
const safeLabourDivisor = 1 - labourMargin;
const sellRate = safeLabourDivisor !== 0 ? labourRate / safeLabourDivisor : 0;
const unitLabRate = labourFactorHrsPerUnit * sellRate * installDiffFactor;
const totalLabour = unitLabRate * qty;
const equipUnitRate = (1 - equipmentMargin) !== 0 ? unitCost / (1 - equipmentMargin) : 0;
const equipTotal = equipUnitRate * qty * installDiffFactor;
const equipmentCost = unitCost * qty;
const labourCost = labourFactorHrsPerUnit * labourRate * installDiffFactor * qty;;
const hwReplaceProv = maintLabFactor > 0 ? equipTotal : 0;
  return {
    ...item,
    qty,
    unit_cost: unitCost,
    labour_factor_hrs: labourFactorHrs,
    install_diff_factor: installDiffFactor,
    maint_lab_factor: maintLabFactor,
    labour_margin: labourMargin,
    equipment_margin: equipmentMargin,
    equip_unit_rate: parseFloat(equipUnitRate.toFixed(2)),
    equip_total: parseFloat(equipTotal.toFixed(2)),
    equipmentCost: parseFloat(equipmentCost.toFixed(2)),
    labour_cost: parseFloat(labourCost.toFixed(2)),
    unitLabRate: parseFloat(unitLabRate.toFixed(2)),
    total_labour: parseFloat(totalLabour.toFixed(2)),
    hwReplaceProv: parseFloat(hwReplaceProv.toFixed(2))
  };
}
module.exports = calculateItemFields;
