/**
 * Nocturne Space metadata, collections, and lifecycle model.
 *
 * This is browser-core state/policy only. It does NOT create Chromium
 * BrowserContexts, partitions, cookie stores, or profile directories. Chromium
 * adapters must enforce these policies in the browser process and prove
 * isolation with browser-level leakage tests before Spaces can be called secure.
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
    throw new TypeError(label + " must be an object");
  }
  return value;
}

function normalizeText(value, label, maxLength) {
  if (typeof value !== "string") throw new TypeError(label + " must be a string");
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) {
    throw new RangeError(label + " must contain 1 to " + maxLength + " characters");
  }
  return normalized;
}

function normalizeId(value, label) {
  const id = normalizeText(value ?? "", label, 48).toLowerCase();
  if (!ID_PATTERN.test(id)) {
    throw new RangeError(label + " must be a lowercase kebab-case identifier");
  }
  return id;
}

function normalizeTabs(value = []) {
  if (!Array.isArray(value)) throw new TypeError("Space tabs must be an array");
  const ids = new Set();
  return Object.freeze(value.map((entry) => {
    const source = requireRecord(entry, "Tab");
    const id = normalizeId(source.id, "Tab id");
    if (ids.has(id)) throw new RangeError("Duplicate tab id: " + id);
    ids.add(id);
    const title = normalizeText(source.title ?? "Untitled", "Tab title", 256);
    const url = normalizeText(source.url, "Tab URL", 8192);
    const sleeping = source.sleeping ?? false;
    if (typeof sleeping !== "boolean") throw new TypeError("Tab sleeping flag must be boolean");
    return Object.freeze({ id, title, url, sleeping });
  }));
}

function normalizePins(value = []) {
  if (!Array.isArray(value)) throw new TypeError("Space pins must be an array");
  const ids = new Set();
  return Object.freeze(value.map((entry) => {
    const source = requireRecord(entry, "Pin");
    const id = normalizeId(source.id, "Pin id");
    if (ids.has(id)) throw new RangeError("Duplicate pin id: " + id);
    ids.add(id);
    const title = normalizeText(source.title, "Pin title", 96);
    const url = normalizeText(source.url, "Pin URL", 8192);
    return Object.freeze({ id, title, url });
  }));
}

function normalizeFolders(value = []) {
  if (!Array.isArray(value)) throw new TypeError("Space folders must be an array");
  const ids = new Set();
  return Object.freeze(value.map((entry) => {
    const source = requireRecord(entry, "Folder");
    const id = normalizeId(source.id, "Folder id");
    if (ids.has(id)) throw new RangeError("Duplicate folder id: " + id);
    ids.add(id);
    const name = normalizeText(source.name, "Folder name", 96);
    return Object.freeze({ id, name });
  }));
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
  const id = normalizeId(source.id, "Space id");
  const name = normalizeText(source.name ?? "", "Space name", 64);
  const mood = source.mood ?? "atelier";
  if (!SPACE_MOODS.includes(mood)) {
    throw new RangeError("Unknown Space mood: " + String(mood));
  }

  const isPrivate = source.private ?? false;
  if (typeof isPrivate !== "boolean") throw new TypeError("Space private flag must be boolean");
  const contentBlocking = source.contentBlocking ?? "balanced";
  if (!CONTENT_BLOCKING_MODES.includes(contentBlocking)) {
    throw new RangeError("Unknown content-blocking mode: " + String(contentBlocking));
  }

  return Object.freeze({
    id,
    name,
    mood,
    private: isPrivate,
    contentBlocking,
    tabs: normalizeTabs(source.tabs),
    pins: normalizePins(source.pins),
    folders: normalizeFolders(source.folders),
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

function replaceSpace(registry, id, changes) {
  const index = findSpaceIndex(registry.spaces, id);
  if (index === -1) throw new RangeError("Unknown Space: " + id);
  const current = registry.spaces[index];
  const patch = requireRecord(changes, "Space changes");
  const updated = createSpaceDescriptor({
    id: current.id,
    name: Object.hasOwn(patch, "name") ? patch.name : current.name,
    mood: Object.hasOwn(patch, "mood") ? patch.mood : current.mood,
    private: current.private,
    contentBlocking: Object.hasOwn(patch, "contentBlocking") ? patch.contentBlocking : current.contentBlocking,
    tabs: Object.hasOwn(patch, "tabs") ? patch.tabs : current.tabs,
    pins: Object.hasOwn(patch, "pins") ? patch.pins : current.pins,
    folders: Object.hasOwn(patch, "folders") ? patch.folders : current.folders,
  });
  const spaces = registry.spaces.slice();
  spaces[index] = updated;
  return freezeRegistry(spaces, registry.activeSpaceId);
}

function removeCollectionEntry(registry, spaceId, collection, entryId, label) {
  requireRegistry(registry);
  const space = registry.spaces.find((item) => item.id === spaceId);
  if (!space) throw new RangeError("Unknown Space: " + spaceId);
  const entries = space[collection];
  if (!entries.some((entry) => entry.id === entryId)) {
    throw new RangeError("Unknown " + label + ": " + entryId);
  }
  return replaceSpace(registry, spaceId, { [collection]: entries.filter((entry) => entry.id !== entryId) });
}

export function createSpaceRegistry({ spaces = [DEFAULT_SPACE], activeSpaceId } = {}) {
  if (!Array.isArray(spaces) || spaces.length === 0) {
    throw new RangeError("At least one Space is required");
  }

  const normalized = spaces.map((space) => createSpaceDescriptor(space));
  const ids = new Set();
  for (const space of normalized) {
    if (ids.has(space.id)) throw new RangeError("Duplicate Space id: " + space.id);
    ids.add(space.id);
  }
  ensureOnePersistentSpace(normalized);

  const requestedActive = activeSpaceId ?? normalized[0].id;
  if (!ids.has(requestedActive)) {
    throw new RangeError("Active Space does not exist: " + requestedActive);
  }
  return freezeRegistry(normalized, requestedActive);
}

export function addSpace(registry, input) {
  requireRegistry(registry);
  const next = createSpaceDescriptor(input);
  if (registry.spaces.some((space) => space.id === next.id)) {
    throw new RangeError("Space already exists: " + next.id);
  }
  return freezeRegistry([...registry.spaces, next], registry.activeSpaceId);
}

export function activateSpace(registry, id) {
  requireRegistry(registry);
  if (findSpaceIndex(registry.spaces, id) === -1) {
    throw new RangeError("Cannot activate unknown Space: " + id);
  }
  return freezeRegistry(registry.spaces, id);
}

export function updateSpace(registry, id, changes) {
  requireRegistry(registry);
  const patch = requireRecord(changes, "Space changes");
  if (Object.hasOwn(patch, "private")) {
    throw new RangeError("Space privacy mode cannot be changed after creation");
  }
  return replaceSpace(registry, id, patch);
}

export function addTabToSpace(registry, spaceId, tab) {
  requireRegistry(registry);
  const space = registry.spaces.find((item) => item.id === spaceId);
  if (!space) throw new RangeError("Unknown Space: " + spaceId);
  const next = normalizeTabs([tab])[0];
  if (space.tabs.some((item) => item.id === next.id)) {
    throw new RangeError("Tab already exists in Space: " + next.id);
  }
  return replaceSpace(registry, spaceId, { tabs: [...space.tabs, next] });
}

export function removeTabFromSpace(registry, spaceId, tabId) {
  return removeCollectionEntry(registry, spaceId, "tabs", tabId, "tab");
}

export function addPinToSpace(registry, spaceId, pin) {
  requireRegistry(registry);
  const space = registry.spaces.find((item) => item.id === spaceId);
  if (!space) throw new RangeError("Unknown Space: " + spaceId);
  const next = normalizePins([pin])[0];
  if (space.pins.some((item) => item.id === next.id)) {
    throw new RangeError("Pin already exists in Space: " + next.id);
  }
  return replaceSpace(registry, spaceId, { pins: [...space.pins, next] });
}

export function removePinFromSpace(registry, spaceId, pinId) {
  return removeCollectionEntry(registry, spaceId, "pins", pinId, "pin");
}

export function addFolderToSpace(registry, spaceId, folder) {
  requireRegistry(registry);
  const space = registry.spaces.find((item) => item.id === spaceId);
  if (!space) throw new RangeError("Unknown Space: " + spaceId);
  const next = normalizeFolders([folder])[0];
  if (space.folders.some((item) => item.id === next.id)) {
    throw new RangeError("Folder already exists in Space: " + next.id);
  }
  return replaceSpace(registry, spaceId, { folders: [...space.folders, next] });
}

export function removeFolderFromSpace(registry, spaceId, folderId) {
  return removeCollectionEntry(registry, spaceId, "folders", folderId, "folder");
}

export function removeSpace(registry, id) {
  requireRegistry(registry);
  if (findSpaceIndex(registry.spaces, id) === -1) throw new RangeError("Cannot remove unknown Space: " + id);
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
 * Return only data allowed to survive an application restart.
 * Private Spaces and all their tabs/pins/folders are always omitted.
 */
export function toPersistedSpaceSnapshot(registry) {
  requireRegistry(registry);
  const spaces = registry.spaces
    .filter((space) => !space.private)
    .map(({ id, name, mood, contentBlocking, tabs, pins, folders }) => Object.freeze({
      id,
      name,
      mood,
      contentBlocking,
      tabs,
      pins,
      folders,
    }));

  const activeSpaceId = spaces.some((space) => space.id === registry.activeSpaceId)
    ? registry.activeSpaceId
    : spaces[0]?.id ?? null;

  return Object.freeze({
    activeSpaceId,
    spaces: Object.freeze(spaces),
  });
}
