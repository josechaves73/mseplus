const fetch = require('node-fetch');

async function run() {
  const base = 'http://localhost:4000/api';

  // Test data: same numero, two different tipos
  const numero = 'TEST1234';
  const tipoA = 'TIPO_A';
  const tipoB = 'TIPO_B';

  // cleanup any existing test records (best-effort)
  try {
    await fetch(`${base}/boletas/${numero}`, { method: 'DELETE' });
  } catch (e) {}

  // Insert first boleta with tipoA
  let res = await fetch(`${base}/boletas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ numero, fecha: '2025-09-13', chofer: 'N/A', estado: 'CREADA', tipo: tipoA })
  });
  console.log('Insert tipoA status:', res.status);
  console.log(await res.text());

  // Try insert with same numero but tipoB
  res = await fetch(`${base}/boletas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ numero, fecha: '2025-09-13', chofer: 'N/A', estado: 'CREADA', tipo: tipoB })
  });
  console.log('Insert tipoB status:', res.status);
  console.log(await res.text());

  // Try insert with same numero and tipoA again (should be blocked)
  res = await fetch(`${base}/boletas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ numero, fecha: '2025-09-13', chofer: 'N/A', estado: 'CREADA', tipo: tipoA })
  });
  console.log('Insert tipoA again status:', res.status);
  console.log(await res.text());
}

run().catch(err => console.error(err));
