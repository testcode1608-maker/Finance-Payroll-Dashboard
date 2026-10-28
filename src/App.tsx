import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity, ArrowLeftRight, ArrowUpRight, Bell, BriefcaseBusiness,
  CalendarDays, Check, CircleDollarSign, CreditCard, Database,
  FileText, Home, LoaderCircle, Menu, Moon, Plus, RefreshCw, Search,
  Settings, ShieldCheck, SlidersHorizontal, Users, Wallet, X, Zap,
} from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  createDepartment, createEmployee, createTransaction, getDepartments, getEmployees, getPayrollSummary,
  getTransactions, type Department, type Employee, type PayrollSummary, type Transaction,
} from './lib/api'

const navGroups = [
  { title: 'WORKSPACE', items: [{ label: 'Overview', icon: Home }, { label: 'Transactions', icon: ArrowLeftRight }, { label: 'Cards', icon: CreditCard }, { label: 'Budgets', icon: SlidersHorizontal }, { label: 'Dues', icon: CalendarDays }] },
  { title: 'PEOPLE', items: [{ label: 'Team members', icon: Users }, { label: 'Payroll', icon: Wallet }, { label: 'Departments', icon: BriefcaseBusiness }] },
  { title: 'MANAGE', items: [{ label: 'Reports', icon: FileText }, { label: 'Integrations', icon: Zap }, { label: 'Settings', icon: Settings }] },
]

const money = (value: number | string | null | undefined) => new Intl.NumberFormat('fr-DZ', {
  style: 'currency', currency: 'DZD', maximumFractionDigits: 2,
}).format(Number(value || 0))
const dateLabel = (value: string | null | undefined) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('fr-DZ', { dateStyle: 'medium' }).format(date)
}
const fullName = (employee: Employee) => `${employee.firstName} ${employee.lastName}`

