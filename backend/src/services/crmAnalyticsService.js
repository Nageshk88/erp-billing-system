const { Transaction } = require('../models');
const { Types } = require('mongoose');

const SALE_TYPES = ['sales_invoice', 'pos'];
const CONFIRMED  = ['confirmed', 'complete'];

/**
 * Feature C — Frequently bought items (top 5 by total qty)
 */
async function getFrequentlyBought(customerId, limit = 5) {
  const results = await Transaction.aggregate([
    {
      $match: {
        contactId: new Types.ObjectId(customerId),
        type: { $in: SALE_TYPES },
        status: { $in: CONFIRMED },
      },
    },
    { $unwind: '$lines' },
    {
      $group: {
        _id: '$lines.itemId',
        totalQty: { $sum: '$lines.quantity' },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { totalQty: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'items',
        localField: '_id',
        foreignField: '_id',
        as: 'itemArr',
      },
    },
    { $unwind: '$itemArr' },
    {
      $project: {
        totalQty: 1,
        orderCount: 1,
        item: {
          id: { $toString: '$itemArr._id' },
          name: '$itemArr.name',
          sku: '$itemArr.sku',
          imageUrl: '$itemArr.imageUrl',
          uom: '$itemArr.uom',
        },
      },
    },
  ]);
  return results;
}

/**
 * Feature C — Latest new product (most recent first-ever purchase of any item)
 */
async function getLatestNewProduct(customerId) {
  const results = await Transaction.aggregate([
    {
      $match: {
        contactId: new Types.ObjectId(customerId),
        type: { $in: SALE_TYPES },
        status: { $in: CONFIRMED },
      },
    },
    { $unwind: '$lines' },
    {
      $group: {
        _id: '$lines.itemId',
        firstPurchaseDate: { $min: '$date' },
      },
    },
    { $sort: { firstPurchaseDate: -1 } },
    { $limit: 1 },
    {
      $lookup: {
        from: 'items',
        localField: '_id',
        foreignField: '_id',
        as: 'itemArr',
      },
    },
    { $unwind: '$itemArr' },
    {
      $project: {
        firstPurchaseDate: 1,
        item: {
          id: { $toString: '$itemArr._id' },
          name: '$itemArr.name',
          sku: '$itemArr.sku',
          imageUrl: '$itemArr.imageUrl',
        },
      },
    },
  ]);
  return results[0] || null;
}

/**
 * Feature C — Dropped Item Alert
 * Items bought 3+ times in the 90–365 day window but NOT in the last 90 days.
 */
async function getDroppedItems(customerId) {
  const today = new Date();
  const cut90  = new Date(today); cut90.setDate(today.getDate() - 90);
  const cut365 = new Date(today); cut365.setDate(today.getDate() - 365);

  // Items with 3+ orders in the 90–365 day window
  const historic = await Transaction.aggregate([
    {
      $match: {
        contactId: new Types.ObjectId(customerId),
        type: { $in: SALE_TYPES },
        status: { $in: CONFIRMED },
        date: { $gte: cut365, $lt: cut90 },
      },
    },
    { $unwind: '$lines' },
    {
      $group: {
        _id: '$lines.itemId',
        purchaseCount: { $sum: 1 },
      },
    },
    { $match: { purchaseCount: { $gte: 3 } } },
  ]);

  if (!historic.length) return [];

  const historicIds = historic.map(h => h._id);

  // Of those, which were bought in the last 90 days?
  const recent = await Transaction.aggregate([
    {
      $match: {
        contactId: new Types.ObjectId(customerId),
        type: { $in: SALE_TYPES },
        status: { $in: CONFIRMED },
        date: { $gte: cut90 },
      },
    },
    { $unwind: '$lines' },
    { $match: { 'lines.itemId': { $in: historicIds } } },
    { $group: { _id: '$lines.itemId' } },
  ]);

  const recentSet = new Set(recent.map(r => r._id.toString()));

  const droppedIds = historicIds.filter(id => !recentSet.has(id.toString()));
  if (!droppedIds.length) return [];

  // Fetch item details
  const items = await require('../models').Item.find({ _id: { $in: droppedIds } })
    .select('name sku imageUrl uom');

  const countMap = Object.fromEntries(historic.map(h => [h._id.toString(), h.purchaseCount]));

  return items.map(item => ({
    item: item.toJSON(),
    purchaseCount: countMap[item._id.toString()] || 0,
    lastSeenDaysAgo: 90,
  }));
}

module.exports = { getFrequentlyBought, getLatestNewProduct, getDroppedItems };
