export type PersistenceMode = 'mock' | 'prisma';

/**
 * Mock is the safe local default. The API must opt in explicitly before it
 * opens a Supabase/Prisma connection, so a developer can still run the UI
 * and mock contract tests without a database credential.
 */
export function getPersistenceMode(value = process.env.PERSISTENCE_MODE): PersistenceMode {
  return value === 'prisma' ? 'prisma' : 'mock';
}
