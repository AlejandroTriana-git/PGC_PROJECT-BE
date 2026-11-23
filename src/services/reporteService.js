import PDFDocument from 'pdfkit';
import * as pgcService from './pgcService.js';

// Mismo formato corporativo (nombre y color institucional) que se usa en los correos
const NOMBRE_INSTITUCION = 'Universidad de Cundinamarca — Gestión de PGC';
const COLOR_PRIMARIO = '#00482B';

//filas que se dibujan por cada bloque de conteos (etiqueta visible + llave del objeto de datos)
const FILAS_CONTEO = [
    ['Total de propuestas', 'total_propuestas'],
    ['Pendientes de validación', 'pendientes'],
    ['Aprobadas', 'aprobadas'],
    ['Rechazadas', 'rechazadas'],
    ['Anuladas (3 rechazos)', 'anuladas'],
    ['PGC registrados', 'pgc_registrados'],
    ['PGC en proceso', 'en_proceso'],
    ['PGC terminados', 'terminados']
];

//esta funcion dibuja el encabezado corporativo al inicio del PDF
const dibujarEncabezado = (doc, subtitulo) => {
    doc
        .fillColor(COLOR_PRIMARIO)
        .fontSize(16)
        .text(NOMBRE_INSTITUCION)
        .moveDown(0.2)
        .fontSize(12)
        .fillColor('#000000')
        .text(subtitulo)
        .moveDown(0.2)
        .fontSize(9)
        .fillColor('#555555')
        .text(`Generado el ${new Date().toLocaleString('es-CO')}`)
        .moveDown(1);

    doc.strokeColor(COLOR_PRIMARIO).lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(0.8);
};

//esta funcion dibuja el bloque de filas "etiqueta: valor" para un conjunto de conteos
//tituloBloque es opcional, se usa para separar cada ciclo en el informe por ciclos
const dibujarBloqueConteo = (doc, conteo, tituloBloque) => {
    //salto de pagina si no queda espacio para el bloque completo
    if (doc.y > 650) {
        doc.addPage();
    }

    if (tituloBloque) {
        doc.fontSize(12).fillColor(COLOR_PRIMARIO).text(tituloBloque).moveDown(0.3);
    }

    doc.fontSize(10).fillColor('#000000');
    FILAS_CONTEO.forEach(([etiqueta, llave], i) => {
        const y = doc.y;
        if (i % 2 === 0) {
            doc.rect(40, y - 2, 515, 16).fill('#f2f4f7');
        }
        doc.fillColor('#000000');
        doc.text(etiqueta, 50, y, { width: 300 });
        doc.text(String(conteo[llave]), 400, y, { width: 100 });
        doc.y = y + 16;
    });

    doc.moveDown(1);
};

// ============================================
// Informe general de avance (todos los ciclos combinados) — issue #132
// ============================================
export const generarInformeAvanceGeneralPdf = async () => {
    const totales = await pgcService.obtenerInformeAvanceGeneral();

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks = [];

    return new Promise((resolve, reject) => {
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        dibujarEncabezado(doc, 'Informe general de avance de PGC');
        dibujarBloqueConteo(doc, totales);

        doc.end();
    });
};

// ============================================
// Informe de avance por ciclos (una seccion por cada ciclo) — issue #132
// ============================================
export const generarInformeAvancePorCiclosPdf = async () => {
    const porCiclo = await pgcService.obtenerInformeAvancePorCiclos();

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks = [];

    return new Promise((resolve, reject) => {
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        dibujarEncabezado(doc, 'Informe de avance de PGC por ciclo');

        if (porCiclo.length === 0) {
            doc.fillColor('#555555').fontSize(10).text('No hay ciclos registrados.', 40, doc.y + 10);
        }

        porCiclo.forEach((ciclo) => {
            dibujarBloqueConteo(doc, ciclo, ciclo.name_cycle);
        });

        doc.end();
    });
};
