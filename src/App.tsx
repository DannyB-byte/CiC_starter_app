import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, Check, ChevronDown, LockKeyhole, Pencil, Plus, Thermometer, Trash2, X } from 'lucide-react';

import AppShell from './components/AppShell';
import { Alert, Badge, Button, Card, EmptyState, FormField, PageHeader } from './components/ui';

import { STORAGE_KEY, displayTemperature, formatDate, formatTime, parseTemperature, todayString } from './domain/readings';
import type { Reading, ReadingDraft } from './domain/readings';
import { loadReadings, mutateReadings } from './domain/readingRepository';

function cacheLoadedAssets(worker: ServiceWorker) {
  const origin = window.location.origin;
  const urls = [...new Set(
    performance.getEntriesByType('resource')
      .map((entry) => entry.name)
      .filter((url) => new URL(url).origin === origin)
  )];

  return new Promise<void>((resolve, reject) => {
    const channel = new MessageChannel();
    const timeout = window.setTimeout(() => reject(new Error('Offline setup timed out.')), 10000);
    channel.port1.onmessage = (event: MessageEvent<{ type?: string; message?: string }>) => {
      window.clearTimeout(timeout);
      if (event.data.type === 'CACHE_READY') {
        resolve();
      } else {
        reject(new Error(event.data.message ?? 'The app files could not be cached.'));
      }
      channel.port1.close();
    };
    worker.postMessage({ type: 'CACHE_URLS', urls }, [channel.port2]);
  });
}

