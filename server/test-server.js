import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// Ruta de prueba simple
app.get('/api', (req, res) => {
  res.json({ message: 'API funcionando correctamente' });
});

// Endpoint simple para artículos (sin base de datos)
app.post('/api/articulos', (req, res) => {
  const { codigo, descri, unidad, familia, categoria } = req.body;
  
  if (!codigo || !descri) {
    return res.status(400).json({ error: 'Los campos código y descripción son requeridos' });
  }
  
  res.json({
    id: 1,
    codigo,
    descri,
    unidad,
    familia,
    categoria,
    message: 'Artículo guardado correctamente (modo prueba)'
  });
});

// Endpoint GET para obtener artículos (datos de prueba)
app.get('/api/articulos', (req, res) => {
  const articulos = [
    { codigo: 'LH', descri: 'LODOS DE HIDROCARBUROS' },
    { codigo: 'AR', descri: 'AGUAS RESIDUALES' },
    { codigo: 'ACU', descri: 'ACEITE USADO' },
    { codigo: 'SR', descri: 'SOLVENTE RESIDUAL' },
    { codigo: 'PP', descri: 'PLÁSTICO PARA CO-PROCESO' },
    { codigo: 'Ct', descri: 'CARTÓN PARA CO-PROCESO' },
    { codigo: 'Tc', descri: 'TOALLAS CONTAMINADAS' },
    { codigo: 'Pq', descri: 'PAPEL, CARTÓN, PLÁSTICO MEZCLADO CONTAMINADO' },
    { codigo: 'BT001', descri: 'BATERÍAS ÁCIDAS USADAS' },
    { codigo: 'RP002', descri: 'RESIDUOS PELIGROSOS VARIOS' },
    { codigo: 'AC003', descri: 'ACEITES LUBRICANTES USADOS' },
    { codigo: 'QU004', descri: 'QUÍMICOS VENCIDOS' },
    { codigo: 'MT005', descri: 'MATERIAL TEXTIL CONTAMINADO' }
  ];
  
  res.json(articulos);
});

app.listen(PORT, () => {
  console.log(`Servidor de prueba escuchando en http://localhost:${PORT}`);
});
