const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const csv = require('csv-parser');

const getNumberOfOrders = () => new Promise((resolve, reject) => {
  let numOrders = 0;
  
  fs.createReadStream('./order_IK_PR.csv')
    .pipe(csv())
    .on('data', () => {
      numOrders++;
    })
    .on('end', () => {
      resolve(numOrders);
    })
    .on('error', reject);
});




const create_record = async (data, order_number) => {
  //console.log(data)
  const csvWriter = createCsvWriter({
    path: './order_IK_PR.csv',
    header: [
      {id: 'order_number', title: 'ORDER_NUMBER'},
      {id: 'date', title: 'DATE'},
      {id: 'time', title: 'TIME'},
      {id: 'EMAIL', title: 'EMAIL'},
      {id: 'COUNTRY', title: 'COUNTRY'},
      {id: 'FIRST_NAME', title: 'FIRST_NAME'},
      {id: 'LAST_NAME', title: 'LAST_NAME'},
      {id: 'ADDRESS', title: 'ADDRESS'},
      {id: 'CITY', title: 'CITY'},
      {id: 'ZIP', title: 'ZIP'},
      {id: 'PHONE', title: 'PHONE'},
      {id: 'id_card', title: 'ID_CARD'},
      {id: 'status', title: 'STATUS'},
      {id: 'NUMBER_PACK', title: 'NUMBER_PACK'},
      {id: 'NUMBER_STANDARD', title: 'NUMBER_STANDARD'},
      {id: 'NUMBER_EXCLUSIVE', title: 'NUMBER_EXCLUSIVE'},
      {id: 'PRICE', title: 'PRICE'},
      {id: 'MONDIALRELAIS', title: 'MONDIALRELAIS'},

    ],
    append: true // Si true, ajoute au fichier existant, sinon remplace le fichier
  });



  const now = new Date();
  now.setHours(now.getHours() + 2);
  const date = `${now.getUTCFullYear()}-${now.getUTCMonth()+1}-${now.getUTCDate()}`;
  const time = `${now.getUTCHours()}:${now.getUTCMinutes()}:${now.getUTCSeconds()}`;
  console.log(`Date: ${date}, Time: ${time}`);
  

  const record = {
    order_number: String(order_number),
    date,
    time,
    ...data,
    status: 'pending'
  };
  //console.log(record);
  console.log("ORDER CREATED");
  return csvWriter.writeRecords([record]);
};

const updateOrderStatus = async (order_number, newStatus) => {
  const orders = [];

  // Read the CSV file line by line
  fs.createReadStream('./order_IK_PR.csv')
    .pipe(csv({
      mapHeaders: ({ header, index }) => header.trim()  // Trim spaces from header names
    }))
    .on('data', (row) => {
      // If this is the order we want to update, change the status
      if(row['ORDER_NUMBER'] === String(order_number)) {  // Use trimmed header name
        row['STATUS'] = newStatus;  // Use trimmed header name
      }


      // Push the row object, not a string
      orders.push(row);
    })
    .on('end', () => {
      // We have now finished reading the CSV file, so we can write the updated data back to it
      const csvWriter = createCsvWriter({
        path: './order_IK_PR.csv',
        header: [
          {id: 'ORDER_NUMBER', title: 'ORDER_NUMBER'},
          {id: 'DATE', title: 'DATE'},
          {id: 'TIME', title: 'TIME'},
          {id: 'EMAIL', title: 'EMAIL'},
          {id: 'COUNTRY', title: 'COUNTRY'},
          {id: 'FIRST_NAME', title: 'FIRST_NAME'},
          {id: 'LAST_NAME', title: 'LAST_NAME'},
          {id: 'ADDRESS', title: 'ADDRESS'},
          {id: 'CITY', title: 'CITY'},
          {id: 'ZIP', title: 'ZIP'},
          {id: 'PHONE', title: 'PHONE'},
          {id: 'ID_CARD', title: 'ID_CARD'},
          {id: 'STATUS', title: 'STATUS'},
          {id: 'NUMBER_PACK', title: 'NUMBER_PACK'},
          {id: 'NUMBER_STANDARD', title: 'NUMBER_STANDARD'},
          {id: 'NUMBER_EXCLUSIVE', title: 'NUMBER_EXCLUSIVE'},
          {id: 'PRICE', title: 'PRICE'},
          {id: 'MONDIALRELAIS', title: 'MONDIALRELAIS'},
        ]
      });
      csvWriter
      .writeRecords(orders) // returns a promise
      .then(() => {
        console.log("ORDER UPDATED (status)");
      });
    });
};

const updateOrderContent = async (order_number, number_pack,number_exclusive,number_standard,price,relaisinfo) => {
  const orders = [];

  // Read the CSV file line by line
  fs.createReadStream('./order_IK_PR.csv')
    .pipe(csv({
      mapHeaders: ({ header, index }) => header.trim()  // Trim spaces from header names
    }))
    .on('data', (row) => {
      // If this is the order we want to update, change the status
      if(row['ORDER_NUMBER'] === String(order_number)) {  // Use trimmed header name
        row['NUMBER_PACK'] = number_pack;  // Use trimmed header name
        row['NUMBER_EXCLUSIVE'] = number_exclusive;  // Use trimmed header name
        row['NUMBER_STANDARD'] = number_standard;  // Use trimmed header name
        row['PRICE'] = price;  // Use trimmed header name
        row['MONDIALRELAIS'] = relaisinfo;  // Use trimmed header name
      }
      

      // Push the row object, not a string
      orders.push(row);
    })
    .on('end', () => {
      // We have now finished reading the CSV file, so we can write the updated data back to it
      const csvWriter = createCsvWriter({
        path: './order_IK_PR.csv',
        header: [
          {id: 'ORDER_NUMBER', title: 'ORDER_NUMBER'},
          {id: 'DATE', title: 'DATE'},
          {id: 'TIME', title: 'TIME'},
          {id: 'EMAIL', title: 'EMAIL'},
          {id: 'COUNTRY', title: 'COUNTRY'},
          {id: 'FIRST_NAME', title: 'FIRST_NAME'},
          {id: 'LAST_NAME', title: 'LAST_NAME'},
          {id: 'ADDRESS', title: 'ADDRESS'},
          {id: 'CITY', title: 'CITY'},
          {id: 'ZIP', title: 'ZIP'},
          {id: 'PHONE', title: 'PHONE'},
          {id: 'ID_CARD', title: 'ID_CARD'},
          {id: 'STATUS', title: 'STATUS'},
          {id: 'NUMBER_PACK', title: 'NUMBER_PACK'},
          {id: 'NUMBER_STANDARD', title: 'NUMBER_STANDARD'},
          {id: 'NUMBER_EXCLUSIVE', title: 'NUMBER_EXCLUSIVE'},
          {id: 'PRICE', title: 'PRICE'},
          {id: 'MONDIALRELAIS', title: 'MONDIALRELAIS'},
        ]
      });
      csvWriter
      .writeRecords(orders) // returns a promise
      .then(() => {
        console.log("ORDER UPDATED (CONTENT)");
      });
    });
};
module.exports = {create_record,getNumberOfOrders, updateOrderStatus,updateOrderContent};