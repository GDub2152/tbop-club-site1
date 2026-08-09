
/* ===== V11 Treasurer Workspace ===== */
window.TBOP_FINANCE={
  transactions:[],
  budgets:[],
  payments:[]
};

function financeEnabled(){return Boolean(window.TBOP?.api?.configured())}
function money(v){return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(Number(v||0))}
function currentYear(){return new Date().getFullYear()}
function financeMemberName(row){
  const p=row?.profiles;
  if(!p)return "";
  return `${p.display_name||""}${p.callsign?` (${p.callsign})`:""}`;
}

async function loadFinance(){
  if(!financeEnabled() || !document.getElementById("financeLedgerBody"))return;
  try{
    const [txns,budgets,payments]=await Promise.all([
      window.TBOP.api.listTransactions(),
      window.TBOP.api.listBudgets(),
      window.TBOP.api.listMembershipPayments()
    ]);
    window.TBOP_FINANCE.transactions=txns||[];
    window.TBOP_FINANCE.budgets=budgets||[];
    window.TBOP_FINANCE.payments=payments||[];
    populateFinanceSelectors();
    renderFinance();
  }catch(e){
    console.error(e);
    const body=document.getElementById("financeLedgerBody");
    if(body)body.innerHTML=`<tr><td colspan="7">Could not load financial data: ${e.message||e}</td></tr>`;
  }
}

function populateFinanceSelectors(){
  const profiles=window.TBOP_DB?.profiles||[];
  for(const id of ["txnMember","duesMember"]){
    const el=document.getElementById(id);if(!el)continue;
    const first=id==="txnMember" ? `<option value="">No member linked</option>` : `<option value="">Select member</option>`;
    el.innerHTML=first+profiles
      .filter(p=>String(p.status||"").toLowerCase()!=="inactive")
      .sort((a,b)=>(a.name||"").localeCompare(b.name||""))
      .map(p=>`<option value="${p.id}">${p.name||p.email}${p.call?` (${p.call})`:""}</option>`).join("");
  }

  const years=new Set([currentYear()]);
  window.TBOP_FINANCE.transactions.forEach(t=>years.add(Number(String(t.transaction_date).slice(0,4))));
  window.TBOP_FINANCE.budgets.forEach(b=>years.add(Number(b.fiscal_year)));
  const y=document.getElementById("financeYearFilter");
  if(y){
    const selected=y.value||String(currentYear());
    y.innerHTML=[...years].filter(Boolean).sort((a,b)=>b-a).map(v=>`<option value="${v}">${v}</option>`).join("");
    y.value=[...years].map(String).includes(selected)?selected:String(currentYear());
  }

  const cats=[...new Set(window.TBOP_FINANCE.transactions.map(t=>t.category).filter(Boolean))].sort();
  const c=document.getElementById("financeCategoryFilter");
  if(c)c.innerHTML=`<option value="">All categories</option>`+cats.map(x=>`<option value="${x}">${x}</option>`).join("");

  const by=document.getElementById("budgetYear");if(by&&!by.value)by.value=currentYear();
  const dy=document.getElementById("duesYear");if(dy&&!dy.value)dy.value=currentYear();

  const today=new Date().toISOString().slice(0,10);
  const td=document.getElementById("txnDate");if(td&&!td.value)td.value=today;
  const dd=document.getElementById("duesPaidOn");if(dd&&!dd.value)dd.value=today;
}

function filteredTransactions(){
  let rows=[...window.TBOP_FINANCE.transactions];
  const q=(document.getElementById("financeSearch")?.value||"").toLowerCase().trim();
  const type=document.getElementById("financeTypeFilter")?.value||"";
  const year=document.getElementById("financeYearFilter")?.value||String(currentYear());
  const cat=document.getElementById("financeCategoryFilter")?.value||"";

  rows=rows.filter(t=>String(t.transaction_date).startsWith(year));
  if(type)rows=rows.filter(t=>t.transaction_type===type);
  if(cat)rows=rows.filter(t=>t.category===cat);
  if(q)rows=rows.filter(t=>
    (t.description||"").toLowerCase().includes(q)||
    (t.category||"").toLowerCase().includes(q)||
    (t.reference_number||"").toLowerCase().includes(q)||
    financeMemberName(t).toLowerCase().includes(q)
  );
  return rows;
}

