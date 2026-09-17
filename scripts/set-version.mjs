#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';

const [tag, mode] = process.argv.slice(2);
const version = tag?.replace(/^v/, '');
if (!version || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(version) || (mode && mode !== '--check')) {
  console.error('Usage: node scripts/set-version.mjs v0.2.0 [--check]');
  process.exit(1);
}

const packagePath = 'package.json';
const tauriPath = 'src-tauri/tauri.conf.json';
const cargoPath = 'src-tauri/Cargo.toml';
const lockPath = 'src-tauri/Cargo.lock';
const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
const tauri = JSON.parse(readFileSync(tauriPath, 'utf8'));
const cargo = readFileSync(cargoPath, 'utf8');
const lock = readFileSync(lockPath, 'utf8');
const cargoMatch = cargo.match(/^(\[package\]\s*\nname = "diffchecker"\s*\nversion = ")([^"]+)(")/m);
const lockMatch = lock.match(/^(\[\[package\]\]\s*\nname = "diffchecker"\s*\nversion = ")([^"]+)(")/m);
if (pkg.name !== 'diffchecker' || tauri.productName !== 'DiffChecker' || !cargoMatch || !lockMatch) {
  console.error('Could not locate all DiffChecker version fields.');
  process.exit(1);
}
if (mode === '--check') {
  console.log(`Valid release tag: ${tag} (app version ${version})`);
  process.exit(0);
}

pkg.version = version;
tauri.version = version;
writeFileSync(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);
writeFileSync(tauriPath, `${JSON.stringify(tauri, null, 2)}\n`);
writeFileSync(cargoPath, cargo.replace(cargoMatch[0], `${cargoMatch[1]}${version}${cargoMatch[3]}`));
writeFileSync(lockPath, lock.replace(lockMatch[0], `${lockMatch[1]}${version}${lockMatch[3]}`));
console.log(`Set DiffChecker version to ${version}`);
