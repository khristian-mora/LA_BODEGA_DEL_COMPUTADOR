// Customer Report Generation
import { db } from './db.js';
import nodemailer from 'nodemailer';


// Helper to get full URL for images if stored relatively
const getFullImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    // Assuming server runs on port 3000 or similar, but for email better to use public URL if available
    // or attach as CID. For now, let's assume the client view uses the API to serve images.
    // Actually, for email, we need public URLs or base64. 
    // The previous python code used base64. 
    // Let's use the layout from Python but adapted for Node.
    return process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL}${path}` : `http://localhost:3000${path}`;
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

// Generate HTML report for customer
const generateCustomerReport = (ticket) => {
    const quoteItems = ticket.quoteItems ? JSON.parse(ticket.quoteItems) : [];

    // Parse findings and recommendations
    let findings = [];
    let recommendations = [];
    try {
        findings = typeof ticket.findings === 'string' ? JSON.parse(ticket.findings) : (ticket.findings || []);
        recommendations = typeof ticket.recommendations === 'string' ? JSON.parse(ticket.recommendations) : (ticket.recommendations || []);
    } catch (e) {
        findings = [];
        recommendations = [];
    }

    // Parse photos
    let photos = [];
    try {
        photos = typeof ticket.photosIntake === 'string' ? JSON.parse(ticket.photosIntake) : (ticket.photosIntake || []);
    } catch (e) {
        photos = [];
    }

    const date = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Informe Técnico - ${ticket.id}</title>
    <style>
        :root {
            --primary: #004236;
            --accent: #CCD32A;
            --text: #1e293b;
            --bg: #ffffff;
            --header-bg: #f1f5f9;
        }
        body {
            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 0;
            background: #e2e8f0;
        }
        .page {
            background: white;
            width: 100%;
            max-width: 800px; /* A4 approx width for email */
            margin: 20px auto;
            padding: 40px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            box-sizing: border-box;
        }
        
        /* Cover Page Styles */
        .cover {
            text-align: center;
            border: 2px solid #004236;
            padding: 40px 20px;
            margin-bottom: 40px;
            position: relative;
        }
        .cover h1 {
            color: #004236;
            font-size: 2.5em;
            margin-bottom: 0.2em;
        }
        .cover h2 {
            color: #64748b;
            font-weight: normal;
            font-size: 1.2em;
            margin-bottom: 2em;
        }
        .cover-details {
            text-align: left;
            margin: 0 auto;
            max-width: 400px;
            border-left: 5px solid #CCD32A;
            padding-left: 20px;
        }
        .cover-details p {
            font-size: 1.1em;
            margin: 10px 0;
            color: #333;
        }
        
        /* Content Styles */
        h3 {
            color: #004236;
            border-bottom: 2px solid #CCD32A;
            padding-bottom: 5px;
            margin-top: 30px;
        }
        
        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .info-table th, .info-table td {
            text-align: left;
            padding: 10px;
            border-bottom: 1px solid #e2e8f0;
        }
        .info-table th {
            width: 30%;
            color: #64748b;
            font-weight: 600;
        }
        
        .list-item {
            margin-bottom: 8px;
            padding-left: 20px;
            position: relative;
        }
        .list-item::before {
            content: "•";
            color: #CCD32A;
            font-weight: bold;
            position: absolute;
            left: 0;
        }
        
        .image-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 20px;
        }
        .image-card {
            border: 1px solid #e2e8f0;
            padding: 10px;
            border-radius: 5px;
            background: #f1f5f9;
        }
        .image-card img {
            width: 100%;
            height: 200px;
            object-fit: contain;
            background: white;
            border: 1px solid #ddd;
        }
        .image-caption {
            margin-top: 5px;
            font-size: 0.8em;
            color: #64748b;
            text-align: center;
        }

        .quote-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }
        .quote-table th {
            background: #004236;
            color: white;
            padding: 10px;
            text-align: left;
        }
        .quote-table td {
            padding: 10px;
            border-bottom: 1px solid #eee;
        }
        .total-row td {
            font-weight: bold;
            background: #f8fafc;
        }
        
        .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 0.9em;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
        }

        @media (max-width: 600px) {
            .image-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>

    <div class="page">
        <!-- Cover -->
        <div class="cover">
            <h1>LA BODEGA DEL COMPUTADOR</h1>
            <h2>Reporte Técnico de Servicio</h2>
            
            <div class="cover-details">
                <p><strong>Ticket ID:</strong> #${ticket.id}</p>
                <p><strong>Cliente:</strong> ${ticket.clientName}</p>
                <p><strong>Equipo:</strong> ${ticket.deviceType} ${ticket.brand}</p>
                <p><strong>Modelo:</strong> ${ticket.model || 'N/A'}</p>
                <p><strong>Fecha:</strong> ${date}</p>
            </div>
        </div>
        
        <!-- General Info -->
        <h3>1. Información del Equipo</h3>
        <table class="info-table">
            <tr><th>Serial / IMEI</th><td>${ticket.serial || 'N/A'}</td></tr>
            <tr><th>Problema Reportado</th><td>${ticket.issueDescription}</td></tr>
            <tr><th>Diagnóstico Técnico</th><td>${ticket.diagnosis || 'Pendiente'}</td></tr>
        </table>
        
        <!-- Findings -->
        <h3>2. Hallazgos Visuales</h3>
        ${findings.length > 0 ? findings.map(f => `<div class="list-item">${f}</div>`).join('') : '<p>No se registraron hallazgos visuales específicos.</p>'}
        
        <!-- Recommendations -->
        <h3>3. Recomendaciones del Experto</h3>
        ${recommendations.length > 0 ? recommendations.map(r => `<div class="list-item">${r}</div>`).join('') : '<p>No hay recomendaciones adicionales.</p>'}
        
        <!-- Evidence -->
        ${photos.length > 0 ? `
        <h3>4. Evidencia Fotográfica</h3>
        <div class="image-grid">
            ${photos.map((url, index) => `
            <div class="image-card">
                <!-- In production, ensure these URLs are publicly accessible or attached as CID -->
                <img src="${getFullImageUrl(url)}" alt="Evidencia ${index + 1}">
                <div class="image-caption">Evidencia ${index + 1}</div>
            </div>
            `).join('')}
        </div>
        ` : ''}
        
        <!-- Quote -->
        <h3>5. Cotización y Costos</h3>
        ${quoteItems.length > 0 ? `
        <table class="quote-table">
            <thead>
                <tr>
                    <th>Descripción</th>
                    <th>Cant.</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${quoteItems.map(item => `
                <tr>
                    <td>${item.description || item.name}</td>
                    <td>${item.quantity}</td>
                    <td>$${(item.price * item.quantity).toLocaleString('es-CO')}</td>
                </tr>
                `).join('')}
                <tr class="total-row">
                    <td colspan="2">TOTAL ESTIMADO</td>
                    <td>$${parseInt(ticket.estimatedCost || 0).toLocaleString('es-CO')}</td>
                </tr>
            </tbody>
        </table>
        ` : `
        <p><strong>Costo Estimado de Reparación:</strong> $${parseInt(ticket.estimatedCost || 0).toLocaleString('es-CO')}</p>
        `}
        
        <div class="footer">
            <p>Gracias por confiar en La Bodega del Computador.</p>
            <p>Dudas o inquietudes: ${process.env.BUSINESS_PHONE || '300 123 4567'}</p>
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
        // Get ticket details
        const ticket = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM tickets WHERE id = ?', [ticketId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        if (!ticket) {
            return res.status(404).json({ error: 'Ticket no encontrado' });
        }

        // Generate HTML report
        const htmlReport = generateCustomerReport(ticket);

        // Send email
        const mailOptions = {
            from: process.env.SMTP_FROM || 'LA BODEGA DEL COMPUTADOR <noreply@labodega.com>',
            to: req.body.email || ticket.clientEmail,
            subject: `Reporte de Servicio #${ticket.id} - LA BODEGA DEL COMPUTADOR`,
            html: htmlReport
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

    db.get('SELECT * FROM tickets WHERE id = ?', [ticketId], (err, ticket) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        if (!ticket) {
            res.status(404).json({ error: 'Ticket no encontrado' });
            return;
        }

        const htmlReport = generateCustomerReport(ticket);
        res.setHeader('Content-Type', 'text/html');
        res.send(htmlReport);
    });
};
