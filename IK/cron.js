const axios = require('axios');
const cron = require('node-cron');
const { constrainedMemory } = require('process');

// Heures de début et de fin UTC 
const startHour = 3;
const endHour = 14;

const commandSize = 60;

//de 0 a 60
const minutesInterval = 20;

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
    console.log(randomHours);
    const minimumInterval = minutesInterval * 60 * 1000 ;
    // Filter out hours that are too close to each other
    randomHours = randomHours.filter((hour, index) => {
        if (index === 0) {
            // Always keep the first hour
            return true;
    } else {
            // Keep the hour if it's at least 20 minutes away from the previous one
            const timeDifference = hour.getTime() - randomHours[index - 1].getTime();
            return timeDifference >= minimumInterval;
            //return hour.getTime() - randomHours[index - 1].getTime() >= minimumInterval;
        }
    });
    randomHours = randomHours.map(hour => `${hour.getUTCHours()}:${hour.getUTCMinutes()}:${hour.getUTCSeconds()}`);
    console.log(randomHours);
    //sendCalendarEmail(randomHours);
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
      hourDate.setDate(8);

      return hourDate > now;
  });

  if (nextHour) {
      console.log(`Prochaine heure de requête : ${nextHour}`);

      hours = hours.slice(hours.indexOf(nextHour));

      hours.forEach((hour, index) => {
          let [h, m, s] = hour.split(':');
          cron.schedule(`${s} ${m} ${h} * * *`, () => {
          axios.post('http://localhost:3000/api/buyIKrequest')
          .then(response => {
                console.log(response.data);
            })
            .catch(error => {
                console.error(error);
            });

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
let randomHours = ['9:08:17', '9:26:45', '9:35:51', '9:47:14', '10:02:59', '10:18:22', '10:31:47', '10:42:55', '10:57:10', '11:06:33', '11:17:55', '11:26:48', '11:35:56', '11:47:21', '12:01:44', '12:17:08', '12:29:59', '12:39:26', '12:53:01', '13:09:15']
scheduleExecutions(randomHours);