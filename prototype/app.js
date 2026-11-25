import { buildSuggestions, createSpaceState, SPACE_MOODS } from "./core.mjs";
import { CLEAN_LINK_MODES } from "../browser-core/url-cleaner.mjs";
import {
  CONTENT_BLOCKING_MODES,
  createSpaceRegistry,
  addSpace,
  activateSpace,
  updateSpace,
  addTabToSpace,
  addPinToSpace,
  addFolderToSpace,
} from "../browser-core/spaces.mjs";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const root = document.documentElement;
const state = {
  mood: "atelier",
  spaceRegistry: createSpaceRegistry({
    spaces: [
      {
        id: "atelier", name: "Atelier", mood: "atelier",
        folders: [{ id: "today", name: "Today" }, { id: "reading", name: "Reading" }],
        tabs: [
          { id: "studio", title: "The quiet work of making", url: "studio.preview", folderId: "today" },
          { id: "atlas", title: "Atlas of small ideas", url: "atlas.preview", folderId: "today" },
          { id: "weather", title: "Weather & light", url: "weather.preview", folderId: "today", sleeping: true },
          { id: "essay", title: "A room of one's own", url: "essay.preview", folderId: "reading" },
        ],
        pins: [
          { id: "field-notes", title: "Field Notes", url: "notes.local" },
          { id: "library", title: "Library", url: "library.local" },
          { id: "studio-pin", title: "Studio", url: "studio.local" },
          { id: "archive", title: "Archive", url: "archive.local" },
        ],
      },
      { id: "gambit", name: "Gambit", mood: "gambit", folders: [{ id: "research", name: "Research" }] },
      { id: "vigil", name: "Vigil", mood: "vigil", private: true, folders: [{ id: "private-session", name: "Private Session" }] },
      { id: "drift", name: "Drift", mood: "drift", folders: [{ id: "media", name: "Media" }] },
      { id: "ember", name: "Ember", mood: "ember", folders: [{ id: "saved", name: "Saved" }] },
    ],
    activeSpaceId: "atelier",
  }),
  theme: "night",
  cleanLinksMode: "suggest",
  highContrast: false,
  reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  rtl: false,
  language: "en",
  texture: true,
  split: false,
  private: false,
  reading: false,
  activeTab: "studio",
  activePane: 1,
  folders: { Today: true, Reading: true },
  folderExpansion: { atelier: { today: true, reading: true } },
};

const moodCopy = {
  atelier: { label: "Atelier", accent: "ember", overline: "NOTES FROM THE STUDIO", title: "The quiet work", subtitle: "On attention, small rituals, and leaving a little room for the unexpected." },
  gambit: { label: "Gambit", accent: "parchment", overline: "RESEARCH / OPEN QUESTIONS", title: "The shape of a question", subtitle: "A study in patience, evidence, and the space between two possible answers." },
  vigil: { label: "Vigil", accent: "bone", overline: "PRIVATE / LOCAL ONLY", title: "A room that forgets", subtitle: "A private Space is a temporary room. This screen demonstrates the idea; it is not a secure browser profile." },
  drift: { label: "Drift", accent: "wind", overline: "NOTES ON MOVEMENT", title: "A little room to wander", subtitle: "Follow the thread without losing the place you started from." },
  ember: { label: "Ember", accent: "ember", overline: "HOME / SAVED THINGS", title: "Keep what matters", subtitle: "A few saved things, close at hand. The rest can settle into the dark." },
};

const commandItems = [
  { id: "studio", title: "The quiet work of making", subtitle: "Current tab · studio.preview", url: "studio.preview", kind: "tab", reason: "Current tab" },
  { id: "atlas", title: "Atlas of small ideas", subtitle: "atlas.preview", url: "atlas.preview", kind: "tab" },
  { id: "weather", title: "Weather & light", subtitle: "weather.preview · Sleeping", url: "weather.preview", kind: "tab" },
  { id: "essay", title: "A room of one's own", subtitle: "reading.preview", url: "reading.preview", kind: "tab" },
  { id: "settings", title: "Open preferences", subtitle: "Change appearance, motion, and layout", kind: "action", action: "settings", reason: "Action" },
  { id: "spaces", title: "Change Space", subtitle: "Atelier, Gambit, Vigil, Drift, Ember", kind: "action", action: "spaces", reason: "Action" },
  { id: "split", title: "Toggle split view", subtitle: "Show two pages side by side", kind: "action", action: "split", reason: "Action" },
  { id: "private", title: "Enter private room", subtitle: "Temporary session concept", kind: "action", action: "private", reason: "Action" },
];

