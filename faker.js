const faker = require('faker');
const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

let data = [];

for(let i=1; i<=2000; i++) {
    faker.locale = 'fr';
    data.push({
        id_user: i,
        email: faker.internet.email(),
        country: 'France',
        first_name: faker.name.firstName(),
        last_name: faker.name.lastName(),
        address: faker.address.streetAddress(),
        city: faker.address.city(),
        zip: faker.address.zipCode("750##"),
        phone: faker.phone.phoneNumber('06########')
    });
}

const csvWriter = createCsvWriter({
    path: 'data.csv',
    header: [
        {id: 'id_user', title: 'ID_USER'},
        {id: 'email', title: 'EMAIL'},
        {id: 'country', title: 'COUNTRY'},
        {id: 'first_name', title: 'FIRST_NAME'},
        {id: 'last_name', title: 'LAST_NAME'},
        {id: 'address', title: 'ADDRESS'},
        {id: 'city', title: 'CITY'},
        {id: 'zip', title: 'ZIP'},
        {id: 'phone', title: 'PHONE'}
    ]
});

csvWriter
    .writeRecords(data)
    .then(()=> console.log('The CSV file was written successfully'));
