import { ConfigService } from '@nestjs/config';
import { ServiceUnavailableException } from '@nestjs/common';
import { R2StorageService } from './r2-storage.service';

describe('R2StorageService', () => {
  it('keeps mock storage explicit and local', () => {
    const config = new ConfigService({ STORAGE_MODE: 'mock' });
    const service = new R2StorageService(config);

    expect(service.createDownloadUrl('matter/doc v1.pdf')).toMatchObject({
      provider: 'mock',
      method: 'GET',
      url: '/mock-storage/matter%2Fdoc%20v1.pdf',
    });
  });

  it('creates an R2 SigV4 URL without exposing the secret', () => {
    const config = new ConfigService({
      STORAGE_MODE: 'r2',
      R2_ACCOUNT_ID: 'account123',
      R2_BUCKET: 'lpms-documents',
      R2_ACCESS_KEY_ID: 'access123',
      R2_SECRET_ACCESS_KEY: 'secret-value',
    });
    const service = new R2StorageService(config);
    const signed = service.createUploadUrl({
      key: 'matter-1/file.pdf',
      mimeType: 'application/pdf',
    });

    expect(signed.provider).toBe('r2');
    expect(signed.method).toBe('PUT');
    expect(signed.url).toMatch(/^https:\/\/account123\.r2\.cloudflarestorage\.com\//);
    expect(signed.url).toContain('X-Amz-Algorithm=AWS4-HMAC-SHA256');
    expect(signed.url).toContain('X-Amz-SignedHeaders=host');
    expect(signed.url).toContain('X-Amz-Signature=');
    expect(signed.url).not.toContain('secret-value');
    expect(signed.requiredHeaders).toEqual({ 'content-type': 'application/pdf' });
  });

  it('fails closed when R2 mode has incomplete credentials', () => {
    const config = new ConfigService({ STORAGE_MODE: 'r2', R2_BUCKET: 'lpms-documents' });
    const service = new R2StorageService(config);

    try {
      service.createDownloadUrl('doc-1');
      throw new Error('expected R2 configuration to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(ServiceUnavailableException);
      expect((error as ServiceUnavailableException).getResponse()).toMatchObject({
        code: 'STORAGE_UNAVAILABLE',
      });
    }
  });
});
