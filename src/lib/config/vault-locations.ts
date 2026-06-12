// ============================================================
// VAULT STORAGE LOCATION HIERARCHY — single source of truth
// Location → Locker → Rack. Edit here to change the options
// everywhere (create form dropdowns, server validation, seed).
// ============================================================

export const VAULT_LOCATIONS = {
  DUBAI: {
    label: "Dubai",
    lockers: {
      "dubai-1": ["db-1-1", "db-1-2", "db-1-3", "db-1-4"],
    },
  },
  INDIA: {
    label: "India",
    lockers: {
      "india-1": ["in-1-1", "in-1-2", "in-1-3", "in-1-4"],
      "india-2": ["in-2-1", "in-2-2", "in-2-3", "in-2-4"],
    },
  },
} as const;

// Matches the Prisma `VaultLocation` enum keys.
export type VaultLocationKey = keyof typeof VAULT_LOCATIONS;

export interface SelectOption {
  value: string;
  label: string;
}

export function getLocationOptions(): SelectOption[] {
  return (Object.keys(VAULT_LOCATIONS) as VaultLocationKey[]).map((key) => ({
    value: key,
    label: VAULT_LOCATIONS[key].label,
  }));
}

export function getLockerOptions(
  location: string | null | undefined
): SelectOption[] {
  if (!location || !(location in VAULT_LOCATIONS)) return [];
  const lockers = VAULT_LOCATIONS[location as VaultLocationKey].lockers;
  return Object.keys(lockers).map((value) => ({ value, label: value }));
}

export function getRackOptions(
  location: string | null | undefined,
  locker: string | null | undefined
): SelectOption[] {
  if (!location || !locker || !(location in VAULT_LOCATIONS)) return [];
  const lockers = VAULT_LOCATIONS[location as VaultLocationKey].lockers as Record<
    string,
    readonly string[]
  >;
  const racks = lockers[locker];
  if (!racks) return [];
  return racks.map((value, i) => {
    let label = value;
    if (i === 0) label = `${value} (Top rack)`;
    else if (i === racks.length - 1) label = `${value} (Last rack)`;
    return { value, label };
  });
}

/**
 * Server-side validation: confirms a (location, locker, rack) triple is a
 * real path in the hierarchy. Used by the document Zod schema so the client
 * can never submit an out-of-config combination.
 */
export function isValidLocationTriple(
  location: string | null | undefined,
  locker: string | null | undefined,
  rack: string | null | undefined
): boolean {
  if (!location || !locker || !rack) return false;
  if (!(location in VAULT_LOCATIONS)) return false;
  const lockers = VAULT_LOCATIONS[location as VaultLocationKey].lockers as Record<
    string,
    readonly string[]
  >;
  const racks = lockers[locker];
  return Array.isArray(racks) && racks.includes(rack);
}
