/**
 * Nocturne Space metadata and lifecycle model.
 *
 * This is browser-core policy/state only. It does NOT create Chromium
 * BrowserContexts, partitions, cookie stores, or profile directories. Chromium
 * adapters must enforce the policies in the browser process and prove isolation
 * with browser-level leakage tests before these descriptors can be called secure.
 */

export const SPACE_MOODS = Object.freeze(["atelier", "gambit", "vigil", "drift", "ember"]);
export const CONTENT_BLOCKING_MODES = Object.freeze(["off", "balanced", "strict"]);

const DEFAULT_SPACE = Object.freeze({
  id: "atelier",
  name: "Atelier",
  mood: "atelier",
  private: false,
  contentBlocking: "balanced",
});

const ID_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,46}[a-z0-9])?$/;

function requireRecord(value, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value;
}

function normalizeText(value, label, maxLength) {
  if (typeof value !== "string") throw new TypeError(`${label} must be a string`);
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) {
    throw new RangeError(`${label} must contain 1 to ${maxLength} characters`);
  }
  return normalized;
}

function makeDataPolicy(isPrivate) {
  return Object.freeze({
    storage: isPrivate ? "temporary" : "persistent-profile",
    history: isPrivate ? "disabled" : "enabled",
    sync: "disabled-in-v1",
    clearOnClose: isPrivate,
    relockOnBlur: isPrivate,
  });
}

export function createSpaceDescriptor(input = {}) {
  const source = requireRecord(input, "Space");
  const id = normalizeText(source.id ?? "", "Space id", 48).toLowerCase();
  if (!ID_PATTERN.test(id)) {
    throw new RangeError("Space id must be a lowercase kebab-case identifier");
  }

  const name = normalizeText(source.name ?? "", "Space name", 64);
  const mood = source.mood ?? "atelier";
  if (!SPACE_MOODS.includes(mood)) {
    throw new RangeError(`Unknown Space mood: ${String(mood)}`);
  }

  const isPrivate = source.private ?? false;
  if (typeof isPrivate !== "boolean") throw new TypeError("Space private flag must be boolean");

  const contentBlocking = source.contentBlocking ?? "balanced";
  if (!CONTENT_BLOCKING_MODES.includes(contentBlocking)) {
    throw new RangeError(`Unknown content-blocking mode: ${String(contentBlocking)}`);
  }

  return Object.freeze({
    id,
    name,
    mood,
    private: isPrivate,
    contentBlocking,
    dataPolicy: makeDataPolicy(isPrivate),
  });
}

function freezeRegistry(spaces, activeSpaceId) {
  return Object.freeze({
    spaces: Object.freeze(spaces.map((space) => createSpaceDescriptor(space))),
    activeSpaceId,
  });
}

function findSpaceIndex(spaces, id) {
  return spaces.findIndex((space) => space.id === id);
}

function requireRegistry(registry) {
  requireRecord(registry, "Space registry");
  if (!Array.isArray(registry.spaces) || typeof registry.activeSpaceId !== "string") {
    throw new TypeError("Invalid Space registry shape");
  }
  if (!registry.spaces.length) throw new RangeError("Space registry cannot be empty");
  return registry;
}

function ensureOnePersistentSpace(spaces) {
  if (!spaces.some((space) => !space.private)) {
    throw new RangeError("At least one non-private Space must remain");
  }
}

export function createSpaceRegistry({
  spaces = [DEFAULT_SPACE],
  activeSpaceId,
} = {}) {
  if (!Array.isArray(spaces) || spaces.length === 0) {
    throw new RangeError("At least one Space is required");
  }

  const normalized = spaces.map((space) => createSpaceDescriptor(space));
  const ids = new Set();
  for (const space of normalized) {
    if (ids.has(space.id)) throw new RangeError(`Duplicate Space id: ${space.id}`);
    ids.add(space.id);
  }
  ensureOnePersistentSpace(normalized);

  const requestedActive = activeSpaceId ?? normalized[0].id;
  if (!ids.has(requestedActive)) {
    throw new RangeError(`Active Space does not exist: ${requestedActive}`);
  }
  return freezeRegistry(normalized, requestedActive);
}

export function addSpace(registry, input) {
  requireRegistry(registry);
  const next = createSpaceDescriptor(input);
  if (registry.spaces.some((space) => space.id === next.id)) {
    throw new RangeError(`Space already exists: ${next.id}`);
  }
  return freezeRegistry([...registry.spaces, next], registry.activeSpaceId);
}

export function activateSpace(registry, id) {
  requireRegistry(registry);
  if (findSpaceIndex(registry.spaces, id) === -1) {
    throw new RangeError(`Cannot activate unknown Space: ${id}`);
  }
  return freezeRegistry(registry.spaces, id);
}

export function updateSpace(registry, id, changes) {
  requireRegistry(registry);
  const index = findSpaceIndex(registry.spaces, id);
  if (index === -1) throw new RangeError(`Cannot update unknown Space: ${id}`);
  const patch = requireRecord(changes, "Space changes");

  // Privacy lifecycle is a creation-time choice: converting a persistent
  // profile into a private one (or vice versa) needs a dedicated migration.
  if (Object.hasOwn(patch, "private")) {
    throw new RangeError("Space privacy mode cannot be changed after creation");
  }

  const current = registry.spaces[index];
  const updated = createSpaceDescriptor({
    id: current.id,
    name: Object.hasOwn(patch, "name") ? patch.name : current.name,
    mood: Object.hasOwn(patch, "mood") ? patch.mood : current.mood,
    private: current.private,
    contentBlocking: Object.hasOwn(patch, "contentBlocking") ? patch.contentBlocking : current.contentBlocking,
  });

  const spaces = registry.spaces.slice();
  spaces[index] = updated;
  return freezeRegistry(spaces, registry.activeSpaceId);
}

export function removeSpace(registry, id) {
  requireRegistry(registry);
  const index = findSpaceIndex(registry.spaces, id);
  if (index === -1) throw new RangeError(`Cannot remove unknown Space: ${id}`);

  const spaces = registry.spaces.filter((space) => space.id !== id);
  ensureOnePersistentSpace(spaces);

  const nextActive = registry.activeSpaceId === id
    ? (spaces.find((space) => !space.private) ?? spaces[0]).id
    : registry.activeSpaceId;

  return freezeRegistry(spaces, nextActive);
}

/** Close all temporary Spaces and choose a persistent Space if one was active. */
export function closePrivateSpaces(registry) {
  requireRegistry(registry);
  const spaces = registry.spaces.filter((space) => !space.private);
  ensureOnePersistentSpace(spaces);

  const nextActive = spaces.some((space) => space.id === registry.activeSpaceId)
    ? registry.activeSpaceId
    : spaces[0].id;

  return freezeRegistry(spaces, nextActive);
}

/**
 * Return only the metadata allowed to survive an application restart.
 * Private Spaces are always omitted, even if one was active at snapshot time.
 */
export function toPersistedSpaceSnapshot(registry) {
  requireRegistry(registry);
  const spaces = registry.spaces
    .filter((space) => !space.private)
    .map(({ id, name, mood, contentBlocking }) => ({ id, name, mood, contentBlocking }));

  const activeSpaceId = spaces.some((space) => space.id === registry.activeSpaceId)
    ? registry.activeSpaceId
    : spaces[0]?.id ?? null;

  return Object.freeze({
    activeSpaceId,
    spaces: Object.freeze(spaces.map((space) => Object.freeze(space))),
  });
}
