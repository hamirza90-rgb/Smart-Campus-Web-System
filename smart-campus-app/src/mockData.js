// ══════════════════ MOCK DATA & UTILS ══════════════════
// ══════════════════ MOCK DATA ══════════════════
const initMockData = {
  student: {
    name: 'Laiba Imtiaz',
    roll: 'FSc-2026-B-041',
    section: 'FSc Pre-Eng · Sec B',
    attendance: {
      overall: 87, present: 27, absent: 4,
      subjects: [
        {name:'Mathematics', pct:92, color:'#1D9E75'},
        {name:'Physics', pct:85, color:'#2471A3'},
        {name:'Chemistry', pct:80, color:'#7F77DD'},
        {name:'English', pct:88, color:'#D4AC0D'},
        {name:'Pak Studies', pct:91, color:'#C0392B'},
      ],
      log:[
        {date:'28 Mar',subject:'Mathematics',method:'QR Scan',status:'Present'},
        {date:'27 Mar',subject:'Physics',method:'Manual',status:'Present'},
        {date:'26 Mar',subject:'Chemistry',method:'QR Scan',status:'Absent'},
        {date:'25 Mar',subject:'English',method:'QR Scan',status:'Present'},
        {date:'24 Mar',subject:'Pak Studies',method:'Manual',status:'Present'},
        {date:'23 Mar',subject:'Mathematics',method:'QR Scan',status:'Present'},
      ]
    },
    assignments: [
      {id:1,subject:'Physics',title:'Ch.12 Notes',due:'30 Mar',status:'Pending',marks:null,total:25},
      {id:2,subject:'Math',title:'Exercise 5.3',due:'2 Apr',status:'Draft',marks:null,total:20},
      {id:3,subject:'English',title:'Essay Writing',due:'20 Mar',status:'Graded',marks:18,total:20},
      {id:4,subject:'Chemistry',title:'Lab Report',due:'15 Mar',status:'Graded',marks:22,total:25},
      {id:5,subject:'Pak Studies',title:'Chapter Summary',due:'10 Mar',status:'Graded',marks:14,total:15},
    ],
    results: [
      {subject:'Mathematics',marks:88,total:100,grade:'A+'},
      {subject:'Physics',marks:76,total:100,grade:'B'},
      {subject:'Chemistry',marks:72,total:100,grade:'B'},
      {subject:'English',marks:80,total:100,grade:'A'},
      {subject:'Pak Studies',marks:78,total:100,grade:'B+'},
      {subject:'Islamiyat',marks:85,total:100,grade:'A'},
    ],
    notifications:[
      {id:1,color:'#2471A3',text:'Assignment "Physics Ch.12 Notes" is due in 2 days.',time:'10 min ago',read:false},
      {id:2,color:'#1D9E75',text:'Your Chemistry Lab Report has been graded: 22/25.',time:'2 hrs ago',read:false},
      {id:3,color:'#D4AC0D',text:'Timetable updated for next week.',time:'Yesterday',read:false},
      {id:4,color:'#7F77DD',text:'New announcement: Holiday on 5th April.',time:'2 days ago',read:false},
    ],
    courses:[
      {id:1,name:'Mathematics',teacher:'Sir Asif Mehmood',code:'MATH-301',lectures:42,notes:[
        {name:'Chapter 1-5 Notes.pdf',url:'#'},
        {name:'Exercise Solutions.pdf',url:'#'},
        {name:'Formula Sheet.pdf',url:'#'},
      ]},
      {id:2,name:'Physics',teacher:'Sir Kamran Ali',code:'PHY-301',lectures:38,notes:[
        {name:'Mechanics Notes.pdf',url:'#'},
        {name:'Thermodynamics.pdf',url:'#'},
      ]},
      {id:3,name:'Chemistry',teacher:"Ma'am Sana Tariq",code:'CHEM-301',lectures:36,notes:[
        {name:'Organic Chemistry.pdf',url:'#'},
        {name:'Lab Manual.pdf',url:'#'},
      ]},
      {id:4,name:'English',teacher:"Ma'am Rabia Zafar",code:'ENG-301',lectures:30,notes:[
        {name:'Grammar Guide.pdf',url:'#'},
        {name:'Essay Tips.pdf',url:'#'},
      ]},
    ],
    timetable:[
      {time:'8:00–9:30',Mon:'Math R-12',Tue:'Physics R-7',Wed:'Math R-12',Thu:'',Fri:'Physics R-7'},
      {time:'10:00–11:30',Mon:'Chem Lab',Tue:'',Wed:'Chem Lab',Thu:'Chem R-5',Fri:''},
      {time:'12:30–2:00',Mon:'',Tue:'English R-3',Wed:'',Thu:'English R-3',Fri:'Math R-12'},
      {time:'2:00–3:30',Mon:'Pak St. R-9',Tue:'',Wed:'Physics R-7',Thu:'',Fri:'Islamiyat'},
    ]
  },
  teacher: {
    name: 'Sir Asif Mehmood',
    dept: 'Mathematics Dept.',
    classes:[
      {name:'FSc Pre-Eng Sec A',students:42,subject:'Mathematics'},
      {name:'FSc Pre-Eng Sec B',students:39,subject:'Mathematics'},
      {name:'ICS Sec A',students:35,subject:'Mathematics'},
    ],
    students:[
      {name:'Laiba Imtiaz',roll:'FSc-B-041',attend:87,marks:88,grade:'A+'},
      {name:'Hamna Asif',roll:'FSc-B-042',attend:92,marks:76,grade:'B'},
      {name:'Zainab Malik',roll:'FSc-B-043',attend:79,marks:82,grade:'A'},
      {name:'Ahmed Raza',roll:'FSc-B-044',attend:65,marks:55,grade:'C'},
      {name:'Sara Khan',roll:'FSc-B-045',attend:95,marks:94,grade:'A+'},
      {name:'Ali Hassan',roll:'FSc-B-046',attend:71,marks:68,grade:'B'},
    ]
  },
  admin: {
    name: 'Mr. Tariq Javed',
    dept: 'Administration',
    stats:{students:3200,teachers:180,classes:60,passRate:98}
  }
};

