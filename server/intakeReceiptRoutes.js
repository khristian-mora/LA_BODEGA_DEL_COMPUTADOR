// Intake Receipt Generation (Comprobante de Ingreso)
import { db } from './db.js';
import nodemailer from 'nodemailer';
import path from 'path';

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

// Helper is no longer needed for DB images as we embed them or use the API route, 
// but we keep it if we mix legacy file-based images.
const getFullImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('data:')) return path; // Already base64
    if (path.startsWith('http')) return path;
    const baseUrl = process.env.PUBLIC_URL || `http://${process.env.HOST || 'localhost'}:${process.env.PORT || 3000}`;
    return `${baseUrl}${path}`;
};

const generateIntakeHtml = (ticket, evidenceList = []) => {
    const date = new Date(ticket.createdAt).toLocaleDateString('es-CO', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    // Merge legacy photos (if any) with new DB evidence
    let legacyPhotos = [];
    try {
        legacyPhotos = typeof ticket.photosIntake === 'string' ? JSON.parse(ticket.photosIntake) : (ticket.photosIntake || []);
    } catch (e) { legacyPhotos = []; }

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Comprobante de Ingreso - ${ticket.id}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
        
        :root {
            --primary: #004236;
            --accent: #CCD32A;
            --text-dark: #1e293b;
            --text-light: #64748b;
            --bg-light: #f8fafc;
        }

        body {
            font-family: 'Inter', sans-serif;
            background-color: #e2e8f0;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .receipt-container {
            max-width: 800px;
            margin: 20px auto;
            background: white;
            padding: 0;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            position: relative;
        }

        .header {
            background-color: var(--primary);
            color: white;
            padding: 30px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 4px solid var(--accent);
        }

        .logo-section h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.5px;
        }

        .logo-section p {
            margin: 5px 0 0;
            opacity: 0.8;
            font-size: 14px;
        }

        .ticket-id {
            text-align: right;
        }

        .ticket-id span {
            display: block;
            font-size: 12px;
            opacity: 0.8;
            text-transform: uppercase;
        }

        .ticket-id strong {
            font-size: 32px;
            font-weight: 800;
            color: var(--accent);
        }

        .content {
            padding: 40px;
        }

        .section-title {
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: var(--text-light);
            font-weight: 600;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 10px;
            margin-bottom: 20px;
            margin-top: 30px;
        }
        .section-title:first-child {
            margin-top: 0;
        }

        .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
        }

        .field {
            margin-bottom: 15px;
        }

        .field label {
            display: block;
            font-size: 11px;
            color: var(--text-light);
            text-transform: uppercase;
            margin-bottom: 4px;
        }

        .field .value {
            font-size: 16px;
            color: var(--text-dark);
            font-weight: 600;
            border-left: 2px solid var(--accent);
            padding-left: 10px;
        }

        .description-box {
            background: var(--bg-light);
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            font-size: 14px;
            color: var(--text-dark);
            line-height: 1.6;
        }

        .photo-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        
        .photo-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
            background: #f8fafc;
        }
        
        .photo-card img {
            width: 100%;
            height: 150px;
            object-fit: cover;
            display: block;
        }
        
        .photo-label {
            padding: 8px;
            font-size: 10px;
            color: #64748b;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }

        .disclaimer {
            margin-top: 40px;
            font-size: 10px;
            color: #64748b;
            text-align: justify;
            line-height: 1.5;
            padding: 20px;
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
        }

        .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 60px;
            padding-top: 20px;
        }

        .signature-box {
            width: 40%;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 12px;
            color: var(--text-light);
            padding-top: 10px;
        }

        .footer {
            background: var(--primary);
            color: white;
            text-align: center;
            padding: 15px;
            font-size: 12px;
        }

        @media print {
            body { background: white; }
            .receipt-container { margin: 0; box-shadow: none; width: 100%; max-width: 100%; }
            .header { -webkit-print-color-adjust: exact; }
        }
    </style>
