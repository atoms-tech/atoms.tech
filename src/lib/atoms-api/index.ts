// Client-only barrel to avoid pulling server-only modules into client bundles.
export { atomsApiClient } from './client';
export type { AtomsApiClient } from './client';
export * from './domains/types';
