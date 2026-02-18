// Simple data layer using localStorage
const DB = {
  key: 'sms_demo',
  load() {
    return JSON.parse(localStorage.getItem(this.key) || '{}');
  },
  save(data) {
    localStorage.setItem(this.key, JSON.stringify(data));
  },
  init() {
    const state = this.load();
    const defaults = {students:[], fees:[], courses:[], staff:[], results:[]};
    const merged = Object.assign({}, defaults, state);
    this.save(merged);
    return merged;
  }
};

const state = DB.init();

function byId(id){return document.getElementById(id)}

function showPanel(name){
  document.querySelectorAll('.panel').forEach(p=>p.classList.add('hidden'));
  byId(name).classList.remove('hidden');
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
  DB.save(state);
  f.reset(); renderList();
});

byId('feeForm').addEventListener('submit', e=>{
  e.preventDefault();
  const f = e.target; const rec = {studentId:f.studentId.value, amount:f.amount.value, date:f.date.value};
  state.fees.push(rec); DB.save(state); f.reset(); renderList();
});

byId('courseForm').addEventListener('submit', e=>{
  e.preventDefault(); const f=e.target; state.courses.push({code:f.code.value, title:f.title.value}); DB.save(state); f.reset(); renderList();
});

byId('staffForm').addEventListener('submit', e=>{
  e.preventDefault(); const f=e.target; state.staff.push({name:f.name.value, role:f.role.value}); DB.save(state); f.reset(); renderList();
});

byId('resultForm').addEventListener('submit', e=>{
  e.preventDefault(); const f=e.target; state.results.push({studentId:f.studentId.value, course:f.course.value, grade:f.grade.value}); DB.save(state); f.reset(); renderList();
});

byId('exportResults').addEventListener('click', ()=>{
  const data = JSON.stringify(state.results, null, 2);
  const blob = new Blob([data], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'results.json'; a.click(); URL.revokeObjectURL(url);
});

// Navigation
document.querySelectorAll('nav button').forEach(b=>b.addEventListener('click', ()=>showPanel(b.dataset.target)));

// Initialize
renderList();
