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

// ── SHARED PDF BUILDER ─────────────────────────────────────────────────────
// Draws the premium Comprobante de Ingreso into an existing PDFDocument.
// Does NOT call doc.end() — the caller is responsible for that.
const buildIntakePDF = (doc, ticket, settings) => {
    const W   = 595;          // A4 width in points
    const M   = 40;           // left/right margin
    const CW  = W - 2 * M;   // usable content width = 515

    // ── HEADER BAND ────────────────────────────────────────────────────────
    doc.rect(0, 0, W, 68).fill('#1e293b');
    doc.rect(0, 68, W, 5).fill('#2563eb');

    // Left: business name
    doc.fillColor('white').font('Helvetica-Bold').fontSize(15)
       .text(settings.businessName || 'La Bodega del Computador', M, 16, { width: 310 });
    doc.fillColor('#93c5fd').font('Helvetica').fontSize(8)
       .text('Laboratorio de Servicio Técnico Especializado', M, 36);

    // Right: document type + order number + date
    doc.fillColor('#93c5fd').font('Helvetica').fontSize(7)
       .text('COMPROBANTE DE INGRESO', W - M - 160, 14, { width: 160, align: 'right' });
    doc.fillColor('#60a5fa').font('Helvetica-Bold').fontSize(11)
       .text(`Orden No. #${ticket.id}`, W - M - 160, 27, { width: 160, align: 'right' });
    const dateStr = new Date(ticket.createdAt).toLocaleDateString('es-CO', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
    doc.fillColor('#94a3b8').font('Helvetica').fontSize(7)
       .text(dateStr, W - M - 160, 42, { width: 160, align: 'right' });

    let y = 85;

    // ── CLIENT + DEVICE INFO CARDS ─────────────────────────────────────────
    const cardH = 82;
    const colW  = Math.floor(CW / 2) - 8;
    const col1X = M;
    const col2X = M + colW + 16;

    // Card 1 – Client
    doc.roundedRect(col1X, y, colW, cardH, 5).fill('#f8fafc').stroke('#e2e8f0');
    doc.rect(col1X, y + 5, 3, cardH - 10).fill('#2563eb');
    doc.fillColor('#2563eb').font('Helvetica-Bold').fontSize(7)
       .text('INFORMACIÓN DEL CLIENTE', col1X + 10, y + 8);
    doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(10)
       .text(ticket.clientName || '', col1X + 10, y + 21, { width: colW - 18 });
    doc.fillColor('#64748b').font('Helvetica').fontSize(8)
       .text(`Tel: ${ticket.clientPhone || ''}`, col1X + 10, y + 35, { width: colW - 18 });
    if (ticket.clientEmail) {
        doc.text(`Email: ${ticket.clientEmail}`, col1X + 10, y + 47, { width: colW - 18 });
    }

    // Card 2 – Device
    doc.roundedRect(col2X, y, colW, cardH, 5).fill('#f8fafc').stroke('#e2e8f0');
    doc.rect(col2X, y + 5, 3, cardH - 10).fill('#2563eb');
    doc.fillColor('#2563eb').font('Helvetica-Bold').fontSize(7)
       .text('DETALLES DEL EQUIPO', col2X + 10, y + 8);
    doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(10)
       .text(`${ticket.brand || ''} ${ticket.model || ''}`.trim(), col2X + 10, y + 21, { width: colW - 18 });
    doc.fillColor('#64748b').font('Helvetica').fontSize(8)
       .text(`Tipo: ${ticket.deviceType || ''}`, col2X + 10, y + 35, { width: colW - 18 });
    doc.text(`Serial: ${ticket.serial || 'S/N'}`, col2X + 10, y + 47, { width: colW - 18 });
    if (ticket.technicianName) {
        doc.text(`Técnico: ${ticket.technicianName}`, col2X + 10, y + 59, { width: colW - 18 });
    }

    y += cardH + 16;

    // ── SECTION BLOCK HELPER ───────────────────────────────────────────────
    // Draws a labelled content card with a coloured left accent stripe.
    const drawBlock = (label, text, accentColor, bgColor) => {
        if (!text) return;
        doc.fillColor(accentColor).font('Helvetica-Bold').fontSize(7).text(label, M, y);
        y += 11;
        const textH = doc.font('Helvetica').fontSize(9).heightOfString(text, { width: CW - 18 });
        const boxH  = Math.max(32, textH + 16);
        if (y + boxH > 778) { doc.addPage(); y = 50; }
        doc.roundedRect(M, y, CW, boxH, 5).fill(bgColor).stroke('#e2e8f0');
        doc.rect(M, y + 4, 3, boxH - 8).fill(accentColor);
        doc.fillColor('#334155').font('Helvetica').fontSize(9)
           .text(text, M + 10, y + 8, { width: CW - 18, align: 'justify' });
        y += boxH + 12;
    };

    // ── ISSUE DESCRIPTION ──────────────────────────────────────────────────
    drawBlock('PROBLEMA REPORTADO', ticket.issueDescription || '', '#2563eb', '#f8fafc');

    // ── DIAGNOSIS (if exists) ──────────────────────────────────────────────
    if (ticket.diagnosis) {
        drawBlock('DIAGNÓSTICO TÉCNICO', ticket.diagnosis, '#059669', '#f0fdf4');
    }

    // ── REPAIR NOTES + LABOR ITEMS ─────────────────────────────────────────
    const laborItems = safeParse(ticket.laborItems) || [];
    if (ticket.repairNotes || laborItems.length > 0) {
        doc.fillColor('#7c3aed').font('Helvetica-Bold').fontSize(7).text('TRABAJOS REALIZADOS', M, y);
        y += 11;

        const repairH = ticket.repairNotes
            ? doc.font('Helvetica').fontSize(9).heightOfString(ticket.repairNotes, { width: CW - 18 })
            : 0;
        const laborH = laborItems.length > 0 ? 14 + laborItems.length * 13 : 0;
        const boxH   = Math.max(32, repairH + laborH + 16);

        if (y + boxH > 778) { doc.addPage(); y = 50; }

        doc.roundedRect(M, y, CW, boxH, 5).fill('#faf5ff').stroke('#e2e8f0');
        doc.rect(M, y + 4, 3, boxH - 8).fill('#7c3aed');

        let ty = y + 8;
        if (ticket.repairNotes) {
            doc.fillColor('#334155').font('Helvetica').fontSize(9)
               .text(ticket.repairNotes, M + 10, ty, { width: CW - 18, align: 'justify' });
            ty += repairH + 6;
        }
        if (laborItems.length > 0) {
            doc.fillColor('#6d28d9').font('Helvetica-Bold').fontSize(7)
               .text('ACTIVIDADES:', M + 10, ty);
            ty += 12;
            laborItems.forEach(item => {
                doc.fillColor('#4c1d95').font('Helvetica').fontSize(9)
                   .text(`• ${item.description || 'Mano de Obra'}`, M + 16, ty, { width: CW - 26 });
                ty += 13;
            });
        }
        y += boxH + 12;
    }

    // ── BUDGET TABLE ───────────────────────────────────────────────────────
    const quoteItems    = safeParse(ticket.quoteItems) || [];
    const totalLaborCost = laborItems.reduce((s, i) => s + (i.price || 0), 0);
    const totalQuoteCost = quoteItems.reduce((s, i) => s + (i.price * i.quantity), 0);
    const totalCost     = totalLaborCost + totalQuoteCost;

    if (quoteItems.length > 0 || laborItems.length > 0) {
        doc.fillColor('#059669').font('Helvetica-Bold').fontSize(7).text('PRESUPUESTO DEL SERVICIO', M, y);
        y += 11;

        const rowH     = 18;
        const headerH  = 22;
        const totalRowH = 26;
        const tableH   = headerH + (quoteItems.length + laborItems.length) * rowH + totalRowH;

        if (y + tableH > 778) { doc.addPage(); y = 50; }

        // Table header row
        doc.rect(M, y, CW, headerH).fill('#1e293b');
        doc.fillColor('white').font('Helvetica-Bold').fontSize(8)
           .text('ÍTEM / DESCRIPCIÓN', M + 8, y + 7, { width: CW - 120 });
        doc.text('CANT', M + CW - 108, y + 7, { width: 40, align: 'center' });
        doc.text('PRECIO', M + CW - 62, y + 7, { width: 57, align: 'right' });
        y += headerH;

        // Parts / quote rows
        quoteItems.forEach((item, i) => {
            doc.rect(M, y, CW, rowH).fill(i % 2 === 0 ? 'white' : '#f8fafc').stroke('#e2e8f0');
            doc.fillColor('#334155').font('Helvetica').fontSize(8)
               .text(item.name || item.description || 'Repuesto', M + 8, y + 5, { width: CW - 120 });
            doc.text(String(item.quantity), M + CW - 108, y + 5, { width: 40, align: 'center' });
            doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(8)
               .text(`$${(item.price * item.quantity).toLocaleString('es-CO')}`, M + CW - 62, y + 5, { width: 57, align: 'right' });
            y += rowH;
        });

        // Labor rows
        laborItems.forEach((item, i) => {
            const idx = i + quoteItems.length;
            doc.rect(M, y, CW, rowH).fill(idx % 2 === 0 ? 'white' : '#f8fafc').stroke('#e2e8f0');
            doc.fillColor('#b45309').font('Helvetica-Bold').fontSize(8)
               .text(`${item.description || 'Mano de Obra'} (M.O.)`, M + 8, y + 5, { width: CW - 120 });
            doc.text('1', M + CW - 108, y + 5, { width: 40, align: 'center' });
            doc.text(`$${(item.price || 0).toLocaleString('es-CO')}`, M + CW - 62, y + 5, { width: 57, align: 'right' });
            y += rowH;
        });

        // Total row
        doc.rect(M, y, CW, totalRowH).fill('#0f172a');
        doc.fillColor('white').font('Helvetica-Bold').fontSize(10).text('VALOR TOTAL', M + 8, y + 8);
        doc.fillColor('#10b981').font('Helvetica-Bold').fontSize(13)
           .text(`$${totalCost.toLocaleString('es-CO')}`, M, y + 7, { width: CW - 8, align: 'right' });
        y += totalRowH + 18;
    }

    // ── SIGNATURE BLOCKS ───────────────────────────────────────────────────
    if (y + 85 > 778) { doc.addPage(); y = 50; }

    const sigLineW = 155;
    const sig1X    = 60;
    const sig2X    = W - 60 - sigLineW;
    const sigTop   = y + 10;

    if (ticket.signatureIntakeTech) {
        try { doc.image(ticket.signatureIntakeTech, sig1X, sigTop, { height: 38 }); }
        catch(e) { /* ignore bad data-uri */ }
    }
    doc.strokeColor('#334155').lineWidth(0.5)
       .moveTo(sig1X, sigTop + 42).lineTo(sig1X + sigLineW, sigTop + 42).stroke();
    doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(8)
       .text('Recibido por LBDC', sig1X, sigTop + 46, { width: sigLineW, align: 'center' });
    doc.fillColor('#64748b').font('Helvetica').fontSize(7)
       .text('Técnico Responsable', sig1X, sigTop + 57, { width: sigLineW, align: 'center' });

    if (ticket.signatureIntakeClient) {
        try { doc.image(ticket.signatureIntakeClient, sig2X, sigTop, { height: 38 }); }
        catch(e) { /* ignore bad data-uri */ }
    }
    doc.strokeColor('#334155').lineWidth(0.5)
       .moveTo(sig2X, sigTop + 42).lineTo(sig2X + sigLineW, sigTop + 42).stroke();
    doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(8)
       .text('Acepto Condiciones', sig2X, sigTop + 46, { width: sigLineW, align: 'center' });
    doc.fillColor('#64748b').font('Helvetica').fontSize(7)
       .text('Firma del Cliente', sig2X, sigTop + 57, { width: sigLineW, align: 'center' });

    // ── FOOTER ────────────────────────────────────────────────────────────
    doc.rect(0, 815, W, 27).fill('#f1f5f9');
    doc.rect(0, 815, W, 3).fill('#2563eb');
    doc.fillColor('#64748b').font('Helvetica').fontSize(7)
       .text(
           `${settings.businessAddress || ''} | WhatsApp: ${settings.whatsappNumber || ''}`,
           M, 822, { width: CW, align: 'center' }
       );

    // ── PHOTO PAGES HELPER ─────────────────────────────────────────────────
    const drawPhotoPage = (photos, title, accentColor) => {
        if (!photos || photos.length === 0) return;
        doc.addPage();

        // Page header strip
        doc.rect(0, 0, W, 40).fill('#1e293b');
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
                doc.rect(0, 0, W, 40).fill('#1e293b');
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

    const laborItems = safeParse(ticket.laborItems) || [];
    const damagePhotos = safeParse(ticket.damagePhotos) || [];
    const deliveryPhotos = safeParse(ticket.photosDelivery) || [];
    const quoteItems = safeParse(ticket.quoteItems) || [];
    const totalLaborCost = laborItems.reduce((sum, item) => sum + (item.price || 0), 0);
    const totalQuoteCost = quoteItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalCost = totalLaborCost + totalQuoteCost;

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
            ${ticket.diagnosis ? `
            <div class="section-header" style="margin-top: 15px; color: #059669;">Diagnóstico Técnico</div>
            <div class="description-box" style="border-left-color: #10b981; background: #f0fdf4;">${ticket.diagnosis}</div>
            ` : ''}

            ${(ticket.repairNotes || laborItems.length > 0) ? `
            <div class="section-header" style="margin-top: 15px; color: #7c3aed;">Trabajos Realizados</div>
            <div class="description-box" style="border-left-color: #8b5cf6; background: #faf5ff;">
                ${ticket.repairNotes ? `<p style="margin-bottom: 5px;">${ticket.repairNotes}</p>` : ''}
                ${laborItems.length > 0 ? `
                <div style="margin-top: 8px; border-top: 1px dashed #e2e8f0; padding-top: 8px;">
                    <strong style="font-size: 8px; color: #6d28d9; text-transform: uppercase;">Actividades:</strong>
                    <ul style="margin: 5px 0 0 0; padding-left: 15px; font-size: 11px; color: #4c1d95;">
                        ${laborItems.map(item => `<li>${item.description || 'Mano de Obra'}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
            </div>
            ` : ''}

            ${(quoteItems.length > 0 || laborItems.length > 0) ? `
            <div class="section-header" style="margin-top: 15px; color: #059669;">Presupuesto de Intervención</div>
            <div style="border: 1px solid var(--border); border-radius: 8px; overflow: hidden; margin-bottom: 20px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                    <thead>
                        <tr style="background: #f8fafc; border-bottom: 1px solid var(--border);">
                            <th style="text-align: left; padding: 8px; font-weight: 800; color: var(--text-light); text-transform: uppercase;">Ítem / Descripción</th>
                            <th style="text-align: center; padding: 8px; font-weight: 800; color: var(--text-light); text-transform: uppercase; width: 60px;">Cant</th>
                            <th style="text-align: right; padding: 8px; font-weight: 800; color: var(--text-light); text-transform: uppercase; width: 100px;">Precio</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${quoteItems.map(item => `
                        <tr style="border-bottom: 1px solid var(--border);">
                            <td style="padding: 8px; font-weight: 600;">${item.name || item.description || 'Repuesto'}</td>
                            <td style="text-align: center; padding: 8px;">${item.quantity}</td>
                            <td style="text-align: right; padding: 8px; font-weight: 700;">$${(item.price * item.quantity).toLocaleString('es-CO')}</td>
                        </tr>
                        `).join('')}
                        ${laborItems.map(item => `
                        <tr style="border-bottom: 1px solid var(--border); background-color: #fffdf5;">
                            <td style="padding: 8px; font-weight: 700; color: #b45309;">${item.description || 'Mano de Obra'} (Mano de Obra)</td>
                            <td style="text-align: center; padding: 8px;">1</td>
                            <td style="text-align: right; padding: 8px; font-weight: 700; color: #b45309;">$${(item.price || 0).toLocaleString('es-CO')}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
                <div style="background: var(--text-dark); color: white; padding: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 13px; font-weight: 800;">
                    <span>VALOR TOTAL</span>
                    <span style="color: #10b981; font-size: 16px;">$${totalCost.toLocaleString('es-CO')}</span>
                </div>
            </div>
            ` : ''}

            ${photos.length > 0 ? `
            <div class="section-header" style="margin-top: 20px;">Evidencia Fotográfica de Ingreso</div>
            <div class="photo-grid">${photos.map(p => `<div class="photo-card"><img src="${getAbsoluteUrl(p, baseUrl)}"></div>`).join('')}</div>
            ` : ''}

            ${damagePhotos.length > 0 ? `
            <div class="section-header" style="margin-top: 20px; color: #dc2626;">Evidencia de Diagnóstico (Fallas)</div>
            <div class="photo-grid">
                ${damagePhotos.map(p => `<div class="photo-card" style="border-color: #fca5a5;"><img src="${getAbsoluteUrl(p, baseUrl)}"></div>`).join('')}
            </div>
            ` : ''}

            ${deliveryPhotos.length > 0 ? `
            <div class="section-header" style="margin-top: 20px; color: #10b981;">Evidencia de Entrega (Equipo Reparado)</div>
            <div class="photo-grid">
                ${deliveryPhotos.map(p => `<div class="photo-card" style="border-color: #a7f3d0;"><img src="${getAbsoluteUrl(p, baseUrl)}"></div>`).join('')}
            </div>
            ` : ''}
            
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

        // ── Build PDF with premium layout ──────────────────────────────────
        const doc = new PDFDocument({ size: 'A4', margin: 0 });
        let chunks = [];
        doc.on('data', c => chunks.push(c));
        const pdfGenerated = new Promise(resolve => {
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            buildIntakePDF(doc, ticket, settings);
            doc.end();
        });
        const pdfContent = await pdfGenerated;
        // ───────────────────────────────────────────────────────────────────

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

        // ── Build PDF with premium layout ──────────────────────────────────
        const doc = new PDFDocument({ size: 'A4', margin: 0 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=Comprobante_Ingreso_${ticket.id}.pdf`);
        doc.pipe(res);
        buildIntakePDF(doc, ticket, settings);
        doc.end();
        // ───────────────────────────────────────────────────────────────────
    });
};
