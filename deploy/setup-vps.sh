#!/bin/bash
# Script de Configuración Automática VPS - LA BODEGA DEL COMPUTADOR
# Ejecutar como root en Ubuntu 22.04

set -e  # Detener si hay errores

echo "================================================"
echo "  CONFIGURACIÓN VPS - LA BODEGA DEL COMPUTADOR"
echo "================================================"
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Actualizar sistema
echo -e "${BLUE}[1/8] Actualizando sistema...${NC}"
apt update && apt upgrade -y

# 2. Instalar utilidades básicas
echo -e "${BLUE}[2/8] Instalando utilidades...${NC}"
apt install -y curl wget git vim ufw

# 3. Configurar Firewall
echo -e "${BLUE}[3/8] Configurando firewall...${NC}"
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw --force enable

# 4. Instalar Node.js 20
echo -e "${BLUE}[4/8] Instalando Node.js 20...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verificar instalación
node --version
npm --version

# 5. Instalar Nginx
echo -e "${BLUE}[5/8] Instalando Nginx...${NC}"
apt install -y nginx
systemctl start nginx
systemctl enable nginx

# 6. Instalar PM2
echo -e "${BLUE}[6/8] Instalando PM2...${NC}"
npm install -g pm2

# Configurar PM2 para auto-inicio
pm2 startup systemd -u root --hp /root
env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root

# 7. Instalar Certbot (SSL)
echo -e "${BLUE}[7/8] Instalando Certbot...${NC}"
apt install -y certbot python3-certbot-nginx

# 8. Crear estructura de directorios
echo -e "${BLUE}[8/8] Creando estructura de directorios...${NC}"
mkdir -p /var/www/la-bodega
mkdir -p /var/www/la-bodega/backups
mkdir -p /var/www/la-bodega/logs

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}  ✅ CONFIGURACIÓN COMPLETADA${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "Siguiente paso: Subir tu código al servidor"
echo ""
echo "Información del sistema:"
echo "  - Node.js: $(node --version)"
echo "  - npm: $(npm --version)"
echo "  - Nginx: $(nginx -v 2>&1)"
echo "  - PM2: $(pm2 --version)"
echo ""
echo "Puertos abiertos:"
echo "  - 22 (SSH)"
echo "  - 80 (HTTP)"
echo "  - 443 (HTTPS)"
echo ""
