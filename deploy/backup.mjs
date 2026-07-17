#!/usr/bin/env node
/**
 * Sauvegarde automatique de la base Pulsar.
 *
 * Utilise « VACUUM INTO », la méthode officielle de SQLite : elle produit une
 * copie cohérente et compacte même si des messages sont écrits pendant la
 * sauvegarde. Un simple « cp » ne le garantirait pas.
 *
 * La copie est compressée, puis les sauvegardes plus vieilles que
 * PULSAR_BACKUP_KEEP nuits sont supprimées.
 *
 * Usage : node deploy/backup.js
 */
import { DatabaseSync } from 'node:sqlite';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, readdir, rm, stat, unlink } from 'node:fs/promises';
import { createGzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';

const DATA_DIR = process.env.PULSAR_DATA_DIR || '/var/lib/pulsar';
const BACKUP_DIR = process.env.PULSAR_BACKUP_DIR || path.join(DATA_DIR, 'backups');
const KEEP_DAYS = Number(process.env.PULSAR_BACKUP_KEEP) || 30;
const SOURCE = path.join(DATA_DIR, 'pulsar.db');

const log = (msg) => console.log(`[sauvegarde] ${msg}`);

async function main() {
  await mkdir(BACKUP_DIR, { recursive: true });

  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const plain = path.join(BACKUP_DIR, `pulsar-${stamp}.db`);
  const gz = `${plain}.gz`;

  // 1. Copie cohérente de la base (la source n'est ouverte qu'en lecture).
  const db = new DatabaseSync(SOURCE, { readOnly: true });
  try {
    db.exec(`VACUUM INTO '${plain.replace(/'/g, "''")}'`);
  } finally {
    db.close();
  }

  // 2. Compression, puis on jette la copie non compressée.
  await pipeline(createReadStream(plain), createGzip({ level: 9 }), createWriteStream(gz));
  await unlink(plain);
  log(`créée : ${path.basename(gz)} (${Math.round((await stat(gz)).size / 1024)} Ko)`);

  // 3. Ménage : on ne garde que les KEEP_DAYS dernières nuits.
  const limit = Date.now() - KEEP_DAYS * 86400_000;
  let removed = 0;
  for (const f of await readdir(BACKUP_DIR)) {
    if (!f.startsWith('pulsar-') || !f.endsWith('.db.gz')) continue;
    const p = path.join(BACKUP_DIR, f);
    if ((await stat(p)).mtimeMs < limit) { await rm(p); removed++; }
  }
  if (removed) log(`${removed} sauvegarde(s) de plus de ${KEEP_DAYS} jours supprimée(s)`);

  const left = (await readdir(BACKUP_DIR)).filter((f) => f.endsWith('.db.gz')).length;
  log(`${left} sauvegarde(s) conservée(s) dans ${BACKUP_DIR}`);
}

main().catch((e) => {
  console.error('[sauvegarde] ÉCHEC :', e.message);
  process.exit(1);
});
