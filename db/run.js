// db/run.js
import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB_NAME = process.env.DB_NAME;

const DB_CONFIG = {
    host:     process.env.DB_HOST     ,
    port:     Number(process.env.DB_PORT),
    user:     process.env.DB_USER   ,
    password: process.env.DB_PASSWORD ,
    
};

const STEPS = [
    { label: 'schema',   dir: '.',          files: ['schema.sql'] },
    { label: 'seed',     dir: '.',          files: ['seed.sql']   },
    { label: 'sp',       dir: 'sp'                                },
    { label: 'triggers', dir: 'triggers'                          }
];

function log(msg)  { console.log(msg); }
function ok(msg)   { console.log(`   ✅ ${msg}`); }
function fail(msg) { console.error(`   ❌ ${msg}`); }

// ---------------------------------------------------------------
// Quita el comentario inline (-- ... o # ...) de una línea,
// respetando los strings (para no romper un 'hola -- mundo').
// ---------------------------------------------------------------
function stripLineComment(line) {
    let inString = false;
    let quoteChar = null;

    for (let i = 0; i < line.length; i++) {
        const c = line[i];

        if (inString) {
            if (c === '\\' && quoteChar !== '`') { i++; continue; }  // escape
            if (c === quoteChar) { inString = false; quoteChar = null; }
            continue;
        }

        if (c === "'" || c === '"' || c === '`') {
            inString = true;
            quoteChar = c;
            continue;
        }

        // MySQL exige espacio (o EOL) después de "--" para ser comentario
        if (c === '-' && line[i + 1] === '-') {
            const after = line[i + 2];
            if (after === undefined || after === ' ' || after === '\t') {
                return line.slice(0, i);
            }
        }

        if (c === '#') {
            return line.slice(0, i);
        }
    }

    return line;
}

// ---------------------------------------------------------------
// Parser: divide un archivo .sql en statements individuales
// respetando la directiva DELIMITER.
// ---------------------------------------------------------------
function parseSqlStatements(content) {
    const statements = [];
    let currentDelim = ';';
    let buffer = '';

    const lines = content.split(/\r?\n/);

    for (const rawLine of lines) {
        // DELIMITER se detecta ANTES de strip comentarios
        const delimMatch = rawLine.match(/^\s*DELIMITER\s+(\S+)\s*$/i);

        if (delimMatch) {
            const trimmed = buffer.trim();
            if (trimmed) {
                statements.push(trimmed);
                buffer = '';
            }
            currentDelim = delimMatch[1];
            continue;
        }

        // Strip del comentario inline en cada línea
        const line = stripLineComment(rawLine);
        buffer += line + '\n';

        // ¿El buffer ya termina con el delimitador actual?
        const trimmedEnd = buffer.trimEnd();
        if (trimmedEnd.endsWith(currentDelim)) {
            const stmt = trimmedEnd.slice(0, -currentDelim.length).trim();
            if (stmt) statements.push(stmt);
            buffer = '';
        }
    }

    const tail = buffer.trim();
    if (tail) statements.push(tail);

    return statements;
}

// ---------------------------------------------------------------
// Ejecutar un archivo .sql: leer, parsear, ejecutar cada statement
// ---------------------------------------------------------------
async function runSqlFile(conn, relativePath) {
    const fullPath = path.join(__dirname, relativePath);
    const raw = await fs.readFile(fullPath, 'utf8');

    const statements = parseSqlStatements(raw);

    if (statements.length === 0) {
        log(`   ⏭️  ${relativePath} (vacío)`);
        return;
    }

    for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        try {
            await conn.query(stmt);
        } catch (error) {
            fail(`${relativePath} (statement ${i + 1}/${statements.length}): ${error.message}`);
            console.error(`      SQL: ${stmt.slice(0, 250).replace(/\s+/g, ' ')}...`);
            throw error;
        }
    }

    ok(`${relativePath} (${statements.length} statements)`);
}

async function listSqlFiles(subdir) {
    const full = path.join(__dirname, subdir);
    const entries = await fs.readdir(full);
    return entries
        .filter(f => f.endsWith('.sql'))
        .sort()
        .map(f => path.join(subdir, f));
}

// ---------------------------------------------------------------
// Main
// ---------------------------------------------------------------
async function main() {
    const onlyFlag = process.argv.find(a => a.startsWith('--only='));
    const only = onlyFlag ? onlyFlag.split('=')[1] : null;

    log(`\n🚀 Iniciando setup de BD: ${DB_NAME}`);
    if (only) log(`   (modo --only=${only})`);

    let conn;
    try {
        conn = await mysql.createConnection(DB_CONFIG);
    } catch (error) {
        console.error(`\n❌ No se pudo conectar a MySQL (${DB_CONFIG.host}:${DB_CONFIG.port}):`);
        console.error(`   ${error.message}`);
        process.exit(1);
    }

    try {
        if (!only) {
            log(`\n🗑️  Dropeando base de datos "${DB_NAME}" si existe...`);
            await conn.query(`DROP DATABASE IF EXISTS \`${DB_NAME}\``);

            log(`📦 Creando base de datos "${DB_NAME}"...`);
            await conn.query(
                `CREATE DATABASE \`${DB_NAME}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`
            );
        }

        await conn.query(`USE \`${DB_NAME}\``);

        for (const step of STEPS) {
            if (only && step.label !== only) continue;

            log(`\n📂 ${step.label}`);

            const files = step.files
                ? step.files.map(f => path.join(step.dir, f))
                : await listSqlFiles(step.dir);

            if (files.length === 0) {
                log(`   (sin archivos .sql)`);
                continue;
            }

            for (const f of files) {
                await runSqlFile(conn, f);
            }
        }

        log(`\n✨ Base de datos lista.\n`);
    } catch (error) {
        console.error(`\n💥 Setup abortado: ${error.message}\n`);
        process.exit(1);
    } finally {
        await conn.end();
    }
}

main();