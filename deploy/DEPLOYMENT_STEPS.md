# 🚀 Despliegue en VPS - Guía Paso a Paso

**IP del VPS:** `72.60.125.156`  
**Usuario:** `root`  
**Contraseña:** `[la que creaste]`

---

## 📋 Paso 1: Conectar al VPS (5 min)

### Desde Windows PowerShell:

```powershell
# Conectar por SSH
ssh root@72.60.125.156

# Te pedirá confirmar (escribe: yes)
# Luego ingresa tu contraseña
```

**Si te da error "ssh no reconocido":**
```powershell
# Instalar OpenSSH en Windows
Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
```

---

## 📦 Paso 2: Configurar VPS Automáticamente (10 min)

### Una vez conectado al VPS:

```bash
# Descargar script de configuración
curl -o setup-vps.sh https://raw.githubusercontent.com/[TU-REPO]/deploy/setup-vps.sh

# O crear el archivo manualmente:
nano setup-vps.sh
# Pegar el contenido del script y guardar (Ctrl+X, Y, Enter)

# Dar permisos de ejecución
chmod +x setup-vps.sh

# Ejecutar script
./setup-vps.sh
```

**El script instalará:**
- ✅ Node.js 20
- ✅ Nginx
- ✅ PM2
- ✅ Certbot (SSL)
- ✅ Firewall configurado

**Tiempo:** ~10 minutos

---

## 📤 Paso 3: Subir tu Código (15 min)

### Opción A: Usando Git (Recomendado)

**En tu PC local:**
```bash
# Crear repositorio en GitHub (si no lo has hecho)
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TU-USUARIO/la-bodega.git
git push -u origin main
```

**En el VPS:**
```bash
cd /var/www
git clone https://github.com/TU-USUARIO/la-bodega.git
cd la-bodega
npm install
```

### Opción B: Usando SCP (Alternativa)

**En tu PC local (PowerShell):**
```powershell
# Comprimir proyecto (excluyendo node_modules)
# Primero instala 7-Zip si no lo tienes

# Subir al VPS
scp -r "C:\Users\Usuario\Desktop\desarollo\LA BODEGA DEL COMPUTADOR" root@72.60.125.156:/var/www/la-bodega
```

**En el VPS:**
```bash
cd /var/www/la-bodega
npm install
```

---

## ⚙️ Paso 4: Configurar Variables de Entorno (5 min)

**En el VPS:**
```bash
cd /var/www/la-bodega
nano .env
```

**Contenido del .env:**
```env
# Base
NODE_ENV=production
PORT=3000
JWT_SECRET=genera_un_secret_muy_largo_y_aleatorio_aqui_123456789

# Email (Hostinger SMTP)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=noreply@tudominio.com
SMTP_PASS=tu_password_email
SMTP_FROM=noreply@tudominio.com

# n8n Cloud
N8N_WEBHOOK_URL=https://tu-cuenta.app.n8n.cloud/webhook/la-bodega
N8N_WEBHOOK_SECRET=otro_secret_muy_largo_123456789

# WhatsApp Business (configurar después)
WHATSAPP_BUSINESS_ACCOUNT_ID=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=

# Business Info
BUSINESS_PHONE=+57 300 123 4567
```

Guardar: `Ctrl+X`, `Y`, `Enter`

---

## 🏗️ Paso 5: Build y Deploy (10 min)

**En el VPS:**
```bash
cd /var/www/la-bodega

# Build frontend
npm run build

# Iniciar backend con PM2
pm2 start server/server.js --name "labodega-backend"

# Guardar configuración PM2
pm2 save

# Ver logs
pm2 logs labodega-backend

# Si todo está bien, deberías ver:
# [DB] Using SQLite database
# Server running on http://localhost:3000
```

---

## 🌐 Paso 6: Configurar Nginx (10 min)

**En el VPS:**
```bash
# Crear configuración
nano /etc/nginx/sites-available/labodega
```

**Contenido:**
```nginx
server {
    listen 80;
    server_name 72.60.125.156;

    # Frontend (React)
    location / {
        root /var/www/la-bodega/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Webhooks
    location /webhooks {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Uploads
    location /uploads {
        alias /var/www/la-bodega/server/uploads;
    }
}
```

**Activar configuración:**
```bash
# Crear symlink
ln -s /etc/nginx/sites-available/labodega /etc/nginx/sites-enabled/

# Eliminar default
rm /etc/nginx/sites-enabled/default

# Probar configuración
nginx -t

# Reiniciar Nginx
systemctl restart nginx
```

---

## ✅ Paso 7: Verificar que Funciona (5 min)

**Desde tu navegador:**
```
http://72.60.125.156
```

**Deberías ver:** Tu aplicación funcionando 🎉

**Probar API:**
```
http://72.60.125.156/api/products
```

**Deberías ver:** JSON con productos

---

## 🔐 Paso 8: Configurar SSL (Cuando tengas dominio)

**Cuando apuntes un dominio al VPS:**
```bash
# Obtener certificado SSL
certbot --nginx -d tudominio.com -d www.tudominio.com

# Seguir instrucciones
# Auto-renovación ya está configurada
```

---

## 🔄 Paso 9: Activar Webhooks n8n (Opcional)

**En el VPS:**
```bash
cd /var/www/la-bodega
nano server/server.js

# Buscar línea 486 y descomentar:
app.use('/webhooks', webhookRoutes);

# Guardar y reiniciar
pm2 restart labodega-backend
```

---

## 📊 Comandos Útiles

### Ver logs:
```bash
pm2 logs labodega-backend
```

### Reiniciar aplicación:
```bash
pm2 restart labodega-backend
```

### Ver estado:
```bash
pm2 status
```

### Actualizar código:
```bash
cd /var/www/la-bodega
git pull
npm install
npm run build
pm2 restart labodega-backend
```

### Ver logs de Nginx:
```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

---

## 🆘 Troubleshooting

### Error: "Cannot connect"
```bash
# Verificar que PM2 está corriendo
pm2 status

# Reiniciar
pm2 restart labodega-backend
```

### Error: "502 Bad Gateway"
```bash
# Verificar Nginx
systemctl status nginx

# Reiniciar
systemctl restart nginx
```

### Ver errores del backend:
```bash
pm2 logs labodega-backend --err
```

---

## ✅ Checklist Final

- [ ] VPS configurado (Node.js, Nginx, PM2)
- [ ] Código subido al servidor
- [ ] Variables de entorno configuradas
- [ ] Frontend compilado (npm run build)
- [ ] Backend corriendo con PM2
- [ ] Nginx configurado y funcionando
- [ ] Aplicación accesible desde http://72.60.125.156
- [ ] Login funcionando con admin@labodega.com
- [ ] Webhooks activados (opcional)

---

## 🎯 Próximos Pasos

1. **Configurar dominio** (ej: labodega.com)
2. **Activar SSL/HTTPS**
3. **Configurar n8n Cloud**
4. **Configurar WhatsApp Business**
5. **Configurar backups automáticos**

---

**¿Listo para empezar?** 🚀

Conéctate al VPS con:
```bash
ssh root@72.60.125.156
```
