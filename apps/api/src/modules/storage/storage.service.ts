import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createHmac, createHash } from 'node:crypto';

export type StorageMode = 'mock' | 'r2' | 'supabase';

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
 * Produces short-lived storage URLs without exposing provider credentials to
 * the browser. Mock, Cloudflare R2 and Supabase Storage share one contract so
 * callers do not need provider-specific branching.
 */
@Injectable()
export class StorageService {
  private supabaseClient?: SupabaseClient;

  constructor(private readonly config: ConfigService) {}

  get mode(): StorageMode {
    const configured = this.config.get<string>('STORAGE_MODE');
    if (configured === 'r2' || configured === 'supabase') return configured;
    return 'mock';
  }

  async createDownloadUrl(key: string, expiresInSeconds = 900): Promise<SignedStorageUrl> {
    if (this.mode === 'mock') {
      return {
        provider: 'mock',
        method: 'GET',
        url: `/mock-storage/${encodeURIComponent(key)}`,
        expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
        expiresInSeconds,
      };
    }
    if (this.mode === 'supabase') {
      return this.createSupabaseDownloadUrl(key, expiresInSeconds);
    }
    return this.signR2('GET', key, expiresInSeconds);
  }

  async createUploadUrl(input: UploadInput, expiresInSeconds = 900): Promise<SignedStorageUrl> {
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
    if (this.mode === 'supabase') {
      return this.createSupabaseUploadUrl(input);
    }
    return {
      ...this.signR2('PUT', input.key, expiresInSeconds),
      requiredHeaders: { 'content-type': input.mimeType },
    };
  }

  private async createSupabaseDownloadUrl(
    key: string,
    requestedExpires: number,
  ): Promise<SignedStorageUrl> {
    const expiresInSeconds = Math.min(Math.max(Math.trunc(requestedExpires), 1), 604800);
    const { client, bucket } = this.getSupabaseStorage();
    const { data, error } = await client.storage
      .from(bucket)
      .createSignedUrl(key, expiresInSeconds);
    if (error || !data?.signedUrl) this.throwProviderUnavailable('Supabase Storage', error);
    return {
      provider: 'supabase',
      method: 'GET',
      url: data.signedUrl,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
      expiresInSeconds,
    };
  }

  private async createSupabaseUploadUrl(input: UploadInput): Promise<SignedStorageUrl> {
    const { client, bucket } = this.getSupabaseStorage();
    const { data, error } = await client.storage
      .from(bucket)
      .createSignedUploadUrl(input.key, { upsert: false });
    if (error || !data?.signedUrl) this.throwProviderUnavailable('Supabase Storage', error);

    // Supabase signed upload URLs currently have a fixed two-hour lifetime.
    const expiresInSeconds = 7200;
    return {
      provider: 'supabase',
      method: 'PUT',
      url: data.signedUrl,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
      expiresInSeconds,
      requiredHeaders: { 'content-type': input.mimeType },
    };
  }

  private getSupabaseStorage(): { client: SupabaseClient; bucket: string } {
    const url = this.config.get<string>('SUPABASE_URL');
    const serviceRoleKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    const bucket = this.config.get<string>('SUPABASE_STORAGE_BUCKET');
    if (!url || !serviceRoleKey || !bucket) {
      this.throwProviderUnavailable('Supabase Storage');
    }
    this.supabaseClient ??= createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    return { client: this.supabaseClient, bucket };
  }

  private throwProviderUnavailable(provider: string, cause?: unknown): never {
    const reason = cause instanceof Error ? cause.message : undefined;
    throw new ServiceUnavailableException({
      code: 'STORAGE_UNAVAILABLE',
      message: `${provider} chưa sẵn sàng.`,
      ...(process.env.NODE_ENV === 'development' && reason ? { reason } : {}),
    });
  }

  private signR2(method: 'GET' | 'PUT', key: string, requestedExpires: number): SignedStorageUrl {
    const accountId = this.config.get<string>('R2_ACCOUNT_ID');
    const bucket = this.config.get<string>('R2_BUCKET');
    const accessKeyId = this.config.get<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.config.get<string>('R2_SECRET_ACCESS_KEY');
    if (!accountId || !bucket || !accessKeyId || !secretAccessKey) {
      this.throwProviderUnavailable('Cloudflare R2');
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
