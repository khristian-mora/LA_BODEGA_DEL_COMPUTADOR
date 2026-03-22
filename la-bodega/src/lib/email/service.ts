import nodemailer from 'nodemailer';
import prisma from '../prisma';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const from = process.env.SMTP_FROM || 'noreply@labodega.com';
const appName = process.env.NEXT_PUBLIC_APP_NAME || 'La Bodega del Computador';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function logEmail(recipient: string, subject: string, template: string, relatedId?: string, relatedType?: string) {
  await prisma.emailLog.create({
    data: {
      recipient,
      subject,
      template,
      relatedId,
      relatedType,
      status: 'PENDIENTE',
    },
  });
}

export async function sendEmail(to: string, subject: string, html: string, template: string, relatedId?: string, relatedType?: string) {
  try {
    await transporter.sendMail({
      from: `"${appName}" <${from}>`,
      to,
      subject,
      html,
    });

    await prisma.emailLog.create({
      data: {
        recipient: to,
        subject,
        template,
        relatedId,
        relatedType,
        status: 'ENVIADO',
        sentAt: new Date(),
      },
    });

    return true;
  } catch (error) {
    await prisma.emailLog.create({
      data: {
        recipient: to,
        subject,
        template,
        relatedId,
        relatedType,
        status: 'FALLIDO',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
    console.error('Email send error:', error);
    return false;
  }
}

const emailTemplates = {
  verification: (name: string, token: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verifica tu correo electrónico</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #0f172a; margin: 0; font-size: 28px;">${appName}</h1>
        </div>
        <h2 style="color: #1e293b; margin-top: 0;">¡Bienvenido!</h2>
        <p style="color: #475569; line-height: 1.6;">Hola <strong>${name}</strong>,</p>
        <p style="color: #475569; line-height: 1.6;">Gracias por registrarte en ${appName}. Por favor verifica tu correo electrónico haciendo clic en el siguiente botón:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${appUrl}/auth/verify?token=${token}" style="background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Verificar correo electrónico</a>
        </div>
        <p style="color: #94a3b8; font-size: 14px;">Si no creaste una cuenta, puedes ignorar este correo.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} ${appName}. Todos los derechos reservados.</p>
      </div>
    </body>
    </html>
  `,
  passwordReset: (name: string, token: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Recuperar contraseña</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #0f172a; margin: 0; font-size: 28px;">${appName}</h1>
        </div>
        <h2 style="color: #1e293b; margin-top: 0;">Recuperar contraseña</h2>
        <p style="color: #475569; line-height: 1.6;">Hola <strong>${name}</strong>,</p>
        <p style="color: #475569; line-height: 1.6;">Has solicitado recuperar tu contraseña. Haz clic en el siguiente botón para crear una nueva:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${appUrl}/auth/reset-password?token=${token}" style="background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Crear nueva contraseña</a>
        </div>
        <p style="color: #94a3b8; font-size: 14px;">Este enlace expirará en 1 hora.</p>
        <p style="color: #94a3b8; font-size: 14px;">Si no solicitaste esto, puedes ignorar este correo.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} ${appName}. Todos los derechos reservados.</p>
      </div>
    </body>
    </html>
  `,
  orderConfirmation: (order: any, items: any[], customerName: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmación de pedido</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #0f172a; margin: 0; font-size: 28px;">${appName}</h1>
        </div>
        <h2 style="color: #1e293b; margin-top: 0;">¡Pedido confirmado!</h2>
        <p style="color: #475569; line-height: 1.6;">Hola <strong>${customerName}</strong>,</p>
        <p style="color: #475569; line-height: 1.6;">Tu pedido ha sido confirmado. Aquí están los detalles:</p>
        <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 10px;"><strong>Número de orden:</strong> ${order.orderNumber}</p>
          <p style="margin: 0;"><strong>Total:</strong> $${Number(order.total).toLocaleString('es-CO')}</p>
        </div>
        <h3 style="color: #1e293b;">Productos:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 2px solid #e2e8f0;">
              <th style="text-align: left; padding: 10px 0; color: #475569;">Producto</th>
              <th style="text-align: center; padding: 10px 0; color: #475569;">Cant.</th>
              <th style="text-align: right; padding: 10px 0; color: #475569;">Precio</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(item => `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px 0; color: #1e293b;">${item.product?.name || 'Producto'}</td>
                <td style="text-align: center; padding: 12px 0; color: #1e293b;">${item.quantity}</td>
                <td style="text-align: right; padding: 12px 0; color: #1e293b;">$${Number(item.unitPrice).toLocaleString('es-CO')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} ${appName}. Todos los derechos reservados.</p>
      </div>
    </body>
    </html>
  `,
  orderStatusUpdate: (orderNumber: string, status: string, customerName: string) => {
    const statusMessages: Record<string, string> = {
      CONFIRMADO: 'Tu pedido ha sido confirmado y está siendo procesado.',
      ENVIADO: 'Tu pedido ha sido enviado. ¡En breve lo recibirás!',
      ENTREGADO: 'Tu pedido ha sido entregado. ¡Gracias por tu compra!',
      CANCELADO: 'Tu pedido ha sido cancelado.',
    };
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Actualización de pedido</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0f172a; margin: 0; font-size: 28px;">${appName}</h1>
          </div>
          <h2 style="color: #1e293b; margin-top: 0;">Estado de tu pedido actualizado</h2>
          <p style="color: #475569; line-height: 1.6;">Hola <strong>${customerName}</strong>,</p>
          <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 20px; margin: 20px 0;">
            <p style="margin: 0 0 10px;"><strong>Estado:</strong> ${status}</p>
            <p style="margin: 0; color: #475569;">${statusMessages[status] || 'El estado de tu pedido ha sido actualizado.'}</p>
          </div>
          <p style="color: #475569;">Número de orden: <strong>${orderNumber}</strong></p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${appUrl}/orders/${orderNumber}" style="background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Ver detalles del pedido</a>
          </div>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} ${appName}. Todos los derechos reservados.</p>
        </div>
      </body>
      </html>
    `;
  },
  serviceOrderCreated: (order: any) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Orden de servicio creada</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #0f172a; margin: 0; font-size: 28px;">${appName}</h1>
          <p style="color: #2563eb; margin: 10px 0 0;">Servicio Técnico</p>
        </div>
        <h2 style="color: #1e293b; margin-top: 0;">Equipo recibido</h2>
        <p style="color: #475569; line-height: 1.6;">Hola <strong>${order.customerName}</strong>,</p>
        <p style="color: #475569; line-height: 1.6;">Hemos recibido tu equipo para servicio técnico. Aquí están los detalles:</p>
        <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 10px;"><strong>Número de orden:</strong> ${order.orderNumber}</p>
          <p style="margin: 0 0 10px;"><strong>Equipo:</strong> ${order.brand} ${order.model}</p>
          <p style="margin: 0 0 10px;"><strong>Tipo:</strong> ${order.deviceType}</p>
          <p style="margin: 0;"><strong>Problema reportado:</strong> ${order.reportedIssue}</p>
        </div>
        <p style="color: #475569;">Te notificaremos cuando comience el diagnóstico de tu equipo.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} ${appName}. Todos los derechos reservados.</p>
      </div>
    </body>
    </html>
  `,
  serviceDiagnosis: (order: any) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Diagnóstico completado</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #0f172a; margin: 0; font-size: 28px;">${appName}</h1>
          <p style="color: #2563eb; margin: 10px 0 0;">Servicio Técnico</p>
        </div>
        <h2 style="color: #1e293b; margin-top: 0;">¡Diagnóstico completado!</h2>
        <p style="color: #475569; line-height: 1.6;">Hola <strong>${order.customerName}</strong>,</p>
        <p style="color: #475569; line-height: 1.6;">El diagnóstico de tu equipo ha sido completado. Por favor revisa el presupuesto:</p>
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0;">
          <h3 style="margin: 0 0 15px; color: #92400e;">Presupuesto</h3>
          <pre style="margin: 0; white-space: pre-wrap; font-family: inherit; color: #451a03;">${JSON.stringify(order.budgetJson, null, 2)}</pre>
        </div>
        <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="margin: 0 0 10px;"><strong>Diagnóstico:</strong></p>
          <p style="margin: 0; color: #475569;">${order.diagnosis}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${appUrl}/tecnico/orders/${order.orderNumber}/aprobar" style="background: #22c55e; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; margin-right: 10px;">Aprobar</a>
          <a href="${appUrl}/tecnico/orders/${order.orderNumber}/rechazar" style="background: #ef4444; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Rechazar</a>
        </div>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} ${appName}. Todos los derechos reservados.</p>
      </div>
    </body>
    </html>
  `,
  serviceStatusChange: (order: any, newStatus: string) => {
    const statusMessages: Record<string, { title: string; message: string }> = {
      EN_DIAGNOSTICO: {
        title: 'En diagnóstico',
        message: 'Nuestro equipo técnico ha iniciado el diagnóstico de tu equipo.',
      },
      EN_REPARACION: {
        title: 'En reparación',
        message: 'Tu equipo ha sido aprobado para reparación. Estamos trabajando en ello.',
      },
      LISTO_PARA_ENTREGA: {
        title: 'Listo para entrega',
        message: '¡Tu equipo ya está listo! Puedes pasar aRetrievarlo por nuestro local.',
      },
      ENTREGADO: {
        title: 'Entregado',
        message: 'Tu equipo ha sido entregado. ¡Gracias por confiar en nosotros!',
      },
      SIN_REPARACION: {
        title: 'Sin reparación',
        message: 'Lamentablemente no fue posible realizar la reparación.',
      },
    };
    const statusInfo = statusMessages[newStatus] || { title: newStatus, message: 'El estado de tu orden ha sido actualizado.' };
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${statusInfo.title}</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #0f172a; margin: 0; font-size: 28px;">${appName}</h1>
            <p style="color: #2563eb; margin: 10px 0 0;">Servicio Técnico</p>
          </div>
          <h2 style="color: #1e293b; margin-top: 0;">${statusInfo.title}</h2>
          <p style="color: #475569; line-height: 1.6;">Hola <strong>${order.customerName}</strong>,</p>
          <p style="color: #475569; line-height: 1.6;">${statusInfo.message}</p>
          <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="margin: 0 0 10px;"><strong>Número de orden:</strong> ${order.orderNumber}</p>
            <p style="margin: 0 0 10px;"><strong>Equipo:</strong> ${order.brand} ${order.model}</p>
            <p style="margin: 0;"><strong>Estado:</strong> ${newStatus.replace(/_/g, ' ')}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${appUrl}/tecnico/orders/${order.orderNumber}" style="background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">Ver detalles</a>
          </div>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} ${appName}. Todos los derechos reservados.</p>
        </div>
      </body>
      </html>
    `;
  },
};

export async function sendEmailVerification(email: string, name: string, token: string) {
  return sendEmail(
    email,
    'Verifica tu correo electrónico',
    emailTemplates.verification(name, token),
    'verification',
    token
  );
}

export async function sendPasswordReset(email: string, name: string, token: string) {
  return sendEmail(
    email,
    'Recuperar contraseña',
    emailTemplates.passwordReset(name, token),
    'password_reset',
    token
  );
}

export async function sendOrderConfirmation(order: any, items: any[], customerEmail: string, customerName: string) {
  return sendEmail(
    customerEmail,
    `Pedido ${order.orderNumber} confirmado`,
    emailTemplates.orderConfirmation(order, items, customerName),
    'order_confirmation',
    order.id
  );
}

export async function sendOrderStatusUpdate(orderNumber: string, status: string, customerEmail: string, customerName: string) {
  return sendEmail(
    customerEmail,
    `Estado de tu pedido ${orderNumber}`,
    emailTemplates.orderStatusUpdate(orderNumber, status, customerName),
    'order_status',
    orderNumber
  );
}

export async function sendServiceOrderCreated(order: any) {
  return sendEmail(
    order.customerEmail,
    `Orden de servicio ${order.orderNumber} - Equipo recibido`,
    emailTemplates.serviceOrderCreated(order),
    'service_created',
    order.id
  );
}

export async function sendServiceDiagnosis(order: any) {
  return sendEmail(
    order.customerEmail,
    `Presupuesto listo - Orden ${order.orderNumber}`,
    emailTemplates.serviceDiagnosis(order),
    'service_diagnosis',
    order.id
  );
}

export async function sendServiceStatusChange(order: any, newStatus: string) {
  const statusKey = newStatus.toLowerCase();
  const subjectMap: Record<string, string> = {
    recibido: 'Equipo recibido',
    en_diagnostico: 'Diagnóstico iniciado',
    pendiente_aprobacion: 'Presupuesto listo',
    en_reparacion: 'Reparación iniciada',
    listo_entrega: 'Listo para entrega',
    entregado: 'Equipo entregado',
    sin_reparacion: 'Sin reparación',
  };
  return sendEmail(
    order.customerEmail,
    `${subjectMap[statusKey] || 'Actualización'} - Orden ${order.orderNumber}`,
    emailTemplates.serviceStatusChange(order, newStatus),
    'service_status',
    order.id
  );
}
