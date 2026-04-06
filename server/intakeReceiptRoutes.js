// Intake Receipt Generation (Comprobante de Ingreso)
import { db } from './db.js';
import { sendEmail } from './mail.js';
import { safeParse } from './utils.js';
import PDFDocument from 'pdfkit';

// Helper to fetch settings from DB
const getSetting = (key, defaultValue = '') => {
    return new Promise((resolve) => {
        db.get('SELECT value FROM settings WHERE key = ?', [key], (err, row) => {
            if (err || !row) resolve(defaultValue);
            else resolve(row.value);
        });
    });
};

// Helper to ensure absolute URLs for images
const getAbsoluteUrl = (path, baseUrl) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanPath = path.startsWith('/') ? path : '/' + path;
    return `${cleanBase}${cleanPath}`;
};

const generateIntakeHtml = (ticket, evidenceList = [], baseUrl = '', settings = {}) => {
    const date = new Date(ticket.createdAt).toLocaleDateString('es-CO', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    let photos = [];
    try {
        const legacyPhotos = safeParse(ticket.photosIntake);
        const validLegacy = legacyPhotos.filter(p => p && !p.startsWith('blob:'));
        const evidenceData = (evidenceList || []).map(ev => ev.photo_data);
        photos = [...validLegacy, ...evidenceData];
    } catch { photos = []; }

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comprobante de Ingreso #${ticket.id || 'N/A'}</title>
    <style>
        @page { margin: 0.5cm; size: A4; }
        :root {
            --primary: #2563eb;
            --secondary: #64748b;
            --accent: #3b82f6;
            --bg-light: #f1f5f9;
            --text-dark: #1e293b;
            --text-light: #64748b;
            --border: #e2e8f0;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { margin: 0; padding: 0; width: 100%; height: 100%; }
        body { font-family: 'Inter', sans-serif; background: #e2e8f0; color: var(--text-dark); }
        .receipt-container { width: 100%; background: white; }
        .header { background: var(--text-dark); color: white; padding: 20px 25px; display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid var(--primary); }
        .brand-logo { width: 35px; height: 35px; background: var(--primary); border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .logo-section h1 { margin: 0; font-size: 16px; font-weight: 900; }
        .logo-section p { margin: 0; font-size: 8px; opacity: 0.6; }
        .ticket-badge { text-align: right; }
        .ticket-badge strong { font-size: 20px; color: var(--accent); }
        .content { padding: 20px 25px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
        .info-card { background: #fff; border: 1px solid var(--border); border-radius: 8px; padding: 15px; }
        .section-header { font-size: 10px; font-weight: 800; text-transform: uppercase; margin-bottom: 10px; color: var(--primary); }
        .field { margin-bottom: 8px; }
        .field label { font-size: 8px; color: var(--text-light); text-transform: uppercase; font-weight: 800; display: block; }
        .field .value { font-size: 12px; font-weight: 600; }
        .description-box { background: #f8fafc; padding: 12px; border-radius: 6px; border-left: 3px solid var(--primary); font-size: 11px; }
        .photo-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 10px; }
        .photo-card { border-radius: 4px; overflow: hidden; aspect-ratio: 1; border: 1px solid var(--border); }
        .photo-card img { width: 100%; height: 100%; object-fit: cover; }
        .signatures { display: flex; justify-content: space-between; margin-top: 30px; }
        .sign-box { width: 40%; border-top: 1px solid var(--text-dark); text-align: center; padding-top: 8px; font-size: 9px; }
        .footer { background: #f8fafc; padding: 12px; text-align: center; font-size: 9px; color: var(--text-light); }
    </style>
</head>
<body>
    <div class="receipt-container">
        <div class="header">
            <div style="display: flex; align-items: center; gap: 10px;">
                <div class="brand-logo">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
                </div>
                <div class="logo-section">
                    <h1>LA BODEGA</h1>
                    <p>DEL COMPUTADOR</p>
                </div>
            </div>
            <div class="ticket-badge">
                <span>Orden No.</span>
                <strong>#${ticket.id}</strong>
            </div>
        </div>
        <div class="content">
            <div class="info-grid">
                <div class="info-card">
                    <div class="section-header">Cliente</div>
                    <div class="field"><label>Nombre</label><div class="value">${ticket.clientName}</div></div>
                    <div class="field"><label>Teléfono</label><div class="value">${ticket.clientPhone}</div></div>
                    <div class="field"><label>Fecha</label><div class="value">${date}</div></div>
                </div>
                <div class="info-card">
                    <div class="section-header">Equipo</div>
                    <div class="field"><label>Marca/Tipo</label><div class="value">${ticket.brand} - ${ticket.deviceType}</div></div>
                    <div class="field"><label>Modelo/Serial</label><div class="value">${ticket.model || 'N/A'} / ${ticket.serial || 'S/N'}</div></div>
                </div>
            </div>
            <div class="section-header">Problema Reportado</div>
            <div class="description-box">${ticket.issueDescription}</div>
            ${photos.length > 0 ? `<div class="photo-grid">${photos.map(p => `<div class="photo-card"><img src="${getAbsoluteUrl(p, baseUrl)}"></div>`).join('')}</div>` : ''}
            
            <div class="signatures">
                <div class="sign-box">
                    ${ticket.signatureIntakeTech ? `<img src="${ticket.signatureIntakeTech}" style="max-height: 60px; margin-bottom: 5px;"><br>` : '<div style="height: 60px;"></div>'}
                    <strong>Firma Recepción</strong><br>
                    <span style="font-size: 8px;">Técnico Responsable</span>
                </div>
                <div class="sign-box">
                    ${ticket.signatureIntakeClient ? `<img src="${ticket.signatureIntakeClient}" style="max-height: 60px; margin-bottom: 5px;"><br>` : '<div style="height: 60px;"></div>'}
                    <strong>Firma Cliente</strong><br>
                    <span style="font-size: 8px;">Aceptación de Condiciones</span>
                </div>
            </div>
        </div>
        <div class="footer">${settings.businessAddress} | PBX: ${settings.whatsappNumber}</div>
    </div>
</body>
</html>`;
};

export const previewIntakeReceipt = (req, res) => {
    const { ticketId } = req.params;
    const settingsKeys = ['businessName', 'businessAddress', 'whatsappNumber', 'businessEmail', 'businessDomain'];
    const settings = {};
    const fetch = async () => {
        for (const key of settingsKeys) settings[key] = await getSetting(key);
        return new Promise(resolve => {
            db.get(`SELECT t.*, u.name as technicianName FROM tickets t LEFT JOIN users u ON t.assignedTo = u.id WHERE t.id = ?`, [ticketId], (err, row) => {
                if (!row) return resolve(null);
                db.all('SELECT * FROM ticket_evidence WHERE ticket_id = ?', [ticketId], (evErr, evRows) => {
                    row.dbEvidence = evRows || [];
                    resolve(row);
                });
            });
        });
    };
    fetch().then(ticket => {
        if (!ticket) return res.status(404).json({ error: 'Ticket non-existent' });
        const host = req.get('host');
        const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
        const baseUrl = `${protocol}://${host}`;
        res.send(generateIntakeHtml(ticket, ticket.dbEvidence || [], baseUrl, settings));
    });
};

export const sendIntakeReceipt = async (req, res) => {
    const { ticketId } = req.params;
    const { email } = req.body;
    try {
        const settingsKeys = ['businessName', 'businessAddress', 'whatsappNumber', 'businessEmail', 'businessDomain'];
        const settings = {};
        for (const key of settingsKeys) settings[key] = await getSetting(key);

        const ticket = await new Promise((resolve, reject) => {
            db.get(`SELECT t.*, u.name as technicianName FROM tickets t LEFT JOIN users u ON t.assignedTo = u.id WHERE t.id = ?`, [ticketId], (err, row) => {
                if (err) return reject(err);
                if (!row) return resolve(null);
                db.all('SELECT * FROM ticket_evidence WHERE ticket_id = ?', [ticketId], (evErr, evRows) => {
                    row.dbEvidence = evRows || [];
                    resolve(row);
                });
            });
        });

        if (!ticket) return res.status(404).json({ error: 'Ticket non-existent' });
        let targetEmail = email || ticket.clientEmail;
        if (!targetEmail) return res.json({ success: false, message: 'No hay email válido' });

        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        let chunks = [];
        doc.on('data', c => chunks.push(c));
        const pdfGenerated = new Promise(resolve => {
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            
            // Header
            doc.fillColor('#1e293b').fontSize(18).text(settings.businessName, { align: 'center', weight: 'bold' });
            doc.fontSize(8).text('Laboratorio de Servicio Técnico Especializado', { align: 'center' });
            doc.moveDown(0.5);
            doc.strokeColor('#2563eb').lineWidth(2).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
            doc.moveDown();

            // ID Badge
            doc.fontSize(14).fillColor('#2563eb').text(`COMPROBANTE DE INGRESO #${ticket.id}`, { align: 'right' });
            doc.fillColor('#64748b').fontSize(9).text(new Date(ticket.createdAt).toLocaleString('es-CO'), { align: 'right' });
            doc.moveDown();

            // Client Info
            doc.fillColor('#1e293b').fontSize(11).text('INFORMACIÓN DEL CLIENTE', { underline: true });
            doc.fontSize(10).text(`Nombre: ${ticket.clientName}`);
            doc.text(`Teléfono: ${ticket.clientPhone}`);
            doc.text(`Email: ${ticket.clientEmail || 'N/A'}`);
            doc.moveDown();

            // Device Info
            doc.fontSize(11).text('DETALLES DEL EQUIPO', { underline: true });
            doc.fontSize(10).text(`Marca: ${ticket.brand}`);
            doc.text(`Modelo: ${ticket.model || 'N/A'}`);
            doc.text(`Tipo: ${ticket.deviceType}`);
            doc.text(`Serial: ${ticket.serial || 'S/N'}`);
            doc.moveDown();

            // Issue description
            doc.fontSize(11).text('PROBLEMA REPORTADO', { underline: true });
            doc.fontSize(10).fillColor('#334155').text(ticket.issueDescription, { align: 'justify' });
            doc.moveDown(2);

            // Signatures
            const signatureY = doc.y;
            if (ticket.signatureIntakeTech) {
                try {
                    doc.image(ticket.signatureIntakeTech, 60, signatureY, { height: 40 });
                } catch (e) { console.error('Error drawing tech signature', e); }
            }
            doc.strokeColor('#1e293b').lineWidth(1).moveTo(60, signatureY + 40).lineTo(220, signatureY + 40).stroke();
            doc.fontSize(9).text('Firma Recepción', 60, signatureY + 45, { width: 160, align: 'center' });

            if (ticket.signatureIntakeClient) {
                try {
                    doc.image(ticket.signatureIntakeClient, 360, signatureY, { height: 40 });
                } catch (e) { console.error('Error drawing client signature', e); }
            }
            doc.strokeColor('#1e293b').lineWidth(1).moveTo(360, signatureY + 40).lineTo(520, signatureY + 40).stroke();
            doc.text('Firma Cliente', 360, signatureY + 45, { width: 160, align: 'center' });

            // Footer
            doc.fontSize(8).fillColor('#94a3b8').text(`${settings.businessAddress} | WhatsApp: ${settings.whatsappNumber}`, 40, 750, { align: 'center' });
            
            doc.end();
        });
        const pdfContent = await pdfGenerated;

        await sendEmail({
            to: targetEmail,
            subject: `Comprobante de Ingreso #${ticket.id} - Tu equipo ha sido recibido`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: #2563eb; padding: 20px; text-align: center; color: white;">
                        <h1 style="margin: 0;">Comprobante de Ingreso</h1>
                    </div>
                    <div style="padding: 30px;">
                        <p>Hola <strong>${ticket.clientName}</strong>,</p>
                        <p>Hemos recibido tu equipo en nuestro laboratorio de servicio técnico. A continuación encontrarás los detalles:</p>
                        <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin: 20px 0;">
                            <p><strong>Equipo:</strong> ${ticket.brand} ${ticket.model || ''}</p>
                            <p><strong>Serial:</strong> ${ticket.serial || 'N/A'}</p>
                            <p><strong>Falla reportada:</strong> ${ticket.issueDescription}</p>
                        </div>
                        <p>Adjunto encontrarás el comprobante de ingreso con toda la información de tu equipo.</p>
                        <p style="color: #64748b; font-size: 14px;">¿Preguntas? Contáctanos por WhatsApp.</p>
                    </div>
                </div>
            `,
            attachments: [{ filename: `Comprobante-Ingreso-${ticket.id}.pdf`, content: pdfContent }],
            type: 'soporte'
        });
        res.json({ success: true, message: `Enviado a ${targetEmail}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getReceipts = (req, res) => {
    db.all(`SELECT t.*, u.name as technicianName FROM tickets t LEFT JOIN users u ON t.assignedTo = u.id ORDER BY t.createdAt DESC LIMIT 100`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
};

export const createReceipt = (req, res) => {
    const { clientName, clientPhone, clientEmail, brand, model, issueDescription } = req.body;
    const createdAt = new Date().toISOString();
    db.run(`INSERT INTO tickets (clientName, clientPhone, clientEmail, brand, model, issueDescription, createdAt, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'RECEIVED')`, 
        [clientName, clientPhone, clientEmail, brand, model, issueDescription, createdAt], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id: this.lastID });
    });
};

export const generatePDF = (req, res) => {
    const { ticketId } = req.params;
    const settingsKeys = ['businessName', 'businessAddress', 'whatsappNumber', 'businessEmail', 'businessDomain'];
    const settings = {};
    const fetch = async () => {
        for (const key of settingsKeys) settings[key] = await getSetting(key);
        return new Promise(resolve => {
            db.get(`SELECT t.*, u.name as technicianName FROM tickets t LEFT JOIN users u ON t.assignedTo = u.id WHERE t.id = ?`, [ticketId], (err, row) => {
                if (!row) return resolve(null);
                db.all('SELECT * FROM ticket_evidence WHERE ticket_id = ?', [ticketId], (evErr, evRows) => {
                    row.dbEvidence = evRows || [];
                    resolve(row);
                });
            });
        });
    };
    fetch().then(ticket => {
        if (!ticket) return res.status(404).json({ error: 'No encontrado' });
        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=Comprobante_Ingreso_${ticket.id}.pdf`);
        doc.pipe(res);
        
        // Header
        doc.fillColor('#1e293b').fontSize(18).text(settings.businessName, { align: 'center', weight: 'bold' });
        doc.fontSize(8).text('Laboratorio de Servicio Técnico Especializado', { align: 'center' });
        doc.moveDown(0.5);
        doc.strokeColor('#2563eb').lineWidth(2).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
        doc.moveDown();

        // ID Badge
        doc.fontSize(14).fillColor('#2563eb').text(`COMPROBANTE DE INGRESO #${ticket.id}`, { align: 'right' });
        doc.fillColor('#64748b').fontSize(9).text(new Date(ticket.createdAt).toLocaleString('es-CO'), { align: 'right' });
        doc.moveDown();

        // Data Grid (Partial Simulation)
        doc.fillColor('#1e293b').fontSize(11).text('DATOS DEL SERVICIO', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10).text(`Cliente:`, { continued: true }).text(` ${ticket.clientName}`, { weight: 'bold' });
        doc.text(`Teléfono:`, { continued: true }).text(` ${ticket.clientPhone}`);
        doc.text(`Equipo:`, { continued: true }).text(` ${ticket.brand} ${ticket.model || ''}`);
        doc.text(`Serial:`, { continued: true }).text(` ${ticket.serial || 'S/N'}`);
        doc.moveDown();

        doc.fontSize(11).text('FALLA REPORTADA', { underline: true });
        doc.fontSize(10).fillColor('#334155').text(ticket.issueDescription, { align: 'justify' });
        doc.moveDown(2);

        // Signatures
        const signatureY = Math.min(doc.y + 20, 680);
        if (ticket.signatureIntakeTech) {
            try {
                doc.image(ticket.signatureIntakeTech, 60, signatureY, { height: 40 });
            } catch (e) { console.error('Error drawing intake tech signature', e); }
        }
        doc.strokeColor('#1e293b').lineWidth(1).moveTo(60, signatureY + 40).lineTo(220, signatureY + 40).stroke();
        doc.fontSize(9).text('Recibido por LBDC', 60, signatureY + 45, { width: 160, align: 'center' });

        if (ticket.signatureIntakeClient) {
            try {
                doc.image(ticket.signatureIntakeClient, 360, signatureY, { height: 40 });
            } catch (e) { console.error('Error drawing intake client signature', e); }
        }
        doc.strokeColor('#1e293b').lineWidth(1).moveTo(360, signatureY + 40).lineTo(520, signatureY + 40).stroke();
        doc.text('Acepto Condiciones', 360, signatureY + 45, { width: 160, align: 'center' });

        // Photos Page
        if (ticket.dbEvidence && ticket.dbEvidence.length > 0) {
            doc.addPage();
            doc.fillColor('#2563eb').fontSize(14).text('EVIDENCIA FOTOGRÁFICA DE INGRESO', { align: 'center', underline: true });
            doc.moveDown();
            
            let currentX = 50;
            let currentY = doc.y + 20;
            const imgWidth = 240;
            const imgHeight = 180;
            const margin = 20;

            ticket.dbEvidence.forEach((ev, index) => {
                // If odd index, move to second column
                if (index % 2 !== 0) {
                    currentX = 50 + imgWidth + margin;
                } else if (index > 0) {
                    // If even index (except first), move to next row
                    currentX = 50;
                    currentY += imgHeight + margin;
                }

                // Check for page break
                if (currentY + imgHeight > 750) {
                    doc.addPage();
                    doc.fillColor('#2563eb').fontSize(12).text('EVIDENCIA FOTOGRÁFICA (Cont.)', { align: 'center' });
                    currentY = 100;
                    currentX = 50;
                }

                try {
                    doc.image(ev.photo_data, currentX, currentY, { width: imgWidth, height: imgHeight });
                    doc.rect(currentX, currentY, imgWidth, imgHeight).strokeColor('#e2e8f0').lineWidth(1).stroke();
                } catch (e) { 
                    console.error('Error drawing PDF image', e);
                }
            });
        }

        // Footer
        doc.fontSize(8).fillColor('#94a3b8').text(`${settings.businessAddress} | PBX: ${settings.whatsappNumber}`, 40, 780, { align: 'center' });

        doc.end();
    });
};
