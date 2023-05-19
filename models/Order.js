
const { Sequelize, DataTypes, Model } = require('sequelize');
const sequelize = require('./ConfDB');

class Order extends Model {}

Order.init({
  order_number: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  date: {
    type: DataTypes.DATEONLY,
  },
  time: {
    type: DataTypes.TIME
  },
  id_user: {
    type: DataTypes.INTEGER,
    references: {
      model: 'user_info', // Nom de la table de référence
      key: 'id_user' // Clé de la table de référence
    }
  },
  id_card: {
    type: DataTypes.INTEGER,
    references: {
      model: 'bank_info', // Nom de la table de référence
      key: 'id_card' // Clé de la table de référence
    }
  },
  status: {
    type: DataTypes.STRING(255),
  }
}, {
  sequelize, // Instance de la connexion à la base de données
  modelName: 'Order', // Nom du modèle
  tableName: 'orders' // Nom de la table
});

module.exports = Order;