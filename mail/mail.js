const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const initTransporter = async () => {
  return nodemailer.createTransport({
    service: 'gmail', // Utilisation de Gmail
    auth: {
      user: 'yanisamraoui.pro@gmail.com', // Remplacez par votre adresse email Gmail
      pass: 'exmfmlzorvioyctt', // Remplacez par votre mot de passe d'application
    },
  });
};

const sendEmail = async (data) => {
  let templatePath;
  let emailSubject;

  console.log(data.order_status);
  if (data.order_status == 'FAILED') {
    templatePath = 'template_failed.html';
    emailSubject = 'Commande en erreur';
  } else if (data.order_status == 'FAILED_PAIEMENT') {
    templatePath = 'template_failed.html';
    emailSubject = 'Commande en erreur de paiement';
  } else if (data.order_status == 'FAILED_PROCESSING') {
    templatePath = 'template_failed.html';
    emailSubject = 'Commande en erreur de traitement';
  } else {
    templatePath = 'template.html';
    emailSubject = 'Commande terminée';
  }
  
  console.log(data);

  let htmlTemplate = fs.readFileSync(path.resolve(__dirname, templatePath), 'utf8');
  Object.keys(data).forEach((key) => {
    htmlTemplate = htmlTemplate.replace(`{{${key}}}`, data[key]);
  });

  let transporter = await initTransporter();
  
  let mailOptions = {
    from: 'bot@gmail.com',
    to: 'yanisamraoui66@gmail.com',
    subject: emailSubject,
    html: htmlTemplate,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
};

const sendCalendarEmail = async ( randomHours) => {
  try {
    // Créez un transporteur SMTP avec les informations de votre compte de messagerie
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Utilisation de Gmail
      auth: {
        user: 'yanisamraoui.pro@gmail.com', // Remplacez par votre adresse email Gmail
        pass: 'exmfmlzorvioyctt', // Remplacez par votre mot de passe d'application
    },
    });

    // Construisez le contenu du courrier électronique avec le calendrier des horaires
    let htmlContent = `<h1>Calendrier des horaires</h1>`;
    htmlContent += `<ul>`;
    randomHours.forEach((hour) => {
      htmlContent += `<li>${hour}</li>`;
    });
    htmlContent += `</ul>`;

    // Configurez les options du courrier électronique
    const mailOptions = {
      from: 'bot@gmail.com',
      to: "yanisamraoui66@gmail.com",
      subject: "Calendrier des horaires d'envoie de commande",
      html: htmlContent,
    };

    // Envoyez l'e-mail
    const info = await transporter.sendMail(mailOptions);
    console.log('E-mail envoyé :', info.messageId);
  } catch (error) {
    console.error('Une erreur s\'est produite lors de l\'envoi de l\'e-mail :', error);
  }
};

module.exports = {sendEmail, sendCalendarEmail};
