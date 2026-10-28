#!/usr/bin/env node
/**
 * If TARGET_DB_PASSWORD is set, change the MySQL account from DATABASE_URL
 * to that password. Used to recover a password Vercel has at runtime but
 * cannot reveal. No-op when the env var is unset. Never prints secrets.
 */
import mysql from "mysql2/promise";

const nextPass = process.env.TARGET_DB_PASSWORD;
if (!nextPass) {
  process.exit(0);
}

if (!/^[A-Za-z0-9]{32,64}$/.test(nextPass)) {
  console.error("adopt-db-password: TARGET_DB_PASSWORD failed the format check");
  process.exit(1);
}

const current = process.env.DATABASE_URL;
if (!current) {
  console.error("adopt-db-password: DATABASE_URL is missing");
  process.exit(1);
}

function withPassword(urlString, password) {
  const parsed = new URL(urlString);
  parsed.password = password;
  return parsed.toString();
}

const conn = await mysql.createConnection(current);
const [rows] = await conn.query("SELECT CURRENT_USER() AS account");
const account = String(rows[0]?.account ?? "");
const at = account.lastIndexOf("@");
const user = account.slice(0, at);
const host = account.slice(at + 1);

if (!/^[A-Za-z0-9_]+$/.test(user) || !/^[A-Za-z0-9_%.]+$/.test(host)) {
  console.error("adopt-db-password: unexpected account");
  process.exit(1);
}

console.log(`adopt-db-password: changing password for ${account}`);
await conn.query(
  `ALTER USER '${user}'@'${host}' IDENTIFIED BY '${nextPass}'`,
);
await conn.query("FLUSH PRIVILEGES");
await conn.end();

const verify = await mysql.createConnection(withPassword(current, nextPass));
await verify.query("SELECT 1");
await verify.end();
console.log("adopt-db-password: new password works");
