/* IronLog — same app as before. Only additions: language, theme, add/remove
   exercises, and cloud sync — all reachable from the same gear icon. */

const K = "ironlog-v3";
const D = {
  tab: "today", theme: "system", language: "en",
  water: 0, foods: [], sets: [], checks: {}, weights: [],
  targets: { cal: 2200, protein: 160, carbs: 220, fat: 70, water: 3500 },
  plan: ["Bench press", "Barbell row", "Squat", "Lat pulldown"]
};
let S = Object.assign(D, JSON.parse(localStorage.getItem(K) || "{}"));
let M = "";
const $ = document.querySelector("#app");
const now = () => new Date().toISOString().slice(0, 10);
const safe = x => String(x || "").replace(/[&<>'"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c]));
const save = () => { localStorage.setItem(K, JSON.stringify(S)); applyTheme(); scheduleCloudPush(); };
const sum = k => S.foods.reduce((n, x) => n + (+x[k] || 0), 0);
const pct = (v, m) => Math.min(100, Math.round(v / m * 100) || 0);
const ring = (v, m, c, t) => `<span class="ring" style="--p:${pct(v, m)}%;--c:${c}"><b>${t}</b></span>`;
const systemPrefersDark = () => window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
const resolvedTheme = () => S.theme === "system" ? (systemPrefersDark() ? "dark" : "light") : (S.theme || "light");
const applyTheme = () => { if (resolvedTheme() === "dark") document.documentElement.setAttribute("data-theme", "dark"); else document.documentElement.removeAttribute("data-theme"); };

/* ============================== i18n (EN = exact original copy) ============================== */
const I18N = {
  en: {
    navToday: "Today", navTrain: "Train", navFood: "Food", navProgress: "Progress",
    hToday: "Good morning", hTrain: "Training", hFood: "Nutrition", hProgress: "Progress",
    baseline: "DAILY BASELINE", dayComplete: "Day complete.", buildHabit: "Build the habit.",
    tagline: "Train. Eat. Recover. Repeat.", logged: "✓ Logged", markComplete: "Mark complete",
    calories: "Calories", kcalRemaining: "kcal remaining", water: "Water", of: "of",
    protein: "Protein", carbs: "Carbs", fat: "Fat",
    quickWater: "Quick water", addGlass: "Add a glass without leaving Today.",
    session: "TODAY’S SESSION", upperStrength: "Upper strength", logWorkCounts: "Log the work that counts.",
    logASet: "Log a set", exercises: "Exercises", last: "Last", noSets: "No sets logged yet",
    dailyTotal: "DAILY TOTAL", proteinWord: "protein", carbsWord: "carbs", fatWord: "fat",
    todaysFood: "Today’s food", addMeal: "Add meal", noMeals: "No meals logged yet",
    startSimple: "Start simple with one meal.", addFirstMeal: "Add your first meal",
    trainingVolume: "Training volume", kgMoved: "kg moved total", sessions: "Sessions", loggedDays: "logged days",
    consistency: "CONSISTENCY", keepChain: "Keep the chain going", latestWeight: "Latest weight",
    addWeighIn: "Add a weigh-in to begin", add: "Add",
    mealOrFood: "Meal or food", mealPlaceholder: "Chicken and rice", caloriesLabel: "Calories",
    proteinG: "Protein (g)", carbsG: "Carbs (g)", fatG: "Fat (g)", saveFood: "Save food",
    weightKg: "Weight (kg)", reps: "Reps", logSet: "Log set",
    bodyWeightKg: "Body weight (kg)", saveMeasurement: "Save measurement", saveGoals: "Save goals",
    yourGoals: "Your goals", addPrefix: "Add ",
    appearance: "Appearance", system: "System", light: "Light", dark: "Dark",
    language: "Language", exercisePlan: "Exercise plan", newExercise: "New exercise name",
    cloudSync: "Cloud sync", signInGoogle: "Sign in with Google",
    cloudDesc: "Sign in to back up your data and restore it on any device.",
    signOut: "Sign out", synced: "Synced", cloudFound: "Cloud backup found",
    useCloud: "Use cloud data", useDevice: "Keep this device's data",
    cloudFoundDesc: "This account already has saved data. Which version do you want to keep?"
  },
  ru: {
    navToday: "Сегодня", navTrain: "Тренировка", navFood: "Питание", navProgress: "Прогресс",
    hToday: "Доброе утро", hTrain: "Тренировка", hFood: "Питание", hProgress: "Прогресс",
    baseline: "БАЗОВЫЙ УРОВЕНЬ", dayComplete: "День завершён.", buildHabit: "Формируй привычку.",
    tagline: "Тренируйся. Ешь. Восстанавливайся. Повтори.", logged: "✓ Отмечено", markComplete: "Отметить выполненным",
    calories: "Калории", kcalRemaining: "ккал осталось", water: "Вода", of: "из",
    protein: "Белки", carbs: "Углеводы", fat: "Жиры",
    quickWater: "Быстро добавить воду", addGlass: "Добавь стакан, не покидая вкладку «Сегодня».",
    session: "СЕГОДНЯШНЯЯ ТРЕНИРОВКА", upperStrength: "Верх тела", logWorkCounts: "Записывай то, что имеет значение.",
    logASet: "Записать подход", exercises: "Упражнения", last: "Последний", noSets: "Подходов пока нет",
    dailyTotal: "ИТОГО ЗА ДЕНЬ", proteinWord: "белки", carbsWord: "углеводы", fatWord: "жиры",
    todaysFood: "Питание за сегодня", addMeal: "Добавить приём пищи", noMeals: "Приёмов пищи пока нет",
    startSimple: "Начни с одного приёма пищи.", addFirstMeal: "Добавить первый приём пищи",
    trainingVolume: "Тренировочный объём", kgMoved: "кг поднято всего", sessions: "Тренировки", loggedDays: "дней записано",
    consistency: "РЕГУЛЯРНОСТЬ", keepChain: "Не прерывай цепочку", latestWeight: "Последний вес",
    addWeighIn: "Добавь взвешивание, чтобы начать", add: "Добавить",
    mealOrFood: "Приём пищи", mealPlaceholder: "Курица с рисом", caloriesLabel: "Калории",
    proteinG: "Белки (г)", carbsG: "Углеводы (г)", fatG: "Жиры (г)", saveFood: "Сохранить",
    weightKg: "Вес (кг)", reps: "Повторения", logSet: "Записать подход",
    bodyWeightKg: "Вес тела (кг)", saveMeasurement: "Сохранить замер", saveGoals: "Сохранить цели",
    yourGoals: "Твои цели", addPrefix: "Добавить ",
    appearance: "Оформление", system: "Системная", light: "Светлая", dark: "Тёмная",
    language: "Язык", exercisePlan: "План упражнений", newExercise: "Название упражнения",
    cloudSync: "Синхронизация", signInGoogle: "Войти через Google",
    cloudDesc: "Войди, чтобы сохранить данные и восстановить их на любом устройстве.",
    signOut: "Выйти", synced: "Синхронизировано", cloudFound: "Найдена резервная копия",
    useCloud: "Использовать данные из облака", useDevice: "Оставить данные этого устройства",
    cloudFoundDesc: "На этом аккаунте уже есть сохранённые данные. Какую версию оставить?"
  },
  uz: {
    navToday: "Bugun", navTrain: "Mashq", navFood: "Ovqat", navProgress: "Progress",
    hToday: "Xayrli tong", hTrain: "Mashg'ulot", hFood: "Ovqatlanish", hProgress: "Progress",
    baseline: "KUNLIK ASOS", dayComplete: "Kun yakunlandi.", buildHabit: "Odat hosil qil.",
    tagline: "Mashq qil. Ovqatlan. Tikland. Takrorla.", logged: "✓ Belgilandi", markComplete: "Bajarildi deb belgilash",
    calories: "Kaloriya", kcalRemaining: "kkal qoldi", water: "Suv", of: "dan",
    protein: "Oqsil", carbs: "Uglevod", fat: "Yog'",
    quickWater: "Tez suv qo'shish", addGlass: "Bugun bo'limidan chiqmasdan stakan qo'sh.",
    session: "BUGUNGI MASHG'ULOT", upperStrength: "Tana yuqori qismi", logWorkCounts: "Ahamiyatli ishni yoz.",
    logASet: "Setni yozish", exercises: "Mashqlar", last: "Oxirgi", noSets: "Hali set yozilmagan",
    dailyTotal: "KUNLIK JAMI", proteinWord: "oqsil", carbsWord: "uglevod", fatWord: "yog'",
    todaysFood: "Bugungi ovqat", addMeal: "Ovqat qo'shish", noMeals: "Hali ovqat yozilmagan",
    startSimple: "Bitta ovqatdan boshla.", addFirstMeal: "Birinchi ovqatingizni qo'shing",
    trainingVolume: "Mashq hajmi", kgMoved: "kg jami ko'tarildi", sessions: "Mashg'ulotlar", loggedDays: "kun yozildi",
    consistency: "DAVOMIYLIK", keepChain: "Zanjirni uzma", latestWeight: "Oxirgi vazn",
    addWeighIn: "Boshlash uchun vaznni qo'shing", add: "Qo'shish",
    mealOrFood: "Ovqat nomi", mealPlaceholder: "Tovuq va guruch", caloriesLabel: "Kaloriya",
    proteinG: "Oqsil (g)", carbsG: "Uglevod (g)", fatG: "Yog' (g)", saveFood: "Saqlash",
    weightKg: "Og'irlik (kg)", reps: "Takrorlar", logSet: "Setni saqlash",
    bodyWeightKg: "Tana vazni (kg)", saveMeasurement: "O'lchovni saqlash", saveGoals: "Maqsadlarni saqlash",
    yourGoals: "Maqsadlaringiz", addPrefix: "Qo'shish: ",
    appearance: "Ko'rinish", system: "Tizim bo'yicha", light: "Kunduzgi", dark: "Tungi",
    language: "Til", exercisePlan: "Mashqlar rejasi", newExercise: "Yangi mashq nomi",
    cloudSync: "Bulutga sinxronlash", signInGoogle: "Google orqali kirish",
    cloudDesc: "Maʼlumotlaringizni saqlash va istalgan qurilmada tiklash uchun kiring.",
    signOut: "Chiqish", synced: "Sinxronlandi", cloudFound: "Bulutda zaxira topildi",
    useCloud: "Bulut maʼlumotlaridan foydalanish", useDevice: "Shu qurilma maʼlumotlarini saqlab qolish",
    cloudFoundDesc: "Bu hisobda allaqachon saqlangan maʼlumot bor. Qaysi versiyani saqlab qolmoqchisiz?"
  }
};
const t = k => (I18N[S.language] && I18N[S.language][k]) || I18N.en[k] || k;

/* ============================== ORIGINAL RENDER FUNCTIONS (unchanged structure) ============================== */
function nav() {
  return `<nav class="bottom-nav">${[["today", "⌂", t("navToday")], ["train", "▰", t("navTrain")], ["food", "◉", t("navFood")], ["progress", "↗", t("navProgress")]].map(([id, i, n]) =>
    `<button class="${S.tab === id ? "active" : ""}" data-tab="${id}"><i>${i}</i>${n}</button>`).join("")}</nav>`;
}
function header() {
  let title = { today: t("hToday"), train: t("hTrain"), food: t("hFood"), progress: t("hProgress") }[S.tab];
  return `<header><div><p>IRONLOG</p><h1>${title}</h1></div><button class="icon" data-a="goals">⚙</button></header>`;
}
function macro(n, v, m, c) {
  return `<article class="macro"><span>${n}</span><b>${v}g</b><i><em style="width:${pct(v, m)}%;background:${c}"></em></i><small>${m}g target</small></article>`;
}
function today() {
  let c = sum("cal"), p = sum("protein"), r = sum("carbs"), f = sum("fat"), done = S.checks[now()];
  return `<div class="stack"><article class="hero"><p>${t("baseline")}</p><h2>${done ? t("dayComplete") : t("buildHabit")}</h2><span>${t("tagline")}</span><button data-a="check" class="primary ${done ? "checked" : ""}">${done ? t("logged") : t("markComplete")}</button></article><div class="grid"><article class="card stat"><div><span>${t("calories")}</span><b>${c}<small> / ${S.targets.cal}</small></b><small>${Math.max(0, S.targets.cal - c)} ${t("kcalRemaining")}</small></div>${ring(c, S.targets.cal, "#ff825f", c)}</article><article class="card stat"><div><span>${t("water")}</span><b>${(S.water / 1000).toFixed(1)}<small> L</small></b><small>${t("of")} ${(S.targets.water / 1000).toFixed(1)} L</small></div>${ring(S.water, S.targets.water, "#5f7eff", `${(S.water / 1000).toFixed(1)}L`)}</article></div><div class="macros">${macro(t("protein"), p, S.targets.protein, "#ff607a")}${macro(t("carbs"), r, S.targets.carbs, "#ffb44f")}${macro(t("fat"), f, S.targets.fat, "#776ff0")}</div><article class="card quick"><i>💧</i><div><b>${t("quickWater")}</b><small>${t("addGlass")}</small></div><button class="round" data-a="water">+250</button></article></div>`;
}
function train() {
  return `<div class="stack"><article class="hero"><p>${t("session")}</p><h2>${t("upperStrength")}</h2><span>${t("logWorkCounts")}</span><button class="primary" data-a="set" data-ex="${safe(S.plan[0] || "")}">${t("logASet")}</button></article><h2 class="section">${t("exercises")}</h2>${S.plan.map(x => {
    let z = S.sets.filter(s => s.ex === x).at(-1);
    return `<article class="exercise"><i>▰</i><div><b>${safe(x)}</b><small>${z ? `${t("last")}: ${z.w} kg × ${z.r}` : t("noSets")}</small></div><button class="round" data-a="set" data-ex="${safe(x)}">+</button></article>`;
  }).join("")}</div>`;
}
function food() {
  let c = sum("cal");
  return `<div class="stack"><article class="card foodtop"><div><p>${t("dailyTotal")}</p><h2>${c} <small>kcal</small></h2><span>${sum("protein")}g ${t("proteinWord")} · ${sum("carbs")}g ${t("carbsWord")} · ${sum("fat")}g ${t("fatWord")}</span></div><button class="round big" data-a="food">+</button></article><div class="head"><h2>${t("todaysFood")}</h2><button data-a="food">${t("addMeal")}</button></div>${S.foods.length ? S.foods.map(x => `<article class="food"><i></i><div><b>${safe(x.name)}</b><small>${x.cal} kcal · P ${x.protein || 0}g · C ${x.carbs || 0}g · F ${x.fat || 0}g</small></div><button data-a="del" data-id="${x.id}">⌫</button></article>`).join("") : `<article class="empty"><b>${t("noMeals")}</b><span>${t("startSimple")}</span><button class="primary" data-a="food">${t("addFirstMeal")}</button></article>`}</div>`;
}
function progress() {
  let v = S.sets.reduce((n, x) => n + x.w * x.r, 0), last = S.weights.at(-1);
  return `<div class="stack"><div class="grid"><article class="card metric"><span>${t("trainingVolume")}</span><b>${v.toLocaleString()}</b><small>${t("kgMoved")}</small></article><article class="card metric"><span>${t("sessions")}</span><b>${new Set(S.sets.map(x => x.d)).size}</b><small>${t("loggedDays")}</small></article></div><article class="card chart"><p>${t("consistency")}</p><h2>${t("keepChain")}</h2><div>${Array.from({ length: 7 }, (_, i) => { let d = new Date(); d.setDate(d.getDate() - 6 + i); let k = d.toISOString().slice(0, 10); return `<i class="${S.checks[k] ? "on" : ""}">${S.checks[k] ? "✓" : ""}</i>`; }).join("")}</div></article><article class="card quick"><div><b>${t("latestWeight")}</b><small>${last ? `${last.w} kg · ${last.d}` : t("addWeighIn")}</small></div><button class="primary" data-a="weight">${t("add")}</button></article></div>`;
}

/* ============================== MODAL (food/set/weight = exact original; goals = original + new settings sections) ============================== */
function modal(kind, ex = "") {
  let b;
  if (kind === "food") {
    b = `<form data-f="food"><label>${t("mealOrFood")}<input name="name" required placeholder="${t("mealPlaceholder")}"></label><div class="formgrid"><label>${t("caloriesLabel")}<input name="cal" required type="number" min="0"></label><label>${t("proteinG")}<input name="protein" type="number" min="0"></label><label>${t("carbsG")}<input name="carbs" type="number" min="0"></label><label>${t("fatG")}<input name="fat" type="number" min="0"></label></div><button class="primary">${t("saveFood")}</button></form>`;
  } else if (kind === "set") {
    b = `<form data-f="set"><p>${safe(ex)}</p><input type="hidden" name="ex" value="${safe(ex)}"><div class="formgrid"><label>${t("weightKg")}<input name="w" type="number" required min="0" step=".5"></label><label>${t("reps")}<input name="r" type="number" required min="1"></label></div><button class="primary">${t("logSet")}</button></form>`;
  } else if (kind === "weight") {
    b = `<form data-f="weight"><label>${t("bodyWeightKg")}<input name="w" required type="number" min="1" step=".1"></label><button class="primary">${t("saveMeasurement")}</button></form>`;
  } else {
    // goals — same numeric form as before, plus new settings sections appended below
    b = `<form data-f="goals" class="formgrid">${Object.entries(S.targets).map(([k, v]) => `<label>${k}<input name="${k}" type="number" min="0" value="${v}"></label>`).join("")}<button class="primary">${t("saveGoals")}</button></form>` + settingsExtras();
  }
  let title = kind === "goals" ? t("yourGoals") : t("addPrefix") + kind;
  M = `<div class="shade" data-a="close"><section class="modal"><header><h2>${title}</h2><button class="icon" data-a="close">×</button></header>${b}</section></div>`;
  render();
}

function settingsExtras() {
  const langs = [["en", "EN"], ["ru", "RU"], ["uz", "UZ"]];
  const cloudSection = cloudUser
    ? `<div class="cloudbtn"><img src="${cloudUser.photoURL || ""}"><div style="flex:1"><b>${safe(cloudUser.displayName || cloudUser.email || "")}</b><div class="subtle">${t("synced")}</div></div></div><button class="ghost" data-a="signout">${t("signOut")}</button>`
    : `<p class="subtle">${t("cloudDesc")}</p><button class="cloudbtn" data-a="signin">🔵 ${t("signInGoogle")}</button>`;
  return `<div class="stack settings-extra">
    <div><label>${t("appearance")}</label><div class="optrow">
      <button class="opt ${S.theme === "system" ? "active" : ""}" data-a="theme" data-v="system">${t("system")}</button>
      <button class="opt ${S.theme === "light" ? "active" : ""}" data-a="theme" data-v="light">${t("light")}</button>
      <button class="opt ${S.theme === "dark" ? "active" : ""}" data-a="theme" data-v="dark">${t("dark")}</button>
    </div></div>
    <div><label>${t("language")}</label><div class="optrow">
      ${langs.map(([code, lab]) => `<button class="opt ${S.language === code ? "active" : ""}" data-a="lang" data-v="${code}">${lab}</button>`).join("")}
    </div></div>
    <div><label>${t("exercisePlan")}</label><div class="stack">
      ${S.plan.map((p, i) => `<div class="planrow"><span>${safe(p)}</span><button data-a="rmex" data-i="${i}">×</button></div>`).join("")}
      <div class="addplan"><input id="new-ex" placeholder="${t("newExercise")}"><button class="round" data-a="addex">+</button></div>
    </div></div>
    <div><label>${t("cloudSync")}</label>${cloudSection}</div>
  </div>`;
}

/* ============================== RENDER / ACT / SUBMIT (original + new handlers) ============================== */
function render() {
  applyTheme();
  let view = { today, train, food, progress }[S.tab]();
  $.innerHTML = `<section class="shell">${header()}<main class="page">${view}</main>${nav()}</section>${M}`;
  document.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => { S.tab = b.dataset.tab; save(); render(); });
  document.querySelectorAll("[data-a]").forEach(b => b.onclick = e => act(e, b));
  document.querySelectorAll("form").forEach(f => f.onsubmit = submit);
}
function act(e, b) {
  let a = b.dataset.a;
  if (a === "close") { if (e.target === b || b.closest(".modal")) { M = ""; render(); } return; }
  if (a === "check") { let d = now(); S.checks[d] ? delete S.checks[d] : S.checks[d] = 1; save(); render(); }
  if (a === "water") { S.water = Math.min(S.targets.water, S.water + 250); save(); render(); }
  if (a === "food" || a === "weight" || a === "goals") modal(a);
  if (a === "set") modal("set", b.dataset.ex);
  if (a === "del") { S.foods = S.foods.filter(x => x.id !== b.dataset.id); save(); render(); }
  if (a === "theme") { S.theme = b.dataset.v; save(); modal("goals"); }
  if (a === "lang") { S.language = b.dataset.v; save(); modal("goals"); }
  if (a === "addex") {
    const input = document.getElementById("new-ex");
    const val = (input.value || "").trim();
    if (val && !S.plan.includes(val)) { S.plan.push(val); save(); }
    modal("goals");
  }
  if (a === "rmex") { S.plan.splice(+b.dataset.i, 1); save(); modal("goals"); }
  if (a === "signin") signInWithGoogle();
  if (a === "signout") signOutUser();
}
function submit(e) {
  e.preventDefault();
  let x = Object.fromEntries(new FormData(e.target)), f = e.target.dataset.f;
  if (f === "food") S.foods.unshift({ id: crypto.randomUUID(), ...x, cal: +x.cal || 0, protein: +x.protein || 0, carbs: +x.carbs || 0, fat: +x.fat || 0 });
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
  if (!user) { render(); return; }
  render();
  try {
    const alreadyResolved = localStorage.getItem(cloudResolvedKey(user.uid)) === "1";
    const docRef = cloudDb.collection("ironlog_users").doc(user.uid);
    const doc = await docRef.get();
    if (doc.exists) {
      const cloudState = doc.data();
      const cloudHasData = cloudState && ((Array.isArray(cloudState.sets) && cloudState.sets.length > 0) || (Array.isArray(cloudState.foods) && cloudState.foods.length > 0));
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
  M = `<div class="shade"><section class="modal"><header><h2>${t("cloudFound")}</h2></header><p class="subtle">${t("cloudFoundDesc")}</p><div class="stack"><button class="primary" data-a="usecloud">${t("useCloud")}</button><button class="ghost" data-a="usedevice">${t("useDevice")}</button></div></section></div>`;
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
  S = Object.assign({}, D, cloudState);
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
if (window.matchMedia) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystemChange = () => { if (S.theme === "system") { applyTheme(); render(); } };
  (mq.addEventListener ? mq.addEventListener("change", onSystemChange) : mq.addListener(onSystemChange));
}
applyTheme();
if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(() => {});
initFirebase();
render();
