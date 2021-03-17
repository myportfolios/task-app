const sgMail = require("@sendgrid/mail");
const { getMaxListeners } = require("../models/task");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeMessage = (email, name) => {
  sgMail.send({
    to: email,
    from: "lexybiade@gmail.com",
    subject: `Thanks for joining`,
    text: `Welcome to the App, ${name}. I hope you have fun!`,
    //html:'<h2></h2>'u can also add html
  });
};

const sendCancellationMsg = (mail, name) => {
  sgMail.send({
    to: mail,
    from: "lexybiade@gmail.com",
    subject: "We couldn't have been here without you!!",
    text: `Hi ${name}, we just want you to know we feel sad to see you go and look forward to havong you back with us soon.(:`,
  });
};
module.exports = {
  sendWelcomeMessage,
  sendCancellationMsg,
};
/**
 * sendgrid npm pck
 * used to send mails and other promotionals to clients
 * call the method 'setApiKey' on the instance of sgMail created and pass in the api key gotten from the website
 * create a function to invoke the send method and call export the function to the required module
 */
