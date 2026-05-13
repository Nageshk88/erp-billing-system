# ERP Billing System — Full Build Conversation Log

> **Session Date:** 2026-05-13  
> **AI Assistant:** Claude Sonnet 4.6 (Claude Code)  
> **Project Path:** `D:\Projects\erp-billing-system`

---

## 1. Initial Request

**User:** Build a complete, browser-based Advanced Billing and ERP Software for a trading business.

### Requirements Given

**Tech Stack:**
- React.js frontend
- Node.js / Express backend
- PostgreSQL / MySQL database (switched to SQLite for zero-install, then migrated to MongoDB Atlas)

**Core Modules:**
- Contacts (Customers + Suppliers)
- Inventory (Items, Warehouses, Stock)
- Sales Workflow: Quotation → Sales Order → Delivery Challan → Sales Invoice → POS → Credit Note
- Purchase Workflow: Purchase Order → GRN → Purchase Bill → Debit Note
- Financial Accounting (Chart of Accounts, Journal Entries)
- Reports (P&L, Balance Sheet, Stock Summary, Tax, Receivables, Payables, Sales Analysis)

---

## 2. Four Custom Features

### Feature A — Price Memory
When selecting a Customer + Item in any sales form, a clock icon appears on each line item. Clicking it opens a modal that fetches the **last 10 transaction prices** for that specific customer + item combination.

**Modal columns:** Date | Invoice No. | Unit Price | Qty | Discount % | Line Total | Store Location | Staff Name

A **"Use Price"** button fills the price into the form line.

**Implementation:** MongoDB aggregation pipeline in `backend/src/services/priceMemoryService.js`
- `$match` by contactId + sale types + confirmed status
- `$unwind` lines
- `$match` by lines.itemId
- `$sort` date desc → `$limit 10`
- `$lookup` warehouse + user names

---

### Feature B — Visual Quotations / Purchase Orders
Item images appear on **Quotation and Purchase Order PDFs only**.

**Key rule:** Images are **automatically stripped** when converting to Sales Invoice or Purchase Bill.

**Implementation:** `backend/src/services/pdfService.js`
```js
const INCLUDE_IMAGE_TYPES = ['quotation', 'sales_order', 'purchase_order', 'delivery_challan'];
// Images only included if transaction.type is in this list
```

PDF generated with Puppeteer (HTML fallback if Puppeteer fails).

---

### Feature C — CRM Side Drawer
A **persistent right-side collapsible drawer** that opens when a customer is selected in any transaction form or the customer list.

**Static section (editable):**
- Party Type (Wholesaler / Retailer / End User)
- Business Type
- City / Location
- Personal Preferences (free text — e.g. "Prefers bulk orders, call before 11am")

**Dynamic section (live from DB):**
- **Frequently Bought:** Top 5 items by total quantity across all confirmed invoices
- **Latest New Product:** The most recent item this customer purchased for the first time ever
- **Dropped Item Alert:** Items bought 3+ times in the 90–365 day window but NOT in the last 90 days — signals the customer may have switched supplier

**Implementation:** `backend/src/services/crmAnalyticsService.js` with three separate MongoDB aggregation pipelines.

---

### Feature D — RBAC + LSP (Lowest Selling Price)

**Role-Based Access Control:**
- `admin` role: sees cost prices, profit margins, gross profit in UI and API
- `staff` role: cost prices and margins are **scrubbed from both UI and API responses** — staff cannot see them even by inspecting network requests

**LSP (Lowest Selling Price):**
- Admin sets a minimum price per Customer + Item combination (stored in `LspConfig` collection)
- When staff enters a price below the LSP, the API returns error code `LSP_VIOLATION`
- A hard block appears in the UI requiring Admin override (admin enters their password to approve)

**Implementation:**
- `backend/src/middleware/auth.js` — injects `res.locals.hideCostPrice = (req.user.role === 'staff')`
- `backend/src/controllers/itemsController.js` — strips `costPrice`, `profitMargin` if `hideCostPrice`
- `backend/src/routes/lsp.js` — CRUD for LSP configs (admin only)
- `backend/src/controllers/salesController.js` — LSP check on every line item before saving

---

## 3. Database Decision

**Initial:** SQLite (zero-install, no PostgreSQL/MySQL found on system)
- Used Sequelize ORM
- Data file: `backend/data/erp.sqlite`
- Server started with `sequelize.sync({ alter: true })` — caused `FOREIGN KEY constraint` errors after seeding; fixed by changing to `sequelize.sync()`

**Migration (Session 2):** Moved to **MongoDB Atlas M0** (free tier)

**Reason:** User requested MongoDB Atlas.

