import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { SOURCES } from "./constants";
import { getSourceById } from "./source-registry";
import type { SourceHealthSummary } from "./types";

const ZERO_YIELD_DISABLE_THRESHOLD = 3;
const FAILURE_DISABLE_THRESHOLD = 2;
const DISABLE_COOLDOWN_MS = 12 * 60 * 60 * 1000;
const HEALTH_FILE = path.join(process.cwd(), "data", "source-health.json");

type DisableReason = "zero-yield" | "failures";

interface SourceHealthRecord {
  sourceId: string;
  country: string;
  totalRuns: number;
  totalJobsCollected: number;
  consecutiveZeroResults: number;
  consecutiveFailures: number;
  lastRunAt: string | null;
  lastSuccessAt: string | null;
  lastResultCount: number;
  lastError: string | null;
  disabledUntil: string | null;
  disabledReason: DisableReason | null;
}

interface SourceHealthFile {
  version: 1;
  records: Record<string, SourceHealthRecord>;
}

function createEmptyFile(): SourceHealthFile {
  return {
    version: 1,
    records: {},
  };
}

function normalizeCountry(country: string): string {
  return country.trim().toLowerCase();
}

function createRecord(sourceId: string, country: string): SourceHealthRecord {
  return {
    sourceId,
    country,
    totalRuns: 0,
    totalJobsCollected: 0,
    consecutiveZeroResults: 0,
    consecutiveFailures: 0,
    lastRunAt: null,
    lastSuccessAt: null,
    lastResultCount: 0,
    lastError: null,
    disabledUntil: null,
    disabledReason: null,
  };
}

function getRecordKey(sourceId: string, country: string): string {
  return `${normalizeCountry(country)}::${sourceId}`;
}

function getPausedReason(record: SourceHealthRecord): string {
  if (record.disabledReason === "failures") {
    return `Auto-paused after ${record.consecutiveFailures} failed runs`;
  }

  return `Auto-paused after ${record.consecutiveZeroResults} zero-yield runs`;
}

function getWarningReason(record: SourceHealthRecord): string | null {
  if (record.consecutiveFailures > 0) {
    return `${record.consecutiveFailures} recent failed runs`;
  }
  if (record.consecutiveZeroResults > 0) {
    return `${record.consecutiveZeroResults} recent zero-yield runs`;
  }
  if (record.totalRuns > 0 && !record.lastSuccessAt) {
    return "No successful runs yet";
  }
  return null;
}

function toSummary(country: string, sourceId: string, record?: SourceHealthRecord): SourceHealthSummary {
  const source = getSourceById(sourceId);
  const activePause =
    record?.disabledUntil && new Date(record.disabledUntil).getTime() > Date.now();

  let state: SourceHealthSummary["state"] = "unknown";
  let reason: string | null = null;

  if (!record || record.totalRuns === 0) {
    state = "unknown";
  } else if (activePause) {
    state = "paused";
    reason = getPausedReason(record);
  } else if (record.lastSuccessAt && record.consecutiveFailures === 0 && record.consecutiveZeroResults === 0) {
    state = "healthy";
  } else {
    state = "warning";
    reason = getWarningReason(record);
  }

  return {
    sourceId,
    sourceName: source?.name ?? record?.sourceId ?? sourceId,
    sourceUrl: source?.url ?? "",
    catalogActive: source?.active ?? false,
    country,
    state,
    reason,
    lastRunAt: record?.lastRunAt ?? null,
    lastSuccessAt: record?.lastSuccessAt ?? null,
    lastResultCount: record?.lastResultCount ?? 0,
    consecutiveZeroResults: record?.consecutiveZeroResults ?? 0,
    consecutiveFailures: record?.consecutiveFailures ?? 0,
    disabledUntil: activePause ? record?.disabledUntil ?? null : null,
    totalRuns: record?.totalRuns ?? 0,
    totalJobsCollected: record?.totalJobsCollected ?? 0,
  };
}

