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
  console.log('=== PRUEBAS DE API ===\n');

  console.log('TEST 1: Products API');
  let r = await test('/api/products');
  console.log('Status:', r.status);
  let p = JSON.parse(r.body);
  console.log('Products:', p.products?.length || 0);
  if (p.products?.[0]) console.log('First:', p.products[0].name, '- $' + p.products[0].price);

  console.log('\nTEST 2: Categories');
  r = await test('/api/categories');
  console.log('Status:', r.status);
  let c = JSON.parse(r.body);
  console.log('Categories:', c.length);

  console.log('\nTEST 3: Brands');
  r = await test('/api/brands');
  console.log('Status:', r.status);
  let b = JSON.parse(r.body);
  console.log('Brands:', b.length);

  console.log('\nTEST 4: Coupon validation');
  r = await test('/api/coupons/validate', 'POST', { code: 'BIENVENIDO10', subtotal: 500000 });
  console.log('Status:', r.status);
  let cup = JSON.parse(r.body);
  console.log('Valid:', cup.valid, '- Discount:', cup.discount || cup.value);

  console.log('\nTEST 5: Service Order (Wizard)');
  r = await test('/api/service-orders/public', 'POST', {
    customerName: 'Carlos Test',
    customerEmail: 'carlos@test.com',
    customerPhone: '3005559999',
    deviceType: 'Laptop',
    brand: 'HP',
    model: 'Pavilion',
    serial: 'HP123456',
    reportedIssue: 'No enciende',
    physicalCondition: 'No enciende',
    createAccount: false
  });
  console.log('Status:', r.status);
  let so = JSON.parse(r.body);
  console.log('Order:', so.orderNumber || so.error);

  console.log('\n=== TESTS COMPLETED ===');
})().catch(e => console.error('Error:', e.message));
