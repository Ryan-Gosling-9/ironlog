/* ============================================================
   IRONLOG — vanilla JS, single app.js
   Features: local-first state, optional Google/Firebase cloud
   sync, dark/light theme, en/ru/uz language, custom exercises.
   ============================================================ */

const K = "ironlog-v3";
const DEFAULTS = {
  tab: "today",
  theme: "dark",
  language: "en",
  water: 0,
  foods: [],
  sets: [],
  checks: {},
  weights: [],
  targets: { cal: 2200, protein: 160, carbs: 220, fat: 70, water: 3500 },
  plan: ["Bench press", "Barbell row", "Squat", "Lat pulldown"]
};
let S = Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(K) || "{}"));
let M = ""; // modal html
const $ = document.querySelector("#app");
const now = () => new Date().toISOString().slice(0, 10);
const safe = x => String(x || "").replace(/[&<>'"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c]));
const save = () => { localStorage.setItem(K, JSON.stringify(S)); applyTheme(); scheduleCloudPush(); };
const sum = k => S.foods.reduce((n, x) => n + (+x[k] || 0), 0);
const pct = (v, m) => Math.min(100, Math.round((v / m) * 100) || 0);
const ring = (v, m, c, t) => `<span class="ring" style="--p:${pct(v, m)}%;--c:${c}"><b>${t}</b></span>`;
const applyTheme = () => document.documentElement.setAttribute("data-theme", S.theme === "light" ? "light" : "dark");

/* ============================== i18n ============================== */
const TRANSLATIONS = {
  en: {
    tabToday: "Today", tabTrain: "Train", tabFood: "Food", tabProgress: "Progress",
    goodMorning: "Good morning", training: "Training", nutrition: "Nutrition", progress: "Progress",
    dayComplete: "Day complete.", buildHabit: "Build the habit.", tagline: "Train. Eat. Recover. Repeat.",
    markComplete: "Mark complete", logged: "Logged",
    caloriesLabel: "Calories", remaining: "remaining", water: "Water", of: "of",
    quickWater: "Quick water", addGlass: "Add a glass without leaving Today.",
    todaysSession: "TODAY'S SESSION", upperStrength: "Training session", logWorkCounts: "Log the work that counts.",
    logASet: "Log a set", exercisesHeader: "Exercises", last: "Last", noSetsYet: "No sets logged yet",
    dailyTotal: "DAILY TOTAL", todaysFood: "Today's food", addMeal: "Add meal",
    noMealsYet: "No meals logged yet", startSimple: "Start simple with one meal.", addFirstMeal: "Add your first meal",
    trainingVolume: "Training volume", kgMoved: "kg moved total", sessions: "Sessions", loggedDays: "logged days",
    consistency: "CONSISTENCY", keepChain: "Keep the chain going", latestWeight: "Latest weight",
    addWeighIn: "Add a weigh-in to begin", add: "Add",
    mealOrFood: "Meal or food", mealPlaceholder: "Chicken and rice", calories: "Calories",
    protein: "Protein (g)", carbs: "Carbs (g)", fat: "Fat (g)", saveFood: "Save food",
    weightKg: "Weight (kg)", reps: "Reps", logSet: "Log set",
    bodyWeightKg: "Body weight (kg)", saveMeasurement: "Save measurement",
    yourGoals: "Your goals", saveGoals: "Save goals",
    modalAddFood: "Add food", modalAddSet: "Log a set", modalAddWeight: "Add weigh-in",
    settings: "Settings", appearance: "Appearance", dark: "Dark", light: "Light",
    language: "Language", exercisePlan: "Exercise plan", newExercisePlaceholder: "New exercise name",
    cloudSync: "Cloud sync", signInGoogle: "Sign in with Google",
    cloudSyncDesc: "Sign in to back up your data to the cloud and restore it on any device.",
    signOut: "Sign out", syncedJustNow: "Synced just now", syncing: "Syncing…", syncFailed: "Sync failed — will retry",
    cloudDataFound: "Cloud backup found", useCloudData: "Use cloud data", useThisDevice: "Keep this device's data",
    cloudDataFoundDesc: "This Google account already has saved data. Which version do you want to keep?",
    close: "×"
  },
  ru: {
    tabToday: "Сегодня", tabTrain: "Тренировка", tabFood: "Питание", tabProgress: "Прогресс",
    goodMorning: "Доброе утро", training: "Тренировка", nutrition: "Питание", progress: "Прогресс",
    dayComplete: "День завершён.", buildHabit: "Формируй привычку.", tagline: "Тренируйся. Ешь. Восстанавливайся. Повтори.",
    markComplete: "Отметить выполненным", logged: "Отмечено",
    caloriesLabel: "Калории", remaining: "осталось", water: "Вода", of: "из",
    quickWater: "Быстро добавить воду", addGlass: "Добавь стакан, не покидая вкладку «Сегодня».",
    todaysSession: "СЕГОДНЯШНЯЯ ТРЕНИРОВКА", upperStrength: "Тренировочная сессия", logWorkCounts: "Записывай то, что имеет значение.",
    logASet: "Записать подход", exercisesHeader: "Упражнения", last: "Последний", noSetsYet: "Подходов пока нет",
    dailyTotal: "ИТОГО ЗА ДЕНЬ", todaysFood: "Питание за сегодня", addMeal: "Добавить приём пищи",
    noMealsYet: "Приёмов пищи пока нет", startSimple: "Начни с одного приёма пищи.", addFirstMeal: "Добавить первый приём пищи",
    trainingVolume: "Тренировочный объём", kgMoved: "кг поднято всего", sessions: "Тренировки", loggedDays: "дней записано",
    consistency: "РЕГУЛЯРНОСТЬ", keepChain: "Не прерывай цепочку", latestWeight: "Последний вес",
    addWeighIn: "Добавь взвешивание, чтобы начать", add: "Добавить",
    mealOrFood: "Приём пищи или продукт", mealPlaceholder: "Курица с рисом", calories: "Калории",
    protein: "Белки (г)", carbs: "Углеводы (г)", fat: "Жиры (г)", saveFood: "Сохранить",
    weightKg: "Вес (кг)", reps: "Повторения", logSet: "Записать подход",
    bodyWeightKg: "Вес тела (кг)", saveMeasurement: "Сохранить замер",
    yourGoals: "Твои цели", saveGoals: "Сохранить цели",
    modalAddFood: "Добавить еду", modalAddSet: "Записать подход", modalAddWeight: "Добавить взвешивание",
    settings: "Настройки", appearance: "Оформление", dark: "Тёмная", light: "Светлая",
    language: "Язык", exercisePlan: "План упражнений", newExercisePlaceholder: "Название упражнения",
    cloudSync: "Синхронизация", signInGoogle: "Войти через Google",
    cloudSyncDesc: "Войди, чтобы сохранить данные в облаке и восстановить их на любом устройстве.",
    signOut: "Выйти", syncedJustNow: "Синхронизировано только что", syncing: "Синхронизация…", syncFailed: "Ошибка синхронизации — повторим позже",
    cloudDataFound: "Найдена резервная копия", useCloudData: "Использовать данные из облака", useThisDevice: "Оставить данные этого устройства",
    cloudDataFoundDesc: "На этом Google-аккаунте уже есть сохранённые данные. Какую версию оставить?",
    close: "×"
  },
  uz: {
    tabToday: "Bugun", tabTrain: "Mashq", tabFood: "Ovqat", tabProgress: "Progress",
    goodMorning: "Xayrli tong", training: "Mashg'ulot", nutrition: "Ovqatlanish", progress: "Progress",
    dayComplete: "Kun yakunlandi.", buildHabit: "Odat hosil qil.", tagline: "Mashq qil. Ovqatlan. Tikland. Takrorla.",
    markComplete: "Bajarildi deb belgilash", logged: "Belgilandi",
    caloriesLabel: "Kaloriya", remaining: "qoldi", water: "Suv", of: "dan",
    quickWater: "Tez suv qo'shish", addGlass: "Bugun bo'limidan chiqmasdan stakan qo'sh.",
    todaysSession: "BUGUNGI MASHG'ULOT", upperStrength: "Mashg'ulot sessiyasi", logWorkCounts: "Ahamiyatli ishni yoz.",
    logASet: "Setni yozish", exercisesHeader: "Mashqlar", last: "Oxirgi", noSetsYet: "Hali set yozilmagan",
    dailyTotal: "KUNLIK JAMI", todaysFood: "Bugungi ovqat", addMeal: "Ovqat qo'shish",
    noMealsYet: "Hali ovqat yozilmagan", startSimple: "Bitta ovqatdan boshla.", addFirstMeal: "Birinchi ovqatingizni qo'shing",
    trainingVolume: "Mashq hajmi", kgMoved: "kg jami ko'tarildi", sessions: "Mashg'ulotlar", loggedDays: "kun yozildi",
    consistency: "DAVOMIYLIK", keepChain: "Zanjirni uzma", latestWeight: "Oxirgi vazn",
    addWeighIn: "Boshlash uchun vaznni qo'shing", add: "Qo'shish",
    mealOrFood: "Ovqat nomi", mealPlaceholder: "Tovuq va guruch", calories: "Kaloriya",
    protein: "Oqsil (g)", carbs: "Uglevod (g)", fat: "Yog' (g)", saveFood: "Saqlash",
    weightKg: "Og'irlik (kg)", reps: "Takrorlar", logSet: "Setni saqlash",
    bodyWeightKg: "Tana vazni (kg)", saveMeasurement: "O'lchovni saqlash",
    yourGoals: "Maqsadlaringiz", saveGoals: "Maqsadlarni saqlash",
    modalAddFood: "Ovqat qo'shish", modalAddSet: "Setni yozish", modalAddWeight: "Vazn qo'shish",
    settings: "Sozlamalar", appearance: "Ko'rinish", dark: "Tungi", light: "Kunduzgi",
    language: "Til", exercisePlan: "Mashqlar rejasi", newExercisePlaceholder: "Yangi mashq nomi",
    cloudSync: "Bulutga sinxronlash", signInGoogle: "Google orqali kirish",
    cloudSyncDesc: "Maʼlumotlaringizni bulutda zaxiralash va istalgan qurilmada tiklash uchun kiring.",
    signOut: "Chiqish", syncedJustNow: "Hozirgina sinxronlandi", syncing: "Sinxronlanmoqda…", syncFailed: "Sinxronlash xatosi — keyinroq qayta urinamiz",
    cloudDataFound: "Bulutda zaxira topildi", useCloudData: "Bulut maʼlumotlaridan foydalanish", useThisDevice: "Shu qurilma maʼlumotlarini saqlab qolish",
    cloudDataFoundDesc: "Bu Google hisobida allaqachon saqlangan maʼlumot bor. Qaysi versiyani saqlab qolmoqchisiz?",
    close: "×"
  }
};
function t(key) {
  const lang = S.language || "en";
  return (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || TRANSLATIONS.en[key] || key;
}

/* ============================== RENDER ============================== */
function nav() {
  const tabs = [["today", "⌂", t("tabToday")], ["train", "▰", t("tabTrain")], ["food", "◉", t("tabFood")], ["progress", "↗", t("tabProgress")]];
  return `<div class="tabbar"><nav class="tabbar-inner">${tabs.map(([id, i, n]) =>
    `<button class="tab-btn ${S.tab === id ? "active" : ""}" data-tab="${id}"><i class="tab-icon">${i}</i><span class="tab-label">${n}</span></button>`
  ).join("")}</nav></div>`;
}
function header() {
  const title = { today: t("goodMorning"), train: t("training"), food: t("nutrition"), progress: t("progress") }[S.tab];
  return `<header><div><p>IRONLOG</p><h1>${title}</h1></div><button class="icon" data-a="settings">⚙</button></header>`;
}
function macro(n, v, m, c) {
  return `<article class="macro"><span>${n}</span><b>${v}g</b><i><em style="width:${pct(v, m)}%;background:${c}"></em></i><small>${m}g</small></article>`;
}
function fab() {
  const action = { today: "water", train: "set", food: "food", progress: "weight" }[S.tab];
  const exArg = S.tab === "train" ? ` data-ex="${safe(S.plan[0] || "")}"` : "";
  const icon = { today: "💧", train: "+", food: "+", progress: "+" }[S.tab];
  return `<button class="fab" data-a="${action}"${exArg}>${icon}</button>`;
}

function today() {
  const c = sum("cal"), p = sum("protein"), r = sum("carbs"), f = sum("fat"), done = S.checks[now()];
  return `<div class="stack">
    <article class="hero"><p>DAILY BASELINE</p><h2>${done ? t("dayComplete") : t("buildHabit")}</h2><span>${t("tagline")}</span>
      <button data-a="check" class="primary ${done ? "checked" : ""}">${done ? "✓ " + t("logged") : t("markComplete")}</button></article>
    <div class="grid">
      <article class="card stat"><div><span>${t("caloriesLabel")}</span><b>${c}<small> / ${S.targets.cal}</small></b><small>${Math.max(0, S.targets.cal - c)} ${t("remaining")}</small></div>${ring(c, S.targets.cal, "var(--accent)", c)}</article>
      <article class="card stat"><div><span>${t("water")}</span><b>${(S.water / 1000).toFixed(1)}<small> L</small></b><small>${t("of")} ${(S.targets.water / 1000).toFixed(1)} L</small></div>${ring(S.water, S.targets.water, "var(--accent-2)", `${(S.water / 1000).toFixed(1)}L`)}</article>
    </div>
    <div class="macros">${macro(t("protein").split(" ")[0], p, S.targets.protein, "#ff607a")}${macro(t("carbs").split(" ")[0], r, S.targets.carbs, "#ffb44f")}${macro(t("fat").split(" ")[0], f, S.targets.fat, "#776ff0")}</div>
    <article class="card quick"><i>💧</i><div><b>${t("quickWater")}</b><small>${t("addGlass")}</small></div><button class="round" data-a="water">+250</button></article>
  </div>`;
}
function train() {
  return `<div class="stack">
    <article class="hero"><p>${t("todaysSession")}</p><h2>${t("upperStrength")}</h2><span>${t("logWorkCounts")}</span>
      <button class="primary" data-a="set" data-ex="${safe(S.plan[0] || "")}">${t("logASet")}</button></article>
    <h2 class="section">${t("exercisesHeader")}</h2>
    ${S.plan.length ? S.plan.map(x => {
      const z = S.sets.filter(s => s.ex === x).at(-1);
      return `<article class="exercise"><i>▰</i><div><b>${safe(x)}</b><small>${z ? `${t("last")}: ${z.w} kg × ${z.r}` : t("noSetsYet")}</small></div><button class="round" data-a="set" data-ex="${safe(x)}">+</button></article>`;
    }).join("") : `<article class="empty"><b>${t("noSetsYet")}</b></article>`}
  </div>`;
}
function food() {
  const c = sum("cal");
  return `<div class="stack">
    <article class="card foodtop"><div><p>${t("dailyTotal")}</p><h2>${c} <small>kcal</small></h2><span>${sum("protein")}g · ${sum("carbs")}g · ${sum("fat")}g</span></div></article>
    <div class="head"><h2>${t("todaysFood")}</h2><button data-a="food">${t("addMeal")}</button></div>
    ${S.foods.length ? S.foods.map(x => `<article class="food"><i></i><div><b>${safe(x.name)}</b><small>${x.cal} kcal · P ${x.protein || 0}g · C ${x.carbs || 0}g · F ${x.fat || 0}g</small></div><button data-a="del" data-id="${x.id}">⌫</button></article>`).join("")
      : `<article class="empty"><b>${t("noMealsYet")}</b><span>${t("startSimple")}</span><button class="primary" data-a="food">${t("addFirstMeal")}</button></article>`}
  </div>`;
}
function progress() {
  const v = S.sets.reduce((n, x) => n + x.w * x.r, 0);
  const last = S.weights.at(-1);
  return `<div class="stack">
    <div class="grid">
      <article class="card metric"><span>${t("trainingVolume")}</span><b>${v.toLocaleString()}</b><small>${t("kgMoved")}</small></article>
      <article class="card metric"><span>${t("sessions")}</span><b>${new Set(S.sets.map(x => x.d)).size}</b><small>${t("loggedDays")}</small></article>
    </div>
    <article class="card chart"><p>${t("consistency")}</p><h2>${t("keepChain")}</h2>
      <div>${Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 6 + i); const k = d.toISOString().slice(0, 10); return `<i class="${S.checks[k] ? "on" : ""}">${S.checks[k] ? "✓" : ""}</i>`; }).join("")}</div></article>
    <article class="card quick"><div><b>${t("latestWeight")}</b><small>${last ? `${last.w} kg · ${last.d}` : t("addWeighIn")}</small></div><button class="primary" data-a="weight">${t("add")}</button></article>
  </div>`;
}

/* ============================== MODALS ============================== */
function modal(kind, ex = "") {
  let body;
  if (kind === "food") {
    body = `<form data-f="food"><label>${t("mealOrFood")}<input name="name" required placeholder="${t("mealPlaceholder")}"></label>
      <div class="formgrid"><label>${t("calories")}<input name="cal" required type="number" min="0"></label>
      <label>${t("protein")}<input name="protein" type="number" min="0"></label>
      <label>${t("carbs")}<input name="carbs" type="number" min="0"></label>
      <label>${t("fat")}<input name="fat" type="number" min="0"></label></div>
      <button class="primary">${t("saveFood")}</button></form>`;
  } else if (kind === "set") {
    const options = S.plan.map(p => `<option value="${safe(p)}" ${p === ex ? "selected" : ""}>${safe(p)}</option>`).join("");
    body = `<form data-f="set"><label>${t("exercisesHeader")}<select name="ex">${options}</select></label>
      <div class="formgrid"><label>${t("weightKg")}<input name="w" type="number" required min="0" step=".5"></label>
      <label>${t("reps")}<input name="r" type="number" required min="1"></label></div>
      <button class="primary">${t("logSet")}</button></form>`;
  } else if (kind === "weight") {
    body = `<form data-f="weight"><label>${t("bodyWeightKg")}<input name="w" required type="number" min="1" step=".1"></label><button class="primary">${t("saveMeasurement")}</button></form>`;
  } else if (kind === "goals") {
    const labels = { cal: t("caloriesLabel"), protein: t("protein"), carbs: t("carbs"), fat: t("fat"), water: t("water") };
    body = `<form data-f="goals" class="formgrid">${Object.entries(S.targets).map(([k, v]) => `<label>${labels[k] || k}<input name="${k}" type="number" min="0" value="${v}"></label>`).join("")}<button class="primary">${t("saveGoals")}</button></form>`;
  }
  const titles = { food: t("modalAddFood"), set: t("modalAddSet"), weight: t("modalAddWeight"), goals: t("yourGoals") };
  M = `<div class="shade" data-a="close"><section class="modal">${bodyHeader(titles[kind])}${body}</section></div>`;
  render();
}
function bodyHeader(title) {
  return `<header style="display:flex;justify-content:space-between;align-items:center"><h2>${title}</h2><button class="icon" data-a="close">${t("close")}</button></header>`;
}
function settingsModal() {
  const langs = [["en", "EN"], ["ru", "RU"], ["uz", "UZ"]];
  const cloudSection = cloudUser
    ? `<div class="cloudbtn"><img src="${cloudUser.photoURL || ""}"><div style="flex:1"><b>${safe(cloudUser.displayName || cloudUser.email || "")}</b><div class="subtle" id="sync-status">${t("syncedJustNow")}</div></div></div>
       <button class="ghost" data-a="signout">${t("signOut")}</button>`
    : `<p class="subtle">${t("cloudSyncDesc")}</p><button class="cloudbtn" data-a="signin">🔵 ${t("signInGoogle")}</button>`;
  M = `<div class="shade" data-a="close"><section class="modal">
    ${bodyHeader(t("settings"))}
    <div class="stack">
      <div><label>${t("appearance")}</label><div class="optrow">
        <button class="opt ${S.theme !== "light" ? "active" : ""}" data-a="theme" data-v="dark">${t("dark")}</button>
        <button class="opt ${S.theme === "light" ? "active" : ""}" data-a="theme" data-v="light">${t("light")}</button>
      </div></div>
      <div><label>${t("language")}</label><div class="optrow">
        ${langs.map(([code, lab]) => `<button class="opt ${S.language === code ? "active" : ""}" data-a="lang" data-v="${code}">${lab}</button>`).join("")}
      </div></div>
      <div><label>${t("exercisePlan")}</label><div class="stack">
        ${S.plan.map((p, i) => `<div class="planrow"><span>${safe(p)}</span><button data-a="rmex" data-i="${i}">×</button></div>`).join("")}
        <div class="addplan"><input id="new-ex" placeholder="${t("newExercisePlaceholder")}"><button class="round" data-a="addex">+</button></div>
      </div></div>
      <div><label>${t("cloudSync")}</label>${cloudSection}</div>
    </div>
  </section></div>`;
  render();
}

/* ============================== CORE RENDER LOOP ============================== */
function render() {
  applyTheme();
  const view = { today, train, food, progress }[S.tab]();
  $.innerHTML = `<div class="liquid-bg"></div><section class="shell">${header()}<main class="page">${view}</main>${fab()}${nav()}</section>${M}`;
  document.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => { S.tab = b.dataset.tab; save(); render(); });
  document.querySelectorAll("[data-a]").forEach(b => b.onclick = e => act(e, b));
  document.querySelectorAll("form").forEach(f => f.onsubmit = submit);
}

function act(e, b) {
  const a = b.dataset.a;
  if (a === "close") { if (e.target === b || b.closest(".modal")) { M = ""; render(); } return; }
  if (a === "settings") { settingsModal(); return; }
  if (a === "check") { const d = now(); S.checks[d] ? delete S.checks[d] : (S.checks[d] = 1); save(); render(); }
  if (a === "water") { S.water = Math.min(S.targets.water, S.water + 250); save(); render(); }
  if (a === "food" || a === "weight" || a === "goals") modal(a);
  if (a === "set") modal("set", b.dataset.ex);
  if (a === "del") { S.foods = S.foods.filter(x => x.id !== b.dataset.id); save(); render(); }
  if (a === "theme") { S.theme = b.dataset.v; save(); settingsModal(); }
  if (a === "lang") { S.language = b.dataset.v; save(); settingsModal(); }
  if (a === "addex") {
    const input = document.getElementById("new-ex");
    const val = (input.value || "").trim();
    if (val && !S.plan.includes(val)) { S.plan.push(val); save(); }
    settingsModal();
  }
  if (a === "rmex") { S.plan.splice(+b.dataset.i, 1); save(); settingsModal(); }
  if (a === "signin") signInWithGoogle();
  if (a === "signout") signOutUser();
}

function submit(e) {
  e.preventDefault();
  const x = Object.fromEntries(new FormData(e.target));
  const f = e.target.dataset.f;
  if (f === "food") S.foods.unshift({ id: crypto.randomUUID(), name: x.name, cal: +x.cal || 0, protein: +x.protein || 0, carbs: +x.carbs || 0, fat: +x.fat || 0 });
  if (f === "set") S.sets.push({ ex: x.ex, w: +x.w, r: +x.r, d: now() });
  if (f === "weight") S.weights.push({ w: +x.w, d: now() });
  if (f === "goals") S.targets = Object.fromEntries(Object.entries(x).map(([k, v]) => [k, +v]));
  save(); M = ""; render();
}

/* ============================== FIREBASE / CLOUD SYNC ============================== */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDmEcNcde8RpoQpR5vACHvjez2sNqT7FpI",
  authDomain: "current-951a7.firebaseapp.com",
  projectId: "current-951a7",
  storageBucket: "current-951a7.firebasestorage.app",
  messagingSenderId: "745478267945",
  appId: "1:745478267945:web:f82eca54919b9cde146838"
};
let cloudUser = null, cloudDb = null, syncDebounceTimer = null, suppressNextPush = false;

function firebaseReady() { return FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== "YOUR_API_KEY"; }
function initFirebase() {
  if (!firebaseReady()) return;
  try {
    firebase.initializeApp(FIREBASE_CONFIG);
    cloudDb = firebase.firestore();
    firebase.auth().onAuthStateChanged(handleAuthChange);
  } catch (e) { console.warn("Firebase init failed", e); }
}
function signInWithGoogle() {
  if (!firebaseReady()) { alert("Cloud sync is not configured."); return; }
  const provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider).catch(e => { console.error(e); alert("Sign-in failed: " + e.message); });
}
function signOutUser() { firebase.auth().signOut(); }
function cloudResolvedKey(uid) { return "ironlog_cloud_resolved_" + uid; }

