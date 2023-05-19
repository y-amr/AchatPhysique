const { Sequelize, DataTypes, Model } = require('sequelize');
const sequelize = require('./ConfDB');

class BankInfo extends Model {}

BankInfo.init({
  id_card: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name_card: {
    type: DataTypes.STRING
  },
  card_number: {
    type: DataTypes.STRING
  },
  expiry_month: {
    type: DataTypes.INTEGER
  },
  expiry_year: {
    type: DataTypes.INTEGER
  },
  cvv: {
    type: DataTypes.STRING
  }
}, {
  sequelize,
  modelName: 'BankInfo',
  tableName: 'bank_info',
  timestamps: false
});
module.exports = BankInfo;