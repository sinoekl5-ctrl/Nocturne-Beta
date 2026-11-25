import { buildSuggestions, createSpaceState, SPACE_MOODS } from "./core.mjs";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const root = document.documentElement;
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
  secondPanePage: 0,
  splitRatio: 50,
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
  root.dataset.mood = mood;
  root.dataset.spaceKind = state.private ? "private" : "regular";
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
  root.dataset.contrast = state.highContrast ? "high" : "normal";
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
    local: "معاينة محلية", localDesc: "هذا النموذج لا يفتح مواقع حقيقية ولا ينشئ ملفات تعريف معزولة.", done: "تم",
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

const splitPreviewPages = [{ title: "Atlas of small ideas", url: "atlas.preview", deck: "A collection of small observations, connected by curiosity." }, { title: "Weather & light", url: "weather.preview", deck: "A local sample page for comparing context side by side." }, { title: "A room of one’s own", url: "reading.preview", deck: "A quiet reading sample kept separate from the first pane." }];
function renderSecondPanePage(index = state.secondPanePage) {
  state.secondPanePage = (index + splitPreviewPages.length) % splitPreviewPages.length;
  const page = splitPreviewPages[state.secondPanePage];
  $("#secondPaneTitle").textContent = page.title;
  $("#secondPaneUrl").textContent = page.url;
  $("#secondPaneDeck").textContent = page.deck;
  $("#secondPane").setAttribute("aria-label", `Second preview pane: ${page.title}`);
}
function focusPane(number) {
  state.activePane = number;
  $("#pageStage").dataset.activePane = String(number);
  $("#webPage").classList.toggle("pane-focused", number === 1 && state.split);
  $("#secondPane").classList.toggle("pane-focused", number === 2 && state.split);
  $("#focusFirstPane").setAttribute("aria-pressed", String(number === 1));
  $("#focusSecondPane").setAttribute("aria-pressed", String(number === 2));
  announce(number === 1 ? "First preview pane focused." : "Second preview pane focused.");
}
function setSplitRatio(value) {
  const numericValue = Number(value);
  const ratio = Math.round(Math.max(25, Math.min(75, Number.isFinite(numericValue) ? numericValue : 50)));
  state.splitRatio = ratio;
  const grid = $("#pageContentGrid");
  grid.style.setProperty("--split-first-pane", `calc(${ratio}% - 4px)`);
  grid.style.setProperty("--split-second-pane", `calc(${100 - ratio}% - 4px)`);
  const divider = $("#splitDivider");
  divider.setAttribute("aria-valuenow", String(ratio));
  divider.setAttribute("aria-valuetext", `First pane ${ratio}%, second pane ${100 - ratio}%`);
}
function resizeSplitFromPointer(event) {
  const bounds = $("#pageContentGrid").getBoundingClientRect();
  if (!bounds.width) return;
  const logicalOffset = state.rtl ? bounds.right - event.clientX : event.clientX - bounds.left;
  setSplitRatio((logicalOffset / bounds.width) * 100);
}
function setSplit(enabled) {
  state.split = Boolean(enabled);
  $("#secondPane").hidden = !state.split;
  $("#splitDivider").hidden = !state.split;
  $("#splitToggle").classList.toggle("is-active", state.split);
  $("#splitToggle").setAttribute("aria-pressed", String(state.split));
  $("#pageContentGrid").classList.toggle("split-active", state.split);
  $("#focusFirstPane").hidden = !state.split;
  if (state.split) { renderSecondPanePage(); setSplitRatio(state.splitRatio); focusPane(state.activePane === 2 ? 2 : 1); }
  else { state.activePane = 1; $("#pageStage").dataset.activePane = "1"; $("#webPage").classList.remove("pane-focused"); $("#secondPane").classList.remove("pane-focused"); $("#focusFirstPane").setAttribute("aria-pressed", "true"); $("#focusSecondPane").setAttribute("aria-pressed", "false"); }
  announce(state.split ? "Split view preview opened. Both panes are local samples." : "Split view closed.");
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
    setPreviewPage(item.value, item.value, "A page preview", "Address navigation is simulated here. Chromium navigation is not connected yet.");
  } else if (item.kind === "action") {
    if (item.action === "settings") openSettings();
    if (item.action === "split") setSplit(!state.split);
    if (item.action === "private") togglePrivate();
    if (item.action === "spaces") announce("Choose a Space from the bottom of the sidebar.");
  } else {
    setActiveTab(item.id);
  }
}

