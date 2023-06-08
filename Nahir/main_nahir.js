const puppeteer = require('puppeteer');
const fs = require('fs');
const csv = require('csv-parser');
const readline = require('readline');

const cron = require('node-cron');

const getRandomProxy = async () => {
  const proxyData = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream("proxies.csv")
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

    fs.createReadStream('order_nahir.csv')
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


const {sendEmail,sendCalendarEmail} = require('../mail/mail.js');
const {create_record,getNumberOfOrders,updateOrderStatus,updateOrderContent} = require('../IK/order_IK.js');

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

// Création d'une nouvelle Promise pour lire la première ligne du fichier CSV
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

let idCounter = 1;
let data = {};
const puppeteerFunction = async (retryCount = 0) => {
  console.log (retryCount);
  const currentId = idCounter;
  idCounter += 1;
  console.log(`Starting execution of puppeteerFunction instance ${currentId}`);

  try {
    data = await getLineFromCsv('user_info_nahir.csv', 1);

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
    } = data;
    console.log("INSTANCE " +currentId + ": " + "Informations de l'utilisateur : ", data);



    // Récupération du nombre de produits total
    total_product = 0;
    await calculateSum().then(sum => {
      console.log("INSTANCE " +currentId + ": " +  'Somme des Produits total: ', sum);
      total_product = sum;
    }).catch(error => {
      console.error("INSTANCE " +currentId + ": " + 'An error occurred: ', error);
    });
    data.total_product = total_product;


    // Récupération des informations de la carte bancaire
    const cardData = await getRandomCard('bank_info.csv');
    data.id_card = cardData.id_card;
    data.name_card = cardData.name_card;
    console.log("INSTANCE " +currentId + ": " + "Carte bancaire choisi : ", data.name_card);
    

    // Récupération du nombre de commandes
    const curent_order_number = await getNumberOfOrders();
    const new_order_number = curent_order_number + 1;
    console.log("INSTANCE " +currentId + ": " + "Numéro de la commande : ", new_order_number);
    data.order_number = new_order_number;

    // Création d'un nouveau record dans le fichier order.csv
    await create_record(data,new_order_number);
    data.order_status = 'PENDING';

    // Choix d'un proxy aléatoire dans le fichier proxies.csv
    proxyData = await getRandomProxy();
    let splitProxyData = proxyData.split(':');

    let proxy = splitProxyData[0];
    let port = splitProxyData[1];
    let user = splitProxyData[2];
    let pass = splitProxyData[3];
    console.log("INSTANCE " +currentId + ": " + "Le proxy choisi : ", proxy+':'+port+':'+user+':'+pass);

    // Lancement du navigateur en mode headless (sans interface graphique) et avec le proxy
    const browser = await puppeteer.launch({
      headless: false,
      //args: [
      //    `--proxy-server=${proxy+':'+port}`
      //]
  });
  
  
    console.log ("INSTANCE " +currentId + ": " + "Lancement du navigateur");

    // Création d'un nouvel onglet pour récuperer l'adresse IP
    const IPPage = await browser.newPage();
    //await IPPage.authenticate({username:user, password:pass}); 
    await IPPage.goto('https://httpbin.org/ip',{waitUntil: 'load', timeout: 0});
    const bodyHandle = await IPPage.$('body');
    const bodyText = await IPPage.evaluate(body => body.innerText, bodyHandle);
    const bodyObj = JSON.parse(bodyText);
    data.CurrentIP = bodyObj.origin;
    console.log("INSTANCE " +currentId + ": " + "Current IP: ", data.CurrentIP);
    await IPPage.close();




    const page = await browser.newPage();
    // Naviguer vers l'adresse https://iktlf.shop/cart
    await page.goto('https://nahir.store/products/pack-2-cd', {waitUntil: 'load', timeout: 0});
    //await page.authenticate({username:user, password:pass});
    console.log ("INSTANCE " +currentId + ": " + "Page ouverte");
    // Attendre que la popup de pays s'affiche ( commenter si achat francais )
    //await page.waitForSelector('.recommendation-modal__container');
    //console.log('Popup PAYS affichée');
    // Cliquer sur le bouton "Continuer"
    //await page.click('.recommendation-modal__button');
    //console.log('Popup PAYS fermée');

    // Attendre que la popup s'affiche
    //await page.waitForTimeout(30000); // Le temps d'attente est en millisecondes
    //await page.waitForSelector('.privy-popup-content-wrap');
    //console.log('Popup Newlester affichée');
    // Attendre que la popup soit visible
    //await page.waitForFunction(() => {
    //  const popup = document.querySelector('.privy-popup-content-wrap');
    //  return popup && window.getComputedStyle(popup).getPropertyValue('display') !== 'none';
    //});
    //console.log('Popup Newlester visible');
    // Fermer la popup
    //await page.click('.privy-dismiss-content');

    //console.log('Popup Cookies fermée');

    //await page.waitForTimeout(15000); // Le temps d'attente est en millisecondes
    // Attendre que le bouton "Ajouter au panier" apparaisse

    await page.waitForSelector('.ProductForm__AddToCart');
    console.log ("INSTANCE " +currentId + ": " + "Page chargée");
    await page.waitForTimeout(5000); // Le temps d'attente est en millisecondes
    // Cliquer sur le bouton "Ajouter au panier"
    await page.click('.ProductForm__AddToCart');
    console.log ("INSTANCE " +currentId + ": " + "Ajout au panier");
    // Faire une pause de 10 secondes
    await page.waitForTimeout(5000); // Le temps d'attente est en millisecondes

    let order_number_product = 1;
    let randomNum = Math.round(Math.random()); // Génère un nombre aléatoire entre 0 et 1
    await page.waitForTimeout(5000); // Le temps d'attente est en millisecondes
    for(let i=0; i<randomNum; i++){
      const linkHref = '/cart/change?quantity=2&line=1';
      await page.waitForSelector(`a[href="${linkHref}"]`);
      await page.click(`a[href="${linkHref}"]`);
      order_number_product++;
      await page.waitForTimeout(5000); // attend une seconde avant le prochain clic
    }
    data.order_number_product = order_number_product;
    
    data.order_number_pack = order_number_product;

    console.log( "INSTANCE " +currentId + ": " + "Nombre de PACK ajoutés au panier NUMBER_PACK: ", data.order_number_pack);

    // Faire une pause de 10 secondes
    //await page.waitForTimeout(15000); // Le temps d'attente est en millisecondes

    data.order_number_exclusive = 0;
    data.order_number_standard = 0;
    // Génère un nombre aléatoire entre 0 et 2
    updateOrderContent(new_order_number,data.order_number_pack, data.order_number_exclusive, data.order_number_standard);
    console.log ("INSTANCE " +currentId + ": " + "Appuie sur le boutton 'Checkout'");
    await page.waitForSelector('button[name="checkout"]');
    await page.evaluate(() => {
        let elements = document.getElementsByName('checkout');
        elements[0].click();
    });

    await Promise.all([
      page.waitForNavigation(),
      //page.authenticate({username:user, password:pass})
    ]);

    console.log ("INSTANCE " +currentId + ": " + "Page panier chargée");
    
    //await page.screenshot({ path: `Image/panier_view_${new_order_number}.png` });

    await page.waitForTimeout(5000); // Le temps d'attente est en millisecondes
    //await page.screenshot({ path: `Image/panier_${new_order_number}.png` });

    await page.waitForSelector('#email');
    await page.type('#email', EMAIL);
    await page.type('#TextField0', FIRST_NAME);
    await page.type('#TextField1', LAST_NAME);
    await page.type('#address1', ADDRESS);
    await page.type('#TextField6', CITY);
    await page.type('#TextField5', ZIP);
    let formattedPhoneNumber = PHONE.slice(0, 2) + " " + PHONE.slice(2, 4) + " " + PHONE.slice(4, 6) + " " + PHONE.slice(6, 8) + " " + PHONE.slice(8, 10);
    await page.type('#TextField7', formattedPhoneNumber);

    console.log("INSTANCE " +currentId + ": " + 'Informations de livraison renseignées');

    await page.waitForSelector('button[type="submit"]');
    await page.click('button[type="submit"]');

    await page.waitForTimeout(5000); // Le temps d'attente est en millisecondes

    console.log("INSTANCE " +currentId + ": " + 'Continuer vers lexpedition');

    await page.waitForSelector('button[type="submit"]');
    await page.click('button[type="submit"]');

    console.log("INSTANCE " +currentId + ": " + 'Bouton "Continuer vers le paiement" cliqué');

    // Faire une pause de 10 secondes
    await page.waitForTimeout(5000); // Le temps d'attente est en millisecondes
    // Sélectionner le deuxième bouton radio dans les divs .radio-wrapper

    await page.waitForSelector('button[type="submit"]');
    await page.click('button[type="submit"]');

    console.log("INSTANCE " +currentId + ": " + 'Bouton "verifier la commande" cliqué');

    
    // Faire une pause de 10 secondes
    await page.waitForTimeout(5000); // Le temps d'attente est en millisecondes

    await page.waitForSelector('button[type="submit"]');
    await page.click('button[type="submit"]');

    console.log("INSTANCE " +currentId + ": " + 'Bouton "payé maintenant" cliqué');


    await page.waitForTimeout(5000);


    await page.waitForSelector('#fCardNumber');
    await page.type('#fCardNumber', cardData.card_number);
    
    await page.waitForSelector('#vads-expiry-month-input');
    await page.select('#vads-expiry-month-input', cardData.expiry_month.toString());
    
    await page.waitForSelector('#vads-expiry-year-input');
    await page.select('#vads-expiry-year-input', cardData.expiry_year.toString());
    
    await page.waitForSelector('#cvvid');
    await page.type('#cvvid', cardData.cvv.toString());  
    
    console.log("INSTANCE " +currentId + ": " + 'Informations de paiement renseignées');
    await page.waitForTimeout(30000); // Le temps d'attente est en millisecondes

    await page.click('#validationButtonCard');
    await page.waitForTimeout(15000); // Le temps d'attente est en millisecondes
    data.order_number = new_order_number;
    try {
      await page.waitForSelector('.os-header__title', { timeout: 100000 }); // Attendre 100 secondes au maximum
      console.log("INSTANCE " +currentId + ": " + "La commande s'est bien passée");
      data.order_status = 'COMPLETED';
      data.new_total_product = data.order_number_product + data.total_product;
      await sendEmail(data);
      await updateOrderStatus(new_order_number, 'COMPLETED');
      await deleteLine('user_info.csv', 2);
      //await page.screenshot({ path: `Image/Paiment_${new_order_number}.png` });
    } catch (error) {
      const formElement = await page.$('#retryPaymentForm');
      if (formElement !== null) {
        console.log("INSTANCE " +currentId + ": " + "La commande est en erreur de paiement");
        data.order_status = 'FAILED_PAIEMENT';
        await page.screenshot({ path: `Image/Error_Paiment_${new_order_number}.png` });
        await updateOrderStatus(new_order_number, 'FAILED_PAIEMENT');
      }else{
        console.log("INSTANCE " +currentId + ": " + "La commande n'a pas été passée dans les 100 secondes");
        await page.screenshot({ path: `Image/Error_100s_${new_order_number}.png` });
        data.order_status = 'FAILED';
        await updateOrderStatus(new_order_number, 'FAILED');
      }
      await sendEmail(data);
    }
    await browser.close();
  } catch (error) {
    if (
      error.message.toLowerCase().includes('net::') ||
      error.message.includes('JSHandles can be evaluated only in the context they were created') ||
      error.message.includes('Node is either not clickable or not an HTMLElement') ||
      error.message.includes('Waiting for selector') ||
      error.message.includes('Timed out') ||
      error.message.includes('TypeError') ||
      error.message.includes('No element found') ||
      error.message.includes('Cannot read properties of undefined') ||
      error.message.includes('Cannot extract value when objectId') ||
      (error instanceof SyntaxError && error.message.includes('Unexpected token'))
    ) {
      console.error("INSTANCE " +currentId + ": " + 'An error occurred: ', error);
      await updateOrderStatus(data.order_number, 'FAILED_PROCESSING');
      if (retryCount > 10) {
        console.log("INSTANCE " +currentId + ": " + 'ANNULATION DU RETRY');
      } else if (retryCount > 0 ) {
        console.log("INSTANCE " +currentId + ": " + 'RETRY');
        puppeteerFunction( retryCount + 1);
      } else {
        console.log("INSTANCE " +currentId + ": " + ' PREMIER RETRY');
        puppeteerFunction(1);
      }
      return;
    }
    
    console.log("INSTANCE " +currentId + ": " + 'Suppression de la ligne 2 du fichier user_info.csv');
    console.log("INSTANCE " +currentId + ": " + "BLOC CATCH erreur : " + error);
    console.log(error)
    data.order_status = 'FAILED_PROCESSING';
    await sendEmail(data);
    if (data.order_number !== null) {
      await updateOrderStatus(data.order_number, 'FAILED_PROCESSING');
    }
  }
};

