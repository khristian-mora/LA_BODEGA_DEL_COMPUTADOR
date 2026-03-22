# 🔄 n8n Workflow Examples

Complete workflow configurations for n8n automation.

---

## 📱 Workflow 1: WhatsApp - Ticket Created

**Trigger:** Webhook receives `ticket.created` event

### Nodes:

1. **Webhook Trigger**
   - Method: POST
   - Path: `/webhook/ticket-created`
   - Authentication: Header Auth (`X-Webhook-Secret`)

2. **WhatsApp Business Cloud**
   - Phone Number: `{{$json.data.clientPhone}}`
   - Message Template:
```
Hola {{$json.data.clientName}} 👋

Recibimos tu equipo:
🖥️ {{$json.data.deviceType}} {{$json.data.brand}} {{$json.data.model}}

📋 Ticket: #{{$json.data.ticketId}}
💰 Costo estimado: ${{$json.data.estimatedCost}}
👨‍🔧 Técnico asignado: {{$json.data.technicianName}}

Te notificaremos cuando esté listo para recoger.

LA BODEGA DEL COMPUTADOR
```

3. **Log to Database** (opcional)
   - Store webhook event for audit

---

## 📦 Workflow 2: Backup Automático

**Trigger:** Schedule (Every 6 hours)

### Nodes:

1. **Schedule Trigger**
   - Interval: Every 6 hours
   - Start time: 00:00

2. **HTTP Request - Trigger Backup**
   - URL: `http://localhost:3000/webhooks/n8n/backup-trigger`
   - Method: POST
   - Headers: `X-Webhook-Secret: YOUR_SECRET`

3. **Execute Command - SQLite Backup**
   ```bash
   sqlite3 ./server/database.sqlite ".backup './backups/db-$(date +%Y%m%d-%H%M%S).sqlite'"
   ```

4. **Google Drive - Upload**
   - File: `{{$json.backupPath}}`
   - Folder: `LA BODEGA BACKUPS`
   - Keep last 30 versions

5. **IF Node - Check Success**
   - Condition: `{{$json.success}} === true`

6a. **Slack/Email - Success Notification**
   ```
   ✅ Backup completado exitosamente
   📅 Fecha: {{$now}}
   💾 Tamaño: {{$json.fileSize}}
   ```

6b. **Slack/Email - Failure Alert**
   ```
   ❌ ALERTA: Backup falló
   📅 Fecha: {{$now}}
   ⚠️ Error: {{$json.error}}
   ```

---

## 🔔 Workflow 3: Recordatorio de Citas

**Trigger:** Schedule (Daily at 8 AM)

### Nodes:

1. **Schedule Trigger**
   - Cron: `0 8 * * *` (8 AM daily)

2. **HTTP Request - Get Tomorrow's Appointments**
   - URL: `http://localhost:3000/webhooks/n8n/appointment-reminder`
   - Method: POST
   - Headers: `X-Webhook-Secret: YOUR_SECRET`

3. **Split In Batches**
   - Batch Size: 1 (process one at a time)

4. **WhatsApp Business Cloud**
   ```
   Hola {{$json.data.customerName}} 👋

   📅 Recordatorio de cita:
   🔧 Servicio: {{$json.data.serviceType}}
   ⏰ Fecha: {{$json.data.scheduledDate}}
   👨‍🔧 Técnico: {{$json.data.technicianName}}

   Te esperamos!
   LA BODEGA DEL COMPUTADOR
   ```

5. **Wait** - 2 seconds between messages

---

## ✅ Workflow 4: Equipo Listo para Entrega

**Trigger:** Webhook receives `ticket.ready` event

### Nodes:

1. **Webhook Trigger**
   - Path: `/webhook/ticket-ready`

2. **WhatsApp Business Cloud**
   ```
   Hola {{$json.data.clientName}} 🎉

   ¡Tu equipo está listo!

   🖥️ {{$json.data.deviceType}}
   💰 Costo final: ${{$json.data.finalCost}}
   📝 {{$json.data.repairSummary}}

   Puedes recogerlo en nuestro horario:
   🕐 Lunes a Viernes: 9am - 6pm
   🕐 Sábados: 9am - 2pm

   LA BODEGA DEL COMPUTADOR
   ```

3. **Wait** - 2 days

4. **WhatsApp - Encuesta de Satisfacción**
   ```
   Hola {{$json.data.clientName}}

   ¿Cómo fue tu experiencia con nosotros?

   Por favor califica de 1 a 5 ⭐:
   1️⃣ Muy insatisfecho
   2️⃣ Insatisfecho
   3️⃣ Neutral
   4️⃣ Satisfecho
   5️⃣ Muy satisfecho

   Responde con un número del 1 al 5
   ```

---

## 📊 Workflow 5: Reporte Semanal Automático

**Trigger:** Schedule (Monday 8 AM)

### Nodes:

1. **Schedule Trigger**
   - Cron: `0 8 * * 1` (Monday 8 AM)

