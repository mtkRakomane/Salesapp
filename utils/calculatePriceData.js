function calculatePriceData(itemsResult) {
  const labour_rate = 400;
  const pm_rate = 0.15;
  const equip_sundries = 0.03;
  const vat_rate = 0.15;
  const billsMap = new Map();
  itemsResult.forEach(item => {
    const {
      bill,
      stock_code,
      description,
      qty,
      unit_cost,
      labour_factor_hrs,
      labour_margin = 25,
      equipment_margin = 25
    } = item;
    const qtyParsed = parseFloat(qty) || 0;
    const unitCostParsed = parseFloat(unit_cost) || 0;
    const equip_margin = parseFloat(equipment_margin) / 100 || 0.25;
    const lab_margin = parseFloat(labour_margin) / 100 || 0.25;
    const labFactorHrs = parseFloat(labour_factor_hrs) || 0;
    const equip_unit_rate = unitCostParsed / (1 - equip_margin);
    const total_price = equip_unit_rate * qtyParsed;
    const itemData = {
      stock_code,
      description,
      qty: qtyParsed,
      unit_cost: unitCostParsed,
      equip_unit_rate: equip_unit_rate.toFixed(2),
      total_price: total_price.toFixed(2),
      labour_factor_hrs: labFactorHrs,
      labour_margin: lab_margin,
      equipment_margin: equip_margin
    };
    if (!billsMap.has(bill)) {
      billsMap.set(bill, []);
    }
    billsMap.get(bill).push(itemData);
  });
  const bills = [];
  let grandTotal = 0;
  let totalLabourHrs = 0;
  for (const [billName, items] of billsMap.entries()) {
    const itemsSum = items.reduce((acc, cur) => acc + parseFloat(cur.total_price), 0);
    const labourHrs = items.reduce((acc, cur) => acc + (cur.labour_factor_hrs * cur.qty), 0);
    totalLabourHrs += labourHrs;
    const Installation_Engineering = labourHrs * labour_rate;
    const Project_Management = labour_rate * (labourHrs * pm_rate);
    const Sundries = labourHrs * equip_sundries;
    const engSell = Installation_Engineering / (1 - (items[0]?.labour_margin || 0.25));
    const pmSell = Project_Management / (1 - (items[0]?.labour_margin || 0.25));
    const sundriesSell = Sundries / (1 - (items[0]?.equipment_margin || 0.25));
    const subtotal = itemsSum + pmSell + sundriesSell + engSell;
    grandTotal += subtotal;
    bills.push({
      bill: billName,
      items,
      extras: {
        Sundries: sundriesSell.toFixed(2),
        Project_Management: pmSell.toFixed(2),
        Installation_Engineering: engSell.toFixed(2)
      },
      subtotal: subtotal.toFixed(2)
    });
  }
  const vat = (grandTotal * vat_rate).toFixed(2);
  const totalIncludingVAT = (grandTotal + parseFloat(vat)).toFixed(2);
  return {
    bills,
    totalExcludingVAT: grandTotal.toFixed(2),
    vat,
    totalIncludingVAT
  };
}
module.exports = calculatePriceData;
