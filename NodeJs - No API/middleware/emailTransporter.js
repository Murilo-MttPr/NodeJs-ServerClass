const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');

const transporter = nodemailer.createTransport(sendgridTransport({
  auth: {
    api_key: 'mlsn.7080055ef0ad08c84a05f5e21178029dac43cea36a8b17c787b50b545495d688'
  }
}));

// Verifica se o transportador está configurado corretamente
transporter.verify((error, success) => {
  if (error) {
    console.log('Error configuring transporter:', error);
  } else {
    console.log('Server is ready to take our messages');
  }
});

module.exports = transporter;