</head>
<body>

    <div class="receipt-container">
        <div class="header">
            <div class="logo-section">
                <h1>LA BODEGA DEL COMPUTADOR</h1>
                <p>Comprobante de Recepción de Equipo</p>
            </div>
            <div class="ticket-id">
                <span>Orden de Servicio</span>
                <strong>#${ticket.id}</strong>
            </div>
        </div>

        <div class="content">
            <div class="grid">
                <div>
                    <div class="section-title">Datos del Cliente</div>
                    <div class="field">
                        <label>Nombre</label>
                        <div class="value">${ticket.clientName}</div>
                    </div>
                    <div class="field">
                        <label>Teléfono</label>
                        <div class="value">${ticket.clientPhone}</div>
                    </div>
                    <div class="field">
                        <label>Fecha de Ingreso</label>
                        <div class="value">${date}</div>
                    </div>
                </div>
                <div>
                    <div class="section-title">Datos del Equipo</div>
                    <div class="field">
                        <label>Tipo</label>
                        <div class="value">${ticket.deviceType}</div>
                    </div>
                    <div class="field">
                        <label>Marca / Modelo</label>
                        <div class="value">${ticket.brand} ${ticket.model}</div>
                    </div>
                    <div class="field">
                        <label>Serial / IMEI</label>
                        <div class="value">${ticket.serial || 'N/A'}</div>
                    </div>
                </div>
            </div>

            <div class="section-title">Detalle del Servicio</div>
            <div class="description-box">
                <div style="font-weight: bold; margin-bottom: 5px; color: var(--primary);">Motivo de Ingreso / Falla Reportada:</div>
                ${ticket.issueDescription}
            </div>

            ${(evidenceList.length > 0 || legacyPhotos.length > 0) ? `
            <div class="section-title">Evidencia Fotográfica de Ingreso</div>
            <div class="photo-grid">
                ${evidenceList.map((photo, index) => `
                <div class="photo-card">
                    <img src="${photo.photo_data}" alt="Evidencia DB ${index + 1}">
                    <div class="photo-label">Evidencia ${index + 1}</div>
                </div>
                `).join('')}
                ${legacyPhotos.map((url, index) => `
                <div class="photo-card">
                    <img src="${getFullImageUrl(url)}" alt="Evidencia ${evidenceList.length + index + 1}">
                    <div class="photo-label">Evidencia ${evidenceList.length + index + 1}</div>
                </div>
                `).join('')}
            </div>
            ` : ''}

            <div class="disclaimer">
                <strong>CLÁUSULA DE RESPONSABILIDAD Y GARANTÍA:</strong><br><br>
                1. <strong>Diagnóstico:</strong> El valor del diagnóstico (si aplica) no es reembolsable. El diagnóstico preliminar está sujeto a verificación técnica profunda.<br>
                2. <strong>Información:</strong> LA BODEGA DEL COMPUTADOR no se hace responsable por la pérdida de información (datos, archivos, software) almacenada en los equipos. Es responsabilidad del cliente realizar copias de seguridad antes de entregar el equipo.<br>
                3. <strong>Garantía:</strong> La garantía por reparaciones es de tres (3) meses y cubre exclusivamente la mano de obra y repuestos cambiados por la misma falla. No cubre daños por virus, software, humedad, golpes, sobrecargas eléctricas o manipulación por terceros.<br>
                4. <strong>Abandono:</strong> Pasados treinta (30) días calendario desde la notificación de finalización del servicio (reparado o no), si el equipo no es retirado, se cobrará bodegaje diario. Pasados noventa (90) días, el equipo se considerará abandonado y LA BODEGA DEL COMPUTADOR podrá disponer de él para cubrir los costos de revisión, reparación y almacenamiento (Artículo 18 de la Ley 1480 de 2011).<br>
                5. <strong>Estado del Equipo:</strong> El equipo se recibe en el estado descrito. Rayones o golpes no reportados en el momento del ingreso se asumen como preexistentes.
            </div>

            <div class="signature-section">
                <div class="signature-box">
                    Firma del Cliente<br>
                    (Acepto términos y condiciones)
                </div>
                <div class="signature-box">
                    Recibido por:<br>
                    <strong>La Bodega del Computador</strong>
                </div>
            </div>
        </div>

        <div class="footer">
            Dirección: Cl. 49 #13-13, Barrancabermeja | Tel: ${process.env.BUSINESS_PHONE || '300 000 0000'} | Email: ventas@labodega.com
        </div>
    </div>

</body>
</html>
    `;
};

// Preview Endpoint
export const previewIntakeReceipt = (req, res) => {
    const { ticketId } = req.params;
    db.get('SELECT * FROM tickets WHERE id = ?', [ticketId], (err, ticket) => {
        if (err || !ticket) return res.status(404).send('Ticket not found');

        // Fetch evidence
        db.all('SELECT * FROM ticket_evidence WHERE ticket_id = ?', [ticketId], (err, evidence) => {
            const html = generateIntakeHtml(ticket, evidence || []);
            res.setHeader('Content-Type', 'text/html');
            res.send(html);
        });
    });
};

// Send Email Endpoint
export const sendIntakeReceipt = async (req, res) => {
    const { ticketId } = req.params;
    const { email } = req.body; // Optional override

    try {
        const ticket = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM tickets WHERE id = ?', [ticketId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

        const evidence = await new Promise((resolve) => {
            db.all('SELECT * FROM ticket_evidence WHERE ticket_id = ?', [ticketId], (err, rows) => {
                resolve(rows || []);
            });
        });

        // Extract email from tickets field or param
        let targetEmail = email;
        if (!targetEmail && ticket.clientPhone && ticket.clientPhone.includes('@')) {
            targetEmail = ticket.clientPhone;
        }

        if (!targetEmail) {
            return res.json({ success: false, message: 'No valid email found to send receipt.' });
        }

        const html = generateIntakeHtml(ticket, evidence);

        await transporter.sendMail({
            from: process.env.SMTP_FROM || 'LA BODEGA DEL COMPUTADOR <noreply@labodega.com>',
            to: targetEmail,
            subject: `Comprobante de Ingreso #${ticket.id} - La Bodega del Computador`,
            html: html
        });

        res.json({ success: true, message: `Receipt sent to ${targetEmail}` });

    } catch (error) {
        console.error('Error sending intake receipt:', error);
        res.status(500).json({ error: error.message });
    }
};
