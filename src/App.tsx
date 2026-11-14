import { useState } from 'react';
import { BrowserRouter, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  Activity, ArrowUpRight, Bell, CalendarDays, Check, ChevronRight, CircleHelp, ClipboardList, Clock3,
  FileText, Heart, Home, Leaf, LockKeyhole, Menu, MessageCircle, MoreHorizontal, Pill, Plus, Settings,
  ShieldCheck, Sparkles, Stethoscope, Sun, UserRound, UsersRound, Wind, X, Zap
} from 'lucide-react';

type IconType = typeof Home;

const navGroups = [
  { label: 'Overview', items: [{ label: 'Dashboard', path: '/', icon: Home }, { label: 'Daily Check-In', path: '/check-in', icon: Sun }, { label: 'Symptoms', path: '/symptoms', icon: Activity }, { label: 'Wellbeing', path: '/wellbeing', icon: Heart }, { label: 'Insights', path: '/insights', icon: Sparkles }] },
  { label: 'Your care', items: [{ label: 'Treatment Journey', path: '/journey', icon: ClipboardList }, { label: 'Medications', path: '/medications', icon: Pill }, { label: 'Appointments', path: '/appointments', icon: CalendarDays }, { label: 'Care Team', path: '/care-team', icon: UsersRound }, { label: 'Reports', path: '/reports', icon: FileText }] },
];

const trendData = [
  { day: 'Jun 03', score: 62, symptom: 5 }, { day: 'Jun 07', score: 68, symptom: 4 }, { day: 'Jun 11', score: 64, symptom: 6 },
  { day: 'Jun 15', score: 74, symptom: 3 }, { day: 'Jun 19', score: 71, symptom: 4 }, { day: 'Jun 23', score: 82, symptom: 2 }, { day: 'Jun 27', score: 86, symptom: 2 },
];

const symptoms = [
  { label: 'Fatigue', value: 'Mild', score: 3, color: 'gold' }, { label: 'Nausea', value: 'None', score: 1, color: 'sage' },
  { label: 'Appetite', value: 'Good', score: 1, color: 'sage' }, { label: 'Sleep', value: '7h 20m', score: 2, color: 'blue' },
];

function App() {
  return <BrowserRouter><AppShell /></BrowserRouter>;
}

function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const page = pageMeta(location.pathname);
  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="brand"><div className="brand-mark"><Leaf size={17} /></div><div><span className="brand-name">CHEMO<br />IN COMFORT</span><span className="brand-tag">Dignity through treatment.</span></div></div>
        <div className="sidebar-label">Your space</div>
        <nav>{navGroups.map(group => <div className="nav-group" key={group.label}><div className="nav-group-title">{group.label}</div>{group.items.map(item => <NavItem key={item.path} {...item} onClick={() => setMenuOpen(false)} />)}</div>)}</nav>
        <div className="sidebar-bottom"><NavItem label="Profile" path="/profile" icon={UserRound} onClick={() => setMenuOpen(false)} /><NavItem label="Settings" path="/settings" icon={Settings} onClick={() => setMenuOpen(false)} /><div className="privacy-note"><LockKeyhole size={14} /><span>Your information stays<br />private and secure.</span></div></div>
      </aside>
      {menuOpen && <button className="sidebar-backdrop" aria-label="Close menu" onClick={() => setMenuOpen(false)} />}
      <main className="main-content">
        <header className="topbar"><button className="mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={21} /></button><div className="breadcrumb"><span>My care</span><ChevronRight size={14} /><strong>{page.title}</strong></div><div className="topbar-actions"><button className="icon-btn"><Bell size={18} /><i /></button><div className="avatar">AM</div></div></header>
        <div className="page-wrap"><Routes><Route path="/" element={<Dashboard />} /><Route path="/check-in" element={<CheckIn />} /><Route path="/insights" element={<Insights />} /><Route path="/journey" element={<Journey />} />{['symptoms','wellbeing','medications','appointments','care-team','reports','profile','settings'].map(path => <Route key={path} path={`/${path}`} element={<GenericPage type={path} />} />)}</Routes></div>
      </main>
      <nav className="mobile-nav">{[{ label: 'Today', path: '/', icon: Home }, { label: 'Check-in', path: '/check-in', icon: Sun }, { label: 'Journey', path: '/journey', icon: ClipboardList }, { label: 'Insights', path: '/insights', icon: Sparkles }, { label: 'More', path: '/settings', icon: MoreHorizontal }].map(item => <NavItem key={item.path} {...item} />)}</nav>
    </div>
  );
}

