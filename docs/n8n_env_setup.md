# 🔐 n8n Integration - Environment Variables

Add these variables to your `.env` file to enable n8n integration.

---

## Required Variables

```env
# ==========================================
# n8n WEBHOOK CONFIGURATION
# ==========================================

# Secret key for webhook authentication
# Generate a strong random string for production
N8N_WEBHOOK_SECRET=change-me-to-a-strong-random-string

# n8n webhook URL (where n8n is listening)
# Default n8n runs on port 5678
N8N_WEBHOOK_URL=http://localhost:5678/webhook/la-bodega

# ==========================================
# WHATSAPP BUSINESS API (Twilio Example)
# ==========================================

# Get these from: https://console.twilio.com
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Alternative: WhatsApp Business Cloud API
# Get from: https://developers.facebook.com/apps
WHATSAPP_BUSINESS_ACCOUNT_ID=your_account_id
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token

# ==========================================
# GOOGLE DRIVE (For Backups)
# ==========================================

# Get from: https://console.cloud.google.com
GOOGLE_DRIVE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_DRIVE_CLIENT_SECRET=your_client_secret
GOOGLE_DRIVE_REFRESH_TOKEN=your_refresh_token

# Backup folder ID in Google Drive
GOOGLE_DRIVE_BACKUP_FOLDER_ID=folder_id_here

# ==========================================
# SLACK NOTIFICATIONS (Optional)
# ==========================================

# Get from: https://api.slack.com/apps
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
SLACK_REPORTS_CHANNEL=#reportes
SLACK_ALERTS_CHANNEL=#alertas

# ==========================================
# BUSINESS INFORMATION
# ==========================================

# Your business phone for notifications
BUSINESS_PHONE=+57 300 123 4567

# Business hours for automated messages
BUSINESS_HOURS_WEEKDAY=9am - 6pm
BUSINESS_HOURS_SATURDAY=9am - 2pm

# ==========================================
# BACKUP CONFIGURATION
# ==========================================

# How many backups to keep
BACKUP_RETENTION_DAYS=30

# Backup schedule (cron format)
BACKUP_SCHEDULE=0 */6 * * *  # Every 6 hours

```

---

## How to Generate Secrets

### N8N_WEBHOOK_SECRET

```bash
# Linux/Mac
openssl rand -hex 32

# Windows PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})

# Or use online generator
# https://www.random.org/strings/
```

---

## Service Setup Guides

### 1. Twilio WhatsApp Setup

1. Create account: https://www.twilio.com/try-twilio
2. Go to Console → Messaging → Try it out → Send a WhatsApp message
3. Follow sandbox setup instructions
4. Get your credentials:
   - Account SID
   - Auth Token
   - WhatsApp number (sandbox or approved number)

**Cost:** Free sandbox for testing, ~$0.005 per message in production

---

### 2. WhatsApp Business Cloud API (Free Alternative)

1. Create Meta Developer account: https://developers.facebook.com
2. Create new app → Business → WhatsApp
3. Add WhatsApp product
4. Get test number or request production access
5. Copy:
   - Phone Number ID
   - WhatsApp Business Account ID
   - Temporary Access Token (generate permanent one)

**Cost:** FREE (1000 conversations/month)

---

### 3. Google Drive API Setup

1. Go to: https://console.cloud.google.com
2. Create new project: "LA BODEGA Backups"
3. Enable Google Drive API
4. Create OAuth 2.0 credentials:
   - Application type: Desktop app
   - Download JSON
5. Use n8n Google Drive node to get refresh token

**Cost:** FREE (15GB storage)

---

### 4. Slack Setup (Optional)

1. Go to: https://api.slack.com/apps
2. Create New App → From scratch
3. Enable Incoming Webhooks
4. Add New Webhook to Workspace
5. Select channel (#reportes, #alertas)
6. Copy Webhook URL

**Cost:** FREE

---

## Testing Webhooks

### Test Ticket Created Webhook

```bash
curl -X POST http://localhost:3000/webhooks/n8n/ticket-created \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: your_secret_here" \
  -d '{
    "ticketId": 1
  }'
```

### Test Backup Trigger

```bash
curl -X POST http://localhost:3000/webhooks/n8n/backup-trigger \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: your_secret_here"
```

### Test Appointment Reminder

```bash
curl -X POST http://localhost:3000/webhooks/n8n/appointment-reminder \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: your_secret_here"
```

---

## Security Best Practices

1. **Never commit `.env` to git**
   ```bash
   # Add to .gitignore
   echo ".env" >> .gitignore
   ```

2. **Use different secrets for dev/production**

3. **Rotate secrets periodically** (every 90 days)

4. **Restrict webhook IPs** (if possible)

5. **Monitor webhook logs** for suspicious activity

---

## Example `.env` File

```env
# Copy this to .env and fill in your values

# n8n
N8N_WEBHOOK_SECRET=abc123xyz789
N8N_WEBHOOK_URL=http://localhost:5678/webhook/la-bodega

# WhatsApp (choose one)
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Google Drive
GOOGLE_DRIVE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_DRIVE_CLIENT_SECRET=xxxxx
GOOGLE_DRIVE_REFRESH_TOKEN=xxxxx

# Business
BUSINESS_PHONE=+57 300 123 4567

# Existing variables (keep these)
JWT_SECRET=your_jwt_secret
SMTP_HOST=smtp.hostinger.com
SMTP_USER=noreply@labodega.com
SMTP_PASS=your_password
```

---

## Troubleshooting

### Webhook not triggering

1. Check n8n is running: `http://localhost:5678`
2. Verify webhook secret matches
3. Check n8n workflow is activated
4. Review server logs for errors

### WhatsApp messages not sending

1. Verify Twilio credentials
2. Check phone number format: `+57 300 123 4567`
3. Ensure sandbox is active (for testing)
4. Review Twilio console logs

### Backups failing

1. Check Google Drive permissions
2. Verify refresh token is valid
3. Ensure backup directory exists
4. Check disk space

---

**Need help?** Check the full documentation in `docs/n8n_workflows.md`
