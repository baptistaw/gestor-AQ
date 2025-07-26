import express, { json } from 'express';
import cors from 'cors';

// ============================================================================
// VERSIÓN MÍNIMA DE DEPURACIÓN
// ============================================================================
// Este es un servidor mínimo para confirmar que el entorno básico funciona.
// Una vez que se verifique que esto arranca sin el error '[Object: null prototype]',
// reintroduciremos progresivamente la lógica de la aplicación (Prisma, Gemini, etc.)
// para aislar exactamente qué parte está causando el fallo.

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware básico
app.use(cors());
app.use(json());

// Una única ruta de prueba para verificar que el servidor responde
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'success',
    message: '¡El servidor mínimo está funcionando correctamente! Podemos proceder.' 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor de prueba corriendo en http://localhost:${PORT}`);
  console.log(`Si ve este mensaje, el problema de arranque con Express ha sido superado.`);
  console.log(`El siguiente paso será reintroducir las conexiones a la base de datos y otros servicios.`);
});

// El código original completo se ha eliminado temporalmente para la depuración.
// Será restaurado pieza por pieza.