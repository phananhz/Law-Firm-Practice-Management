import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, createHash } from 'node:crypto';

export type StorageMode = 'mock' | 'r2';

export type SignedStorageUrl = {
  provider: StorageMode;
  method: 'GET' | 'PUT';
  url: string;
  expiresAt: string;
  expiresInSeconds: number;
  requiredHeaders?: Record<string, string>;
};

type UploadInput = {
  key: string;
  mimeType: string;
};

/**
 * Cloudflare R2 uses the AWS Signature V4 protocol. Keeping the signer in the
 * API means the browser only ever receives a short-lived URL and never sees an
 * R2 secret. Mock mode deliberately returns a local contract URL.
 */
@Injectable()
export class R2StorageService {
  constructor(private readonly config: ConfigService) {}

  get mode(): StorageMode {
    return this.config.get<string>('STORAGE_MODE') === 'r2' ? 'r2' : 'mock';
  }

  createDownloadUrl(key: string, expiresInSeconds = 900): SignedStorageUrl {
    if (this.mode === 'mock') {
      return {
        provider: 'mock',
        method: 'GET',
        url: `/mock-storage/${encodeURIComponent(key)}`,
        expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
        expiresInSeconds,
      };
    }
    return this.sign('GET', key, expiresInSeconds);
  }

  createUploadUrl(input: UploadInput, expiresInSeconds = 900): SignedStorageUrl {
    if (this.mode === 'mock') {
      return {
        provider: 'mock',
        method: 'PUT',
        url: `/mock-storage/upload/${encodeURIComponent(input.key)}`,
        expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
        expiresInSeconds,
        requiredHeaders: { 'content-type': input.mimeType },
      };
    }
    return {
      ...this.sign('PUT', input.key, expiresInSeconds),
      requiredHeaders: { 'content-type': input.mimeType },
    };
  }

  private sign(method: 'GET' | 'PUT', key: string, requestedExpires: number): SignedStorageUrl {
    const accountId = this.config.get<string>('R2_ACCOUNT_ID');
    const bucket = this.config.get<string>('R2_BUCKET');
    const accessKeyId = this.config.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('R2_SECRET_ACCESS_KEY');
    if (!accountId || !bucket || !accessKeyId || !secretAccessKey) {
      throw new ServiceUnavailableException({
        code: 'STORAGE_UNAVAILABLE',
        message: 'Cloudflare R2 chưa được cấu hình.',
      });
    }

    const expiresInSeconds = Math.min(Math.max(Math.trunc(requestedExpires), 1), 604800);
    const now = new Date();
    const amzDate = formatAmzDate(now);
    const shortDate = amzDate.slice(0, 8);
    const region = 'auto';
    const service = 's3';
    const host = `${accountId}.r2.cloudflarestorage.com`;
    const credentialScope = `${shortDate}/${region}/${service}/aws4_request`;
    const credential = `${accessKeyId}/${credentialScope}`;
    const query = [
      ['X-Amz-Algorithm', 'AWS4-HMAC-SHA256'],
      ['X-Amz-Credential', credential],
      ['X-Amz-Date', amzDate],
      ['X-Amz-Expires', String(expiresInSeconds)],
      ['X-Amz-SignedHeaders', 'host'],
    ]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([name, value]) => `${encodeAws(name)}=${encodeAws(value)}`)
      .join('&');
    const canonicalUri = `/${encodeAws(bucket)}/${encodeKey(key)}`;
    const canonicalRequest = [
      method,
      canonicalUri,
      query,
      `host:${host}\n`,
      'host',
      'UNSIGNED-PAYLOAD',
    ].join('\n');
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      sha256(canonicalRequest),
    ].join('\n');
    const signingKey = hmac(
      hmac(hmac(hmac(`AWS4${secretAccessKey}`, shortDate), region), service),
      'aws4_request',
    );
    const signature = hmac(signingKey, stringToSign).toString('hex');
    const url = `https://${host}${canonicalUri}?${query}&X-Amz-Signature=${signature}`;

    return {
      provider: 'r2',
      method,
      url,
      expiresAt: new Date(now.getTime() + expiresInSeconds * 1000).toISOString(),
      expiresInSeconds,
    };
  }
}

function formatAmzDate(value: Date): string {
  return value
    .toISOString()
    .replace(/[-:.]/g, '')
    .replace(/\d{3}Z$/, 'Z');
}

function encodeKey(key: string): string {
  return key
    .split('/')
    .map((segment) => encodeAws(segment))
    .join('/');
}

function encodeAws(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function hmac(key: string | Buffer, value: string): Buffer {
  return createHmac('sha256', key).update(value).digest();
}