function NavItem({ label, path, icon: Icon, onClick }: { label: string; path: string; icon: IconType; onClick?: () => void }) {
  return <NavLink to={path} end={path === '/'} onClick={onClick} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}><Icon size={17} strokeWidth={1.7} /><span>{label}</span>{label === 'Insights' && <span className="new-dot" />}</NavLink>;
}

function pageMeta(path: string) { const found = navGroups.flatMap(g => g.items).find(item => item.path === path); const extras: Record<string, string> = { '/profile': 'Profile', '/settings': 'Settings' }; return { title: found?.label ?? extras[path] ?? 'Dashboard' }; }

function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: React.ReactNode }) { return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>; }
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) { return <section className={`card ${className}`}>{children}</section>; }
function CardHead({ title, action }: { title: string; action?: string }) { return <div className="card-head"><h3>{title}</h3>{action && <button className="text-link">{action}<ArrowUpRight size={14} /></button>}</div>; }
function PillLabel({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: string }) { return <span className={`pill ${tone}`}>{children}</span>; }
function Progress({ value, tone = 'gold' }: { value: number; tone?: string }) { return <div className="progress"><div className={`progress-fill ${tone}`} style={{ width: `${value}%` }} /></div>; }

function Dashboard() {
  return <>
    <PageHeading eyebrow="Wednesday, June 28, 2026" title="Good morning, Amelia." description="A gentle check-in with yourself can make all the difference." action={<button className="button primary" onClick={() => location.href = '/check-in'}><Sun size={16} /> Begin today’s check-in</button>} />
    <div className="dashboard-grid">
      <Card className="wellbeing-card"><div className="card-kicker"><span className="status-dot" /> TODAY'S WELLBEING</div><div className="wellbeing-main"><div className="score-ring"><div><strong>82</strong><span>out of 100</span></div></div><div><h2>A steady day</h2><p>Your energy and mood are looking balanced. Keep listening to what your body needs.</p><button className="text-link">View your wellbeing <ArrowUpRight size={14} /></button></div></div><div className="mini-stat-row"><MiniStat label="Mood" value="Good" icon={Heart} /><MiniStat label="Energy" value="Steady" icon={Zap} /><MiniStat label="Rest" value="7h 20m" icon={Wind} /></div></Card>
      <Card className="appointment-card"><CardHead title="Next appointment" action="View calendar" /><div className="appointment-date"><div className="date-block"><span>JUN</span><strong>30</strong></div><div><PillLabel tone="soft">In 2 days</PillLabel><h3>Oncology follow-up</h3><p><Clock3 size={14} /> 10:30 AM · Dr. Sarah Chen</p></div></div><div className="appointment-location"><span><Stethoscope size={15} /> St. Mary's Cancer Centre</span><button className="circle-action"><ChevronRight size={16} /></button></div></Card>
      <Card className="cycle-card"><CardHead title="Your treatment journey" action="See full journey" /><div className="cycle-overview"><div><span className="muted-label">CURRENT CYCLE</span><h2>Cycle 3 <span>of 6</span></h2></div><div className="cycle-percent">50%</div></div><Progress value={50} /><div className="cycle-meta"><span>Started Jun 12</span><span>Next treatment Jul 03</span></div><div className="cycle-callout"><span className="callout-icon"><Check size={15} /></span><div><strong>Halfway there</strong><span>You've completed 2 of 6 treatments in this cycle.</span></div></div></Card>
      <Card className="symptom-card"><CardHead title="Symptom snapshot" action="Log symptoms" /><div className="symptom-list">{symptoms.map(item => <div className="symptom-row" key={item.label}><span className={`symptom-icon ${item.color}`}>{item.label === 'Fatigue' ? <Activity size={15} /> : item.label === 'Nausea' ? <Wind size={15} /> : item.label === 'Appetite' ? <Leaf size={15} /> : <Clock3 size={15} />}</span><span className="symptom-name">{item.label}</span><span className="symptom-value">{item.value}</span><ChevronRight size={14} className="muted-icon" /></div>)}</div><div className="last-updated">Last updated today, 9:42 AM</div></Card>
      <Card className="medication-card"><CardHead title="Medication reminder" action="View medications" /><div className="medication-main"><div className="med-icon"><Pill size={19} /></div><div><h3>Ondansetron</h3><p>Take 1 tablet with food</p><span className="med-time"><Clock3 size={13} /> Due at 8:00 PM</span></div><button className="circle-action"><Check size={16} /></button></div><div className="medication-progress"><Progress value={66} tone="sage" /><span>2 of 3 taken today</span></div></Card>
      <Card className="quote-card"><div className="quote-mark">“</div><blockquote>There is always a way through. One gentle step at a time.</blockquote><div className="quote-footer"><span>— Your care companion</span><button className="circle-action"><Heart size={15} /></button></div></Card>
    </div>
  </>;
}