async function handleAuthChange(user) {
  cloudUser = user;
  if (M) { M = ""; }
  if (!user) { render(); return; }
  render();
  try {
    const alreadyResolved = localStorage.getItem(cloudResolvedKey(user.uid)) === "1";
    const docRef = cloudDb.collection("ironlog_users").doc(user.uid);
    const doc = await docRef.get();
    if (doc.exists) {
      const cloudState = doc.data();
      const cloudHasData = cloudState && (Array.isArray(cloudState.sets) && cloudState.sets.length > 0 || Array.isArray(cloudState.foods) && cloudState.foods.length > 0);
      const localHasData = (S.sets && S.sets.length > 0) || (S.foods && S.foods.length > 0);
      if (cloudHasData && localHasData && !alreadyResolved) {
        openSyncConflictSheet(cloudState, user.uid);
      } else if (cloudHasData && !localHasData) {
        applyCloudState(cloudState);
        localStorage.setItem(cloudResolvedKey(user.uid), "1");
      } else {
        await pushStateToCloud();
        localStorage.setItem(cloudResolvedKey(user.uid), "1");
      }
    } else {
      await pushStateToCloud();
      localStorage.setItem(cloudResolvedKey(user.uid), "1");
    }
  } catch (e) { console.error("Cloud sync error", e); }
}

