import type { ReactNode } from 'react';
import { BrandLogo, StatusIndicator } from './ui';
import { BookOpen, LockKeyhole, WifiOff } from 'lucide-react';

const navigation = [{ label: 'Diary', href: '#diary', icon: BookOpen }] as const;

function Navigation({ mobile = false }: { mobile?: boolean }) {
  return (
    <nav className={mobile ? 'cic-mobile-nav' : 'cic-sidebar-nav'} aria-label={mobile ? 'Mobile navigation' : 'Main navigation'}>
      {navigation.map(({ label, href, icon: Icon }) => (
        <a key={href} href={href} aria-current="page"><Icon size={20} aria-hidden="true" /><span>{label}</span></a>
      ))}
    </nav>
  );
}

type Props = { children: ReactNode; online: boolean; offlineReady: boolean; offlineError: string };

export default function AppShell({ children, online, offlineReady, offlineError }: Props) {
  return (
    <div className="diary-app cic-shell">
      <a className="cic-skip" href="#diary">Skip to diary</a>
      <aside className="cic-sidebar">
        <a href="/" aria-label="Chemo in Comfort home"><BrandLogo className="cic-header-logo" /></a>
        <Navigation />
      </aside>
      <div className="cic-workspace">
        <header className="diary-header">
          <a className="diary-brand cic-mobile-brand" href="/" aria-label="Chemo in Comfort home"><BrandLogo className="cic-header-logo" /></a>
          <StatusIndicator className={`connection-status ${online && !offlineError ? '' : 'offline'}`} title={offlineError}>
          {online ? <LockKeyhole size={15} /> : <WifiOff size={15} />}
          <span>{online ? offlineError ? 'Offline setup unavailable' : offlineReady ? 'Private and ready offline' : 'Setting up offline diary…' : 'Offline · your diary is here'}</span>
        </StatusIndicator>
        </header>
        <main id="diary" tabIndex={-1}>{children}</main>
      </div>
      <Navigation mobile />
    </div>
  );
}
