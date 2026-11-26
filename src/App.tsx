import { FormEvent, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, ChevronDown, LockKeyhole, Pencil, Plus, Thermometer, Trash2, WifiOff, X } from 'lucide-react';

type Reading = {
  id: string;
  date: string;
  recordedAt: string;
  temperature: number;
  note: string;
};

type ReadingDraft = Pick<Reading, 'date' | 'temperature' | 'note'>;

const STORAGE_KEY = 'chemo-in-comfort.readings.v1';

function todayString() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function createId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    .format(new Date(`${date}T12:00:00`));
}

function formatTime(date: string) {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(date));
}

function isReadingList(value: unknown): value is Reading[] {
  return Array.isArray(value) && value.every((item) =>
    typeof item === 'object' && item !== null &&
    typeof item.id === 'string' &&
    typeof item.date === 'string' &&
    typeof item.recordedAt === 'string' &&
    typeof item.temperature === 'number' &&
    typeof item.note === 'string'
  );
}

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
  const [storageError, setStorageError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ReadingDraft>({ date: todayString(), temperature: 36.8, note: '' });
  const [message, setMessage] = useState('');
  const [online, setOnline] = useState(navigator.onLine);
  const [offlineReady, setOfflineReady] = useState(false);
  const [offlineError, setOfflineError] = useState('');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (!isReadingList(parsed)) {
          throw new Error('Saved readings have an unexpected format.');
        }
        setReadings(parsed);
      }
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

    const updateConnection = () => setOnline(navigator.onLine);
    window.addEventListener('online', updateConnection);
    window.addEventListener('offline', updateConnection);
    return () => {
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

  function persist(next: Reading[], successMessage: string) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setReadings(next);
      setMessage(successMessage);
      setStorageError('');
      return true;
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : 'Your reading could not be saved on this device.');
      return false;
    }
  }

  function submitReading(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!loaded || storageError) return;

    const existing = readings.find((reading) => reading.id === editingId);
    const reading: Reading = {
      id: existing?.id ?? createId(),
      ...draft,
      recordedAt: new Date().toISOString(),
    };
    const next = existing
      ? readings.map((item) => item.id === editingId ? reading : item)
      : [...readings, reading];

    if (!persist(next, existing ? 'Reading updated on this device.' : 'Reading saved on this device.')) return;
    setEditingId(null);
    setDraft({ date: todayString(), temperature: 36.8, note: '' });
  }

  function editReading(reading: Reading) {
    setEditingId(reading.id);
    setDraft({ date: reading.date, temperature: reading.temperature, note: reading.note });
    setMessage('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function deleteReading(id: string) {
    if (!persist(readings.filter((reading) => reading.id !== id), 'Reading deleted from this device.')) return;
    if (editingId === id) {
      setEditingId(null);
      setDraft({ date: todayString(), temperature: 36.8, note: '' });
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft({ date: todayString(), temperature: 36.8, note: '' });
    setMessage('');
  }

  return (
    <main className="diary-app">
      <header className="diary-header">
        <a className="diary-brand" href="/" aria-label="Chemo in Comfort home">
          <img className="cic-header-logo" src="/brand/cic-logo.svg" alt="" />
          
        </a>
        <div className={`connection-status ${online && !offlineError ? '' : 'offline'}`} role="status" title={offlineError}>
          {online ? <LockKeyhole size={15} /> : <WifiOff size={15} />}
          <span>{online ? offlineError ? 'Offline setup unavailable' : offlineReady ? 'Private and ready offline' : 'Setting up offline diary…' : 'Offline · your diary is here'}</span>
        </div>
      </header>

      <div className="diary-content">
        <section className="diary-intro">
          <span className="diary-eyebrow"><span /> YOUR PERSONAL DIARY</span>
          <h1>One moment at a time.</h1>
          <p>Keep a simple temperature reading or note for yourself. Nothing is shared unless you choose.</p>
        </section>

        <section className="reading-form-card" aria-labelledby="form-title">
          <div className="diary-section-heading">
            <div className="form-icon"><Thermometer size={19} /></div>
            <div><span className="diary-eyebrow">{editingId ? 'MAKE A CORRECTION' : 'A QUICK READING'}</span><h2 id="form-title">{editingId ? 'Edit this reading' : 'Add a temperature'}</h2></div>
          </div>

          <form onSubmit={submitReading}>
            <div className="reading-fields">
              <label>
                <span>Temperature</span>
                <div className="temperature-input">
                  <input
                    aria-label="Temperature in degrees Celsius"
                    type="number"
                    inputMode="decimal"
                    min="30"
                    max="45"
                    step="0.1"
                    required
                    value={draft.temperature}
                    onChange={(event) => setDraft({ ...draft, temperature: Number(event.target.value) })}
                  />
                  <span>°C</span>
                </div>
              </label>
              <label>
                <span>Date</span>
                <div className="date-input">
                  <CalendarDays size={16} />
                  <input
                    aria-label="Reading date"
                    type="date"
                    required
                    value={draft.date}
                    onChange={(event) => setDraft({ ...draft, date: event.target.value })}
                  />
                  <ChevronDown size={15} />
                </div>
              </label>
            </div>
            <label className="note-field">
              <span>A note, if you like <small>OPTIONAL</small></span>
              <textarea
                aria-label="Optional note"
                rows={2}
                maxLength={500}
                placeholder="Anything you want to remember…"
                value={draft.note}
                onChange={(event) => setDraft({ ...draft, note: event.target.value })}
              />
            </label>
            {storageError && <p className="diary-error" role="alert">Your diary could not be opened or saved: {storageError} Please check your browser storage settings; your existing data has not been replaced.</p>}
            {message && <p className="diary-success" role="status"><Check size={15} /> {message}</p>}
            <div className="form-actions">
              {editingId && <button className="button secondary" type="button" onClick={cancelEdit}><X size={15} /> Cancel</button>}
              <button className="button primary save-reading" type="submit" disabled={!loaded || Boolean(storageError)}>
                {editingId ? <Check size={16} /> : <Plus size={16} />}
                {editingId ? 'Save correction' : 'Save reading'}
              </button>
            </div>
          </form>
        </section>

        <section className="readings-section" aria-labelledby="readings-title">
          <div className="readings-heading">
            <div><span className="diary-eyebrow">YOUR NOTES, YOURS ALONE</span><h2 id="readings-title">Past readings</h2></div>
            <span className="reading-count">{readings.length} {readings.length === 1 ? 'reading' : 'readings'}</span>
          </div>

          {!loaded && !storageError && <p className="empty-readings">Opening your diary…</p>}
          {loaded && groupedReadings.length === 0 && (
            <div className="empty-readings">
              <img className="cic-empty-logo" src="/brand/cic-monogram.svg" alt="" />
              <strong>Your diary is ready when you are.</strong>
              <p>Your readings are saved only on this device.</p>
            </div>
          )}
          {groupedReadings.map(([date, items]) => (
            <section className="reading-day" key={date} aria-label={formatDate(date)}>
              <h3>{formatDate(date)}</h3>
              {items.map((reading) => (
                <article className="reading-item" key={reading.id}>
                  <div className="reading-value"><Thermometer size={17} /><strong>{reading.temperature.toFixed(1)}°</strong><span>C</span></div>
                  <div className="reading-details">
                    <span className="reading-time">{formatTime(reading.recordedAt)}</span>
                    {reading.note && <p>{reading.note}</p>}
                  </div>
                  <div className="reading-actions">
                    <button className="reading-action" type="button" aria-label={`Edit reading ${reading.temperature.toFixed(1)} degrees`} onClick={() => editReading(reading)}><Pencil size={16} /></button>
                    <button className="reading-action delete-action" type="button" aria-label={`Delete reading ${reading.temperature.toFixed(1)} degrees`} onClick={() => deleteReading(reading.id)}><Trash2 size={16} /></button>
                  </div>
                </article>
              ))}
            </section>
          ))}
        </section>

        <footer className="diary-footer"><LockKeyhole size={14} /><span>Your diary stays on this device. Choose what to share at your appointment.</span></footer>
      </div>
    </main>
  );
}

export default App;
