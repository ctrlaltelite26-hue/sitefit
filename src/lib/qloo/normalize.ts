export type QlooExplain = {
  inputId: string;
  inputName?: string;
  weight: number;
};

export type QlooEntity = {
  entityId: string;
  name: string;
  type: string;
  affinity: number | null;
  popularity: number | null;
  tags: string[];
  explain?: QlooExplain[];
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function tagNames(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((tag) => {
    if (typeof tag === "string") return [tag];
    const record = asRecord(tag);
    return typeof record?.name === "string" ? [record.name] : [];
  });
}

function explainItem(item: unknown): QlooExplain[] {
  const row = asRecord(item);
  if (!row) return [];
  const inputId = row.entity_id ?? row.inputId ?? row.id;
  const weight = asNumber(row.weight ?? row.affinity ?? row.score);
  if (typeof inputId !== "string" || weight === null) return [];
  const inputName = row.name ?? row.inputName;
  return [
    {
      inputId,
      inputName: typeof inputName === "string" ? inputName : undefined,
      weight,
    },
  ];
}

function explainOf(record: Record<string, unknown>): QlooExplain[] | undefined {
  const query = asRecord(record.query);
  const raw = record.explainability ?? query?.explainability;
  if (Array.isArray(raw)) {
    const explain = raw.flatMap(explainItem);
    return explain.length > 0 ? explain : undefined;
  }
  const nested = asRecord(raw);
  const keyed = nested?.["signal.interests.entities"];
  if (!Array.isArray(keyed)) return undefined;
  const explain = keyed.flatMap(explainItem);
  return explain.length > 0 ? explain : undefined;
}

function entityList(body: unknown): unknown[] {
  const root = asRecord(body);
  const results = root?.results;
  if (Array.isArray(results)) return results;
  const nested = asRecord(results);
  return Array.isArray(nested?.entities) ? nested.entities : [];
}

export function normalizeEntities(body: unknown): QlooEntity[] {
  return entityList(body).flatMap((item) => {
    const record = asRecord(item);
    if (!record || typeof record.name !== "string") return [];
    const entityId = record.entity_id ?? record.entityId ?? record.id;
    if (typeof entityId !== "string") return [];
    const subtype = typeof record.subtype === "string" ? record.subtype : "";
    const declared = typeof record.type === "string" ? record.type : "";
    const types = record.types;
    const type =
      subtype.startsWith("urn:entity:") && subtype !== "urn:entity"
        ? subtype
        : declared && declared !== "urn:entity"
          ? declared
          : Array.isArray(types) && typeof types[0] === "string"
            ? types[0]
            : declared || "unknown";
    const query = asRecord(record.query);
    const properties = asRecord(record.properties);
    return [
      {
        entityId,
        name: record.name,
        type,
        affinity: asNumber(record.affinity ?? query?.affinity ?? properties?.affinity),
        popularity: asNumber(record.popularity),
        tags: tagNames(record.tags),
        explain: explainOf(record),
      },
    ];
  });
}
