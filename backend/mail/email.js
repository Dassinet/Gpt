const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();
const {
    VERIFICATION_EMAIL_TEMPLATE,
    PASSWORD_RESET_REQUEST_TEMPLATE,
    PASSWORD_RESET_SUCCESS_TEMPLATE,
    WELCOME_EMAIL_TEMPLATE,
    INVITATION_EMAIL_TEMPLATE
} = require('./emailTamplets');


const transporter = nodemailer.createTransport({    
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.GMAIL_PASSWORD,
    },
});


const sender = {
    email: process.env.EMAIL_FROM,
    name: process.env.MAIL_SENDER_NAME || 'EMSA',
};


const sendEmail = async (to, subject, htmlBody, category) => {
    try {
        const mailOptions = {
            from: `"${sender.name}" <${sender.email}>`,
            to: to,
            subject: subject,
            html: htmlBody,
            headers: { 'X-App-Category': category },
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully: "${subject}" to ${to} (Category: ${category})`);
        return info;
    } catch (error) {
        console.error(`Error sending email: "${subject}" to ${to} (Category: ${category})`, error);
        throw error;
    }
};


const sendVerificationEmail = async (email, verificationToken) => {
    const subject = "Verify your email";
    const htmlBody = VERIFICATION_EMAIL_TEMPLATE.replace('{verificationCode}', verificationToken);
    const category = "Email verification";

    await sendEmail(email, subject, htmlBody, category);
};

const sendWelcomeEmail = async (email, name) => {
    const subject = "Welcome to EMSA!";
    const htmlBody = WELCOME_EMAIL_TEMPLATE.replace('{userName}', name || 'there');
    const category = "Welcome Email";

    await sendEmail(email, subject, htmlBody, category);
};

const sendResetPasswordEmail = async (email, resetURL) => {
    const subject = "Reset your password";
    const htmlBody = PASSWORD_RESET_REQUEST_TEMPLATE.replace('{resetURL}', resetURL);
    const category = "Password reset request";

    await sendEmail(email, subject, htmlBody, category);
};

const sendPasswordResetSuccessEmail = async (email) => {
    const subject = "Password reset successful";
    const htmlBody = PASSWORD_RESET_SUCCESS_TEMPLATE;
    const category = "Password reset success";

    await sendEmail(email, subject, htmlBody, category);
};

const sendInvitationEmail = async (email, invitationToken) => {
    const subject = "Invitation to join EMSA";
    const htmlBody = INVITATION_EMAIL_TEMPLATE.replace('{invitationToken}', invitationToken);
    const category = "Invitation Email";

    await sendEmail(email, subject, htmlBody, category);
};

module.exports = {
    sendVerificationEmail,
    sendWelcomeEmail,
    sendResetPasswordEmail,
    sendPasswordResetSuccessEmail,
    sendInvitationEmail
};