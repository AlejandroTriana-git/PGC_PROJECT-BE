import PDFDocument from 'pdfkit';
import * as pgcService from './pgcService.js';

// Mismo formato corporativo (nombre, color y logo institucional) que se usa en los correos
const NOMBRE_INSTITUCION = 'Universidad de Cundinamarca — Gestión de PGC';
const COLOR_PRIMARIO = '#00482B'; // verde institucional UDEC (igual al topbar de la plataforma)
const LOGO_URL = process.env.MAIL_LOGO_URL || 'https://pgcfe.vercel.app/assets/logos/ESCUDO BLANCO.png';

let logoEnCache = null; //se descarga una sola vez y se reutiliza en los siguientes PDF que se generen

//esta funcion descarga el logo institucional para dibujarlo en el PDF
//si falla (sin internet, URL caida, etc.) el PDF se genera igual, simplemente sin el logo
const obtenerLogoBuffer = async () => {
    if (logoEnCache) return logoEnCache;
    try {
        const respuesta = await fetch(LOGO_URL);
        if (!respuesta.ok) return null;
        logoEnCache = Buffer.from(await respuesta.arrayBuffer());
        return logoEnCache;
    } catch (error) {
        console.error('ERROR DESCARGANDO LOGO DEL REPORTE:', error);
        return null;
    }
};

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

//esta funcion dibuja el encabezado corporativo al inicio del PDF (logo + nombre + subtitulo + fecha)
//logo es el buffer de la imagen ya descargada (o null si no se pudo descargar)
const dibujarEncabezado = (doc, subtitulo, logo) => {
    const yInicio = doc.y;
    let huboLogo = false;

    //si el buffer descargado no es una imagen valida, pdfkit lanza una excepcion sincrona;
    //se atrapa aca para que el informe se genere igual, simplemente sin el logo
    if (logo) {
        try {
            doc.image(logo, 40, yInicio, { height: 36 });
            huboLogo = true;
        } catch (error) {
            console.error('ERROR DIBUJANDO LOGO DEL REPORTE:', error);
        }
    }

    const xTexto = huboLogo ? 85 : 40; //si se dibujo el logo, el texto arranca despues de el

    doc
        .fillColor(COLOR_PRIMARIO)
        .fontSize(16)
        .text(NOMBRE_INSTITUCION, xTexto, yInicio)
        .fontSize(12)
        .fillColor('#000000')
        .text(subtitulo, xTexto)
        .fontSize(9)
        .fillColor('#555555')
        .text(`Generado el ${new Date().toLocaleString('es-CO')}`, xTexto)
        .moveDown(1);

    //el logo y el texto pueden terminar a distinta altura; seguimos despues del que sea mas alto
    doc.y = Math.max(doc.y, yInicio + 36 + 10);

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
    const logo = await obtenerLogoBuffer();

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks = [];

    return new Promise((resolve, reject) => {
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        dibujarEncabezado(doc, 'Informe general de avance de PGC', logo);
        dibujarBloqueConteo(doc, totales);

        doc.end();
    });
};

// ============================================
// Informe de avance por ciclos (una seccion por cada ciclo) — issue #132
// ============================================
export const generarInformeAvancePorCiclosPdf = async () => {
    const porCiclo = await pgcService.obtenerInformeAvancePorCiclos();
    const logo = await obtenerLogoBuffer();

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks = [];

    return new Promise((resolve, reject) => {
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        dibujarEncabezado(doc, 'Informe de avance de PGC por ciclo', logo);

        if (porCiclo.length === 0) {
            doc.fillColor('#555555').fontSize(10).text('No hay ciclos registrados.', 40, doc.y + 10);
        }

        porCiclo.forEach((ciclo) => {
            dibujarBloqueConteo(doc, ciclo, ciclo.name_cycle);
        });

        doc.end();
    });
};