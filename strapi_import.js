const csv = require('csv-parser');
const axios = require('axios');
const fs = require('fs');

const apiUrl = 'http://localhost:1337/api';
const authToken = 'bearer 5ab6e6018dc58f726fa232c51e56f4957036c6cdd67e077b18aad0a872e6227a6bd18c0d90820abeff06becc93675a4fc8ea7244b92b90947759c517c6f33c974730c9d5ff4e0408b5106df2c8fa791a42a2a35142e2a9c8bab819557120072809771920ef6afd5e9e336dfb30ba766661435a2e9a2bb03d34cfcaf89cd81814';

async function importBankInfo() {
  fs.createReadStream('./general/bank_info.csv')
    .pipe(csv())
    .on('data', async (row) => {
      const {name_card, card_number, expiry_month, expiry_year, cvv } = row;
      const data = {
        name_card: name_card,
        card_number: card_number,
        expiry_month: parseInt(expiry_month),
        expiry_year: parseInt(expiry_year),
        cvv: cvv
      };
      console.log(data);
      const headers = {
        'Authorization': authToken
      };
      let endpoint = '/bank-infos';
      const url = `${apiUrl}${endpoint}`
      try {
        const response = await axios.post(url, { data }, { headers });
        console.log(`POST ${url} - ${response.status} ${response.statusText}`);
      } catch (err) {
        console.error(`POST ${url} - ${err.response.status} ${err.response.statusText}`);
        console.log(err.response.data);
      }
    })
    .on('end', () => {
      console.log('Finished processing CSV file');
    });
}

async function importProxies() {
    fs.readFile('./general/proxies.csv', 'utf8', async (err, data) => {
      if (err) {
        console.error(err);
        return;
      }
      const lines = data.trim().split('\n');
      for (const line of lines) {
        const [host, port, user, pass] = line.split(':');
        const country = user.split('-')[2];
        const data = {
          host: host,
          port: port,
          user: user,
          pass: pass,
          country: "FR"
        };
        const headers = {
          'Authorization': authToken
        };
        let endpoint = '/proxies';
        const url = `${apiUrl}${endpoint}`
        try {
          const response = await axios.post(url, { data }, { headers });
          console.log(`POST ${url} - ${response.status} ${response.statusText}`);
        } catch (err) {
          console.error(`POST ${url} - ${err.response.status} ${err.response.statusText}`);
        }
      }
    });
}

async function importUserInfo() {
    fs.readFile('./IK/user_info_IK.csv', 'utf8', async (err, data) => {
      if (err) {
        console.error(err);
        return;
      }
      const lines = data.trim().split('\n');
      for (const line of lines) {
        const [id_user, email, country, first_name, last_name, address, city, zip, phone] = line.split(',');
        const data = {
          email: email,
          country: country,
          first_name: first_name,
          last_name: last_name,
          address: address,
          city: city,
          zip: parseInt(zip),
          phone: phone,
          client_order: 1,
          used: true
        };
        const headers = {
          'Authorization': authToken
        };
        let endpoint = '/address-infos';
        const url = `${apiUrl}${endpoint}`;
        try {
          const response = await axios.post(url, { data }, { headers });
          console.log(`POST ${url} - ${response.status} ${response.statusText}`);
        } catch (err) {
          console.error(`POST ${url} - ${err.response.status} ${err.response.statusText}`);
        }
      }
    });
  }
  
importUserInfo();

//importProxies();
//importBankInfo();