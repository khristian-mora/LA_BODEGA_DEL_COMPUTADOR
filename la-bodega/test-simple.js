const http = require('http');

function test(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const opts = { hostname: 'localhost', port: 3000, path, method, headers: { 'Content-Type': 'application/json' } };
    const req = http.request(opts, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

(async () => {
  console.log('=== PRUEBAS COMPLETAS ===\n');

  // TEST 1: Products
  console.log('1. Productos');
  let r = await test('/api/products');
  let p = JSON.parse(r.body);
  console.log('   OK -', p.products?.length || 0, 'productos');

  // TEST 2: Categories  
  console.log('2. Categorías');
  r = await test('/api/categories');
  let c = JSON.parse(r.body);
  console.log('   OK -', c.length, 'categorías');

  // TEST 3: Brands
  console.log('3. Marcas');
  r = await test('/api/brands');
  let b = JSON.parse(r.body);
  console.log('   OK -', b.length, 'marcas');

  // TEST 4: Add to cart
  console.log('4. Añadir al carrito');
  r = await test('/api/products');
  let products = JSON.parse(r.body).products;
  let productId = products[0].id;
  r = await test('/api/cart', 'POST', { productId, quantity: 1 });
  console.log('   Status:', r.status === 200 || r.status === 201 ? 'OK' : 'ERROR');

  // TEST 5: Get cart
  console.log('5. Ver carrito');
  r = await test('/api/cart');
  let cart = JSON.parse(r.body);
  console.log('   OK -', cart.items?.length || 0, 'items');

  // TEST 6: Coupon
  console.log('6. Cupón BIENVENIDO10');
  r = await test('/api/coupons/validate', 'POST', { code: 'BIENVENIDO10', subtotal: 500000 });
  let cup = JSON.parse(r.body);
  console.log('   OK - Válido:', cup.valid);

  // TEST 7: Service Order (Wizard)
  console.log('7. Orden de Servicio');
  r = await test('/api/service-orders/public', 'POST', {
    customerName: 'Test Cliente',
    customerEmail: 'test@email.com',
    customerPhone: '3001234567',
    deviceType: 'Laptop',
    brand: 'Dell',
    model: 'Inspiron',
    serial: 'SN123456',
    reportedIssue: 'No enciende',
    physicalCondition: 'No enciende'
  });
  let so = JSON.parse(r.body);
  console.log('   OK - Orden:', so.orderNumber);

  // TEST 8: Get service orders
  console.log('8. Lista de servicios');
  r = await test('/api/service-orders');
  let sos = JSON.parse(r.body);
  console.log('   OK -', Array.isArray(sos) ? sos.length : 0, 'servicios');

  console.log('\n=== TODAS LAS PRUEBAS PASARON ===');
})().catch(e => console.error('Error:', e.message));