let suggestions = [];
let selectedSuggestion = 0;
let toastTimer;

function announce(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 3400);
}

function getActiveSpace() {
  return state.spaceRegistry.spaces.find((space) => space.id === state.spaceRegistry.activeSpaceId);
}

function renderSpaceCollections() {
  const active = getActiveSpace();
  if (!active) return;

  const pinGrid = $("#pinGrid");
  pinGrid.replaceChildren();
  active.pins.forEach((item) => {
    const pin = document.createElement("button");
    pin.type = "button";
    pin.className = "pin-tile";
    pin.dataset.pinId = item.id;
    pin.dataset.page = item.title;
    pin.dataset.url = item.url;
    const glyph = document.createElement("span");
    glyph.className = "pin-glyph glyph-new";
    glyph.textContent = "✳";
    const label = document.createElement("span");
    label.textContent = item.title;
    pin.append(glyph, label);
    pin.addEventListener("click", () => setPreviewPage(
      item.title,
      item.url,
      "PINNED PLACE",
      "A local preview for " + item.title + ". Website navigation is not connected.",
    ));
    pinGrid.append(pin);
  });

  const tabList = $("#tabList");
  tabList.replaceChildren();
  const expansion = state.folderExpansion[active.id] ?? {};
  active.folders.forEach((folder, index) => {
    const group = document.createElement("div");
    group.className = "tab-group";
    const folderTabs = active.tabs.filter((tab) =>
      tab.folderId === folder.id || (tab.folderId == null && index === 0)
    );

    const header = document.createElement("button");
    header.type = "button";
    header.className = "folder-row";
    header.dataset.folder = folder.id;
    const isExpanded = expansion[folder.id] !== false;
    header.setAttribute("aria-expanded", String(isExpanded));
    const chevron = document.createElement("span");
    chevron.className = "chevron";
    chevron.textContent = isExpanded ? "⌄" : "›";
    const name = document.createElement("span");
    name.textContent = folder.name;
    const count = document.createElement("span");
    count.className = "folder-count";
    count.textContent = String(folderTabs.length);
    header.append(chevron, name, count);

    const children = document.createElement("div");
    children.className = "folder-children";
    children.dataset.folderChildren = folder.id;
    children.hidden = !isExpanded;

    header.addEventListener("click", () => {
      state.folderExpansion[active.id] ??= {};
      const nextExpanded = !state.folderExpansion[active.id][folder.id] && state.folderExpansion[active.id][folder.id] !== undefined
        ? true
        : state.folderExpansion[active.id][folder.id] === undefined
          ? false
          : !state.folderExpansion[active.id][folder.id];
      state.folderExpansion[active.id][folder.id] = nextExpanded;
      header.setAttribute("aria-expanded", String(nextExpanded));
      chevron.textContent = nextExpanded ? "⌄" : "›";
      children.hidden = !nextExpanded;
    });

    folderTabs.forEach((tabData) => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "tab-row";
      row.dataset.tabId = tabData.id;
      row.dataset.url = tabData.url;
      const favicon = document.createElement("span");
      favicon.className = "tab-favicon favicon-new";
      favicon.textContent = tabData.title.slice(0, 1).toUpperCase();
      const title = document.createElement("span");
      title.className = "tab-title";
      title.textContent = tabData.title;
      row.append(favicon, title);
      if (tabData.sleeping) {
        const sleeping = document.createElement("span");
        sleeping.className = "sleeping-mark";
        sleeping.title = "Sleeping tab";
        sleeping.textContent = "☾";
        row.append(sleeping);
      }
      row.addEventListener("click", () => setActiveTab(tabData.id));
      children.append(row);
    });

    group.append(header, children);
    tabList.append(group);
  });

  const newTabRow = document.createElement("button");
  newTabRow.type = "button";
  newTabRow.className = "new-tab-row";
  newTabRow.id = "newTab";
  const plus = document.createElement("span");
  plus.textContent = "＋";
  const label = document.createElement("span");
  label.textContent = "New tab";
  const shortcut = document.createElement("kbd");
  shortcut.textContent = "⌘ T";
  newTabRow.append(plus, label, shortcut);
  newTabRow.addEventListener("click", addTab);
  tabList.append(newTabRow);

  updateTabCounts();
  if (active.tabs.some((tab) => tab.id === state.activeTab)) {
    setActiveTab(state.activeTab);
  } else if (active.tabs.length) {
    setActiveTab(active.tabs[0].id);
  } else {
    state.activeTab = "";
  }
}

