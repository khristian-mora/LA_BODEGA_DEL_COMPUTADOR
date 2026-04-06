require('dotenv').config({ path: __dirname + '/../.env' });
const jwt = require('jsonwebtoken');
const http = require('http');

const token = jwt.sign({ id: 1, name: 'Admin', role: 'admin' }, process.env.JWT_SECRET);
console.log('Token generated');

const postData = JSON.stringify({
  name: 'Prueba Cumpleanos',
  email: 'prueba@test.com',
  phone: '+573001112222',
  birthday: '1990-04-15'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/customers',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'Authorization': 'Bearer ' + token
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
  });
});

req.on('error', e => console.log('Error:', e.message));
req.write(postData);
req.end();
