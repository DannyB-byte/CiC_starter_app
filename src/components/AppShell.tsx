import type { ReactNode } from 'react';
import { BrandLogo, StatusIndicator } from './ui';
import { Activity, BookOpen, House, LockKeyhole, WifiOff } from 'lucide-react';
import type { Page } from '../navigation';

const navigation = [{ label: 'Home', href: '#home', page: 'home', icon: House }, { label: 'Diary', href: '#diary', page: 'diary', icon: BookOpen }, { label: 'Tracking', href: '#tracking', page: 'tracking', icon: Activity }] as const;
function Navigation({ mobile = false, page }: { mobile?: boolean; page: Page }) {
  return <nav className={mobile ? 'cic-mobile-nav' : 'cic-sidebar-nav'} aria-label={mobile ? 'Mobile navigation' : 'Main navigation'}>
    {navigation.map(({ label, href, page: target, icon: Icon }) => <a key={href} href={href} aria-current={page === target ? 'page' : undefined}><Icon size={20} aria-hidden="true"/><span>{label}</span></a>)}
  </nav>;
}
type Props = { children: ReactNode; page: Page; online: boolean; offlineReady: boolean; offlineError: string };
export default function AppShell({ children, page, online, offlineReady, offlineError }: Props) {
  return <div className="diary-app cic-shell">
    <a className="cic-skip" href="#main-content" onClick={event => { event.preventDefault(); document.getElementById('main-content')?.focus(); }}>Skip to content</a>
    <aside className="cic-sidebar"><a href="#home" aria-label="Chemo in Comfort home"><BrandLogo className="cic-header-logo" /></a><Navigation page={page}/></aside>
    <div className="cic-workspace"><header className="diary-header">
      <a className="diary-brand cic-mobile-brand" href="#home" aria-label="Chemo in Comfort home"><BrandLogo className="cic-header-logo" /></a>
      <StatusIndicator className={`connection-status ${online && !offlineError ? '' : 'offline'}`} title={offlineError}>
        {online ? <LockKeyhole size={15}/> : <WifiOff size={15}/>}
        <span>{online ? offlineError ? 'Offline setup unavailable' : offlineReady ? 'Private and ready offline' : 'Setting up offline diary…' : 'Offline · your diary is here'}</span>
      </StatusIndicator></header><main id="main-content" tabIndex={-1}>{children}</main></div>
    <Navigation mobile page={page}/>
  </div>;
}