function renderFinance(){
  renderFinanceLedger();
  renderFinanceSummary();
  renderBudgetReview();
  renderDuesPayments();
}

function renderFinanceLedger(){
  const body=document.getElementById("financeLedgerBody");if(!body)return;
  const rows=filteredTransactions();
  body.innerHTML=rows.length?rows.map(t=>`<tr>
    <td>${fmtDate(String(t.transaction_date))}</td>
    <td><span class="${t.transaction_type==="income"?"status-good":"status-warn"}">${t.transaction_type==="income"?"Income":"Expense"}</span></td>
    <td>${t.category}</td>
    <td>${t.description}${t.reference_number?`<br><small class="muted">Ref: ${t.reference_number}</small>`:""}</td>
    <td>${financeMemberName(t)}</td>
    <td class="${t.transaction_type==="income"?"status-good":"status-warn"}">${t.transaction_type==="income"?"+":"-"}${money(t.amount)}</td>
    <td><button class="button danger small" onclick="deleteFinanceTxn('${t.id}')">Remove</button></td>
  </tr>`).join(""):`<tr><td colspan="7" class="muted">No transactions match the current filters.</td></tr>`;
}

function renderFinanceSummary(){
  const year=String(document.getElementById("financeYearFilter")?.value||currentYear());
  const rows=window.TBOP_FINANCE.transactions.filter(t=>String(t.transaction_date).startsWith(year));
  const income=rows.filter(t=>t.transaction_type==="income").reduce((s,t)=>s+Number(t.amount||0),0);
  const expenses=rows.filter(t=>t.transaction_type==="expense").reduce((s,t)=>s+Number(t.amount||0),0);
  const dues=window.TBOP_FINANCE.payments.filter(p=>String(p.membership_year)===year);
  setText("financeIncome",money(income));
  setText("financeExpenses",money(expenses));
  setText("financeNet",money(income-expenses));
  setText("financeDuesCount",dues.length);
}

function renderBudgetReview(){
  const wrap=document.getElementById("budgetReview");if(!wrap)return;
  const year=Number(document.getElementById("financeYearFilter")?.value||currentYear());
  const budgets=window.TBOP_FINANCE.budgets.filter(b=>Number(b.fiscal_year)===year);
  if(!budgets.length){
    wrap.innerHTML=`<div class="card"><p class="muted">No budget items for ${year}.</p></div>`;
    return;
  }
  wrap.innerHTML=budgets.map(b=>{
    const actual=window.TBOP_FINANCE.transactions
      .filter(t=>Number(String(t.transaction_date).slice(0,4))===year && t.category===b.category && t.transaction_type===b.budget_type)
      .reduce((s,t)=>s+Number(t.amount||0),0);
    const remaining=Number(b.budget_amount)-actual;
    const pct=Number(b.budget_amount)>0?Math.min(100,(actual/Number(b.budget_amount))*100):0;
    return `<article class="card budget-card">
      <span class="pill">${b.budget_type==="expense"?"Expense":"Income"} • ${year}</span>
      <h3>${b.category}</h3>
      <div class="stat-row"><span>Budget</span><strong>${money(b.budget_amount)}</strong></div>
      <div class="stat-row"><span>Actual</span><strong>${money(actual)}</strong></div>
      <div class="stat-row"><span>${b.budget_type==="expense"?"Remaining":"To Goal"}</span><strong>${money(remaining)}</strong></div>
      <div class="budget-bar"><span style="width:${pct}%"></span></div>
      <button class="text-button" onclick="deleteBudgetItem('${b.id}')">Remove Budget Item</button>
    </article>`;
  }).join("");
}

