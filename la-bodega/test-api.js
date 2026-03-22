const http = require('http');

function makeRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function test() {
  console.log('\n🧪 TEST 1: Get Products');
  try {
    const products = await makeRequest('/api/products');
    console.log(`   ✅ Products found: ${products.products?.length || 0}`);
    if (products.products?.[0]) {
      console.log(`   ✅ First product: ${products.products[0].name}`);
      console.log(`   ✅ Price: $${products.products[0].price}`);
      console.log(`   ✅ Stock: ${products.products[0].stock}`);
      console.log(`   ✅ Status: ${products.products[0].status}`);
    }
  } catch (e) {
    console.log(`   ❌ Error: ${e.message}`);
  }

  console.log('\n🧪 TEST 2: Get Categories');
  try {
    const categories = await makeRequest('/api/categories');
    console.log(`   ✅ Categories found: ${categories.length || 0}`);
    categories.forEach(c => console.log(`   - ${c.name} (${c.slug})`));
  } catch (e) {
    console.log(`   ❌ Error: ${e.message}`);
  }

  console.log('\n🧪 TEST 3: Get Brands');
  try {
    const brands = await makeRequest('/api/brands');
    console.log(`   ✅ Brands found: ${brands.length || 0}`);
    brands.forEach(b => console.log(`   - ${b.name}`));
  } catch (e) {
    console.log(`   ❌ Error: ${e.message}`);
  }

  console.log('\n🧪 TEST 4: Validate Coupon');
  try {
    const coupon = await makeRequest('/api/coupons/validate', 'POST', { code: 'BIENVENIDO10', subtotal: 500000 });
    console.log(`   ✅ Coupon valid: ${coupon.valid}`);
    if (coupon.valid) {
      console.log(`   ✅ Discount: ${coupon.discount}%`);
    }
  } catch (e) {
    console.log(`   ❌ Error: ${e.message}`);
  }

  console.log('\n🧪 TEST 5: Create Service Order (Public API)');
  try {
    const serviceOrder = await makeRequest('/api/service-orders/public', 'POST', {
      customerName: 'Juan Pérez',
      customerEmail: 'juan@test.com',
      customerPhone: '3001234567',
      customerIdNumber: '12345678',
      deviceType: 'Laptop',
      brand: 'Dell',
      model: 'Inspiron 15',
      serial: 'ABC123',
      reportedIssue: 'No enciende, parece problema de alimentación',
      physicalCondition: 'No enciende',
      createAccount: true,
    });
    console.log(`   ✅ Service order created: ${serviceOrder.orderNumber}`);
    console.log(`   ✅ User linked: ${serviceOrder.userLinked}`);
    console.log(`   ✅ New user created: ${serviceOrder.isNewUser}`);
  } catch (e) {
    console.log(`   ❌ Error: ${e.message}`);
  }

  console.log('\n🎉 All tests completed!');
}

test().catch(console.error);
