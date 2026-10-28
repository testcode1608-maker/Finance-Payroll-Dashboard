const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '')

export type Department = {
  id: number
  name: string
  description: string | null
  monthlyBudget: number | string
  employeeCount?: number
}
export type Employee = {
  id: number
  employeeCode: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  departmentId: number | null
  departmentName?: string | null
  position: string
  hireDate: string | null
  baseSalary: number | string
  employmentStatus: 'active' | 'on_leave' | 'inactive'
}
export type Transaction = {
  id: number
  merchant: string
  category: string
  amount: number | string
  transactionDate: string
  departmentId: number | null
  departmentName?: string | null
  employeeId: number | null
  employeeName?: string | null
  description: string | null
  status: 'pending' | 'complete' | 'needs_receipt'
}
export type PayrollSummary = {
  activeEmployees: number
  departmentCount: number
  draftPayrollPeriods: number
  unpaidPayroll: number | string
  missingReceipts: number
}
type ApiResponse<T> = { data: T }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    })
  } catch {
    throw new Error('Impossible de joindre l’API. Vérifiez que le serveur fonctionne sur http://localhost:3001.')
  }

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const details = Array.isArray(payload?.details)
      ? payload.details.map((item: { message?: string }) => item.message).filter(Boolean).join(', ')
      : ''
    throw new Error(details || payload?.error || `Erreur API (${response.status})`)
  }
  return payload as T
}

export async function getDepartments() {
  return (await request<ApiResponse<Department[]>>('/api/departments')).data
}
export async function createDepartment(input: { name: string; description?: string; monthlyBudget: number }) {
  return (await request<ApiResponse<Department>>('/api/departments', { method: 'POST', body: JSON.stringify(input) })).data
}
export async function getEmployees() {
  return (await request<ApiResponse<Employee[]>>('/api/employees')).data
}
export async function createEmployee(input: {
  employeeCode: string; firstName: string; lastName: string; email?: string | null; phone?: string | null;
  departmentId?: number | null; position: string; hireDate?: string | null; baseSalary: number;
  employmentStatus: 'active' | 'on_leave' | 'inactive'
}) {
  return (await request<ApiResponse<Employee>>('/api/employees', { method: 'POST', body: JSON.stringify(input) })).data
}
export async function getTransactions() {
  return (await request<ApiResponse<Transaction[]>>('/api/transactions')).data
}
export async function getPayrollSummary() {
  return (await request<ApiResponse<PayrollSummary>>('/api/payroll/summary')).data
}
