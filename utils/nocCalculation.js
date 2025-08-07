const labourUnitRates = {
  alarmMonitoring: 3000.00,
  armedResponse: 450.00,
  smsActionable: 50.00,
  smsChange: 65.00,
  communicationFee: 25.00,
  ajaxDataFee: 90.00,
  videoFiedFee: 50.00,
  cctvOffsite: 0.00,
  scarfaceLiveSystem: 0.00,
  scarfaceMobile: 4999.00,
  cctvLinkFee: 0.00,
  nocLinkFee: 0.00
};
function calculateEquipmentRates(nocData) {
  const results = {};
  let totMonthlyRate = 0;
  for (const item in labourUnitRates) {
    const quantity = parseInt(nocData[item] || 0, 10);
    const labourRate = labourUnitRates[item];
    const equipmentUnitRate = labourRate * quantity;
    totMonthlyRate += equipmentUnitRate;
    results[item] = {
      quantity,
      labourUnitRate: labourRate,
      equipmentUnitRate: equipmentUnitRate
    };
  }
  results['totMonthlyRate'] = totMonthlyRate;
  return results;
}
module.exports = { calculateEquipmentRates };
