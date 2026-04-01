import { SOURCES } from "./constants";
import type { Source } from "./types";

function normalizeSourceToken(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "")
    .replace(/[^a-z0-9]+/g, "");
}

function buildSourceAliases(): Map<string, string> {
  const aliases = new Map<string, string>();

  for (const source of SOURCES) {
    aliases.set(normalizeSourceToken(source.id), source.id);
    aliases.set(normalizeSourceToken(source.name), source.id);

    try {
      const url = new URL(source.url);
      aliases.set(normalizeSourceToken(url.hostname), source.id);
      aliases.set(normalizeSourceToken(url.hostname.replace(/^www\./, "")), source.id);
    } catch {
      aliases.set(normalizeSourceToken(source.url), source.id);
    }
  }

  aliases.set("linkedin", "linkedin");
  aliases.set("linkedinjobs", "linkedin");
  aliases.set("talent", "talent");
  aliases.set("talentcom", "talent");
  aliases.set("grabjobs", "grabjobs");
  aliases.set("opensooq", "opensooq");
  aliases.set("gulftalent", "gulftalent");
  aliases.set("jobrapido", "jobrapido");
  aliases.set("learn4good", "learn4good");
  aliases.set("jooble", "jooble");
  aliases.set("naukrigulf", "naukrigulf");

  return aliases;
}

const sourceAliases = buildSourceAliases();
const sourceById = new Map<string, Source>(SOURCES.map((source) => [source.id, source]));

export function getSourceById(sourceId: string | null | undefined): Source | null {
  if (!sourceId) return null;
  return sourceById.get(sourceId) ?? null;
}

export function resolveSourceId(value: string | null | undefined): string | null {
  if (!value) return null;
  return sourceAliases.get(normalizeSourceToken(value)) ?? null;
}

export function resolveSourceName(value: string | null | undefined): string {
  const source = getSourceById(resolveSourceId(value));
  return source?.name ?? (value || "Unknown Source");
}