function renderDuesPayments(){
  const wrap=document.getElementById("duesPaymentList");if(!wrap)return;
  wrap.innerHTML=window.TBOP_FINANCE.payments.slice(0,20).map(p=>`<article class="event-item">
    <div><h3>${financeMemberName(p)||"Member"}</h3><div class="event-meta">${fmtDate(String(p.paid_on))} • Membership Year ${p.membership_year}</div><p>${money(p.amount)}${p.payment_method?` • ${p.payment_method}`:""}${p.reference_number?` • Ref ${p.reference_number}`:""}</p></div>
    <button class="button danger small" onclick="deleteDuesPayment('${p.id}')">Remove</button>
  </article>`).join("")||`<div class="card"><p class="muted">No dues payments recorded yet.</p></div>`;
}

async function deleteFinanceTxn(id){
  if(!confirm("Remove this financial transaction?"))return;
  try{
    await window.TBOP.api.deleteTransaction(id);
    await window.TBOP.api.auditFinancialChange("financial_transaction",id,"transaction_deleted",{});
    await loadFinance();
  }catch(e){alert("Could not remove transaction: "+(e.message||e))}
}
window.deleteFinanceTxn=deleteFinanceTxn;

async function deleteBudgetItem(id){
  if(!confirm("Remove this budget item?"))return;
  try{
    await window.TBOP.api.deleteBudget(id);
    await window.TBOP.api.auditFinancialChange("budget_item",id,"budget_deleted",{});
    await loadFinance();
  }catch(e){alert("Could not remove budget item: "+(e.message||e))}
}
window.deleteBudgetItem=deleteBudgetItem;

async function deleteDuesPayment(id){
  if(!confirm("Remove this dues payment record?"))return;
  try{
    await window.TBOP.api.deleteMembershipPayment(id);
    await window.TBOP.api.auditFinancialChange("membership_payment",id,"dues_payment_deleted",{});
    await loadFinance();
  }catch(e){alert("Could not remove dues payment: "+(e.message||e))}
}
window.deleteDuesPayment=deleteDuesPayment;

async function submitTransaction(e){
  e.preventDefault();
  const session=await window.TBOP.api.getSession();
  const row={
    transaction_date:document.getElementById("txnDate").value,
    transaction_type:document.getElementById("txnType").value,
    category:document.getElementById("txnCategory").value.trim(),
    description:document.getElementById("txnDescription").value.trim(),
    amount:Number(document.getElementById("txnAmount").value),
    member_id:document.getElementById("txnMember").value||null,
    payment_method:document.getElementById("txnMethod").value.trim()||null,
    reference_number:document.getElementById("txnReference").value.trim()||null,
    notes:document.getElementById("txnNotes").value.trim()||null,
    created_by:session?.user?.id||null
  };
  try{
    const created=await window.TBOP.api.createTransaction(row);
    await window.TBOP.api.auditFinancialChange("financial_transaction",created.id,"transaction_created",{type:row.transaction_type,amount:row.amount,category:row.category});
    e.target.reset();
    populateFinanceSelectors();
    await loadFinance();
  }catch(err){alert("Could not add transaction: "+(err.message||err))}
}

async function submitBudget(e){
  e.preventDefault();
  const session=await window.TBOP.api.getSession();
  const row={
    fiscal_year:Number(document.getElementById("budgetYear").value),
    budget_type:document.getElementById("budgetType").value,
    category:document.getElementById("budgetCategory").value.trim(),
    budget_amount:Number(document.getElementById("budgetAmount").value),
    notes:document.getElementById("budgetNotes").value.trim()||null,
    created_by:session?.user?.id||null,
    updated_at:new Date().toISOString()
  };
  try{
    const created=await window.TBOP.api.upsertBudget(row);
    await window.TBOP.api.auditFinancialChange("budget_item",created.id,"budget_saved",{year:row.fiscal_year,category:row.category,amount:row.budget_amount});
    e.target.reset();
    populateFinanceSelectors();
    await loadFinance();
  }catch(err){alert("Could not save budget: "+(err.message||err))}
}

