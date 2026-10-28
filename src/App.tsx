import { useMemo, useState } from 'react'
import {
  Activity, ArrowDownRight, ArrowLeftRight, ArrowUpRight, Bell,
  BriefcaseBusiness, CalendarDays, Check, ChevronDown, CreditCard,
  Ellipsis, FileText, Filter, Home, Menu, Moon, Plus, Search, Settings,
  ShieldCheck, SlidersHorizontal, Sparkles, Users, Wallet, X, Zap,
} from 'lucide-react'
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'

type CardItem = { id: number; title: string; number: string; owner: string; balance: string; limit: string; tone: string; live: boolean }
type Transaction = { name: string; category: string; date: string; amount: string; icon: string; status: string }

const initialCards: CardItem[] = [
  { id: 1, title: 'Route setting', number: '3317', owner: 'Mateo Reyes', balance: '$1,976', limit: '$6,000', tone: 'green', live: true },
  { id: 2, title: 'CafÃ©', number: '8842', owner: 'Aiko Tanaka', balance: '$2,528', limit: '$3,500', tone: 'peach', live: true },
  { id: 3, title: 'Operations', number: '0459', owner: 'Noor Haddad', balance: '$881', limit: '$3,000', tone: 'dark', live: false },
  { id: 4, title: 'Marketing', number: '2706', owner: 'Lena Adeyemi', balance: '$2,609', limit: '$2,500', tone: 'rose', live: true },
  { id: 5, title: 'Facilities', number: '1924', owner: 'Sam Morgan', balance: '$1,240', limit: '$4,000', tone: 'mint', live: true },
  { id: 6, title: 'Travel', number: '6091', owner: 'Riley Chen', balance: '$640', limit: '$2,000', tone: 'stone', live: false },
]
const transactions: Transaction[] = [
  { name: 'Front Range Climbing', category: 'Marketing', date: 'Oct 19 Â· Marketing', amount: '$675.43', icon: 'F', status: 'Needs receipt' },
  { name: 'Peak Plumbing Supply', category: 'Facilities', date: 'Oct 18 Â· Facilities', amount: '$267.33', icon: 'P', status: 'Needs receipt' },
  { name: 'Peak Plumbing Supply', category: 'Facilities', date: 'Oct 22 Â· Facilities', amount: '$292.81', icon: 'P', status: 'Needs receipt' },
  { name: 'Notion Labs', category: 'Software', date: 'Oct 22 Â· Operations', amount: '$24.00', icon: 'N', status: 'Complete' },
]
const spendData = [
  { day: 'Mon', spend: 320 }, { day: 'Tue', spend: 510 }, { day: 'Wed', spend: 390 },
  { day: 'Thu', spend: 680 }, { day: 'Fri', spend: 470 }, { day: 'Sat', spend: 760 }, { day: 'Sun', spend: 580 },
]
const navGroups = [
  { title: 'WORKSPACE', items: [{ label: 'Overview', icon: Home }, { label: 'Transactions', icon: ArrowLeftRight, count: '17' }, { label: 'Cards', icon: CreditCard }, { label: 'Budgets', icon: SlidersHorizontal }, { label: 'Dues', icon: CalendarDays, count: '4' }] },
  { title: 'PEOPLE', items: [{ label: 'Team members', icon: Users }, { label: 'Payroll', icon: Wallet }, { label: 'Departments', icon: BriefcaseBusiness }] },
  { title: 'MANAGE', items: [{ label: 'Reports', icon: FileText }, { label: 'Integrations', icon: Zap }, { label: 'Settings', icon: Settings }] },
]

