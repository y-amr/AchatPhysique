const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const initTransporter = async () => {
  let testAccount = await nodemailer.createTestAccount();

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

module.exports = sendEmail;
