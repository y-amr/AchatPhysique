const { Sequelize } = require('sequelize');

// Option 1: Passing a connection URI
// const sequelize = new Sequelize('mysql://user:pass@localhost:3306/dbname');

// Option 2: Passing parameters separately (other dialects)
const sequelize = new Sequelize('streaming_physique', 'yanis', 'yanis', {
    host: '34.27.86.127',
    dialect: 'mysql'
  });

module.exports = sequelize;