function App() {
  const [active, setActive] = useState('Cards')
  const [cards, setCards] = useState(initialCards)
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState(false)
  const [newCardName, setNewCardName] = useState('')
  const [mobileNav, setMobileNav] = useState(false)
  const [dark, setDark] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const filteredTransactions = useMemo(() => transactions.filter(t => `${t.name} ${t.category}`.toLowerCase().includes(query.toLowerCase())), [query])
  const toggleCard = (id: number) => setCards(current => current.map(c => c.id === id ? { ...c, live: !c.live } : c))
  const addCard = () => {
    if (!newCardName.trim()) return
    setCards(current => [...current, { id: Date.now(), title: newCardName.trim(), number: String(Math.floor(1000 + Math.random() * 8999)), owner: 'You', balance: '$0', limit: '$2,000', tone: 'mint', live: true }])
    setNewCardName('')
    setModal(false)
  }

  return (
    <div className={`app-shell ${dark ? 'dark-mode' : ''}`}>
      {mobileNav && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}
      <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
        <button className="brand" onClick={() => setActive('Overview')} aria-label="Money home"><span className="brand-mark"><span /></span><span className="brand-name">Money<span>.</span></span></button>
        <div className="workspace-switch">
          <div className="workspace-avatar">HC</div><div className="workspace-copy"><strong>Haldane Climbing</strong><small>Business workspace</small></div><ChevronDown size={15} />
        </div>
        <div className="sidebar-section">
          <span className="section-caption">YOUR MONEY</span>
          <div className="money-summary"><div><strong>Money</strong><small>Spending, cards, budgets<br />and dues</small></div><span className="tiny-icon"><Wallet size={15} /></span></div>
        </div>
        <nav className="nav-list">
          {navGroups.map(group => <div className="nav-group" key={group.title}>
            <div className="nav-heading">{group.title}</div>
            {group.items.map(item => {
              const Icon = item.icon
              return <button key={item.label} className={`nav-item ${active === item.label ? 'active' : ''}`} onClick={() => { setActive(item.label); setMobileNav(false) }}>
                <Icon size={17} strokeWidth={1.8} /><span>{item.label}</span>{'count' in item && <small className="nav-count">{item.count}</small>}
              </button>
            })}
          </div>)}
        </nav>
        <div className="close-progress"><div className="close-title"><span>October close</span><span>1/8</span></div><div className="progress-track"><span /></div><small>Category transactions</small></div>
        <div className="sidebar-bottom">
          <div className="profile-avatar">HC</div><div className="profile-copy"><strong>Haldane Climbing</strong><small>3 gyms Â· 9:14 AM in Denver</small></div><Ellipsis size={17} />
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu size={20} /></button>
          <div className="breadcrumbs"><span>Haldane Climbing</span><span className="crumb-chevron">â€º</span><span>Money</span><span className="crumb-chevron">â€º</span><strong>{active}</strong></div>
          <div className="top-actions">
            <label className="search-box"><Search size={16} /><input placeholder="Search payees, people, agreements..." value={query} onChange={e => setQuery(e.target.value)} /><kbd>âŒ˜ K</kbd></label>
            <button className="icon-button" aria-label="Calendar" onClick={() => setActive('Dues')}><CalendarDays size={17} /></button>
            <button className="icon-button" aria-label="Toggle theme" onClick={() => setDark(!dark)}><Moon size={17} /></button>
            <button className="icon-button notification-button" aria-label="Notifications"><Bell size={17} /><i /></button>
            <button className="primary-button top-new" onClick={() => setModal(true)}><Plus size={16} /> New</button>
          </div>
        </header>

        <section className="page-content">
          <div className="page-heading">
            <div><div className="eyebrow"><span className="status-dot" /> MONEY WORKSPACE</div><h1>{active}</h1><p>{active === 'Cards' ? `${cards.length} company cards Â· $9,850 spent this month.` : `A clear view of your ${active.toLowerCase()} and company activity.`}</p></div>
            <div className="heading-actions"><button className="secondary-button" onClick={() => setShowAll(!showAll)}><Filter size={15} /> {showAll ? 'Show less' : 'This month'} <ChevronDown size={14} /></button><button className="primary-button" onClick={() => setModal(true)}><Plus size={16} /> New card</button></div>
          </div>

          <section className="overview-strip">
            <div className="overview-cell"><div className="overview-label"><span>Total card spend</span><span className="overview-icon"><CreditCard size={15} /></span></div><div className="overview-value">$9,850<span className="positive"><ArrowUpRight size={14} /> 8.2%</span></div><div className="overview-foot">Compared with last month</div></div>
            <div className="overview-cell"><div className="overview-label"><span>Available budget</span><span className="overview-icon"><Wallet size={15} /></span></div><div className="overview-value">$18,420</div><div className="mini-progress"><span /></div><div className="overview-foot">68% of monthly limit</div></div>
            <div className="overview-cell"><div className="overview-label"><span>Needs attention</span><span className="overview-icon warning-icon"><Activity size={15} /></span></div><div className="overview-value">3<span className="attention-tag">Receipts due</span></div><div className="overview-foot">Keep your books up to date</div></div>
          </section>

          <div className="dashboard-grid">
            <section className="panel cards-panel">
              <div className="panel-heading"><div><h2>Company cards</h2><p>Manage your team's spending in one place.</p></div><button className="round-more" aria-label="Card options"><Ellipsis size={19} /></button></div>
              <div className="cards-grid">
                {(showAll ? cards : cards.slice(0, 4)).map(card => <article className="spend-card-wrap" key={card.id}>
                  <div className={`spend-card ${card.tone}`}>
                    <div className="spend-card-top"><span>{card.title}</span><button className="card-more" aria-label={`Options for ${card.title}`}><Ellipsis size={16} /></button></div>
                    <div className="chip"><span /><i /></div>
                    <div className="card-number">â€¢â€¢â€¢â€¢ {card.number}</div>
                    <div className="card-footer"><span>{card.owner}</span><strong>COFFRA</strong></div>
                  </div>
                  <div className="card-details"><div className="card-balance"><strong>{card.balance}</strong><small>of {card.limit}</small></div><div className="card-meter"><span style={{ width: `${Math.min(92, (parseFloat(card.balance.replace('$', '').replace(',', '')) / parseFloat(card.limit.replace('$', '').replace(',', ''))) * 100)}%` }} /></div><span className="live-label">{card.live ? 'Live' : 'Paused'}</span><button onClick={() => toggleCard(card.id)} className={`toggle ${card.live ? 'toggle-on' : ''}`} aria-label={`${card.live ? 'Pause' : 'Activate'} ${card.title}`}><span /></button></div>
                </article>)}
              </div>
              <button className="text-link" onClick={() => setShowAll(!showAll)}>{showAll ? 'Show fewer cards' : 'View all company cards'} <ArrowUpRight size={14} /></button>
            </section>

            <section className="panel receipts-panel">
              <div className="panel-heading"><div><h2>Missing receipts</h2><p>3 card charges this month</p></div><span className="count-pill">3</span></div>
              <div className="receipt-list">
                {filteredTransactions.filter(t => t.status === 'Needs receipt').slice(0, showAll ? 4 : 3).map((t, i) => <div className="receipt-row" key={`${t.name}-${i}`}><div className={`merchant-avatar merchant-${t.icon.toLowerCase()}`}>{t.icon}</div><div className="receipt-info"><strong>{t.name}</strong><small>{t.date}</small></div><div className="receipt-amount"><strong>{t.amount}</strong><button onClick={() => alert(`Receipt request prepared for ${t.name}. Connect a backend to send it.`)}><ArrowDownRight size={12} /> Attach</button></div></div>)}
                {filteredTransactions.filter(t => t.status === 'Needs receipt').length === 0 && <div className="empty-state">No matching receipts found.</div>}
              </div>
              <button className="text-link" onClick={() => setActive('Transactions')}>Review transactions <ArrowUpRight size={14} /></button>
            </section>

            <section className="panel activity-panel">
              <div className="panel-heading"><div><h2>Spending activity</h2><p>Your card spend over the last 7 days</p></div><button className="secondary-button compact-button">This week <ChevronDown size={13} /></button></div>
              <div className="chart-summary"><strong>$3,710.00</strong><span className="positive"><ArrowUpRight size={14} /> 12.4%</span><small>vs. previous week</small></div>
              <div className="chart-area"><ResponsiveContainer width="100%" height="100%"><AreaChart data={spendData} margin={{ top: 8, right: 5, left: -24, bottom: 0 }}><defs><linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7eae94" stopOpacity={0.28} /><stop offset="95%" stopColor="#7eae94" stopOpacity={0.015} /></linearGradient></defs><CartesianGrid strokeDasharray="3 4" vertical={false} stroke="var(--line)" /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 11 }} dy={8} /><YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 10 }} tickFormatter={v => `$${v}`} /><Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--line)', background: 'var(--panel)', fontSize: 12 }} formatter={(v) => [`$${v}`, 'Spend']} /><Area type="monotone" dataKey="spend" stroke="#5b987a" strokeWidth={2.5} fill="url(#spendFill)" activeDot={{ r: 5, fill: '#5b987a', stroke: '#fff', strokeWidth: 2 }} /></AreaChart></ResponsiveContainer></div>
            </section>

            <section className="panel transactions-panel">
              <div className="panel-heading"><div><h2>Recent transactions</h2><p>Keep track of your latest card activity.</p></div><button className="round-more" aria-label="Transaction filters"><SlidersHorizontal size={16} /></button></div>
              <div className="transaction-table">
                <div className="table-head"><span>MERCHANT</span><span>DATE</span><span>AMOUNT</span><span>STATUS</span></div>
                {filteredTransactions.map((t, i) => <div className="table-row" key={`${t.name}-row-${i}`}><div className="merchant-cell"><div className={`merchant-avatar merchant-${t.icon.toLowerCase()}`}>{t.icon}</div><div><strong>{t.name}</strong><small>{t.category}</small></div></div><span className="table-date">{t.date.split(' Â· ')[0]}</span><strong className="table-amount">{t.amount}</strong><span className={`status-pill ${t.status === 'Complete' ? 'complete' : 'pending'}`}>{t.status === 'Complete' ? <Check size={11} /> : <span />}{t.status === 'Complete' ? 'Complete' : 'Receipt due'}</span></div>)}
                {filteredTransactions.length === 0 && <div className="empty-state">No transactions match â€œ{query}â€.</div>}
              </div>
              <button className="text-link" onClick={() => setActive('Transactions')}>See all transactions <ArrowUpRight size={14} /></button>
            </section>
          </div>
          <footer className="page-footer"><span>Made for better money decisions.</span><span><ShieldCheck size={13} /> Your workspace is private</span><span>Demo data Â· Â© 2026 Money</span></footer>
        </section>
      </main>

      {modal && <div className="modal-backdrop" onClick={() => setModal(false)}><div className="modal-card" onClick={e => e.stopPropagation()}><div className="modal-heading"><div><span className="modal-icon"><CreditCard size={18} /></span><h2>Create a company card</h2><p>Set up a new card for a team or budget.</p></div><button className="icon-button" onClick={() => setModal(false)} aria-label="Close"><X size={18} /></button></div><label className="field-label">Card name<input autoFocus value={newCardName} onChange={e => setNewCardName(e.target.value)} placeholder="e.g. Product team" onKeyDown={e => e.key === 'Enter' && addCard()} /></label><div className="modal-note"><Sparkles size={15} /> This is a frontend demo. No real card will be issued.</div><div className="modal-actions"><button className="secondary-button" onClick={() => setModal(false)}>Cancel</button><button className="primary-button" onClick={addCard}><Plus size={15} /> Create card</button></div></div></div>}
    </div>
  )
}

export default App
