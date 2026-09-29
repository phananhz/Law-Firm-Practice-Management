import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const environment = process.env.DEPLOY_ENV ?? 'staging';
const errors = [];
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

if (!['staging', 'production'].includes(environment)) {
  errors.push('DEPLOY_ENV must be staging or production.');
}

requireValue('PERSISTENCE_MODE', 'prisma');
requireValue('STORAGE_MODE', 'r2');
requireValue('DATABASE_URL');
requireValue('DIRECT_URL');
requireValue('JWT_ACCESS_SECRET', undefined, 32);
requireValue('JWT_REFRESH_SECRET', undefined, 32);
requireValue('AUTH_ENCRYPTION_KEY', undefined, 32);
requireValue('R2_ACCOUNT_ID');
requireValue('R2_BUCKET');
requireValue('R2_ACCESS_KEY_ID');
requireValue('R2_SECRET_ACCESS_KEY');
requireValue('QUEUE_PROCESSOR_URL');
requireValue('QUEUE_INTERNAL_SECRET', undefined, 32);
requireValue('CRON_SECRET', undefined, 32);

validatePostgresUrl('DATABASE_URL');
validatePostgresUrl('DIRECT_URL');
validateHttpsUrl('QUEUE_PROCESSOR_URL');
validateSecretPair('JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET');
validateManifest('apps/web/vercel.json');
validateManifest('apps/api/vercel.json');
requireFile('apps/web/app/api/queues/notifications/route.ts');
requireFile('apps/web/app/api/cron/reminders/route.ts');
requireFile('apps/api/api/index.ts');

if (errors.length) {
  console.error(`DEPLOY_PREFLIGHT_FAILED (${environment})`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`DEPLOY_PREFLIGHT_PASSED (${environment})`);
}

function requireValue(name, expected, minimumLength) {
  const value = process.env[name]?.trim();
  if (!value) {
    errors.push(`${name} is missing.`);
    return;
  }
  if (expected && value !== expected) errors.push(`${name} must be ${expected}.`);
  if (minimumLength && value.length < minimumLength)
    errors.push(`${name} must be at least ${minimumLength} characters.`);
  if (/replace-with|placeholder|example\.com/i.test(value))
    errors.push(`${name} still contains a placeholder value.`);
}

function validatePostgresUrl(name) {
  const value = process.env[name]?.trim();
  if (!value) return;
  try {
    const url = new URL(value);
    if (!['postgres:', 'postgresql:'].includes(url.protocol))
      errors.push(`${name} must use a PostgreSQL URL.`);
  } catch {
    errors.push(`${name} is not a valid URL.`);
  }
}

function validateHttpsUrl(name) {
  const value = process.env[name]?.trim();
  if (!value) return;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') errors.push(`${name} must use HTTPS for staging/production.`);
  } catch {
    errors.push(`${name} is not a valid URL.`);
  }
}

function validateSecretPair(first, second) {
  const firstValue = process.env[first];
  const secondValue = process.env[second];
  if (firstValue && secondValue && firstValue === secondValue)
    errors.push(`${first} and ${second} must be different.`);
}

function validateManifest(relativePath) {
  const absolutePath = resolve(root, relativePath);
  if (!existsSync(absolutePath)) {
    errors.push(`${relativePath} is missing.`);
    return;
  }
  try {
    JSON.parse(readFileSync(absolutePath, 'utf8'));
  } catch {
    errors.push(`${relativePath} is not valid JSON.`);
  }
}

function requireFile(relativePath) {
  if (!existsSync(resolve(root, relativePath))) errors.push(`${relativePath} is missing.`);
}
