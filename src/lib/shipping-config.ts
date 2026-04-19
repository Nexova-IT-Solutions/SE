export type ShippingConfigRecord = {
  id: string;
  deliveryFee: number;
  freeDeliveryThreshold: number;
  expressDeliveryFee: number;
  isDeliveryEnabled: boolean;
  deliveryNote: string | null;
  updatedAt: Date;
};

export const DEFAULT_SHIPPING_CONFIG: ShippingConfigRecord = {
  id: "default",
  deliveryFee: 350,
  freeDeliveryThreshold: 5000,
  expressDeliveryFee: 650,
  isDeliveryEnabled: true,
  deliveryNote: null,
  updatedAt: new Date(0),
};

type RawShippingConfigClient = {
  $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T>;
  $executeRawUnsafe(query: string, ...values: unknown[]): Promise<number>;
};

function normalizeShippingConfig(row: Record<string, unknown> | null | undefined): ShippingConfigRecord | null {
  if (!row) return null;

  return {
    id: String(row.id ?? "default"),
    deliveryFee: Number(row.deliveryFee ?? DEFAULT_SHIPPING_CONFIG.deliveryFee),
    freeDeliveryThreshold: Number(row.freeDeliveryThreshold ?? DEFAULT_SHIPPING_CONFIG.freeDeliveryThreshold),
    expressDeliveryFee: Number(row.expressDeliveryFee ?? DEFAULT_SHIPPING_CONFIG.expressDeliveryFee),
    isDeliveryEnabled: Boolean(row.isDeliveryEnabled ?? DEFAULT_SHIPPING_CONFIG.isDeliveryEnabled),
    deliveryNote: row.deliveryNote === undefined ? null : (row.deliveryNote as string | null),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt : new Date(String(row.updatedAt ?? Date.now())),
  };
}

export async function getShippingConfig(client: RawShippingConfigClient): Promise<ShippingConfigRecord | null> {
  const rows = await client.$queryRawUnsafe<Array<Record<string, unknown>>>(
    'SELECT "id", "deliveryFee", "freeDeliveryThreshold", "expressDeliveryFee", "isDeliveryEnabled", "deliveryNote", "updatedAt" FROM "ShippingConfig" WHERE "id" = $1 LIMIT 1',
    DEFAULT_SHIPPING_CONFIG.id,
  );

  return normalizeShippingConfig(rows[0]);
}

export async function ensureShippingConfig(client: RawShippingConfigClient): Promise<ShippingConfigRecord> {
  const existing = await getShippingConfig(client);
  if (existing) {
    return existing;
  }

  await client.$executeRawUnsafe(
    'INSERT INTO "ShippingConfig" ("id", "deliveryFee", "freeDeliveryThreshold", "expressDeliveryFee", "isDeliveryEnabled", "deliveryNote", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP) ON CONFLICT ("id") DO NOTHING',
    DEFAULT_SHIPPING_CONFIG.id,
    DEFAULT_SHIPPING_CONFIG.deliveryFee,
    DEFAULT_SHIPPING_CONFIG.freeDeliveryThreshold,
    DEFAULT_SHIPPING_CONFIG.expressDeliveryFee,
    DEFAULT_SHIPPING_CONFIG.isDeliveryEnabled,
    DEFAULT_SHIPPING_CONFIG.deliveryNote,
  );

  return (await getShippingConfig(client)) ?? DEFAULT_SHIPPING_CONFIG;
}

export async function upsertShippingConfig(
  client: RawShippingConfigClient,
  input: {
    deliveryFee?: number;
    freeDeliveryThreshold?: number;
    expressDeliveryFee?: number;
    isDeliveryEnabled?: boolean;
    deliveryNote?: string | null;
  }
): Promise<ShippingConfigRecord> {
  const deliveryFee = input.deliveryFee ?? DEFAULT_SHIPPING_CONFIG.deliveryFee;
  const freeDeliveryThreshold = input.freeDeliveryThreshold ?? DEFAULT_SHIPPING_CONFIG.freeDeliveryThreshold;
  const expressDeliveryFee = input.expressDeliveryFee ?? DEFAULT_SHIPPING_CONFIG.expressDeliveryFee;
  const isDeliveryEnabled = input.isDeliveryEnabled ?? DEFAULT_SHIPPING_CONFIG.isDeliveryEnabled;
  const deliveryNote = input.deliveryNote ?? null;

  const updatedCount = await client.$executeRawUnsafe(
    'UPDATE "ShippingConfig" SET "deliveryFee" = $1, "freeDeliveryThreshold" = $2, "expressDeliveryFee" = $3, "isDeliveryEnabled" = $4, "deliveryNote" = $5, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $6',
    deliveryFee,
    freeDeliveryThreshold,
    expressDeliveryFee,
    isDeliveryEnabled,
    deliveryNote,
    DEFAULT_SHIPPING_CONFIG.id,
  );

  if (updatedCount === 0) {
    await client.$executeRawUnsafe(
      'INSERT INTO "ShippingConfig" ("id", "deliveryFee", "freeDeliveryThreshold", "expressDeliveryFee", "isDeliveryEnabled", "deliveryNote", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)',
      DEFAULT_SHIPPING_CONFIG.id,
      deliveryFee,
      freeDeliveryThreshold,
      expressDeliveryFee,
      isDeliveryEnabled,
      deliveryNote,
    );
  }

  return (await getShippingConfig(client)) ?? {
    ...DEFAULT_SHIPPING_CONFIG,
    deliveryFee,
    freeDeliveryThreshold,
    expressDeliveryFee,
    isDeliveryEnabled,
    deliveryNote,
  };
}