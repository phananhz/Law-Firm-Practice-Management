export interface ApiMeta {
  requestId: string;
  timestamp: string;
}

export interface ApiResponse<T> {
  data: T;
  meta: ApiMeta;
}

export interface HealthStatus {
  status: 'ok';
  service: 'api';
}

export * from './auth';
export * from './organization';
export * from './client';
export * from './conflict';
export * from './matter';
export * from './task';
export * from './document';
export * from './platform';
