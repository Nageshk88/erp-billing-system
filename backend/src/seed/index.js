require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const { User, Contact, Item, Warehouse, Inventory, Account, Transaction, LspConfig } = require('../models');

async function seed() {
  console.log('🔌 Connecting to MongoDB Atlas...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected\n');

  console.log('🧹 Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Contact.deleteMany({}),
    Item.deleteMany({}),
    Warehouse.deleteMany({}),
    Inventory.deleteMany({}),
    Account.deleteMany({}),
    Transaction.deleteMany({}),
    LspConfig.deleteMany({}),
    mongoose.connection.collection('counters').deleteMany({}),
  ]);
  console.log('  ✓ Collections cleared\n');

  console.log('🌱 Seeding database...');

  // Users
  const admin = await User.create({ name: 'Admin User', email: 'admin@erp.com', password: 'admin123', role: 'admin' });
  const staff = await User.create({ name: 'Sales Staff', email: 'staff@erp.com', password: 'staff123', role: 'staff' });
  console.log('  ✓ Users created');

  // Warehouses
  const wh1 = await Warehouse.create({ code: 'WH-MAIN', name: 'Main Warehouse', isDefault: true, address: '123 Industrial Area' });
  const wh2 = await Warehouse.create({ code: 'WH-STORE', name: 'Store', address: '456 High Street' });
  console.log('  ✓ Warehouses created');

  // Customers
  const customers = await Contact.insertMany([
    { type: 'customer', code: 'CUST-001', name: 'Sunrise Traders', phone: '9876543210', email: 'sunrise@example.com', partyType: 'Wholesaler', city: 'Mumbai', businessType: 'Electronics Distribution', personalPreferences: 'Prefers bulk orders, call before 11am', gstNumber: '27ABCDE1234F1Z5' },
    { type: 'customer', code: 'CUST-002', name: 'Metro Stores', phone: '9812345678', email: 'metro@example.com', partyType: 'Retailer', city: 'Delhi', businessType: 'Retail Chain', personalPreferences: 'Prefers Coffee, afternoon meetings', gstNumber: '07XYZAB9876G2H1' },
    { type: 'customer', code: 'CUST-003', name: 'Global Tech Solutions', phone: '9900123456', email: 'globaltech@example.com', partyType: 'End User', city: 'Bangalore', businessType: 'IT Services' },
    { type: 'both', code: 'CUST-004', name: 'Allied Components', phone: '9600987654', email: 'allied@example.com', partyType: 'Wholesaler', city: 'Chennai', businessType: 'Components Trading' },
  ]);

  // Suppliers
  await Contact.insertMany([
    { type: 'supplier', code: 'SUPP-001', name: 'Prime Electronics Pvt Ltd', phone: '9123456789', email: 'prime@supplier.com', city: 'Shenzhen', country: 'China' },
    { type: 'supplier', code: 'SUPP-002', name: 'BharatMart Distributors', phone: '9234567890', email: 'bharatmart@supplier.com', city: 'Surat', gstNumber: '24PQRST5678U3V2' },
  ]);
  console.log('  ✓ Contacts created');

  // Items
  const items = await Item.insertMany([
    { sku: 'ITEM-001', name: 'USB-C Cable 2m', category: 'Cables', brand: 'TechLink', uom: 'Nos', hsnCode: '8544', taxRate: 18, costPrice: 80, sellingPrice: 150, mrp: 200, minStockLevel: 50 },
    { sku: 'ITEM-002', name: 'Wireless Mouse', category: 'Peripherals', brand: 'ClickMaster', uom: 'Nos', hsnCode: '8471', taxRate: 18, costPrice: 350, sellingPrice: 650, mrp: 799, minStockLevel: 20 },
    { sku: 'ITEM-003', name: 'HDMI Cable 1.5m', category: 'Cables', brand: 'TechLink', uom: 'Nos', hsnCode: '8544', taxRate: 18, costPrice: 120, sellingPrice: 250, mrp: 350, minStockLevel: 30 },
    { sku: 'ITEM-004', name: 'Laptop Stand Aluminium', category: 'Accessories', brand: 'ErgoDesk', uom: 'Nos', hsnCode: '8473', taxRate: 18, costPrice: 800, sellingPrice: 1500, mrp: 1999, minStockLevel: 10 },
    { sku: 'ITEM-005', name: 'Mechanical Keyboard', category: 'Peripherals', brand: 'TypeMaster', uom: 'Nos', hsnCode: '8471', taxRate: 18, costPrice: 1200, sellingPrice: 2200, mrp: 2799, minStockLevel: 15 },
    { sku: 'ITEM-006', name: 'USB Hub 4-Port', category: 'Peripherals', brand: 'HubConnect', uom: 'Nos', hsnCode: '8471', taxRate: 18, costPrice: 200, sellingPrice: 450, mrp: 599, minStockLevel: 25 },
    { sku: 'ITEM-007', name: 'Screen Cleaning Kit', category: 'Accessories', brand: 'CleanTech', uom: 'Set', hsnCode: '3405', taxRate: 12, costPrice: 60, sellingPrice: 120, mrp: 150, minStockLevel: 40 },
    { sku: 'ITEM-008', name: 'Monitor 24" FHD', category: 'Displays', brand: 'ViewPro', uom: 'Nos', hsnCode: '8528', taxRate: 18, costPrice: 8500, sellingPrice: 14000, mrp: 17999, minStockLevel: 5 },
  ]);
  console.log('  ✓ Items created');

  // Stock
  const inventoryDocs = [];
  for (const item of items) {
    inventoryDocs.push(
      { itemId: item._id, warehouseId: wh1._id, quantity: Math.floor(Math.random() * 100) + 20 },
      { itemId: item._id, warehouseId: wh2._id, quantity: Math.floor(Math.random() * 30) + 5 }
    );
  }
  await Inventory.insertMany(inventoryDocs);
  console.log('  ✓ Inventory created');

  // Chart of Accounts
  await Account.insertMany([
    { code: '1000', name: 'Cash', type: 'cash', isSystem: true, currentBalance: 50000 },
    { code: '1100', name: 'Bank Account', type: 'bank', isSystem: true, currentBalance: 250000 },
    { code: '1200', name: 'Accounts Receivable', type: 'receivable', isSystem: true, currentBalance: 0 },
    { code: '1300', name: 'Inventory Asset', type: 'asset', isSystem: true, currentBalance: 0 },
    { code: '2000', name: 'Accounts Payable', type: 'payable', isSystem: true, currentBalance: 0 },
    { code: '2100', name: 'GST Payable', type: 'tax', isSystem: true, currentBalance: 0 },
    { code: '2200', name: 'GST Receivable (Input Credit)', type: 'tax', isSystem: true, currentBalance: 0 },
    { code: '3000', name: 'Owner Equity', type: 'equity', isSystem: true, currentBalance: 300000 },
    { code: '4000', name: 'Sales Revenue', type: 'revenue', isSystem: true, currentBalance: 0 },
    { code: '4100', name: 'Other Income', type: 'revenue', isSystem: false, currentBalance: 0 },
    { code: '5000', name: 'Cost of Goods Sold', type: 'expense', isSystem: true, currentBalance: 0 },
    { code: '5100', name: 'Rent Expense', type: 'expense', isSystem: false, currentBalance: 0 },
    { code: '5200', name: 'Salary Expense', type: 'expense', isSystem: false, currentBalance: 0 },
    { code: '5300', name: 'Utilities Expense', type: 'expense', isSystem: false, currentBalance: 0 },
  ]);
  console.log('  ✓ Chart of Accounts created');

  // Demo sales invoices — bypass the pre-save number hook by supplying numbers directly
  // We use Transaction.collection.insertMany to skip Mongoose middleware and set numbers manually
  const today = new Date();
  const txnDocs = [];

  for (let i = 0; i < 12; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i * 15);
    const customer = customers[i % 2];
    const item = items[i % items.length];
    const price = parseFloat(item.sellingPrice) * (0.9 + Math.random() * 0.15);
    const qty = 10;
    const subtotal = +(price * qty).toFixed(2);
    const taxAmount = +(subtotal * 0.18).toFixed(2);

    txnDocs.push({
      _id: new mongoose.Types.ObjectId(),
      type: 'sales_invoice',
      number: `INV-2024-${String(i + 1).padStart(4, '0')}`,
      date: d,
      status: 'confirmed',
      contactId: customer._id,
      warehouseId: i % 3 === 0 ? wh2._id : wh1._id,
      createdById: i % 3 === 0 ? staff._id : admin._id,
      subtotal,
      taxAmount,
      grandTotal: +(subtotal + taxAmount).toFixed(2),
      paidAmount: 0,
      lines: [{
        itemId: item._id,
        quantity: qty,
        unitPrice: +price.toFixed(2),
        taxRate: 18,
        lineTotal: subtotal,
      }],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  await Transaction.collection.insertMany(txnDocs);
  console.log('  ✓ Demo transactions created');

  // LSP Config
  await LspConfig.create({
    customerId: customers[0]._id,
    itemId: items[1]._id,
    minPrice: 600,
    setById: admin._id,
    notes: 'Minimum price agreement for bulk orders',
  });
  console.log('  ✓ LSP config created');

  console.log('\n🎉 Seed complete!');
  console.log('   Admin login: admin@erp.com / admin123');
  console.log('   Staff login: staff@erp.com / staff123\n');

  await mongoose.disconnect();
}

seed().catch(err => { console.error('❌ Seed failed:', err); process.exit(1); });
