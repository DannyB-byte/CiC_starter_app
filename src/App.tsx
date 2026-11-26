import { LockKeyhole } from 'lucide-react';
import AppShell from './components/AppShell';
import { PageHeader } from './components/ui';
import { ReadingForm } from './features/diary/ReadingForm';
import { ReadingHistory } from './features/diary/ReadingHistory';
import { useDiary } from './features/diary/useDiary';
import { useOfflineStatus } from './hooks/useOfflineStatus';

function App() {
  const diary = useDiary();
  const offline = useOfflineStatus();
  return (
    <AppShell {...offline}>
      <div className="diary-content">
        <PageHeader eyebrow="YOUR PERSONAL DIARY" title="One moment at a time.">
          <p>Keep a simple temperature reading or note for yourself. Nothing is shared unless you choose.</p>
        </PageHeader>
        <ReadingForm {...diary} />
        <ReadingHistory {...diary} />
        <footer className="diary-footer"><LockKeyhole size={14} /><span>Your diary stays on this device. Choose what to share at your appointment.</span></footer>
      </div>
    </AppShell>
  );
}

export default App;