function App() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loaded, setLoaded] = useState(false);
  const busy = useRef(false);
  const [saving, setSaving] = useState(false);
  const editBase = useRef<Reading | null>(null);
  const [storageError, setStorageError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ReadingDraft>({ date: todayString(), temperature: '36.8', note: '' });
  const [message, setMessage] = useState('');
  const [online, setOnline] = useState(navigator.onLine);
  const [offlineReady, setOfflineReady] = useState(false);
  const [offlineError, setOfflineError] = useState('');

  useEffect(() => {
    try {
      const snapshot = loadReadings(window.localStorage);
      setReadings(snapshot.readings);
      setLoaded(true);
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : 'Your saved readings could not be opened.');
    }

    if ('serviceWorker' in navigator) {
      void (async () => {
        await navigator.serviceWorker.register('/sw.js');
        const registration = await navigator.serviceWorker.ready;
        if (!registration.active) throw new Error('The offline worker did not become active.');
        await cacheLoadedAssets(registration.active);
        setOfflineReady(true);
      })().catch((error: unknown) => {
        const reason = error instanceof Error ? error.message : 'Unknown service worker error.';
        setOfflineError(reason);
        console.error('Offline support could not be installed.', error);
      });
    } else {
      setOfflineError('This browser does not support offline storage.');
    }

    const sync = () => {
      try {
        setReadings(loadReadings(window.localStorage).readings);
        setLoaded(true);
      } catch (error) {
        setStorageError(error instanceof Error ? error.message : 'Storage unavailable.');
        setLoaded(false);
      }
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) sync();
    };
    window.addEventListener('storage', onStorage);
    const updateConnection = () => setOnline(navigator.onLine);
    window.addEventListener('online', updateConnection);
    window.addEventListener('offline', updateConnection);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('online', updateConnection);
      window.removeEventListener('offline', updateConnection);
    };
  }, []);

  const groupedReadings = useMemo(() => {
    const groups = new Map<string, Reading[]>();
    for (const reading of [...readings].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))) {
      groups.set(reading.date, [...(groups.get(reading.date) ?? []), reading]);
    }
    return [...groups.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [readings]);

  async function persist(change: Parameters<typeof mutateReadings>[1], successMessage: string) {
    if (!loaded || busy.current) return false;
    busy.current = true;
    setSaving(true);
    try {
      const snapshot = await mutateReadings(window.localStorage, change);
      setReadings(snapshot.readings);
      setMessage(successMessage);
      setStorageError('');
      return true;
    } catch (error) {
      setMessage('');
      setStorageError(error instanceof Error ? error.message : 'Your reading could not be saved on this device.');
      return false;
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  async function submitReading(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!loaded || busy.current) return;
    const temperature = parseTemperature(draft.temperature);
    if (temperature === null) return;
    const values = { ...draft, temperature };
    const base = editBase.current;
    if (!await persist(base ? { kind: 'edit', base, values } : { kind: 'create', values }, base ? 'Reading updated on this device.' : 'Reading saved on this device.')) return;
    cancelEdit(false);
  }

  function editReading(reading: Reading) {
    if (busy.current) return;
    editBase.current = reading;
    setEditingId(reading.id);
    setDraft({ date: reading.date, temperature: String(reading.temperature), note: reading.note });
    setMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deleteReading(reading: Reading) {
    if (!await persist({ kind: 'delete', base: reading }, 'Reading deleted from this device.')) return;
    if (editingId === reading.id) cancelEdit(false);
  }

  function cancelEdit(clearMessage = true) {
    editBase.current = null;
    setEditingId(null);
    setDraft({ date: todayString(), temperature: '36.8', note: '' });
    if (clearMessage) setMessage('');
  }

  return (
    <AppShell online={online} offlineReady={offlineReady} offlineError={offlineError}>
      <div className="diary-content">
        <PageHeader eyebrow="YOUR PERSONAL DIARY" title="One moment at a time.">
          <p>Keep a simple temperature reading or note for yourself. Nothing is shared unless you choose.</p>
        </PageHeader>

        <Card className="reading-form-card" aria-labelledby="form-title">
          <div className="diary-section-heading">
            <div className="form-icon"><Thermometer size={19} /></div>
            <div><span className="diary-eyebrow">{editingId ? 'MAKE A CORRECTION' : 'A QUICK READING'}</span><h2 id="form-title">{editingId ? 'Edit this reading' : 'Add a temperature'}</h2></div>
          </div>

          <form onSubmit={submitReading}>
            <div className="reading-fields">
              <FormField label="Temperature">
                <div className="temperature-input">
                  <input
                    aria-label="Temperature in degrees Celsius"
                    type="number"
                    inputMode="decimal"
                    step="any"
                    disabled={saving}
                    required
                    value={draft.temperature}
                    onChange={(event) => setDraft({ ...draft, temperature: event.target.value })}
                  />
                  <span>°C</span>
                </div>
              </FormField>
              <FormField label="Date">
                <div className="date-input">
                  <CalendarDays size={16} />
                  <input
                    aria-label="Reading date"
                    type="date"
                    disabled={saving}
                    required
                    value={draft.date}
                    onChange={(event) => setDraft({ ...draft, date: event.target.value })}
                  />
                  <ChevronDown size={15} />
                </div>
              </FormField>
            </div>
            <FormField className="note-field" label={<>A note, if you like <small>OPTIONAL</small></>}>
              <textarea
                aria-label="Optional note"
                disabled={saving}
                rows={2}
                maxLength={500}
                placeholder="Anything you want to remember…"
                value={draft.note}
                onChange={(event) => setDraft({ ...draft, note: event.target.value })}
              />
            </FormField>
            {storageError && <Alert tone="error">Your diary could not be opened or saved: {storageError} Please check your browser storage settings; your existing data has not been replaced.</Alert>}
            {message && <Alert tone="success"><Check size={15} /> {message}</Alert>}
            <div className="form-actions">
              {editingId && <Button variant="secondary" type="button" onClick={() => cancelEdit()} disabled={saving}><X size={15} /> Cancel</Button>}
              <Button className="save-reading" type="submit" disabled={!loaded || saving}>
                {editingId ? <Check size={16} /> : <Plus size={16} />}
                {editingId ? 'Save correction' : 'Save reading'}
              </Button>
            </div>
          </form>
        </Card>

        <section className="readings-section" aria-labelledby="readings-title">
          <div className="readings-heading">
            <div><span className="diary-eyebrow">YOUR NOTES, YOURS ALONE</span><h2 id="readings-title">Past readings</h2></div>
            <Badge>{readings.length} {readings.length === 1 ? 'reading' : 'readings'}</Badge>
          </div>

          {!loaded && !storageError && <p className="empty-readings">Opening your diary…</p>}
          {loaded && groupedReadings.length === 0 && (
            <EmptyState title="Your diary is ready when you are.">
              <p>Your readings are saved only on this device.</p>
            </EmptyState>
          )}
          {groupedReadings.map(([date, items]) => (
            <section className="reading-day" key={date} aria-label={formatDate(date)}>
              <h3>{formatDate(date)}</h3>
              {items.map((reading) => (
                <article className="reading-item" key={reading.id}>
                  <div className="reading-value"><Thermometer size={17} /><strong>{displayTemperature(reading.temperature)}°</strong><span>C</span></div>
                  <div className="reading-details">
                    <span className="reading-time">{formatTime(reading.recordedAt)}</span>
                    {reading.note && <p>{reading.note}</p>}
                  </div>
                  <div className="reading-actions">
                    <button className="reading-action" type="button" aria-label={`Edit reading ${displayTemperature(reading.temperature)} degrees`} disabled={saving} onClick={() => editReading(reading)}><Pencil size={16} /></button>
                    <button className="reading-action delete-action" type="button" aria-label={`Delete reading ${displayTemperature(reading.temperature)} degrees`} disabled={saving} onClick={() => deleteReading(reading)}><Trash2 size={16} /></button>
                  </div>
                </article>
              ))}
            </section>
          ))}
        </section>

        <footer className="diary-footer"><LockKeyhole size={14} /><span>Your diary stays on this device. Choose what to share at your appointment.</span></footer>
      </div>
    </AppShell>
  );
}

export default App;
