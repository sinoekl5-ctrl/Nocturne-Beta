import test from "node:test";
import assert from "node:assert/strict";
import {
  SPACE_MOODS,
  CONTENT_BLOCKING_MODES,
  createSpaceDescriptor,
  createSpaceRegistry,
  addSpace,
  activateSpace,
  updateSpace,
  removeSpace,
  closePrivateSpaces,
  toPersistedSpaceSnapshot,
} from "../browser-core/spaces.mjs";

test("Space descriptors validate names, IDs, moods and blocking modes", () => {
  const space = createSpaceDescriptor({
    id: "client-work",
    name: "Client Work",
    mood: "gambit",
    contentBlocking: "strict",
  });
  assert.equal(space.id, "client-work");
  assert.equal(space.mood, "gambit");
  assert.equal(space.contentBlocking, "strict");
  assert.deepEqual(SPACE_MOODS, ["atelier", "gambit", "vigil", "drift", "ember"]);
  assert.deepEqual(CONTENT_BLOCKING_MODES, ["off", "balanced", "strict"]);

  assert.throws(() => createSpaceDescriptor({ id: "../bad", name: "Bad" }), /identifier/);
  assert.throws(() => createSpaceDescriptor({ id: "good", name: " " }), /Space name/);
  assert.throws(() => createSpaceDescriptor({ id: "good", name: "Good", mood: "neon" }), /Unknown Space mood/);
  assert.throws(() => createSpaceDescriptor({ id: "good", name: "Good", contentBlocking: "maximum" }), /Unknown content-blocking mode/);
});

test("registry starts with one persistent Atelier Space", () => {
  const registry = createSpaceRegistry();
  assert.equal(registry.activeSpaceId, "atelier");
  assert.equal(registry.spaces.length, 1);
  assert.equal(registry.spaces[0].private, false);
  assert.equal(registry.spaces[0].dataPolicy.storage, "persistent-profile");
});

test("registry rejects duplicate IDs and a collection made only of private Spaces", () => {
  assert.throws(() => createSpaceRegistry({
    spaces: [
      { id: "same", name: "One" },
      { id: "same", name: "Two" },
    ],
  }), /Duplicate Space id/);

  assert.throws(() => createSpaceRegistry({
    spaces: [{ id: "vigil", name: "Vigil", private: true, mood: "vigil" }],
  }), /At least one non-private Space/);
});

test("adding and activating Spaces returns new immutable registry state", () => {
  const original = createSpaceRegistry();
  const withResearch = addSpace(original, {
    id: "research",
    name: "Research",
    mood: "gambit",
    contentBlocking: "strict",
  });

  assert.equal(original.spaces.length, 1);
  assert.equal(withResearch.spaces.length, 2);
  assert.equal(withResearch.activeSpaceId, "atelier");
  assert.equal(Object.isFrozen(withResearch), true);
  assert.equal(Object.isFrozen(withResearch.spaces), true);
  assert.throws(() => addSpace(withResearch, { id: "research", name: "Duplicate" }), /already exists/);

  const active = activateSpace(withResearch, "research");
  assert.equal(active.activeSpaceId, "research");
  assert.equal(withResearch.activeSpaceId, "atelier");
  assert.throws(() => activateSpace(active, "missing"), /unknown Space/i);
});

test("updates are scoped to one Space and privacy mode cannot be silently converted", () => {
  let registry = createSpaceRegistry();
  registry = addSpace(registry, { id: "home", name: "Home", mood: "ember" });
  const updated = updateSpace(registry, "home", { name: "Home & Saved", mood: "drift", contentBlocking: "off" });

  assert.equal(updated.spaces.find((space) => space.id === "home").name, "Home & Saved");
  assert.equal(updated.spaces.find((space) => space.id === "home").mood, "drift");
  assert.equal(updated.spaces.find((space) => space.id === "atelier").mood, "atelier");
  assert.equal(updated.spaces.find((space) => space.id === "home").contentBlocking, "off");
  assert.throws(() => updateSpace(updated, "home", { private: true }), /cannot be changed/);
  assert.throws(() => updateSpace(updated, "missing", { name: "Nope" }), /unknown Space/i);
});

test("Private Space policy is temporary, history-free, non-syncing and relocks on blur", () => {
  const registry = addSpace(createSpaceRegistry(), {
    id: "private-room",
    name: "Private room",
    mood: "vigil",
    private: true,
  });
  const privateSpace = registry.spaces.find((space) => space.id === "private-room");
  assert.equal(privateSpace.dataPolicy.storage, "temporary");
  assert.equal(privateSpace.dataPolicy.history, "disabled");
  assert.equal(privateSpace.dataPolicy.sync, "disabled-in-v1");
  assert.equal(privateSpace.dataPolicy.clearOnClose, true);
  assert.equal(privateSpace.dataPolicy.relockOnBlur, true);
});

test("private Spaces are never included in persisted snapshots", () => {
  let registry = createSpaceRegistry();
  registry = addSpace(registry, { id: "research", name: "Research", mood: "gambit" });
  registry = addSpace(registry, { id: "private-room", name: "Private", private: true, mood: "vigil" });
  registry = activateSpace(registry, "private-room");

  const snapshot = toPersistedSpaceSnapshot(registry);
  assert.equal(snapshot.activeSpaceId, "atelier");
  assert.deepEqual(snapshot.spaces.map((space) => space.id), ["atelier", "research"]);
  assert.equal(snapshot.spaces.some((space) => space.private), false);
  assert.equal(registry.activeSpaceId, "private-room");
});

