import fetch from 'node-fetch';

async function testRBAC() {
  const loginRes = await fetch('http://localhost:3000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@labodega.com', password: 'admin123' }) // default seedAdmin credentials usually
  });
  
  if (!loginRes.ok) {
     console.log("Admin login failed:", await loginRes.text());
     return;
  }
  const adminData = await loginRes.json();
  const adminToken = adminData.token;
  console.log("Admin logged in. Token:", adminToken.substring(0, 10) + "...");

  // Let's create a vendedor user
  const vendRes = await fetch('http://localhost:3000/api/employees', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
     body: JSON.stringify({ name: 'Vendedor Test', email: 'vendedor@test.com', password: 'password', role: 'vendedor', permissions: [] })
  });
  if (!vendRes.ok) {
      console.log("Failed to create vendedor (might exist):", await vendRes.text());
  }

  // Login as vendedor
  const loginVend = await fetch('http://localhost:3000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'vendedor@test.com', password: 'password' })
  });
  const vendData = await loginVend.json();
  const vendToken = vendData.token || vendData.tempToken;

  console.log("Testing PUT /api/tickets/1 with vendedor token...");
  const putTicket = await fetch('http://localhost:3000/api/tickets/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${vendToken}` },
      body: JSON.stringify({ status: 'En Reparación' })
  });
  console.log("Vendedor trying to update ticket:", putTicket.status); // Expect 200

  // Tech user testing orders
  const techRes = await fetch('http://localhost:3000/api/employees', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
     body: JSON.stringify({ name: 'Tech Test', email: 'tech@test.com', password: 'password', role: 'técnico', permissions: [] })
  });
  
  const loginTech = await fetch('http://localhost:3000/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'tech@test.com', password: 'password' })
  });
  const techData = await loginTech.json();
  const techToken = techData.token || techData.tempToken;

  console.log("Testing POST /api/categories with tech token...");
  const putCat = await fetch('http://localhost:3000/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${techToken}` },
      body: JSON.stringify({ name: 'Hack' })
  });
  console.log("Tech trying to access categories (admin only):", putCat.status); // Expect 403

}

testRBAC();