function openPeek() {
  openDialog($("#peekDialog"));
  announce("Peek opened. This is a local preview, not a live website.");
}

function openPeekInCurrentTab() {
  closeDialog("peekDialog");
  setPreviewPage("Atlas of small ideas", "atlas.preview", "PEEK / LOCAL PAGE", "A local illustrative page preview. Real link metadata and navigation will be connected in Chromium.");
}

function openPeekInNewTab() {
  closeDialog("peekDialog");
  addTab();
  setPreviewPage("Atlas of small ideas", "atlas.preview", "PEEK / LOCAL PAGE", "A local illustrative page preview. Real link metadata and navigation will be connected in Chromium.");
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
$("#focusFirstPane").addEventListener("click", () => focusPane(1));
$("#focusSecondPane").addEventListener("click", () => focusPane(2));
$("#nextSecondPane").addEventListener("click", () => { renderSecondPanePage(state.secondPanePage + 1); focusPane(2); });
const splitDivider = $("#splitDivider");
splitDivider.addEventListener("pointerdown", (event) => {
  if (!state.split || event.button !== 0) return;
  event.preventDefault();
  splitDivider.setPointerCapture(event.pointerId);
  splitDivider.dataset.dragging = "true";
  resizeSplitFromPointer(event);
});
splitDivider.addEventListener("pointermove", (event) => {
  if (splitDivider.hasPointerCapture(event.pointerId)) resizeSplitFromPointer(event);
});
function finishSplitDrag(event) {
  if (splitDivider.hasPointerCapture(event.pointerId)) splitDivider.releasePointerCapture(event.pointerId);
  delete splitDivider.dataset.dragging;
}
splitDivider.addEventListener("pointerup", finishSplitDrag);
splitDivider.addEventListener("pointercancel", finishSplitDrag);
splitDivider.addEventListener("lostpointercapture", () => { delete splitDivider.dataset.dragging; });
splitDivider.addEventListener("keydown", (event) => {
  let nextRatio = state.splitRatio;
  const step = event.shiftKey ? 10 : 5;
  if (event.key === "ArrowLeft") nextRatio += state.rtl ? step : -step;
  else if (event.key === "ArrowRight") nextRatio += state.rtl ? -step : step;
  else if (event.key === "Home") nextRatio = 25;
  else if (event.key === "End") nextRatio = 75;
  else return;
  event.preventDefault();
  setSplitRatio(nextRatio);
  announce(`Split view resized: first pane ${state.splitRatio}%, second pane ${100 - state.splitRatio}%.`);
});
$("#closeSplit").addEventListener("click", () => setSplit(false));
$("#readingToggle").addEventListener("click", () => setReading(!state.reading));
$("#privateToggle").addEventListener("click", togglePrivate);
$("#settingsButton").addEventListener("click", openSettings);
$("#settingsQuick").addEventListener("click", openSettings);
$("#manageSpaces").addEventListener("click", () => announce("Five Space moods are available below."));
$("#spaceDetails").addEventListener("click", () => announce(`${moodCopy[state.mood].label}: ${moodCopy[state.mood].subtitle}`));
$("#sidebarMenu").addEventListener("click", () => announce("Sidebar docking controls will be connected to the desktop shell."));
$("#pageMenu").addEventListener("click", () => announce("Page actions will be supplied by Chromium."));
$("#peekButton").addEventListener("click", openPeek);
$("#closePeek").addEventListener("click", () => closeDialog("peekDialog"));
$("#peekOpenCurrent").addEventListener("click", openPeekInCurrentTab);
$("#peekOpenNew").addEventListener("click", openPeekInNewTab);
$("#copyAddress").addEventListener("click", async () => {
  const value = $("#pageUrl").textContent;
  try { await navigator.clipboard.writeText(value); announce("Preview address copied."); }
  catch { announce(value); }
});
$("#doneSettings").addEventListener("click", () => closeDialog("settingsDialog"));
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
$("#peekDialog").addEventListener("click", (event) => {
  if (event.target === $("#peekDialog")) closeDialog("peekDialog");
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
updateTabCounts();
