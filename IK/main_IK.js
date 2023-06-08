const puppeteer = require('puppeteer');
const fs = require('fs');
const csv = require('csv-parser');
const readline = require('readline');
const cron = require('node-cron');
const {sendEmail,sendCalendarEmail} = require('../mail/mail.js');
const {create_record,getNumberOfOrders,updateOrderStatus,updateOrderContent} = require('./order_IK.js');

//Create a write stream to a log file
const logStream = fs.createWriteStream('log.txt', { flags: 'a' });

// Replace console.log with a function that writes to the stream
console.log = function(message) {
  const logdate = new Date();
  logdate.setHours(logdate.getHours() + 2);
  logStream.write(`${logdate.toISOString()} - ${message}\n`);
}



const getRandomProxy = async () => {
  const proxyData = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream("../general/proxies.csv")
      .pipe(csv())
      .on('data', (row) => {
        proxyData.push(row['IP:PORT:USER:PASS']);
      })
      .on('end', () => {
        if (proxyData.length) {
          const randomProxyIndex = Math.floor(Math.random() * proxyData.length);
          resolve(proxyData[randomProxyIndex]);
        } else {
          reject(new Error('No proxy data found'));
        }
      })
      .on('error', reject);
  });
};

async function calculateSum() {
  return new Promise((resolve, reject) => {
    let sum = 0;

    fs.createReadStream('./order_IK.csv')
      .pipe(csv())
      .on('data', (row) => {
        if(row.STATUS === 'COMPLETED') {
          //console.log(row.NUMBER_PRODUCT);
          sum += parseInt(row.NUMBER_PRODUCT);
        }
      })
      .on('end', () => {
        resolve(sum);
      })
      .on('error', reject);
  });
}

const deleteLine = async (originalFile, lineNumber) => {
  const rl = readline.createInterface({
    input: fs.createReadStream(originalFile),
    crlfDelay: Infinity
  });

  let newLines = [];
  let lineCount = 0;

  for await (const line of rl) {
    lineCount++;
    if (lineCount !== lineNumber) {
      newLines.push(line);
    }
  }

  fs.writeFileSync(originalFile, newLines.join('\n'));
};

const getLineFromCsv = (filePath, lineNum) => new Promise((resolve, reject) => {
  let currentLine = 0;
  
  const stream = fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
      currentLine++;
      if (currentLine === lineNum) {
        resolve(row); // Résoudre la Promise avec la ligne spécifiée et arrêter la lecture
        stream.destroy(); // Utiliser l'objet de lecture directement pour appeler destroy()
      }
    })
    .on('error', reject); // En cas d'erreur lors de la lecture, rejeter la Promise
});

const getRandomCard = async (filePath) => {
  const cardData = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        cardData.push(row);
      })
      .on('end', () => {
        if (cardData.length) {
          const randomCardIndex = Math.floor(Math.random() * cardData.length);
          resolve(cardData[randomCardIndex]);
        } else {
          reject(new Error('No card data found'));
        }
      })
      .on('error', reject);
  });
};