let pendingCloudState = null, pendingCloudUid = null;
function openSyncConflictSheet(cloudState, uid) {
  pendingCloudState = cloudState; pendingCloudUid = uid;
  M = `<div class="shade"><section class="modal">${bodyHeader(t("cloudDataFound"))}
    <p class="subtle">${t("cloudDataFoundDesc")}</p>
    <div class="stack">
      <button class="primary" data-a="usecloud">${t("useCloudData")}</button>
      <button class="ghost" data-a="usedevice">${t("useThisDevice")}</button>
    </div></section></div>`;
  const origAct = act;
  document.querySelectorAll("[data-a='usecloud'],[data-a='usedevice']");
  render();
  document.querySelector("[data-a='usecloud']").onclick = () => { applyCloudState(pendingCloudState); finishConflict(); };
  document.querySelector("[data-a='usedevice']").onclick = () => { pushStateToCloud(); finishConflict(); };
}
function finishConflict() {
  if (pendingCloudUid) localStorage.setItem(cloudResolvedKey(pendingCloudUid), "1");
  pendingCloudState = null; pendingCloudUid = null; M = ""; render();
}
function applyCloudState(cloudState) {
  suppressNextPush = true;
  S = Object.assign({}, DEFAULTS, cloudState);
  save(); render();
}
function scheduleCloudPush() {
  if (!cloudUser || !cloudDb) return;
  if (suppressNextPush) { suppressNextPush = false; return; }
  clearTimeout(syncDebounceTimer);
  syncDebounceTimer = setTimeout(pushStateToCloud, 900);
}
async function pushStateToCloud() {
  if (!cloudUser || !cloudDb) return;
  try { await cloudDb.collection("ironlog_users").doc(cloudUser.uid).set(S); }
  catch (e) { console.error("Push failed", e); }
}

/* ============================== BOOT ============================== */
applyTheme();
if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});
initFirebase();
render();