async function submitDuesPayment(e){
  e.preventDefault();
  const session=await window.TBOP.api.getSession();
  const memberId=document.getElementById("duesMember").value;
  const amount=Number(document.getElementById("duesAmount").value);
  const year=Number(document.getElementById("duesYear").value);
  const row={
    member_id:memberId,
    paid_on:document.getElementById("duesPaidOn").value,
    amount,
    membership_year:year,
    payment_method:document.getElementById("duesMethod").value.trim()||null,
    reference_number:document.getElementById("duesReference").value.trim()||null,
    notes:document.getElementById("duesNotes").value.trim()||null,
    created_by:session?.user?.id||null
  };
  try{
    const created=await window.TBOP.api.createMembershipPayment(row);

    await window.TBOP.api.createTransaction({
      transaction_date:row.paid_on,
      transaction_type:"income",
      category:"Membership Dues",
      description:`Membership dues for ${year}`,
      amount,
      member_id:memberId,
      payment_method:row.payment_method,
      reference_number:row.reference_number,
      notes:row.notes,
      created_by:row.created_by
    });

    await window.TBOP.api.updateProfile(memberId,{dues_status:"paid",updated_at:new Date().toISOString()});
    await window.TBOP.api.auditFinancialChange("membership_payment",created.id,"dues_payment_recorded",{membership_year:year,amount});

    e.target.reset();
    populateFinanceSelectors();
    await refreshDbModules();
    await loadFinance();
  }catch(err){alert("Could not record dues payment: "+(err.message||err))}
}

function printFinanceReport(){
  const year=String(document.getElementById("financeYearFilter")?.value||currentYear());
  const rows=filteredTransactions();
  const income=rows.filter(t=>t.transaction_type==="income").reduce((s,t)=>s+Number(t.amount||0),0);
  const expenses=rows.filter(t=>t.transaction_type==="expense").reduce((s,t)=>s+Number(t.amount||0),0);
  const w=window.open("","_blank","width=1000,height=700");if(!w)return;
  w.document.write(`<!doctype html><html><head><title>TBOP Financial Report ${year}</title><style>
  body{font-family:Arial,sans-serif;padding:28px;color:#111}h1{margin-bottom:4px}
  .summary{display:flex;gap:25px;margin:20px 0}.summary div{border:1px solid #bbb;padding:12px;min-width:150px}
  table{width:100%;border-collapse:collapse}th,td{border:1px solid #bbb;padding:7px;font-size:12px;text-align:left}
  th{background:#eee}.right{text-align:right}
  </style></head><body>
  <h1>The Blowtorch of Parma Amateur Radio Club</h1>
  <p>Financial Report • ${year} • Generated ${new Date().toLocaleDateString()}</p>
  <div class="summary"><div><b>Income</b><br>${money(income)}</div><div><b>Expenses</b><br>${money(expenses)}</div><div><b>Net</b><br>${money(income-expenses)}</div></div>
  <table><thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Description</th><th>Member</th><th>Amount</th></tr></thead><tbody>
  ${rows.map(t=>`<tr><td>${fmtDate(String(t.transaction_date))}</td><td>${t.transaction_type}</td><td>${t.category}</td><td>${t.description}</td><td>${financeMemberName(t)}</td><td class="right">${money(t.amount)}</td></tr>`).join("")}
  </tbody></table></body></html>`);
  w.document.close();w.focus();setTimeout(()=>w.print(),250);
}

document.addEventListener("DOMContentLoaded",()=>{
  document.getElementById("transactionForm")?.addEventListener("submit",submitTransaction);
  document.getElementById("budgetForm")?.addEventListener("submit",submitBudget);
  document.getElementById("duesPaymentForm")?.addEventListener("submit",submitDuesPayment);
  document.getElementById("printFinanceReportBtn")?.addEventListener("click",printFinanceReport);

  ["financeSearch","financeTypeFilter","financeYearFilter","financeCategoryFilter"].forEach(id=>{
    document.getElementById(id)?.addEventListener("input",renderFinance);
    document.getElementById(id)?.addEventListener("change",renderFinance);
  });

  if(financeEnabled()) setTimeout(loadFinance,800);
});
