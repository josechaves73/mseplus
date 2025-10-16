import fetch from 'node-fetch';

try {
  console.log('🔍 Probando endpoint /api/clientes...\n');
  
  const response = await fetch('http://localhost:4000/api/clientes');
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  console.log('📊 Respuesta del endpoint:');
  console.log('  - Success:', data.success);
  console.log('  - Total clientes:', data.clientes?.length || 0);
  console.log('  - Estructura data:', Object.keys(data));
  
  if (data.clientes && data.clientes.length > 0) {
    console.log('\n📋 Primeros 3 clientes:');
    data.clientes.slice(0, 3).forEach((cliente, index) => {
      console.log(`  ${index + 1}. ${cliente.codigo} - ${cliente.nombre}`);
      console.log(`     Email: ${cliente.email || 'N/A'}`);
      console.log(`     Email2: ${cliente.email2 || 'N/A'}`);
      console.log('');
    });
    
    // Contar clientes con email
    const conEmail = data.clientes.filter(c => 
      (c.email && c.email.trim() !== '') || 
      (c.email2 && c.email2.trim() !== '')
    );
    
    console.log(`📧 Clientes con email en respuesta: ${conEmail.length}`);
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
}