// ══════════════════ UTILS ══════════════════
function getGradeColor(g){ if(['A+','A'].includes(g)) return 'bg'; if(['B+','B'].includes(g)) return 'bb'; if(['C','C+'].includes(g)) return 'ba'; return 'br'; }
function getStatusColor(s){ if(s==='Present'||s==='Graded'||s==='Submitted') return 'bg'; if(s==='Absent'||s==='Pending') return 'br'; if(s==='Draft') return 'ba'; return 'bb'; }

// ══════════════════ TOAST ══════════════════
function Toast({msg,icon='✓'}){
  return <div className="toast"><span style={{color:'#4ade80',fontWeight:600,flexShrink:0}}>{icon}</span>{msg}</div>;
}

// ══════════════════ PGC LOGO ══════════════════
function PGCLogo({size=32}){
  return(
    <svg viewBox="0 0 40 40" width={size} height={size} className="pgc-logo-svg">
      {/* Building */}
      <rect x="4" y="38" width="32" height="2" rx="1" fill="white" opacity="0.5"/>
      <rect x="6" y="20" width="28" height="18" rx="1" fill="white" opacity="0.08"/>
      {/* Pillars */}
      <rect x="8" y="22" width="4" height="14" rx="0.5" fill="white" opacity="0.7"/>
      <rect x="18" y="22" width="4" height="14" rx="0.5" fill="white" opacity="0.7"/>
      <rect x="28" y="22" width="4" height="14" rx="0.5" fill="white" opacity="0.7"/>
      {/* Roof */}
      <polygon points="2,20 20,6 38,20" fill="white" opacity="0.9"/>
      {/* Red accent stripe */}
      <rect x="2" y="19" width="36" height="2.5" rx="0.5" fill="#C0392B" opacity="0.85"/>
      {/* Flag */}
      <line x1="20" y1="6" x2="20" y2="1" stroke="white" strokeWidth="1" opacity="0.6"/>
      <polygon points="20,1 26,3 20,5" fill="#C0392B" opacity="0.9"/>
    </svg>
  );
}

// ══════════════════ QR CODE ══════════════════
// ══ UNIQUE QR LOGIC (v26 se liya gaya — student ka unique scannable QR) ══
function generateUniqueQRText(student){
  // Format: PGC|STUDENT|roll|name|id  — teacher scanner isi se verify karta hai
  return `PGC|STUDENT|${student.roll}|${student.name}|${student.id}`;
}
// ════════════════════════════════════════════════════════════════════════════

function QRCode({scanning}){
  const cells=[];
  const p=[[1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1],[1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,1],[1,0,1,1,1,0,1,0,1,0,1,0,1,1,1,0,1],[1,0,1,1,1,0,1,0,0,1,1,0,1,1,1,0,1],[1,0,1,1,1,0,1,0,1,0,0,0,1,1,1,0,1],[1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,1],[1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1],[0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0],[1,0,1,1,0,1,1,1,0,0,1,1,0,1,1,0,1],[0,1,0,0,1,0,0,0,1,0,0,1,0,0,1,1,0],[1,1,1,1,1,1,1,0,1,0,0,1,1,0,1,0,1],[1,0,0,0,0,0,1,0,0,1,1,0,0,1,0,0,0],[1,0,1,1,1,0,1,0,1,0,0,1,1,1,0,1,1],[1,0,1,1,1,0,1,0,0,1,0,0,1,0,1,0,0],[1,0,1,1,1,0,1,0,1,0,1,1,0,1,1,1,1],[1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,1,0],[1,1,1,1,1,1,1,0,1,1,0,1,1,1,0,0,1]];
  p.forEach((row,r)=>row.forEach((cell,c)=>{ if(cell) cells.push(<rect key={`${r}-${c}`} x={c*4+1} y={r*4+1} width={3} height={3} fill="#000"/>); }));
  return(
    <div className="qr-box">
      <svg viewBox="0 0 70 70" width="68" height="68" style={{display:'block'}}><rect width="70" height="70" fill="white"/>{cells}</svg>
      {scanning&&<div className="qr-scan-line"/>}
    </div>
  );
}

// ══════════════════ HOME PAGE ══════════════════

export { initMockData, getGradeColor, getStatusColor };
