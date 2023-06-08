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
      hourDate.setDate(7);

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
let randomHours = ['0:04:01', '0:17:42', '0:34:15', '0:50:33', '1:03:42', '1:17:56', '1:32:04', '1:49:10', '2:05:20', '2:20:17', '2:36:51', '2:53:31', '3:09:50', '3:24:17', '3:38:08', '3:54:35', '4:07:56', '4:22:05', '4:39:48', '4:54:08', '5:09:34', '5:22:52', '5:36:58', '5:52:08', '6:08:21', '6:24:47', '6:41:09', '6:58:23', '7:12:18', '7:27:42', '7:45:18', '8:00:35', '8:16:56', '8:31:18', '8:46:32', '9:04:22', '9:20:00', '9:35:41', '9:53:32', '10:09:47', '10:26:11', '10:43:13', '10:58:43', '11:13:32', '11:31:15', '11:46:19', '12:02:29', '12:17:11', '12:33:46', '12:49:26', '13:03:34', '13:19:08', '13:32:39', '13:47:14', '14:05:15', '14:20:48', '14:36:09', '14:52:42', '15:10:26', '15:25:56', '15:43:04', '15:57:59', '16:13:15', '16:29:31', '16:43:07', '16:59:22', '17:16:10', '17:31:47', '17:49:20', '18:06:01', '18:23:24', '18:37:39', '18:55:14', '19:11:34', '19:29:11', '19:44:21', '20:02:04', '20:18:29', '20:36:12', '20:51:43', '21:09:15', '21:27:33', '21:42:51', '22:00:12', '22:17:26', '22:32:59', '22:51:16', '23:08:40', '23:22:50', '23:41:01', '23:59:00']
scheduleExecutions(randomHours);