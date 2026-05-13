// Load database plugin (must run before any model is defined)
require('../config/database');

const User         = require('./User');
const Contact      = require('./Contact');
const Item         = require('./Item');
const Warehouse    = require('./Warehouse');
const Inventory    = require('./Inventory');
const Transaction  = require('./Transaction');
const LspConfig    = require('./LspConfig');
const Account      = require('./Account');
const JournalEntry = require('./JournalEntry');
const StockMovement = require('./StockMovement');
const Counter      = require('./Counter');

module.exports = {
  User, Contact, Item, Warehouse, Inventory,
  Transaction, LspConfig, Account, JournalEntry,
  StockMovement, Counter,
};
