import nodemailer from 'nodemailer';
import { db } from './db.js';
import dotenv from 'dotenv';
dotenv.config();

// Configuración del transportador de correo
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

/**
 * Registra una notificación interna para un usuario (técnico/admin)
 */
export const createInternalNotification = ({ userId, type, title, message, link }) => {
    const sql = `INSERT INTO notifications (userId, type, title, message, link, isRead, createdAt) 
                 VALUES (?, ?, ?, ?, ?, 0, ?)`;
    const now = new Date().toISOString();
    
    return new Promise((resolve, reject) => {
        db.run(sql, [userId, type, title, message, link, now], function(err) {
            if (err) {
                console.error('[NotificationService] Error creating internal notification:', err.message);
                reject(err);
            } else {
                resolve(this.lastID);
            }
        });
    });
};

/**
 * Envía un correo electrónico
 */
export const sendEmail = async ({ to, subject, text, html }) => {
    if (!process.env.SMTP_USER) {
        console.warn('[NotificationService] SMTP_USER no configurado. El correo no se enviará.');
        return;
    }

    try {
        const info = await transporter.sendMail({
            from: `"LA BODEGA DEL COMPUTADOR" <${process.env.SMTP_USER}>`,
            to,
            subject,
            text,
            html
        });
        console.log('[NotificationService] Email enviado:', info.messageId);
        return info;
    } catch (error) {
        console.error('[NotificationService] Error enviando email:', error.message);
        throw error;
    }
};

/**
 * Notifica la asignación de una cita
 */
export const notifyAssignment = async (appointmentId) => {
    try {
        // Obtener detalles de la cita
        const sql = `
            SELECT a.*, c.name as customerName, c.email as customerEmail, 
                   u.name as technicianName, u.email as technicianEmail
            FROM appointments a
            LEFT JOIN customers c ON a.customerId = c.id
            LEFT JOIN users u ON a.technicianId = u.id
            WHERE a.id = ?
        `;
        
        db.get(sql, [appointmentId], async (err, appointment) => {
            if (err || !appointment) return;

            const dateStr = new Date(appointment.scheduledDate).toLocaleString('es-CO');

            // 1. Notificar al Técnico (Interno)
            if (appointment.technicianId) {
                await createInternalNotification({
                    userId: appointment.technicianId,
                    type: 'ASSIGNMENT',
                    title: 'Nueva Cita Asignada',
                    message: `Se te ha asignado una cita de ${appointment.serviceType} para el cliente ${appointment.customerName} el ${dateStr}.`,
                    link: `/admin/appointments?id=${appointment.id}`
                });
            }

            // 2. Notificar al Cliente (Email)
            if (appointment.customerEmail) {
                await sendEmail({
                    to: appointment.customerEmail,
                    subject: 'Confirmación de Cita - LA BODEGA DEL COMPUTADOR',
                    html: `
                        <div style="font-family: sans-serif; padding: 20px; color: #333;">
                            <h2 style="color: #4f46e5;">¡Hola ${appointment.customerName}!</h2>
                            <p>Tu cita para el servicio de <strong>${appointment.serviceType}</strong> ha sido programada exitosamente.</p>
                            <div style="background: #f3f4f6; padding: 15px; border-radius: 10px; margin: 20px 0;">
                                <p><strong>Fecha y Hora:</strong> ${dateStr}</p>
                                <p><strong>Técnico Asignado:</strong> ${appointment.technicianName || 'Pendiente'}</p>
                                <p><strong>Notas:</strong> ${appointment.notes || 'N/A'}</p>
                            </div>
                            <p>Si necesitas reprogramar, por favor contáctanos con anticipación.</p>
                            <p>Atentamente,<br>El equipo de LBDC</p>
                        </div>
                    `
                });
            }
        });
    } catch (error) {
        console.error('[NotificationService] Error in notifyAssignment:', error);
    }
};

/**
 * Envía recordatorios diarios
 */
export const sendDailyReminders = async () => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const sql = `
            SELECT a.*, c.name as customerName, c.email as customerEmail
            FROM appointments a
            LEFT JOIN customers c ON a.customerId = c.id
            WHERE SUBSTR(a.scheduledDate, 1, 10) = ? 
              AND a.status NOT IN ('Cancelled', 'Completed', 'No-Show')
        `;
        
        return new Promise((resolve, reject) => {
            db.all(sql, [today], async (err, rows) => {
                if (err) return reject(err);
                
                let successCount = 0;
                for (const app of rows) {
                    if (app.customerEmail) {
                        const timeStr = new Date(app.scheduledDate).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
                        await sendEmail({
                            to: app.customerEmail,
                            subject: 'Recordatorio de Visita Hoy - LA BODEGA DEL COMPUTADOR',
                            html: `
                                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                                    <h2 style="color: #4f46e5;">Recordatorio de Visita</h2>
                                    <p>Hola ${app.customerName},</p>
                                    <p>Te recordamos que hoy tenemos programada una visita técnica para tu servicio de <strong>${app.serviceType}</strong>.</p>
                                    <p style="font-size: 18px;"><strong>Hora de Visita:</strong> ${timeStr}</p>
                                    <p>¡Nos vemos pronto!</p>
                                    <hr>
                                    <p style="font-size: 12px; color: #666;">LA BODEGA DEL COMPUTADOR - Soporte Técnico Especializado</p>
                                </div>
                            `
                        });
                        successCount++;
                    }
                }
                resolve(successCount);
            });
        });
    } catch (error) {
        console.error('[NotificationService] Error in sendDailyReminders:', error);
        throw error;
    }
};