function MiniStat({ label, value, icon: Icon }: { label: string; value: string; icon: IconType }) { return <div className="mini-stat"><Icon size={15} /><span>{label}</span><strong>{value}</strong></div>; }

function CheckIn() {
  const [selected, setSelected] = useState('Good');
  const [submitted, setSubmitted] = useState(false);
  return <><PageHeading eyebrow="A moment for yourself" title="How are you feeling today?" description="There are no right or wrong answers. Just check in with what feels true." /><div className="checkin-layout"><Card className="checkin-main"><div className="step-head"><span>STEP 01 / 03</span><span>About 2 min</span></div><Progress value={33} /><div className="question"><span className="question-number">01</span><h2>How would you describe your overall wellbeing?</h2><p>Choose the feeling that is closest to where you are right now.</p><div className="mood-options">{['Great', 'Good', 'Okay', 'Not great', 'Struggling'].map(mood => <button key={mood} className={selected === mood ? 'selected' : ''} onClick={() => setSelected(mood)}><span className="mood-face">{mood === 'Great' ? '◡' : mood === 'Good' ? '◠' : mood === 'Okay' ? '—' : mood === 'Not great' ? '⌢' : '⌣'}</span>{mood}</button>)}</div></div><div className="checkin-footer"><span><LockKeyhole size={14} /> Only you and your care team can see this.</span><button className="button primary" onClick={() => setSubmitted(true)}>{submitted ? 'Saved for today' : 'Continue'}<ChevronRight size={16} /></button></div></Card><div className="checkin-aside"><div className="aside-symbol"><Sun size={22} /></div><h3>A small pause can tell you a lot.</h3><p>Regular check-ins help you notice patterns over time, and give your care team a fuller picture of how you're doing.</p><div className="checkin-stat"><strong>12</strong><span>check-ins this month</span></div></div></div></>;
}