**Connection string issue:** The system DNS (`10.128.128.128`) times out on SRV record queries. The `mongodb+srv://` URI format uses SRV DNS, so it fails.

**Fix:** Used Google DNS (`8.8.8.8`) to manually resolve the SRV and TXT records, then built a direct node URI:
```
mongodb://user:pass@ac-knwqxdv-shard-00-00.ngfwmyo.mongodb.net:27017,
ac-knwqxdv-shard-00-01.ngfwmyo.mongodb.net:27017,
ac-knwqxdv-shard-00-02.ngfwmyo.mongodb.net:27017/erp_billing
?ssl=true&replicaSet=atlas-b0x51v-shard-0&authSource=admin&retryWrites=true&w=majority
```
This bypasses SRV entirely.

**Atlas Network Access:** Added `0.0.0.0/0` (allow all) in Atlas → Security → Network Access for development.

---

## 4. Full MongoDB Migration — What Changed

### Removed
- `sequelize`, `sqlite3`, `pg`, `pg-hstore`, `mysql2` packages
- `backend/src/models/TransactionLine.js` (became embedded subdocument in Transaction)
- All Sequelize model definitions, associations, `Op`, `fn`, `col`, `literal` calls

### Added
- `mongoose ^8.5.1`
- `backend/src/models/Counter.js` — atomic sequence counter for transaction numbers

### Rewritten Files

| File | Change |
|---|---|
| `backend/src/config/database.js` | Mongoose connect + global toJSON plugin |
| `backend/server.js` | `await connect()` instead of `sequelize.sync()` |
| `backend/src/middleware/auth.js` | `User.findById()` instead of `findByPk()` |
| `backend/src/middleware/errorHandler.js` | Handles Mongoose `ValidationError`, `CastError`, duplicate key `11000` |
| All 8 model files | Full Mongoose Schema rewrites |
| All controllers | Mongoose queries, aggregation pipelines for reports |
| `backend/src/routes/warehouses.js` | `Warehouse.find()`, `findById()`, `save()` |
| `backend/src/routes/lsp.js` | `LspConfig.findOneAndUpdate({ upsert: true })` |
| `backend/src/services/priceMemoryService.js` | Full aggregation pipeline |
| `backend/src/services/crmAnalyticsService.js` | 3 aggregation pipelines |
| `backend/src/seed/index.js` | `mongoose.connect()`, `insertMany()`, `deleteMany()` |

### Key Mongoose Patterns Used

**Global toJSON plugin** (in `config/database.js`):
```js
mongoose.plugin((schema) => {
  schema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id?.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  });
});
```

**Atomic transaction numbers** (Counter model):
```js
// In Transaction pre-save hook:
const counter = await Counter.findByIdAndUpdate(
  `${this.type}_${year}`,
  { $inc: { seq: 1 } },
  { new: true, upsert: true }
);
this.number = `${prefix}-${year}-${String(counter.seq).padStart(4, '0')}`;
// Produces: INV-2026-0001, POS-2026-0001, etc.
```

**normalizeTxn() helper** (in salesController + purchasesController):
```js
function normalizeTxn(txn) {
  const obj = txn.toJSON ? txn.toJSON() : txn;
  obj.contact   = obj.contactId;
  obj.warehouse = obj.warehouseId;
  obj.createdBy = obj.createdById;
  if (obj.lines) obj.lines = obj.lines.map(l => ({ ...l, item: l.itemId }));
  return obj;
}
```
This maps MongoDB's `contactId`/`warehouseId` references to the field names the frontend expects (`contact`, `warehouse`) — zero frontend changes required during migration.

**MongoDB sessions for atomicity:**
```js
const session = await mongoose.startSession();
session.startTransaction();
try {
  // create transaction + update inventory in one atomic operation
  await session.commitTransaction();
} catch (e) {
  await session.abortTransaction();
  throw e;
} finally {
  session.endSession();
}
```

---

## 5. Project File Structure