function renderSpaceSwitcher() {
  const nav = $("#spaceSwitcher");
  nav.replaceChildren();
  state.spaceRegistry.spaces.forEach((space, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `space-chip${space.id === state.spaceRegistry.activeSpaceId ? " selected" : ""}`;
    button.dataset.spaceId = space.id;
    button.dataset.mood = space.mood;
    button.setAttribute("aria-pressed", String(space.id === state.spaceRegistry.activeSpaceId));

    const dot = document.createElement("span");
    dot.className = `space-dot dot-${space.mood}`;
    const label = document.createElement("span");
    label.textContent = space.name;
    button.append(dot, label);

    const shortcut = document.createElement("span");
    shortcut.className = "space-shortcut";
    shortcut.textContent = index < 5 ? String(index + 1) : "";
    button.append(shortcut);
    button.addEventListener("click", () => setActiveSpace(space.id));
    nav.append(button);
  });
}

function setActiveSpace(spaceId) {
  const nextSpace = state.spaceRegistry.spaces.find((space) => space.id === spaceId);
  if (!nextSpace) return;
  state.spaceRegistry = activateSpace(state.spaceRegistry, spaceId);
  state.mood = nextSpace.mood;
  state.private = nextSpace.private;
  root.dataset.mood = nextSpace.mood;
  renderSpaceSwitcher();
  state.activeTab = nextSpace.tabs[0]?.id ?? "";
  renderSpaceCollections();

  const mood = nextSpace.mood;
  $("#breadcrumbSpace").textContent = nextSpace.name;
  $("#articleKicker").textContent = moodCopy[mood].overline;
  $("#articleTitle").innerHTML = `${escapeHtml(moodCopy[mood].title)}<br><em>${mood === "atelier" ? "of making" : mood === "gambit" ? "worth keeping" : mood === "vigil" ? "for yourself" : mood === "drift" ? "without hurry" : "close by"}</em>`;
  $("#articleDeck").textContent = moodCopy[mood].subtitle;
  $("#statusMood").textContent = `${mood.toUpperCase()} / ${state.theme.toUpperCase()}`;
  $("#pageUrl").textContent = `nocturne.preview / ${nextSpace.id}`;
  $("#privateToggle").setAttribute("aria-pressed", String(state.private));
  $("#privateStatus").textContent = state.private ? "On" : "Off";
  $("#privateToggle").classList.toggle("private-on", state.private);
  $("#contentBlockingSetting").value = nextSpace.contentBlocking;

  if (state.private) announce("Private room preview. Temporary storage is not enforced until Chromium profile isolation is implemented.");
}

function setMood(mood) {
  if (!SPACE_MOODS.includes(mood)) return;
  const matching = state.spaceRegistry.spaces.find((space) => space.mood === mood);
  if (matching) setActiveSpace(matching.id);
}

function setTheme(theme) {
  state.theme = theme === "day" ? "day" : "night";
  root.dataset.theme = state.theme;
  $("#themeToggle").textContent = state.theme === "night" ? "☼" : "☾";
  $("#statusMood").textContent = `${state.mood.toUpperCase()} / ${state.theme.toUpperCase()}`;
  $("#daySetting").setAttribute("aria-checked", String(state.theme === "day"));
}

function setHighContrast(enabled) {
  state.highContrast = Boolean(enabled);
  root.classList.toggle("high-contrast", state.highContrast);
  $("#contrastSetting").setAttribute("aria-checked", String(state.highContrast));
}

function setReducedMotion(enabled) {
  state.reducedMotion = Boolean(enabled);
  root.classList.toggle("reduced-motion", state.reducedMotion);
  $("#motionSetting").setAttribute("aria-checked", String(state.reducedMotion));
}

function setRTL(enabled, announceChange = true) {
  state.rtl = Boolean(enabled);
  root.dir = state.rtl ? "rtl" : "ltr";
  $("#rtlSetting").setAttribute("aria-checked", String(state.rtl));
  if (announceChange) announce(state.rtl ? "RTL layout preview enabled." : "Left-to-right layout restored.");
}