function Insights() {
  return <><PageHeading eyebrow="Your bigger picture" title="Insights" description="Patterns from your check-ins, symptoms, and wellbeing over time." action={<button className="button secondary"><CalendarDays size={15} /> Last 30 days <ChevronRight size={14} /></button>} /><div className="insight-grid"><Card className="chart-card wide"><CardHead title="Wellbeing over time" action="See details" /><div className="chart-legend"><span><i className="legend-dot gold" /> Wellbeing score</span><span><i className="legend-dot muted" /> Symptom intensity</span></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trendData}><defs><linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#d9c5aa" stopOpacity={0.25} /><stop offset="100%" stopColor="#d9c5aa" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#262626" vertical={false} /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#817c72', fontSize: 11 }} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#817c72', fontSize: 11 }} domain={[40, 100]} /><Tooltip contentStyle={{ background: '#181817', border: '1px solid #3a3833', borderRadius: 8, color: '#f8f2e8' }} /><Area type="monotone" dataKey="score" stroke="#d9c5aa" strokeWidth={2.5} fill="url(#goldFill)" /><Line type="monotone" dataKey="symptom" stroke="#809789" strokeWidth={2} dot={false} /></AreaChart></ResponsiveContainer></div></Card><Card className="score-widget"><div className="widget-top"><span className="eyebrow">CURRENT SCORE</span><ArrowUpRight size={16} /></div><div className="big-score">82<span>/100</span></div><PillLabel tone="sage">↑ 8 points this month</PillLabel><p>Your wellbeing is trending upward. Your most consistent strength is rest.</p><div className="score-bars"><div><span>Rest</span><Progress value={86} tone="sage" /></div><div><span>Mood</span><Progress value={79} /></div><div><span>Energy</span><Progress value={72} tone="blue" /></div></div></Card><Card className="trend-card"><CardHead title="Notable trends" action="Explore" /><TrendItem icon={ArrowUpRight} title="Your energy is improving" detail="Up 14% over the last 2 weeks" tone="sage" /><TrendItem icon={Activity} title="Fatigue appears on treatment days" detail="A pattern worth discussing with your team" tone="gold" /><TrendItem icon={Heart} title="Rest is your strength" detail="You average 7h 12m of sleep" tone="blue" /></Card><Card className="observation-card"><div className="observation-icon"><Sparkles size={18} /></div><div><span className="eyebrow">A GENTLE OBSERVATION</span><h3>You're finding your rhythm.</h3><p>Your wellbeing score has improved steadily since your last treatment. Keep giving yourself the time and space to recover.</p></div></Card></div></>;
}
function TrendItem({ icon: Icon, title, detail, tone }: { icon: IconType; title: string; detail: string; tone: string }) { return <div className="trend-item"><span className={`trend-icon ${tone}`}><Icon size={15} /></span><div><strong>{title}</strong><span>{detail}</span></div><ChevronRight size={14} /></div>; }

function Journey() {
  return <><PageHeading eyebrow="Your care, in one place" title="Treatment journey" description="A calm view of where you've been, where you are, and what comes next." action={<button className="button secondary"><Plus size={16} /> Add note</button>} /><div className="journey-layout"><Card className="journey-progress"><CardHead title="Current treatment cycle" action="Cycle history" /><div className="journey-cycle-head"><div><span className="muted-label">CYCLE 3 OF 6</span><h2>Halfway there</h2><p>Jun 12 — Jul 24, 2026</p></div><div className="large-ring"><strong>50%</strong></div></div><Progress value={50} /><div className="cycle-steps"><span className="done"><Check size={13} /> 2 complete</span><span><span className="step-line" /> 2 remaining</span></div><div className="journey-note"><MessageCircle size={16} /><span><strong>Keep going, gently.</strong> Recovery days are part of the treatment too.</span></div></Card><Card className="upcoming-card"><CardHead title="Coming up" action="View calendar" /><div className="upcoming-item"><div className="upcoming-date"><span>JUL</span><strong>03</strong></div><div><PillLabel tone="soft">Treatment</PillLabel><h3>Cycle 3 · Treatment 3</h3><p><Clock3 size={14} /> 9:00 AM · Infusion suite</p></div><ChevronRight size={16} /></div><div className="upcoming-item"><div className="upcoming-date"><span>JUL</span><strong>10</strong></div><div><PillLabel tone="blue">Appointment</PillLabel><h3>Care team check-in</h3><p><Clock3 size={14} /> 2:00 PM · Video call</p></div><ChevronRight size={16} /></div></Card><Card className="timeline-card"><CardHead title="Your timeline" action="View all" /><div className="timeline"><TimelineItem date="Jun 12, 2026" title="Treatment 2 completed" detail="Cycle 3 · Infusion suite" done /><TimelineItem date="Jun 13 — 26, 2026" title="Recovery window" detail="You logged 5 check-ins" done /><TimelineItem date="Jul 03, 2026" title="Treatment 3" detail="Upcoming" current /><TimelineItem date="Jul 24, 2026" title="Cycle 3 complete" detail="Estimated" /></div></Card></div></>;
}
function TimelineItem({ date, title, detail, done, current }: { date: string; title: string; detail: string; done?: boolean; current?: boolean }) { return <div className={`timeline-item ${done ? 'done' : ''} ${current ? 'current' : ''}`}><div className="timeline-marker">{done ? <Check size={12} /> : current ? <span /> : null}</div><div><span>{date}</span><strong>{title}</strong><p>{detail}</p></div></div>; }