class SourceHealthStore {
  private data: SourceHealthFile = createEmptyFile();
  private loaded = false;
  private loadPromise: Promise<void> | null = null;
  private writePromise = Promise.resolve();
  private diskWritable = true;

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    if (!this.loadPromise) {
      this.loadPromise = this.load();
    }
    await this.loadPromise;
  }

  private async load(): Promise<void> {
    try {
      const file = await fs.readFile(HEALTH_FILE, "utf8");
      const parsed = JSON.parse(file) as Partial<SourceHealthFile>;
      this.data = {
        version: 1,
        records: parsed.records ?? {},
      };
    } catch (error) {
      const code = error && typeof error === "object" && "code" in error ? String((error as NodeJS.ErrnoException).code) : "";
      if (code && code !== "ENOENT") {
        console.error("[SourceHealth] Falling back to memory-only mode:", error);
        this.diskWritable = false;
      }
      this.data = createEmptyFile();
    } finally {
      this.loaded = true;
    }
  }

  private async persist(): Promise<void> {
    if (!this.diskWritable) return;

    this.writePromise = this.writePromise.then(async () => {
      try {
        await fs.mkdir(path.dirname(HEALTH_FILE), { recursive: true });
        await fs.writeFile(HEALTH_FILE, JSON.stringify(this.data, null, 2), "utf8");
      } catch (error) {
        this.diskWritable = false;
        console.error("[SourceHealth] Failed to persist health data. Continuing in memory:", error);
      }
    });

    await this.writePromise;
  }

  private getRecord(sourceId: string, country: string): SourceHealthRecord | undefined {
    return this.data.records[getRecordKey(sourceId, country)];
  }

  private getOrCreateRecord(sourceId: string, country: string): SourceHealthRecord {
    const key = getRecordKey(sourceId, country);
    if (!this.data.records[key]) {
      this.data.records[key] = createRecord(sourceId, country);
    }
    return this.data.records[key];
  }

  async shouldRun(sourceId: string, country: string): Promise<{ allowed: boolean; reason: string | null; disabledUntil: string | null }> {
    await this.ensureLoaded();

    const record = this.getRecord(sourceId, country);
    if (!record?.disabledUntil) {
      return { allowed: true, reason: null, disabledUntil: null };
    }

    const disabledUntilMs = new Date(record.disabledUntil).getTime();
    if (disabledUntilMs > Date.now()) {
      return {
        allowed: false,
        reason: getPausedReason(record),
        disabledUntil: record.disabledUntil,
      };
    }

    return { allowed: true, reason: null, disabledUntil: null };
  }

  async recordRun(input: {
    sourceId: string;
    country: string;
    success: boolean;
    jobsCount: number;
    error?: string;
  }): Promise<void> {
    await this.ensureLoaded();

    const now = new Date().toISOString();
    const record = this.getOrCreateRecord(input.sourceId, input.country);

    record.totalRuns += 1;
    record.lastRunAt = now;
    record.lastResultCount = input.jobsCount;

    if (input.success) {
      record.lastError = null;
      record.consecutiveFailures = 0;

      if (input.jobsCount > 0) {
        record.totalJobsCollected += input.jobsCount;
        record.lastSuccessAt = now;
        record.consecutiveZeroResults = 0;
        record.disabledUntil = null;
        record.disabledReason = null;
      } else {
        record.consecutiveZeroResults += 1;
        if (record.consecutiveZeroResults >= ZERO_YIELD_DISABLE_THRESHOLD) {
          record.disabledUntil = new Date(Date.now() + DISABLE_COOLDOWN_MS).toISOString();
          record.disabledReason = "zero-yield";
        }
      }
    } else {
      record.lastError = input.error ?? "Unknown error";
      record.consecutiveFailures += 1;
      record.consecutiveZeroResults = 0;
      if (record.consecutiveFailures >= FAILURE_DISABLE_THRESHOLD) {
        record.disabledUntil = new Date(Date.now() + DISABLE_COOLDOWN_MS).toISOString();
        record.disabledReason = "failures";
      }
    }

    await this.persist();
  }

  async getCountrySummary(country: string): Promise<SourceHealthSummary[]> {
    await this.ensureLoaded();

    return SOURCES.map((source) =>
      toSummary(country, source.id, this.getRecord(source.id, country))
    );
  }
}

export const sourceHealth = new SourceHealthStore();