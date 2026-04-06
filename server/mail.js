import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const EMAIL_ALIASES = {
    admin: process.env.EMAIL_ADMIN || 'admin@labodegadelcomputador.com',
    soporte: process.env.EMAIL_SOPORTE || 'soporte@labodegadelcomputador.com',
    ventas: process.env.EMAIL_VENTAS || 'ventas@labodegadelcomputador.com',
    marketing: process.env.EMAIL_MARKETING || 'marketing@labodegadelcomputador.com'
};

const ALIAS_LABELS = {
    admin: 'La Bodega del Computador',
    soporte: 'La Bodega del Computador - Soporte Técnico',
    ventas: 'La Bodega del Computador - Ventas',
    marketing: 'La Bodega del Computador - Marketing'
};

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

export const sendEmail = async ({ to, subject, html, attachments = [], type = 'admin' }) => {
    const fromEmail = EMAIL_ALIASES[type] || EMAIL_ALIASES.admin;
    const fromName = ALIAS_LABELS[type] || ALIAS_LABELS.admin;
    
    if (!transporter) {
        console.log('--- EMAIL SIMULATION (No SMTP Config) ---');
        console.log(`From: ${fromName} <${fromEmail}>`);
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log('------------------------------------------');
        return { success: true, simulated: true };
    }
    
    try {
        await transporter.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to,
            subject,
            html,
            attachments
        });
        console.log(`[MAIL] Sent via ${fromEmail}: ${subject}`);
        return { success: true };
    } catch (error) {
        console.error('[MAIL] Error sending email:', error.message);
        return { success: false, error: error.message };
    }
};

export const getEmailAlias = (type) => EMAIL_ALIASES[type] || EMAIL_ALIASES.admin;
export const getEmailLabel = (type) => ALIAS_LABELS[type] || ALIAS_LABELS.admin;

export default transporter;
