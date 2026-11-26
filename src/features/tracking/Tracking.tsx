import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { PageHeader, Button } from '../../components/ui';
import { createId, todayString, isCalendarDate } from '../../domain/readings';
import { listEntries, saveEntry, deleteEntry } from '../../services/trackerStore';
import type { Entry } from '../../services/trackerStore';
import { trackers } from './definitions';
export function Tracking() {
 const [kind,setKind] = useState(trackers[0].id);
 const [entries,setEntries] = useState<Entry[]>([]);
 const [date,setDate] = useState(todayString);
 const [values,setValues] = useState<Record<string,string>>({});
 const [editing,setEditing] = useState<string|null>(null);
 const [error,setError] = useState('');
 const [ready,setReady] = useState(false);
 const [busy,setBusy] = useState(false);
 const [pendingDelete,setPendingDelete] = useState<string|null>(null);
 const tracker = trackers.find(t=>t.id===kind)!;
 useEffect(()=>{ let active=true; listEntries().then(rows=>{if(active){setEntries(rows);setReady(true);}}).catch(()=>{if(active)setError('Unable to open local records. Reload to retry.');}); return ()=>{active=false;}; },[]);
 function reset(){setEditing(null);setValues({});setDate(todayString());setPendingDelete(null);}
 async function submit(event:FormEvent){event.preventDefault(); if(!isCalendarDate(date)) {setError('Enter a valid date.');return;} setBusy(true);setError('');try {await saveEntry({id:editing??createId(),kind,date,values});setEntries(await listEntries());reset();}catch{setError('Unable to save or refresh records. Reload before retrying.');}finally{setBusy(false);}}
 async function remove(id:string){setBusy(true);setError('');try{await deleteEntry(id);setEntries(await listEntries());reset();}catch{setError('Unable to delete or refresh records. Reload before retrying.');}finally{setBusy(false);}}
 return <div className="diary-content tracking"><PageHeader eyebrow="YOUR PERSONAL DIARY" title="Track your wellbeing"><p>Record your own observations. These records stay in this browser.</p></PageHeader>
 <form className="reading-form-card" onSubmit={submit}><label>Tracker<select value={kind} disabled={busy} onChange={e=>{setKind(e.target.value);reset();}}>{trackers.map(t=><option key={t.id} value={t.id}>{t.title}</option>)}</select></label>
 <h2>{editing?'Edit entry':`Record ${tracker.title.toLowerCase()}`}</h2><label>Date<input type="date" required value={date} onChange={e=>setDate(e.target.value)}/></label>
 {tracker.fields.map(field=><label key={field.label}>{field.label}{field.options?<select required value={values[field.label]??''} onChange={e=>setValues(v=>({...v,[field.label]:e.target.value}))}><option value="">Choose…</option>{field.options.map(o=><option key={o}>{o}</option>)}</select>:<input required type={field.type??'text'} min={field.type==='number'?0:undefined} step={field.type==='number'?'any':undefined} value={values[field.label]??''} onChange={e=>setValues(v=>({...v,[field.label]:e.target.value}))}/>}</label>)}
 <label>Notes (optional)<textarea value={values.Notes??''} onChange={e=>setValues(v=>({...v,Notes:e.target.value}))}/></label><div className="form-actions">{editing&&<Button variant="secondary" onClick={reset} disabled={busy}>Cancel</Button>}<Button type="submit" disabled={!ready||busy}>Save entry</Button></div></form>
 {error&&<p role="alert" className="diary-error">{error}</p>}
 <section className="readings-section"><h2>{tracker.title} history</h2>{entries.filter(e=>e.kind===kind).sort((a,b)=>b.date.localeCompare(a.date)).map(entry=><article className="reading-form-card" key={entry.id}><h3>{entry.date}</h3>{Object.entries(entry.values).map(([key,value])=><p key={key}>{key}: {value}</p>)}<div className="form-actions"><Button variant="secondary" disabled={busy} onClick={()=>{setEditing(entry.id);setDate(entry.date);setValues(entry.values);setPendingDelete(null);}}>Edit entry</Button><Button variant="secondary" disabled={busy} onClick={()=>setPendingDelete(entry.id)}>Delete entry</Button></div>{pendingDelete===entry.id&&<div><p>Delete this entry permanently?</p><Button disabled={busy} onClick={()=>void remove(entry.id)}>Confirm deletion</Button> <Button variant="secondary" onClick={()=>setPendingDelete(null)}>Cancel deletion</Button></div>}</article>)}</section></div>;
}
