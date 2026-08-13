/* IronLog — rebuilt to match the original app (Cut/Bulk, streak, weekly
   schedule, daily check-in, water tracking, body measurements) plus
   dark mode (system-aware) and Google sign-in / cloud sync. */

const K = "ironlog-v5";
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DEFAULT_PLAN = {
  Mon: { title: "Upper Body", exercises: [
    { name: "Bench Press", sets: 4, reps: "5-8" },
    { name: "Barbell Row", sets: 3, reps: "8-10" },
    { name: "Overhead Press", sets: 3, reps: "8-10" },
    { name: "Lat Pulldown", sets: 3, reps: "10-12" }
  ]},
  Tue: { title: "Lower Body", exercises: [
    { name: "Squat", sets: 4, reps: "5-8" },
    { name: "Romanian Deadlift", sets: 3, reps: "8-10" },
    { name: "Leg Press", sets: 3, reps: "10-12" },
    { name: "Leg Curl", sets: 3, reps: "10-15" },
    { name: "Calf Raise", sets: 4, reps: "12-20" },
    { name: "Plank", sets: 3, reps: "sets" }
  ]},
  Thu: { title: "Upper Body", exercises: [
    { name: "Incline Dumbbell Press", sets: 4, reps: "8-10" },
    { name: "Pull-up", sets: 3, reps: "6-10" },
    { name: "Lateral Raise", sets: 3, reps: "12-15" },
    { name: "Bicep Curl", sets: 3, reps: "10-12" }
  ]},
  Fri: { title: "Lower Body", exercises: [
    { name: "Deadlift", sets: 4, reps: "3-5" },
    { name: "Front Squat", sets: 3, reps: "6-8" },
    { name: "Walking Lunge", sets: 3, reps: "10-12" },
    { name: "Calf Raise", sets: 4, reps: "12-20" }
  ]}
};
const D = {
  tab: "today", theme: "system", phase: "cut", streak: 0,
  plan: DEFAULT_PLAN, selectedDay: "Tue",
  checkins: {}, sets: {}, foods: {}, water: {}, weights: [], measurements: [],
  targets: { calMin: 2100, calMax: 2200, protein: 160, water: 3500, sets: 6 }
};
let S = Object.assign({}, D, JSON.parse(localStorage.getItem(K) || "{}"));
S.plan = S.plan || DEFAULT_PLAN;
let M = "";
let openExercise = null;
const $ = document.querySelector("#app");
const pad = n => String(n).padStart(2, "0");
const dkey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = new Date();
const todayKey = dkey(today);
const todayDow = DAY_NAMES[today.getDay()];
const safe = x => String(x || "").replace(/[&<>'"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c]));
const save = () => { localStorage.setItem(K, JSON.stringify(S)); applyTheme(); scheduleCloudPush(); };
const systemPrefersDark = () => window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
const resolvedTheme = () => S.theme === "system" ? (systemPrefersDark() ? "dark" : "light") : (S.theme || "light");
const applyTheme = () => { if (resolvedTheme() === "dark") document.documentElement.setAttribute("data-theme", "dark"); else document.documentElement.removeAttribute("data-theme"); };

function foodsToday() { return S.foods[todayKey] || []; }
function setsToday() { return S.sets[todayKey] || {}; }
function waterToday() { return S.water[todayKey] || 0; }
function sumFood(k) { return foodsToday().reduce((n, x) => n + (+x[k] || 0), 0); }
function setsDoneCount() {
  const st = setsToday();
  return Object.values(st).reduce((n, arr) => n + arr.filter(Boolean).length, 0);
}
function pct(v, m) { return Math.min(100, Math.round((v / m) * 100) || 0); }

/* ============================== HEADER ============================== */
function topbar() {
  return `<div class="topbar">
    <div class="logo-box">🏋️</div>
    <div class="brand"><b>IronLog</b><small>${S.phase === "cut" ? "Cutting phase" : "Bulking phase"}</small></div>
    <div class="segmented">
      <button class="${S.phase === "cut" ? "active" : ""}" data-a="phase" data-v="cut">Cut</button>
      <button class="${S.phase === "bulk" ? "active" : ""}" data-a="phase" data-v="bulk">Bulk</button>
    </div>
    <div class="streak">🔥 ${S.streak || 0}</div>
    <button class="icon-btn" data-a="settings">⚙</button>
  </div>`;
}

/* ============================== WEEK STRIP ============================== */
function weekStrip() {
  const start = new Date(today); start.setDate(today.getDate() - today.getDay());
  let cells = "";
  for (let i = 0; i < 7; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    const k = dkey(d);
    const isToday = k === todayKey;
    const hasData = !!(S.checkins[k] || (S.foods[k] && S.foods[k].length) || (S.sets[k] && Object.values(S.sets[k]).some(a => a.some(Boolean))));
    cells += `<button class="daycell ${isToday ? "today" : ""}" data-a="pickday" data-k="${k}"><span>${DAY_NAMES[d.getDay()]}</span><span class="num">${d.getDate()}</span><i class="dot ${hasData ? "on" : ""}"></i></button>`;
  }
  return `<div class="card weekstrip">${cells}</div>`;
}

/* ============================== TODAY TAB ============================== */
function checkinCard() {
  const c = S.checkins[todayKey];
  const mood = c ? c.mood : null;
  return `<article class="card checkin">
    <h2>Daily check-in</h2>
    <input id="ci-weight" type="number" step=".1" min="1" placeholder="Morning weight (kg)" value="${S._draftWeight != null ? S._draftWeight : (c && c.weight ? c.weight : "")}">
    <div class="moodrow">
      ${["Rough", "Ok", "Great"].map(m => `<button data-a="mood" data-v="${m}" class="${mood === m ? "active" : ""}">${m}</button>`).join("")}
    </div>
    <button class="confirm-btn ${c ? "done" : ""}" data-a="confirm-checkin">${c ? "✓ Checked in today" : "Confirm check-in"}</button>
  </article>`;
}
function statGrid() {
  const cal = sumFood("cal"), prot = sumFood("protein"), water = waterToday(), setsDone = setsDoneCount();
  return `<div class="statgrid">
    <article class="card statcard"><p class="c-cal">CALORIES</p><b>${cal}<small> / ${S.targets.calMin}-${S.targets.calMax}</small></b></article>
    <article class="card statcard"><p class="c-prot">PROTEIN</p><b>${prot}g<small> / ${S.targets.protein}g</small></b></article>
    <article class="card statcard"><p class="c-sets">SETS</p><b>${setsDone}<small> of ${S.targets.sets} today</small></b></article>
    <article class="card statcard"><p class="c-water">WATER</p><b>${(water / 1000).toFixed(1)}L<small> / ${(S.targets.water / 1000).toFixed(1)}L</small></b></article>
  </div>`;
}
function waterCard() {
  const w = waterToday();
  return `<article class="card watercard">
    <div class="whead"><h3>Water intake</h3><button class="icon-btn" data-a="water-minus">–</button></div>
    <div class="waterrow">
      <div class="water-ring" style="--wp:${pct(w, S.targets.water)}%"><span>💧</span></div>
      <button class="water-add" data-a="water-plus">+ Add 250ml glass</button>
    </div>
  </article>`;
}
function trainingPreview() {
  const dayPlan = S.plan[todayDow];
  if (!dayPlan) return `<article class="card" style="padding:18px"><p class="section-title" style="margin:0">Rest day</p><small style="color:var(--muted)">No training scheduled today.</small></article>`;
  const doneEx = Object.entries(setsToday()).filter(([, arr]) => arr.some(Boolean)).length;
  return `<article class="card" data-a="goto-train" style="padding:18px;cursor:pointer">
    <p class="section-title" style="margin:0 0 4px">${todayDow} — ${safe(dayPlan.title)}</p>
    <small style="color:var(--muted)">${doneEx}/${dayPlan.exercises.length} exercises started · tap to open Train</small>
  </article>`;
}
function todayTab() {
  return `<div class="stack">${weekStrip()}${checkinCard()}${statGrid()}${waterCard()}${trainingPreview()}</div>`;
}

/* ============================== TRAIN TAB ============================== */
function exerciseBars(ex, doneCount) {
  let bars = "";
  for (let i = 0; i < ex.sets; i++) bars += `<i class="${i < doneCount ? "done" : ""}"></i>`;
  return `<div class="bars">${bars}</div>`;
}
function trainTab() {
  const days = Object.keys(S.plan);
  const day = S.selectedDay && S.plan[S.selectedDay] ? S.selectedDay : days[0];
  const dayPlan = S.plan[day];
  const query = (S._search || "").toLowerCase();
  let allExercises = [];
  if (query) {
    days.forEach(d => S.plan[d].exercises.forEach(e => { if (e.name.toLowerCase().includes(query)) allExercises.push({ ...e, day: d }); }));
  }
  const list = query ? allExercises : (dayPlan ? dayPlan.exercises.map(e => ({ ...e, day })) : []);
  const setState = S.sets[todayKey] || {};
  return `<div class="stack">
    <div class="card searchbar"><span>🔎</span><input id="ex-search" placeholder="Search any exercise..." value="${safe(S._search || "")}"></div>
    <div class="daypills">
      ${days.map(d => `<button class="daypill ${d === day && !query ? "active" : ""}" data-a="pickday-train" data-v="${d}">${d}</button>`).join("")}
      <button class="icon-btn pencil-btn" data-a="edit-schedule">✎</button>
    </div>
    ${query ? `<h2 class="section-title">Results</h2>` : `<h2 class="section-title">${day} — ${safe(dayPlan ? dayPlan.title : "Rest day")}</h2>`}
    <div class="exlist">
      ${list.length ? list.map(ex => {
        const key = ex.name;
        const doneArr = setState[key] || [];
        const doneCount = doneArr.filter(Boolean).length;
        const isOpen = openExercise === key;
        return `<article class="card">
          <div class="exrow ${isOpen ? "open" : ""}" data-a="toggle-ex" data-v="${safe(key)}">
            ${exerciseBars(ex, doneCount)}
            <div><b>${safe(ex.name)}</b><small>${ex.reps === "sets" ? `${ex.sets} sets` : `${ex.sets}×${ex.reps}`}</small></div>
            <span class="chev">⌄</span>
          </div>
          ${isOpen ? `<div class="setpanel">${Array.from({ length: ex.sets }, (_, i) => {
            const d = doneArr[i];
            return `<div class="setline"><span>#${i + 1}</span><input type="number" placeholder="kg" value="${d && d.w ? d.w : ""}" data-setw="${i}" data-ex="${safe(key)}"><input type="number" placeholder="reps" value="${d && d.r ? d.r : ""}" data-setr="${i}" data-ex="${safe(key)}"><button class="${d ? "done" : ""}" data-a="log-set" data-ex="${safe(key)}" data-i="${i}">${d ? "✓" : "+"}</button></div>`;
          }).join("")}</div>` : ""}
        </article>`;
      }).join("") : `<article class="card food-empty">No exercises found.</article>`}
    </div>
  </div>`;
}

/* ============================== FOOD TAB ============================== */
function iring(icon, v, m, color) {
  return `<span class="iring" style="background:conic-gradient(${color} ${pct(v, m)}%, var(--card-border) 0)"><span>${icon}</span></span>`;
}
function foodTab() {
  const cal = sumFood("cal"), prot = sumFood("protein"), carbs = sumFood("carbs"), fat = sumFood("fat");
  const items = foodsToday();
  return `<div class="stack">
    <article class="card foodtop">
      <div><b class="big-num">${cal}<small>/${S.targets.calMax}</small></b><p>Calories eaten</p></div>
      <div class="ring-wrap"><span class="iring" style="width:56px;height:56px;background:conic-gradient(var(--orange) ${pct(cal, S.targets.calMax)}%, var(--card-border) 0)"><span style="font-size:22px">🔥</span></span><button class="icon-badge" data-a="settings">⚙</button></div>
    </article>
    <div class="macrorow">
      <article class="card macrocard">${iring("🥩", prot, S.targets.protein, "var(--pink)")}<b>${prot}/${S.targets.protein}g</b><span>Protein eaten</span></article>
      <article class="card macrocard">${iring("🌾", carbs, 220, "var(--wheat)")}<b>${carbs}g</b><span>Carbs eaten</span></article>
      <article class="card macrocard">${iring("💧", fat, 70, "var(--blue)")}<b>${fat}g</b><span>Fat eaten</span></article>
    </div>
    <h2 class="section-title">Logged today</h2>
    ${items.length ? `<div class="stack">${items.map(x => `<article class="card fooditem"><div><b>${safe(x.name)}</b><small>${x.cal} kcal · P ${x.protein || 0}g · C ${x.carbs || 0}g · F ${x.fat || 0}g</small></div><button data-a="del-food" data-id="${x.id}">⌫</button></article>`).join("")}</div>` :
      `<article class="card food-empty">Nothing logged yet — tap + to add food.</article>`}
    <button class="fab" data-a="add-food">+</button>
  </div>`;
}

/* ============================== PROGRESS TAB ============================== */
function progressTab() {
  const m = S.measurements.at(-1) || {};
  return `<div class="stack">
    <h2 class="section-title">Body weight</h2>
    ${S.weights.length >= 2 ? weightTrend() : `<article class="card progress-empty">Check in on a few days to see your trend.</article>`}
    <h2 class="section-title">Strength progress</h2>
    ${hasAnySets() ? strengthTrend() : `<article class="card progress-empty">Log some sets in Train to see strength trends here.</article>`}
    <article class="card measure-card">
      <h3>📏 Body measurements</h3>
      <form data-f="measure">
        <div class="measure-grid"><input name="waist" type="number" step=".1" placeholder="Waist (cm)" value="${m.waist || ""}"><input name="chest" type="number" step=".1" placeholder="Chest (cm)" value="${m.chest || ""}"></div>
        <input name="arms" type="number" step=".1" placeholder="Arms (cm)" value="${m.arms || ""}" style="width:100%;margin-bottom:12px">
        <button class="save-btn">Save measurements</button>
      </form>
    </article>
  </div>`;
}
function hasAnySets() { return Object.values(S.sets).some(day => Object.values(day).some(arr => arr.some(Boolean))); }
function weightTrend() {
  const last = S.weights.slice(-7);
  const max = Math.max(...last.map(w => w.w)), min = Math.min(...last.map(w => w.w));
  return `<article class="card" style="padding:18px"><div style="display:flex;align-items:flex-end;gap:6px;height:80px">
    ${last.map(w => `<div style="flex:1;background:var(--orange);border-radius:4px;height:${10 + pct(w.w - min + 0.1, (max - min) + 0.1)}%"></div>`).join("")}
  </div><small style="color:var(--muted)">Last ${last.length} check-ins · ${last.at(-1).w}kg latest</small></article>`;
}
function strengthTrend() {
  const totals = {};
  Object.entries(S.sets).forEach(([, day]) => Object.entries(day).forEach(([ex, arr]) => {
    const vol = arr.filter(Boolean).reduce((n, s) => n + (s.w * s.r || 0), 0);
    totals[ex] = (totals[ex] || 0) + vol;
  }));
  const rows = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 5);
  return `<article class="card" style="padding:18px" class="stack">${rows.map(([ex, v]) => `<div style="display:flex;justify-content:space-between;padding:6px 0"><b style="font-size:14px">${safe(ex)}</b><span style="color:var(--muted);font-size:13px">${v.toLocaleString()} kg total</span></div>`).join("")}</article>`;
}

/* ============================== NAV ============================== */
function bottomNav() {
  const tabs = [["today", "📅", "Today"], ["train", "🏋", "Train"], ["food", "🍴", "Food"], ["progress", "📈", "Progress"]];
  return `<div class="nav-outer"><nav class="bottom-nav">${tabs.map(([id, i, n]) => `<button class="${S.tab === id ? "active" : ""}" data-tab="${id}"><i>${i}</i>${n}</button>`).join("")}</nav></div>`;
}

/* ============================== MODALS ============================== */
function closeModal() { M = ""; render(); }

function foodModal() {
  M = `<div class="shade" data-a="close"><section class="sheet">
    <header><h2>Add food</h2><button class="close" data-a="close">×</button></header>
    <form data-f="food">
      <label>Meal or food<input name="name" required placeholder="Chicken and rice"></label>
      <div class="formgrid2"><label>Calories<input name="cal" required type="number" min="0"></label><label>Protein (g)<input name="protein" type="number" min="0"></label></div>
      <div class="formgrid2"><label>Carbs (g)<input name="carbs" type="number" min="0"></label><label>Fat (g)<input name="fat" type="number" min="0"></label></div>
      <button class="primary">Save food</button>
    </form>
  </section></div>`;
  render();
}

function settingsModal() {
  const cloudSection = cloudUser
    ? `<div class="cloudbtn"><img src="${cloudUser.photoURL || ""}"><div style="flex:1"><b>${safe(cloudUser.displayName || cloudUser.email || "")}</b><div class="subtle" style="margin:0">Synced</div></div></div><button class="cloudbtn" data-a="signout" style="justify-content:center">Sign out</button>`
    : `<p class="subtle">Sign in to back up your data and restore it on any device.</p><button class="cloudbtn" data-a="signin">🔵 Sign in with Google</button>`;
  M = `<div class="shade" data-a="close"><section class="sheet">
    <header><h2>Settings</h2><button class="close" data-a="close">×</button></header>
    <div class="sheet-section">
      <label>Daily targets</label>
      <form data-f="targets">
        <div class="formgrid2"><label>Cal min<input name="calMin" type="number" min="0" value="${S.targets.calMin}"></label><label>Cal max<input name="calMax" type="number" min="0" value="${S.targets.calMax}"></label></div>
        <div class="formgrid2"><label>Protein (g)<input name="protein" type="number" min="0" value="${S.targets.protein}"></label><label>Water (ml)<input name="water" type="number" min="0" value="${S.targets.water}"></label></div>
        <label>Sets per day<input name="sets" type="number" min="0" value="${S.targets.sets}"></label>
        <button class="primary">Save targets</button>
      </form>
    </div>
    <div class="sheet-section">
      <label>Appearance</label>
      <div class="optrow">
        <button class="opt ${S.theme === "system" ? "active" : ""}" data-a="theme" data-v="system">System</button>
        <button class="opt ${S.theme === "light" ? "active" : ""}" data-a="theme" data-v="light">Light</button>
        <button class="opt ${S.theme === "dark" ? "active" : ""}" data-a="theme" data-v="dark">Dark</button>
      </div>
    </div>
    <div class="sheet-section">
      <label>Cloud sync</label>${cloudSection}
    </div>
  </section></div>`;
  render();
}

function editScheduleModal() {
  const days = Object.keys(S.plan);
  const editDay = S._editDay && S.plan[S._editDay] ? S._editDay : days[0];
  const dayPlan = S.plan[editDay];
  const unusedDays = DAY_NAMES.filter(d => !days.includes(d));
  M = `<div class="shade" data-a="close"><section class="sheet">
    <header><h2>Edit schedule</h2><button class="close" data-a="close">×</button></header>
    <div class="daypills" style="margin-bottom:14px">
      ${days.map(d => `<button class="daypill ${d === editDay ? "active" : ""}" data-a="edit-pickday" data-v="${d}">${d}</button>`).join("")}
      ${unusedDays.length ? `<button class="icon-btn" data-a="add-day">+</button>` : ""}
    </div>
    <label>Day title<input id="day-title" value="${safe(dayPlan.title)}" data-a-blur="rename-day"></label>
    <div class="stack" style="margin-bottom:10px">
      ${dayPlan.exercises.map((ex, i) => `<div class="exeditrow">
        <input value="${safe(ex.name)}" data-exname="${i}" placeholder="Exercise name">
        <input value="${ex.sets}" data-exsets="${i}" type="number" min="1" style="width:52px" placeholder="sets">
        <input value="${safe(ex.reps)}" data-exreps="${i}" style="width:64px" placeholder="reps">
        <button data-a="rm-exercise" data-i="${i}">×</button>
      </div>`).join("")}
    </div>
    <button class="addex-btn" data-a="add-exercise">+ Add exercise</button>
    ${days.length > 1 ? `<button class="cloudbtn" style="justify-content:center;margin-top:14px;color:#e0546c" data-a="rm-day">Remove ${editDay} from schedule</button>` : ""}
  </section></div>`;
  render();
}

/* ============================== RENDER (with focus preservation for text inputs) ============================== */
function render() {
  applyTheme();
  const active = document.activeElement;
  const focusId = active && active.id ? active.id : null;
  const selStart = active && "selectionStart" in active ? active.selectionStart : null;

  const view = { today: todayTab, train: trainTab, food: foodTab, progress: progressTab }[S.tab]();
  $.innerHTML = `<section class="shell">${topbar()}<main class="page">${view}</main>${bottomNav()}</section>${M}`;

  document.querySelectorAll("[data-tab]").forEach(b => b.onclick = () => { S.tab = b.dataset.tab; save(); render(); });
  document.querySelectorAll("[data-a]").forEach(b => b.onclick = e => act(e, b));
  document.querySelectorAll("form").forEach(f => f.onsubmit = submit);
  const searchInput = document.getElementById("ex-search");
  if (searchInput) searchInput.oninput = () => { S._search = searchInput.value; render(); };
  const weightInput = document.getElementById("ci-weight");
  if (weightInput) weightInput.oninput = () => { S._draftWeight = weightInput.value; };

  if (focusId) {
    const el = document.getElementById(focusId);
    if (el) { el.focus(); if (selStart !== null && el.setSelectionRange) { try { el.setSelectionRange(selStart, selStart); } catch (e) {} } }
  }
}

function act(e, b) {
  const a = b.dataset.a;
  if (a === "close") { if (e.target === b || b.closest(".sheet")) closeModal(); return; }
  if (a === "phase") { S.phase = b.dataset.v; save(); render(); return; }
  if (a === "settings") { settingsModal(); return; }
  if (a === "pickday") {
    const d = new Date(b.dataset.k);
    const dow = DAY_NAMES[d.getDay()];
    if (S.plan[dow]) { S.tab = "train"; S.selectedDay = dow; S._search = ""; save(); render(); }
    return;
  }
  if (a === "mood") { S._draftMood = b.dataset.v; render(); return; }
  if (a === "confirm-checkin") {
    const w = +(document.getElementById("ci-weight").value || 0);
    const mood = S._draftMood || (S.checkins[todayKey] && S.checkins[todayKey].mood);
    if (!S.checkins[todayKey] && !S.streak) S.streak = 1;
    else if (!S.checkins[todayKey]) S.streak = (S.streak || 0) + 1;
    S.checkins[todayKey] = { weight: w || null, mood: mood || null };
    if (w) S.weights.push({ w, d: todayKey });
    S._draftWeight = null; S._draftMood = null;
    save(); render(); return;
  }
  if (a === "water-plus") { S.water[todayKey] = Math.min(S.targets.water, (S.water[todayKey] || 0) + 250); save(); render(); return; }
  if (a === "water-minus") { S.water[todayKey] = Math.max(0, (S.water[todayKey] || 0) - 250); save(); render(); return; }
  if (a === "goto-train") { S.tab = "train"; S.selectedDay = todayDow; save(); render(); return; }
  if (a === "pickday-train") { S.selectedDay = b.dataset.v; S._search = ""; save(); render(); return; }
  if (a === "edit-schedule") { S._editDay = S.selectedDay; editScheduleModal(); return; }
  if (a === "toggle-ex") { openExercise = openExercise === b.dataset.v ? null : b.dataset.v; render(); return; }
  if (a === "log-set") {
    const ex = b.dataset.ex, i = +b.dataset.i;
    S.sets[todayKey] = S.sets[todayKey] || {};
    S.sets[todayKey][ex] = S.sets[todayKey][ex] || [];
    if (S.sets[todayKey][ex][i]) {
      S.sets[todayKey][ex][i] = null;
    } else {
      const wEl = document.querySelector(`[data-setw="${i}"][data-ex="${CSS.escape(ex)}"]`);
      const rEl = document.querySelector(`[data-setr="${i}"][data-ex="${CSS.escape(ex)}"]`);
      S.sets[todayKey][ex][i] = { w: +(wEl && wEl.value || 0), r: +(rEl && rEl.value || 0) };
    }
    save(); render(); return;
  }
  if (a === "add-food") { foodModal(); return; }
  if (a === "del-food") { S.foods[todayKey] = (S.foods[todayKey] || []).filter(x => x.id !== b.dataset.id); save(); render(); return; }
  if (a === "theme") { S.theme = b.dataset.v; save(); settingsModal(); return; }
  if (a === "signin") { signInWithGoogle(); return; }
  if (a === "signout") { signOutUser(); return; }
  if (a === "edit-pickday") { S._editDay = b.dataset.v; editScheduleModal(); return; }
  if (a === "add-day") {
    const unused = DAY_NAMES.filter(d => !S.plan[d]);
    if (unused.length) { S.plan[unused[0]] = { title: "New Day", exercises: [] }; S._editDay = unused[0]; save(); editScheduleModal(); }
    return;
  }
  if (a === "rm-day") {
    delete S.plan[S._editDay];
    const remaining = Object.keys(S.plan);
    S._editDay = remaining[0]; S.selectedDay = remaining[0];
    save(); editScheduleModal(); return;
  }
  if (a === "add-exercise") {
    S.plan[S._editDay].exercises.push({ name: "New exercise", sets: 3, reps: "8-10" });
    save(); editScheduleModal(); return;
  }
  if (a === "rm-exercise") {
    S.plan[S._editDay].exercises.splice(+b.dataset.i, 1);
    save(); editScheduleModal(); return;
  }
}

/* live-edit fields inside the schedule editor (name/sets/reps/title) */
document.addEventListener("change", e => {
  const t = e.target;
  if (t.matches("[data-exname]")) { S.plan[S._editDay].exercises[+t.dataset.exname].name = t.value; save(); }
  if (t.matches("[data-exsets]")) { S.plan[S._editDay].exercises[+t.dataset.exsets].sets = Math.max(1, +t.value || 1); save(); }
  if (t.matches("[data-exreps]")) { S.plan[S._editDay].exercises[+t.dataset.exreps].reps = t.value; save(); }
  if (t.id === "day-title") { S.plan[S._editDay].title = t.value; save(); }
});

function submit(e) {
  e.preventDefault();
  const x = Object.fromEntries(new FormData(e.target));
  const f = e.target.dataset.f;
  if (f === "food") {
    S.foods[todayKey] = S.foods[todayKey] || [];
    S.foods[todayKey].unshift({ id: crypto.randomUUID(), name: x.name, cal: +x.cal || 0, protein: +x.protein || 0, carbs: +x.carbs || 0, fat: +x.fat || 0 });
    save(); closeModal(); return;
  }
  if (f === "targets") {
    S.targets = { calMin: +x.calMin || 0, calMax: +x.calMax || 0, protein: +x.protein || 0, water: +x.water || 0, sets: +x.sets || 0 };
    save(); closeModal(); return;
  }
  if (f === "measure") {
    S.measurements.push({ d: todayKey, waist: +x.waist || null, chest: +x.chest || null, arms: +x.arms || null });
    save(); render(); return;
  }
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
      const cloudHasData = cloudState && ((cloudState.foods && Object.keys(cloudState.foods).length) || (cloudState.sets && Object.keys(cloudState.sets).length) || (cloudState.checkins && Object.keys(cloudState.checkins).length));
      const localHasData = Object.keys(S.foods).length || Object.keys(S.sets).length || Object.keys(S.checkins).length;
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
  M = `<div class="shade"><section class="sheet"><header><h2>Cloud backup found</h2></header>
    <p class="subtle">This account already has saved data. Which version do you want to keep?</p>
    <div class="stack"><button class="primary" data-a="usecloud">Use cloud data</button><button class="cloudbtn" style="justify-content:center" data-a="usedevice">Keep this device's data</button></div>
  </section></div>`;
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
