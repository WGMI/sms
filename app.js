// Multitenant-aware data layer using localStorage
const TENANTS_KEY = 'sms_tenants';
const CURRENT_TENANT_KEY = 'sms_current_tenant';

function slugify(name){
  return name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'') || 'school';
}

function getTenants(){
  try{ return JSON.parse(localStorage.getItem(TENANTS_KEY) || '[]'); }catch(e){return []}
}

function saveTenants(list){ localStorage.setItem(TENANTS_KEY, JSON.stringify(list)); }

function getCurrentTenantId(){ return localStorage.getItem(CURRENT_TENANT_KEY); }
function setCurrentTenantId(id){ localStorage.setItem(CURRENT_TENANT_KEY, id); }

function ensureDefaultTenant(){
  const tenants = getTenants();
  if(tenants.length===0){
    const id = 'demo';
    tenants.push({id, name: 'Demo School'});
    saveTenants(tenants);
    setCurrentTenantId(id);
    return id;
  }
  if(!getCurrentTenantId()){
    setCurrentTenantId(tenants[0].id);
  }
  return getCurrentTenantId();
}

function createTenant(name){
  const tenants = getTenants();
  let id = slugify(name);
  let orig = id; let i=1;
  while(tenants.some(t=>t.id===id)) { id = `${orig}-${i++}` }
  tenants.push({id, name}); saveTenants(tenants); setCurrentTenantId(id);
  // seed an empty state for new tenant
  const defaults = {students:[], fees:[], courses:[], staff:[], results:[]};
  localStorage.setItem(namespaceKey(id), JSON.stringify(defaults));
  return {id,name};
}

function namespaceKey(tenantId){ return `sms_demo:${tenantId}`; }

const DB = {
  load(tenantId){
    const key = namespaceKey(tenantId);
    return JSON.parse(localStorage.getItem(key) || '{}');
  },
  save(tenantId, data){
    const key = namespaceKey(tenantId);
    localStorage.setItem(key, JSON.stringify(data));
  },
  init(tenantId){
    const state = this.load(tenantId);
    const defaults = {students:[], fees:[], courses:[], staff:[], results:[]};
    const merged = Object.assign({}, defaults, state);
    this.save(tenantId, merged);
    return merged;
  }
};

// Ensure tenant existence and load state for current tenant
ensureDefaultTenant();
let currentTenantId = getCurrentTenantId();
let state = DB.init(currentTenantId);

function byId(id){return document.getElementById(id)}

function showPanel(name){
  document.querySelectorAll('.panel').forEach(p=>p.classList.add('hidden'));
  byId(name).classList.remove('hidden');
}

// Tenant UI helpers
function renderTenantControls(){
  const sel = byId('tenantSelect');
  if(!sel) return;
  const tenants = getTenants();
  sel.innerHTML = tenants.map(t=>`<option value="${t.id}">${t.name}</option>`).join('');
  sel.value = getCurrentTenantId();
  const cur = tenants.find(t=>t.id===getCurrentTenantId());
  byId('currentTenantName').textContent = cur ? ` (${cur.name})` : '';
}

function switchTenant(id){
  if(!id) return;
  setCurrentTenantId(id);
  currentTenantId = id;
  state = DB.init(currentTenantId);
  renderTenantControls();
  renderList();
}

function renderList(){
  byId('studentsList').innerHTML = state.students.map(s=>`<div>${s.studentId} — ${s.name} (${s.className})</div>`).join('') || '<i>No students</i>';
  byId('feesList').innerHTML = state.fees.map(f=>`<div>${f.studentId} — ${f.amount} on ${f.date}</div>`).join('') || '<i>No fees</i>';
  byId('coursesList').innerHTML = state.courses.map(c=>`<div>${c.code} — ${c.title}</div>`).join('') || '<i>No courses</i>';
  byId('staffList').innerHTML = state.staff.map(s=>`<div>${s.name} — ${s.role}</div>`).join('') || '<i>No staff</i>';
  byId('resultsList').innerHTML = state.results.map(r=>`<div>${r.studentId} — ${r.course}: ${r.grade}</div>`).join('') || '<i>No results</i>';
  refreshStudentSelects();
}

function refreshStudentSelects(){
  const selects = [byId('feeStudent'), byId('resultStudent')];
  selects.forEach(sel=>{
    if(!sel) return;
    sel.innerHTML = state.students.map(s=>`<option value="${s.studentId}">${s.studentId} — ${s.name}</option>`).join('') || '<option value="">(no students)</option>'
  });
}

// Form handlers
byId('enrolForm').addEventListener('submit', e=>{
  e.preventDefault();
  const f = e.target;
  const student = {name:f.name.value.trim(), studentId:f.studentId.value.trim(), className:f.className.value.trim()};
  if(!student.name||!student.studentId) return;
  state.students.push(student);
  DB.save(currentTenantId, state);
  f.reset(); renderList();
});

byId('feeForm').addEventListener('submit', e=>{
  e.preventDefault();
  const f = e.target; const rec = {studentId:f.studentId.value, amount:f.amount.value, date:f.date.value};
  state.fees.push(rec); DB.save(currentTenantId, state); f.reset(); renderList();
});

byId('courseForm').addEventListener('submit', e=>{
  e.preventDefault(); const f=e.target; state.courses.push({code:f.code.value, title:f.title.value}); DB.save(currentTenantId, state); f.reset(); renderList();
});

byId('staffForm').addEventListener('submit', e=>{
  e.preventDefault(); const f=e.target; state.staff.push({name:f.name.value, role:f.role.value}); DB.save(currentTenantId, state); f.reset(); renderList();
});

byId('resultForm').addEventListener('submit', e=>{
  e.preventDefault(); const f=e.target; state.results.push({studentId:f.studentId.value, course:f.course.value, grade:f.grade.value}); DB.save(currentTenantId, state); f.reset(); renderList();
});

byId('exportResults').addEventListener('click', ()=>{
  const data = JSON.stringify(state.results, null, 2);
  const blob = new Blob([data], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `${currentTenantId}-results.json`; a.click(); URL.revokeObjectURL(url);
});

// Navigation
document.querySelectorAll('nav button').forEach(b=>b.addEventListener('click', ()=>showPanel(b.dataset.target)));

// Tenant UI wiring
const createBtn = byId('createTenant');
if(createBtn){
  createBtn.addEventListener('click', ()=>{
    const input = byId('newTenantName');
    if(!input || !input.value.trim()) return;
    createTenant(input.value.trim());
    input.value = '';
    switchTenant(getCurrentTenantId());
  });
}

const tenantSelect = byId('tenantSelect');
if(tenantSelect){
  tenantSelect.addEventListener('change', e=>{ switchTenant(e.target.value); });
}

// Initialize
renderTenantControls();
renderList();
