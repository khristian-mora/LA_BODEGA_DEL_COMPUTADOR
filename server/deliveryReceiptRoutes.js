import { db } from './db.js';
import { sendEmail } from './mail.js';
import { safeParse } from './utils.js';
import PDFDocument from 'pdfkit';

const getSetting = (key, defaultValue = '') => {
    return new Promise((resolve) => {
        db.get('SELECT value FROM settings WHERE key = ?', [key], (err, row) => {
            if (err || !row) resolve(defaultValue);
            else resolve(row.value);
        });
    });
};

const LABOR_WARRANTY_DAYS = 30;
const PARTS_WARRANTY_DAYS = 90;

const generateDeliveryHtml = (ticket, _baseUrl = '', settings = {}) => {
    const date = new Date().toLocaleDateString('es-CO', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
    
    const quoteItems = safeParse(ticket.quoteItems) || [];
    const laborItems = safeParse(ticket.laborItems) || [];
    const total = quoteItems.reduce((s, i) => s + (i.price * i.quantity), 0) + laborItems.reduce((s, i) => s + (i.price || 0), 0);
    
    const hasLabor = laborItems.length > 0;
    const hasParts = quoteItems.length > 0;
    
    let photos = [];
    try {
        const dbEvidence = ticket.dbEvidence || [];
        photos = dbEvidence.map(ev => ev.photo_data);
    } catch { photos = []; }

    let warrantyHtml = '';
    
    if (hasLabor && hasParts) {
        warrantyHtml = `
            <div style="border: 2px solid #059669; padding: 15px; border-radius: 10px; margin-bottom: 10px; background: #f0fdf4;">
                <div style="font-weight: 700; color: #059669; font-size: 12px; margin-bottom: 5px;">GARANTÍA POR MANO DE OBRA (Servicio Técnico)</div>
                <p style="font-size: 11px; margin: 0;">Este servicio técnico cuenta con una garantía de <b>${LABOR_WARRANTY_DAYS} días</b> a partir de la fecha ${date}, cubriendo exclusivamente el trabajo de reparación realizado.</p>
            </div>
            <div style="border: 2px solid #7c3aed; padding: 15px; border-radius: 10px; background: #faf5ff;">
                <div style="font-weight: 700; color: #7c3aed; font-size: 12px; margin-bottom: 5px;">GARANTÍA POR PARTES Y ACCESORIOS</div>
                <p style="font-size: 11px; margin: 0;">Los repuestos y accesorios instalados cuentan con una garantía de <b>${PARTS_WARRANTY_DAYS} días</b> a partir de la fecha ${date}, cubriendo exclusivamente los componentes reemplazados.</p>
            </div>
        `;
    } else if (hasLabor) {
        warrantyHtml = `
            <div style="border: 2px dashed #10b981; padding: 20px; border-radius: 12px; margin-top: 30px; background: #f0fdf4;">
                <div style="font-weight: 800; color: #059669; margin-bottom: 5px;">CERTIFICADO DE GARANTÍA - MANO DE OBRA</div>
                <p style="font-size: 12px; margin: 0;">Este servicio técnico cuenta con una garantía de <b>${LABOR_WARRANTY_DAYS} días</b> a partir de la fecha ${date}, cubriendo exclusivamente el trabajo de reparación realizado y la mano de obra empleada.</p>
            </div>
        `;
    } else if (hasParts) {
        warrantyHtml = `
            <div style="border: 2px dashed #10b981; padding: 20px; border-radius: 12px; margin-top: 30px; background: #f0fdf4;">
                <div style="font-weight: 800; color: #059669; margin-bottom: 5px;">CERTIFICADO DE GARANTÍA - PARTES Y ACCESORIOS</div>
                <p style="font-size: 12px; margin: 0;">Los repuestos y accesorios instalados cuentan con una garantía de <b>${PARTS_WARRANTY_DAYS} días</b> a partir de la fecha ${date}, cubriendo exclusivamente los componentes reemplazados.</p>
            </div>
        `;
    }

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Inter', sans-serif; color: #1e293b; line-height: 1.5; padding: 40px; background: #f8fafc; }
        .container { background: white; padding: 40px; border-radius: 20px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); max-width: 800px; margin: auto; }
        .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
        .title { font-size: 24px; font-weight: 800; color: #0f172a; margin-top: 10px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
        .section-title { font-size: 12px; font-weight: 800; color: #6366f1; text-transform: uppercase; margin-bottom: 10px; }
        .info-box { background: #f1f5f9; padding: 15px; border-radius: 10px; }
        .total-box { background: #0f172a; color: white; padding: 20px; border-radius: 12px; margin-top: 20px; display: flex; justify-content: space-between; align-items: center; }
        .signatures { display: flex; justify-content: space-between; margin-top: 60px; }
        .sign-box { width: 40%; border-top: 1px solid #94a3b8; text-align: center; padding-top: 8px; font-size: 11px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="margin:0; font-size: 20px;">${settings.businessName}</h1>
            <div class="title">ACTA DE ENTREGA Y GARANTÍA</div>
            <p style="font-size: 12px; color: #64748b;">Orden de Servicio #${ticket.id}</p>
        </div>

        <div class="grid">
            <div class="info-box">
                <div class="section-title">Cliente</div>
                <div style="font-weight: 700;">${ticket.clientName}</div>
                <div style="font-size: 13px;">${ticket.clientPhone}</div>
            </div>
            <div class="info-box">
                <div class="section-title">Equipo</div>
                <div style="font-weight: 700;">${ticket.brand} ${ticket.model || ''}</div>
                <div style="font-size: 13px;">Serial: ${ticket.serial || 'S/N'}</div>
            </div>
        </div>

        <div class="section-title">Trabajos Realizados</div>
        <div style="background: #fff; border: 1px solid #e2e8f0; padding: 15px; border-radius: 10px; margin-bottom: 20px; font-size: 14px;">
            ${ticket.repairNotes || 'Reparación técnica general y mantenimiento preventivo.'}
        </div>

        <div class="total-box">
            <div style="font-weight: 800;">TOTAL PAGADO</div>
            <div style="font-size: 24px; font-weight: 900; color: #10b981;">$${total.toLocaleString('es-CO')}</div>
        </div>

        <div style="margin-top: 30px;">
            <div style="font-weight: 800; color: #059669; margin-bottom: 10px; font-size: 14px;">CERTIFICADOS DE GARANTÍA</div>
            ${warrantyHtml}
        </div>

        <div class="signatures">
            <div class="sign-box">
                ${ticket.signatureDeliveryTech ? `<img src="${ticket.signatureDeliveryTech}" style="max-height: 60px; margin-bottom: 5px;"><br>` : '<div style="height: 60px;"></div>'}
                <strong>Entregado por LBDC</strong><br>
                <span style="font-size: 9px;">Técnico Responsable</span>
            </div>
            <div class="sign-box">
                ${ticket.signatureDeliveryClient ? `<img src="${ticket.signatureDeliveryClient}" style="max-height: 60px; margin-bottom: 5px;"><br>` : '<div style="height: 60px;"></div>'}
                <strong>Recibido a Satisfacción</strong><br>
                <span style="font-size: 9px;">Firma del Cliente</span>
            </div>
        </div>

        </div>

        ${photos.length > 0 ? `
        <div class="section-title" style="margin-top: 30px;">Evidencia Fotográfica de Ingreso</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
            ${photos.map(p => `<img src="${p}" style="width: 100%; border-radius: 8px; border: 1px solid #e2e8f0; aspect-ratio: 4/3; object-fit: cover;">`).join('')}
        </div>
        ` : ''}

        <p style="text-align: center; font-size: 10px; color: #94a3b8; margin-top: 40px;">
            ${settings.businessAddress} | PBX: ${settings.whatsappNumber}
        </p>
    </div>
</body>
</html>`;
};

export const previewDeliveryReceipt = (req, res) => {
    const { ticketId } = req.params;
    const settingsKeys = ['businessName', 'businessAddress', 'whatsappNumber'];
    const settings = {};
    const fetchData = async () => {
        for (const key of settingsKeys) settings[key] = await getSetting(key);
        return new Promise(resolve => {
            db.get(`SELECT * FROM tickets WHERE id = ?`, [ticketId], (err, row) => {
                if (!row) return resolve(null);
                db.all('SELECT photo_data FROM ticket_evidence WHERE ticket_id = ?', [ticketId], (evErr, evRows) => {
                    row.dbEvidence = evRows || [];
                    resolve(row);
                });
            });
        });
    };

    fetchData().then(ticket => {
        if (!ticket) return res.status(404).send('Ticket no encontrado');
        res.send(generateDeliveryHtml(ticket, '', settings));
    });
};

export const sendDeliveryReceipt = async (req, res) => {
    const { ticketId } = req.params;
    const { email } = req.body;

    try {
        const settingsKeys = ['businessName', 'businessAddress', 'whatsappNumber'];
        const settings = {};
        for (const key of settingsKeys) settings[key] = await getSetting(key);

        const ticket = await new Promise(resolve => {
            db.get(`SELECT * FROM tickets WHERE id = ?`, [ticketId], (err, row) => {
                if (!row) return resolve(null);
                db.all('SELECT photo_data FROM ticket_evidence WHERE ticket_id = ?', [ticketId], (evErr, evRows) => {
                    row.dbEvidence = evRows || [];
                    resolve(row);
                });
            });
        });

        if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });
        const targetEmail = email || ticket.clientEmail;
        if (!targetEmail) return res.json({ success: false, message: 'No hay email de destino' });

        const quoteItems = safeParse(ticket.quoteItems) || [];
        const laborItems = safeParse(ticket.laborItems) || [];
        const total = quoteItems.reduce((s, i) => s + (i.price * i.quantity), 0) + laborItems.reduce((s, i) => s + (i.price || 0), 0);
        
        const hasLabor = laborItems.length > 0;
        const hasParts = quoteItems.length > 0;

        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        let chunks = [];
        doc.on('data', c => chunks.push(c));
        const pdfGenerated = new Promise(resolve => {
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            
            doc.fillColor('#0f172a').fontSize(20).text(settings.businessName, { align: 'center' });
            doc.moveDown(0.5).fontSize(14).text('ACTA DE ENTREGA Y GARANTÍA', { align: 'center' });
            doc.strokeColor('#e2e8f0').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
            doc.moveDown();

            doc.fontSize(10).text(`Orden: #${ticket.id}`, { align: 'right' });
            doc.text(`Fecha Entrega: ${new Date().toLocaleDateString('es-CO')}`, { align: 'right' });
            doc.moveDown();

            doc.fontSize(11).text('RESUMEN DE CLIENTE', { underline: true });
            doc.fontSize(10).text(`Cliente: ${ticket.clientName}`);
            doc.text(`Equipo: ${ticket.brand} ${ticket.model || ''}`);
            doc.moveDown();

            doc.fontSize(11).text('DETALLES DE LA REPARACIÓN', { underline: true });
            doc.fontSize(10).text(ticket.repairNotes || 'Mantenimiento y reparación técnica completa.', { align: 'justify' });
            doc.moveDown();

            doc.fillColor('#10b981').fontSize(14).text(`TOTAL PAGADO: $${total.toLocaleString('es-CO')}`, { align: 'center' });
            doc.moveDown();

            doc.fontSize(12).fillColor('#059669').text('CERTIFICADOS DE GARANTÍA:', { weight: 'bold' });
            doc.moveDown(0.5);

            if (hasLabor && hasParts) {
                doc.fillColor('#059669').fontSize(10).text('GARANTÍA POR MANO DE OBRA (Servicio Técnico):', { weight: 'bold' });
                doc.fillColor('#0f172a').fontSize(9).text(`Este servicio técnico cuenta con una garantía de ${LABOR_WARRANTY_DAYS} días a partir de la fecha de entrega, cubriendo exclusivamente el trabajo de reparación realizado.`, { align: 'justify' });
                doc.moveDown(0.5);
                
                doc.fillColor('#7c3aed').fontSize(10).text('GARANTÍA POR PARTES Y ACCESORIOS:', { weight: 'bold' });
                doc.fillColor('#0f172a').fontSize(9).text(`Los repuestos y accesorios instalados cuentan con una garantía de ${PARTS_WARRANTY_DAYS} días a partir de la fecha de entrega, cubriendo exclusivamente los componentes reemplazados.`, { align: 'justify' });
            } else if (hasLabor) {
                doc.fillColor('#059669').fontSize(10).text('CERTIFICADO DE GARANTÍA - MANO DE OBRA:', { weight: 'bold' });
                doc.fillColor('#0f172a').fontSize(9).text(`Este servicio técnico cuenta con una garantía de ${LABOR_WARRANTY_DAYS} días a partir de la fecha de entrega, cubriendo exclusivamente el trabajo de reparación realizado y la mano de obra empleada.`, { align: 'justify' });
            } else if (hasParts) {
                doc.fillColor('#059669').fontSize(10).text('CERTIFICADO DE GARANTÍA - PARTES Y ACCESORIOS:', { weight: 'bold' });
                doc.fillColor('#0f172a').fontSize(9).text(`Los repuestos y accesorios instalados cuentan con una garantía de ${PARTS_WARRANTY_DAYS} días a partir de la fecha de entrega, cubriendo exclusivamente los componentes reemplazados.`, { align: 'justify' });
            }

            const sigY = 620;
            
            if (ticket.signatureDeliveryTech) {
                try {
                    doc.image(ticket.signatureDeliveryTech, 60, sigY - 45, { height: 40 });
                } catch (e) { console.error('Error drawing delivery tech signature', e); }
            }
            doc.strokeColor('#0f172a').moveTo(60, sigY).lineTo(220, sigY).stroke();
            doc.fontSize(8).text('Entregado por LBDC', 60, sigY + 5, { width: 160, align: 'center' });

            if (ticket.signatureDeliveryClient) {
                try {
                    doc.image(ticket.signatureDeliveryClient, 360, sigY - 45, { height: 40 });
                } catch (e) { console.error('Error drawing delivery client signature', e); }
            }
            doc.strokeColor('#0f172a').moveTo(360, sigY).lineTo(520, sigY).stroke();
            doc.text('Recibido por Cliente', 360, sigY + 5, { width: 160, align: 'center' });

            if (ticket.dbEvidence && ticket.dbEvidence.length > 0) {
                doc.addPage();
                doc.fillColor('#6366f1').fontSize(14).text('EVIDENCIA FOTOGRÁFICA DE INGRESO', { align: 'center', underline: true });
                doc.moveDown();
                
                let currentX = 50;
                let currentY = doc.y + 20;
                const imgWidth = 240;
                const imgHeight = 180;
                const margin = 20;

                ticket.dbEvidence.forEach((ev, index) => {
                    if (index % 2 !== 0) {
                        currentX = 50 + imgWidth + margin;
                    } else if (index > 0) {
                        currentX = 50;
                        currentY += imgHeight + margin;
                    }

                    if (currentY + imgHeight > 750) {
                        doc.addPage();
                        doc.fillColor('#6366f1').fontSize(12).text('EVIDENCIA FOTOGRÁFICA (Cont.)', { align: 'center' });
                        currentY = 100;
                        currentX = 50;
                    }

                    try {
                        doc.image(ev.photo_data, currentX, currentY, { width: imgWidth, height: imgHeight });
                        doc.rect(currentX, currentY, imgWidth, imgHeight).strokeColor('#e2e8f0').lineWidth(1).stroke();
                    } catch (e) { 
                        console.error('Error drawing PDF image in delivery', e);
                    }
                });
            }

            doc.fontSize(8).fillColor('#94a3b8').text(`${settings.businessAddress} | WhatsApp: ${settings.whatsappNumber}`, 40, 750, { align: 'center' });

            doc.end();
        });

        const pdfContent = await pdfGenerated;

        await sendEmail({
            to: targetEmail,
            subject: `¡Tu equipo está listo! - Acta de Entrega #${ticket.id}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; color: white;">
                        <h1 style="margin: 0; font-size: 24px;">¡Servicio Completado!</h1>
                        <p style="margin: 10px 0 0 0;">Tu equipo ha sido reparado y está listo para entrega</p>
                    </div>
                    <div style="padding: 30px; background: #f8fafc;">
                        <p style="color: #334155; font-size: 16px;">Hola <strong>${ticket.clientName}</strong>,</p>
                        <p style="color: #64748b;">Nos complace informarte que tu equipo ha sido reparado exitosamente.</p>
                        
                        <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
                            <h3 style="color: #1e293b; margin: 0 0 15px 0;">Detalles del Servicio</h3>
                            <p style="margin: 5px 0;"><strong>Equipo:</strong> ${ticket.brand} ${ticket.model || ''}</p>
                            <p style="margin: 5px 0;"><strong>Serial:</strong> ${ticket.serial || 'N/A'}</p>
                            <p style="margin: 5px 0;"><strong>Reparación:</strong> ${ticket.repairNotes || 'Servicio técnico completado'}</p>
                            <p style="margin: 5px 0; font-size: 18px; color: #10b981;"><strong>Total: $${total.toLocaleString('es-CO')}</strong></p>
                        </div>
                        
                        <div style="background: #fffbeb; border: 2px solid #fbbf24; padding: 15px; border-radius: 10px; margin: 20px 0;">
                            <h4 style="color: #92400e; margin: 0 0 10px 0;">Garantías Incluidas</h4>
                            ${hasLabor ? `<p style="margin: 5px 0; color: #059669;"><strong>✓</strong> Mano de Obra: 30 días</p>` : ''}
                            ${hasParts ? `<p style="margin: 5px 0; color: #7c3aed;"><strong>✓</strong> Partes y Accesorios: 90 días</p>` : ''}
                        </div>
                        
                        <p style="color: #64748b; font-size: 14px;">Adjunto encontrarás el acta de entrega completa con los términos de garantía.</p>
                    </div>
                    <div style="background: #1e293b; padding: 20px; text-align: center;">
                        <p style="color: #94a3b8; margin: 0; font-size: 12px;">La Bodega del Computador | Soporte Técnico</p>
                    </div>
                </div>
            `,
            attachments: [{ filename: `Acta_Entrega_${ticket.id}.pdf`, content: pdfContent }],
            type: 'soporte'
        });

        res.json({ success: true, message: `Enviado a ${targetEmail}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
