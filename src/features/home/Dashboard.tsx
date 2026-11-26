import { Thermometer, ChevronRight } from 'lucide-react';
import { PageHeader, Card } from '../../components/ui';
import { todayString, formatDate } from '../../domain/readings';
import type { Reading } from '../../domain/readings';
export function Dashboard({ readings, loaded, storageError }: { readings: Reading[]; loaded: boolean; storageError: string }) {
  const today = todayString();
  const count = readings.filter(reading => reading.date === today).length;
  return <div className="diary-content">
    <PageHeader eyebrow="YOUR DAILY WELLBEING" title="Your day, your pace."><p>{formatDate(today)}</p><p>A private space to keep track of how you are feeling during treatment.</p></PageHeader>
    <Card className="cic-dashboard-card"><h2>Temperature diary</h2><p>{storageError ? 'Your diary needs attention. Open it to review the storage message.' : !loaded ? 'Opening your diary…' : `${count} ${count === 1 ? 'reading' : 'readings'} recorded today.`}</p>
      <a className="cic-dashboard-link" href="#diary"><Thermometer size={22} aria-hidden="true"/> Open temperature diary <ChevronRight size={20} aria-hidden="true"/></a>
    </Card>
    <Card className="cic-dashboard-card"><h2>Wellbeing trackers</h2><a className="cic-dashboard-link" href="#tracking">Open wellbeing trackers <ChevronRight size={20} aria-hidden="true"/></a></Card><p className="cic-dashboard-note">This diary records your observations. It does not provide medical advice or monitor your condition.</p>
  </div>;
}
