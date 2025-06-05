const express = require('express');
const mysql = require('mysql2');
const session = require('express-session');
const bcrypt = require('bcrypt');
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
        return res.redirect('/sales/dashboard');
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
app.get('/register-customer', (req, res) => {
  res.render('customer/register-customer'); 
});
app.post('/register-customer', (req, res) => {
  const { customerEmail, customerName, customerCell, jobDescription, reference } = req.body;
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
    // Insert if not found
    const insertSql = `
      INSERT INTO Customer (customerEmail, customerName, customerCell, jobDescription, reference)
      VALUES (?, ?, ?, ?, ?)
    `;
    db.query(insertSql, [customerEmail, customerName, customerCell, jobDescription, reference], (err, result) => {
      if (err) {
        console.error('Error inserting customer:', err);
        return res.status(500).send('Failed to register customer.');
      }
      res.redirect(`/customer-search?reference=${reference}&email=${customerEmail}`);
    });
  });
});
app.get('/customer-search', (req, res) => {
  const { reference, email } = req.query;
  if (!req.session.sales) {
    return res.redirect('/login');
  }
  if (!reference || !email) {
    return res.status(400).send('Both reference and email are required.');
  }
  const sql = 'SELECT * FROM Customer WHERE reference = ? AND customerEmail = ?';
  db.query(sql, [reference, email], (err, results) => {
    if (err) {
      console.error('Error fetching customer:', err);
      return res.status(500).send('Error retrieving customer details.');
    }
    if (results.length === 0) {
      return res.status(404).send('Customer not found with that reference and email.');
    }
    res.render('customer/customer-details', { customer: results[0] });
  });
});
app.get('/salespeople', (req, res) => {
  if (!req.session.admin && !req.session.sales) {
    return res.redirect('/login');
  }

  db.query('SELECT name, email, cell, role FROM Salespeople', (err, results) => {
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
      reference,
      productTypes,
      installDifficultyTypes,
      supplyTypes
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
      product_type, install_diff, install_diff_factor,
      unit_cost, supply,
      labour_factor_hrs, maint_lab_factor, labour_margin, equipment_margin
    } = req.body;

    if (!reference) return res.status(400).send('Error: Reference is missing.');
    if (!bill) return res.status(400).send('Error: Bill is missing.');

    // Check if customer reference exists
    const referenceExists = await executeQuery(
      'SELECT 1 FROM customer WHERE reference = ?',
      [reference]
    );
    if (referenceExists.length === 0) {
      return res.status(404).send('Error: Reference does not exist in customers.');
    }

    // Check if bill exists
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

    // ✅ Redirect to sales dashboard
    res.redirect('/sales/dashboard');
  } catch (error) {
    console.error('Error inserting item:', error);
    res.status(500).send('Database error while processing request.');
  }
});
const calculateItemFields = require('./utils/calculateItemData');
app.get('/viewitems', async (req, res) => {
  if (!req.session.sales) {
    return res.status(401).send('Unauthorized: Salesperson not logged in');
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
// DELETE item by ID and customer reference
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
  const { id: itemId } = req.params;
  const { reference } = req.query;
  if (!req.session.sales) {
    return res.status(403).send('Unauthorized: Salesperson not logged in');
  }
  try {
    const [
      installDifficultyTypes,
      productTypes,
      supplyTypes,
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
              c.customerName, c.customerEmail
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

    const groupedItems = {
      reference,
      customer_name: itemsResult[0]?.customerName || '',
      customer_email: itemsResult[0]?.customerEmail || '',
      sale_person: '',
      sale_cell: '',
      job_description: '',
      bills: billsData
    };

    req.session.reference = reference;
    req.session.calculatedBills = billsData.map(b => ({
      bill: b.bill,
      bill_tot_selling: b.bill_tot_selling,
      hwReplace: b.hwReplace
    }));

    res.render('billing', { groupedItems });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).send('Error retrieving items data.');
  }
});
const calculateBillSummaryData = require('./utils/calculateBillSummaryData');
app.get('/billSummary', (req, res) => {
  const reference = req.session.reference;
  const billsData = req.session.calculatedBills;
 if (!reference || !billsData) {
    return res.redirect('/login');
  }

  const billSummaryData = calculateBillSummaryData(billsData);

  res.render('billSummary', {
    billSummaryData,
    formatAccounting
  });
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});
// Routes to render pages
app.get('/overview', (req, res) => res.render('overview'));
app.get('/print', (req, res) => res.render('print'));

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

