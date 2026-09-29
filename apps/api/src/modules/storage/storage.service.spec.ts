import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  afterEach(() => jest.restoreAllMocks());

  it('keeps mock storage explicit and local', async () => {
    const service = new StorageService(new ConfigService({ STORAGE_MODE: 'mock' }));

    await expect(service.createDownloadUrl('matter/doc v1.pdf')).resolves.toMatchObject({
      provider: 'mock',
      method: 'GET',
      url: '/mock-storage/matter%2Fdoc%20v1.pdf',
    });
  });

  it('creates an R2 SigV4 URL without exposing the secret', async () => {
    const service = new StorageService(
      new ConfigService({
        STORAGE_MODE: 'r2',
        R2_ACCOUNT_ID: 'account123',
        R2_BUCKET: 'lpms-documents',
        R2_ACCESS_KEY_ID: 'access123',
        R2_SECRET_ACCESS_KEY: 'secret-value',
      }),
    );
    const signed = await service.createUploadUrl({
      key: 'matter-1/file.pdf',
      mimeType: 'application/pdf',
    });

    expect(signed.provider).toBe('r2');
    expect(signed.method).toBe('PUT');
    expect(signed.url).toMatch(/^https:\/\/account123\.r2\.cloudflarestorage\.com\//);
    expect(signed.url).toContain('X-Amz-Algorithm=AWS4-HMAC-SHA256');
    expect(signed.url).toContain('X-Amz-Signature=');
    expect(signed.url).not.toContain('secret-value');
    expect(signed.requiredHeaders).toEqual({ 'content-type': 'application/pdf' });
  });

  it('creates a Supabase signed upload URL without exposing the service role key', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          url: '/object/upload/sign/lpms-documents/matter-1/file.pdf?token=signed-token',
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );
    const service = new StorageService(
      new ConfigService({
        STORAGE_MODE: 'supabase',
        SUPABASE_URL: 'https://project.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'service-role-secret',
        SUPABASE_STORAGE_BUCKET: 'lpms-documents',
      }),
    );

    const signed = await service.createUploadUrl({
      key: 'matter-1/file.pdf',
      mimeType: 'application/pdf',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(signed).toMatchObject({
      provider: 'supabase',
      method: 'PUT',
      expiresInSeconds: 7200,
      requiredHeaders: { 'content-type': 'application/pdf' },
    });
    expect(signed.url).toContain('token=signed-token');
    expect(signed.url).not.toContain('service-role-secret');
  });

  it('fails closed when the selected provider has incomplete credentials', async () => {
    const service = new StorageService(
      new ConfigService({ STORAGE_MODE: 'supabase', SUPABASE_STORAGE_BUCKET: 'lpms-documents' }),
    );

    try {
      await service.createDownloadUrl('doc-1');
      throw new Error('expected Supabase configuration to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(ServiceUnavailableException);
      expect((error as ServiceUnavailableException).getResponse()).toMatchObject({
        code: 'STORAGE_UNAVAILABLE',
      });
    }
  });
});
