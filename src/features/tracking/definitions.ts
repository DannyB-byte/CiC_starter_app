export type Field = { label: string; type?: 'number' | 'text'; options?: string[] };
export const trackers: {id:string; title:string; fields:Field[]}[] = [
 {id:'food',title:'Food',fields:[{label:'Meal description'}]},
 {id:'fluids',title:'Fluids',fields:[{label:'Drink type'},{label:'Volume (ml)',type:'number'}]},
 {id:'pain',title:'Pain',fields:[{label:'Location'},{label:'Severity',options:['0','1','2','3','4','5','6','7','8','9','10']}]},
 {id:'symptoms',title:'Symptoms',fields:[{label:'Symptom description'},{label:'Severity',options:['Mild','Moderate','Severe']}]},
 {id:'sleep',title:'Sleep',fields:[{label:'Duration (hours)',type:'number'},{label:'Quality',options:['Poor','Fair','Good','Very good']}]},
 {id:'activity',title:'Activity',fields:[{label:'Activity type'},{label:'Duration (minutes)',type:'number'}]},
 {id:'mood',title:'Mood',fields:[{label:'Mood',options:['Very low','Low','Neutral','Good','Very good']}]},
 {id:'bowel',title:'Bowel movements',fields:[{label:'Bristol stool type',options:['1 — Separate hard lumps','2 — Lumpy sausage','3 — Sausage with cracks','4 — Smooth and soft','5 — Soft blobs','6 — Mushy pieces','7 — Watery']}]},
 {id:'appointment',title:'Appointments',fields:[{label:'Appointment details'},{label:'Time and location'}]},
 {id:'sickness',title:'Sickness',fields:[{label:'Episodes',type:'number'},{label:'Observations'}]}
];
