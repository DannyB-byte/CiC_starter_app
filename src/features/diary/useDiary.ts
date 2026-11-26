import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { STORAGE_KEY, parseTemperature, todayString } from '../../domain/readings';
import type { Reading, ReadingDraft } from '../../domain/readings';
import { loadReadings, mutateReadings } from '../../domain/readingRepository';

export function useDiary() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loaded, setLoaded] = useState(false);
  const busy = useRef(false);
  const [saving, setSaving] = useState(false);
  const editBase = useRef<Reading | null>(null);
  const [storageError, setStorageError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ReadingDraft>({ date: todayString(), temperature: '', note: '' });
  const [message, setMessage] = useState('');
  useEffect(() => {
    try {
      const snapshot = loadReadings(window.localStorage);
      setReadings(snapshot.readings);
      setLoaded(true);
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : 'Your saved readings could not be opened.');
    }

    const sync = () => {
      try {
        setReadings(loadReadings(window.localStorage).readings);
        setLoaded(true);
        setStorageError('');
      } catch (error) {
        setStorageError(error instanceof Error ? error.message : 'Storage unavailable.');
        setLoaded(false);
      }
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) sync();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const groupedReadings = useMemo(() => {
    const groups = new Map<string, Reading[]>();
    for (const reading of [...readings].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))) {
      const group = groups.get(reading.date);
      if (group) group.push(reading);
      else groups.set(reading.date, [reading]);
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
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  async function deleteReading(reading: Reading) {
    if (!await persist({ kind: 'delete', base: reading }, 'Reading deleted from this device.')) return;
    if (editingId === reading.id) cancelEdit(false);
  }

  function cancelEdit(clearMessage = true) {
    editBase.current = null;
    setEditingId(null);
    setDraft({ date: todayString(), temperature: '', note: '' });
    if (clearMessage) setMessage('');
  }

  return { readings, groupedReadings, loaded, saving, storageError, editingId, draft, setDraft, message, submitReading, editReading, deleteReading, cancelEdit };
}
