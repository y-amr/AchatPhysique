const { Sequelize, DataTypes, Model } = require('sequelize');
const sequelize = require('./ConfDB');

class UserInfo extends Model {}

UserInfo.init({
  id_user: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING(255),
  },
  country: {
    type: DataTypes.STRING(255)
  },
  first_name: {
    type: DataTypes.STRING(255),
  },
  last_name: {
    type: DataTypes.STRING(255),
  },
  address: {
    type: DataTypes.STRING(255),
  },
  city: {
    type: DataTypes.STRING(255),
  },
  zip: {
    type: DataTypes.STRING(255),
  },
  phone: {
    type: DataTypes.STRING(255),
  },
}, {
  sequelize, // Instance de la connexion à la base de données
  modelName: 'UserInfo', // Nom du modèle
  tableName: 'user_info' // Nom de la table
});

module.exports = UserInfo;