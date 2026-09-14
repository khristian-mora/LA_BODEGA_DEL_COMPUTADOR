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

// ── SHARED PDF BUILDER ─────────────────────────────────────────────────────
// Draws the premium Acta de Entrega y Garantía into an existing PDFDocument.
// Does NOT call doc.end() — the caller is responsible for that.
const buildDeliveryPDF = (doc, ticket, settings) => {
    const W  = 595;
    const M  = 40;
    const CW = W - 2 * M;

    const quoteItems = safeParse(ticket.quoteItems) || [];
    const laborItems = safeParse(ticket.laborItems) || [];
    const total      = quoteItems.reduce((s, i) => s + (i.price * i.quantity), 0) +
                       laborItems.reduce((s, i) => s + (i.price || 0), 0);
    const hasLabor   = laborItems.length > 0;
    const hasParts   = quoteItems.length > 0;
    const dateStr    = new Date().toLocaleDateString('es-CO', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    // ── HEADER BAND ────────────────────────────────────────────────────────
    doc.rect(0, 0, W, 68).fill('#0f172a');
    doc.rect(0, 68, W, 5).fill('#10b981');

    // Left: business name
    doc.fillColor('white').font('Helvetica-Bold').fontSize(15)
       .text(settings.businessName || 'La Bodega del Computador', M, 16, { width: 310 });
    doc.fillColor('#6ee7b7').font('Helvetica').fontSize(8)
       .text('Laboratorio de Servicio Técnico Especializado', M, 36);

    // Right: document type + order + date
    doc.fillColor('#6ee7b7').font('Helvetica').fontSize(7)
       .text('ACTA DE ENTREGA Y GARANTÍA', W - M - 160, 14, { width: 160, align: 'right' });
    doc.fillColor('#34d399').font('Helvetica-Bold').fontSize(11)
       .text(`Orden No. #${ticket.id}`, W - M - 160, 27, { width: 160, align: 'right' });
    doc.fillColor('#94a3b8').font('Helvetica').fontSize(7)
       .text(dateStr, W - M - 160, 42, { width: 160, align: 'right' });

    let y = 85;

    // ── CLIENT + DEVICE CARDS ──────────────────────────────────────────────
    const cardH = 82;
    const colW  = Math.floor(CW / 2) - 8;
    const col1X = M;
    const col2X = M + colW + 16;

    // Card 1 – Client
    doc.roundedRect(col1X, y, colW, cardH, 5).fill('#f8fafc').stroke('#e2e8f0');
    doc.rect(col1X, y + 5, 3, cardH - 10).fill('#10b981');
    doc.fillColor('#059669').font('Helvetica-Bold').fontSize(7).text('CLIENTE', col1X + 10, y + 8);
    doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(10)
       .text(ticket.clientName || '', col1X + 10, y + 21, { width: colW - 18 });
    doc.fillColor('#64748b').font('Helvetica').fontSize(8)
       .text(`Tel: ${ticket.clientPhone || ''}`, col1X + 10, y + 35, { width: colW - 18 });
    if (ticket.clientEmail) {
        doc.text(`Email: ${ticket.clientEmail}`, col1X + 10, y + 47, { width: colW - 18 });
    }

    // Card 2 – Device
    doc.roundedRect(col2X, y, colW, cardH, 5).fill('#f8fafc').stroke('#e2e8f0');
    doc.rect(col2X, y + 5, 3, cardH - 10).fill('#10b981');
    doc.fillColor('#059669').font('Helvetica-Bold').fontSize(7).text('EQUIPO', col2X + 10, y + 8);
    doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(10)
       .text(`${ticket.brand || ''} ${ticket.model || ''}`.trim(), col2X + 10, y + 21, { width: colW - 18 });
    doc.fillColor('#64748b').font('Helvetica').fontSize(8)
       .text(`Serial: ${ticket.serial || 'S/N'}`, col2X + 10, y + 35, { width: colW - 18 });

    y += cardH + 16;

    // ── DIAGNOSIS (if exists) ──────────────────────────────────────────────
    if (ticket.diagnosis) {
        doc.fillColor('#059669').font('Helvetica-Bold').fontSize(7).text('DIAGNÓSTICO TÉCNICO', M, y);
        y += 11;
        const textH = doc.font('Helvetica').fontSize(9).heightOfString(ticket.diagnosis, { width: CW - 18 });
        const boxH  = Math.max(32, textH + 16);
        if (y + boxH > 778) { doc.addPage(); y = 50; }
        doc.roundedRect(M, y, CW, boxH, 5).fill('#f0fdf4').stroke('#e2e8f0');
        doc.rect(M, y + 4, 3, boxH - 8).fill('#10b981');
        doc.fillColor('#334155').font('Helvetica').fontSize(9)
           .text(ticket.diagnosis, M + 10, y + 8, { width: CW - 18, align: 'justify' });
        y += boxH + 12;
    }

    // ── REPAIR NOTES + LABOR ITEMS ─────────────────────────────────────────
    {
        const repairContent = ticket.repairNotes || 'Reparación técnica realizada.';
        doc.fillColor('#7c3aed').font('Helvetica-Bold').fontSize(7).text('TRABAJOS REALIZADOS', M, y);
        y += 11;

        const repairH = doc.font('Helvetica').fontSize(9)
            .heightOfString(repairContent, { width: CW - 18 });
        const laborH  = laborItems.length > 0 ? 14 + laborItems.length * 13 : 0;
        const boxH    = Math.max(32, repairH + laborH + 16);

        if (y + boxH > 778) { doc.addPage(); y = 50; }

        doc.roundedRect(M, y, CW, boxH, 5).fill('#faf5ff').stroke('#e2e8f0');
        doc.rect(M, y + 4, 3, boxH - 8).fill('#7c3aed');

        let ty = y + 8;
        doc.fillColor('#334155').font('Helvetica').fontSize(9)
           .text(repairContent, M + 10, ty, { width: CW - 18, align: 'justify' });
        ty += repairH + 6;

        if (laborItems.length > 0) {
            doc.fillColor('#6d28d9').font('Helvetica-Bold').fontSize(7)
               .text('ACTIVIDADES DE MANO DE OBRA:', M + 10, ty);
            ty += 12;
            laborItems.forEach(item => {
                doc.fillColor('#4c1d95').font('Helvetica').fontSize(9)
                   .text(`• ${item.description || 'Mano de Obra'}`, M + 16, ty, { width: CW - 26 });
                ty += 13;
            });
        }
        y += boxH + 12;
    }

    // ── TOTAL PAID BOX ─────────────────────────────────────────────────────
    if (y + 34 > 778) { doc.addPage(); y = 50; }
    doc.roundedRect(M, y, CW, 30, 5).fill('#0f172a');
    doc.fillColor('white').font('Helvetica-Bold').fontSize(11).text('TOTAL PAGADO', M + 8, y + 9);
    doc.fillColor('#10b981').font('Helvetica-Bold').fontSize(14)
       .text(`$${total.toLocaleString('es-CO')}`, M, y + 7, { width: CW - 8, align: 'right' });
    y += 44;

    // ── WARRANTY CERTIFICATES ──────────────────────────────────────────────
    doc.fillColor('#059669').font('Helvetica-Bold').fontSize(7).text('CERTIFICADOS DE GARANTÍA', M, y);
    y += 11;

    const warrantyItems = [];
    if (hasLabor && hasParts) {
        warrantyItems.push({
            title: 'GARANTÍA POR MANO DE OBRA (Servicio Técnico)',
            text: `Este servicio técnico cuenta con una garantía de ${LABOR_WARRANTY_DAYS} días a partir de la fecha de entrega (${dateStr}), cubriendo exclusivamente el trabajo de reparación realizado.`,
            titleColor: '#059669',
            bgColor: '#f0fdf4',
            accentColor: '#10b981'
        });
        warrantyItems.push({
            title: 'GARANTÍA POR PARTES Y ACCESORIOS',
            text: `Los repuestos y accesorios instalados cuentan con una garantía de ${PARTS_WARRANTY_DAYS} días a partir de la fecha de entrega (${dateStr}), cubriendo exclusivamente los componentes reemplazados.`,
            titleColor: '#7c3aed',
            bgColor: '#faf5ff',
            accentColor: '#7c3aed'
        });
    } else if (hasLabor) {
        warrantyItems.push({
            title: 'CERTIFICADO DE GARANTÍA - MANO DE OBRA',
            text: `Este servicio técnico cuenta con una garantía de ${LABOR_WARRANTY_DAYS} días a partir de la fecha de entrega (${dateStr}), cubriendo exclusivamente el trabajo de reparación realizado y la mano de obra empleada.`,
            titleColor: '#059669',
            bgColor: '#f0fdf4',
            accentColor: '#10b981'
        });
    } else if (hasParts) {
        warrantyItems.push({
            title: 'CERTIFICADO DE GARANTÍA - PARTES Y ACCESORIOS',
            text: `Los repuestos y accesorios instalados cuentan con una garantía de ${PARTS_WARRANTY_DAYS} días a partir de la fecha de entrega (${dateStr}), cubriendo exclusivamente los componentes reemplazados.`,
            titleColor: '#7c3aed',
            bgColor: '#faf5ff',
            accentColor: '#7c3aed'
        });
    }

    warrantyItems.forEach(w => {
        const textH = doc.font('Helvetica').fontSize(9)
            .heightOfString(w.text, { width: CW - 18 });
        const boxH  = Math.max(42, textH + 28);
        if (y + boxH > 778) { doc.addPage(); y = 50; }
        doc.roundedRect(M, y, CW, boxH, 5).fill(w.bgColor).stroke('#e2e8f0');
        doc.rect(M, y + 4, 3, boxH - 8).fill(w.accentColor);
        doc.fillColor(w.titleColor).font('Helvetica-Bold').fontSize(8)
           .text(w.title, M + 10, y + 8, { width: CW - 18 });
        doc.fillColor('#334155').font('Helvetica').fontSize(9)
           .text(w.text, M + 10, y + 20, { width: CW - 18, align: 'justify' });
        y += boxH + 10;
    });

    y += 8;

    // ── SIGNATURE BLOCKS ───────────────────────────────────────────────────
    if (y + 85 > 778) { doc.addPage(); y = 50; }

    const sigLineW = 155;
    const sig1X    = 60;
    const sig2X    = W - 60 - sigLineW;
    const sigTop   = y + 10;

    if (ticket.signatureDeliveryTech) {
        try { doc.image(ticket.signatureDeliveryTech, sig1X, sigTop, { height: 38 }); }
        catch(e) { /* ignore bad data-uri */ }
    }
    doc.strokeColor('#334155').lineWidth(0.5)
       .moveTo(sig1X, sigTop + 42).lineTo(sig1X + sigLineW, sigTop + 42).stroke();
    doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(8)
       .text('Entregado por LBDC', sig1X, sigTop + 46, { width: sigLineW, align: 'center' });
    doc.fillColor('#64748b').font('Helvetica').fontSize(7)
       .text('Técnico Responsable', sig1X, sigTop + 57, { width: sigLineW, align: 'center' });

    if (ticket.signatureDeliveryClient) {
        try { doc.image(ticket.signatureDeliveryClient, sig2X, sigTop, { height: 38 }); }
        catch(e) { /* ignore bad data-uri */ }
    }
    doc.strokeColor('#334155').lineWidth(0.5)
       .moveTo(sig2X, sigTop + 42).lineTo(sig2X + sigLineW, sigTop + 42).stroke();
    doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(8)
       .text('Recibido a Satisfacción', sig2X, sigTop + 46, { width: sigLineW, align: 'center' });
    doc.fillColor('#64748b').font('Helvetica').fontSize(7)
       .text('Firma del Cliente', sig2X, sigTop + 57, { width: sigLineW, align: 'center' });

    // ── FOOTER ────────────────────────────────────────────────────────────
    doc.rect(0, 815, W, 27).fill('#f1f5f9');
    doc.rect(0, 815, W, 3).fill('#10b981');
    doc.fillColor('#64748b').font('Helvetica').fontSize(7)
       .text(
           `${settings.businessAddress || ''} | WhatsApp: ${settings.whatsappNumber || ''}`,
           M, 822, { width: CW, align: 'center' }
       );

    // ── PHOTO PAGES HELPER ─────────────────────────────────────────────────
    const drawPhotoPage = (photos, title, accentColor) => {
        if (!photos || photos.length === 0) return;
        doc.addPage();

        doc.rect(0, 0, W, 40).fill('#0f172a');
        doc.rect(0, 40, W, 4).fill(accentColor);
        doc.fillColor('white').font('Helvetica-Bold').fontSize(13)
           .text(title, M, 12, { width: CW, align: 'center' });

        let px = M;
        let py = 56;
        const imgW = 240;
        const imgH = 172;
        const gap  = 15;

        photos.forEach((photo, index) => {
            if (index % 2 !== 0) {
                px = M + imgW + gap;
            } else if (index > 0) {
                px = M;
                py += imgH + gap;
            }

            if (py + imgH > 780) {
                doc.addPage();
                doc.rect(0, 0, W, 40).fill('#0f172a');
                doc.rect(0, 40, W, 4).fill(accentColor);
                doc.fillColor('white').font('Helvetica-Bold').fontSize(12)
                   .text(`${title} (cont.)`, M, 12, { width: CW, align: 'center' });
                py = 56;
                px = M;
            }

            try {
                doc.roundedRect(px, py, imgW, imgH, 4).fill('#f1f5f9').stroke('#e2e8f0');
                doc.image(photo, px + 2, py + 2, { width: imgW - 4, height: imgH - 4 });
            } catch(e) {
                doc.roundedRect(px, py, imgW, imgH, 4).fill('#f1f5f9').stroke('#e2e8f0');
                doc.fillColor('#94a3b8').font('Helvetica').fontSize(8)
                   .text('Imagen no disponible', px, py + imgH / 2 - 4, { width: imgW, align: 'center' });
            }
        });
    };

    // Intake evidence photos
    const legacyPhotos     = safeParse(ticket.photosIntake) || [];
    const validLegacy      = legacyPhotos.filter(p => p && !p.startsWith('blob:'));
    const dbEvidencePhotos = (ticket.dbEvidence || []).map(ev => ev.photo_data);
    const intakePhotos     = [...validLegacy, ...dbEvidencePhotos];
    drawPhotoPage(intakePhotos, 'EVIDENCIA FOTOGRÁFICA DE INGRESO', '#2563eb');

    // Diagnostic / damage photos
    const damagePhotos = safeParse(ticket.damagePhotos) || [];
    drawPhotoPage(damagePhotos, 'EVIDENCIA FOTOGRÁFICA DE DIAGNÓSTICO', '#dc2626');

    // Delivery / repaired device photos
    const deliveryPhotos = safeParse(ticket.photosDelivery) || [];
    drawPhotoPage(deliveryPhotos, 'EVIDENCIA FOTOGRÁFICA DE ENTREGA', '#10b981');
};
// ──────────────────────────────────────────────────────────────────────────

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
        const legacyPhotos = safeParse(ticket.photosIntake) || [];
        const validLegacy = legacyPhotos.filter(p => p && !p.startsWith('blob:'));
        const dbEvidence = ticket.dbEvidence || [];
        const evidenceData = dbEvidence.map(ev => ev.photo_data);
        photos = [...validLegacy, ...evidenceData];
    } catch { photos = []; }

    const damagePhotos = safeParse(ticket.damagePhotos) || [];
    const deliveryPhotos = safeParse(ticket.photosDelivery) || [];

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

        ${ticket.diagnosis ? `
        <div class="section-title">Diagnóstico Técnico</div>
        <div style="background: #fff; border: 1px solid #e2e8f0; padding: 15px; border-radius: 10px; margin-bottom: 20px; font-size: 14px;">
            ${ticket.diagnosis}
        </div>
        ` : ''}

        <div class="section-title">Trabajos Realizados</div>
        <div style="background: #fff; border: 1px solid #e2e8f0; padding: 15px; border-radius: 10px; margin-bottom: 20px; font-size: 14px;">
            <p style="margin: 0; font-weight: bold;">Descripción:</p>
            <p style="margin: 5px 0 0 0;">${ticket.repairNotes || 'Reparación técnica general y mantenimiento preventivo.'}</p>
            ${laborItems.length > 0 ? `
            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px dashed #cbd5e1;">
                <div style="font-weight: 700; font-size: 12px; color: #475569; text-transform: uppercase; margin-bottom: 5px;">Actividades y Mano de Obra Realizada:</div>
                <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #334155;">
                    ${laborItems.map(item => `<li>${item.description || 'Mano de Obra'}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
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

        ${damagePhotos.length > 0 ? `
        <div class="section-title" style="margin-top: 30px;">Evidencia Fotográfica de Diagnóstico (Fallas Detectadas)</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
            ${damagePhotos.map(p => `<img src="${p}" style="width: 100%; border-radius: 8px; border: 1px solid #e2e8f0; aspect-ratio: 4/3; object-fit: cover;">`).join('')}
        </div>
        ` : ''}

        ${deliveryPhotos.length > 0 ? `
        <div class="section-title" style="margin-top: 30px;">Evidencia Fotográfica de Entrega (Equipo Reparado)</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
            ${deliveryPhotos.map(p => `<img src="${p}" style="width: 100%; border-radius: 8px; border: 1px solid #e2e8f0; aspect-ratio: 4/3; object-fit: cover;">`).join('')}
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
        const total      = quoteItems.reduce((s, i) => s + (i.price * i.quantity), 0) +
                           laborItems.reduce((s, i) => s + (i.price || 0), 0);
        const hasLabor   = laborItems.length > 0;
        const hasParts   = quoteItems.length > 0;

        // ── Build PDF with premium layout ──────────────────────────────────
        const doc = new PDFDocument({ size: 'A4', margin: 0 });
        let chunks = [];
        doc.on('data', c => chunks.push(c));
        const pdfGenerated = new Promise(resolve => {
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            buildDeliveryPDF(doc, ticket, settings);
            doc.end();
        });
        const pdfContent = await pdfGenerated;
        // ───────────────────────────────────────────────────────────────────

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