function setLanguage(language) {
  state.language = language === "ar" ? "ar" : "en";
  root.lang = state.language;
  const arabic = state.language === "ar";
  const labels = arabic ? {
    pins: "المثبتات", tabs: "علامات التبويب", today: "اليوم", reading: "للقراءة",
    newTab: "علامة تبويب جديدة", spaces: "المساحات", privateRoom: "مساحة خاصة",
    preferences: "التفضيلات", search: "ابحث أو اكتب عنوانًا", status: "نموذج مرئي · لا توجد طلبات شبكة",
    phase: "المرحلة 2 · دراسة مرئية", appearance: "المظهر", layout: "التخطيط", privacy: "الخصوصية",
    day: "دراسة النهار", dayDesc: "ألوان ورقية دافئة لضوء النهار.", contrast: "تباين مرتفع",
    contrastDesc: "حدود أوضح، من دون حبيبات أو تظليل.", motion: "تقليل الحركة",
    motionDesc: "استبدال الانتقالات بالتلاشي الهادئ.", language: "الواجهة العربية",
    languageDesc: "معاينة التسميات العربية واتجاه الواجهة من اليمين إلى اليسار.",
    mirror: "عكس موضع الشريط الجانبي", mirrorDesc: "مفيد للقراءة من اليمين إلى اليسار.",
    texture: "الملمس", textureDesc: "حبيبات خفيفة على واجهة المتصفح فقط.",
    local: "معاينة محلية", localDesc: "هذا النموذج لا يفتح مواقع حقيقية ولا ينشئ ملفات تعريف معزولة.",
    cleanLinks: "تنظيف الروابط", cleanLinksDesc: "اقترح إزالة معرّفات التتبع المعروفة من الروابط.",
    contentBlocking: "حظر المحتوى", contentBlockingDesc: "إعداد مستقل لهذه المساحة؛ الحظر الفعلي يتطلب محرك Chromium.", done: "تم",
    settingsTitle: "شكّل مساحتك.", settingsKicker: "نوكتورن / التفضيلات", commandPlaceholder: "ابحث في علامات التبويب أو اكتب أمرًا…", commandLabel: "ابحث أو أدخل أمرًا"
  } : {
    pins: "PINS", tabs: "TABS", today: "Today", reading: "Reading", newTab: "New tab",
    spaces: "SPACES", privateRoom: "Private room", preferences: "Preferences",
    search: "Search or enter an address", status: "Prototype state · no network requests",
    phase: "PHASE 2 · VISUAL STUDY", appearance: "APPEARANCE", layout: "LAYOUT", privacy: "PRIVACY",
    day: "Day Study", dayDesc: "A warm paper palette for daylight.", contrast: "High contrast",
    contrastDesc: "Sharper outlines, no grain or vignette.", motion: "Reduce motion",
    motionDesc: "Replace sweeps with quiet fades.", language: "Arabic interface",
    languageDesc: "Preview Arabic labels and right-to-left chrome.",
    mirror: "Mirror sidebar", mirrorDesc: "Useful for Arabic and right-to-left reading.",
    texture: "Texture", textureDesc: "Subtle grain on browser chrome only.",
    local: "Local preview", localDesc: "This prototype does not visit websites or create isolated browser profiles.",
    cleanLinks: "Clean links", cleanLinksDesc: "Choose whether known tracking parameters are suggested or removed in this preview.",
    contentBlocking: "Content blocking", contentBlockingDesc: "A per-Space preference; actual filtering requires the Chromium engine.", done: "Done",
    settingsTitle: "Shape the room.", settingsKicker: "NOCTURNE / PREFERENCES", commandPlaceholder: "Search tabs, pages, or enter a command…", commandLabel: "Search or enter a command"
  };
  $("#pinsHeading").textContent = labels.pins;
  $("#tabsHeading").textContent = labels.tabs;
  $("#spacesHeading").textContent = labels.spaces;
  $(".folder-row[data-folder='Today'] > span:nth-child(2)").textContent = labels.today;
  $(".folder-row[data-folder='Reading'] > span:nth-child(2)").textContent = labels.reading;
  $("#newTab > span:nth-child(2)").textContent = labels.newTab;
  $("#privateLabel").textContent = labels.privateRoom;
  $("#preferencesLabel").textContent = labels.preferences;
  $("#omniboxButton .omnibox-label").textContent = labels.search;
  $("#statusLabel").textContent = labels.status;
  $("#phaseLabel").textContent = labels.phase;
  $("#appearanceGroupLabel").textContent = labels.appearance;
  $("#layoutGroupLabel").textContent = labels.layout;
  $("#privacyGroupLabel").textContent = labels.privacy;
  $("#dayLabel").textContent = labels.day;
  $("#dayDescription").textContent = labels.dayDesc;
  $("#contrastLabel").textContent = labels.contrast;
  $("#contrastDescription").textContent = labels.contrastDesc;
  $("#motionLabel").textContent = labels.motion;
  $("#motionDescription").textContent = labels.motionDesc;
  $("#languageLabel").textContent = labels.language;
  $("#languageDescription").textContent = labels.languageDesc;
  $("#mirrorLabel").textContent = labels.mirror;
  $("#mirrorDescription").textContent = labels.mirrorDesc;
  $("#textureLabel").textContent = labels.texture;
  $("#textureDescription").textContent = labels.textureDesc;
  $("#localLabel").textContent = labels.local;
  $("#localDescription").textContent = labels.localDesc;
  $("#cleanLinksLabel").textContent = labels.cleanLinks;
  $("#cleanLinksDescription").textContent = labels.cleanLinksDesc;
  $("#contentBlockingLabel").textContent = labels.contentBlocking;
  $("#contentBlockingDescription").textContent = labels.contentBlockingDesc;
  $("#doneSettings").textContent = labels.done;
  $("#settingsTitle").textContent = labels.settingsTitle;
  $("#settingsKicker").textContent = labels.settingsKicker;
  $("#commandInput").placeholder = labels.commandPlaceholder;
  $("#commandTitle").textContent = labels.commandLabel;
  $("#languageSetting").setAttribute("aria-checked", String(arabic));
  setRTL(arabic, false);
  announce(arabic ? "تم تفعيل معاينة الواجهة العربية." : "English interface preview enabled.");
}