let data = {};
const buyIKrequest = async (hour_first_call, retryCount = 0, BillingDataProvided = null) => {
  console.log(`Retry count: ${retryCount}`);
  let browser; 
  const currentId = retryCount;

  function ConsoleLog(message) {
    const timestamp = `${hour_first_call.getHours()}:${hour_first_call.getMinutes()}:${hour_first_call.getSeconds()}`;
    const instanceNumber = `Instance ${retryCount}`
    console.log(`${timestamp} || ${instanceNumber} || ${message}`);
  }
  try {
    var randomUser = Math.floor(Math.random() * 12) + 1;
    ShipingData = await getLineFromCsv('./user_info_IK.csv', randomUser);
    ConsoleLog(BillingDataProvided)
    if(BillingDataProvided){
      ConsoleLog("BOUCLE BILLING DATA PROVIDED")
      BillingData = BillingDataProvided;
    }else{
      ConsoleLog("PAS DE BILLINGDATAPROVIDED")
      BillingData = await getLineFromCsv('./fake_info_IK.csv',1)
      await deleteLine('fake_info_IK.csv',2)
    }
    
    
    const {
      ID_USER,
      EMAIL,
      COUNTRY,
      FIRST_NAME,
      LAST_NAME,
      ADDRESS,
      CITY,
      ZIP,
      PHONE
    } = ShipingData;

    const {
      ID_USER_BILLING,
      EMAIL_BILLING,
      COUNTRY_BILLING,
      FIRST_NAME_BILLING,
      LAST_NAME_BILLING,
      ADDRESS_BILLING,
      CITY_BILLING,
      ZIP_BILLING,
      PHONE_BILLING
    } = BillingData;

    data.EMAIL = EMAIL_BILLING;
    data.COUNTRY = COUNTRY_BILLING;
    data.FIRST_NAME = FIRST_NAME_BILLING;
    data.LAST_NAME = LAST_NAME_BILLING;
    data.ADDRESS = ADDRESS_BILLING;
    data.ZIP = ZIP_BILLING;
    data.PHONE = PHONE_BILLING;
    data.CITY = CITY_BILLING;
    data.FIRST_NAME_SHIPPING = FIRST_NAME;
    data.LAST_NAME_SHIPPING = LAST_NAME;

 
    let packCDRandom = Math.round(Math.random()); // Génère un nombre aléatoire entre 0 et 1
    console.log(data)
    let soloCDRandom = 0;
    if(packCDRandom == 1){
      ConsoleLog ("Nombre de pack a acheter 2 et donc pas de CD SOLO")
    }else{
      if (soloCDRandom == 0){
        ConsoleLog("1 seul pack sera acheter sans aucun CD unique")
      }else{
        ConsoleLog("1 pack + 1 CD sera ajoutée")
      }
    }
    // Récupération du nombre de produits total
    total_product = 0;
    await calculateSum().then(sum => {
      total_product = sum;
    }).catch(error => {
      console.error(` An error occurred: ${error}`);
    });

    data.total_product = total_product;


    // Récupération des informations de la carte bancaire
    const cardData = await getRandomCard('../general/bank_info.csv');
    data.id_card = cardData.id_card;
    data.name_card = cardData.name_card;
    ConsoleLog(`Carte bancaire choisie: ${data.name_card}`);

    // Récupération du nombre de commandes
    const curent_order_number = await getNumberOfOrders();
    const new_order_number = curent_order_number + 1;
    ConsoleLog(`Numéro de la commande : ${new_order_number}`);
    data.order_number = new_order_number;

    // Création d'un nouveau record dans le fichier order.csv
    await create_record("./order_IK.csv",data,new_order_number);
    data.order_status = 'PENDING';

    // Choix d'un proxy aléatoire dans le fichier proxies.csv
    proxyData = await getRandomProxy();
    let splitProxyData = proxyData.split(':');

    let proxy = splitProxyData[0];
    let port = splitProxyData[1];
    let user = splitProxyData[2];
    let pass = splitProxyData[3];
    ConsoleLog(`Le proxy choisi: ${proxy}:${port}:${user}:${pass}`);
    // Lancement du navigateur en mode headless (sans interface graphique) et avec le proxy
    browser = await puppeteer.launch({
      headless: "new",
      args: [
          `--proxy-server=${proxy+':'+port}`,
          '--no-sandbox',
      ],
      timeout: 3000
  });
  
  
    ConsoleLog(`Lancement du navigateur`);

    // Création d'un nouvel onglet pour récuperer l'adresse IP
    const IPPage = await browser.newPage();
    await IPPage.authenticate({username:user, password:pass}); 
    await IPPage.goto('https://httpbin.org/ip',{waitUntil: 'load', timeout: 0});
    //await page.waitForTimeout(15000); // Le temps d'attente est en millisecondes
    const bodyHandle = await IPPage.$('body');
    const bodyText = await IPPage.evaluate(body => body.innerText, bodyHandle);
    const bodyObj = JSON.parse(bodyText);
    data.CurrentIP = bodyObj.origin;
    ConsoleLog(`Current IP: ${data.CurrentIP}`);
    await IPPage.close();

    const page = await browser.newPage();
    // Naviguer vers l'adresse https://iktlf.shop/cart
    await page.goto('https://iktlf.shop/products/pack-reves-ii-rue', {waitUntil: 'load', timeout: 0});
    await page.authenticate({username:user, password:pass});
    ConsoleLog(`Page ouverte`);
    // Attendre que la popup de pays s'affiche ( commenter si achat francais )
    //await page.waitForSelector('.recommendation-modal__container');
    //ConsoleLog('Popup PAYS affichée');
    // Cliquer sur le bouton "Continuer"
    //await page.click('.recommendation-modal__button');
    //ConsoleLog('Popup PAYS fermée');

    // Attendre que la popup s'affiche
    await page.waitForTimeout(30000); // Le temps d'attente est en millisecondes
    ConsoleLog("Attente du popup");
    await page.waitForSelector('.privy-popup-content-wrap');
    ConsoleLog('Popup Newlester affichée');
    // Attendre que la popup soit visible
    await page.waitForFunction(() => {
      const popup = document.querySelector('.privy-popup-content-wrap');
      return popup && window.getComputedStyle(popup).getPropertyValue('display') !== 'none';
    });
    ConsoleLog('Popup Newlester visible');
    // Fermer la popup
    await page.click('.privy-dismiss-content');

    //ConsoleLog('Popup Cookies fermée');

    await page.waitForTimeout(15000); // Le temps d'attente est en millisecondes
    // Attendre que le bouton "Ajouter au panier" apparaisse
    await page.waitForSelector('.AddToCart');
    ConsoleLog(`Page chargée`);
    await page.waitForTimeout(15000); // Le temps d'attente est en millisecondes
    // Cliquer sur le bouton "Ajouter au panier"
    await page.click('.AddToCart');
    ConsoleLog(`Ajout au panier`);
    // Faire une pause de 10 secondes
    await page.waitForTimeout(15000); // Le temps d'attente est en millisecondes

    let order_number_product = 1;
    await page.waitForTimeout(15000); // Le temps d'attente est en millisecondes
    for(let i=0; i<packCDRandom; i++){
      await page.click('.ajaxcart__qty-adjust.ajaxcart__qty-adjust--bundle.ajaxcart__qty--plus.icon-fallback-text');
      order_number_product++;
      await page.waitForTimeout(15000); // attend une seconde avant le prochain clic
    }
    data.order_number_product = order_number_product;
    
    data.order_number_pack = order_number_product;

    // Faire une pause de 10 secondes
    await page.waitForTimeout(15000); // Le temps d'attente est en millisecondes

    data.order_number_exclusive = 0;
    data.order_number_standard = 0;
    // Génère un nombre aléatoire entre 0 et 2

    if(data.order_number_pack == 1){
      // Aléatoirement acheter le CD Rêves II Rue Edition Exclusive ou Standard
      
      if (soloCDRandom == 1) {
        await page.goto('https://iktlf.shop/products/cd-reves-2-rue-edition-exclusive', {waitUntil: 'load', timeout: 0});
        await page.authenticate({username: user, password: pass});
        // Attendre que le bouton "Ajouter au panier" apparaisse
        await page.waitForSelector('.AddToCart');
        await page.waitForTimeout(15000); // Le temps d'attente est en millisecondes
        // Cliquer sur le bouton "Ajouter au panier"
        await page.click('.AddToCart');
        ConsoleLog(`Ajout au panier CD Rêves II Rue Edition Exclusive`);

        data.order_number_exclusive = 1;
        data.order_number_product = data.order_number_product + 1;

        // Faire une pause de 10 secondes
        await page.waitForTimeout(15000); // Le temps d'attente est en millisecondes

      } else if (soloCDRandom == 2) {
        await page.goto('https://iktlf.shop/products/cd-reves-ii-rue-edition-standard', {waitUntil: 'load', timeout: 0});
        await page.authenticate({username: user, password: pass});
        // Attendre que le bouton "Ajouter au panier" apparaisse
        await page.waitForSelector('.AddToCart');
        await page.waitForTimeout(15000); // Le temps d'attente est en millisecondes
        // Cliquer sur le bouton "Ajouter au panier"
        await page.click('.AddToCart');
        ConsoleLog(`Ajout au panier d'un CD Rêves II Rue Edition Standard`);
        data.order_number_product = data.order_number_product + 1;
        data.order_number_standard = 1;
        
        // Faire une pause de 10 secondes
        await page.waitForTimeout(15000); // Le temps d'attente est en millisecondes
      }else {
        ConsoleLog(`Aucun CD Individuel ajouté au panier`);
      }
    }

    await Promise.all([
      page.waitForNavigation(),
      page.goto('https://iktlf.shop/cart', { timeout: 0 }),
      page.authenticate({username:user, password:pass})
    ]);

    ConsoleLog(`Page panier chargée`);
    
    //await page.screenshot({ path: `Image/panier_view_${new_order_number}.png` });

    // Cocher la case "J'ai lu et j'accepte les Conditions Générales de Vente"
    const generalConditionsInput = await page.$('#general-condtions-input');
    if (generalConditionsInput) {
      await generalConditionsInput.click();
    }

    // Attendre que la case soit cochée
    await page.waitForSelector('#general-condtions-input:checked');
    ConsoleLog(`Conditions Générales de Vente cochées`);

    await page.waitForTimeout(15000); // Le temps d'attente est en millisecondes
    //await page.screenshot({ path: `Image/panier_${new_order_number}.png` });

    // Trouver et cliquer sur le bouton "Procéder au paiement"
    const checkoutButton = await page.$('input.checkout-cart');
    if (checkoutButton) {
      await checkoutButton.click();
    }
    ConsoleLog(`Bouton "Procéder au paiement" cliqué`);

    await page.waitForTimeout(15000); 
    await page.waitForSelector('#checkout_email');
    await page.type('#checkout_email', EMAIL_BILLING);
    await page.type('#checkout_shipping_address_country', COUNTRY);
    await page.type('#checkout_shipping_address_first_name', FIRST_NAME);
    await page.type('#checkout_shipping_address_last_name', LAST_NAME);
    await page.type('#checkout_shipping_address_address1', ADDRESS);
    await page.type('#checkout_shipping_address_city', CITY);
    await page.type('#checkout_shipping_address_zip', ZIP);
    let formattedPhoneNumber = PHONE.slice(0, 2) + " " + PHONE.slice(2, 4) + " " + PHONE.slice(4, 6) + " " + PHONE.slice(6, 8) + " " + PHONE.slice(8, 10);

    await page.type('#checkout_shipping_address_phone', formattedPhoneNumber);

    await page.waitForTimeout(15000); // Le temps d'attente est en millisecondes

    ConsoleLog(`Informations de livraison renseignées`);

    // Cliquer sur le bouton "Continuer vers les frais de port"
    await page.click('#continue_button');

    ConsoleLog(`Bouton "Continuer vers les frais de port" cliqué`);

    // Faire une pause de 10 secondes
    await page.waitForTimeout(15000); // Le temps d'attente est en millisecondes
    // Sélectionner le deuxième bouton radio dans les divs .radio-wrapper
    const radios = await page.$$('.radio-wrapper input[type=radio]');
    
    await radios[1].click();

    ConsoleLog(`Bouton radio Colis privé sans signature sélectionné`);

    // Cliquer sur le bouton "Continuer vers le paiement"
    await page.click('#continue_button');

    await page.waitForTimeout(15000); // Le temps d'attente est en millisecondes

    const radiosAdresseFacturation = await page.$$('.radio-wrapper input[type=radio]');


    await radiosAdresseFacturation[1].click();

    await page.waitForTimeout(15000); 

    await page.waitForSelector('#checkout_billing_address_first_name');
    await page.type('#checkout_billing_address_first_name', FIRST_NAME_BILLING);
    await page.type('#checkout_billing_address_last_name', LAST_NAME_BILLING);
    await page.type('#checkout_billing_address_address1', ADDRESS_BILLING);
    await page.type('#checkout_billing_address_city', CITY_BILLING);
    await page.type('#checkout_billing_address_zip', ZIP_BILLING);
    let formattedPhoneNumberBilling = PHONE_BILLING.slice(0, 2) + " " + PHONE_BILLING.slice(2, 4) + " " + PHONE_BILLING.slice(4, 6) + " " + PHONE_BILLING.slice(6, 8) + " " + PHONE_BILLING.slice(8, 10);

    await page.type('#checkout_billing_address_phone', formattedPhoneNumberBilling);


    ConsoleLog(`Bouton "Continuer vers le paiement" cliqué`);
    // Faire une pause de 10 secondes
    await page.waitForTimeout(15000); // Le temps d'attente est en millisecondes


    const priceElement = await page.$('.payment-due__price');
    const priceText = await page.evaluate(priceElement => priceElement.textContent, priceElement);
    const priceValue = Number(priceText.match(/\d+,\d+/)[0].replace(',', '.'));
    ConsoleLog("Prix TOTAL : " + priceValue);

    data.price = priceValue;


    updateOrderContent("./order_IK.csv",new_order_number,data.order_number_pack, data.order_number_exclusive, data.order_number_standard,data.price);
    console.log(`UPDATED COMMANDE: ${data.new_order_number},,, ${data.EMAIL}, ${data.COUNTRY}, ${data.FIRST_NAME}, ${data.LAST_NAME}, ${data.ADDRESS}, ${data.CITY}, ${data.ZIP}, ${data.PHONE}, ${data.FIRST_NAME_SHIPPING}, ${data.LAST_NAME_SHIPPING}, ${data.id_card}, ${data.STATUS}, ${data.order_number_pack}, 0, 0, ${data.price}`);
      
    await page.waitForTimeout(25000); // Le temps d'attente est en millisecondes
    await page.waitForSelector('#continue_button');
    await page.click('#continue_button'); 
    
    // Faire une pause de 10 secondes
    await page.waitForTimeout(40000); // Le temps d'attente est en millisecondes

    await page.waitForSelector('#fCardNumber');
    await page.type('#fCardNumber', cardData.card_number);
    
    await page.waitForSelector('#vads-expiry-month-input');
    await page.select('#vads-expiry-month-input', cardData.expiry_month.toString());
    
    await page.waitForSelector('#vads-expiry-year-input');
    await page.select('#vads-expiry-year-input', cardData.expiry_year.toString());
    
    await page.waitForSelector('#cvvid');
    await page.type('#cvvid', cardData.cvv.toString());  
    
    ConsoleLog(`Informations de paiement renseignées`);

    await page.click('#validationButtonCard');
    await page.waitForTimeout(40000); // Le temps d'attente est en millisecondes
    data.order_number = new_order_number;
    await create_record("./order_IK_FINAL.csv",data,new_order_number);
    await page.waitForTimeout(5000);
    await updateOrderStatus("./order_IK_FINAL.csv",new_order_number, 'PAIEMENTLOAD');
    try {
      await page.waitForSelector('.os-header__title', { timeout: 1000000 }); // Attendre 100 secondes au maximum
      ConsoleLog(`La commande s'est bien passée`);
      data.order_status = 'COMPLETED';
      data.new_total_product = data.order_number_product + data.total_product;
      console.log(`COMPLETED COMMANDE: ${data.new_order_number},,, ${data.EMAIL}, ${data.COUNTRY}, ${data.FIRST_NAME}, ${data.LAST_NAME}, ${data.ADDRESS}, ${data.CITY}, ${data.ZIP}, ${data.PHONE}, ${data.FIRST_NAME_SHIPPING}, ${data.LAST_NAME_SHIPPING}, ${data.id_card}, ${data.STATUS}, ${data.order_number_pack}, 0, 0, ${data.price}`);
      await sendEmail(data);
      await updateOrderStatus("./order_IK.csv",new_order_number, 'COMPLETED');
      await updateOrderStatus("./order_IK_FINAL.csv",new_order_number, 'COMPLETED');
      //await page.screenshot({ path: `Image/Paiment_${new_order_number}.png` });
    } catch (error) {
      const formElement = await page.$('#retryPaymentForm');
      if (formElement !== null) {
        ConsoleLog(`La commande est en erreur de paiement`);
        data.order_status = 'FAILED_PAIEMENT';
        //await page.screenshot({ path: `Image/Error_Paiment_${new_order_number}.png` });
        await updateOrderStatus("./order_IK.csv",new_order_number, 'FAILED_PAIEMENT');
      }else{
        ConsoleLog(`La commande n'a pas été passée dans les 100 secondes`);
        //await page.screenshot({ path: `Image/Error_100s_${new_order_number}.png` });
        data.order_status = 'FAILED';
        await updateOrderStatus("./order_IK.csv",new_order_number, 'FAILED');
      }
      await sendEmail(data);
    }
    await browser.close();
  } catch (error) {
    console.error(`An error occurred: ${error}`);
    data.order_status = 'FAILED_PROCESSING';
    await sendEmail(data);
    if (data.order_number !== null) {
      await updateOrderStatus("./order_IK.csv",data.order_number, 'FAILED_PROCESSING');
    }
    ConsoleLog(`RETRY ${retryCount} EN COURS`)
    if (retryCount > 10) {
      ConsoleLog(`ANNULATION DU RETRY`);
      return;
    } else if (retryCount > 0 ) {
      ConsoleLog(`RETRY ${retryCount} EN COURS`);
      buyIKrequest(hour_first_call, retryCount + 1,BillingData);
    } else {
      ConsoleLog(`PREMIER RETRY`);
      buyIKrequest(hour_first_call,1,BillingData);
    }
  } finally {
    ConsoleLog("FINALLY")
    if (browser) {
      ConsoleLog("FINALLY BROWSER")
      await browser.close();
    }
  }
};


function removeDuplicateEmails() {
  const inputFilename = 'fake_info_IK.csv';
  const outputFilename = 'fake_info_IK_no_duplicates.csv';
  const lines = fs.readFileSync(inputFilename, 'utf8').trim().split('\n');
  const emails = new Set();
  const outputLines = [];
  for (const line of lines) {
    const email = line.split(',')[1];
    if (!emails.has(email)) {
      emails.add(email);
      outputLines.push(line);
    }
  }
  fs.writeFileSync(outputFilename, outputLines.join('\n'));
}

removeDuplicateEmails();
//puppeteerFunction();
//buyIKrequest();
module.exports = buyIKrequest;