// Heures de début et de fin UTC 
const startHour = 18;
const endHour = 23;

const commandSize = 6;


// Générer 200 heures aléatoires entre 13h et 17h
const generateRandomHours = () => {
  let randomHours = [];

  while (randomHours.length < commandSize) {
      let randomHour = Math.floor(Math.random() * (endHour - startHour + 1)) + startHour;
      let randomMinute = Math.floor(Math.random() * 60);
      let randomSecond = Math.floor(Math.random() * 60);

      let randomTime = new Date();
      randomTime.setUTCHours(randomHour, randomMinute, randomSecond);

      if (!randomHours.find(hour => hour.getTime() === randomTime.getTime())) {
          randomHours.push(randomTime);
      }
  }

  randomHours.sort((a, b) => a.getTime() - b.getTime());

  randomHours = randomHours.map(hour => `${hour.getUTCHours()}:${hour.getUTCMinutes()}:${hour.getUTCSeconds()}`);
  console.log(randomHours);
  sendCalendarEmail(randomHours);
  return randomHours;
}

const scheduleExecutions = (hours) => {
  const now = new Date();
  now.setHours(now.getHours() + 2);
  console.log (`Heure actuelle : ${now.toISOString()}`);
  const nextHour = hours.find(hour => {
      const [h, m, s] = hour.split(':');
      const hourDate = new Date();
      hourDate.setUTCHours(h, m, s);
      return hourDate > now;
  });

  if (nextHour) {
      console.log(`Prochaine heure de requête : ${nextHour}`);

      hours = hours.slice(hours.indexOf(nextHour));

      hours.forEach((hour, index) => {
          let [h, m, s] = hour.split(':');
          cron.schedule(`${s} ${m} ${h} * * *`, () => {
              puppeteerFunction(); 

              if (index < hours.length - 1) {
                  console.log(`Prochaine heure de requête : ${hours[index + 1]}`);
              }
          });
      });
  } else {
      console.log("Il n'y a pas d'heure de requête plus tard que l'heure actuelle dans le tableau.");
  }
}

//let randomHours = generateRandomHours();
//scheduleExecutions(randomHours);
puppeteerFunction();