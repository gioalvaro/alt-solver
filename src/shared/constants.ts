// Keep in sync with src/server/ModelStore.gs (METADATA_KEY_).
// .gs cannot import from TS, so both copies must change together.
export const METADATA_KEY = 'altsolver.model.v1';
export const SCHEMA_VERSION = 1 as const;
export const DEFAULT_OPTIONS = {
  assumeNonNegative: true,
  timeLimitSec: 100,
  iterLimit: null as number | null,
  mipGap: 1e-4,
  integerTolerance: 1e-6,
} as const;
export const INFINITY_STR = '1E+30';
