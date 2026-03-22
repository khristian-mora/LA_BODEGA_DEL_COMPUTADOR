# Guía de Pruebas Completas - Sistema de Carga de Imágenes

## ✅ Estado del Sistema

**Servidores Activos:**
- ✅ Frontend: http://localhost:5173
- ✅ Backend: http://localhost:3000
- ✅ Base de Datos: SQLite conectada
- ✅ Email: Configurado (requiere credenciales SMTP)
- ✅ Uploads: Directorio creado con 1 imagen de prueba

---

## 🧪 Pruebas Manuales Requeridas

### 1. Prueba de Login Administrativo

**Objetivo:** Verificar que el sistema de autenticación funciona correctamente.

**Pasos:**
1. Abrir navegador en: http://localhost:5173
2. Hacer clic en "Admin" o "Login" en la navegación
3. Ingresar credenciales:
   - **Email:** `admin@labodega.com`
   - **Password:** `admin123`
4. Hacer clic en "Iniciar Sesión"

**Resultado Esperado:**
- ✅ Redirección al Dashboard administrativo
- ✅ Menú de navegación admin visible
- ✅ No hay errores en consola del navegador

**Verificación Adicional:**
- Abrir DevTools (F12) → Console
- No debe haber errores 404 o de CORS
- Token JWT debe estar guardado en localStorage

---

### 2. Prueba de Carga de Imágenes en Servicio Técnico

**Objetivo:** Verificar que se pueden subir fotos de evidencia en tickets de servicio.

**Pasos:**
1. Navegar a "Taller y Servicio Técnico"
2. Hacer clic en "Nuevo Ticket de Ingreso"
3. Llenar el formulario:
   - Cliente: Seleccionar o crear uno
   - Tipo de Dispositivo: Laptop
   - Marca: HP
   - Modelo: Pavilion
   - Descripción del problema: "Prueba de carga de imágenes"
4. Hacer clic en "Adjuntar Foto" o botón de cámara
5. Seleccionar una imagen de tu computador
6. Esperar a que se suba (debe aparecer preview)
7. Guardar el ticket

**Resultado Esperado:**
- ✅ Imagen se sube sin errores
- ✅ Preview de la imagen aparece inmediatamente
- ✅ Ticket se guarda con la imagen
- ✅ Al abrir el ticket, la imagen se muestra correctamente

**Verificación Técnica:**
- Abrir DevTools → Network
- Buscar petición a `/api/upload`
- Debe retornar status 200
- Response debe incluir `{"url": "/uploads/filename.jpg"}`
- Verificar que el archivo existe en `server/uploads/`

---

### 3. Prueba de Edición de Fotos de Productos

**Objetivo:** Verificar que se pueden editar imágenes de productos en el inventario.

**Pasos:**
1. Navegar a "Gestión de Inventario"
2. Hacer clic en el botón de editar (lápiz) de cualquier producto
3. En el modal que se abre, buscar el campo de imagen
4. Hacer clic en "Subir Imagen" o "Cambiar Imagen"
5. Seleccionar una nueva imagen
6. Esperar a que se suba (debe aparecer preview)
7. Hacer clic en "Guardar" o "Actualizar Producto"
8. Cerrar el modal
9. Verificar que la imagen del producto cambió en la lista

**Resultado Esperado:**
- ✅ Imagen se sube correctamente
- ✅ Preview se actualiza en el modal
- ✅ Producto se guarda con la nueva imagen
- ✅ La nueva imagen se muestra en la tarjeta del producto
- ✅ La imagen también se ve en la página de inicio (ecommerce)

