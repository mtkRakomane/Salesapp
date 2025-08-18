const labourUnitRates = {
  alarmMonitoring: 3000.00,
  armedResponse: 450.00,
  smsActionable: 50.00,
  smsChange: 65.00,
  communicationFee: 25.00,
  ajaxDataFee: 90.00,
  videoFiedFee: 50.00,
  scarfaceMobile: 4999.00,
  cctvLinkFee: 0.00,
  nocLinkFee: 0.00
};
const displayNames = {
  alarmMonitoring: 'Alarm Monitoring - Per Partition',
  armedResponse: 'Armed Response',
  smsActionable: 'SMS Actionable',
  smsChange: 'SMS Change',
  communicationFee: 'Communication Fee',
  ajaxDataFee: 'Ajax Data Fee',
  videoFiedFee: 'VideoFied Fee',
  scarfaceMobile: 'Scarface Mobile',
  cctvLinkFee: 'CCTV Link Fee',
  nocLinkFee: 'NOC Link Fee',
  cameras: 'CCTV Offsite',
  noScarfacefaceCamera: 'Scarface Live System'
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
      label: displayNames[item] || item,
      quantity,
      labourUnitRate: labourRate,
      equipmentUnitRate: equipmentUnitRate
    };
  }
  results['totMonthlyRate'] = totMonthlyRate;
  return results;
}

module.exports = { calculateEquipmentRates };