```
erp-billing-system/
├── package.json              ← root, runs both servers with concurrently
├── START.ps1                 ← one-click Windows setup script
├── .gitignore
├── CONVERSATION_LOG.md       ← this file
│
├── backend/
│   ├── package.json          ← mongoose, express, bcryptjs, jwt, multer, puppeteer
│   ├── server.js             ← entry point, mongoose connect, Express setup
│   ├── .env                  ← MONGODB_URI, JWT_SECRET, PORT=5000
│   ├── .env.example
│   ├── uploads/              ← item images (multer)
│   └── src/
│       ├── config/
│       │   └── database.js   ← mongoose.connect() + global toJSON plugin
│       ├── models/
│       │   ├── index.js      ← exports all models
│       │   ├── User.js       ← bcrypt pre-save hook, validatePassword()
│       │   ├── Contact.js    ← CRM fields: partyType, businessType, personalPreferences
│       │   ├── Item.js       ← imageUrl field for Feature B
│       │   ├── Warehouse.js
│       │   ├── Inventory.js  ← compound unique index {itemId, warehouseId}
│       │   ├── StockMovement.js
│       │   ├── Transaction.js ← embedded LineSchema, auto-number pre-save hook
│       │   ├── Counter.js    ← atomic sequence {_id: String, seq: Number}
│       │   ├── LspConfig.js  ← compound unique index {customerId, itemId}
│       │   ├── Account.js
│       │   └── JournalEntry.js ← embedded JournalLineSchema
│       ├── middleware/
│       │   ├── auth.js       ← JWT verify, hideCostPrice for staff
│       │   ├── errorHandler.js ← Mongoose error normalizer
│       │   └── upload.js     ← multer config
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── contactsController.js
│       │   ├── itemsController.js    ← scrubs costPrice for staff
│       │   ├── inventoryController.js
│       │   ├── salesController.js    ← LSP check, normalizeTxn, Feature B strip images
│       │   ├── purchasesController.js
│       │   ├── accountingController.js
│       │   ├── reportsController.js  ← all MongoDB aggregation pipelines
│       │   └── crmController.js      ← delegates to crmAnalyticsService
│       ├── routes/
│       │   ├── auth.js
│       │   ├── contacts.js
│       │   ├── items.js
│       │   ├── inventory.js
│       │   ├── sales.js
│       │   ├── purchases.js
│       │   ├── accounting.js
│       │   ├── reports.js
│       │   ├── crm.js
│       │   ├── warehouses.js  ← Warehouse.find(), findById(), save()
│       │   └── lsp.js         ← findOneAndUpdate({upsert:true}), requireAdmin
│       ├── services/
│       │   ├── priceMemoryService.js  ← Feature A aggregation pipeline
│       │   ├── crmAnalyticsService.js ← Feature C: 3 aggregation pipelines
│       │   └── pdfService.js          ← Feature B: Puppeteer PDF, INCLUDE_IMAGE_TYPES
│       └── seed/
│           └── index.js       ← clears + re-seeds all Atlas collections
│
└── frontend/
    ├── package.json          ← React 18, Vite, Tailwind, React Router v6, Zustand, Recharts
    ├── vite.config.js        ← proxy: /api → localhost:5000
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── App.jsx           ← all routes, protected route wrapper
        ├── main.jsx
        ├── services/
        │   └── api.js        ← all Axios API calls
        ├── store/
        │   ├── authStore.js  ← Zustand: user, token, role
        │   └── uiStore.js    ← Zustand: sidebar, CRM drawer state
        ├── components/
        │   ├── common/
        │   │   └── TransactionForm.jsx  ← LSP check, clock icon for Price Memory
        │   ├── sales/
        │   │   └── PriceMemoryModal.jsx ← Feature A modal
        │   └── crm/
        │       └── CrmDrawer.jsx        ← Feature C right-side drawer
        └── pages/
            ← all page components (Dashboard, Contacts, Items, Sales, etc.)
```

---

## 6. API Endpoints

### Auth
```
POST   /api/auth/login
GET    /api/auth/me
PUT    /api/auth/change-password
```

### Contacts
```
GET    /api/contacts?type=customer&search=sunrise&page=1&limit=20
POST   /api/contacts
GET    /api/contacts/:id
PUT    /api/contacts/:id
DELETE /api/contacts/:id
```

### Items
```
GET    /api/items?search=mouse&category=Peripherals
POST   /api/items
PUT    /api/items/:id
DELETE /api/items/:id
POST   /api/items/:id/image      ← multer upload
```

### Sales
```
GET    /api/sales?type=sales_invoice&status=confirmed
POST   /api/sales
GET    /api/sales/:id
PUT    /api/sales/:id
POST   /api/sales/:id/confirm
POST   /api/sales/:id/convert    ← converts Quotation→Order, Order→Challan, etc.
GET    /api/sales/:id/pdf
POST   /api/sales/:id/payment
GET    /api/sales/price-memory?customerId=X&itemId=Y   ← Feature A
```

### Purchases
```
GET    /api/purchases?type=purchase_bill
POST   /api/purchases
GET    /api/purchases/:id
PUT    /api/purchases/:id
POST   /api/purchases/:id/confirm
POST   /api/purchases/:id/convert
POST   /api/purchases/:id/payment
```

