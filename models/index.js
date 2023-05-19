const BankInfo = require('./BankInfo');
const UserInfo = require('./UserInfo');
const Order = require('./Order');


// Define relationships
UserInfo.hasMany(Order, { foreignKey: 'id_user' });
Order.belongsTo(UserInfo, { foreignKey: 'id_user' });

BankInfo.hasMany(Order, { foreignKey: 'id_card' });
Order.belongsTo(BankInfo, { foreignKey: 'id_card' });

module.exports = {
  BankInfo,
  UserInfo,
  Order
};