function setTexture(enabled) {
  state.texture = Boolean(enabled);
  root.classList.toggle("no-texture", !state.texture);
  $("#textureSetting").setAttribute("aria-checked", String(state.texture));
}

function setSplit(enabled) {
  state.split = Boolean(enabled);
  $("#secondPane").hidden = !state.split;
  $("#splitDivider").classList.toggle("visible", state.split);
  $("#splitToggle").classList.toggle("is-active", state.split);
  $("#splitToggle").setAttribute("aria-pressed", String(state.split));
  $("#pageContentGrid").classList.toggle("split-active", state.split);
  announce(state.split ? "Split view preview opened." : "Split view closed.");
}

function setReading(enabled) {
  state.reading = Boolean(enabled);
  $("#webPage").classList.toggle("reading-mode", state.reading);
  $("#readingToggle").classList.toggle("is-active", state.reading);
  $("#readingToggle").setAttribute("aria-pressed", String(state.reading));
  announce(state.reading ? "Reading mode preview." : "Standard page view.");
}

function setCleanLinksMode(mode) {
  state.cleanLinksMode = CLEAN_LINK_MODES.includes(mode) ? mode : "suggest";
  $("#cleanLinksSetting").value = state.cleanLinksMode;
  if ($("#commandDialog").open) renderSuggestions($("#commandInput").value);
  announce(`Clean Links preview mode: ${state.cleanLinksMode}.`);
}

function openDialog(dialog) {
  if (!dialog.open) dialog.showModal();
}

function closeDialog(id) {
  const dialog = document.getElementById(id);
  if (dialog?.open) dialog.close();
}

function openSettings() {
  openDialog($("#settingsDialog"));
}

function openCommand() {
  const dialog = $("#commandDialog");
  openDialog(dialog);
  $("#commandInput").value = "";
  renderSuggestions("");
  requestAnimationFrame(() => $("#commandInput").focus());
}

