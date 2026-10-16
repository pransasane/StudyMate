/**
 * Demo records are intentionally not seeded automatically after switching to
 * Firestore. Seed data should be created explicitly in a development project,
 * not silently inserted into a live database on every server startup.
 */
export async function seedDemoDataIfEmpty(): Promise<void> {
  if (process.env.SEED_DEMO_DATA === 'true') {
    console.warn('Automatic demo seeding is disabled for Firestore. Add demo records through a dedicated development-only seed script.');
  }
}
