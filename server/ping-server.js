const http = require('http');

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api',
  method: 'GET',
  timeout: 3000
};

const req = http.request(options, res => {
  console.log('STATUS', res.statusCode);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('BODY', data));
});

req.on('error', err => console.error('ERROR', err.message));
req.on('timeout', () => { console.error('TIMEOUT'); req.destroy(); });
req.end();