function renderSuggestions(query) {
  suggestions = buildSuggestions(query, commandItems, { cleanLinksMode: state.cleanLinksMode });
  selectedSuggestion = 0;
  const results = $("#commandResults");
  results.replaceChildren();
  if (!suggestions.length) {
    const empty = document.createElement("div");
    empty.className = "command-empty";
    empty.textContent = "Nothing here yet. Try a tab name or a simple calculation.";
    results.append(empty);
    return;
  }
  suggestions.forEach((item, index) => {
    const row = document.createElement("button");
    row.className = `command-result${index === selectedSuggestion ? " selected" : ""}`;
    row.type = "button";
    row.role = "option";
    row.setAttribute("aria-selected", String(index === selectedSuggestion));
    row.dataset.index = String(index);
    const glyph = document.createElement("span");
    glyph.className = `result-glyph result-${item.kind}`;
    glyph.textContent = item.kind === "calculator" ? "=" : item.kind === "clean-link" ? "✓" : item.kind === "address" ? "↗" : item.kind === "action" ? "⌘" : "◦";
    const copy = document.createElement("span");
    copy.className = "result-copy";
    const title = document.createElement("strong");
    title.textContent = item.title;
    const subtitle = document.createElement("small");
    subtitle.textContent = item.subtitle ?? "";
    copy.append(title, subtitle);
    const reason = document.createElement("span");
    reason.className = "result-reason";
    reason.textContent = item.reason ?? "";
    row.append(glyph, copy, reason);
    row.addEventListener("click", () => chooseSuggestion(index));
    results.append(row);
  });
}

function moveSuggestion(direction) {
  if (!suggestions.length) return;
  selectedSuggestion = (selectedSuggestion + direction + suggestions.length) % suggestions.length;
  $$(".command-result").forEach((row, index) => {
    const selected = index === selectedSuggestion;
    row.classList.toggle("selected", selected);
    row.setAttribute("aria-selected", String(selected));
  });
  $(".command-result.selected")?.scrollIntoView({ block: "nearest" });
}

function chooseSuggestion(index = selectedSuggestion) {
  const item = suggestions[index];
  if (!item) return;
  closeDialog("commandDialog");
  if (item.kind === "calculator") {
    announce(`${item.subtitle} = ${item.value}`);
  } else if (item.kind === "address" || item.kind === "clean-link") {
    const cleanLinkDeck = item.kind === "clean-link"
      ? `Clean-link suggestion preview. Removed: ${item.removedParameters.join(", ")}. No real website was opened.`
      : "Address navigation is simulated here. Chromium navigation is not connected yet.";
    setPreviewPage(item.value, item.value, item.kind === "clean-link" ? "CLEAN LINK PREVIEW" : "A PAGE PREVIEW", cleanLinkDeck);
  } else if (item.kind === "action") {
    if (item.action === "settings") openSettings();
    if (item.action === "split") setSplit(!state.split);
    if (item.action === "private") togglePrivate();
    if (item.action === "spaces") announce("Choose a Space from the bottom of the sidebar.");
  } else {
    setActiveTab(item.id);
  }
}

function setPreviewPage(title, url, kicker, deck) {
  $("#articleTitle").innerHTML = `${escapeHtml(title)}<br><em>preview</em>`;
  $("#articleKicker").textContent = kicker.toUpperCase();
  $("#articleDeck").textContent = deck;
  $("#pageUrl").textContent = url;
  $("#breadcrumbPage").textContent = title;
  announce("Preview updated. No external website was opened.");
}

function setActiveTab(tabId) {
  const tab = $(`[data-tab-id="${CSS.escape(tabId)}"]`);
  if (!tab) return;
  state.activeTab = tabId;
  $$(".tab-row").forEach((row) => row.classList.toggle("active", row.dataset.tabId === tabId));
  const title = $(".tab-title", tab).textContent;
  $("#breadcrumbPage").textContent = title;
  $("#articleTitle").innerHTML = `${escapeHtml(title)}<br><em>preview</em>`;
  $("#articleKicker").textContent = "LOCAL TAB PREVIEW";
  $("#articleDeck").textContent = "A static tab selection to demonstrate the sidebar and navigation states. Website contents will be supplied by Chromium in the real browser.";
  $("#pageUrl").textContent = `${tabId}.preview`;
}

function createSpaceFromPrompt() {
  const name = window.prompt("Name this Space");
  if (!name?.trim()) return;

  const normalized = name.trim();
  const base = normalized.normalize("NFKD").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 44).replace(/-+$/g, "");
  const prefix = base || "space";
  let id = prefix;
  let suffix = 2;
  while (state.spaceRegistry.spaces.some((space) => space.id === id)) {
    id = `${prefix}-${suffix++}`;
  }

  try {
    state.spaceRegistry = addSpace(state.spaceRegistry, {
      id,
      name: normalized,
      mood: state.mood,
      private: false,
      contentBlocking: "balanced",
      folders: [{ id: "today", name: "Today" }],
    });
    setActiveSpace(id);
    announce(`Space created: ${normalized}. Browser data isolation is not active in this preview.`);
  } catch (error) {
    announce(error instanceof Error ? error.message : "Could not create Space.");
  }
}

