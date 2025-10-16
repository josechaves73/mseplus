import pool from './db.js';

async function verificarYLimpiarConexiones() {
  try {
    console.log('🔍 Verificando conexiones MySQL activas...\n');

    // Ver procesos activos
    const [procesos] = await pool.query('SHOW PROCESSLIST');
    console.log(`📊 Total de procesos activos: ${procesos.length}\n`);
    console.table(procesos.map(p => ({
      Id: p.Id,
      Usuario: p.User,
      BD: p.db,
      Comando: p.Command,
      Tiempo: p.Time + 's',
      Estado: p.State
    })));

    // Matar procesos dormidos del usuario computac_mse_app
    console.log('\n🧹 Limpiando procesos dormidos...');
    let killed = 0;
    for (const proceso of procesos) {
      if (proceso.User === 'computac_mse_app' && proceso.Command === 'Sleep' && proceso.Time > 60) {
        try {
          await pool.query(`KILL ${proceso.Id}`);
          console.log(`✅ Proceso ${proceso.Id} terminado (dormido ${proceso.Time}s)`);
          killed++;
        } catch (e) {
          console.log(`⚠️ No se pudo terminar proceso ${proceso.Id}: ${e.message}`);
        }
      }
    }

    console.log(`\n✅ ${killed} procesos dormidos terminados`);

    // Verificar configuración de max_user_connections
    const [config] = await pool.query("SHOW VARIABLES LIKE 'max_user_connections'");
    console.log('\n⚙️ Configuración actual:');
    console.table(config);

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await pool.end();
    process.exit(1);
  }
}

verificarYLimpiarConexiones();