2. **HTTP Request - Get Weekly Stats**
   - URL: `http://localhost:3000/api/reports/dashboard-stats`
   - Method: GET
   - Authentication: Bearer Token

3. **Function - Format Report**
   ```javascript
   const stats = $input.item.json;
   
   return {
     report: `
📊 REPORTE SEMANAL
Semana del ${new Date().toLocaleDateString()}

💰 Ingresos: $${stats.totalRevenue}
🎫 Tickets completados: ${stats.ticketsDelivered}
👥 Clientes nuevos: ${stats.newCustomers}
⭐ Calificación promedio: ${stats.avgRating}/5

📈 Tendencias:
${stats.trend > 0 ? '📈 En aumento' : '📉 En descenso'}
     `
   };
   ```

4. **Email - Send to Management**
   - To: `gerencia@labodega.com`
   - Subject: `Reporte Semanal - ${date}`
   - Body: `{{$json.report}}`

5. **Slack - Post to Channel**
   - Channel: `#reportes`
   - Message: `{{$json.report}}`

---

## ⚠️ Workflow 6: Inventario Bajo

**Trigger:** Schedule (Daily at 6 PM)

### Nodes:

1. **Schedule Trigger**
   - Cron: `0 18 * * *` (6 PM daily)

2. **HTTP Request - Check Inventory**
   - URL: `http://localhost:3000/webhooks/n8n/inventory-alert`
   - Method: POST

3. **IF - Has Low Stock Items**
   - Condition: `{{$json.data.totalProducts}} > 0`

4. **Function - Format Alert**
   ```javascript
   const products = $input.item.json.data.products;
   
   let message = '⚠️ ALERTA DE INVENTARIO BAJO\n\n';
   products.forEach(p => {
     message += `📦 ${p.name}\n`;
     message += `   Stock: ${p.stock} unidades\n`;
     message += `   Categoría: ${p.category}\n\n`;
   });
   
   return { message };
   ```

5. **Slack - Alert Channel**
   - Channel: `#compras`
   - Message: `{{$json.message}}`

6. **Email - Notify Purchasing**
   - To: `compras@labodega.com`
   - Subject: `⚠️ Productos con stock bajo`

---

## 🎯 Workflow 7: Garantía Próxima a Vencer

**Trigger:** Schedule (Weekly on Sunday)

### Nodes:

1. **Schedule Trigger**
   - Cron: `0 9 * * 0` (Sunday 9 AM)

2. **HTTP Request - Check Warranties**
   - URL: `http://localhost:3000/webhooks/n8n/warranty-expiring`
   - Method: POST

3. **Split In Batches**

4. **WhatsApp - Notify Customer**
   ```
   Hola {{$json.data.customerName}}

   ⚠️ Tu garantía está próxima a vencer:

   🖥️ {{$json.data.deviceType}}
   📅 Vence en: {{$json.data.daysRemaining}} días
   📆 Fecha límite: {{$json.data.endDate}}

   Si tienes algún problema, repórtalo antes de que venza.

   LA BODEGA DEL COMPUTADOR
   ```

---

## 🔧 Configuración General

### Variables de Entorno n8n

```env
# WhatsApp Business (Twilio ejemplo)
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Google Drive
GOOGLE_DRIVE_CLIENT_ID=xxxxx
GOOGLE_DRIVE_CLIENT_SECRET=xxxxx

# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxxxx

# Email
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=noreply@labodega.com
SMTP_PASS=xxxxx
```

### Credenciales en n8n

1. **WhatsApp Business API**
   - Type: Twilio API
   - Account SID: `${TWILIO_ACCOUNT_SID}`
   - Auth Token: `${TWILIO_AUTH_TOKEN}`

2. **Google Drive**
   - Type: OAuth2
   - Client ID: `${GOOGLE_DRIVE_CLIENT_ID}`
   - Client Secret: `${GOOGLE_DRIVE_CLIENT_SECRET}`

3. **Slack**
   - Type: Webhook
   - Webhook URL: `${SLACK_WEBHOOK_URL}`

---

## 📝 Notas de Implementación

### Orden de Implementación Recomendado:

1. ✅ **Workflow 2** - Backup (CRÍTICO)
2. ✅ **Workflow 1** - Ticket Created (ALTO IMPACTO)
3. ✅ **Workflow 4** - Ticket Ready (ALTO IMPACTO)
4. ✅ **Workflow 3** - Recordatorios de Citas
5. ✅ **Workflow 6** - Inventario Bajo
6. ✅ **Workflow 5** - Reporte Semanal
7. ✅ **Workflow 7** - Garantías

### Testing

Cada workflow debe probarse con datos de prueba antes de activarse en producción.

```bash
# Ejemplo: Probar webhook de ticket creado
curl -X POST http://localhost:3000/webhooks/n8n/ticket-created \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: YOUR_SECRET" \
  -d '{"ticketId": 1}'
```