**Verificación en Homepage:**
1. Ir a la página principal (http://localhost:5173)
2. Buscar el producto editado en "Productos Destacados"
3. Verificar que muestra la nueva imagen

---

### 4. Prueba de Visualización de Imágenes

**Objetivo:** Verificar que las imágenes se cargan correctamente desde el servidor.

**Pasos:**
1. Abrir DevTools → Network
2. Filtrar por "Img" o "Media"
3. Navegar por diferentes secciones:
   - Página de inicio (productos destacados)
   - Inventario (lista de productos)
   - Detalle de ticket (fotos de evidencia)
4. Observar las peticiones de imágenes

**Resultado Esperado:**
- ✅ Todas las imágenes cargan con status 200
- ✅ URLs de imágenes son:
  - En desarrollo: `http://localhost:3000/uploads/filename.jpg`
  - O rutas relativas: `/uploads/filename.jpg`
- ✅ No hay errores 404 en imágenes
- ✅ Las imágenes se muestran correctamente

---

### 5. Prueba de API Endpoints

**Objetivo:** Verificar que todos los endpoints usan las URLs correctas.

**Método 1: Usando DevTools**
1. Abrir DevTools → Network
2. Navegar por diferentes secciones del admin:
   - Dashboard
   - Usuarios
   - Clientes
   - Citas
   - Inventario
   - Servicio Técnico
3. Observar las peticiones

**Resultado Esperado:**
- ✅ Todas las peticiones van a `/api/...` (rutas relativas)
- ✅ No hay peticiones a `http://localhost:3000/api/...` (hardcoded)
- ✅ Todas retornan status 200 o 201 (éxito)
- ✅ No hay errores de CORS

**Método 2: Usando PowerShell**
```powershell
# Probar endpoint de productos
Invoke-WebRequest -Uri "http://localhost:3000/api/products" -Method GET

# Probar login
$body = @{
    email = "admin@labodega.com"
    password = "admin123"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

---

### 6. Prueba de Notificaciones por Email (Opcional)

**Prerequisito:** Debes haber configurado las credenciales SMTP en `.env`

**Pasos:**
1. Actualizar `.env` con:
   ```env
   SMTP_PASS=tu_contraseña_real_de_hostinger
   BUSINESS_PHONE=+57_tu_numero
   ```
2. Reiniciar el servidor backend:
   - Detener: Ctrl+C en la terminal del servidor
   - Iniciar: `npm run server`
3. Crear un ticket de servicio con email del cliente
4. Cambiar el estado del ticket a "DIAGNOSED"
5. Verificar que el cliente recibe un email

**Resultado Esperado:**
- ✅ Email se envía sin errores
- ✅ Cliente recibe notificación
- ✅ Email tiene formato correcto
- ✅ Incluye información del ticket

---

## 📋 Checklist de Verificación Final

Antes de desplegar a producción, verifica:

### Frontend
- [ ] Login funciona correctamente
- [ ] Todas las páginas admin cargan sin errores
- [ ] Imágenes se muestran en todos lados
- [ ] No hay errores en consola del navegador
- [ ] No hay peticiones a localhost hardcodeado

### Backend
- [ ] Servidor inicia sin errores
- [ ] Base de datos SQLite conecta correctamente
- [ ] Directorio `uploads/` existe y tiene permisos
- [ ] Endpoint `/api/upload` funciona
- [ ] Todos los endpoints responden correctamente

### Configuración
- [ ] Archivo `.env` existe
- [ ] `JWT_SECRET` está configurado (no es el default)
- [ ] Credenciales SMTP configuradas (si se usará email)
- [ ] `BUSINESS_PHONE` configurado

### Funcionalidad
- [ ] Subir imágenes en tickets funciona
- [ ] Editar imágenes de productos funciona
- [ ] Imágenes se visualizan correctamente
- [ ] Sistema funciona en desarrollo (localhost)

---

## 🚀 Preparación para Producción

### 1. Build de Producción

```bash
# En la raíz del proyecto
npm run build
```

**Resultado Esperado:**
- ✅ Build completa sin errores
- ✅ Carpeta `dist/` creada con archivos estáticos

### 2. Verificar Archivos para Deployment

Archivos que DEBEN ir al servidor:
```
✅ dist/                    (frontend compilado)
✅ server/                  (backend)
✅ .env                     (con credenciales reales)
✅ package.json
✅ node_modules/            (o instalar en servidor)
```

Archivos que NO deben ir:
```
❌ src/                     (código fuente frontend)
❌ .git/
❌ node_modules/ (si se instalarán en servidor)
❌ .env.example
```

### 3. Configuración en Servidor VPS

**Nginx debe servir:**
- Archivos estáticos desde `/dist`
- Proxy `/api` → `http://localhost:3000/api`
- Proxy `/uploads` → `http://localhost:3000/uploads`

**PM2 debe correr:**
```bash
pm2 start server/server.js --name "labodega-backend"
```

---

## 🐛 Troubleshooting

### Problema: Imágenes no cargan en producción

**Solución:**
1. Verificar que Nginx tiene configuración de proxy para `/uploads`
2. Verificar permisos de carpeta `uploads/` en servidor
3. Verificar que las URLs no tienen `localhost` hardcodeado

### Problema: Error 404 en API

**Solución:**
1. Verificar que backend está corriendo en puerto 3000
2. Verificar configuración de proxy en Nginx
3. Revisar logs del backend: `pm2 logs labodega-backend`

### Problema: Email no se envía

**Solución:**
1. Verificar credenciales SMTP en `.env`
2. Verificar que puerto 465 está abierto en firewall
3. Revisar logs del servidor para errores SMTP

---

## ✅ Confirmación de Pruebas

Una vez completadas todas las pruebas, confirma:

- [ ] ✅ Login funciona
- [ ] ✅ Subir imágenes en tickets funciona
- [ ] ✅ Editar imágenes de productos funciona
- [ ] ✅ Imágenes se visualizan correctamente
- [ ] ✅ API endpoints responden correctamente
- [ ] ✅ No hay errores en consola
- [ ] ✅ Sistema listo para producción

**Fecha de pruebas:** _________________  
**Probado por:** _________________  
**Resultado:** ☐ APROBADO  ☐ REQUIERE CORRECCIONES