function GenericPage({ type }: { type: string }) {
  const config: Record<string, { eyebrow: string; title: string; desc: string; icon: IconType; items: { title: string; detail: string }[] }> = {
    symptoms: { eyebrow: 'Listen to your body', title: 'Symptoms', desc: 'Keep a simple record of how you’re feeling, day by day.', icon: Activity, items: [{ title: 'Fatigue', detail: 'Mild · Updated today' }, { title: 'Nausea', detail: 'None · Updated today' }, { title: 'Pain', detail: '2 out of 10 · Updated yesterday' }] },
    wellbeing: { eyebrow: 'Your whole self', title: 'Wellbeing', desc: 'Small moments of care add up to something meaningful.', icon: Heart, items: [{ title: 'Mood', detail: 'Good · Feeling steady' }, { title: 'Sleep', detail: '7h 20m · Restful' }, { title: 'Mindfulness', detail: '3 sessions this week' }] },
    medications: { eyebrow: 'Stay on track', title: 'Medications', desc: 'Everything you take, with simple reminders for when you need them.', icon: Pill, items: [{ title: 'Ondansetron', detail: '1 tablet · Due at 8:00 PM' }, { title: 'Dexamethasone', detail: '2 tablets · Completed today' }] },
    appointments: { eyebrow: 'Your care calendar', title: 'Appointments', desc: 'A clear view of the conversations and care ahead.', icon: CalendarDays, items: [{ title: 'Oncology follow-up', detail: 'Jun 30 · 10:30 AM · Dr. Sarah Chen' }, { title: 'Treatment 3', detail: 'Jul 03 · 9:00 AM · Infusion suite' }] },
    'care-team': { eyebrow: 'People in your corner', title: 'Care team', desc: 'Your trusted team, available when you need them.', icon: UsersRound, items: [{ title: 'Dr. Sarah Chen', detail: 'Medical oncologist' }, { title: 'Maya Rodriguez, RN', detail: 'Primary nurse' }] },
    reports: { eyebrow: 'Share what matters', title: 'Reports', desc: 'Thoughtful summaries to help you have better conversations with your care team.', icon: FileText, items: [{ title: 'June wellbeing summary', detail: 'Ready to share · Updated today' }, { title: 'Treatment cycle 2 summary', detail: 'Created Jun 02, 2026' }] },
    profile: { eyebrow: 'Your space', title: 'Profile', desc: 'Keep your personal details and preferences up to date.', icon: UserRound, items: [{ title: 'Amelia Morgan', detail: 'Patient profile' }, { title: 'Care preferences', detail: 'Your choices and communication settings' }] },
    settings: { eyebrow: 'Make it yours', title: 'Settings', desc: 'Choose how Chemo In Comfort supports you.', icon: Settings, items: [{ title: 'Notifications', detail: 'Reminders are on' }, { title: 'Privacy & security', detail: 'Your information is private' }, { title: 'Help & support', detail: 'We’re here when you need us' }] },
  };
  const c = config[type]; const Icon = c.icon;
  return <><PageHeading eyebrow={c.eyebrow} title={c.title} description={c.desc} action={<button className="button primary"><Plus size={16} /> Add new</button>} /><div className="generic-layout"><Card className="generic-list"><CardHead title={type === 'settings' ? 'Preferences' : 'Your overview'} /><div className="generic-rows">{c.items.map(item => <button className="generic-row" key={item.title}><span className="generic-row-icon"><Icon size={17} /></span><span><strong>{item.title}</strong><small>{item.detail}</small></span><ChevronRight size={16} /></button>)}</div></Card><div className="empty-note"><ShieldCheck size={22} /><h3>Designed around your comfort.</h3><p>This space is yours. Add the details that help you feel more informed and supported throughout treatment.</p></div></div></>;
}

export default App;
