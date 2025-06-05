app.get('/allitems', async (req, res) => {
  const loggedInReference = req.session.user?.reference;
  if (!loggedInReference) {
    return res.status(401).send('Unauthorized: No reference found');
  }
  const query = 'SELECT * FROM Items WHERE reference = ? ORDER BY bill, reference';
  db.query(query, [loggedInReference], (error, results) => {
    if (error) {
      console.error('Database error:', error);
      return res.status(500).send('Database error');
    }
    if (!results.length) {
      return res.render('allitems', { groupedItems: {} });
    }
    const groupedItems = {};
    const labourRate = 400;
    results.forEach(item => {
      const labourMargin = parseFloat(item.labour_margin) / 100 || 0;
      const equipmentMargin = parseFloat(item.equipment_margin) / 100 || 0;
      item.labour_margin = labourMargin;
      item.equipment_margin = equipmentMargin;
      const safeLabourDivisor = 1 - labourMargin;
      const sellRate = safeLabourDivisor !== 0 ? labourRate / safeLabourDivisor : 0;
      item.equip_unit_rate = (1 - equipmentMargin) !== 0
        ? parseFloat((item.unit_cost / (1 - equipmentMargin)).toFixed(2))
        : 0;
      item.equip_total = parseFloat((item.equip_unit_rate * item.qty).toFixed(2));
      item.equipmentCost = parseFloat((item.unit_cost * item.qty).toFixed(2));
      item.labour_cost = parseFloat((item.labour_factor_hrs * labourRate * item.install_diff_factor).toFixed(2));
      item.unitLabRate = parseFloat((item.labour_factor_hrs * sellRate * item.install_diff_factor).toFixed(2));
      item.total_labour = parseFloat((item.unitLabRate * item.qty).toFixed(2));
      item.hwReplaceProv = item.maint_lab_factor > 0 ? item.equip_total : 0;
      if (!groupedItems[item.bill]) {
        groupedItems[item.bill] = [];
      }

      groupedItems[item.bill].push(item);
    });

    res.render('allitems', { groupedItems });
  });
});