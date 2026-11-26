import { Pencil, Thermometer, Trash2 } from 'lucide-react';
import { Badge, EmptyState } from '../../components/ui';
import { displayTemperature, formatDate, formatTime } from '../../domain/readings';
import type { useDiary } from './useDiary';

type Props = Pick<ReturnType<typeof useDiary>, 'readings' | 'loaded' | 'storageError' | 'groupedReadings' | 'saving' | 'editReading' | 'deleteReading'>;

export function ReadingHistory({ readings, loaded, storageError, groupedReadings, saving, editReading, deleteReading }: Props) {
  return (
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
  );
}