function App() {
  const [active, setActive] = useState('Overview')
  const [departments, setDepartments] = useState<Department[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [payroll, setPayroll] = useState<PayrollSummary | null>(null)
  const [query, setQuery] = useState('')
  const [mobileNav, setMobileNav] = useState(false)
  const [dark, setDark] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [departmentForm, setDepartmentForm] = useState({ name: '', description: '', monthlyBudget: '' })
  const [transactionForm, setTransactionForm] = useState({ merchant: '', category: '', amount: '', transactionDate: new Date().toISOString().slice(0, 10), departmentId: '', employeeId: '', description: '', status: 'needs_receipt' as Transaction['status'] })
  const [employeeForm, setEmployeeForm] = useState({
    employeeCode: '', firstName: '', lastName: '', email: '', phone: '',
    departmentId: '', position: '', hireDate: '', baseSalary: '', employmentStatus: 'active' as Employee['employmentStatus'],
  })

  const loadData = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true)
    else setLoading(true)
    setError('')
    try {
      const results = await Promise.all([
        getDepartments(), getEmployees(), getTransactions(), getPayrollSummary(),
      ])
      setDepartments(results[0])
      setEmployees(results[1])
      setTransactions(results[2])
      setPayroll(results[3])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger les données.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { void loadData() }, [loadData])

  const filteredTransactions = useMemo(() => transactions.filter(item =>
    `${item.merchant} ${item.category} ${item.departmentName || ''} ${item.employeeName || ''}`.toLowerCase().includes(query.toLowerCase())
  ), [transactions, query])
  const filteredEmployees = useMemo(() => employees.filter(item =>
    `${fullName(item)} ${item.employeeCode} ${item.position} ${item.departmentName || ''}`.toLowerCase().includes(query.toLowerCase())
  ), [employees, query])
  const filteredDepartments = useMemo(() => departments.filter(item =>
    `${item.name} ${item.description || ''}`.toLowerCase().includes(query.toLowerCase())
  ), [departments, query])

  const totalTransactions = transactions.reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const receiptCount = transactions.filter(item => item.status === 'needs_receipt').length
  const chartData = useMemo(() => {
    const buckets = new Map<string, number>()
    transactions.forEach(item => {
      const date = new Date(item.transactionDate)
      if (!Number.isNaN(date.getTime())) {
        const key = new Intl.DateTimeFormat('fr-DZ', { day: '2-digit', month: 'short' }).format(date)
        buckets.set(key, (buckets.get(key) || 0) + Number(item.amount || 0))
      }
    })
    return Array.from(buckets, ([day, spend]) => ({ day, spend })).slice(0, 7).reverse()
  }, [transactions])

  const openSection = (label: string) => {
    setActive(label)
    setShowForm(false)
    setNotice('')
    setMobileNav(false)
  }

  const submitDepartment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await createDepartment({
        name: departmentForm.name.trim(),
        description: departmentForm.description.trim() || undefined,
        monthlyBudget: Number(departmentForm.monthlyBudget || 0),
      })
      setDepartmentForm({ name: '', description: '', monthlyBudget: '' })
      setShowForm(false)
      setNotice('Département enregistré dans PostgreSQL.')
      await loadData(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de la création du département.')
    } finally { setSaving(false) }
  }

  const submitEmployee = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await createEmployee({
        employeeCode: employeeForm.employeeCode.trim(),
        firstName: employeeForm.firstName.trim(),
        lastName: employeeForm.lastName.trim(),
        email: employeeForm.email.trim() || null,
        phone: employeeForm.phone.trim() || null,
        departmentId: employeeForm.departmentId ? Number(employeeForm.departmentId) : null,
        position: employeeForm.position.trim(),
        hireDate: employeeForm.hireDate || null,
        baseSalary: Number(employeeForm.baseSalary || 0),
        employmentStatus: employeeForm.employmentStatus,
      })
      setEmployeeForm({
        employeeCode: '', firstName: '', lastName: '', email: '', phone: '',
        departmentId: '', position: '', hireDate: '', baseSalary: '', employmentStatus: 'active',
      })
      setShowForm(false)
      setNotice('Employé enregistré dans PostgreSQL.')
      await loadData(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de la création de l’employé.')
    } finally { setSaving(false) }
  }

  const submitTransaction = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await createTransaction({
        merchant: transactionForm.merchant.trim(),
        category: transactionForm.category.trim(),
        amount: Number(transactionForm.amount),
        transactionDate: transactionForm.transactionDate || undefined,
        departmentId: transactionForm.departmentId ? Number(transactionForm.departmentId) : null,
        employeeId: transactionForm.employeeId ? Number(transactionForm.employeeId) : null,
        description: transactionForm.description.trim() || null,
        status: transactionForm.status,
      })
      setTransactionForm({ merchant: '', category: '', amount: '', transactionDate: new Date().toISOString().slice(0, 10), departmentId: '', employeeId: '', description: '', status: 'needs_receipt' })
      setShowForm(false)
      setNotice('Transaction enregistrée dans PostgreSQL.')
      await loadData(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec de la création de la transaction.')
    } finally { setSaving(false) }
  }

  const canCreate = active === 'Departments' || active === 'Team members' || active === 'Transactions'
  const heading = active === 'Team members' ? 'Employés' : active
  const subtitle: Record<string, string> = {
    Overview: 'Vue d’ensemble calculée à partir des données enregistrées dans PostgreSQL.',
    Transactions: 'Les opérations financières lues depuis la base de données.',
    'Team members': 'Les employés enregistrés dans votre base de données.',
    Departments: 'Les départements et leurs budgets enregistrés.',
    Payroll: 'Synthèse réelle des périodes et des montants de paie.',
    Cards: 'Les cartes d’entreprise seront affichées ici quand leur API sera activée.',
    Budgets: 'La gestion détaillée des budgets sera connectée dans une prochaine étape.',
    Dues: 'Les échéances enregistrées seront connectées dans une prochaine étape.',
    Reports: 'Les rapports seront construits à partir des données de la base.',
    Integrations: 'Configuration des intégrations.',
    Settings: 'Paramètres de l’application.',
  }

  return (
    <div className={`app-shell ${dark ? 'dark-mode' : ''}`}>
      {mobileNav && <button className="mobile-scrim" aria-label="Fermer la navigation" onClick={() => setMobileNav(false)} />}
      <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
        <button className="brand" onClick={() => openSection('Overview')} aria-label="Accueil">
          <span className="brand-mark"><span /></span><span className="brand-name">Money<span>.</span></span>
        </button>
        <div className="workspace-switch">
          <div className="workspace-avatar">FP</div><div className="workspace-copy"><strong>Finance & Payroll</strong><small>PostgreSQL workspace</small></div><Database size={15} />
        </div>
        <div className="sidebar-section">
          <span className="section-caption">VOTRE ESPACE</span>
          <div className="money-summary"><div><strong>Finance</strong><small>Transactions, équipe,<br />départements et paie</small></div><span className="tiny-icon"><Wallet size={15} /></span></div>
        </div>
        <nav className="nav-list">
          {navGroups.map(group => <div className="nav-group" key={group.title}>
            <div className="nav-heading">{group.title}</div>
            {group.items.map(item => {
              const Icon = item.icon
              return <button key={item.label} className={`nav-item ${active === item.label ? 'active' : ''}`} onClick={() => openSection(item.label)}>
                <Icon size={17} strokeWidth={1.8} /><span>{item.label === 'Team members' ? 'Employés' : item.label === 'Departments' ? 'Départements' : item.label}</span>
                {item.label === 'Team members' && <small className="nav-count">{employees.length}</small>}
                {item.label === 'Departments' && <small className="nav-count">{departments.length}</small>}
              </button>
            })}
          </div>)}
        </nav>
        <div className="close-progress"><div className="close-title"><span>État de connexion</span><span>{error ? 'Erreur' : loading ? '…' : 'OK'}</span></div><div className="progress-track"><span style={{ width: error ? '25%' : loading ? '50%' : '100%' }} /></div><small>{error ? 'Vérifiez le serveur API' : 'API locale · port 3001'}</small></div>
        <div className="sidebar-bottom"><div className="profile-avatar">DB</div><div className="profile-copy"><strong>Base de données locale</strong><small>hani-model-1 · PostgreSQL</small></div><ShieldCheck size={16} /></div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMobileNav(true)} aria-label="Ouvrir la navigation"><Menu size={20} /></button>
          <div className="breadcrumbs"><span>Finance & Payroll</span><span className="crumb-chevron">›</span><span>Workspace</span><span className="crumb-chevron">›</span><strong>{heading}</strong></div>
          <div className="top-actions">
            <label className="search-box"><Search size={16} /><input placeholder="Rechercher..." value={query} onChange={event => setQuery(event.target.value)} /><kbd>Ctrl K</kbd></label>
            <button className="icon-button" aria-label="Actualiser les données" onClick={() => void loadData(true)} disabled={refreshing}><RefreshCw size={16} className={refreshing ? 'spin-icon' : ''} /></button>
            <button className="icon-button" aria-label="Changer le thème" onClick={() => setDark(!dark)}><Moon size={17} /></button>
            <button className="icon-button notification-button" aria-label="Notifications" onClick={() => setActive('Transactions')}><Bell size={17} /><i /></button>
            {canCreate && <button className="primary-button top-new" onClick={() => setShowForm(!showForm)}><Plus size={16} /> Ajouter</button>}
          </div>
        </header>

        <section className="page-content">
          <div className="page-heading">
            <div><div className="eyebrow"><span className="status-dot" /> DONNÉES EN DIRECT</div><h1>{heading}</h1><p>{subtitle[active] || 'Gestion de votre espace Finance & Payroll.'}</p></div>
            <div className="heading-actions">
              <button className="secondary-button" onClick={() => void loadData(true)}><RefreshCw size={14} /> {refreshing ? 'Actualisation…' : 'Actualiser'}</button>
              {canCreate && <button className="primary-button" onClick={() => setShowForm(!showForm)}><Plus size={16} /> {active === 'Departments' ? 'Nouveau département' : active === 'Transactions' ? 'Nouvelle transaction' : 'Nouvel employé'}</button>}
            </div>
          </div>

          {error && <div className="api-alert" role="alert"><strong>Erreur de connexion</strong><span>{error}</span><button className="secondary-button" onClick={() => void loadData(true)}>Réessayer</button></div>}
          {notice && <div className="api-notice" role="status"><Check size={16} /> {notice}<button onClick={() => setNotice('')} aria-label="Fermer"><X size={14} /></button></div>}

          {showForm && active === 'Departments' && <form className="panel data-form" onSubmit={submitDepartment}>
            <h2>Ajouter un département</h2>
            <div className="form-grid"><label>Nom du département *<input required maxLength={120} value={departmentForm.name} onChange={e => setDepartmentForm({ ...departmentForm, name: e.target.value })} placeholder="Ex. Informatique" /></label><label>Budget mensuel (DA)<input type="number" min="0" step="0.01" value={departmentForm.monthlyBudget} onChange={e => setDepartmentForm({ ...departmentForm, monthlyBudget: e.target.value })} placeholder="0" /></label><label className="form-wide">Description<input value={departmentForm.description} onChange={e => setDepartmentForm({ ...departmentForm, description: e.target.value })} placeholder="Description (facultatif)" /></label></div>
            <div className="form-actions"><button type="button" className="secondary-button" onClick={() => setShowForm(false)}>Annuler</button><button disabled={saving} className="primary-button" type="submit">{saving ? 'Enregistrement…' : 'Enregistrer dans PostgreSQL'}</button></div>
          </form>}

          {showForm && active === 'Transactions' && <form className="panel data-form" onSubmit={submitTransaction}>
            <h2>Ajouter une transaction</h2>
            <div className="form-grid">
              <label>Marchand / bénéficiaire *<input required maxLength={180} value={transactionForm.merchant} onChange={e => setTransactionForm({ ...transactionForm, merchant: e.target.value })} placeholder="Ex. Fournisseur" /></label>
              <label>Catégorie *<input required maxLength={100} value={transactionForm.category} onChange={e => setTransactionForm({ ...transactionForm, category: e.target.value })} placeholder="Ex. Fournitures" /></label>
              <label>Montant (DA) *<input required type="number" min="0" step="0.01" value={transactionForm.amount} onChange={e => setTransactionForm({ ...transactionForm, amount: e.target.value })} /></label>
              <label>Date *<input required type="date" value={transactionForm.transactionDate} onChange={e => setTransactionForm({ ...transactionForm, transactionDate: e.target.value })} /></label>
              <label>Département<select value={transactionForm.departmentId} onChange={e => setTransactionForm({ ...transactionForm, departmentId: e.target.value })}><option value="">Aucun</option>{departments.map(department => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label>
              <label>Employé<select value={transactionForm.employeeId} onChange={e => setTransactionForm({ ...transactionForm, employeeId: e.target.value })}><option value="">Aucun</option>{employees.map(employee => <option key={employee.id} value={employee.id}>{fullName(employee)}</option>)}</select></label>
              <label>Statut<select value={transactionForm.status} onChange={e => setTransactionForm({ ...transactionForm, status: e.target.value as Transaction['status'] })}><option value="needs_receipt">Justificatif requis</option><option value="pending">En attente</option><option value="complete">Terminé</option></select></label>
              <label>Description<input value={transactionForm.description} onChange={e => setTransactionForm({ ...transactionForm, description: e.target.value })} placeholder="Facultatif" /></label>
            </div>
            <div className="form-actions"><button type="button" className="secondary-button" onClick={() => setShowForm(false)}>Annuler</button><button disabled={saving} className="primary-button" type="submit">{saving ? 'Enregistrement…' : 'Enregistrer dans PostgreSQL'}</button></div>
          </form>}

          {showForm && active === 'Team members' && <form className="panel data-form" onSubmit={submitEmployee}>
            <h2>Ajouter un employé</h2>
            <div className="form-grid">
              <label>Matricule *<input required maxLength={40} value={employeeForm.employeeCode} onChange={e => setEmployeeForm({ ...employeeForm, employeeCode: e.target.value })} /></label>
              <label>Poste *<input required value={employeeForm.position} onChange={e => setEmployeeForm({ ...employeeForm, position: e.target.value })} placeholder="Ex. Comptable" /></label>
              <label>Prénom *<input required value={employeeForm.firstName} onChange={e => setEmployeeForm({ ...employeeForm, firstName: e.target.value })} /></label>
              <label>Nom *<input required value={employeeForm.lastName} onChange={e => setEmployeeForm({ ...employeeForm, lastName: e.target.value })} /></label>
              <label>E-mail<input type="email" value={employeeForm.email} onChange={e => setEmployeeForm({ ...employeeForm, email: e.target.value })} /></label>
              <label>Téléphone<input value={employeeForm.phone} onChange={e => setEmployeeForm({ ...employeeForm, phone: e.target.value })} /></label>
              <label>Département<select value={employeeForm.departmentId} onChange={e => setEmployeeForm({ ...employeeForm, departmentId: e.target.value })}><option value="">Aucun</option>{departments.map(department => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label>
              <label>Date d’embauche<input type="date" value={employeeForm.hireDate} onChange={e => setEmployeeForm({ ...employeeForm, hireDate: e.target.value })} /></label>
              <label>Salaire de base (DA)<input type="number" min="0" step="0.01" value={employeeForm.baseSalary} onChange={e => setEmployeeForm({ ...employeeForm, baseSalary: e.target.value })} /></label>
              <label>Statut<select value={employeeForm.employmentStatus} onChange={e => setEmployeeForm({ ...employeeForm, employmentStatus: e.target.value as Employee['employmentStatus'] })}><option value="active">Actif</option><option value="on_leave">En congé</option><option value="inactive">Inactif</option></select></label>
            </div>
            <div className="form-actions"><button type="button" className="secondary-button" onClick={() => setShowForm(false)}>Annuler</button><button disabled={saving} className="primary-button" type="submit">{saving ? 'Enregistrement…' : 'Enregistrer dans PostgreSQL'}</button></div>
          </form>}

          {loading ? <div className="panel loading-state"><LoaderCircle size={22} className="spin-icon" /><strong>Chargement des données depuis PostgreSQL…</strong></div> : <>
            {active === 'Overview' && <>
              <section className="overview-strip">
                <div className="overview-cell"><div className="overview-label"><span>Employés actifs</span><span className="overview-icon"><Users size={15} /></span></div><div className="overview-value">{payroll?.activeEmployees ?? 0}</div><div className="overview-foot">{employees.length} employé(s) enregistré(s)</div></div>
                <div className="overview-cell"><div className="overview-label"><span>Départements</span><span className="overview-icon"><BriefcaseBusiness size={15} /></span></div><div className="overview-value">{payroll?.departmentCount ?? departments.length}</div><div className="overview-foot">{money(departments.reduce((sum, item) => sum + Number(item.monthlyBudget || 0), 0))} de budgets mensuels</div></div>
                <div className="overview-cell"><div className="overview-label"><span>Transactions à traiter</span><span className="overview-icon warning-icon"><Activity size={15} /></span></div><div className="overview-value">{receiptCount}</div><div className="overview-foot">Montant cumulé listé : {money(totalTransactions)}</div></div>
              </section>
              <div className="dashboard-grid">
                <section className="panel activity-panel">
                  <div className="panel-heading"><div><h2>Activité financière</h2><p>Montants regroupés par date à partir des transactions réelles.</p></div><span className="count-pill">{transactions.length}</span></div>
                  {chartData.length ? <div className="chart-area"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 8, right: 5, left: -18, bottom: 0 }}><defs><linearGradient id="liveSpendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7eae94" stopOpacity={0.28} /><stop offset="95%" stopColor="#7eae94" stopOpacity={0.015} /></linearGradient></defs><CartesianGrid strokeDasharray="3 4" vertical={false} stroke="var(--line)" /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 10 }} tickFormatter={v => new Intl.NumberFormat('fr-DZ', { notation: 'compact' }).format(v)} /><Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--line)', background: 'var(--panel)', fontSize: 12 }} formatter={(value) => [money(Number(value)), 'Montant']} /><Area type="monotone" dataKey="spend" stroke="#5b987a" strokeWidth={2.5} fill="url(#liveSpendFill)" /></AreaChart></ResponsiveContainer></div> : <div className="empty-state">Aucune transaction enregistrée. Le graphique apparaîtra après l’ajout de données.</div>}
                  <button className="text-link" onClick={() => openSection('Transactions')}>Consulter les transactions <ArrowUpRight size={14} /></button>
                </section>
                <section className="panel">
                  <div className="panel-heading"><div><h2>Équipe</h2><p>Derniers employés enregistrés</p></div><Users size={18} /></div>
                  {employees.slice(0, 5).map(employee => <div className="simple-list-row" key={employee.id}><span className="simple-avatar">{employee.firstName.slice(0, 1)}{employee.lastName.slice(0, 1)}</span><span className="simple-list-copy"><strong>{fullName(employee)}</strong><small>{employee.position} · {employee.departmentName || 'Sans département'}</small></span><span className={`status-pill ${employee.employmentStatus === 'active' ? 'complete' : 'pending'}`}>{employee.employmentStatus === 'active' ? 'Actif' : employee.employmentStatus === 'on_leave' ? 'Congé' : 'Inactif'}</span></div>)}
                  {!employees.length && <div className="empty-state">Aucun employé. Ajoutez le premier depuis « Employés ».</div>}
                  <button className="text-link" onClick={() => openSection('Team members')}>Gérer les employés <ArrowUpRight size={14} /></button>
                </section>
                <section className="panel transactions-panel">
                  <div className="panel-heading"><div><h2>Transactions récentes</h2><p>Dernières opérations depuis PostgreSQL.</p></div><CircleDollarSign size={18} /></div>
                  <TransactionTable items={filteredTransactions.slice(0, 5)} />
                  <button className="text-link" onClick={() => openSection('Transactions')}>Voir toutes les transactions <ArrowUpRight size={14} /></button>
                </section>
                <section className="panel">
                  <div className="panel-heading"><div><h2>Résumé de la paie</h2><p>Données issues des périodes de paie.</p></div><Wallet size={18} /></div>
                  <div className="payroll-summary"><span>Paie non réglée</span><strong>{money(payroll?.unpaidPayroll)}</strong></div>
                  <div className="simple-list-row"><span className="overview-icon"><CalendarDays size={15} /></span><span className="simple-list-copy"><strong>{payroll?.draftPayrollPeriods ?? 0} période(s) en brouillon</strong><small>Nombre calculé depuis payroll_periods</small></span></div>
                  <button className="text-link" onClick={() => openSection('Payroll')}>Ouvrir la paie <ArrowUpRight size={14} /></button>
                </section>
              </div>
            </>}

            {active === 'Transactions' && <section className="panel data-panel"><div className="panel-heading"><div><h2>Transactions</h2><p>{filteredTransactions.length} résultat(s) · lecture directe de la base de données</p></div><ArrowLeftRight size={18} /></div><TransactionTable items={filteredTransactions} /></section>}

            {active === 'Team members' && <section className="panel data-panel"><div className="panel-heading"><div><h2>Employés</h2><p>{filteredEmployees.length} employé(s) · enregistrement et lecture PostgreSQL</p></div><Users size={18} /></div>
              <div className="data-table-scroll"><table className="real-data-table"><thead><tr><th>Matricule</th><th>Nom complet</th><th>Poste</th><th>Département</th><th>Salaire de base</th><th>Statut</th></tr></thead><tbody>{filteredEmployees.map(employee => <tr key={employee.id}><td>{employee.employeeCode}</td><td><strong>{fullName(employee)}</strong><small>{employee.email || employee.phone || '—'}</small></td><td>{employee.position}</td><td>{employee.departmentName || '—'}</td><td>{money(employee.baseSalary)}</td><td><span className={`status-pill ${employee.employmentStatus === 'active' ? 'complete' : 'pending'}`}>{employee.employmentStatus === 'active' ? 'Actif' : employee.employmentStatus === 'on_leave' ? 'En congé' : 'Inactif'}</span></td></tr>)}</tbody></table></div>
              {!filteredEmployees.length && <div className="empty-state">{query ? 'Aucun employé ne correspond à la recherche.' : 'Aucun employé dans PostgreSQL. Cliquez sur « Nouvel employé » pour commencer.'}</div>}
            </section>}

            {active === 'Departments' && <section className="panel data-panel"><div className="panel-heading"><div><h2>Départements</h2><p>{filteredDepartments.length} département(s) · budgets et effectifs depuis PostgreSQL</p></div><BriefcaseBusiness size={18} /></div>
              <div className="data-table-scroll"><table className="real-data-table"><thead><tr><th>Département</th><th>Description</th><th>Employés</th><th>Budget mensuel</th></tr></thead><tbody>{filteredDepartments.map(department => <tr key={department.id}><td><strong>{department.name}</strong></td><td>{department.description || '—'}</td><td>{department.employeeCount ?? employees.filter(e => e.departmentId === department.id).length}</td><td>{money(department.monthlyBudget)}</td></tr>)}</tbody></table></div>
              {!filteredDepartments.length && <div className="empty-state">{query ? 'Aucun département ne correspond à la recherche.' : 'Aucun département dans PostgreSQL. Cliquez sur « Nouveau département » pour commencer.'}</div>}
            </section>}

            {active === 'Payroll' && <div className="dashboard-grid">
              <section className="panel"><div className="panel-heading"><div><h2>État de la paie</h2><p>Statistiques calculées par le serveur.</p></div><Wallet size={18} /></div><div className="payroll-summary"><span>Montant non payé</span><strong>{money(payroll?.unpaidPayroll)}</strong></div><div className="simple-list-row"><span className="overview-icon"><Users size={15} /></span><span className="simple-list-copy"><strong>{payroll?.activeEmployees ?? 0} employés actifs</strong><small>Depuis la table employees</small></span></div><div className="simple-list-row"><span className="overview-icon"><CalendarDays size={15} /></span><span className="simple-list-copy"><strong>{payroll?.draftPayrollPeriods ?? 0} période(s) en brouillon</strong><small>Depuis la table payroll_periods</small></span></div></section>
              <section className="panel"><div className="panel-heading"><div><h2>Employés</h2><p>Salaires de base enregistrés</p></div><CircleDollarSign size={18} /></div><div className="data-table-scroll"><table className="real-data-table"><thead><tr><th>Employé</th><th>Salaire</th></tr></thead><tbody>{employees.map(employee => <tr key={employee.id}><td>{fullName(employee)}</td><td>{money(employee.baseSalary)}</td></tr>)}</tbody></table></div></section>
            </div>}

            {!['Overview', 'Transactions', 'Team members', 'Departments', 'Payroll'].includes(active) && <section className="panel coming-soon"><span className="overview-icon"><Database size={18} /></span><h2>{active}</h2><p>{subtitle[active] || 'Cette section sera connectée à l’API dans une prochaine étape.'}</p><p className="coming-note">Aucune donnée de démonstration n’est affichée ici. Les cartes, budgets et échéances seront activés une fois leurs routes API disponibles.</p><button className="secondary-button" onClick={() => openSection('Overview')}>Retour au Dashboard</button></section>}
          </>}

          <footer className="page-footer"><span>Finance & Payroll · données locales</span><span><ShieldCheck size={13} /> Connecté à l’API PostgreSQL</span><span>API : localhost:3001</span></footer>
        </section>
      </main>
    </div>
  )
}

function TransactionTable({ items }: { items: Transaction[] }) {
  if (!items.length) return <div className="empty-state">Aucune transaction dans PostgreSQL pour le moment.</div>
  return <div className="data-table-scroll"><table className="real-data-table"><thead><tr><th>Marchand</th><th>Catégorie</th><th>Date</th><th>Montant</th><th>Statut</th></tr></thead><tbody>{items.map(item => <tr key={item.id}><td><strong>{item.merchant}</strong><small>{item.description || item.employeeName || '—'}</small></td><td>{item.category}</td><td>{dateLabel(item.transactionDate)}</td><td>{money(item.amount)}</td><td><span className={`status-pill ${item.status === 'complete' ? 'complete' : 'pending'}`}>{item.status === 'complete' ? <><Check size={11} /> Terminé</> : item.status === 'needs_receipt' ? 'Justificatif requis' : 'En attente'}</span></td></tr>)}</tbody></table></div>
}

export default App