function togglePrivate() {
  const current = getActiveSpace();
  if (current?.private) {
    const persistent = state.spaceRegistry.spaces.find((space) => !space.private);
    if (persistent) setActiveSpace(persistent.id);
    announce("Private room preview closed. Real temporary-profile cleanup awaits Chromium integration.");
    return;
  }

  const privateSpace = state.spaceRegistry.spaces.find((space) => space.private);
  if (privateSpace) {
    setActiveSpace(privateSpace.id);
    announce("Private room preview enabled. Real temporary-profile isolation is not implemented yet.");
  } else {
    announce("No Private Space is configured.");
  }
}

function setContentBlockingMode(mode) {
  if (!CONTENT_BLOCKING_MODES.includes(mode)) return;
  const active = getActiveSpace();
  if (!active) return;
  state.spaceRegistry = updateSpace(state.spaceRegistry, active.id, { contentBlocking: mode });
  $("#contentBlockingSetting").value = mode;
  announce(`${active.name}: content blocking set to ${mode} in the preview model.`);
}
function addTab() {
  const active = getActiveSpace();
  if (!active) return;
  let folder = active.folders[0];
  if (!folder) {
    state.spaceRegistry = addFolderToSpace(state.spaceRegistry, active.id, { id: "today", name: "Today" });
    folder = getActiveSpace().folders[0];
  }
  const id = "tab-" + Date.now().toString(36);
  const title = "Untitled " + (active.tabs.length + 1);
  state.spaceRegistry = addTabToSpace(state.spaceRegistry, active.id, {
    id,
    title,
    url: "newtab.local/" + id,
    folderId: folder.id,
  });
  state.activeTab = id;
  renderSpaceCollections();
  setActiveTab(id);
  announce("A new tab was added to " + active.name + ".");
}

function addPin() {
  const active = getActiveSpace();
  if (!active) return;
  const name = window.prompt("Name this pin");
  if (!name?.trim()) return;
  const title = name.trim();
  const base = title.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40).replace(/-+$/g, "") || "pin";
  let id = base;
  let suffix = 2;
  while (active.pins.some((pin) => pin.id === id)) id = base + "-" + suffix++;
  state.spaceRegistry = addPinToSpace(state.spaceRegistry, active.id, {
    id,
    title,
    url: base + ".local",
  });
  renderSpaceCollections();
  announce("Pinned " + title + " in " + active.name + ".");
}

function addFolder() {
  const active = getActiveSpace();
  if (!active) return;
  const name = window.prompt("Name this folder");
  if (!name?.trim()) return;
  const title = name.trim();
  const base = title.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40).replace(/-+$/g, "") || "folder";
  let id = base;
  let suffix = 2;
  while (active.folders.some((folder) => folder.id === id)) id = base + "-" + suffix++;
  state.spaceRegistry = addFolderToSpace(state.spaceRegistry, active.id, { id, name: title });
  state.folderExpansion[active.id] ??= {};
  state.folderExpansion[active.id][id] = true;
  renderSpaceCollections();
  announce("Folder created in " + active.name + ".");
}

