const express = require('express');
const mysql = require('mysql2');
const session = require('express-session');
const bcrypt = require('bcrypt');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: true
}));
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});
const port = process.env.PORT || 3034;
db.connect(err => {
  if (err) throw err;
  console.log('MySQL connected.');
});
function executeQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    db.query(query, params, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
}
function formatAccounting(amount) {
  let num = parseFloat(amount || 0);
  const isNegative = num < 0;
  const formatted = Math.abs(num).toLocaleString('en-ZA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).replace(/,/g, ' ');
  return isNegative ? `R (${formatted})` : `R ${formatted}`;
}
app.get('/', (req, res) => res.redirect('/login'));
app.get('/admin/register', (req, res) => res.render('admins/register_admin'));
app.post('/admin/register', async (req, res) => {
  const { name, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  db.query('INSERT INTO Admins (name, email, password) VALUES (?, ?, ?)', [name, email, hashed], err => {
    if (err) throw err;
    res.redirect('/login');
  });
});
app.get('/login', (req, res) => {
  res.render('login_combined');
});
app.post('/login', (req, res) => {
  const { email, password, role } = req.body;
  if (role === 'admin') {
    db.query('SELECT * FROM Admins WHERE email = ?', [email], async (err, results) => {
      if (err) throw err;
      if (results.length > 0 && await bcrypt.compare(password, results[0].password)) {
        req.session.admin = results[0];
        return res.redirect('/admin/dashboard');
      } else {
        return res.send('Invalid admin login.');
      }
    });
  } else if (role === 'sales') {
    db.query('SELECT * FROM Salespeople WHERE email = ?', [email], async (err, results) => {
      if (err) throw err;
      if (results.length > 0 && await bcrypt.compare(password, results[0].password)) {
        if (!results[0].is_allowed) return res.send('Access denied by admin.');
        req.session.sales = results[0];
        return res.redirect('/sales/salesView');
      } else {
        return res.send('Invalid salesperson login.');
      }
    });
  } else {
    res.send('Please select a role.');
  }
});
app.get('/admin/dashboard', (req, res) => {
  if (!req.session.admin) return res.redirect('/login');
  res.render('admins/dashboard_admin');
});
app.post('/admin/add-salesperson', async (req, res) => {
  const { name, email, cell, role, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  db.query('INSERT INTO Salespeople (name, email, cell, role, password, is_allowed) VALUES (?, ?, ?, ?, ?, ?)',
    [name, email, cell, role, hashed, true], err => {
      if (err) throw err;
      res.redirect('/login');
    });
});
app.get('/register-customer', async (req, res) => {
  try {
    const salesPeoples = await executeQuery('SELECT name, cell, email, role FROM salespeople');
    res.render('customer/register-customer', { salesPeoples }); 
  } catch (error) {
    console.error('Error fetching signup data:', error);
    res.status(500).send('Error fetching data for signup');
  }
});
app.post('/register-customer', (req, res) => {
  const {
    customerEmail, customerName, customerCell, jobDescription, reference, name, cell, email, role
  } = req.body;
  const checkSql = `
    SELECT * FROM Customer 
    WHERE reference = ? AND customerEmail = ? AND customerName = ?
  `;
  db.query(checkSql, [reference, customerEmail, customerName], (err, results) => {
    if (err) {
      console.error('Error checking customer:', err);
      return res.status(500).send('Error checking for existing customer.');
    }
    if (results.length > 0) {
      return res.status(409).send('Customer with the same reference, email, and name already exists.');
    }
    const insertSql = `
      INSERT INTO Customer 
      (customerEmail, customerName, customerCell, jobDescription, reference, name, cell, email, role)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      customerEmail, customerName, customerCell, jobDescription, reference, name, cell, email, role
    ];
    db.query(insertSql, values, (err, result) => {
      if (err) {
        console.error('Error inserting customer:', err);
        return res.status(500).send('Failed to register customer.');
      }
      res.redirect(`/customer-search?reference=${reference}&email=${customerEmail}`);
    });
  });
});
app.get('/customer-search', (req, res) => {
  const { reference } = req.query;
  const salesperson = req.session.sales;
  if (!salesperson) return res.redirect('/login');
  if (!reference) return res.status(400).send('Reference is required.');
  db.query('SELECT * FROM Customer WHERE reference = ?', [reference], (err, results) => {
    if (err) return res.status(500).send('Error retrieving customer details.');
    if (results.length === 0) return res.status(404).send('Customer not found.');
    req.session.reference = reference;
    res.render('customer/customer-details', { customer: results[0] });
  });
});
app.get('/salespeople', (req, res) => {
  if (!req.session.admin && !req.session.sales) {
    return res.redirect('/login');
  }
  db.query('SELECT name, email, cell, is_allowed, role FROM Salespeople', (err, results) => {
    if (err) {
      console.error('Error fetching salespeople:', err);
      return res.status(500).send('Failed to retrieve salespeople.');
    }
    res.render('sales/salespeople', { salespeople: results });
  });
});
app.get('/sales/dashboard', (req, res) => {
  if (!req.session.sales) return res.redirect('/login');
  res.render('sales/dashboard_sales', {
    sales: req.session.sales
  });
});
app.get('/additems', async (req, res) => {
  if (!req.session.sales) {
    return res.redirect('/login');
  }
  const reference = req.query.reference;
  if (!reference) return res.status(400).send('Missing reference in query.');
  try {
    const [productTypes, installDifficultyTypes, supplyTypes] = await Promise.all([
      executeQuery('SELECT product_type, maint_lab_factor, labour_factor_hrs FROM producttype'),
      executeQuery('SELECT install_diff, install_diff_factor FROM installdifficultytype'),
      executeQuery('SELECT supply FROM supplytype'),
    ]);
    res.render('additems', {
      reference, productTypes, installDifficultyTypes, supplyTypes
    });
  } catch (error) {
    console.error('Error loading additems page:', error);
    res.status(500).send('Internal Server Error');
  }
});
app.post('/additems', async (req, res) => {
  try {
    const {
      reference, bill, stock_code, description, qty,
      product_type, install_diff, install_diff_factor, unit_cost, supply,
      labour_factor_hrs, maint_lab_factor, labour_margin, equipment_margin
    } = req.body;
    if (!reference) return res.status(400).send('Error: Reference is missing.');
    if (!bill) return res.status(400).send('Error: Bill is missing.');
    const referenceExists = await executeQuery(
      'SELECT 1 FROM customer WHERE reference = ?',
      [reference]
    );
    if (referenceExists.length === 0) {
      return res.status(404).send('Error: Reference does not exist in customers.');
    }
    const billExists = await executeQuery(
      'SELECT 1 FROM Bills WHERE bill = ? AND reference = ?',
      [bill, reference]
    );
    if (billExists.length === 0) {
      await executeQuery(
        `INSERT INTO Bills (bill, reference) VALUES (?, ?)`,
        [bill, reference]
      );
      console.log(`Bill '${bill}' inserted for reference '${reference}'`);
    }
    await executeQuery(
      `INSERT INTO Items (
        reference, bill, stock_code, description, qty, product_type,
        install_diff, install_diff_factor, unit_cost, supply,
        labour_factor_hrs, maint_lab_factor, labour_margin, equipment_margin
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        reference, bill, stock_code || '', description || '', qty || 0,
        product_type || '', install_diff || '', install_diff_factor || 0,
        unit_cost || 0, supply || '', labour_factor_hrs || 0,
        maint_lab_factor || 0, labour_margin || 0, equipment_margin || 0
      ]
    );
    res.redirect('/additems');
  } catch (error) {
    console.error('Error inserting item:', error);
    res.status(500).send('Database error while processing request.');
  }
});
const calculateItemFields = require('./utils/calculateItemData');
app.get('/viewitems', async (req, res) => {
  const { sales, admin } = req.session;
  if (!sales && !admin) {
    return res.status(401).send('Unauthorized: Login required');
  }
  const reference = req.query.reference;
  if (!reference) {
    return res.status(400).send('Missing reference in query.');
  }
  try {
    const items = await executeQuery(
      'SELECT * FROM Items WHERE reference = ? ORDER BY bill, reference',
      [reference]
    );
    const groupedItems = {};
    items.forEach(item => {
      const enrichedItem = calculateItemFields(item);
      if (!groupedItems[enrichedItem.bill]) {
        groupedItems[enrichedItem.bill] = [];
      }
      groupedItems[enrichedItem.bill].push(enrichedItem);
    });
    res.render('viewitems', { reference, groupedItems });
  } catch (err) {
    console.error('Error loading items:', err);
    res.status(500).send('Server error while retrieving items.');
  }
});
app.post('/delete-item/:id', async (req, res) => {
  const itemId = req.params.id;
  const reference = req.query.reference;
  if (!req.session.sales) {
    return res.status(403).send('Unauthorized: Salesperson not logged in');
  }
  if (!reference) {
    return res.status(400).send('Missing customer reference in query.');
  }
  const deleteQuery = `DELETE FROM Items WHERE id_items = ? AND reference = ?`;
  try {
    const [deleteResult] = await db.promise().execute(deleteQuery, [itemId, reference]);
    if (deleteResult.affectedRows === 0) {
      return res.status(404).send('Item not found or does not belong to this reference.');
    }
    res.redirect(`/viewitems?reference=${reference}`);
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).send('Server error while deleting item.');
  }
});
app.get('/edit-item/:id', async (req, res) => {
  const itemId = req.params.id;
  const reference = req.query.reference;
  if (!req.session.sales) {
    return res.status(403).send('Unauthorized: Salesperson not logged in');
  }
  try {
    const [
      installDifficultyTypes, productTypes, supplyTypes,
      [itemResult]
    ] = await Promise.all([
      executeQuery('SELECT install_diff, install_diff_factor FROM InstallDifficultyType'),
      executeQuery('SELECT product_type, labour_factor_hrs, maint_lab_factor FROM ProductType'),
      executeQuery('SELECT supply FROM SupplyType'),
      db.promise().execute(
        `SELECT id_items, reference, stock_code, description, qty, product_type, labour_factor_hrs, maint_lab_factor, 
                install_diff, install_diff_factor, unit_cost, supply, labour_margin, equipment_margin
         FROM Items
         WHERE id_items = ? AND reference = ?`,
        [itemId, reference]
      )
    ]);
    if (itemResult.length === 0) {
      return res.status(404).send('Item not found or unauthorized');
    }
   res.render('edit-item', {
  item: itemResult[0],
  reference,  
  installDifficultyTypes,
  productTypes,
  supplyTypes
});
  } catch (error) {
    console.error('Error fetching data for edit-item:', error);
    res.status(500).send('Internal server error');
  }
});
app.post('/edit-item/:id', async (req, res) => {
  const { id: itemId } = req.params;
  const { reference } = req.query;
  if (!req.session.sales) {
    return res.status(403).send('Unauthorized: Salesperson not logged in');
  }
  const {
    stock_code, description, qty, unit_cost, labour_margin, equipment_margin,
    supply, product_type, labour_factor_hrs, maint_lab_factor, install_diff, install_diff_factor
  } = req.body;
  try {
    const updateQuery = `
      UPDATE Items SET
        stock_code = ?, description = ?, qty = ?, unit_cost = ?, labour_margin = ?, equipment_margin = ?, 
        supply = ?, product_type = ?, labour_factor_hrs = ?, maint_lab_factor = ?, install_diff = ?, 
      install_diff_factor = ?
      WHERE id_items = ? AND reference = ?
    `;
    await db.promise().execute(updateQuery, [
      stock_code, description, qty, unit_cost, labour_margin, equipment_margin,
      supply, product_type, labour_factor_hrs, maint_lab_factor, install_diff, install_diff_factor,
      itemId,
      reference
    ]);
    if (!req.xhr) {
      return res.redirect('/sales/dashboard');
    }
    res.json({ message: 'Item updated successfully' });
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).send('Failed to update item');
  }
});
const calculateBillingData = require('./utils/calculateBillingData');
app.get('/billing', async (req, res) => {
  if (!req.session.sales) {
    return res.status(401).send('Unauthorized: Salesperson not logged in');
  }
  const reference = req.query.reference || req.session.reference;
  if (!reference) {
    return res.status(400).send('Missing reference in query or session.');
  }
  try {
    const itemsResult = await executeQuery(
      `SELECT i.bill, i.stock_code, i.description, i.qty, i.product_type, i.unit_cost, 
              i.maint_lab_factor, i.labour_factor_hrs, i.install_diff_factor, 
              i.labour_margin, i.equipment_margin,
              c.customerName, c.customerEmail, c.name, c.cell, c.role, c.jobDescription
       FROM items i
       JOIN customer c ON i.reference = c.reference
       WHERE i.reference = ? 
       ORDER BY i.bill, i.reference`,
      [reference]
    );
    if (itemsResult.length === 0) {
      return res.status(404).send('No items found for this reference.');
    }
    const extraCosts = {
      Sundries_and_Consumables: 1529.47,
      Project_Management: 1058.82,
      Installation_Commissioning_Engineering: 3150.30
    };
    const billsData = calculateBillingData(itemsResult, extraCosts);
    req.session.reference = reference;
    req.session.calculatedBills = billsData.map(b => ({
      bill: b.bill,
      bill_tot_selling: b.bill_tot_selling,
      hwReplace: b.hwReplace
    }));
    req.session.customerInfo = {
      customerName: itemsResult[0]?.customerName || '',
      customerEmail: itemsResult[0]?.customerEmail || '',
      name: itemsResult[0]?.name || '',
      jobDescription: itemsResult[0]?.jobDescription || '',
      cell: itemsResult[0]?.cell || ''
    };
    const groupedItems = {
      reference,
      customerName: itemsResult[0]?.customerName || '',
      customerEmail: itemsResult[0]?.customerEmail || '',
      name: itemsResult[0]?.name || '',
      jobDescription: itemsResult[0]?.jobDescription || '',
      cell: itemsResult[0]?.cell || '',
      bills: billsData
    };
    res.render('billing', { groupedItems, reference });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).send('Error retrieving items data.');
  }
});
const calculateBillSummaryData = require('./utils/calculateBillSummaryData');
app.get('/billSummary', (req, res) => {
  const reference = req.session.reference;
  const billsData = req.session.calculatedBills;
  const customerInfo = req.session.customerInfo;
  if (!reference || !billsData || !customerInfo) {
    return res.redirect('/login');
  }
  const billSummaryData = calculateBillSummaryData(billsData);
  res.render('billSummary', {
    billSummaryData,
    customerInfo,
    formatAccounting
  });
});
const calculateOverviewData = require('./utils/calculateOverviewData'); 
const { name } = require('ejs');
app.get('/overview', async (req, res) => {
  if (!req.session.sales) {
    return res.status(401).send('Unauthorized: Salesperson not logged in');
  }
  const reference = req.query.reference || req.session.reference;
  if (!reference) {
    return res.status(400).send('Missing reference in query or session.');
  }
   try {
    const itemsResult = await executeQuery(
      `SELECT i.bill, i.stock_code, i.description, i.qty, i.product_type, i.unit_cost, 
              i.maint_lab_factor, i.labour_factor_hrs, i.install_diff_factor, 
              i.labour_margin, i.equipment_margin,
              c.customerName, c.customerEmail, c.customerCell, c.name, c.email, c.cell, c.role, c.jobDescription, c.reference
       FROM items i
       JOIN customer c ON i.reference = c.reference
       WHERE i.reference = ? 
       ORDER BY i.bill, i.reference`,
      [reference]
    );
    if (itemsResult.length === 0) {
      return res.send('No Bill found for this reference. (Add a Bill first)');
    }
    const extraCosts = {
      Sundries_and_Consumables: 1529.47,
      Project_Management: 1058.82,
      Installation_Commissioning_Engineering: 3150.30
    };
    const referenceTotals = calculateOverviewData(itemsResult, extraCosts);
    const groupedItems = {
      reference,
      customerName: itemsResult[0].customerName,
      customerCell: itemsResult[0].customerCell,
      customerEmail: itemsResult[0].customerEmail,
      name: itemsResult[0].name,
      cell: itemsResult[0].cell,
      jobDescription: itemsResult[0].jobDescription,
      referenceTotals
    };
    req.session.reference = reference;
    res.render('overview', { groupedItems });
  } catch (error) {
    console.error('Error fetching overview data:', error);
    res.status(500).send('Error generating overview.');
  }
});
app.get('/viewQuotes', async (req, res) => {
  const name = req.query.name;
  try {
    if (name) {
      const [salesperson] = await executeQuery(
        'SELECT * FROM Salespeople WHERE name = ?',
        [name]
      );
      if (!salesperson) return res.send('Salesperson not found');
      const isRemoved = salesperson.is_allowed === 0;
      const customers = await executeQuery(
        `SELECT * FROM customer WHERE name = ? ORDER BY customerName`,
        [name]
      );
    let groupedItems = {};
if (customers.length > 0) {
  const references = customers.map(c => c.reference);
  const placeholders = references.map(() => '?').join(',');
  const itemRows = await executeQuery(
    `SELECT * FROM items WHERE reference IN (${placeholders})`,
    references
  );
  itemRows.forEach(item => {
    if (!groupedItems[item.reference]) {
      groupedItems[item.reference] = [];
    }
    groupedItems[item.reference].push(item);
  });
}
      res.render('viewQuotes', {
        selectedName: name,
        isRemoved,
        quotes: customers,
        items: groupedItems
      });
    } else {
      const salespeople = await executeQuery(
        'SELECT DISTINCT name, is_allowed FROM Salespeople ORDER BY name'
      );
      res.render('viewQuotes', {
        selectedName: null,
        isRemoved: null,
        quotes: salespeople,
        items: {}
      });
    }
  } catch (err) {
    console.error('Error loading viewQuotes:', err);
    res.status(500).send('Internal server error');
  }
});
app.get('/my-customers', (req, res) => {
  const salesperson = req.session.sales;
  if (!salesperson) {
    return res.redirect('/login');
  }
  const salespersonName = salesperson.name;
  const sql = 'SELECT * FROM Customer WHERE name = ?';
  db.query(sql, [salespersonName], (err, results) => {
    if (err) {
      console.error('Error fetching customers:', err);
      return res.status(500).send('Error retrieving customers.');
    }
    res.render('customer/my-customers', { customers: results });
  });
});
const calculatePrintData = require('./utils/calculatePrintData');
app.get('/print', async (req, res) => {
  const userRefNum = req.query.reference || req.session.user?.reference;
  if (!userRefNum) return res.redirect('/');
  try {
    const itemsResult = await executeQuery(
      `SELECT 
         i.bill, i.stock_code, i.description, i.qty, i.product_type, i.unit_cost, 
         i.maint_lab_factor, i.labour_factor_hrs, i.install_diff_factor, 
         i.labour_margin, i.equipment_margin,
         c.customerName AS customer_name,
         c.customerEmail AS customer_email,
         c.customerCell AS customer_cell,
         c.name AS sale_person,
         c.cell AS sale_cell,
         c.jobDescription AS job_description,
         c.reference,
         n.alarmMonitoring, n.armedResponse, n.smsChange, n.smsActionable, n.communicationFee,
         n.ajaxDataFee, n.videoFiedFee, n.scarfaceMobile, n.reference 
       FROM items i
       JOIN customer c ON i.reference = c.reference
       JOIN noc n on i.reference = n.reference
       WHERE i.reference = ? 
       ORDER BY i.bill, i.reference`, 
      [userRefNum]
    );
    if (itemsResult.length === 0) return res.send('No items found for this reference.');
    const groupedItems = calculatePrintData(itemsResult);
    groupedItems.reference = userRefNum;
    groupedItems.customer_name = itemsResult[0]?.customer_name || '';
    groupedItems.customer_email = itemsResult[0]?.customer_email || '';
    groupedItems.sale_person = itemsResult[0]?.sale_person || '';
    groupedItems.sale_cell = itemsResult[0]?.sale_cell || '';
    groupedItems.job_description = itemsResult[0]?.job_description || '';
    groupedItems.alarmMonitoring = itemsResult[0]?.alarmMonitoring || '';
    groupedItems.armedResponse = itemsResult[0]?.armedResponse || '';
    groupedItems.smsChange = itemsResult[0]?.smsChange || '';
    groupedItems.smsActionable = itemsResult[0]?.smsActionable || '';
    groupedItems.communicationFee = itemsResult[0]?.communicationFee || '';
    groupedItems.ajaxDataFee = itemsResult[0]?.ajaxDataFee || '';
    groupedItems.videoFiedFee = itemsResult[0]?.videoFiedFee || '';
    groupedItems.scarfaceLivrSystem = itemsResult[0]?.scarfaceLivrSystem || '';
    groupedItems.scarfaceMobile = itemsResult[0]?.scarfaceMobile || '';
    res.render('print', { groupedItems });
  } catch (error) {
    console.error('Error fetching print data:', error);
    res.status(500).send('Error retrieving print data.');
  }
});
app.post('/admin/delete-salesperson', async (req, res) => {
  const email = req.body.email;
  try {
    await executeQuery('UPDATE salespeople SET is_allowed = 0 WHERE email = ?', [email]);
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Error disabling salesperson:', error);
    res.status(500).send('Server Error');
  }
});
app.get('/admin/salesperson-data/:name', async (req, res) => {
  const name = req.params.name;
  try {
    const customers = await executeQuery(
      `SELECT 
         reference, customerName, customerEmail, customerCell, jobDescription,
         name, email, role, cell 
       FROM customer
       WHERE name = ?
       ORDER BY customerName`,
      [name]
    );
    const references = customers.map(c => c.reference);
    let items = [];
    if (references.length > 0) {
      items = await executeQuery(
        `SELECT * FROM items WHERE reference IN (${references.map(() => '?').join(',')})`,
        references
      );
    }
    res.render('admin-view-salesperson-data', { name, customers, items });
  } catch (error) {
    console.error('Error retrieving data:', error);
    res.status(500).send('Server error.');
  }
});
app.post('/admin/toggle-access', async (req, res) => {
  const email = req.body.email;
  try {
    const [user] = await executeQuery('SELECT is_allowed FROM salespeople WHERE email = ?', [email]);
    const newStatus = user.is_allowed ? 0 : 1;
    await executeQuery('UPDATE salespeople SET is_allowed = ? WHERE email = ?', [newStatus, email]);
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Error toggling access:', error);
    res.status(500).send('Server Error');
  }
});
app.get('/sales/salesView', (req, res) => {
  res.render('sales/salesView'); 
});
app.get('/items', async (req, res) => {
  const reference = req.query.reference;
  const bill = req.query.bill;
  if (!reference || !bill) return res.status(400).send('Missing reference or bill.');
  try {
    const items = await executeQuery(
      `SELECT id_items,stock_code, description, qty, product_type, unit_cost,
              maint_lab_factor, labour_factor_hrs, install_diff_factor,
              labour_margin, equipment_margin, bill
       FROM items
       WHERE reference = ? AND bill = ?`,
      [reference, bill]
    );
    const calculatedItems = items.map(item => calculateItemFields(item));
    res.render('items', { bill, reference, items: calculatedItems });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('Server error');
  }
});
app.get('/noc', async (req, res) => {
  try {
    if (!req.session.sales) {
      return res.redirect('/login');
    }
    if (!req.session.reference) {
      return res.status(400).send('Please select a customer first.');
    }
    const ebmCameras = await executeQuery('SELECT * FROM ebm_cameras');
    const scarfaceCameras = await executeQuery('SELECT * FROM scarface_cameras');
   res.render('noc', {
  reference: req.session.reference,
  ebmCameras,
  scarfaceCameras
});
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});
const { calculateEquipmentRates } = require('./utils/nocCalculation');
app.get('/noc/calculate', async (req, res) => {
  if (!req.session.sales) return res.redirect('/login');
  const reference = req.query.reference;
  if (!reference) return res.status(400).send('Reference missing');
  try {
    const [nocRow] = await executeQuery('SELECT * FROM noc WHERE reference = ?', [reference]);
    if (!nocRow) return res.status(404).send('No NOC data found for this reference');
    const calculations = calculateEquipmentRates(nocRow);
    res.render('nocRates', { reference, calculations });
  } catch (error) {
    console.error('Error calculating NOC:', error);
    res.status(500).send('Error fetching NOC data');
  }
});
app.post('/noc', (req, res) => {
  const salesperson = req.session.sales;
  const reference = req.session.reference;
  if (!salesperson) return res.redirect('/login');
  if (!reference) return res.status(400).send('Customer reference is missing.');
  const {
    alarmMonitoring = 0,
    armedResponse = 0,
    smsActionable = 0,
    smsChange = 0,
    communicationFee = 0,
    ajaxDataFee = 0,
    videoFiedFee = 0,   
    scarfaceMobile = 0,
    cameras = 0,
    noScarfaceCamera = 0,
    cctvOffEventMonitorLabour = 0,
    scarfaceLiveSystemLabour = 0,
    cctvOffEventMonitorEquip = 0, 
    scarfaceLiveSystemEquip = 0,
  } = req.body;
  const sql = `
    INSERT INTO noc (
      reference, 
      alarmMonitoring, 
      armedResponse, 
      smsActionable, 
      smsChange, 
      communicationFee, 
      ajaxDataFee, 
      videoFiedFee, 
      scarfaceMobile,
      cameras,  
      noScarfaceCamera,
      cctvOffEventMonitorLabour,
      scarfaceLiveSystemLabour,
      cctvOffEventMonitorEquip, 
      scarfaceLiveSystemEquip
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON DUPLICATE KEY UPDATE
      alarmMonitoring = VALUES(alarmMonitoring),
      armedResponse = VALUES(armedResponse),
      smsActionable = VALUES(smsActionable),
      smsChange = VALUES(smsChange),
      communicationFee = VALUES(communicationFee),
      ajaxDataFee = VALUES(ajaxDataFee),
      videoFiedFee = VALUES(videoFiedFee),
      scarfaceMobile = VALUES(scarfaceMobile),
      cameras = VALUES(cameras),
      noScarfaceCamera = VALUES(noScarfaceCamera),
      cctvOffEventMonitorLabour = VALUES(cctvOffEventMonitorLabour),
      scarfaceLiveSystemLabour = VALUES(scarfaceLiveSystemLabour),
      cctvOffEventMonitorEquip = VALUES(cctvOffEventMonitorEquip),
      scarfaceLiveSystemEquip = VALUES(scarfaceLiveSystemEquip)
  `;
  const values = [
    reference,
    alarmMonitoring,
    armedResponse,
    smsActionable,
    smsChange,
    communicationFee,
    ajaxDataFee,
    videoFiedFee,
    scarfaceMobile,
    cameras,
    noScarfaceCamera,
    cctvOffEventMonitorLabour, 
    scarfaceLiveSystemLabour,
    cctvOffEventMonitorEquip, 
    scarfaceLiveSystemEquip
  ];
  db.query(sql, values, (err) => {
    if (err) {
      console.error('Error saving NOC data:', err.sqlMessage || err);
      return res.status(500).send('Failed to store NOC information.');
    }
    res.redirect('/sales/dashboard');
  });
});
app.get('/sales/updateSales', async (req, res) => {
  const salesperson = req.session.sales;
  if (!salesperson) return res.redirect('/login');
  db.query('SELECT * FROM Salespeople WHERE id_salespeople = ?', [salesperson.id_salespeople], (err, results) => {
    if (err) throw err;
    if (results.length === 0) return res.status(404).send('Salesperson not found');
    res.render('updateSales', { sales: results[0] });
  });
});
app.post('/sales/updateSales', (req, res) => {
  const salesperson = req.session.sales;
  if (!salesperson) return res.redirect('/login');
  const { name, email, cell } = req.body;
  db.query(
    'UPDATE Salespeople SET name = ?, email = ?, cell = ?, role = ? WHERE id_salespeople = ?',
    [name, email, cell, role, salesperson.id_salespeople],
    (err) => {
      if (err) throw err;
      req.session.sales.name = name;
      req.session.sales.email = email;
      req.session.sales.cell = cell;
      req.session.sales.role = role;
      res.redirect('/sales/salesView');
    }
  );
});
app.get("/nocRates/:reference", (req, res) => {
  const reference = req.params.reference;
  res.render("nocRates", {
    reference,
    calculations,
    alarmMonitoring,
    armedResponse,
    smsActionable,
    smsChange,
    communicationFee,
    ajaxDataFee,
    videoFiedFee,
    cameras,
    noScarfaceCamera,
    scarfaceMobile
  });
});
Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});
app.listen(port, () => {
  console.log(`Server running`);
});

