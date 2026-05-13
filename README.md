# Fynlo

A full-stack, browser-based Advanced Billing & ERP Software built for trading businesses. Manages the complete sales and purchase workflow, inventory, accounting, and includes four powerful custom features for smarter selling.

**Live Demo:**
- Frontend: https://erp-billing.netlify.app
- Backend API: https://erp-billing-system.onrender.com

---

## Features

### Core Modules
- **Contacts** — Customers and Suppliers with GST details
- **Inventory** — Items with images, multi-warehouse stock levels
- **Sales** — Quotation → Sales Order → Delivery Challan → Invoice → Credit Note
- **Purchases** — Purchase Order → GRN → Purchase Bill → Debit Note
- **POS** — Point of Sale for walk-in billing
- **Accounting** — Chart of Accounts, Journal Entries, Account Balances
- **Reports** — P&L, Balance Sheet, Stock Summary, Tax Report, Receivables, Payables, Sales Analysis
- **Dashboard** — Monthly sales, purchases, overdue receivables, low stock alerts

### Custom Features

**A — Price Memory**
Clock icon on every line item opens a modal showing the last 10 prices charged to that specific customer for that item — with date, invoice number, quantity, discount, store location, and staff name. One click to use any previous price.

**B — Visual Quotations & Purchase Orders**
Item images appear on Quotation and Purchase Order PDFs automatically. Images are stripped when converting to Sales Invoice or Purchase Bill — keeping formal documents clean.

**C — CRM Side Drawer**
A persistent right-side drawer opens when a customer is selected. Shows static profile info (party type, business type, city, personal preferences) and live analytics:
- **Frequently Bought** — top 5 items by quantity
- **Latest New Product** — most recent first-time purchase
- **Dropped Item Alert** — items bought regularly in the past but not in the last 90 days

**D — RBAC + Lowest Selling Price (LSP)**
- **Admin** sees cost prices, profit margins, and gross profit everywhere
- **Staff** has all cost/margin data scrubbed from both UI and API
- Admin sets a minimum price per customer+item. Staff pricing below that limit triggers a hard block requiring admin password override

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6, Zustand, Recharts |
| Backend | Node.js, Express.js, Mongoose |
| Database | MongoDB Atlas (M0 free tier) |
| Auth | JWT (jsonwebtoken), bcryptjs |
| PDF Generation | Puppeteer |
| File Uploads | Multer |
| Deployment | Netlify (frontend) + Render (backend) |

---

## Getting Started (Local Development)

### Prerequisites
- Node.js 18+
- A MongoDB Atlas account (free) with a cluster created

### 1. Clone the repository
```bash
git clone https://github.com/Nageshk88/erp-billing-system.git
cd erp-billing-system
```

### 2. Install dependencies
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 3. Configure environment variables
```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and fill in your MongoDB Atlas connection string and a JWT secret:
```
MONGODB_URI=mongodb://your-atlas-connection-string
JWT_SECRET=your_long_random_secret
JWT_EXPIRES_IN=8h
PORT=5000
NODE_ENV=development
```

### 4. Seed the database
```bash
cd backend && npm run seed
```

This creates demo users, customers, suppliers, items, stock, accounts, and sample transactions.

### 5. Start both servers
```bash
cd ..
npm run dev
```

- Backend: http://localhost:5000
- Frontend: http://localhost:5173

---

## Login Credentials (Demo)

| Role | Email | Password |
|---|---|---|
| Admin | admin@erp.com | admin123 |
| Staff | staff@erp.com | staff123 |

---

## Project Structure

```
erp-billing-system/
├── backend/
│   ├── server.js
│   ├── src/
│   │   ├── config/        # MongoDB connection
│   │   ├── controllers/   # Route handlers
│   │   ├── middleware/    # Auth, error handler
│   │   ├── models/        # Mongoose schemas
│   │   ├── routes/        # Express routes
│   │   ├── services/      # Price memory, CRM analytics, PDF
│   │   └── seed/          # Demo data seeder
│   └── .env.example
│
├── frontend/
│   └── src/
│       ├── components/    # Reusable UI (TransactionForm, CrmDrawer, PriceMemoryModal)
│       ├── pages/         # All page views
│       ├── services/      # Axios API layer
│       └── store/         # Zustand state (auth, UI)
│
├── render.yaml            # Render deployment config
└── netlify.toml           # Netlify deployment config
```

---

## Deployment

This project is deployed using:
- **Netlify** for the React frontend (auto-deploys on every push to `master`)
- **Render** for the Node.js backend (free tier — wakes up in ~30s after inactivity)
- **MongoDB Atlas** for the database (M0 free cluster)

### Environment Variables Required

**Render (Backend):**
| Key | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas direct connection string |
| `JWT_SECRET` | Random secret for signing tokens |
| `JWT_EXPIRES_IN` | Token expiry e.g. `8h` |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | Your Netlify URL for CORS |

**Netlify (Frontend):**
| Key | Description |
|---|---|
| `VITE_API_URL` | Your Render URL + `/api` |

---

## API Overview

```
POST   /api/auth/login
GET    /api/contacts
GET    /api/items
GET    /api/sales?type=sales_invoice
POST   /api/sales
POST   /api/sales/:id/convert
GET    /api/sales/:id/pdf
GET    /api/sales/price-memory?customerId=X&itemId=Y
GET    /api/purchases
GET    /api/crm/:customerId/analytics
GET    /api/reports/dashboard
GET    /api/reports/profit-loss
GET    /api/reports/receivables
GET    /api/warehouses
GET    /api/lsp
GET    /health
```

---

## License

MIT
