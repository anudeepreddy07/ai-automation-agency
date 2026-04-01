const http = require('http');

const runTest = (path, body) => {
  return new Promise((resolve) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        console.log(`[${path}] Status: ${res.statusCode} -> ${responseBody}`);
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error(`[${path}] Problem running test: Is your backend server running? -> ${e.message}`);
      resolve();
    });

    req.write(data);
    req.end();
  });
};

async function runAll() {
  console.log('====================================');
  console.log('  Testing API Endpoints');
  console.log('====================================\n');

  console.log('1. Testing /api/audit-request endpoint...');
  await runTest('/api/audit-request', { email: 'test@example.com' });

  console.log('\n2. Testing /api/checkout endpoint...');
  await runTest('/api/checkout', { plan: 'Medium', price: 499 });

  console.log('\n3. Testing /api/track-click endpoint...');
  await runTest('/api/track-click', { element: 'button.CTA', text: 'Start Trial', timestamp: new Date().toISOString() });

  console.log('\n====================================');
  console.log('Tests finished!');
  console.log('If you saw Status: 200, open `server/database.xlsx` to verify the data was saved correctly.');
  console.log('====================================');
}

runAll();
