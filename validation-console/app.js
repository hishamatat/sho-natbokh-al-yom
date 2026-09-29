"use strict";

const STORAGE_KEY = "sho-natbokh-v00-console-v1";
const emptyState = () => ({
  version: 1,
  settings: { trialName: "تجربة الكويت اليدوية", startDate: "", operator: "", privateStoreConfirmed: false, safetyIssueOpen: false },
  families: [], recipes: [], sessions: []
});

let state = loadState();
let currentView = "dashboard";
let editingId = null;
const app = document.getElementById("app");
const toastEl = document.getElementById("toast");
const importFile = document.getElementById("importFile");

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    return { ...emptyState(), ...parsed, settings: { ...emptyState().settings, ...(parsed.settings || {}) } };
  } catch { return emptyState(); }
}

function saveState(message = "تم الحفظ") {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  const save = document.getElementById("saveState");
  if (save) { save.textContent = "محفوظ على هذا الجهاز"; }
  toast(message);
}

function toast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  clearTimeout(toastEl.timer);
  toastEl.timer = setTimeout(() => toastEl.classList.remove("show"), 2200);
}

function esc(value = "") {
  return String(value).replace(/[&<>'"]/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" }[c]));
}

function id() { return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function today() { return new Date().toISOString().slice(0, 10); }
function addDays(date, days) { if (!date) return ""; const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate() + days); return d.toISOString().slice(0,10); }
function daysBetween(a, b) { return Math.floor((new Date(`${b}T12:00:00`) - new Date(`${a}T12:00:00`)) / 86400000); }
function formatDate(date) { return date ? new Intl.DateTimeFormat("ar-KW", { dateStyle:"medium" }).format(new Date(`${date}T12:00:00`)) : "غير محدد"; }
function bool(form, name) { return form.get(name) === "on"; }
function familyById(fid) { return state.families.find(f => f.id === fid); }
function recipeById(rid) { return state.recipes.find(r => r.id === rid); }
function eligibleFamilies() { return state.families.filter(f => ["active", "complete"].includes(f.status) && f.kuwait && f.adult && f.noRelation && f.consent); }
function familySessions(fid) { return state.sessions.filter(s => s.familyId === fid).sort((a,b) => a.date.localeCompare(b.date)); }
function nextCode() { const nums = state.families.map(f => Number((f.code || "").replace(/\D/g,"")) || 0); return `K${String(Math.max(0,...nums)+1).padStart(2,"0")}`; }

function metrics() {
  const eligible = eligibleFamilies();
  const matured = eligible.filter(f => f.joinedAt && daysBetween(f.joinedAt, today()) >= 14 && familySessions(f.id).length > 0);
  let voluntary = 0, week2 = 0;
  eligible.forEach(f => {
    const sessions = familySessions(f.id);
    const repeats = sessions.slice(1).filter(s => s.initiative === "voluntary");
    if (repeats.length) voluntary++;
    if (sessions.some(s => s.initiative === "voluntary" && f.joinedAt && daysBetween(f.joinedAt, s.date) >= 7 && daysBetween(f.joinedAt, s.date) <= 13)) week2++;
  });
  const offered = state.sessions.filter(s => (s.suggestions || []).length > 0);
  const firstChoices = offered.filter(s => s.outcome === "first").length;
  const choiceRate = offered.length ? Math.round(firstChoices / offered.length * 100) : 0;
  const cooked = state.sessions.filter(s => s.cooked === "yes").length;
  return { eligible:eligible.length, matured:matured.length, voluntary, week2, offered:offered.length, firstChoices, choiceRate, cooked };
}

function decision(m) {
  const closed = state.settings.startDate && today() >= addDays(state.settings.startDate, 28);
  if (state.settings.safetyIssueOpen) return { key:"stop", title:"توقف مؤقت", text:"هناك مشكلة سلامة أو خصوصية مفتوحة. لا نكمل الدعوات قبل حلها." };
  if (!closed || m.matured < 15) return { key:"collecting", title:"ما زلنا نجمع النتائج", text:`لدينا ${m.matured} من 15 عائلة أكملت فترة المتابعة. القرار النهائي ينتظر إغلاق التجربة.` };
  if (m.voluntary >= 8 && m.week2 >= 5 && m.choiceRate >= 50) return { key:"go", title:"النتيجة تشير إلى الاستمرار", text:"حققت التجربة شروط العودة والاختيار. يبقى إعداد التقرير ومراجعته قبل التفكير بالمرحلة التالية." };
  if (m.voluntary <= 4 || m.choiceRate < 35) return { key:"stop", title:"النتيجة تشير إلى التوقف أو إعادة التفكير", text:"العودة أو الاختيار أقل من الحد المتفق عليه. لا نبدأ بناء المنتج بهذه الصورة." };
  return { key:"modify", title:"النتيجة تشير إلى تعديل واحد", text:"هناك إشارة جزئية. نختار مشكلة واحدة واضحة ونجرب تعديلًا واحدًا لمدة لا تتجاوز أسبوعين." };
}

function setView(view, edit = null) {
  currentView = view; editingId = edit;
  document.querySelectorAll(".nav button").forEach(b => b.classList.toggle("active", b.dataset.view === view || (view.includes("family") && b.dataset.view === "families") || (view.includes("recipe") && b.dataset.view === "recipes")));
  render(); app.focus(); window.scrollTo({ top:0, behavior:"smooth" });
}

function pageHead(title, subtitle, actions = "") {
  return `<div class="page-head"><div><h2>${title}</h2><p>${subtitle}</p></div><div class="actions">${actions}</div></div>`;
}

const outreachMessages = [
  {
    title: "1. إعلان المجموعة",
    note: "ينشر مرة واحدة في مجموعة كويتية لا تعرف المشاركات فيها.",
    text: `مساء الخير 🌿\nنعمل تجربة مجانية لمدة 4 أسابيع لمساعدة العائلات في الكويت على اختيار طبخة اليوم بسرعة وبخيارات تناسب الوقت والميزانية.\n\nالمشاركة بسيطة وتتم عبر واتساب، وليست إعلان بيع. نبحث عن عائلات لا توجد بينها وبين صاحب المشروع أي معرفة سابقة.\n\nإذا مهتمة، أرسلي لي على الخاص كلمة: مهتمة.`
  },
  {
    title: "2. التأكد من شروط المشاركة",
    note: "ترسل على الخاص لمن تواصلت من نفسها.",
    text: `شكرًا لاهتمامك 🌿 قبل ما نبدأ، أحتاج أتأكد من 4 نقاط:\n\n1) هل تعيش عائلتكم في الكويت؟\n2) هل عمرك 18 سنة أو أكثر وتشاركين عادةً في قرار طبخة البيت؟\n3) هل صحيح أنه لا توجد معرفة سابقة بينكم وبين صاحب المشروع أو أسرته؟\n4) هل توافقين على تجربة الخدمة وتسجيل النتائج برمز مجهول من دون وضع اسمك أو رقمك داخل لوحة النتائج؟\n\nيمكنك الانسحاب وطلب حذف بياناتك في أي وقت.`
  },
  {
    title: "3. رسالة بدء التجربة",
    note: "ترسل بعد تحقق الشروط الأربعة.",
    text: `أهلًا وسهلًا 🌿 تم قبول مشاركتكم في تجربة «شو نطبخ اليوم؟» لمدة 4 أسابيع.\n\nعندما تحتارون بالطبخة، راسليني من نفسكم وسأطرح أسئلة قصيرة ثم أرسل حتى 3 اقتراحات. الهدف أن نعرف هل الخدمة مفيدة فعلًا في الحياة اليومية.\n\nمهم: أخبريني عن أي حساسية أو مكوّن ممنوع قبل الاقتراح. تحققي دائمًا من المكونات وطريقة التحضير المناسبة لعائلتك.`
  },
  {
    title: "4. أسئلة كل مرة",
    note: "يمكن نسخها أيضاً من داخل صفحة الجلسة.",
    text: `حتى أختار لكم اقتراحات مناسبة اليوم:\n\n1) كم شخصًا سيأكل؟\n2) كم عندكم وقت للطبخ؟\n3) الميزانية اليوم: اقتصادية، متوسطة، أم مرتفعة؟\n4) ما الأكلات أو المكونات التي لا تريدونها اليوم؟\n5) اختياري: هل توجد مكونات في البيت تحبون استعمالها؟\n6) هل ما زالت قيود الحساسية أو المكونات الممنوعة كما هي؟`
  },
  {
    title: "5. سؤال المتابعة",
    note: "يرسل بعد وقت مناسب من اختيار الطبخة.",
    text: `متابعة سريعة لو سمحتِ 🌿\nهل طبختِ الاقتراح الذي اخترتِه فعلًا؟\n- نعم\n- لا\n\nإذا لا، ما السبب بكلمة أو جملة قصيرة؟`
  }
];

function renderMessages() {
  return `${pageHead("رسائل واتساب الجاهزة","اتبعيها بالترتيب واضغطي نسخ، ثم الصقيها في واتساب")}
    <div class="notice phone-note"><span>📱</span><span>لا تضعي اسم المشاركة أو رقمها في اللوحة. احتفظي بالتواصل في هاتفك، واستخدمي رمزًا مثل K01 داخل البرنامج.</span></div>
    <div class="grid" style="margin-top:16px">${outreachMessages.map((m,i)=>`<section class="card message-card"><div><h3>${m.title}</h3><p class="muted">${m.note}</p></div><div class="message-text">${esc(m.text)}</div><div class="copy-row"><button class="btn primary" data-action="copy-message" data-message="${i}">نسخ الرسالة</button></div></section>`).join("")}</div>`;
}

function progress(label, value, target, suffix = "") {
  const pct = Math.min(100, target ? Math.round(value/target*100) : 0);
  return `<div class="progress-row"><strong>${label}</strong><div class="bar"><i class="${pct>=100?'done':''}" style="width:${pct}%"></i></div><span>${value}${suffix} / ${target}${suffix}</span></div>`;
}

function renderDashboard() {
  const m = metrics(), d = decision(m), start = state.settings.startDate;
  const recent = [...state.sessions].sort((a,b) => b.date.localeCompare(a.date)).slice(0,5);
  let next = !start ? "حددي تاريخ البداية من صفحة التجهيز." : state.recipes.filter(r=>r.reviewed).length < 3 ? "أضيفوا 3 وصفات مراجعة على الأقل قبل دعوة أول عائلة." : m.eligible === 0 ? "أضيفوا أول عائلة بعد موافقتها واجتياز شروط المشاركة." : "ابدؤوا جلسة جديدة أو أكملوا المتابعات.";
  return `${pageHead("الرئيسية","كل ما تحتاجينه لمعرفة وضع التجربة الآن",`<button class="btn primary" data-view="session">ابدئي جلسة</button>`)}
    <div class="hint"><strong>الخطوة التالية:</strong> ${next}</div>
    <div class="grid stats" style="margin-top:16px">
      <div class="card stat"><strong>${m.eligible}</strong><span>عائلة مؤهلة</span></div>
      <div class="card stat"><strong>${state.sessions.length}</strong><span>جلسة مسجلة</span></div>
      <div class="card stat"><strong>${m.voluntary}</strong><span>عادت من نفسها</span></div>
      <div class="card stat ${m.choiceRate>=50?'good':''}"><strong>${m.choiceRate}%</strong><span>اختيار من أول عرض</span></div>
    </div>
    <div class="grid two">
      <section class="card"><h3>تقدم شروط القرار</h3><div class="progress-list">
        ${progress("أكملت أسبوعين",m.matured,15)}
        ${progress("عادت طوعيًا",m.voluntary,8)}
        ${progress("عادت في الأسبوع الثاني",m.week2,5)}
        ${progress("اختيار الجولة الأولى",m.choiceRate,50,"%")}
      </div></section>
      <section class="status-box ${d.key}"><h3>${d.title}</h3><p>${d.text}</p></section>
    </div>
    <div class="grid two" style="margin-top:16px">
      <section class="card"><h3>مواعيد التجربة</h3>
        <div class="metric-row"><span>البداية</span><strong>${formatDate(start)}</strong></div>
        <div class="metric-row"><span>إغلاق قبول العائلات</span><strong>${formatDate(addDays(start,14))}</strong></div>
        <div class="metric-row"><span>إغلاق النتائج</span><strong>${formatDate(addDays(start,28))}</strong></div>
        <div class="metric-row"><span>التقرير النهائي</span><strong>${formatDate(addDays(start,33))}</strong></div>
      </section>
      <section class="card"><h3>آخر الجلسات</h3>${recent.length ? `<div class="list">${recent.map(s=>{const f=familyById(s.familyId);return `<div class="list-item"><div><strong>${esc(f?.code||"محذوفة")}</strong><div class="muted">${formatDate(s.date)} · ${outcomeLabel(s.outcome)}</div></div><button class="btn small" data-action="edit-session" data-id="${s.id}">فتح</button></div>`}).join("")}</div>` : `<p class="muted">لا توجد جلسات بعد.</p>`}</section>
    </div>`;
}

function renderFamilies() {
  const items = [...state.families].sort((a,b)=>a.code.localeCompare(b.code));
  return `${pageHead("العائلات","نستخدم رمزًا فقط، ولا نكتب اسمًا أو رقم هاتف",`<button class="btn primary" data-action="new-family">إضافة عائلة</button>`)}
    <div class="notice">العائلة المؤهلة تعيش في الكويت، يمثلها بالغ يشارك في قرار الوجبة، لا تعرف المؤسس سابقًا، ووافقت بوضوح.</div>
    ${items.length ? `<div class="list" style="margin-top:16px">${items.map(f=>{
      const count=familySessions(f.id).length; const eligible=['active','complete'].includes(f.status)&&f.kuwait&&f.adult&&f.noRelation&&f.consent;
      return `<div class="list-item"><div><h3>${esc(f.code)}</h3><div class="meta"><span class="pill ${eligible?'green':'red'}">${eligible?'مؤهلة':'غير محتسبة'}</span><span class="pill">${esc(sourceLabel(f.source))}</span><span class="pill">${count} جلسة</span><span class="pill">بدأت ${formatDate(f.joinedAt)}</span></div></div><div class="actions"><button class="btn small" data-action="new-session-family" data-id="${f.id}">جلسة</button><button class="btn small" data-action="edit-family" data-id="${f.id}">فتح</button></div></div>`}).join("")}</div>` : empty("لا توجد عائلات","بعد وصول أول مشاركة وموافقتها، أضيفي رمزها هنا.","إضافة عائلة","new-family")}`;
}

function renderFamilyForm() {
  const f = state.families.find(x=>x.id===editingId) || { code:nextCode(), joinedAt:today(), source:"group", status:"active", kuwait:false, adult:false, noRelation:false, consent:false };
  return `${pageHead(editingId?`العائلة ${esc(f.code)}`:"إضافة عائلة جديدة","لا تضعي الاسم أو رقم الهاتف هنا",`<button class="btn" data-view="families">رجوع</button>`)}
    <form id="familyForm" class="card">
      <div class="form-grid">
        <div class="field"><label class="required">رمز العائلة</label><input name="code" required value="${esc(f.code)}" pattern="[A-Za-z0-9_-]+"><small>مثل K01. لا تستعملي الاسم.</small></div>
        <div class="field"><label class="required">تاريخ الانضمام</label><input type="date" name="joinedAt" required value="${esc(f.joinedAt)}"></div>
        <div class="field"><label class="required">كيف وصلت الدعوة؟</label><select name="source"><option value="group" ${f.source==='group'?'selected':''}>مجموعة محلية</option><option value="community" ${f.source==='community'?'selected':''}>جهة مجتمعية</option><option value="indirect" ${f.source==='indirect'?'selected':''}>وسيط لا يعرفها المؤسس</option><option value="other" ${f.source==='other'?'selected':''}>مصدر آخر</option></select></div>
        <div class="field"><label>حالة المشاركة</label><select name="status"><option value="active" ${f.status==='active'?'selected':''}>نشطة</option><option value="withdrawn" ${f.status==='withdrawn'?'selected':''}>انسحبت</option><option value="excluded" ${f.status==='excluded'?'selected':''}>مستبعدة</option><option value="complete" ${f.status==='complete'?'selected':''}>أكملت</option></select></div>
      </div>
      <h3 class="section-title">شروط المشاركة</h3>
      <div class="checks">
        ${checkbox("kuwait","العائلة تعيش في الكويت",f.kuwait)}
        ${checkbox("adult","المشارك بالغ ويشارك فعليًا في قرار الوجبة",f.adult)}
        ${checkbox("noRelation","لا توجد أي معرفة أو علاقة سابقة مع المؤسس",f.noRelation)}
        ${checkbox("consent","وافق بوضوح على المشاركة وتسجيل النتائج برمز",f.consent)}
      </div>
      <h3 class="section-title">معلومات تساعد الجلسات</h3>
      <div class="form-grid">
        <div class="field"><label>عدد الأشخاص المعتاد</label><input type="number" min="1" max="20" name="householdSize" value="${esc(f.householdSize||"")}"></div>
        <div class="field"><label>هل تريد استعمال المكونات الموجودة؟</label><select name="pantryPreference"><option value="unknown" ${f.pantryPreference==='unknown'?'selected':''}>لم نسأل بعد</option><option value="skip" ${f.pantryPreference==='skip'?'selected':''}>لا تريد</option><option value="optional" ${f.pantryPreference==='optional'?'selected':''}>أحيانًا</option><option value="yes" ${f.pantryPreference==='yes'?'selected':''}>نعم</option></select></div>
        <div class="field full"><label>القيود الضرورية</label><textarea name="restrictions" placeholder="مثال: حساسية محددة أو مكوّن ممنوع. اكتبي أقل قدر لازم.">${esc(f.restrictions||"")}</textarea></div>
        <div class="field full"><label>الأذواق والتفضيلات</label><textarea name="preferences">${esc(f.preferences||"")}</textarea></div>
        <div class="field full"><label>ملاحظات المقابلة الأخيرة</label><textarea name="interviewNotes" placeholder="القيمة، سبب عدم العودة، رأيها بالمخزون، وما تدفع له اليوم...">${esc(f.interviewNotes||"")}</textarea></div>
      </div>
      <div class="actions"><button class="btn primary" type="submit">حفظ العائلة</button>${editingId?`<button class="btn danger" type="button" data-action="delete-family" data-id="${f.id}">حذف بيانات العائلة</button>`:""}</div>
    </form>`;
}

function checkbox(name,label,checked){return `<label class="check"><input type="checkbox" name="${name}" ${checked?'checked':''}><span>${label}</span></label>`}
function sourceLabel(v){return ({group:"مجموعة محلية",community:"جهة مجتمعية",indirect:"وسيط غير مباشر",other:"مصدر آخر"})[v]||"غير محدد"}

function renderSessionForm() {
  const s = state.sessions.find(x=>x.id===editingId) || { familyId:"", date:today(), initiative:"initial", outcome:"", cooked:"unknown", suggestions:[] };
  const families = eligibleFamilies(); const recipes = state.recipes.filter(r=>r.reviewed);
  if (!families.length) return `${pageHead("جلسة جديدة","نحتاج عائلة مؤهلة أولًا")} ${empty("لا توجد عائلة مؤهلة","أضيفي عائلة وأكملي شروط المشاركة الأربعة.","إضافة عائلة","new-family")}`;
  const opts = families.map(f=>`<option value="${f.id}" ${(s.familyId===f.id)?'selected':''}>${esc(f.code)}</option>`).join("");
  const recipeOpts = `<option value="">اكتبي خيارًا يدويًا أو اختاري وصفة</option>`+recipes.map(r=>`<option value="${r.id}">${esc(r.title)} · ${r.minutes} د · ${budgetLabel(r.budget)}</option>`).join("");
  const slots=["الأنسب للعائلة","الأسرع","الأوفر تقديريًا"];
  return `${pageHead(editingId?"تعديل جلسة":"جلسة قرار جديدة","اقرئي السؤال كما هو، ثم سجلي الجواب باختصار",`<button class="btn" data-view="dashboard">رجوع</button>`)}
    <div class="steps"><div class="step active">1 · السياق</div><div class="step active">2 · الخيارات</div><div class="step active">3 · النتيجة</div></div>
    <form id="sessionForm">
      <section class="card">
        <h3>1. اسألي عن اليوم</h3>
        <div class="copy-row" style="margin-bottom:14px"><button class="btn" type="button" data-action="copy-session-questions">نسخ الأسئلة للعائلة</button><button class="btn primary" type="button" data-action="copy-chatgpt">جهزي طلب ChatGPT</button></div>
        <div class="notice" style="margin-bottom:14px">ابدئي بتعبئة الإجابات، ثم اضغطي «جهزي طلب ChatGPT». لا تنسخي اسمًا أو رقم هاتف.</div>
        <div class="form-grid">
          <div class="field"><label class="required">رمز العائلة</label><select name="familyId" required><option value="">اختاري</option>${opts}</select></div>
          <div class="field"><label class="required">تاريخ الجلسة</label><input type="date" name="date" required value="${esc(s.date)}"></div>
          <div class="field"><label>كيف بدأت الجلسة؟</label><select name="initiative"><option value="voluntary" ${s.initiative==='voluntary'?'selected':''}>العائلة طلبت من نفسها</option><option value="prompted" ${s.initiative==='prompted'?'selected':''}>بعد تذكير منا</option><option value="initial" ${s.initiative==='initial'?'selected':''}>الجلسة الأولى</option></select></div>
          <div class="field"><label>اسألي: كم شخصًا؟</label><input type="number" min="1" max="20" name="servings" value="${esc(s.servings||"")}"></div>
          <div class="field"><label>اسألي: كم عندكم وقت؟</label><select name="timeLimit"><option value="15" ${s.timeLimit==15?'selected':''}>15 دقيقة</option><option value="30" ${s.timeLimit==30?'selected':''}>30 دقيقة</option><option value="45" ${s.timeLimit==45?'selected':''}>45 دقيقة</option><option value="60" ${s.timeLimit==60?'selected':''}>ساعة</option><option value="90" ${s.timeLimit==90?'selected':''}>أكثر من ساعة</option></select></div>
          <div class="field"><label>اسألي: الميزانية اليوم؟</label><select name="budget"><option value="1" ${s.budget==1?'selected':''}>اقتصادية</option><option value="2" ${s.budget==2?'selected':''}>متوسطة</option><option value="3" ${s.budget==3?'selected':''}>مرتفعة</option></select></div>
          <div class="field full"><label>اسألي: شو ما بدكم اليوم؟</label><textarea name="dontWant">${esc(s.dontWant||"")}</textarea></div>
          <div class="field full"><label>اختياري: في مكونات تحبوا تستعملوها؟</label><textarea name="ingredients" placeholder="اتركيها فارغة إذا لا يريدون ذكر المكونات">${esc(s.ingredients||"")}</textarea></div>
        </div>
        ${checkbox("restrictionsConfirmed","أكدتُ القيود الضرورية المسجلة للعائلة قبل اختيار الوصفات",s.restrictionsConfirmed)}
      </section>
      <section class="card"><h3>2. اختاري حتى ثلاثة اقتراحات</h3><p class="muted">استعملي وصفات مراجعة فقط. إذا لم يوجد خيار مناسب، لا تملئي العدد لمجرد الوصول إلى ثلاثة.</p>
        <div class="grid">${slots.map((label,i)=>{const x=s.suggestions?.[i]||{};return `<div class="suggestion"><h4>${i+1}. ${label}</h4><div class="form-grid"><div class="field"><label>وصفة مراجعة</label><select name="s${i}Recipe">${recipeOpts.replace(`value="${x.recipeId||'__none__'}"`,`value="${x.recipeId||'__none__'}" selected`)}</select></div><div class="field"><label>أو اسم خيار يدوي</label><input name="s${i}Title" value="${esc(x.title||"")}"></div><div class="field full"><label>لماذا يناسبهم؟</label><input name="s${i}Reason" value="${esc(x.reason||"")}" placeholder="سبب قصير وصادق"></div></div></div>`}).join("")}</div>
      </section>
      <section class="card"><h3>3. سجلي ما حدث</h3>
        <div class="form-grid">
          <div class="field"><label class="required">النتيجة</label><select name="outcome" required><option value="">اختاري</option><option value="first" ${s.outcome==='first'?'selected':''}>اختارت من أول عرض</option><option value="adjusted" ${s.outcome==='adjusted'?'selected':''}>اختارت بعد تعديل واحد</option><option value="none" ${s.outcome==='none'?'selected':''}>رفضت كل الخيارات</option><option value="no_response" ${s.outcome==='no_response'?'selected':''}>لم ترد</option></select></div>
          <div class="field"><label>أي اقتراح اختارت؟</label><select name="chosenSlot"><option value="">لا يوجد / غير معلوم</option><option value="0" ${s.chosenSlot==='0'?'selected':''}>الأول</option><option value="1" ${s.chosenSlot==='1'?'selected':''}>الثاني</option><option value="2" ${s.chosenSlot==='2'?'selected':''}>الثالث</option></select></div>
          <div class="field"><label>كم دقيقة استغرق القرار؟</label><input type="number" min="0" max="240" name="decisionMinutes" value="${esc(s.decisionMinutes||"")}"></div>
          <div class="field"><label>هل طبخت الوجبة فعلًا؟</label><select name="cooked"><option value="unknown" ${s.cooked==='unknown'?'selected':''}>غير معلوم</option><option value="yes" ${s.cooked==='yes'?'selected':''}>نعم</option><option value="no" ${s.cooked==='no'?'selected':''}>لا</option></select></div>
          <div class="field full"><label>سبب الرفض أو التعديل</label><textarea name="rejectionReason" placeholder="ذوق، وقت، ميزانية، تكرار، مكونات، وضوح، أو سبب آخر">${esc(s.rejectionReason||"")}</textarea></div>
          <div class="field full"><label>ملاحظة قصيرة</label><textarea name="notes">${esc(s.notes||"")}</textarea></div>
        </div>
        <div class="actions"><button class="btn primary" type="submit">حفظ الجلسة</button>${editingId?`<button class="btn danger" type="button" data-action="delete-session" data-id="${s.id}">حذف الجلسة</button>`:""}</div>
      </section>
    </form>`;
}

function budgetLabel(v){return ({1:"اقتصادية",2:"متوسطة",3:"مرتفعة"})[v]||"غير محددة"}
function outcomeLabel(v){return ({first:"اختيار من أول عرض",adjusted:"اختيار بعد تعديل",none:"رفض الخيارات",no_response:"لا رد"})[v]||"غير مكتملة"}

function renderRecipes() {
  const recipes=[...state.recipes].sort((a,b)=>a.title.localeCompare(b.title,"ar"));
  return `${pageHead("الوصفات المراجعة","هذه قائمة مساعدة للمُشغّلة وليست مكتبة المنتج النهائي",`<button class="btn primary" data-action="new-recipe">إضافة وصفة</button>`)}
    <div class="warning">لا تعتمدي أي وصفة قبل مراجعة المقادير والخطوات والقيود والمصدر. الوصفات غير المراجعة لا تظهر في شاشة الجلسة.</div>
    ${recipes.length?`<div class="list" style="margin-top:16px">${recipes.map(r=>`<div class="list-item"><div><h3>${esc(r.title)}</h3><div class="meta"><span class="pill">${r.minutes} دقيقة</span><span class="pill">${budgetLabel(r.budget)}</span><span class="pill ${r.reviewed?'green':'red'}">${r.reviewed?'مراجعة':'غير مراجعة'}</span></div><p class="muted">${esc(r.tags||"")}</p></div><button class="btn small" data-action="edit-recipe" data-id="${r.id}">فتح</button></div>`).join("")}</div>`:empty("لا توجد وصفات","أضيفي وصفات مراجعة قبل أول جلسة.","إضافة وصفة","new-recipe")}`;
}

function renderRecipeForm() {
  const r=state.recipes.find(x=>x.id===editingId)||{title:"",minutes:30,budget:"2",reviewed:false};
  return `${pageHead(editingId?"تعديل وصفة":"إضافة وصفة","سجلي الحد الأدنى الذي يساعد في الاختيار",`<button class="btn" data-view="recipes">رجوع</button>`)}
  <form id="recipeForm" class="card"><div class="form-grid">
    <div class="field"><label class="required">اسم الوصفة</label><input name="title" required value="${esc(r.title)}"></div>
    <div class="field"><label class="required">الوقت بالدقائق</label><input type="number" min="1" max="600" name="minutes" required value="${esc(r.minutes)}"></div>
    <div class="field"><label>فئة الميزانية</label><select name="budget"><option value="1" ${r.budget==1?'selected':''}>اقتصادية</option><option value="2" ${r.budget==2?'selected':''}>متوسطة</option><option value="3" ${r.budget==3?'selected':''}>مرتفعة</option></select></div>
    <div class="field"><label>المصدر</label><input name="source" value="${esc(r.source||"")}" placeholder="كتاب، وصفة عائلية، أو رابط مصدر"></div>
    <div class="field full"><label>كلمات تساعد البحث</label><input name="tags" value="${esc(r.tags||"")}" placeholder="دجاج، رز، سريع، كويتي..."></div>
    <div class="field full"><label>تنبيهات أو قيود مهمة</label><textarea name="warnings">${esc(r.warnings||"")}</textarea></div>
  </div>${checkbox("reviewed","راجعت المقادير والخطوات والحصص والمصدر والقيود",r.reviewed)}
  <div class="actions"><button class="btn primary" type="submit">حفظ الوصفة</button>${editingId?`<button class="btn danger" type="button" data-action="delete-recipe" data-id="${r.id}">حذف الوصفة</button>`:""}</div></form>`;
}

function renderReport() {
  const m=metrics(), d=decision(m); const bySource={};
  eligibleFamilies().forEach(f=>{const k=sourceLabel(f.source);bySource[k]=(bySource[k]||0)+1});
  return `${pageHead("النتائج","أرقام واضحة من دون أسماء",`<button class="btn" data-action="export-csv">تنزيل جدول الجلسات</button><button class="btn" onclick="window.print()">طباعة التقرير</button>`)}
    <section class="status-box ${d.key}"><h3>${d.title}</h3><p>${d.text}</p></section>
    <div class="grid two" style="margin-top:16px">
      <section class="card"><h3>النتائج الأساسية</h3>
        ${metric("عائلات مؤهلة",m.eligible)}${metric("أكملت أسبوعين",m.matured)}${metric("عادت من نفسها",m.voluntary)}${metric("نشطت في الأسبوع الثاني",m.week2)}${metric("جلسات قُدمت فيها خيارات",m.offered)}${metric("اختيار من أول عرض",`${m.choiceRate}%`)}${metric("طبخ مصرح به",m.cooked)}
      </section>
      <section class="card"><h3>مصادر الوصول</h3>${Object.keys(bySource).length?Object.entries(bySource).map(([k,v])=>metric(k,v)).join(""):`<p class="muted">لا توجد عائلات مؤهلة بعد.</p>`}</section>
    </div>
    <section class="card" style="margin-top:16px"><h3>تذكير عند قراءة النتيجة</h3><ul><li>لا نقرر قبل اكتمال 15 عائلة لفترة أسبوعين وإغلاق الأسابيع الأربعة.</li><li>عدم الرد يظل منفصلًا عن الرفض.</li><li>كلام الشخص عن الدفع ليس دليل دفع فعلي.</li><li>أي مشكلة سلامة أو خصوصية توقف التجربة حتى حلها.</li></ul></section>`;
}
function metric(label,value){return `<div class="metric-row"><span>${label}</span><strong>${value}</strong></div>`}

function renderSettings() {
  const s=state.settings;
  return `${pageHead("تجهيز التجربة","اضبطيها مرة واحدة قبل أول دعوة",`<button class="btn" data-action="backup">حفظ نسخة احتياطية</button><button class="btn" data-action="import">استعادة نسخة</button>`)}
    <form id="settingsForm" class="card"><div class="form-grid">
      <div class="field"><label>اسم التجربة</label><input name="trialName" value="${esc(s.trialName)}"></div>
      <div class="field"><label>اسم المشغّلة</label><input name="operator" value="${esc(s.operator)}" placeholder="مثال: أم فلان"></div>
      <div class="field"><label class="required">تاريخ أول جلسة</label><input type="date" name="startDate" value="${esc(s.startDate)}"></div>
      <div class="field"><label>موعد التقرير يظهر تلقائيًا</label><input disabled value="${formatDate(addDays(s.startDate,33))}"></div>
    </div>
    <div class="checks" style="margin-top:12px">${checkbox("privateStoreConfirmed","جهزنا مكانًا خاصًا منفصلًا لحفظ الأسماء وأرقام التواصل",s.privateStoreConfirmed)}${checkbox("safetyIssueOpen","هناك مشكلة سلامة أو خصوصية مفتوحة — أوقفوا الدعوات مؤقتًا",s.safetyIssueOpen)}</div>
    <div class="actions"><button class="btn primary" type="submit">حفظ التجهيز</button></div></form>
    <section class="card danger-zone" style="margin-top:16px"><h3>مسح كل بيانات اللوحة</h3><p>استخدمي هذا فقط بعد حفظ نسخة احتياطية. لا يمكن التراجع.</p><button class="btn danger" data-action="reset">مسح كل شيء</button></section>`;
}

function empty(title,text,button,action){return `<div class="empty"><h3>${title}</h3><p>${text}</p><button class="btn primary" data-action="${action}">${button}</button></div>`}
function render(){app.innerHTML=({dashboard:renderDashboard,messages:renderMessages,families:renderFamilies,"family-form":renderFamilyForm,session:renderSessionForm,recipes:renderRecipes,"recipe-form":renderRecipeForm,report:renderReport,settings:renderSettings})[currentView]();}

document.querySelector(".nav").addEventListener("click",e=>{const b=e.target.closest("[data-view]");if(b)setView(b.dataset.view)});
app.addEventListener("click", e => {
  const view=e.target.closest("[data-view]"); if(view){setView(view.dataset.view);return}
  const el=e.target.closest("[data-action]"); if(!el)return; const action=el.dataset.action, xid=el.dataset.id;
  if(action==="new-family")setView("family-form");
  if(action==="copy-message")copyText(outreachMessages[Number(el.dataset.message)].text,"تم نسخ الرسالة");
  if(action==="copy-session-questions")copyText(outreachMessages[3].text,"تم نسخ أسئلة العائلة");
  if(action==="copy-chatgpt")copyChatGptPrompt();
  if(action==="edit-family")setView("family-form",xid);
  if(action==="new-session-family"){setView("session");setTimeout(()=>{const x=document.querySelector('[name="familyId"]');if(x)x.value=xid},0)}
  if(action==="new-recipe")setView("recipe-form");
  if(action==="edit-recipe")setView("recipe-form",xid);
  if(action==="edit-session")setView("session",xid);
  if(action==="delete-family")deleteFamily(xid);
  if(action==="delete-recipe")deleteRecipe(xid);
  if(action==="delete-session")deleteSession(xid);
  if(action==="backup")backup();
  if(action==="import")importFile.click();
  if(action==="export-csv")exportCsv();
  if(action==="reset")resetAll();
});

app.addEventListener("submit",e=>{
  e.preventDefault(); const form=new FormData(e.target);
  if(e.target.id==="familyForm")saveFamily(form);
  if(e.target.id==="recipeForm")saveRecipe(form);
  if(e.target.id==="sessionForm")saveSession(form);
  if(e.target.id==="settingsForm")saveSettings(form);
});

function saveFamily(form){
  const old=state.families.find(f=>f.id===editingId); const f={id:old?.id||id(),code:form.get("code").trim(),joinedAt:form.get("joinedAt"),source:form.get("source"),status:form.get("status"),kuwait:bool(form,"kuwait"),adult:bool(form,"adult"),noRelation:bool(form,"noRelation"),consent:bool(form,"consent"),householdSize:form.get("householdSize"),pantryPreference:form.get("pantryPreference"),restrictions:form.get("restrictions").trim(),preferences:form.get("preferences").trim(),interviewNotes:form.get("interviewNotes").trim()};
  if(state.families.some(x=>x.code.toLowerCase()===f.code.toLowerCase()&&x.id!==f.id)){toast("رمز العائلة مستخدم");return}
  if(!(f.kuwait&&f.adult&&f.noRelation&&f.consent))f.status="excluded";
  state.families=old?state.families.map(x=>x.id===f.id?f:x):[...state.families,f];saveState("تم حفظ العائلة");setView("families");
}
function saveRecipe(form){const old=state.recipes.find(r=>r.id===editingId);const r={id:old?.id||id(),title:form.get("title").trim(),minutes:Number(form.get("minutes")),budget:form.get("budget"),source:form.get("source").trim(),tags:form.get("tags").trim(),warnings:form.get("warnings").trim(),reviewed:bool(form,"reviewed")};state.recipes=old?state.recipes.map(x=>x.id===r.id?r:x):[...state.recipes,r];saveState("تم حفظ الوصفة");setView("recipes")}
function saveSession(form){
  const old=state.sessions.find(s=>s.id===editingId);const suggestions=[];
  for(let i=0;i<3;i++){const rid=form.get(`s${i}Recipe`);const recipe=recipeById(rid);const title=form.get(`s${i}Title`).trim()||recipe?.title||"";if(title)suggestions.push({slot:i,recipeId:rid||"",title,reason:form.get(`s${i}Reason`).trim()})}
  const s={id:old?.id||id(),familyId:form.get("familyId"),date:form.get("date"),initiative:form.get("initiative"),servings:form.get("servings"),timeLimit:Number(form.get("timeLimit")),budget:form.get("budget"),dontWant:form.get("dontWant").trim(),ingredients:form.get("ingredients").trim(),restrictionsConfirmed:bool(form,"restrictionsConfirmed"),suggestions,outcome:form.get("outcome"),chosenSlot:form.get("chosenSlot"),decisionMinutes:form.get("decisionMinutes"),cooked:form.get("cooked"),rejectionReason:form.get("rejectionReason").trim(),notes:form.get("notes").trim()};
  if(!s.restrictionsConfirmed){toast("أكدي مراجعة القيود أولًا");return}if(!suggestions.length&&s.outcome!=="no_response"){toast("أضيفي اقتراحًا واحدًا على الأقل");return}
  state.sessions=old?state.sessions.map(x=>x.id===s.id?s:x):[...state.sessions,s];saveState("تم حفظ الجلسة والحسابات");setView("dashboard");
}
function saveSettings(form){state.settings={...state.settings,trialName:form.get("trialName").trim(),operator:form.get("operator").trim(),startDate:form.get("startDate"),privateStoreConfirmed:bool(form,"privateStoreConfirmed"),safetyIssueOpen:bool(form,"safetyIssueOpen")};saveState("تم حفظ التجهيز");setView("dashboard")}

async function copyText(text, message="تم النسخ") {
  try {
    if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
    else {
      const area=document.createElement("textarea"); area.value=text; area.style.position="fixed"; area.style.opacity="0";
      document.body.appendChild(area); area.focus(); area.select(); document.execCommand("copy"); area.remove();
    }
    toast(message);
  } catch { toast("تعذر النسخ. حددي النص وانسخيه يدويًا"); }
}

function copyChatGptPrompt() {
  const form=document.getElementById("sessionForm"); if(!form)return;
  const data=new FormData(form), family=familyById(data.get("familyId"));
  if(!family){toast("اختاري رمز العائلة أولًا");return}
  const prompt=`أنت تساعد مشغّلة تجربة يدوية لاختيار طبخة لعائلة عربية في الكويت. اقترح 3 طبخات فقط، متنوعة وواضحة، اعتمادًا على المعلومات التالية:\n\nعدد الأشخاص: ${data.get("servings")||"غير محدد"}\nالوقت المتاح: ${data.get("timeLimit")||"غير محدد"} دقيقة\nالميزانية: ${budgetLabel(data.get("budget"))}\nلا يريدون اليوم: ${data.get("dontWant")||"لم يذكروا"}\nمكونات يفضلون استعمالها: ${data.get("ingredients")||"لم يذكروا"}\nقيود ضرورية أو حساسية: ${family.restrictions||"لم تُذكر قيود"}\nتفضيلات العائلة: ${family.preferences||"لم تُذكر تفضيلات"}\n\nلكل اقتراح اكتب: اسم الطبخة، لماذا تناسبهم، الوقت التقريبي، والمكونات الأساسية. لا تفترض أن طبقًا آمن للحساسية؛ نبه المشغّلة إلى مراجعة المكونات والملصقات. لا تطلب أي اسم أو رقم هاتف أو بيانات شخصية.`;
  copyText(prompt,"تم نسخ طلب ChatGPT — الصقيه هناك");
}

function deleteFamily(fid){if(!confirm("حذف العائلة وكل جلساتها؟"))return;state.families=state.families.filter(f=>f.id!==fid);state.sessions=state.sessions.filter(s=>s.familyId!==fid);saveState("حُذفت بيانات العائلة");setView("families")}
function deleteRecipe(rid){if(!confirm("حذف الوصفة من القائمة؟ الجلسات القديمة ستحتفظ باسمها."))return;state.recipes=state.recipes.filter(r=>r.id!==rid);saveState("حُذفت الوصفة");setView("recipes")}
function deleteSession(sid){if(!confirm("حذف هذه الجلسة؟"))return;state.sessions=state.sessions.filter(s=>s.id!==sid);saveState("حُذفت الجلسة");setView("dashboard")}

function download(name,content,type){const blob=new Blob([content],{type});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function backup(){download(`v00-backup-${today()}.json`,JSON.stringify(state,null,2),"application/json");toast("تم تنزيل نسخة احتياطية")}
function csvCell(v){return `"${String(v??"").replaceAll('"','""')}"`}
function exportCsv(){const rows=[["رمز العائلة","التاريخ","بداية الجلسة","عدد الأشخاص","الوقت","الميزانية","عدد الاقتراحات","النتيجة","دقائق القرار","طُبخت","سبب الرفض"]];state.sessions.forEach(s=>{const f=familyById(s.familyId);rows.push([f?.code||"محذوفة",s.date,s.initiative,s.servings,s.timeLimit,budgetLabel(s.budget),s.suggestions?.length||0,outcomeLabel(s.outcome),s.decisionMinutes,s.cooked,s.rejectionReason])});download(`v00-sessions-${today()}.csv`,`\ufeff${rows.map(r=>r.map(csvCell).join(",")).join("\n")}`,"text/csv;charset=utf-8");toast("تم تنزيل جدول الجلسات")}
importFile.addEventListener("change",()=>{const file=importFile.files[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const parsed=JSON.parse(reader.result);if(!parsed.version||!Array.isArray(parsed.families)||!Array.isArray(parsed.sessions))throw new Error();if(confirm("استبدال البيانات الحالية بالنسخة المختارة؟")){state={...emptyState(),...parsed,settings:{...emptyState().settings,...parsed.settings}};saveState("تمت استعادة النسخة");setView("dashboard")}}catch{toast("ملف النسخة غير صالح")}};reader.readAsText(file);importFile.value=""});
function resetAll(){if(!confirm("هل حفظتِ نسخة احتياطية؟ سيتم مسح كل البيانات."))return;const word=prompt("اكتبي كلمة مسح للتأكيد");if(word!=="مسح"){toast("تم إلغاء المسح");return}state=emptyState();localStorage.removeItem(STORAGE_KEY);toast("تم مسح البيانات");setView("dashboard")}

render();
