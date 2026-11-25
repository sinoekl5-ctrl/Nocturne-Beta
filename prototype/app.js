import { buildSuggestions, createSpaceState, SPACE_MOODS } from "./core.mjs";
import { cleanTrackingUrl, createUrlCleanerPreferences, getUrlCleanerMode, setUrlCleanerMode } from "../packages/core/url-cleaner.mjs";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const root = document.documentElement;
const CLEANER_STORAGE_KEY = "nocturne.urlCleaner.preferences.v1";

function loadCleanerPreferences() {
  try {
    const saved = window.localStorage.getItem(CLEANER_STORAGE_KEY);
    return createUrlCleanerPreferences(saved ? JSON.parse(saved) : {});
  } catch {
    return createUrlCleanerPreferences();
  }
}

let cleanerPreferences = loadCleanerPreferences();
let pendingCleanerCandidate = null;

const state = {
  mood: "atelier",
  theme: "night",
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

function setMood(mood) {
  if (!SPACE_MOODS.includes(mood)) return;
  state.mood = mood;
  state.private = mood === "vigil";
  hideCleanerSuggestion();
  syncCleanerModeControl();
  root.dataset.mood = mood;
  $$(".space-chip").forEach((button) => {
    const selected = button.dataset.mood === mood;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  $("#breadcrumbSpace").textContent = moodCopy[mood].label;
  $("#articleKicker").textContent = moodCopy[mood].overline;
  $("#articleTitle").innerHTML = `${escapeHtml(moodCopy[mood].title)}<br><em>${mood === "atelier" ? "of making" : mood === "gambit" ? "worth keeping" : mood === "vigil" ? "for yourself" : mood === "drift" ? "without hurry" : "close by"}</em>`;
  $("#articleDeck").textContent = moodCopy[mood].subtitle;
  $("#statusMood").textContent = `${mood.toUpperCase()} / ${state.theme.toUpperCase()}`;
  $("#pageUrl").textContent = `nocturne.preview / ${mood}`;
  $("#privateToggle").setAttribute("aria-pressed", String(state.private));
  $("#privateStatus").textContent = state.private ? "On" : "Off";
  $("#privateToggle").classList.toggle("private-on", state.private);
  if (state.private) announce("Private room preview. This is not an isolated Chromium profile.");
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
    cleaner: "تنظيف روابط التتبع", cleanerDesc: "اختر طريقة التعامل مع معاملات التتبع المعروفة في هذه المساحة.",
    cleanerDisable: "إيقاف", cleanerSuggest: "اقتراح", cleanerAuto: "تنظيف تلقائي",
    preferences: "التفضيلات", search: "ابحث أو اكتب عنوانًا", status: "نموذج مرئي · لا توجد طلبات شبكة",
    phase: "المرحلة 2 · دراسة مرئية", appearance: "المظهر", layout: "التخطيط", privacy: "الخصوصية",
    day: "دراسة النهار", dayDesc: "ألوان ورقية دافئة لضوء النهار.", contrast: "تباين مرتفع",
    contrastDesc: "حدود أوضح، من دون حبيبات أو تظليل.", motion: "تقليل الحركة",
    motionDesc: "استبدال الانتقالات بالتلاشي الهادئ.", language: "الواجهة العربية",
    languageDesc: "معاينة التسميات العربية واتجاه الواجهة من اليمين إلى اليسار.",
    mirror: "عكس موضع الشريط الجانبي", mirrorDesc: "مفيد للقراءة من اليمين إلى اليسار.",
    texture: "الملمس", textureDesc: "حبيبات خفيفة على واجهة المتصفح فقط.",
    local: "معاينة محلية", localDesc: "هذا النموذج لا يفتح مواقع حقيقية ولا ينشئ ملفات تعريف معزولة.", done: "تم",
    settingsTitle: "شكّل مساحتك.", settingsKicker: "نوكتورن / التفضيلات", commandPlaceholder: "ابحث في علامات التبويب أو اكتب أمرًا…", commandLabel: "ابحث أو أدخل أمرًا"
  } : {
    pins: "PINS", tabs: "TABS", today: "Today", reading: "Reading", newTab: "New tab",
    spaces: "SPACES", privateRoom: "Private room", preferences: "Preferences",
    cleaner: "Clean tracking links", cleanerDesc: "Choose how this Space handles known tracking parameters.",
    cleanerDisable: "Disabled", cleanerSuggest: "Suggest", cleanerAuto: "Auto-clean",
    search: "Search or enter an address", status: "Prototype state · no network requests",
    phase: "PHASE 2 · VISUAL STUDY", appearance: "APPEARANCE", layout: "LAYOUT", privacy: "PRIVACY",
    day: "Day Study", dayDesc: "A warm paper palette for daylight.", contrast: "High contrast",
    contrastDesc: "Sharper outlines, no grain or vignette.", motion: "Reduce motion",
    motionDesc: "Replace sweeps with quiet fades.", language: "Arabic interface",
    languageDesc: "Preview Arabic labels and right-to-left chrome.",
    mirror: "Mirror sidebar", mirrorDesc: "Useful for Arabic and right-to-left reading.",
    texture: "Texture", textureDesc: "Subtle grain on browser chrome only.",
    local: "Local preview", localDesc: "This prototype does not visit websites or create isolated browser profiles.", done: "Done",
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
  $("#urlCleanerLabel").textContent = labels.cleaner;
  $("#urlCleanerDescription").textContent = labels.cleanerDesc;
  $("#urlCleanerMode option[value=disable]").textContent = labels.cleanerDisable;
  $("#urlCleanerMode option[value=suggest]").textContent = labels.cleanerSuggest;
  $("#urlCleanerMode option[value=auto]").textContent = labels.cleanerAuto;
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
  suggestions = buildSuggestions(query, commandItems);
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
    glyph.textContent = item.kind === "calculator" ? "=" : item.kind === "address" ? "↗" : item.kind === "action" ? "⌘" : "◦";
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
  } else if (item.kind === "address") {
    const cleaner = cleanTrackingUrl(item.value, { mode: getUrlCleanerMode(cleanerPreferences, state.mood) });
    if (cleaner.shouldSuggest) {
      setPreviewPage(item.value, item.value, "CLEAN LINK SUGGESTION", "The local URL Cleaner found " + cleaner.removedParams.length + " known tracking parameter(s). The original address remains selected; no website was opened.");
      showCleanerSuggestion(cleaner.candidateUrl, cleaner.removedParams);
    } else if (cleaner.mode === "auto" && cleaner.changed) {
      setPreviewPage(cleaner.navigationUrl, cleaner.navigationUrl, "CLEANED ADDRESS PREVIEW", "Removed " + cleaner.removedParams.length + " known tracking parameter(s). This changes only the local preview; Chromium navigation is not connected.");
      announce("Local preview cleaned: removed " + cleaner.removedParams.length + " tracking parameter(s).");
    } else {
      setPreviewPage(item.value, item.value, "A page preview", "Address navigation is simulated here. Chromium navigation is not connected yet.");
      if (cleaner.skippedReason === "signed-url") announce("URL Cleaner left a signed URL unchanged.");
    }
  } else if (item.kind === "action") {
    if (item.action === "settings") openSettings();
    if (item.action === "split") setSplit(!state.split);
    if (item.action === "private") togglePrivate();
    if (item.action === "spaces") announce("Choose a Space from the bottom of the sidebar.");
  } else {
    setActiveTab(item.id);
  }
}

function setCleanerMode(mode) {
  cleanerPreferences = setUrlCleanerMode(cleanerPreferences, state.mood, mode);
  syncCleanerModeControl();
  try {
    window.localStorage.setItem(CLEANER_STORAGE_KEY, JSON.stringify(cleanerPreferences));
  } catch {
    announce(state.language === "ar" ? "تعذر حفظ التفضيل محليًا؛ سيظل التغيير لهذه الجلسة." : "Could not store the cleaner preference locally; it remains active for this session.");
  }
  announce(moodCopy[state.mood].label + " URL Cleaner: " + getUrlCleanerMode(cleanerPreferences, state.mood) + ". Stored locally for this prototype.");
}

function syncCleanerModeControl() {
  const control = $("#urlCleanerMode");
  if (control) control.value = getUrlCleanerMode(cleanerPreferences, state.mood);
}

function hideCleanerSuggestion() {
  pendingCleanerCandidate = null;
  const notice = $("#urlCleanerNotice");
  if (notice) notice.hidden = true;
}

function showCleanerSuggestion(candidateUrl, removedParams) {
  pendingCleanerCandidate = candidateUrl;
  const arabic = state.language === "ar";
  $("#urlCleanerNoticeTitle").textContent = arabic ? "رابط أنظف متاح" : "A cleaner link is available";
  $("#urlCleanerNoticeText").textContent = arabic
    ? "تم العثور على " + removedParams.length + " من معاملات التتبع المعروفة. سيظل الرابط الأصلي كما هو حتى تختار المعاينة المنظّفة."
    : "Found " + removedParams.length + " known tracking parameter(s). The original address stays selected until you choose the cleaned preview.";
  $("#openCleanedPreview").textContent = arabic ? "استخدم المعاينة المنظّفة" : "Use cleaned preview";
  $("#keepOriginalAddress").textContent = arabic ? "احتفظ بالأصلي" : "Keep original";
  $("#urlCleanerNotice").hidden = false;
}

function openCleanedPreview() {
  if (!pendingCleanerCandidate) return;
  const candidate = pendingCleanerCandidate;
  setPreviewPage(candidate, candidate, "CLEANED ADDRESS PREVIEW", "This is a local preview of the cleaned address. No external website was opened.");
}

function setPreviewPage(title, url, kicker, deck) {
  hideCleanerSuggestion();
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

function togglePrivate() {
  state.private = !state.private;
  if (state.private) setMood("vigil");
  else {
    if (state.mood === "vigil") setMood("atelier");
    else {
      $("#privateToggle").setAttribute("aria-pressed", "false");
      $("#privateStatus").textContent = "Off";
      $("#privateToggle").classList.remove("private-on");
    }
  }
  announce(state.private ? "Private room preview enabled. Not real profile isolation." : "Private room preview closed.");
}

function addTab() {
  const id = `tab-${Date.now()}`;
  const label = `Untitled ${$$(".tab-row").length + 1}`;
  const row = document.createElement("button");
  row.className = "tab-row active";
  row.dataset.tabId = id;
  row.innerHTML = `<span class="tab-favicon favicon-new">·</span><span class="tab-title"></span>`;
  $(".tab-title", row).textContent = label;
  row.addEventListener("click", () => setActiveTab(id));
  const target = $("[data-folder-children='Today']");
  target.append(row);
  setActiveTab(id);
  updateTabCounts();
  announce("A new blank tab preview was added.");
}

function addPin() {
  const name = window.prompt("Name this pin");
  if (!name?.trim()) return;
  const pin = document.createElement("button");
  pin.className = "pin-tile";
  pin.dataset.page = name.trim();
  const glyph = document.createElement("span");
  glyph.className = "pin-glyph glyph-new";
  glyph.textContent = "✳";
  const text = document.createElement("span");
  text.textContent = name.trim();
  pin.append(glyph, text);
  pin.addEventListener("click", () => setPreviewPage(name.trim(), "pin.preview", "PINNED PLACE", "This is a pin placeholder in the visual prototype."));
  $("#pinGrid").append(pin);
  announce(`Pinned ${name.trim()}.`);
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
$("#newTab").addEventListener("click", addTab);
$("#addPin").addEventListener("click", addPin);
$("#themeToggle").addEventListener("click", () => setTheme(state.theme === "night" ? "day" : "night"));
$("#daySetting").addEventListener("click", () => setTheme(state.theme === "night" ? "day" : "night"));
$("#splitToggle").addEventListener("click", () => setSplit(!state.split));
$("#closeSplit").addEventListener("click", () => setSplit(false));
$("#focusSecondPane").addEventListener("click", () => { state.activePane = 2; announce("Second pane selected."); });
$("#readingToggle").addEventListener("click", () => setReading(!state.reading));
$("#privateToggle").addEventListener("click", togglePrivate);
$("#settingsButton").addEventListener("click", openSettings);
$("#settingsQuick").addEventListener("click", openSettings);
$("#manageSpaces").addEventListener("click", () => announce("Five Space moods are available below."));
$("#spaceDetails").addEventListener("click", () => announce(`${moodCopy[state.mood].label}: ${moodCopy[state.mood].subtitle}`));
$("#sidebarMenu").addEventListener("click", () => announce("Sidebar docking controls will be connected to the desktop shell."));
$("#pageMenu").addEventListener("click", () => announce("Page actions will be supplied by Chromium."));
$("#copyAddress").addEventListener("click", async () => {
  const value = $("#pageUrl").textContent;
  try { await navigator.clipboard.writeText(value); announce("Preview address copied."); }
  catch { announce(value); }
});
$("#doneSettings").addEventListener("click", () => closeDialog("settingsDialog"));
$("#urlCleanerMode").addEventListener("change", (event) => setCleanerMode(event.target.value));
$("#openCleanedPreview").addEventListener("click", openCleanedPreview);
$("#keepOriginalAddress").addEventListener("click", () => {
  hideCleanerSuggestion();
  announce(state.language === "ar" ? "تم الاحتفاظ بالرابط الأصلي." : "Original preview address kept.");
});
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
syncCleanerModeControl();
updateTabCounts();