function updateTabCounts() {
  const count = $$(".tab-row").length;
  $("#tabCount").textContent = String(count).padStart(2, "0");
  $("#railTabCount").textContent = String(count);
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function bindSwitch(id, handler) {
  const element = document.getElementById(id);
  element.addEventListener("click", () => handler(element.getAttribute("aria-checked") !== "true"));
}

$$(".space-chip").forEach((button) => button.addEventListener("click", () => setMood(button.dataset.mood)));
$$(".folder-row").forEach((button) => button.addEventListener("click", () => {
  const folder = button.dataset.folder;
  state.folders[folder] = !state.folders[folder];
  button.setAttribute("aria-expanded", String(state.folders[folder]));
  $(`[data-folder-children="${CSS.escape(folder)}"]`).hidden = !state.folders[folder];
}));
$$(".tab-row").forEach((button) => button.addEventListener("click", () => setActiveTab(button.dataset.tabId)));
$$(".pin-tile").forEach((button) => button.addEventListener("click", () => setPreviewPage(button.dataset.page, button.dataset.url, "PINNED PLACE", `A local preview for ${button.dataset.page}.`)));

$("#omniboxButton").addEventListener("click", openCommand);
$("#addPin").addEventListener("click", addPin);
$("#addFolder").addEventListener("click", addFolder);
$("#themeToggle").addEventListener("click", () => setTheme(state.theme === "night" ? "day" : "night"));
$("#daySetting").addEventListener("click", () => setTheme(state.theme === "night" ? "day" : "night"));
$("#splitToggle").addEventListener("click", () => setSplit(!state.split));
$("#closeSplit").addEventListener("click", () => setSplit(false));
$("#focusSecondPane").addEventListener("click", () => { state.activePane = 2; announce("Second pane selected."); });
$("#readingToggle").addEventListener("click", () => setReading(!state.reading));
$("#privateToggle").addEventListener("click", togglePrivate);
$("#settingsButton").addEventListener("click", openSettings);
$("#settingsQuick").addEventListener("click", openSettings);
$("#manageSpaces").addEventListener("click", createSpaceFromPrompt);
$("#spaceDetails").addEventListener("click", () => { const active = getActiveSpace(); announce(`${active.name} · ${active.contentBlocking} blocking · ${active.private ? "temporary" : "persistent"} preview`); });
$("#sidebarMenu").addEventListener("click", () => announce("Sidebar docking controls will be connected to the desktop shell."));
$("#pageMenu").addEventListener("click", () => announce("Page actions will be supplied by Chromium."));
$("#copyAddress").addEventListener("click", async () => {
  const value = $("#pageUrl").textContent;
  try { await navigator.clipboard.writeText(value); announce("Preview address copied."); }
  catch { announce(value); }
});
$("#doneSettings").addEventListener("click", () => closeDialog("settingsDialog"));
$("#cleanLinksSetting").addEventListener("change", (event) => setCleanLinksMode(event.target.value));
$("#contentBlockingSetting").addEventListener("change", (event) => setContentBlockingMode(event.target.value));
$$("[data-close]").forEach((button) => button.addEventListener("click", () => closeDialog(button.dataset.close)));
$("#commandInput").addEventListener("input", (event) => renderSuggestions(event.target.value));
$("#commandInput").addEventListener("keydown", (event) => {
  if (event.key === "ArrowDown") { event.preventDefault(); moveSuggestion(1); }
  if (event.key === "ArrowUp") { event.preventDefault(); moveSuggestion(-1); }
  if (event.key === "Enter") { event.preventDefault(); chooseSuggestion(); }
});

bindSwitch("contrastSetting", setHighContrast);
bindSwitch("languageSetting", (enabled) => setLanguage(enabled ? "ar" : "en"));
bindSwitch("motionSetting", setReducedMotion);
bindSwitch("rtlSetting", setRTL);
bindSwitch("textureSetting", setTexture);

$("#commandDialog").addEventListener("click", (event) => {
  if (event.target === $("#commandDialog")) closeDialog("commandDialog");
});
$("#settingsDialog").addEventListener("click", (event) => {
  if (event.target === $("#settingsDialog")) closeDialog("settingsDialog");
});

document.addEventListener("keydown", (event) => {
  const platformModifier = event.metaKey || event.ctrlKey;
  if (platformModifier && event.key.toLowerCase() === "l") { event.preventDefault(); openCommand(); }
  if (platformModifier && event.key.toLowerCase() === "t" && !$("#commandDialog").open) { event.preventDefault(); addTab(); }
  if (event.key === "Escape") {
    if ($("#commandDialog").open) closeDialog("commandDialog");
    if ($("#settingsDialog").open) closeDialog("settingsDialog");
  }
  if (!platformModifier && !event.altKey && !event.shiftKey && !$("input:focus") && /^[1-5]$/.test(event.key)) {
    setMood(SPACE_MOODS[Number(event.key) - 1]);
  }
});

$("#readingToggle").setAttribute("aria-label", "Toggle reading mode");
$("#motionSetting").setAttribute("aria-checked", String(state.reducedMotion));
root.classList.toggle("reduced-motion", state.reducedMotion);
root.classList.toggle("no-texture", !state.texture);
createSpaceState(state.mood); // Confirms the initial Space model is normalized by the shared core.
$("#cleanLinksSetting").value = state.cleanLinksMode;
renderSpaceSwitcher();
renderSpaceCollections();
$("#contentBlockingSetting").value = getActiveSpace().contentBlocking;
updateTabCounts();
