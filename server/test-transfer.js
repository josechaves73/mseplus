import pool from './db.js';

async function testTransfer() {
  try {
    // Buscar un registro válido en materiales_proceso
    const [rows] = await pool.query(
      'SELECT boleta, codigo, tipo, ebodega FROM materiales_proceso WHERE ebodega > 0 LIMIT 1'
    );

    if (rows.length === 0) {
      console.log('No se encontraron registros con ebodega > 0');
      return;
    }

    const testRow = rows[0];
    console.log('Registro de prueba encontrado:', testRow);

    // Simular una transferencia pequeña
    const testData = {
      boleta: testRow.boleta,
      codigo: testRow.codigo,
      tipo: testRow.tipo, // Tipo original de la boleta
      tipoTransaAr: 'De Bodega a Proceso', // Tipo descriptivo para transa_ar
      fromField: 'ebodega',
      toField: 'eproceso',
      cantidad: 0.1, // Cantidad pequeña para prueba
      manifiestoNumber: null,
      fechaMovimiento: '2025-09-28'
    };

    console.log('Datos de prueba:', testData);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testTransfer();