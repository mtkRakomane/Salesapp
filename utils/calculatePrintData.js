function calculatePrintData(items, labour_rate = 400, pm_rate = 0.15, equip_sundries = 0.03) {
  let totalExcludingVAT = 0;
  const bills = items.reduce((acc, item) => {
    const bill = item.bill || 'Unknown Bill';
    if (!acc[bill]) acc[bill] = [];
    acc[bill].push(item);
    return acc;
  }, {});
  const billArray = Object.keys(bills).map(billName => {
    const items = bills[billName].map(item => {
      const equipmentMargin = parseFloat(item.equipment_margin) / 100 || 0;
      const labourMargin = parseFloat(item.labour_margin) / 100 || 0;
      const qty = parseFloat(item.qty) || 0;
      const labourFactorHrs = parseFloat(item.labour_factor_hrs) || 0;
      const unitCost = parseFloat(item.unit_cost) || 0;

      const equip_unit_rate = parseFloat((unitCost / (1 - equipmentMargin)).toFixed(2));
      const equip_total = parseFloat((equip_unit_rate * qty).toFixed(2));

      const sellRate = labour_rate / (1 - labourMargin);
      const unitLabRate = parseFloat((sellRate * labourFactorHrs).toFixed(2));
      const total_labour = parseFloat((unitLabRate * qty).toFixed(2));
      return {
        ...item,
        equip_unit_rate,
        equip_total,
        total_price: equip_total.toFixed(2),
        unitLabRate: unitLabRate.toFixed(2),
        total_labour: total_labour.toFixed(2),
        labour_margin: labourMargin,
        equipment_margin: equipmentMargin
      };
    });
    const installation_engineering = items.reduce((sum, item) => sum + parseFloat(item.total_labour), 0);
    const totalLabourHours = items.reduce((sum, item) => sum + (parseFloat(item.labour_factor_hrs || 0) * parseFloat(item.qty || 0)), 0);
    const avgLabourMargin = items.length > 0
      ? items.reduce((sum, item) => sum + item.labour_margin, 0) / items.length
      : 0;
    const sundries_cal = parseFloat((totalLabourHours * equip_sundries / (1 - avgLabourMargin)).toFixed(2));
    const project_managing = parseFloat(((labour_rate * totalLabourHours * pm_rate) / (1 - avgLabourMargin)).toFixed(2));
    const itemTotalPrice = items.reduce((sum, item) => sum + item.equip_total, 0);
    const subtotal = parseFloat((
      itemTotalPrice +
      sundries_cal +
      project_managing +
      installation_engineering
    ).toFixed(2));
    totalExcludingVAT += subtotal;
    return {
      bill: billName,
      items,
      subtotal: subtotal.toFixed(2),
      totalLabourHours: totalLabourHours.toFixed(2),
      extras: {
        Sundries: sundries_cal.toFixed(2),
        Project_Management: project_managing.toFixed(2),
        Installation_Engineering: installation_engineering.toFixed(2)
      }
    };
  });
  const vat = parseFloat((totalExcludingVAT * 0.15).toFixed(2));
  const totalIncludingVAT = parseFloat((totalExcludingVAT + vat).toFixed(2));
  return {
    bills: billArray,
    totalExcludingVAT: totalExcludingVAT.toFixed(2),
    vat: vat.toFixed(2),
    totalIncludingVAT: totalIncludingVAT.toFixed(2)
  };
}
module.exports = calculatePrintData;
