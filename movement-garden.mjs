// Movement Garden: editable, beginner-friendly strength template.
// No user body measurements, photographs, diagnoses or private goals in public source.
export const movementDays=[
 {day:1,name:'Glutes & legs A',kind:'strength',minutes:35,exercises:[['Chair squat','2 × 8–12'],['Glute bridge','3 × 10–15'],['Dumbbell Romanian deadlift','2 × 8–12'],['Supported reverse lunge','2 × 6–10/side'],['Standing calf raise','2 × 12–15']]},
 {day:2,name:'Walk + mobility',kind:'recovery',minutes:25,exercises:[['Comfortable walk','15–20 min'],['Hip circles and gentle stretching','5 min']]},
 {day:3,name:'Upper body & core',kind:'strength',minutes:35,exercises:[['Dumbbell row','2 × 8–12/side'],['Wall or incline push-up','2 × 6–12'],['Seated dumbbell shoulder press','2 × 8–10'],['Bird dog','2 × 6/side'],['Dead bug or heel taps','2 × 6–10/side']]},
 {day:4,name:'Recovery & stretch',kind:'recovery',minutes:20,exercises:[['Easy walk or gentle dance','10–15 min'],['Mobility flow','5 min']]},
 {day:5,name:'Glutes & legs B',kind:'strength',minutes:35,exercises:[['Step-up on stable low step','2 × 8/side'],['Dumbbell Romanian deadlift','3 × 8–12'],['Glute bridge with pause','3 × 10–12'],['Side-lying hip abduction','2 × 12/side'],['Suitcase carry','2 × 30 sec/side']]},
 {day:6,name:'Joyful movement',kind:'optional',minutes:30,exercises:[['Walk, dance, Pilates or a class','20–30 min, comfortable pace']]},
 {day:0,name:'Rest & reset',kind:'rest',minutes:0,exercises:[['Rest day','Optional easy stretch']]}
];
export function movementForDate(date){const d=new Date(date+'T12:00:00');if(Number.isNaN(d.getTime()))throw Error('Invalid workout date');return movementDays.find(x=>x.day===d.getDay());}
export function progressionNote(completed,effort){if(!completed)return 'A smaller session still counts. Try one set or a short walk.';if(effort==='easy')return 'If form felt controlled, try 1–2 more reps next time, then consider heavier resistance.';if(effort==='hard')return 'Keep the same resistance or do fewer sets next time. Prioritize recovery.';return 'Repeat with steady technique before increasing resistance.';}
