const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TransactionLine = sequelize.define('TransactionLine', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    transactionId: { type: DataTypes.UUID, allowNull: false },
    itemId: { type: DataTypes.UUID, allowNull: false },
    description: { type: DataTypes.STRING },
    quantity: { type: DataTypes.DECIMAL(10, 3), allowNull: false },
    unitPrice: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    discountPct: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
    discountAmount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    taxRate: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
    taxAmount: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
    lineTotal: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
    includeImage: { type: DataTypes.BOOLEAN, defaultValue: false },
    sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
  });

  return TransactionLine;
};