test("removing the active Space selects a remaining persistent Space", () => {
  let registry = createSpaceRegistry();
  registry = addSpace(registry, { id: "research", name: "Research", mood: "gambit" });
  registry = activateSpace(registry, "research");
  const removed = removeSpace(registry, "research");

  assert.equal(removed.activeSpaceId, "atelier");
  assert.deepEqual(removed.spaces.map((space) => space.id), ["atelier"]);
  assert.throws(() => removeSpace(removed, "atelier"), /At least one non-private Space/);
  assert.throws(() => removeSpace(removed, "missing"), /unknown Space/i);
});

test("closing Private Spaces removes all temporary rooms and recovers active Space", () => {
  let registry = createSpaceRegistry();
  registry = addSpace(registry, { id: "research", name: "Research", mood: "gambit" });
  registry = addSpace(registry, { id: "private-one", name: "Private one", private: true, mood: "vigil" });
  registry = addSpace(registry, { id: "private-two", name: "Private two", private: true, mood: "vigil" });
  registry = activateSpace(registry, "private-two");

  const closed = closePrivateSpaces(registry);
  assert.deepEqual(closed.spaces.map((space) => space.id), ["atelier", "research"]);
  assert.equal(closed.activeSpaceId, "atelier");
  assert.equal(registry.spaces.length, 4);
});


test("tabs, pins, and folders belong to one Space and do not leak to another", async () => {
  const {
    addTabToSpace,
    addPinToSpace,
    addFolderToSpace,
    removeTabFromSpace,
    removePinFromSpace,
    removeFolderFromSpace,
  } = await import("../browser-core/spaces.mjs");

  let registry = createSpaceRegistry();
  registry = addSpace(registry, { id: "research", name: "Research", mood: "gambit" });
  registry = addTabToSpace(registry, "research", {
    id: "paper", title: "Source paper", url: "https://example.org/paper", sleeping: true,
  });
  registry = addPinToSpace(registry, "research", {
    id: "journal", title: "Journal", url: "https://example.org/journal",
  });
  registry = addFolderToSpace(registry, "research", { id: "reading-list", name: "Reading list" });

  const atelier = registry.spaces.find((space) => space.id === "atelier");
  const research = registry.spaces.find((space) => space.id === "research");
  assert.equal(atelier.tabs.length, 0);
  assert.equal(atelier.pins.length, 0);
  assert.equal(atelier.folders.length, 0);
  assert.equal(research.tabs[0].title, "Source paper");
  assert.equal(research.tabs[0].sleeping, true);
  assert.equal(research.pins[0].id, "journal");
  assert.equal(research.folders[0].name, "Reading list");

  registry = removeTabFromSpace(registry, "research", "paper");
  registry = removePinFromSpace(registry, "research", "journal");
  registry = removeFolderFromSpace(registry, "research", "reading-list");
  assert.equal(registry.spaces.find((space) => space.id === "research").tabs.length, 0);
  assert.equal(registry.spaces.find((space) => space.id === "research").pins.length, 0);
  assert.equal(registry.spaces.find((space) => space.id === "research").folders.length, 0);
});

test("collection IDs are unique within a Space and removals fail for missing entries", async () => {
  const { addTabToSpace, removeTabFromSpace } = await import("../browser-core/spaces.mjs");
  let registry = createSpaceRegistry();
  registry = addTabToSpace(registry, "atelier", { id: "one", title: "One", url: "https://example.com" });
  assert.throws(() => addTabToSpace(registry, "atelier", { id: "one", title: "Duplicate", url: "https://example.net" }), /already exists/);
  assert.throws(() => removeTabFromSpace(registry, "atelier", "missing"), /Unknown tab/);
});

test("persistent snapshots include persistent Space collections but never private collections", async () => {
  const { addTabToSpace } = await import("../browser-core/spaces.mjs");
  let registry = createSpaceRegistry();
  registry = addSpace(registry, { id: "vigil-room", name: "Vigil", mood: "vigil", private: true });
  registry = addTabToSpace(registry, "atelier", { id: "saved-tab", title: "Saved", url: "https://example.com" });
  registry = addTabToSpace(registry, "vigil-room", { id: "private-tab", title: "Private", url: "https://private.example" });

  const snapshot = toPersistedSpaceSnapshot(registry);
  const persistent = snapshot.spaces.find((space) => space.id === "atelier");
  assert.equal(persistent.tabs[0].id, "saved-tab");
  assert.equal(snapshot.spaces.some((space) => space.id === "vigil-room"), false);
  assert.equal(JSON.stringify(snapshot).includes("private-tab"), false);
});


test("tabs retain their folder association within the owning Space", async () => {
  const { addTabToSpace } = await import("../browser-core/spaces.mjs");
  let registry = createSpaceRegistry({
    spaces: [{
      id: "atelier", name: "Atelier",
      folders: [{ id: "today", name: "Today" }, { id: "reading", name: "Reading" }],
    }],
  });
  registry = addTabToSpace(registry, "atelier", {
    id: "book", title: "A book", url: "book.local", folderId: "reading",
  });
  const tab = registry.spaces[0].tabs[0];
  assert.equal(tab.folderId, "reading");
});