### CRM (Feature C)
```
GET    /api/crm/:customerId/profile
PUT    /api/crm/:customerId/profile
GET    /api/crm/:customerId/analytics          ← all 3 in one call
GET    /api/crm/:customerId/frequently-bought
GET    /api/crm/:customerId/dropped-items
GET    /api/crm/:customerId/latest-new-product
```

### LSP (Feature D)
```
GET    /api/lsp
POST   /api/lsp                   ← admin only, upserts
DELETE /api/lsp/:id               ← admin only
GET    /api/lsp/check?customerId=X&itemId=Y&price=500
```

### Reports
```
GET    /api/reports/dashboard
GET    /api/reports/profit-loss?from=2026-01-01&to=2026-05-13
GET    /api/reports/balance-sheet
GET    /api/reports/stock-summary
GET    /api/reports/tax?from=&to=
GET    /api/reports/receivables
GET    /api/reports/payables
GET    /api/reports/sales-analysis?from=&to=
```

### Accounting
```
GET    /api/accounting/accounts
POST   /api/accounting/accounts
PUT    /api/accounting/accounts/:id
GET    /api/accounting/journal?from=&to=&page=1&limit=50
POST   /api/accounting/journal
GET    /api/accounting/journal/:id
```

### Warehouses
```
GET    /api/warehouses
POST   /api/warehouses
PUT    /api/warehouses/:id
```

### Inventory
```
GET    /api/inventory
POST   /api/inventory/adjust     ← stock adjustment with session
GET    /api/inventory/movements
```

---

## 7. Demo Data (Seed)

**Users:**
- admin@erp.com / admin123 (role: admin)
- staff@erp.com / staff123 (role: staff)

**Warehouses:** Main Warehouse, Store

**Customers:**
- CUST-001: Sunrise Traders (Mumbai, Wholesaler)
- CUST-002: Metro Stores (Delhi, Retailer)
- CUST-003: Global Tech Solutions (Bangalore, End User)
- CUST-004: Allied Components (Chennai, Wholesaler)

**Suppliers:**
- SUPP-001: Prime Electronics Pvt Ltd (China)
- SUPP-002: BharatMart Distributors (Surat)

**Items (8):** USB-C Cable, Wireless Mouse, HDMI Cable, Laptop Stand, Mechanical Keyboard, USB Hub, Screen Cleaning Kit, Monitor 24"

**Inventory:** Random stock across both warehouses for all items

**Chart of Accounts (14):** Cash, Bank, AR, Inventory Asset, AP, GST Payable, GST Receivable, Owner Equity, Sales Revenue, Other Income, COGS, Rent, Salary, Utilities

**Demo Transactions:** 12 confirmed sales invoices spread over last 180 days (alternating CUST-001 and CUST-002, cycling through all items) — powers Price Memory and CRM analytics

**LSP Config:** Wireless Mouse for CUST-001 (Sunrise Traders) minimum price = ₹600

---

## 8. How to Run

### Prerequisites
- Node.js 18+
- Internet connection (MongoDB Atlas)

### First-time setup
```powershell
# From project root
npm install                      # install concurrently
cd backend && npm install        # install backend deps
cd ../frontend && npm install    # install frontend deps

# Seed the database
cd ../backend && npm run seed
```

### Start servers
```powershell
# Option 1: Both at once from root
cd d:\Projects\erp-billing-system
npm run dev

# Option 2: Separate terminals
# Terminal 1:
cd backend && npm run dev        # → http://localhost:5000

# Terminal 2:
cd frontend && npm run dev       # → http://localhost:5173
```

### Re-seed (reset all data)
```powershell
cd backend && npm run seed
```

---

## 9. Known Issues / Notes

1. **MongoDB SRV DNS:** System DNS (`10.128.128.128`) blocks SRV record lookups. The `mongodb+srv://` URI format fails. Use the direct node URI in `.env` (already configured).

2. **Atlas Network Access:** `0.0.0.0/0` added for development. For production, whitelist only your server's IP.

3. **Puppeteer on first run:** Puppeteer downloads Chromium (~150MB) on first install. If PDF generation fails, it falls back to HTML download.

4. **Frontend port:** Vite auto-increments port if 5173 is in use → may start on 5174 or 5175. Check terminal output.

5. **Windows PowerShell:** The `START.ps1` script handles one-click startup. If it fails due to ExecutionPolicy, run: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

---

## 10. Next Steps Discussed

- **Deployment:** Frontend → Netlify, Backend → Render.com (free tier), Database → MongoDB Atlas (already live)
  - Needs: `render.yaml`, `netlify.toml`, update `api.js` to point at Render URL
  - Push to GitHub → connect both platforms

---

*Generated by Claude Code — Anthropic Claude Sonnet 4.6*  
*Session: 2026-05-13*
