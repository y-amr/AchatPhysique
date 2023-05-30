const puppeteer = require('puppeteer');
const fs = require('fs');
const csv = require('csv-parser');


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
    
const puppeteerFunction = async (retryCount = 0) => {
    

    // Choix d'un proxy aléatoire dans le fichier proxies.csv
    proxyData = await getRandomProxy();
    let splitProxyData = proxyData.split(':');
    
    let proxy = splitProxyData[0];
    let port = splitProxyData[1];
    let user = splitProxyData[2];
    let pass = splitProxyData[3];
    console.log( "Le proxy choisi : ", proxy+':'+port+':'+user+':'+pass);

    const browser = await puppeteer.launch({
        headless: false,
       //args: [
       //     `--proxy-server=${proxy+':'+port}`
       // ]
    });

    const KICKPage = await browser.newPage();
    //await KICKPage.authenticate({username:user, password:pass}); 
    console.log("Page ouverte");
    await KICKPage.goto('https://kick.com/momotehna');
    console.log("Page chargée");
    await KICKPage.waitForTimeout(10000);

}

puppeteerFunction();