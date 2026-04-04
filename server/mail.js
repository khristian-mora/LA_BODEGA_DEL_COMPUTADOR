import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let transporter = null;

if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 465,
        secure: true,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
}

export const sendEmail = async ({ to, subject, html }) => {
    if (!transporter) {
        console.log('--- EMAIL SIMULATION (No SMTP Config) ---');
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`HTML: ${html}`);
        console.log('------------------------------------------');
        return { success: true, simulated: true };
    }

    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM || `"La Bodega del Computador" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html
        });
        return { success: true };
    } catch (error) {
        console.error('[MAIL] Error sending email:', error);
        throw error;
    }
};

export default transporter;
