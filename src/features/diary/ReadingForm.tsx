import { CalendarDays, Check, ChevronDown, Plus, Thermometer, X } from 'lucide-react';
import { Alert, Button, Card, FormField } from '../../components/ui';
import type { useDiary } from './useDiary';

type Props = Pick<ReturnType<typeof useDiary>, 'editingId' | 'submitReading' | 'saving' | 'draft' | 'setDraft' | 'storageError' | 'message' | 'cancelEdit' | 'loaded'>;

export function ReadingForm({ editingId, submitReading, saving, draft, setDraft, storageError, message, cancelEdit, loaded }: Props) {
  return (
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
  );
}
