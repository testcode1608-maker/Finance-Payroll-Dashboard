const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '')

export type Department = { id:number; name:string; description:string|null; monthlyBudget:number|string; employeeCount?:number }
export type Employee = {
  id:number; employeeCode:string; firstName:string; lastName:string; email:string|null; phone:string|null;
  departmentId:number|null; departmentName?:string|null; position:string; hireDate:string|null;
  baseSalary:number|string; employmentStatus:'active'|'on_leave'|'inactive'; address?:string|null;
  contractType:'permanent'|'fixed_term'|'part_time'|'internship'|'freelance';
  workSchedule:'full_time'|'part_time'|'shift'; notes?:string|null;
}
export type Transaction = { id:number; merchant:string; category:string; amount:number|string; transactionDate:string; departmentId:number|null; departmentName?:string|null; employeeId:number|null; employeeName?:string|null; description:string|null; status:'pending'|'complete'|'needs_receipt' }
export type PayrollSummary = { activeEmployees:number; departmentCount:number; draftPayrollPeriods:number; unpaidPayroll:number|string; missingReceipts:number }
export type PayrollPeriod = { id:number; periodStart:string; periodEnd:string; status:'draft'|'approved'|'paid'; notes:string|null; employeeCount?:number; netPayroll?:number|string }
export type PayrollItem = { id:number; payrollPeriodId?:number; employeeId:number; employeeCode:string; employeeName:string; position?:string; baseSalary:number|string; bonuses:number|string; deductions:number|string; netSalary:number|string; paymentStatus:'pending'|'paid'; paidAt?:string|null }
export type CompanyCard = { id:number; cardLabel:string; cardholderName:string; lastFour:string; spendingLimit:number|string; currentSpend:number|string; status:'active'|'paused' }
export type Budget = { id:number; departmentId:number; departmentName?:string; monthStart:string; amount:number|string }
export type Due = { id:number; title:string; amount:number|string; dueDate:string; employeeId:number|null; employeeName?:string|null; status:'upcoming'|'paid'|'overdue'; notes:string|null }
type ApiResponse<T> = {data:T}

async function request<T>(path:string, init?:RequestInit):Promise<T> {
  let response:Response
  try { response=await fetch(`${API_BASE}${path}`,{...init,headers:{'Content-Type':'application/json',...init?.headers}}) }
  catch { throw new Error('Impossible de joindre l’API. Vérifiez que le serveur fonctionne sur http://localhost:3001.') }
  const payload=await response.json().catch(()=>({}))
  if(!response.ok){const details=Array.isArray(payload?.details)?payload.details.map((x:{message?:string})=>x.message).filter(Boolean).join(', '):'';throw new Error(details||payload?.error||`Erreur API (${response.status})`)}
  return payload as T
}
const json=(method:string,input:unknown)=>({method,body:JSON.stringify(input)})

export async function getDepartments(){return (await request<ApiResponse<Department[]>>('/api/departments')).data}
export async function createDepartment(input:{name:string;description?:string;monthlyBudget:number}){return (await request<ApiResponse<Department>>('/api/departments',json('POST',input))).data}
export async function getEmployees(){return (await request<ApiResponse<Employee[]>>('/api/employees')).data}
export async function createEmployee(input:Omit<Employee,'id'|'departmentName'>){return (await request<ApiResponse<Employee>>('/api/employees',json('POST',input))).data}
export async function updateEmployee(id:number,input:Omit<Employee,'id'|'departmentName'>){return (await request<ApiResponse<Employee>>(`/api/employees/${id}`,json('PUT',input))).data}
export async function deleteEmployee(id:number){await request<void>(`/api/employees/${id}`,{method:'DELETE'})}
export async function getTransactions(){return (await request<ApiResponse<Transaction[]>>('/api/transactions')).data}
export async function createTransaction(input:{merchant:string;category:string;amount:number;transactionDate?:string;departmentId?:number|null;employeeId?:number|null;description?:string|null;status:'pending'|'complete'|'needs_receipt'}){return (await request<ApiResponse<Transaction>>('/api/transactions',json('POST',input))).data}
export async function getPayrollSummary(){return (await request<ApiResponse<PayrollSummary>>('/api/payroll/summary')).data}
export async function getPayrollPeriods(){return (await request<ApiResponse<PayrollPeriod[]>>('/api/payroll/periods')).data}
export async function createPayrollPeriod(input:{periodStart:string;periodEnd:string;notes?:string|null}){return (await request<ApiResponse<PayrollPeriod>>('/api/payroll/periods',json('POST',input))).data}
export async function getPayrollItems(periodId:number){return (await request<ApiResponse<PayrollItem[]>>(`/api/payroll/periods/${periodId}/items`)).data}
export async function generatePayroll(periodId:number,items:Array<{employeeId:number;bonuses:number;deductions:number}>=[]){return (await request<ApiResponse<PayrollItem[]>>(`/api/payroll/periods/${periodId}/generate`,json('POST',{items}))).data}
export async function setPayrollItemPayment(id:number,paymentStatus:'pending'|'paid'){return (await request<ApiResponse<PayrollItem>>(`/api/payroll/items/${id}/payment`,json('PATCH',{paymentStatus}))).data}
export async function getCards(){return (await request<ApiResponse<CompanyCard[]>>('/api/cards')).data}
export async function createCard(input:Omit<CompanyCard,'id'>){return (await request<ApiResponse<CompanyCard>>('/api/cards',json('POST',input))).data}
export async function deleteCard(id:number){await request<void>(`/api/cards/${id}`,{method:'DELETE'})}
export async function getBudgets(){return (await request<ApiResponse<Budget[]>>('/api/budgets')).data}
export async function createBudget(input:{departmentId:number;monthStart:string;amount:number}){return (await request<ApiResponse<Budget>>('/api/budgets',json('POST',input))).data}
export async function deleteBudget(id:number){await request<void>(`/api/budgets/${id}`,{method:'DELETE'})}
export async function getDues(){return (await request<ApiResponse<Due[]>>('/api/dues')).data}
export async function createDue(input:{title:string;amount:number;dueDate:string;employeeId?:number|null;status:'upcoming'|'paid'|'overdue';notes?:string|null}){return (await request<ApiResponse<Due>>('/api/dues',json('POST',input))).data}
export async function updateDueStatus(id:number,status:Due['status']){return (await request<ApiResponse<{id:number;status:Due['status']}>>(`/api/dues/${id}/status`,json('PATCH',{status}))).data}
export async function deleteDue(id:number){await request<void>(`/api/dues/${id}`,{method:'DELETE'})}
