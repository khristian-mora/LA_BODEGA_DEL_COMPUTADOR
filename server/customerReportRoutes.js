// Customer Report Generation
import { db } from './db.js';
import { sendEmail } from './mail.js';
import { safeParse } from './utils.js';

// Helper for absolute URLs
const getAbsoluteUrl = (path, baseUrl) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

// Generate HTML report for customers
const generateCustomerReport = (ticket, baseUrl, settings = {}) => {
    const { 
        businessName = 'LA BODEGA DEL COMPUTADOR', 
        businessAddress = '', 
        whatsappNumber = '', 
        businessEmail = '', 
        businessDomain = '' 
    } = settings;
    const businessPhone = whatsappNumber;

    const quoteItems = safeParse(ticket.quoteItems);
    const status = ticket.status || 'RECEIVED';

    // const statusLabels = { RECEIVED: 'Recibido', DIAGNOSED: 'Diagnosticado', QUOTED: 'Cotizado', AUTHORIZED: 'Autorizado', REJECTED: 'Rechazado (No Autorizado)', REPAIRING: 'En Reparación', READY: 'Listo para Entrega', DELIVERED: 'Entregado' };
    const statusPhase = { RECEIVED: 1, DIAGNOSED: 2, QUOTED: 3, AUTHORIZED: 4, REJECTED: 4, REPAIRING: 5, READY: 6, DELIVERED: 7 };
    const currentPhase = statusPhase[status] || 1;

    // Parse findings and recommendations
    const findings = safeParse(ticket.findings);
    const recommendations = safeParse(ticket.recommendations);

    // Parse damage photos (fotos del daño)
    const damagePhotos = safeParse(ticket.damagePhotos).filter(p => p && !p.startsWith('blob:'));

    // Labor items
    const laborItems = safeParse(ticket.laborItems);
    const totalLaborCost = laborItems.reduce((sum, item) => sum + (item.price || 0), 0);
    const laborCost = totalLaborCost || parseInt(ticket.laborCost) || 0;

    // Parse photos - merge DB evidence with legacy photosIntake
    let photos = [];
    try {
        const legacyPhotos = safeParse(ticket.photosIntake);
        const validLegacy = legacyPhotos.filter(p => p && !p.startsWith('blob:'));
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

        @media print {
            @page { margin: 0.5cm; size: A4; }
            html, body { margin: 0 !important; padding: 0 !important; width: 100% !important; height: 100% !important; }
            body { background: white !important; }
            .report-wrapper { 
                max-width: 100% !important; 
                margin: 0 !important; 
                box-shadow: none !important; 
                width: 100% !important;
            }
            .cover-page { 
                height: 90vh !important; 
                min-height: 90vh !important;
                page-break-after: always;
                padding: 40px 50px !important;
                color: white !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: space-between !important;
            }
            .cover-gradient { opacity: 0.5 !important; }
            .cover-content { position: relative; z-index: 10; }
            .cover-brand { margin-bottom: 25px !important; gap: 12px !important; }
            .cover-logo-box { width: 45px !important; height: 45px !important; border-radius: 10px !important; box-shadow: none !important; }
            .cover-logo-box svg { width: 22px !important; height: 22px !important; }
            .cover-brand h2 { font-size: 18px !important; }
            .cover-tag { font-size: 10px !important; padding: 5px 12px !important; margin-bottom: 12px !important; }
            .cover-title { font-size: 36px !important; line-height: 1.1 !important; }
            .cover-subtitle { font-size: 14px !important; }
            .cover-tech { font-size: 16px !important; margin-top: 15px !important; }
            .cover-main { margin-top: 30px !important; }
            .cover-footer-info { font-size: 10px !important; }
            .cover-footer { margin-top: 25px !important; }
            .report-info-grid { gap: 15px !important; }
            .report-info-card { padding: 12px !important; border-radius: 4px !important; }
            .report-section { padding: 15px 0 !important; }
            .report-section-header { font-size: 10px !important; margin-bottom: 8px !important; }
            .signature-section { margin-top: 20px !important; page-break-inside: avoid; }
            .footer { display: block !important; }
            .no-print { display: none !important; }
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
            background-image: url('/images/tech-service-bg.jpg');
            background-size: cover;
            background-position: center;
            opacity: 0.4;
        }

        @media print {
            .cover-bg {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                opacity: 0.3 !important;
            }
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

        .cover-tech {
            font-size: 22px;
            font-weight: 700;
            margin-top: 30px;
            color: white;
            text-shadow: 0 2px 10px rgba(0,0,0,0.3);
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
        <!-- Portada Premium -->
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
                    ${ticket.technicianName ? `<div class="cover-tech">Presentado por Ing. ${ticket.technicianName}</div>` : ''}
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
                    ${ticket.deviceConditions ? `
                    <div class="info-item">
                        <label>Condición Visual</label>
                        <span>${ticket.deviceConditions}</span>
                    </div>
                    ` : ''}
                    <div class="info-item">
                        <label>Falla Reportada</label>
                        <span>${ticket.issueDescription}</span>
                    </div>
                    ${ticket.estimatedDeliveryDate ? `
                    <div class="info-item">
                        <label>Fecha Estimada de Entrega</label>
                        <span style="color: var(--primary); font-weight: 800;">${new Date(ticket.estimatedDeliveryDate).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                    ` : ''}
                </div>
            </div>

            <!-- Diagnosis -->
            ${currentPhase >= 2 ? `
            <div class="section" style="margin-bottom: 40px;">
                <div class="card-title">Análisis y Diagnóstico Técnico</div>
                <div class="highlight-box">
                    ${ticket.diagnosis || 'Pendiente de diagnóstico final.'}
                </div>
                ${ticket.technicianNotes ? `<div style="margin-top: 15px; padding: 15px; background: #fefce8; border-radius: 8px; border-left: 3px solid #eab308;">
                    <strong style="font-size: 11px; color: #854d0e;">NOTAS DEL TÉCNICO:</strong>
                    <p style="margin: 5px 0 0 0; font-size: 13px; color: #713f12;">${ticket.technicianNotes}</p>
                </div>` : ''}
            </div>
            ` : ''}

            <!-- Findings & Recommendations -->
            ${currentPhase >= 2 ? `
            <div class="info-grid" style="margin-bottom: 40px;">
                <div>
                    <div class="card-title">Hallazgos</div>
                    <div style="font-size: 14px; padding-left: 10px; border-left: 2px solid var(--border);">
                        ${findings.length > 0 ? findings.map(f => `<div style="margin-bottom: 8px;">• ${f}</div>`).join('') : 'Sin hallazgos registrados.'}
                    </div>
                </div>
                <div>
                    <div class="card-title">Recomendaciones</div>
                    <div style="font-size: 14px; padding-left: 10px; border-left: 2px solid var(--border);">
                        ${recommendations.length > 0 ? recommendations.map(r => `<div style="margin-bottom: 8px;">• ${r}</div>`).join('') : 'Sin recomendaciones específicas.'}
                    </div>
                </div>
            </div>
            ` : ''}

            <!-- Evidence Photos -->
            ${photos.length > 0 ? `
            <div class="section" style="margin-bottom: 40px;">
                <div class="card-title">Evidencia Técnica (Estado de Recepción)</div>
                <div class="evidence-grid">
                    ${photos.map(url => `
                        <div class="photo-frame">
                            <img src="${getAbsoluteUrl(url, baseUrl)}" alt="Evidencia">
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            <!-- Damage Photos -->
            ${currentPhase >= 2 && damagePhotos.length > 0 ? `
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

            <!-- Repair Notes -->
            ${currentPhase >= 5 && ticket.repairNotes ? `
            <div class="section" style="margin-bottom: 40px;">
                <div class="card-title">Trabajos Realizados</div>
                <div class="highlight-box" style="background: #fdf4ff; border-left-color: #a855f7;">
                    ${ticket.repairNotes}
                </div>
            </div>
            ` : ''}

            <!-- Quote/Costs -->
            ${currentPhase >= 2 ? `
            <div class="section">
                <div class="card-title">${status === 'REJECTED' ? 'Cargos de Revisión Técnica' : 'Presupuesto de Intervención'}</div>
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
                        ${laborItems.length > 0 ? laborItems.map(item => `
                        <tr style="background-color: #fef3c7;">
                            <td style="font-weight: 700; color: #92400e;">${item.description || 'Mano de Obra'}</td>
                            <td style="text-align: center">1</td>
                            <td style="text-align: right; font-weight: 700; color: #92400e;">$${(item.price || 0).toLocaleString('es-CO')}</td>
                        </tr>
                        `).join('') : ''}
                        ${quoteItems.length === 0 && laborCost === 0 ? '<tr><td colspan="3" style="text-align: center; color: var(--text-light); font-style: italic; padding: 30px;">Pendiente de cotización.</td></tr>' : ''}
                    </tbody>
                </table>
                <div class="total-box">
                    <label>VALOR TOTAL DEL SERVICIO</label>
                    <div class="price">$${(quoteItems.reduce((s, i) => s + (i.price * i.quantity), 0) + laborCost).toLocaleString('es-CO')}</div>
                </div>
                <p style="font-size: 10px; color: var(--text-light); text-align: center; margin-top: 15px;">
                    * Precios expresados en Pesos Colombianos (COP). Validez de la cotización: 5 días hábiles.
                </p>
            </div>
            ` : ''}

            <!-- Phase Signatures -->
            ${currentPhase >= 4 && currentPhase < 6 ? `
            <div class="signature-section">
                <div class="signature-box">
                    <div style="height: 60px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                        <svg width="150" height="50" viewBox="0 0 150 50">
                            <path d="M10,35 Q30,10 50,35 T90,35 T130,20" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" opacity="0.8" />
                        </svg>
                    </div>
                    <div class="signature-name">GERENCIA TÉCNICA</div>
                    <div class="signature-label">Firma Autorizada LBDC</div>
                </div>
                <div class="signature-box">
                    <div style="height: 60px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                        <svg width="150" height="50" viewBox="0 0 150 50">
                            <path d="M20,30 C40,10 60,50 80,30 S120,40 140,20" fill="none" stroke="#1e293b" stroke-width="2" stroke-dasharray="2,1" opacity="0.7" />
                        </svg>
                    </div>
                    <div class="signature-name">Ing. ${ticket.technicianName || 'Técnico Responsable'}</div>
                    <div class="signature-label">Especialista de Servicio</div>
                </div>
            </div>
            ` : ''}

            <!-- Warranty Section (Only for DELIVERED repairs) -->
            ${status === 'DELIVERED' && ticket.status !== 'REJECTED' ? `
            <div class="section" style="margin-bottom: 40px; page-break-inside: avoid;">
                <div class="card-title" style="color: #10b981; display: flex; align-items: center; gap: 10px;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                    Garantía de Reparación Activa
                </div>
                <div class="highlight-box" style="background: #f0fdf4; border-left-color: #10b981; padding: 25px; border-radius: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
                        <div>
                            <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #065f46; font-weight: 800;">Estado de Protección</p>
                            <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: 900; color: #064e3b;">COBERTURA VIGENTE (90 DÍAS)</p>
                        </div>
                        <div style="text-align: right;">
                            <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #065f46; font-weight: 800;">Vence el Día</p>
                            <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: 900; color: #064e3b;">
                                ${(() => {
                                    const d = new Date();
                                    d.setDate(d.getDate() + 90);
                                    return d.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase();
                                })()}
                            </p>
                        </div>
                    </div>
                    <div style="font-size: 12px; color: #065f46; line-height: 1.6; border-top: 1px solid #b7e4c7; padding-top: 15px; margin-top: 15px;">
                        <p style="margin: 0;"><strong>Condiciones:</strong> Esta cobertura protege contra fallos de mano de obra y componentes remplazados. No aplica ante daños fortuitos, golpes o exposición a líquidos.</p>
                    </div>
                </div>
            </div>
            ` : ''}

            <!-- Final Delivery Signatures -->
            ${currentPhase >= 6 ? `
            <div class="signature-section">
                <div class="signature-box">
                    <div style="height: 60px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                        <svg width="150" height="50" viewBox="0 0 150 50">
                            <path d="M10,35 Q30,10 50,35 T90,35 T130,20" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" opacity="0.8" />
                        </svg>
                    </div>
                    <div class="signature-name">CENTRO DE SERVICIOS</div>
                    <div class="signature-label">La Bodega del Computador</div>
                </div>
                <div class="signature-box">
                    <div style="height: 60px; display: flex; align-items: center; justify-content: center; margin-bottom: 10px;">
                        <svg width="150" height="50" viewBox="0 0 150 50">
                            <path d="M20,30 Q40,15 80,40" fill="none" stroke="#1e293b" stroke-width="2" opacity="0.7" />
                        </svg>
                    </div>
                    <div class="signature-name">${ticket.clientName}</div>
                    <div class="signature-label">Cliente - Recibí Conforme</div>
                </div>
            </div>
            ` : ''}

            <!-- Políticas -->
            ${currentPhase >= 2 ? `
            <div class="policy-section">
                <div class="policy-grid">
                    <div>
                        <div class="policy-title">Políticas de Garantía</div>
                        • <strong>Hardware Nuevo:</strong> 12 meses de garantía oficial fabricante.<br>
                        • <strong>Servicio Técnico:</strong> 30 días sobre labor realizada.<br>
                        • <strong>Exclusiones:</strong> Humedad, golpes, manipulación externa.<br>
                    </div>
                    <div>
                        <div class="policy-title">Nota de Responsabilidad</div>
                        Al retirar el equipo, el cliente acepta satisfacción. Equipos no retirados en 90 días entran en abandono legal.
                    </div>
                </div>
            </div>
            ` : ''}

            <!-- Footer -->
            <div class="footer">
                <div class="contact-info">
                    PBX: ${businessPhone} | ${businessAddress} | ${businessEmail}
                </div>
                <div style="margin-top: 5px; font-weight: 800; color: var(--secondary);">${businessDomain}</div>
                <div style="margin-top: 15px; opacity: 0.6;">${businessName} © ${new Date().getFullYear()}</div>
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
        const settingsKeys = ['businessName', 'businessAddress', 'whatsappNumber', 'businessEmail', 'businessDomain'];
        const settings = {};
        for (const key of settingsKeys) {
            settings[key] = await new Promise(r => {
                db.get('SELECT value FROM settings WHERE key = ?', [key], (err, row) => r(row?.value || ''));
            });
        }

        const ticket = await new Promise((resolve, reject) => {
            db.get(`SELECT t.*, u.name as technicianName FROM tickets t LEFT JOIN users u ON t.assignedTo = u.id WHERE t.id = ?`, [ticketId], (err, row) => {
                if (err) return reject(err);
                if (!row) return resolve(null);
                db.all('SELECT photo_data FROM ticket_evidence WHERE ticket_id = ?', [ticketId], (evErr, evRows) => {
                    row.dbEvidence = evRows || [];
                    resolve(row);
                });
            });
        });

        if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });

        const host = req.get('host');
        const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
        const baseUrl = `${protocol}://${host}`;
        const htmlReport = generateCustomerReport(ticket, baseUrl, settings);

        await sendEmail({
            to: req.body.email || ticket.clientEmail,
            subject: `Cotización de Reparación #${ticket.id} - Tu equipo necesita atención`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; color: white;">
                        <h1 style="margin: 0; font-size: 24px;">Cotización de Servicio Técnico</h1>
                        <p style="margin: 10px 0 0 0;">Presupuesto para la reparación de tu equipo</p>
                    </div>
                    <div style="padding: 30px; background: #f8fafc;">
                        <p style="color: #334155; font-size: 16px;">Hola <strong>${ticket.clientName}</strong>,</p>
                        <p style="color: #64748b;">Hemos revisado tu equipo y este es el presupuesto estimado para la reparación:</p>
                        
                        <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
                            <h3 style="color: #1e293b; margin: 0 0 15px 0;">Equipo</h3>
                            <p style="margin: 5px 0;"><strong>Dispositivo:</strong> ${ticket.brand} ${ticket.model || ''}</p>
                            <p style="margin: 5px 0;"><strong>Serial:</strong> ${ticket.serial || 'N/A'}</p>
                            <p style="margin: 5px 0;"><strong>Falla:</strong> ${ticket.issueDescription}</p>
                        </div>
                        
                        <div style="background: #fffbeb; border: 2px solid #f59e0b; padding: 15px; border-radius: 10px; margin: 20px 0;">
                            <p style="margin: 0; font-size: 14px; color: #92400e;">💡 Revisa el reporte adjunto para ver el diagnóstico completo y el presupuesto detallado.</p>
                        </div>
                        
                        <p style="color: #64748b; font-size: 14px;">¿Tienes alguna pregunta? Contáctanos para aclarar cualquier duda sobre la reparación.</p>
                    </div>
                    <div style="background: #1e293b; padding: 20px; text-align: center;">
                        <p style="color: #94a3b8; margin: 0; font-size: 12px;">La Bodega del Computador | Soporte Técnico</p>
                    </div>
                </div>
            `,
            attachments: [{ filename: `Cotizacion-LBDC-${ticket.id}.html`, content: htmlReport }],
            type: 'soporte'
        });

        res.json({ success: true, message: 'Reporte enviado' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
};

// Preview report
export const previewCustomerReport = (req, res) => {
    const { ticketId } = req.params;
    const settingsKeys = ['businessName', 'businessAddress', 'whatsappNumber', 'businessEmail', 'businessDomain'];
    const settings = {};
    
    const fetch = async () => {
        for (const key of settingsKeys) {
            settings[key] = await new Promise(r => {
                db.get('SELECT value FROM settings WHERE key = ?', [key], (err, row) => r(row?.value || ''));
            });
        }
        return new Promise(resolve => {
            db.get(`SELECT t.*, u.name as technicianName FROM tickets t LEFT JOIN users u ON t.assignedTo = u.id WHERE t.id = ?`, [ticketId], (err, row) => {
                if (!row) return resolve(null);
                db.all('SELECT photo_data FROM ticket_evidence WHERE ticket_id = ?', [ticketId], (evErr, evRows) => {
                    row.dbEvidence = evRows || [];
                    resolve(row);
                });
            });
        });
    };

    fetch().then(ticket => {
        if (!ticket) return res.status(404).send('No encontrado');
        const host = req.get('host');
        const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
        const baseUrl = `${protocol}://${host}`;
        res.send(generateCustomerReport(ticket, baseUrl, settings));
    });
};
