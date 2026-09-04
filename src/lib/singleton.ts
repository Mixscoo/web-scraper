/**
 * Next.js bundles each route handler as its own entry, so a plain module-level
 * `export const foo = new Foo()` is instantiated *per route bundle* — two routes
 * importing the same module get two different objects and share no state. That
 * silently broke the Stats page: /api/scrape populated its own copy of the job
 * store while /api/stats read a permanently empty one.
 *
 * Pinning the instance to globalThis gives one instance per server process, and
 * has the useful side effect of surviving dev HMR module reloads (which used to
 * wipe scraped jobs on every file save).
 *
 * Scope: this shares state within a single process. On Vercel each route runs as
 * its own serverless function, so durable cross-route state needs external
 * storage (KV/Postgres) rather than any in-memory object.
 */
export function processSingleton<T>(key: string, create: () => T): T {
  const globals = globalThis as Record<string, unknown>;
  const globalKey = `__webScraper_${key}`;

  if (!globals[globalKey]) {
    globals[globalKey] = create();
  }

  return globals[globalKey] as T;
}
