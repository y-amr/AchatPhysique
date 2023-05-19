const mysql = require('mysql2/promise');
const { BankInfo, UserInfo, Order } = require('./models');
// Créez une connexion à votre base de données.
const db = mysql.createPool({
  host: '34.27.86.127', // remplacez par l'adresse de votre base de données Cloud SQL
  user: 'yanis', // remplacez par votre nom d'utilisateur
  password: 'yanis', // remplacez par votre mot de passe
  database: 'streaming_physique', // remplacez par le nom de votre base de données
});

const initializeDatabase = async () => {
  try {
    // Créer la table bank_info
    await db.query(`
      CREATE TABLE IF NOT EXISTS bank_info (
        id_card INT PRIMARY KEY AUTO_INCREMENT,
        name_card VARCHAR(255),
        card_number VARCHAR(255),
        expiry_month INT,
        expiry_year INT,
        cvv VARCHAR(4)
      )
    `);

    // Créer la table user_info
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_info (
        id_user INT PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(255),
        country VARCHAR(255),
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        address VARCHAR(255),
        city VARCHAR(255),
        zip VARCHAR(255),
        phone VARCHAR(255)
      )
    `);

    // Créer la table orders
    await db.query(`
      CREATE TABLE IF NOT EXISTS orders (
        order_number INT PRIMARY KEY AUTO_INCREMENT,
        date DATE,
        time TIME,
        id_user INT,
        id_card INT,
        status VARCHAR(255),
        FOREIGN KEY(id_user) REFERENCES user_info(id_user),
        FOREIGN KEY(id_card) REFERENCES bank_info(id_card)
      )
    `);
  } catch (error) {
    console.error(`Error initializing database: ${error}`);
  }
};

//initializeDatabase();
  
async function createBankInfo() {
    const bankInfo = await BankInfo.create({
      name_card: 'BOT',
      card_number: '5354562823609649',
      expiry_month: 5,
      expiry_year: 2028,
      cvv: '018'
    });
  
    return bankInfo;
  }
  createBankInfo();

  async function getRandomBankInfo() {
    const bankInfo = await BankInfo.findOne({ order: Sequelize.literal('rand()') });
    console.log(bankInfo);
    return bankInfo;
  }

console.log(getRandomBankInfo());
