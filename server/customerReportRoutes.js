// Customer Report Generation
import { db } from './db.js';
import nodemailer from 'nodemailer';

// Helper to fetch settings from DB
const getSetting = (key, defaultValue = '') => {
    return new Promise((resolve) => {
        db.get('SELECT value FROM settings WHERE key = ?', [key], (err, row) => {
            if (err || !row) resolve(defaultValue);
            else resolve(row.value);
        });
    });
};

// Email transporter configuration
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Helper to ensure absolute URLs for images
const getAbsoluteUrl = (path, baseUrl) => {
    if (!path) return '';
    // If it's already a full URL or Base64 data, return as-is
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanPath = path.startsWith('/') ? path : '/' + path;
    return `${cleanBase}${cleanPath}`;
};

// Generate HTML report for customer
const generateCustomerReport = (ticket, baseUrl = '', settings = {}) => {
    const quoteItems = ticket.quoteItems ? (typeof ticket.quoteItems === 'string' ? JSON.parse(ticket.quoteItems) : ticket.quoteItems) : [];
    const businessName = settings.businessName || 'LA BODEGA DEL COMPUTADOR';
    const businessAddress = settings.businessAddress || 'Cl. 49 #13-13, Barrancabermeja';
    const businessPhone = settings.whatsappNumber || '+57 317 653 2488';
    const businessEmail = settings.businessEmail || 'ventas@labodegadelcomputador.com';
    const businessDomain = settings.businessDomain || 'www.labodegadelcomputador.com';

    // Parse findings and recommendations
    let findings = [];
    let recommendations = [];
    try {
        findings = typeof ticket.findings === 'string' ? JSON.parse(ticket.findings) : (ticket.findings || []);
        recommendations = typeof ticket.recommendations === 'string' ? JSON.parse(ticket.recommendations) : (ticket.recommendations || []);
    } catch {
        findings = [];
        recommendations = [];
    }

    // Parse damage photos (fotos del daño)
    let damagePhotos = [];
    try {
        damagePhotos = typeof ticket.damagePhotos === 'string' ? JSON.parse(ticket.damagePhotos) : (ticket.damagePhotos || []);
        damagePhotos = damagePhotos.filter(p => p && !p.startsWith('blob:'));
    } catch {
        damagePhotos = [];
    }

    // Labor cost
    const laborCost = parseInt(ticket.laborCost) || 0;

    // Parse photos - merge DB evidence with legacy photosIntake
    let photos = [];
    try {
        const legacyPhotos = typeof ticket.photosIntake === 'string' ? JSON.parse(ticket.photosIntake) : (ticket.photosIntake || []);
        // Only keep valid local URLs or files, filter out broken blob URLs
        const validLegacy = legacyPhotos.filter(p => p && !p.startsWith('blob:'));
        
        // Add DB Evidence if available (use dataUrl directly for report)
        const dbEvidence = ticket.dbEvidence || [];
        const evidenceData = dbEvidence.map(ev => ev.photo_data);
        
        photos = [...validLegacy, ...evidenceData];
    } catch {
        photos = [];
    }

    const date = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Reporte de Servicio #${ticket.id} - LBDC</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800&family=Inter:wght@400;600&display=swap');
        
        :root {
            --primary: #6366f1;
            --primary-dark: #4f46e5;
            --secondary: #0f172a;
            --accent: #10b981;
            --text-dark: #0f172a;
            --text-light: #64748b;
            --bg-light: #f8fafc;
            --border: #e2e8f0;
        }

        body {
            font-family: 'Inter', sans-serif;
            background-color: var(--bg-light);
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        .report-wrapper {
            max-width: 900px;
            margin: 40px auto;
            background: white;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
        }

        /* --- Premium Full-Page Cover --- */
        .cover-page {
            height: 1000px;
            background: var(--secondary);
            position: relative;
            color: white;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 80px;
            page-break-after: always;
        }

        .cover-bg {
            position: absolute;
            inset: 0;
            z-index: 1;
            background-image: url('${getAbsoluteUrl('https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=1920&q=80', baseUrl)}');
            background-size: cover;
            background-position: center;
            opacity: 0.4;
        }

        .cover-gradient {
            position: absolute;
            inset: 0;
            background: linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(99, 102, 241, 0.3) 100%);
            z-index: 2;
        }

        .cover-content {
            position: relative;
            z-index: 10;
        }

        .cover-brand {
            display: flex;
            align-items: center;
            gap: 20px;
            margin-bottom: 60px;
        }

        .cover-logo-box {
            background: white;
            color: var(--secondary);
            width: 60px;
            height: 60px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 10px 20px rgba(0,0,0,0.3);
        }

        .cover-brand h2 {
            font-family: 'Outfit', sans-serif;
            font-size: 28px;
            font-weight: 800;
            margin: 0;
            letter-spacing: -1px;
        }

        .cover-main {
            margin-top: 100px;
        }

        .cover-tag {
            background: var(--primary);
            color: white;
            display: inline-block;
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 24px;
        }

        .cover-title {
            font-family: 'Outfit', sans-serif;
            font-size: 64px;
            font-weight: 800;
            line-height: 1;
            margin: 0;
            letter-spacing: -2px;
            text-shadow: 0 4px 10px rgba(0,0,0,0.3);
        }

        .cover-subtitle {
            font-size: 20px;
            opacity: 0.8;
            margin-top: 20px;
            max-width: 500px;
            line-height: 1.5;
            font-weight: 500;
        }

        .cover-footer {
            position: relative;
            z-index: 5;
            border-top: 1px solid rgba(255, 255, 255, 0.2);
            padding-top: 40px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }

        .cover-client-label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 2px;
            opacity: 0.6;
            margin-bottom: 10px;
            font-weight: 800;
        }

        .cover-client-name {
            font-size: 36px;
            font-weight: 700;
            font-family: 'Outfit', sans-serif;
        }

        .cover-date-box {
            text-align: right;
        }

        .cover-date-box .date {
            font-size: 20px;
            font-weight: 700;
            color: var(--accent);
        }

        /* --- Report Content --- */
        .report-page {
            padding: 60px;
            position: relative;
        }

        /* --- Header Decor --- */
        .header-gradient {
            height: 8px;
            background: linear-gradient(90deg, var(--secondary) 0%, var(--primary) 50%, var(--accent) 100%);
        }

        .content { padding: 60px; }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 60px;
        }

        .brand {
            display: flex;
            align-items: center;
            gap: 18px;
        }

        .brand-logo {
            background: var(--secondary);
            color: white;
            width: 56px;
            height: 56px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
        }

        .brand-name h1 {
            font-family: 'Outfit', sans-serif;
            font-size: 28px;
            font-weight: 800;
            color: var(--text-dark);
            margin: 0;
            letter-spacing: -0.05em;
            line-height: 1;
        }

        .brand-name p {
            font-size: 11px;
            font-weight: 700;
            color: var(--primary);
            margin: 4px 0 0;
            text-transform: uppercase;
            letter-spacing: 0.2em;
        }

        .doc-meta { text-align: right; }
        .doc-meta .type {
            font-size: 10px;
            font-weight: 800;
            color: var(--text-light);
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-bottom: 4px;
        }
        .doc-meta .id {
            font-family: 'Outfit', sans-serif;
            font-size: 32px;
            font-weight: 800;
            color: var(--text-dark);
            line-height: 1;
        }

        .policy-section {
            padding: 40px;
            background: #f8fafc;
            border-top: 1px solid var(--border);
            font-size: 11px;
            color: var(--text-light);
            line-height: 1.6;
        }

        .policy-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
        }

        .policy-title {
            font-weight: 800;
            color: var(--secondary);
            text-transform: uppercase;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .signature-section {
            padding: 60px 40px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }

        .signature-box {
            width: 250px;
            border-top: 1px solid var(--secondary);
            text-align: center;
            padding-top: 15px;
        }

        .signature-name {
            font-family: 'Outfit', sans-serif;
            font-weight: 700;
            font-size: 14px;
            color: var(--secondary);
            text-transform: uppercase;
        }

        .signature-label {
            font-size: 10px;
            color: var(--text-light);
            margin-top: 4px;
        }

        /* --- Cards --- */
        .card {
            background: #fff;
            border: 1px solid var(--border);
            border-radius: 20px;
            padding: 30px;
            margin-bottom: 30px;
        }

        .card-title {
            font-family: 'Outfit', sans-serif;
            font-size: 14px;
            font-weight: 800;
            color: var(--text-dark);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .card-title::before {
            content: "";
            width: 4px;
            height: 16px;
            background: var(--primary);
            border-radius: 2px;
        }

        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 24px;
        }

        .info-item label {
            display: block;
            font-size: 10px;
            font-weight: 700;
            color: var(--text-light);
            text-transform: uppercase;
            margin-bottom: 4px;
        }

        .info-item span {
            font-size: 15px;
            font-weight: 600;
            color: var(--text-dark);
        }

        /* --- Diagnostic Highlights --- */
        .highlight-box {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border-left: 4px solid var(--primary);
            padding: 25px;
            border-radius: 0 16px 16px 0;
            font-size: 16px;
            color: var(--text-dark);
            font-weight: 500;
        }

        /* --- Quote Table --- */
        .modern-table {
            width: 100%;
            border-collapse: collapse;
        }

        .modern-table th {
            text-align: left;
            font-size: 11px;
            font-weight: 700;
            color: var(--text-light);
            text-transform: uppercase;
            padding: 15px 10px;
            border-bottom: 2px solid var(--border);
        }

        .modern-table td {
            padding: 15px 10px;
            font-size: 14px;
            border-bottom: 1px solid var(--border);
        }

        .total-box {
            margin-top: 20px;
            background: var(--secondary);
            color: white;
            padding: 20px 30px;
            border-radius: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .total-box label { font-weight: 700; font-size: 14px; opacity: 0.7; }
        .total-box .price { font-family: 'Outfit', sans-serif; font-size: 24px; font-weight: 800; color: var(--accent); }

        /* --- Photo Gallery --- */
        .gallery {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
        }

        .photo-frame {
            position: relative;
            aspect-ratio: 4/3;
            border-radius: 12px;
            overflow: hidden;
            background: #eee;
            border: 1px solid var(--border);
        }

        .photo-frame img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .evidence-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
        }

        .evidence-grid img {
            width: 100%;
            aspect-ratio: 16/9;
            object-fit: cover;
            border-radius: 12px;
            border: 1px solid var(--border);
        }

        .footer {
            margin-top: 80px;
            text-align: center;
            font-size: 12px;
            color: var(--text-light);
            border-top: 1px solid var(--border);
            padding-top: 40px;
        }

        .footer .contact-info {
            font-weight: 700;
            color: var(--text-dark);
            margin-bottom: 10px;
        }

        @media print {
            body { background: white; padding: 0; }
            .report-page { box-shadow: none; border-radius: 0; }
        }
    </style>
</head>
<body>
    <div class="report-wrapper">
        <!-- Portada Premium Revertida -->
        <div class="cover-page">
            <div class="cover-bg"></div>
            <div class="cover-gradient"></div>
            
            <div class="cover-content">
                <div class="cover-brand">
                    <div class="cover-logo-box">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
                    </div>
                    <h2>LA BODEGA DEL COMPUTADOR</h2>
                </div>

                <div class="cover-main">
                    <div class="cover-tag">Laboratorio Técnico Oficial</div>
                    <h1 class="cover-title">REPORTE DE<br>SERVICIO TÉCNICO</h1>
                    <p class="cover-subtitle">Informe profesional de diagnóstico, intervención y certificación de hardware/software.</p>
                </div>
            </div>

            <div class="cover-footer">
                <div class="cover-client">
                    <div class="cover-client-label">Preparado para:</div>
                    <div class="cover-client-name">${ticket.clientName}</div>
                </div>
                <div class="cover-date-box">
                    <div class="cover-client-label">Identificación OS:</div>
                    <div class="date" style="margin-bottom: 5px;">#${ticket.id}</div>
                    <div style="font-size: 14px; opacity: 0.8; font-weight: 600;">${date}</div>
                </div>
            </div>
        </div>

        <!-- Cuerpo del Reporte -->
        <div class="report-page">
            <div class="header-gradient"></div>
            <div class="content">
            <!-- Header -->
            <div class="header">
                <div class="brand">
                    <div class="brand-logo">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
                    </div>
                    <div class="brand-name">
                        <h1>LA BODEGA</h1>
                        <p>DEL COMPUTADOR</p>
                    </div>
                </div>
                <div class="doc-meta">
                    <div class="type">Reporte de Servicio Técnico</div>
                    <div class="id">#${ticket.orderNumber || ticket.id}</div>
                    <div style="font-size: 12px; color: var(--primary); font-weight: 800; margin-top: 5px;">${date}</div>
                </div>
            </div>

            <!-- Customer & Device -->
            <div class="card">
                <div class="card-title">Resumen de Recepción</div>
                <div class="info-grid">
                    <div class="info-item">
                        <label>Titular del Servicio</label>
                        <span>${ticket.clientName}</span>
                    </div>
                    <div class="info-item">
                        <label>Equipo Recibido</label>
                        <span>${ticket.deviceType} ${ticket.brand} ${ticket.model || ''}</span>
                    </div>
                    <div class="info-item">
                        <label>Identificación Serial</label>
                        <span>${ticket.serial || 'N/A'}</span>
                    </div>
                    <div class="info-item">
                        <label>Falla Reportada</label>
                        <span>${ticket.issueDescription}</span>
                    </div>
                </div>
            </div>

            <!-- Diagnosis -->
            <div class="section" style="margin-bottom: 40px;">
                <div class="card-title">Análisis y Diagnóstico Técnico</div>
                <div class="highlight-box">
                    ${ticket.diagnosis || 'Pendiente de diagnóstico final.'}
                </div>
            </div>

            <!-- Evidence -->
            ${photos.length > 0 ? `
            <div class="section" style="margin-bottom: 40px;">
                <div class="card-title">Evidencia Técnica (Estado de Recepción / Hallazgos)</div>
                <div class="evidence-grid">
                    ${photos.map(url => `
                        <div class="photo-frame">
                            <img src="${getAbsoluteUrl(url, baseUrl)}" alt="Evidencia">
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            <!-- Recommendations & Findings -->
            <div class="info-grid" style="margin-bottom: 40px;">
                <div>
                    <div class="card-title">Observaciones</div>
                    <div style="font-size: 14px; padding-left: 10px; border-left: 2px solid var(--border);">
                        ${findings.length > 0 ? findings.map(f => `<div style="margin-bottom: 8px;">• ${f}</div>`).join('') : 'Sin observaciones adicionales.'}
                    </div>
                </div>
                <div>
                    <div class="card-title">Recomendaciones</div>
                    <div style="font-size: 14px; padding-left: 10px; border-left: 2px solid var(--border);">
                        ${recommendations.length > 0 ? recommendations.map(r => `<div style="margin-bottom: 8px;">• ${r}</div>`).join('') : 'Sin recomendaciones específicas.'}
                    </div>
                </div>
            </div>

            <!-- Damage Photos -->
            ${damagePhotos.length > 0 ? `
            <div class="section" style="margin-bottom: 40px;">
                <div class="card-title" style="color: #dc2626;">Evidencia del Daño / Falla Detectada</div>
                <div class="evidence-grid">
                    ${damagePhotos.map(url => `
                        <div class="photo-frame" style="border-color: #fca5a5;">
                            <img src="${getAbsoluteUrl(url, baseUrl)}" alt="Daño">
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            <!-- Evidence -->
            ${photos.length > 0 ? `
            <div class="section" style="margin-bottom: 40px;">
                <div class="card-title">Evidencia Técnica</div>
                <div class="gallery">
                    <div class="evidence-grid">
                        ${photos.map(photo => `<img src="${getAbsoluteUrl(photo.url || photo, baseUrl)}" alt="Evidencia">`).join('')}
                    </div>
                </div>
            </div>
            ` : ''}

            <!-- Costs -->
            <div class="section">
                <div class="card-title">Presupuesto de Intervención</div>
                <table class="modern-table">
                    <thead>
                        <tr>
                            <th>Descripción del Item</th>
                            <th style="text-align: center">Cant</th>
                            <th style="text-align: right">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${quoteItems.map(item => `
                        <tr>
                            <td style="font-weight: 600; color: var(--text-dark)">${item.name || item.description}</td>
                            <td style="text-align: center">${item.quantity}</td>
                            <td style="text-align: right; font-weight: 700;">$${(item.price * item.quantity).toLocaleString('es-CO')}</td>
                        </tr>
                        `).join('')}
                        ${laborCost > 0 ? `
                        <tr style="background-color: #fef3c7;">
                            <td style="font-weight: 700; color: #92400e;">Mano de Obra / Servicio Técnico</td>
                            <td style="text-align: center">1</td>
                            <td style="text-align: right; font-weight: 700; color: #92400e;">$${laborCost.toLocaleString('es-CO')}</td>
                        </tr>
                        ` : ''}
                        ${quoteItems.length === 0 && laborCost === 0 ? '<tr><td colspan="3" style="text-align: center; color: var(--text-light); font-style: italic; padding: 30px;">Costo estimado de mano de obra y repuestos generales.</td></tr>' : ''}
                    </tbody>
                </table>
                <div class="total-box">
                    <label>VALOR TOTAL DEL SERVICIO</label>
                    <div class="price">$${parseInt(ticket.estimatedCost || 0).toLocaleString('es-CO')}</div>
                </div>
                ${(ticket.estimatedCost || 0) !== (laborCost + quoteItems.reduce((s, i) => s + (i.price * i.quantity), 0)) && (laborCost > 0 || quoteItems.length > 0) ? `
                <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 15px; margin-top: 15px; text-align: center;">
                    <p style="font-size: 11px; color: #065f46; margin: 0;">
                        <strong>Desglose:</strong> Repuestos: $${quoteItems.reduce((s, i) => s + (i.price * i.quantity), 0).toLocaleString('es-CO')} | 
                        Mano de Obra: $${laborCost.toLocaleString('es-CO')} | 
                        <strong>Total: $${(laborCost + quoteItems.reduce((s, i) => s + (i.price * i.quantity), 0)).toLocaleString('es-CO')}</strong>
                    </p>
                </div>
                ` : ''}
                <p style="font-size: 10px; color: var(--text-light); text-align: center; margin-top: 15px;">
                    * Precios expresados en Pesos Colombianos (COP). Validez de la cotización: 5 días hábiles.
                </p>
            </div>

            <div class="signature-section">
                <!-- Administrative Signature -->
                <div class="signature-box">
                    <div style="height: 60px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                        <svg width="150" height="50" viewBox="0 0 150 50">
                            <path d="M10,35 Q30,10 50,35 T90,35 T130,20" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" opacity="0.8" />
                            <path d="M20,40 Q40,15 60,30 T100,25" fill="none" stroke="#1e40af" stroke-width="1.5" stroke-linecap="round" opacity="0.6" />
                        </svg>
                    </div>
                    <div class="signature-name">GERENCIA TÉCNICA</div>
                    <div class="signature-label">Firma Autorizada LBDC</div>
                </div>
                <!-- Technician Signature -->
                <div class="signature-box">
                    <div style="height: 60px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                        <svg width="150" height="50" viewBox="0 0 150 50">
                            <path d="M20,30 C40,10 60,50 80,30 S120,40 140,20" fill="none" stroke="#1e293b" stroke-width="2" stroke-dasharray="2,1" opacity="0.7" />
                            <text x="20" y="35" font-family="cursive" font-size="20" fill="#334155" opacity="0.5">${ticket.technicianName?.split(' ')[0] || 'Tech'}</text>
                        </svg>
                    </div>
                    <div class="signature-name">Ing. ${ticket.technicianName || 'Técnico Responsable'}</div>
                    <div class="signature-label">Especialista de Servicio</div>
                </div>
            </div>

            <div class="policy-section">
                <div class="policy-grid">
                    <div>
                        <div class="policy-title">Políticas de Garantía</div>
                        • <strong>Hardware Nuevo:</strong> 12 meses de garantía oficial según fabricante.<br>
                        • <strong>Servicio Técnico:</strong> 30 días de garantía sobre la reparación específica realizada.<br>
                        • <strong>Exclusiones:</strong> Daños por humedad, picos de voltaje, sellos alterados o manipulación externa.<br>
                        • <strong>Requisito:</strong> Presentar este documento físico o digital para cualquier reclamación.
                    </div>
                    <div>
                        <div class="policy-title">Nota de Responsabilidad</div>
                        Al retirar el equipo, el cliente acepta que ha sido probado a satisfacción. LBDC no se hace responsable por pérdida de datos no respaldados. Equipos no retirados en 90 días entran en proceso de abandono legal.
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div class="footer">
                <div class="contact-info">
                    PBX: ${businessPhone} | ${businessAddress} | ${businessEmail}
                </div>
                <div style="margin-top: 5px; font-weight: 800; color: var(--secondary);">${businessDomain}</div>
                <div style="margin-top: 15px; opacity: 0.6;">${businessName} © ${new Date().getFullYear()} - Soluciones Tecnológicas de Excelencia</div>
            </div>
        </div>
    </div>
</body>
</html>
    `;
};

// Send report to customer
export const sendCustomerReport = async (req, res) => {
    const { ticketId } = req.params;

    try {
        // Fetch settings for branding
        const settingsKeys = ['businessName', 'businessAddress', 'whatsappNumber', 'businessEmail', 'businessDomain'];
        const settings = {};
        for (const key of settingsKeys) {
            settings[key] = await getSetting(key);
        }

        // Get ticket details with technician name and evidence
        const ticket = await new Promise((resolve, reject) => {
            const query = `
                SELECT t.*, u.name as technicianName 
                FROM tickets t 
                LEFT JOIN users u ON t.assignedTo = u.id 
                WHERE t.id = ?
            `;
            db.get(query, [ticketId], (err, row) => {
                if (err) return reject(err);
                if (!row) return resolve(null);

                // Fetch real evidence from DB
                db.all('SELECT id FROM ticket_evidence WHERE ticket_id = ?', [ticketId], (evErr, evRows) => {
                    if (!evErr) row.dbEvidence = evRows;
                    resolve(row);
                });
            });
        });

        if (!ticket) {
            return res.status(404).json({ error: 'Ticket no encontrado' });
        }

        // Generate HTML report
        const host = req.get('host');
        const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
        const baseUrl = `${protocol}://${host}`;
        const htmlReport = generateCustomerReport(ticket, baseUrl, settings);

        // Send email with attachment
        const mailOptions = {
            from: process.env.SMTP_FROM || 'LA BODEGA DEL COMPUTADOR <noreply@labodega.com>',
            to: req.body.email || ticket.clientEmail,
            subject: `Reporte de Servicio #${ticket.id} - LA BODEGA DEL COMPUTADOR`,
            html: `
                <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
                    <div style="background: #0f172a; padding: 30px; text-align: center; border-bottom: 5px solid #6366f1;">
                        <h2 style="color: white; margin: 0;">Reporte Tecnico Listo</h2>
                    </div>
                    <div style="padding: 30px; line-height: 1.6;">
                        <p>Hola <strong>${ticket.clientName}</strong>,</p>
                        <p>El departamento tecnico de <strong>LA BODEGA DEL COMPUTADOR</strong> ha finalizado el diagnostico y/o reparacion de tu equipo.</p>
                        <p>Hemos adjuntado el reporte detallado en formato digital para tu revision.</p>
                        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <strong>Orden de Servicio:</strong> #${ticket.id}<br>
                            <strong>Costo Estimado:</strong> $${ticket.estimatedCost || 0}
                        </div>
                        <p>Si tienes alguna duda, puedes contactarnos respondiendo a este correo o via WhatsApp.</p>
                    </div>
                </div>
            `,
            attachments: [
                {
                    filename: `Reporte-Soporte-LBDC-${ticket.id}.html`,
                    content: htmlReport
                }
            ]
        };

        await transporter.sendMail(mailOptions);


        res.json({
            success: true,
            message: 'Reporte enviado exitosamente',
            sentTo: mailOptions.to
        });

    } catch (error) {
        console.error('Error sending report:', error);
        res.status(500).json({ error: error.message });
    }
};

// Preview report (for testing)
export const previewCustomerReport = (req, res) => {
    const { ticketId } = req.params;

    // Fetch settings for branding
    const settingsKeys = ['businessName', 'businessAddress', 'whatsappNumber', 'businessEmail', 'businessDomain'];
    const settings = {};
    
    const fetchFullTicket = async () => {
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

                // Fetch real evidence from DB (including photo_data)
                db.all('SELECT photo_data, created_at FROM ticket_evidence WHERE ticket_id = ?', [ticketId], (evErr, evRows) => {
                    if (!evErr) row.dbEvidence = evRows || [];
                    resolve(row);
                });
            });
        });
    };

    fetchFullTicket().then(ticket => {
        if (!ticket) {
            res.status(404).json({ error: 'Ticket no encontrado' });
            return;
        }

        const host = req.get('host');
        const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
        const baseUrl = `${protocol}://${host}`;
        const htmlReport = generateCustomerReport(ticket, baseUrl, settings);
        res.setHeader('Content-Type', 'text/html');
        res.send(htmlReport);
    });
};
