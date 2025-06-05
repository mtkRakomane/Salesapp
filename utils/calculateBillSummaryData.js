function calculateBillSummaryData(billsData) {
  const totalSellingSum = billsData.reduce(
    (sum, bill) => sum + parseFloat(bill.bill_tot_selling || 0),
    0
  );

  const vatRate = 0.15;
  const vatAmountForAll = totalSellingSum * vatRate;
  const totalWithVat = totalSellingSum + vatAmountForAll;

  return {
    bills: billsData,
    totalSellingSum: totalSellingSum.toFixed(2),
    vatAmountForAll: vatAmountForAll.toFixed(2),
    totalWithVat: totalWithVat.toFixed(2)
  };
}

module.exports = calculateBillSummaryData;
