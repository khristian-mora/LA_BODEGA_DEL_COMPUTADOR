// Intake Receipt Generation (Comprobante de Ingreso)
import { db } from './db.js';
import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';


// Email transporter configuration (Reusing from other files, ideally should be a shared utility)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Helper to fetch settings from DB
const getSetting = (key, defaultValue = '') => {
    return new Promise((resolve) => {
        db.get('SELECT value FROM settings WHERE key = ?', [key], (err, row) => {
            if (err || !row) resolve(defaultValue);
            else resolve(row.value);
        });
    });
};

// Helper is no longer needed for DB images as we embed them or use the API route, 
// but we keep it if we mix legacy file-based images.
// Helper to ensure absolute URLs for images
const getAbsoluteUrl = (path, baseUrl) => {
    if (!path) return '';
    // If it's already a full URL or Base64 data, return as-is
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanPath = path.startsWith('/') ? path : '/' + path;
    return `${cleanBase}${cleanPath}`;
};

const generateIntakeHtml = (ticket, evidenceList = [], baseUrl = '', settings = {}) => {
    const date = new Date(ticket.createdAt).toLocaleDateString('es-CO', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    // Merge legacy photos (if any) with new DB evidence
    let photos = [];
    try {
        const legacyPhotos = typeof ticket.photosIntake === 'string' ? JSON.parse(ticket.photosIntake) : (ticket.photosIntake || []);
        // Only keep valid local URLs or files, filter out broken blob URLs
        const validLegacy = legacyPhotos.filter(p => p && !p.startsWith('blob:'));
        
        // Add DB Evidence if available
        const evidenceUrls = (evidenceList || []).map(ev => `/api/evidence/${ev.id}`);
        
        photos = [...validLegacy, ...evidenceUrls];
    } catch { photos = []; }

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Comprobante de Ingreso #${ticket.id || 'N/A'}</title>
    <style>
        :root {
            --primary: #2563eb;
            --secondary: #64748b;
            --accent: #3b82f6;
            --bg-light: #f1f5f9;
            --text-dark: #1e293b;
            --text-light: #64748b;
            --border: #e2e8f0;
        }
        body { font-family: 'Inter', sans-serif; margin: 0; padding: 20px; background: #e2e8f0; color: var(--text-dark); }
        .receipt-container { max-width: 800px; margin: 0 auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.1); }
        .header { background: var(--text-dark); color: white; padding: 40px; display: flex; justify-content: space-between; align-items: center; border-bottom: 5px solid var(--primary); }
        .brand-logo { width: 45px; height: 45px; background: var(--primary); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px; box-shadow: 0 4px 10px rgba(37,99,235,0.3); }
        .logo-section h1 { margin: 0; font-size: 20px; letter-spacing: 2px; font-weight: 900; }
        .logo-section p { margin: 0; font-size: 10px; letter-spacing: 4px; opacity: 0.6; font-weight: 700; text-transform: uppercase; }
        .ticket-badge { text-align: right; }
        .ticket-badge span { display: block; font-size: 10px; opacity: 0.7; font-weight: 700; }
        .ticket-badge strong { font-size: 24px; color: var(--accent); }
        .content { padding: 40px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
        .info-card { background: #fff; border: 1px solid var(--border); border-radius: 16px; padding: 20px; }
        .section-header { font-size: 12px; font-weight: 800; text-transform: uppercase; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 1px solid var(--border); color: var(--primary); }
        .field { margin-bottom: 10px; }
        .field label { font-size: 9px; color: var(--text-light); text-transform: uppercase; font-weight: 800; display: block; }
        .field .value { font-size: 14px; font-weight: 600; }
        .description-box { background: #f8fafc; padding: 20px; border-radius: 12px; border-left: 4px solid var(--primary); font-size: 13px; min-height: 50px; }
        .photo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 15px; }
        .photo-card { border-radius: 8px; overflow: hidden; aspect-ratio: 1; border: 1px solid var(--border); }
        .photo-card img { width: 100%; height: 100%; object-fit: cover; }
        .signatures { display: flex; justify-content: space-between; margin-top: 50px; }
        .sign-box { width: 40%; border-top: 1px solid var(--text-dark); text-align: center; padding-top: 10px; font-size: 10px; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 10px; color: var(--text-light); border-top: 1px solid var(--border); }
    </style>
</head>
<body>
    <div class="receipt-container">
        <div class="header">
            <div class="brand-header">
                <div class="brand-logo">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
                </div>
                <div class="logo-section">
                    <h1>LA BODEGA</h1>
                    <p>DEL COMPUTADOR</p>
                </div>
            </div>
            <div class="ticket-badge">
                <span>Orden de Servicio No.</span>
                <strong>#${ticket.id || '---'}</strong>
            </div>
        </div>

        <div class="content">
            <div class="info-grid">
                <div class="info-card">
                    <div class="section-header">Cliente</div>
                    <div class="field">
                        <label>Nombre</label>
                        <div class="value">${ticket.clientName || 'N/A'}</div>
                    </div>
                    <div class="field">
                        <label>Teléfono</label>
                        <div class="value">${ticket.clientPhone || 'N/A'}</div>
                    </div>
                    <div class="field">
                        <label>Fecha de Ingreso</label>
                        <div class="value">${date}</div>
                    </div>
                </div>
                <div class="info-card">
                    <div class="section-header">Equipo</div>
                    <div class="field">
                        <label>Tipo / Marca</label>
                        <div class="value">${ticket.deviceType || 'Equipo'} - ${ticket.brand || 'Genérico'}</div>
                    </div>
                    <div class="field">
                        <label>Modelo / Serial</label>
                        <div class="value">${ticket.model || 'N/A'} — ${ticket.serial || 'S/N'}</div>
                    </div>
                </div>
            </div>

            <div class="section-header">Descripción del Problema</div>
            <div class="description-box">
                ${ticket.issueDescription || 'Sin descripción detallada.'}
            </div>

            ${photos.length > 0 ? `
            <div style="margin-top: 30px;">
                <div class="section-header">Evidencia de Ingreso</div>
                <div class="photo-grid">
                    ${photos.map(p => `
                        <div class="photo-card">
                            <img src="${getAbsoluteUrl(p, baseUrl)}" alt="Evidencia">
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            <div class="signatures">
                <div class="sign-box">
                    <div style="height: 40px;"></div>
                    <strong>${ticket.technicianName || 'Recepción'}</strong><br>Entregado por
                </div>
                <div class="sign-box">
                    <div style="height: 40px;"></div>
                    <strong>${ticket.clientName || 'Firma Cliente'}</strong><br>Recibido por (Cliente)
                </div>
            </div>
        </div>

        <div class="footer">
            PBX: ${settings.whatsappNumber || 'N/A'} | ${settings.businessAddress || 'Barrancabermeja'} | ${settings.businessEmail || ''}
            <br><strong>${settings.businessDomain || ''}</strong>
        </div>
    </div>
</body>
</html>`;
};

// Preview Receipt (Local Preview)
export const previewIntakeReceipt = (req, res) => {
    const { ticketId } = req.params;
    console.log('Preview request for ticket:', ticketId);
    
    const settingsKeys = ['businessName', 'businessAddress', 'whatsappNumber', 'businessEmail', 'businessDomain'];
    const settings = {};

    const fetchFullData = async () => {
        for (const key of settingsKeys) {
            settings[key] = await getSetting(key);
        }

        return new Promise((resolve) => {
            const query = `
                SELECT t.*, u.name as technicianName 
                FROM tickets t 
                LEFT JOIN users u ON t.assignedTo = u.id 
                WHERE t.id = ?
            `;
            db.get(query, [ticketId], (err, row) => {
                if (err || !row) return resolve(null);

                db.all('SELECT * FROM ticket_evidence WHERE ticket_id = ?', [ticketId], (evErr, evRows) => {
                    row.dbEvidence = evRows || [];
                    resolve(row);
                });
            });
        });
    };

    fetchFullData().then(ticket => {
        console.log('Ticket found:', ticket);
        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

        const host = req.get('host');
        const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
        const baseUrl = `${protocol}://${host}`;
        const html = generateIntakeHtml(ticket, ticket.dbEvidence || [], baseUrl, settings);
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    });
};

// Send Email Endpoint
export const sendIntakeReceipt = async (req, res) => {
    const { ticketId } = req.params;
    const { email } = req.body;

    try {
        console.log(`[EMAIL] Attempting to send intake receipt for Ticket #${ticketId}`);
        const settingsKeys = ['businessName', 'businessAddress', 'whatsappNumber', 'businessEmail', 'businessDomain'];
        const settings = {};
        for (const key of settingsKeys) {
            settings[key] = await getSetting(key);
        }

        const ticket = await new Promise((resolve, reject) => {
            const query = `
                SELECT t.*, u.name as technicianName 
                FROM tickets t 
                LEFT JOIN users u ON t.assignedTo = u.id 
                WHERE t.id = ?
            `;
            db.get(query, [ticketId], (err, row) => {
                if (err) {
                    console.error(`[DB] Receipt query failed:`, err.message);
                    return reject(err);
                }
                if (!row) return resolve(null);

                db.all('SELECT * FROM ticket_evidence WHERE ticket_id = ?', [ticketId], (evErr, evRows) => {
                    row.dbEvidence = evRows || [];
                    resolve(row);
                });
            });
        });

        if (!ticket) {
            console.warn(`[EMAIL] Ticket #${ticketId} not found for receipt.`);
            return res.status(404).json({ error: 'Ticket non-existent' });
        }

        let targetEmail = email || ticket.clientEmail;
        if (!targetEmail) {
            console.warn(`[EMAIL] No target email for Ticket #${ticketId}`);
            return res.json({ success: false, message: 'No hay un email válido para enviar el comprobante.' });
        }

        // Generate PDF buffer
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        let pdfBuffer = [];
        doc.on('data', chunk => pdfBuffer.push(chunk));
        
        const pdfGenerated = new Promise((resolve) => {
            doc.on('end', () => resolve(Buffer.concat(pdfBuffer)));
            
            const businessName = settings.businessName || 'LA BODEGA DEL COMPUTADOR';
            const businessAddress = settings.businessAddress || 'Cl. 49 #13-13, Barrancabermeja';
            const businessPhone = settings.whatsappNumber || '+57 317 653 2488';
            const businessEmail = settings.businessEmail || 'ventas@labodegadelcomputador.com';
            
            doc.fillColor('#1e293b').fontSize(20).text(businessName, { align: 'center' });
            doc.fillColor('#64748b').fontSize(10).text('DEL COMPUTADOR', { align: 'center' });
            doc.moveDown();
            doc.fillColor('#2563eb').fontSize(16).text(`Orden de Servicio No. #${ticket.id}`, { align: 'center' });
            doc.moveDown(2);
            doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e2e8f0').stroke();
            doc.moveDown();
            
            doc.fillColor('#2563eb').fontSize(12).text('CLIENTE', 50);
            doc.moveDown(0.5);
            doc.fillColor('#1e293b').fontSize(11);
            doc.text(`Nombre: ${ticket.clientName || 'N/A'}`);
            doc.text(`Teléfono: ${ticket.clientPhone || 'N/A'}`);
            doc.text(`Email: ${ticket.clientEmail || 'N/A'}`);
            doc.text(`Fecha: ${new Date(ticket.createdAt).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`);
            doc.moveDown();
            
            doc.fillColor('#2563eb').fontSize(12).text('EQUIPO', 50);
            doc.moveDown(0.5);
            doc.fillColor('#1e293b').fontSize(11);
            doc.text(`Tipo: ${ticket.deviceType || 'Equipo'}`);
            doc.text(`Marca: ${ticket.brand || 'Genérico'}`);
            doc.text(`Modelo: ${ticket.model || 'N/A'}`);
            doc.text(`Serial: ${ticket.serial || 'S/N'}`);
            doc.moveDown();
            
            doc.fillColor('#2563eb').fontSize(12).text('DESCRIPCIÓN DEL PROBLEMA', 50);
            doc.moveDown(0.5);
            doc.fillColor('#475569').fontSize(10);
            doc.text(ticket.issueDescription || 'Sin descripción', { width: 495 });
            doc.moveDown(2);
            
            doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e2e8f0').stroke();
            doc.moveDown();
            
            doc.fillColor('#1e293b').fontSize(10);
            doc.text('Entregado por:', 50);
            doc.moveDown();
            doc.moveTo(50, doc.y).lineTo(200, doc.y).strokeColor('#1e293b').stroke();
            doc.text(ticket.technicianName || 'Recepción', 50);
            
            doc.text('Recibido por:', 350);
            doc.moveTo(350, doc.y - 5).lineTo(500, doc.y - 5).strokeColor('#1e293b').stroke();
            doc.text(ticket.clientName || 'Firma Cliente', 350);
            
            doc.moveDown(3);
            doc.fillColor('#64748b').fontSize(8).text(`PBX: ${businessPhone} | ${businessAddress} | ${businessEmail}`, { align: 'center' });
            
            doc.end();
        });
        
        const pdfContent = await pdfGenerated;

        // Basic check for SMTP availability
        if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
            console.error('[EMAIL] SMTP Configuration is missing in .env');
            return res.status(400).json({ error: 'El sistema de correos no está configurado (SMTP missing).' });
        }

        try {
            await transporter.sendMail({
                from: process.env.SMTP_FROM || `"${settings.businessName || 'La Bodega'}" <noreply@labodega.com>`,
                to: targetEmail,
                subject: `Comprobante de Ingreso #${ticket.id} - ${settings.businessName || 'Servicio Técnico'}`,
                html: `
                    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
                        <div style="background: #0f172a; padding: 30px; text-align: center; border-bottom: 5px solid #6366f1;">
                            <h2 style="color: white; margin: 0;">Ingreso de Equipo Confirmado</h2>
                        </div>
                        <div style="padding: 30px; line-height: 1.6;">
                            <p>Hola <strong>${ticket.clientName}</strong>,</p>
                            <p>Tu equipo ha sido ingresa

do exitosamente a nuestro laboratorio técnico de <strong>${settings.businessName || 'nuestra empresa'}</strong>.</p>
                            <p>Adjuntamos el comprobante oficial en PDF con los detalles del ingreso.</p>
                            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <strong>Orden de Servicio:</strong> #${ticket.id}<br>
                                <strong>Equipo:</strong> ${ticket.brand} ${ticket.model}
                            </div>
                            <p>Te mantendremos informado sobre el avance del diagnóstico.</p>
                        </div>
                    </div>
                `,
                attachments: [
                    {
                        filename: `Comprobante-Ingreso-${ticket.id}.pdf`,
                        content: pdfContent
                    }
                ]
            });
            console.log(`[EMAIL] Success: Intake receipt sent to ${targetEmail}`);
            res.json({ success: true, message: `Comprobante enviado a ${targetEmail}` });
        } catch (mailError) {
            console.error(`[EMAIL] Transport failure:`, mailError.message);
            res.status(502).json({ error: `Error en el servidor de correos: ${mailError.message}` });
        }

    } catch (error) {
        console.error(`[EMAIL] General 500 Error for Ticket #${ticketId}:`, error);
        res.status(500).json({ error: `Error interno al enviar comprobante: ${error.message}` });
    }
};
// Added missing exports for administrative audit

export const getReceipts = (req, res) => {
    const query = `
        SELECT t.*, u.name as technicianName 
        FROM tickets t 
        LEFT JOIN users u ON t.assignedTo = u.id 
        ORDER BY t.createdAt DESC 
        LIMIT 100
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

export const createReceipt = (req, res) => {
    const { clientName, clientPhone, clientEmail, brand, model, issueDescription } = req.body;
    const createdAt = new Date().toISOString();
    
    const sql = `INSERT INTO tickets (clientName, clientPhone, clientEmail, brand, model, issueDescription, createdAt, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'RECEIVED')`;
    
    db.run(sql, [clientName, clientPhone, clientEmail, brand, model, issueDescription, createdAt], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID });
    });
};

export const generatePDF = (req, res) => {
    const { id } = req.params;
    
    const settingsKeys = ['businessName', 'businessAddress', 'whatsappNumber', 'businessEmail', 'businessDomain'];
    const settings = {};
    
    const fetchData = async () => {
        for (const key of settingsKeys) {
            settings[key] = await getSetting(key);
        }
        
        return new Promise((resolve) => {
            const query = `
                SELECT t.*, u.name as technicianName 
                FROM tickets t 
                LEFT JOIN users u ON t.assignedTo = u.id 
                WHERE t.id = ?
            `;
            db.get(query, [id], (err, row) => {
                if (err || !row) return resolve(null);
                db.all('SELECT * FROM ticket_evidence WHERE ticket_id = ?', [id], (evErr, evRows) => {
                    row.dbEvidence = evRows || [];
                    resolve(row);
                });
            });
        });
    };
    
    fetchData().then(ticket => {
        if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });
        
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=Comprobante-Ingreso-${ticket.id}.pdf`);
        doc.pipe(res);
        
        const businessName = settings.businessName || 'LA BODEGA DEL COMPUTADOR';
        const businessAddress = settings.businessAddress || 'Cl. 49 #13-13, Barrancabermeja';
        const businessPhone = settings.whatsappNumber || '+57 317 653 2488';
        const businessEmail = settings.businessEmail || 'ventas@labodegadelcomputador.com';
        
        // Header
        doc.fillColor('#1e293b').fontSize(20).text(businessName, { align: 'center' });
        doc.fillColor('#64748b').fontSize(10).text('DEL COMPUTADOR', { align: 'center' });
        doc.moveDown();
        doc.fillColor('#2563eb').fontSize(16).text(`Orden de Servicio No. #${ticket.id}`, { align: 'center' });
        doc.moveDown(2);
        
        // Línea divisoria
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e2e8f0').stroke();
        doc.moveDown();
        
        // Cliente info
        doc.fillColor('#2563eb').fontSize(12).text('CLIENTE', 50);
        doc.moveDown(0.5);
        doc.fillColor('#1e293b').fontSize(11);
        doc.text(`Nombre: ${ticket.clientName || 'N/A'}`);
        doc.text(`Teléfono: ${ticket.clientPhone || 'N/A'}`);
        doc.text(`Email: ${ticket.clientEmail || 'N/A'}`);
        doc.text(`Fecha: ${new Date(ticket.createdAt).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`);
        doc.moveDown();
        
        // Equipo info
        doc.fillColor('#2563eb').fontSize(12).text('EQUIPO', 50);
        doc.moveDown(0.5);
        doc.fillColor('#1e293b').fontSize(11);
        doc.text(`Tipo: ${ticket.deviceType || 'Equipo'}`);
        doc.text(`Marca: ${ticket.brand || 'Genérico'}`);
        doc.text(`Modelo: ${ticket.model || 'N/A'}`);
        doc.text(`Serial: ${ticket.serial || 'S/N'}`);
        doc.moveDown();
        
        // Descripción
        doc.fillColor('#2563eb').fontSize(12).text('DESCRIPCIÓN DEL PROBLEMA', 50);
        doc.moveDown(0.5);
        doc.fillColor('#475569').fontSize(10);
        doc.text(ticket.issueDescription || 'Sin descripción', { width: 495 });
        doc.moveDown();

        // Evidencia fotográfica
        if (ticket.dbEvidence && ticket.dbEvidence.length > 0) {
            doc.moveDown();
            doc.fillColor('#2563eb').fontSize(12).text('EVIDENCIA FOTOGRÁFICA', 50);
            doc.moveDown(0.5);
            
            const imgWidth = 160;
            const imgHeight = 120;
            let xPos = 50;
            let yPos = doc.y;
            
            for (const evidence of ticket.dbEvidence) {
                if (evidence.photo_data) {
                    try {
                        const imgBuffer = Buffer.from(evidence.photo_data, 'base64');
                        doc.image(imgBuffer, xPos, yPos, { width: imgWidth, height: imgHeight });
                        xPos += imgWidth + 10;
                        if (xPos > 400) {
                            xPos = 50;
                            yPos += imgHeight + 10;
                        }
                    } catch (imgErr) {
                        console.error('Error adding image to PDF:', imgErr);
                    }
                }
            }
            doc.moveDown(2);
        }
        
        doc.moveDown();
        
        // Firmas
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e2e8f0').stroke();
        doc.moveDown();
        
        doc.fillColor('#1e293b').fontSize(10);
        doc.text('Entregado por:', 50);
        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(200, doc.y).strokeColor('#1e293b').stroke();
        doc.text(ticket.technicianName || 'Recepción', 50);
        
        doc.text('Recibido por:', 350);
        doc.moveTo(350, doc.y - 5).lineTo(500, doc.y - 5).strokeColor('#1e293b').stroke();
        doc.text(ticket.clientName || 'Firma Cliente', 350);
        
        doc.moveDown(3);
        
        // Footer
        doc.fillColor('#64748b').fontSize(8).text(`PBX: ${businessPhone} | ${businessAddress} | ${businessEmail}`, { align: 'center' });
        
        doc.end();
    });
};
