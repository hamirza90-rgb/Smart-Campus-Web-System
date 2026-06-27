import React, { useState, useEffect, useRef, useMemo } from 'react';
import { initMockData, getGradeColor, getStatusColor } from '../mockData';
import { PGCLogo, Toast } from './homepage';

function TeacherDashboard({user,onLogout,classTimetables,ttChangelog,adminAnns,teacherNotifs,setTeacherNotifs}){
  const [activePane,setActivePane]=useState('t-home');
  const [toast,setToast]=useState(null);
  const [attClass,setAttClass]=useState('FSc Pre-Eng Sec B');
  const [attData,setAttData]=useState({});
  const [tab,setTab]=useState('pending');
  const [students,setStudents]=useState(initMockData.teacher.students);
  const [searchTerm,setSearchTerm]=useState('');
  const [showAddStudent,setShowAddStudent]=useState(false);
  const [newStudent,setNewStudent]=useState({name:'',roll:'',attend:100,marks:0,grade:'A'});
  const d=initMockData.teacher;
  const html5QrCodeRef=useRef(null); // ── v26 QR scanner ref
  const [activeScanStudent,setActiveScanStudent]=useState(null);
  const [realScannerOpen,setRealScannerOpen]=useState(false);
  const [camError,setCamError]=useState(false);
  const [myClasses,setMyClasses]=useState(d.classes);
  const [showAddClass,setShowAddClass]=useState(false);
  const [newClass,setNewClass]=useState({name:'',subject:'',students:0});
  const [editClassObj,setEditClassObj]=useState(null);
  const [qrActive,setQrActive]=useState(false);
  const [attSaved,setAttSaved]=useState([]);
  const showToast=(msg)=>{ setToast(msg); setTimeout(()=>setToast(null),3000); };

  // ── REAL QR SCANNER FUNCTIONS (v26 logic — component level) ─────────────
  const openRealScanner=(student,scannedList)=>{
    if((scannedList||[]).includes(student.name)){showToast('⚠️ '+student.name+' already scanned!');return;}
    setCamError(false);
    setActiveScanStudent(student);
    setRealScannerOpen(true);
  };
  const closeRealScanner=()=>{
    if(html5QrCodeRef.current){ html5QrCodeRef.current.stop().catch(()=>{}); html5QrCodeRef.current=null; }
    setRealScannerOpen(false);
    setActiveScanStudent(null);
    setCamError(false);
  };
  // ── END QR SCANNER FUNCTIONS ─────────────────────────────────────────────

  const toggleAtt=(name)=>setAttData(prev=>({...prev,[name]:!prev[name]||prev[name]==='P'?'A':prev[name]==='A'?'L':'P'}));
  const getAttBadge=(s)=>!s||s==='P'?'bg':s==='A'?'br':'ba';
  const getAttFull=(s)=>!s||s==='P'?'Present':s==='A'?'Absent':'Leave';
  const addMyClass=()=>{if(!newClass.name||!newClass.subject){showToast('Name & Subject required');return;}setMyClasses(p=>[...p,{...newClass,students:Math.max(0,parseInt(newClass.students)||0)}]);setNewClass({name:'',subject:'',students:0});setShowAddClass(false);showToast('Class added!');};
  const delMyClass=(n)=>{setMyClasses(p=>p.filter(c=>c.name!==n));showToast('Class removed.');};
  const saveEditClass=()=>{setMyClasses(p=>p.map(c=>c.name===editClassObj._orig?{name:editClassObj.name,subject:editClassObj.subject,students:editClassObj.students}:c));setEditClassObj(null);showToast('Class updated!');};
  const saveAndDownload=()=>{
    const date=new Date().toLocaleDateString('en-GB');
    const lines=[`PGC Attendance — ${attClass} — ${date}`,'='.repeat(40),...students.map(s=>`${s.name} (${s.roll}): ${getAttFull(attData[s.name])}`),'','Summary:',`Present: ${students.filter(s=>!attData[s.name]||attData[s.name]==='P').length}`,`Absent: ${students.filter(s=>attData[s.name]==='A').length}`,`Leave: ${students.filter(s=>attData[s.name]==='L').length}`];
    const blob=new Blob([lines.join('\n')],{type:'text/plain'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=`Attendance_${attClass.replace(/ /g,'_')}_${date.replace(/\//g,'-')}.txt`;a.click();URL.revokeObjectURL(url);
    setAttSaved(p=>[{date,class:attClass,p:students.filter(s=>!attData[s.name]||attData[s.name]==='P').length,a:students.filter(s=>attData[s.name]==='A').length,l:students.filter(s=>attData[s.name]==='L').length},...p.slice(0,4)]);
    showToast('Attendance saved & downloaded!');
  };
  const filteredStudents=students.filter(s=>s.name.toLowerCase().includes(searchTerm.toLowerCase())||s.roll.toLowerCase().includes(searchTerm.toLowerCase()));
  const addStudent=()=>{ if(!newStudent.name||!newStudent.roll){ showToast('Please fill Name and Roll No'); return; } setStudents(prev=>[...prev,{...newStudent}]); setNewStudent({name:'',roll:'',attend:100,marks:0,grade:'A'}); setShowAddStudent(false); showToast('Student added successfully!'); };
  const deleteStudent=(roll)=>{ setStudents(prev=>prev.filter(s=>s.roll!==roll)); showToast('Student removed.'); };

  // ── REAL QR SCANNER useEffect (v26 logic) ────────────────────────────────
  useEffect(()=>{
    if(!realScannerOpen||!activeScanStudent) return;
    let html5QrCode=null;
    let isStopping=false;
    let observer=null;
    const stopScanner=()=>{
      if(isStopping||!html5QrCode) return;
      isStopping=true;
      html5QrCode.stop().catch(()=>{}).finally(()=>{ html5QrCode=null; html5QrCodeRef.current=null; });
    };
    const startScanner=()=>{
      if(html5QrCodeRef.current) return;
      html5QrCode=new Html5Qrcode('att-qr-reader');
      html5QrCodeRef.current=html5QrCode;
      const expectedQR=generateUniqueQRText({
        id: activeScanStudent.id||activeScanStudent.roll,
        name: activeScanStudent.name,
        roll: activeScanStudent.roll
      });
      const onScanSuccess=(decodedText)=>{
        if(decodedText===expectedQR){
          stopScanner();
          setRealScannerOpen(false);
          setActiveScanStudent(null);
          if(html5QrCodeRef._markPresent) html5QrCodeRef._markPresent(activeScanStudent.name,activeScanStudent);
          showToast('✅ '+activeScanStudent.name+' — QR Matched! Attendance Marked.');
        } else {
          showToast('❌ Wrong QR! This is NOT '+activeScanStudent.name+'\'s QR code.');
        }
      };
      html5QrCode.start({facingMode:'environment'},{fps:10,qrbox:{width:260,height:260}},onScanSuccess)
        .catch(()=>{ setCamError(true); showToast('Camera access denied! Allow camera permission.'); html5QrCode=null; html5QrCodeRef.current=null; });
    };
    const el=document.getElementById('att-qr-reader');
    if(el){ startScanner(); }
    else{
      observer=new MutationObserver(()=>{
        const found=document.getElementById('att-qr-reader');
        if(found){ observer.disconnect(); observer=null; startScanner(); }
      });
      observer.observe(document.body,{childList:true,subtree:true});
    }
    return ()=>{ if(observer){ observer.disconnect(); observer=null; } stopScanner(); };
  },[realScannerOpen,activeScanStudent]);
  // ── END QR useEffect ──────────────────────────────────────────────────────

  const navItems=[
    {id:'t-home',label:'Dashboard'},{id:'t-attend',label:'Attendance'},{id:'t-courses',label:'Course Module'},{id:'t-assign',label:'Assignments'},{id:'t-result',label:'Results'},{id:'t-tt',label:'Timetable'},{id:'t-notif',label:'Notifications'},{id:'t-perf',label:'Analytics'},
  ];
  const paneTitle=navItems.find(n=>n.id===activePane)?.label||'Dashboard';
  const adminAnnsForTeacher=(adminAnns||[]).filter(a=>a.audience==='All Students & Teachers'||a.audience==='Teachers Only');
  const teacherUnreadCount=adminAnnsForTeacher.filter(a=>a.id).length;

  return(
    <div className="dash-wrap">
      <div className="sidebar" style={{background:'linear-gradient(180deg,#0b2014 0%,#071209 100%)'}}>
        <div className="sb-logo">
          <div className="sb-logo-row">
            <PGCLogo size={28}/>
            <div><div className="sb-text">PGC Portal</div><div className="sb-sub">Teacher Panel</div></div>
          </div>
        </div>
        <div className="sb-nav">
          <div className="nav-grp">Main</div>
          {navItems.map(n=>(<button key={n.id} className={`nav-item ${activePane===n.id?'active':''}`} onClick={()=>setActivePane(n.id)}>{n.label}</button>))}
        </div>
        <div className="sb-footer">
          <div className="sb-user"><div className="sb-av" style={{background:'rgba(29,131,72,0.35)'}}>AM</div><div><div className="sb-uname">{d.name}</div><div className="sb-urole">{d.dept}</div></div></div>
          <button className="logout-btn" onClick={onLogout}><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" width="12" height="12"><path d="M5 2H2v8h3"/><polyline points="8,4 11,6 8,8"/><line x1="5" y1="6" x2="11" y2="6"/></svg>Sign out</button>
        </div>
      </div>
      <div className="main">
        <div className="topbar">
          <div className="tb-title" style={{color:'#4ade80'}}>{paneTitle}</div>
          <div className="tb-right"><button className="nb" onClick={()=>setActivePane('t-notif')}><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" width="13" height="13"><path d="M6 1a3.5 3.5 0 0 1 3.5 3.5c0 2.8 1 3.5 1 3.5H1s1-.7 1-3.5A3.5 3.5 0 0 1 6 1z"/><line x1="6" y1="11" x2="6" y2="9"/></svg>{teacherUnreadCount>0&&<div className="ndot"></div>}</button><div className="tb-date">7 Apr 2026</div></div>
        </div>
        <div className="content">

          {/* HOME */}
          <div className={`panel ${activePane==='t-home'?'active':''}`}>
            <div className="sg">
              {[['My Classes','3','Active','#1D9E75'],['Students',students.length,'Total','#2471A3'],['Assignments','8','Active','#D4AC0D'],['Avg Attendance','82%','This term','#7F77DD']].map(([l,v,s,c])=>(<div className="sc" key={l} style={{cursor:'pointer'}}><div className="sc-l">{l}</div><div className="sc-v" style={{color:c}}>{v}</div><div className="sc-s">{s}</div></div>))}
            </div>
            <div className="twoC">
              <div className="card"><div className="ct"><div className="ct-dot" style={{background:'#1D9E75'}}></div>My Classes</div>
                {d.classes.map(c=>(<div className="ri" key={c.name}><div><div className="rm">{c.name}</div><div className="rs">{c.subject} · {c.students} students</div></div><span className="badge bg">Active</span></div>))}
              </div>
              <div className="card"><div className="ct"><div className="ct-dot" style={{background:'#C0392B'}}></div>Pending Assignments</div>
                {initMockData.student.assignments.filter(a=>a.status==='Pending').map(a=>(<div className="ri" key={a.id}><div><div className="rm">{a.subject} – {a.title}</div><div className="rs">Due: {a.due}</div></div><button className="badge br" style={{border:'none',cursor:'pointer',background:'rgba(192,57,43,0.2)',color:'#f87171'}} onClick={()=>setActivePane('t-assign')}>Review →</button></div>))}
              </div>
            </div>
            <div className="card"><div className="ct"><div className="ct-dot" style={{background:'#D4AC0D'}}></div>Top Students</div>
              {students.sort((a,b)=>b.marks-a.marks).slice(0,4).map(s=>(<div className="user-row" key={s.name}><div className="user-av" style={{background:'rgba(36,113,163,0.3)'}}>{s.name[0]}</div><div><div className="user-name">{s.name}</div><div className="user-detail">{s.roll}</div></div><div style={{marginLeft:'auto',textAlign:'right'}}><div className="user-name">{s.marks}% · <span className={`badge ${getGradeColor(s.grade)}`} style={{fontSize:9}}>{s.grade}</span></div><div className="perf-mini"><div className="perf-bar"><div className="perf-fill" style={{width:`${s.marks}%`,background:'#2471A3'}}/></div><span className="user-detail">Att: {s.attend}%</span></div></div></div>))}
            </div>
            {adminAnnsForTeacher.length>0&&(
              <div className="card">
                <div className="ct"><div className="ct-dot" style={{background:'#C0392B'}}></div>🔔 Admin Announcements
                  <button className="d-btn d-btn-blue" style={{marginLeft:'auto',fontSize:'9px',padding:'2px 8px'}} onClick={()=>setActivePane('t-notif')}>View All</button>
                </div>
                {adminAnnsForTeacher.slice(0,3).map(a=>(
                  <div className="notif-item" key={a.id}>
                    <div className="notif-dot" style={{background:a.color||'#C0392B'}}></div>
                    <div style={{flex:1}}>
                      <div className="notif-text">📢 {a.title}</div>
                      <div className="notif-time">{a.time} · {a.audience} <span className="badge br" style={{marginLeft:4,fontSize:8}}>Admin</span></div>
                      {a.msg&&<div style={{fontSize:10,color:'rgba(255,255,255,0.28)',marginTop:2}}>{a.msg}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ATTENDANCE */}
          <div className={`panel ${activePane==='t-attend'?'active':''}`}>
            {(()=>{
              const [attStep,setAttStep]=useState('setup'); // setup | scanning | manual | submitted
              const [attMode,setAttMode]=useState('qr'); // qr | manual
              const [scannedNames,setScannedNames]=useState([]); // students marked present via QR
              const [manualData,setManualData]=useState({});
              const [attDate,setAttDate]=useState(new Date().toISOString().split('T')[0]);
              const [scanAnim,setScanAnim]=useState(false);
              const [lastScanned,setLastScanned]=useState(null);
              const [savedSessions,setSavedSessions]=useState(attSaved);
              const [stuSearch,setStuSearch]=useState('');

              // simulateScan: real scanner kholega + _markPresent callback register karega
              const simulateScan=(student)=>{
                // _markPresent: useEffect mein scan success par yeh call hoga
                html5QrCodeRef._markPresent=(name,stu)=>{
                  setScannedNames(prev=>[...prev,name]);
                  setLastScanned(stu);
                };
                openRealScanner(student,scannedNames);
              };

              const remainingStudents=students.filter(s=>!scannedNames.includes(s.name));
              const filtStu=students.filter(s=>s.name.toLowerCase().includes(stuSearch.toLowerCase())||s.roll.toLowerCase().includes(stuSearch.toLowerCase()));

              const submitAttendance=()=>{
                const date=new Date(attDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short'});
                const presentNames=attStep==='scanning'?scannedNames:students.filter(s=>manualData[s.name]==='P'||(!manualData[s.name]&&attMode==='manual'?false:false)).map(s=>s.name);
                const p=scannedNames.length;
                const a=students.filter(s=>!scannedNames.includes(s.name)&&manualData[s.name]!=='P').length;
                const l=students.filter(s=>manualData[s.name]==='L').length;
                const newSession={date,class:attClass,p:attMode==='qr'?scannedNames.length:students.filter(s=>manualData[s.name]==='P').length,a:attMode==='qr'?remainingStudents.length:students.filter(s=>manualData[s.name]==='A'||!manualData[s.name]).length,l:students.filter(s=>manualData[s.name]==='L').length,mode:attMode==='qr'?'QR Scan':'Manual'};
                setSavedSessions(prev=>[newSession,...prev.slice(0,9)]);
                setAttSaved(prev=>[newSession,...prev.slice(0,9)]);
                setAttStep('submitted');
                showToast('✅ Attendance submitted for '+attClass+'!');
              };

              const resetAtt=()=>{setAttStep('setup');setScannedNames([]);setManualData({});setLastScanned(null);setStuSearch('');};

              // STEP 1 — SETUP
              if(attStep==='setup') return(
                <>
                  {/* Class Cards */}
                  <div className="card" style={{marginBottom:14}}>
                    <div className="ct"><div className="ct-dot" style={{background:'#1D9E75'}}></div>
                      Step 1 — Select Class
                      <span style={{marginLeft:'auto',fontSize:9,color:'rgba(255,255,255,0.3)',padding:'2px 8px',background:'rgba(192,57,43,0.1)',border:'1px solid rgba(192,57,43,0.2)',borderRadius:8}}>🔒 Classes set by Admin</span>
                    </div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:10,marginTop:10}}>
                      {myClasses.map(c=>(
                        <div key={c.name} onClick={()=>setAttClass(c.name)} style={{flex:'1 1 180px',padding:'14px 16px',borderRadius:12,cursor:'pointer',background:attClass===c.name?'rgba(29,131,72,0.18)':'rgba(255,255,255,0.04)',border:`1.5px solid ${attClass===c.name?'#1D9E75':'rgba(255,255,255,0.1)'}`,transition:'all 0.15s'}}>
                          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                            <div style={{width:32,height:32,borderRadius:8,background:attClass===c.name?'rgba(29,131,72,0.3)':'rgba(255,255,255,0.06)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>📚</div>
                            <div>
                              <div style={{color:'#fff',fontSize:12,fontWeight:600}}>{c.name}</div>
                              <div style={{color:'rgba(255,255,255,0.35)',fontSize:9}}>{c.subject}</div>
                            </div>
                            {attClass===c.name&&<div style={{marginLeft:'auto',width:18,height:18,borderRadius:'50%',background:'#1D9E75',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:'#fff'}}>✓</div>}
                          </div>
                          <div style={{fontSize:10,color:'rgba(255,255,255,0.3)'}}>{c.students} students enrolled</div>
                        </div>
                      ))}
                    </div>
                    <div style={{marginTop:12,display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                      <div style={{flex:1,minWidth:160}}>
                        <div className="f-lab" style={{marginBottom:4}}>Date</div>
                        <input type="date" className="f-inp" style={{width:'100%'}} value={attDate} onChange={e=>setAttDate(e.target.value)}/>
                      </div>
                    </div>
                  </div>

                  {/* Choose Method */}
                  <div className="card" style={{marginBottom:14}}>
                    <div className="ct"><div className="ct-dot" style={{background:'#2471A3'}}></div>Step 2 — Choose Attendance Method</div>
                    <div style={{display:'flex',gap:12,marginTop:10,flexWrap:'wrap'}}>
                      <div onClick={()=>setAttMode('qr')} style={{flex:1,minWidth:200,padding:'18px 20px',borderRadius:12,cursor:'pointer',background:attMode==='qr'?'rgba(36,113,163,0.18)':'rgba(255,255,255,0.03)',border:`1.5px solid ${attMode==='qr'?'#2471A3':'rgba(255,255,255,0.08)'}`,transition:'all 0.15s'}}>
                        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                          <div style={{width:40,height:40,borderRadius:10,background:'rgba(36,113,163,0.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>📷</div>
                          <div>
                            <div style={{color:'#fff',fontSize:13,fontWeight:700}}>QR Scanner</div>
                            <div style={{fontSize:10,color:'rgba(255,255,255,0.35)'}}>Recommended</div>
                          </div>
                          {attMode==='qr'&&<div style={{marginLeft:'auto',width:20,height:20,borderRadius:'50%',background:'#2471A3',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'#fff'}}>✓</div>}
                        </div>
                        <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',lineHeight:1.7}}>Student shows their QR code → Teacher scans → Attendance marked automatically. Photo verification included.</div>
                        <div style={{marginTop:8,display:'flex',gap:6,flexWrap:'wrap'}}>
                          {['🛡️ Anti-proxy','⚡ Real-time','📸 Photo verify'].map(t=><span key={t} style={{fontSize:9,color:'#60a5fa',background:'rgba(36,113,163,0.15)',border:'1px solid rgba(36,113,163,0.25)',borderRadius:10,padding:'2px 7px'}}>{t}</span>)}
                        </div>
                      </div>
                      <div onClick={()=>setAttMode('manual')} style={{flex:1,minWidth:200,padding:'18px 20px',borderRadius:12,cursor:'pointer',background:attMode==='manual'?'rgba(212,172,13,0.12)':'rgba(255,255,255,0.03)',border:`1.5px solid ${attMode==='manual'?'#D4AC0D':'rgba(255,255,255,0.08)'}`,transition:'all 0.15s'}}>
                        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                          <div style={{width:40,height:40,borderRadius:10,background:'rgba(212,172,13,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>✍️</div>
                          <div>
                            <div style={{color:'#fff',fontSize:13,fontWeight:700}}>Manual Entry</div>
                            <div style={{fontSize:10,color:'rgba(255,255,255,0.35)'}}>Emergency / Backup</div>
                          </div>
                          {attMode==='manual'&&<div style={{marginLeft:'auto',width:20,height:20,borderRadius:'50%',background:'#D4AC0D',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'#fff'}}>✓</div>}
                        </div>
                        <div style={{fontSize:11,color:'rgba(255,255,255,0.4)',lineHeight:1.7}}>Mark attendance manually from student list. Use when QR scanning is unavailable.</div>
                      </div>
                    </div>
                  </div>

                  <button onClick={()=>setAttStep(attMode==='qr'?'scanning':'manual')} style={{width:'100%',padding:'14px',background:'linear-gradient(135deg,#0d2a1a,#1D9E75)',border:'none',borderRadius:12,color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:10}}>
                    {attMode==='qr'?'📷 Start QR Scanning →':'✍️ Start Manual Attendance →'}
                  </button>

                  {/* Previous Sessions */}
                  {savedSessions.length>0&&(
                    <div className="card" style={{marginTop:14}}>
                      <div className="ct"><div className="ct-dot" style={{background:'#7F77DD'}}></div>Previous Sessions</div>
                      {savedSessions.slice(0,5).map((r,i)=>(
                        <div key={i} style={{display:'flex',gap:12,alignItems:'center',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.04)',fontSize:11}}>
                          <span style={{color:'rgba(255,255,255,0.3)',minWidth:50}}>{r.date}</span>
                          <span style={{color:'var(--white2)',flex:1}}>{r.class}</span>
                          <span style={{fontSize:9,color:'rgba(255,255,255,0.3)',background:'rgba(255,255,255,0.05)',borderRadius:8,padding:'1px 7px'}}>{r.mode||'Manual'}</span>
                          <span style={{color:'#4ade80'}}>{r.p}P</span>
                          <span style={{color:'#f87171'}}>{r.a}A</span>
                          <span style={{color:'#fbbf24'}}>{r.l}L</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              );

              // STEP 2A — QR SCANNING
              if(attStep==='scanning') return(
                <>
                  {/* Top bar */}
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14,flexWrap:'wrap'}}>                    <button onClick={resetAtt} style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,color:'rgba(255,255,255,0.5)',cursor:'pointer',fontSize:11,padding:'6px 12px'}}>← Back</button>
                    <div style={{flex:1}}>
                      <div style={{color:'#fff',fontSize:14,fontWeight:700}}>📷 QR Attendance — {attClass}</div>
                      <div style={{fontSize:10,color:'rgba(255,255,255,0.35)'}}>{new Date(attDate).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</div>
                    </div>
                    <div style={{display:'flex',gap:8,alignItems:'center'}}>
                      <span style={{fontSize:10,background:'rgba(29,131,72,0.2)',color:'#4ade80',border:'1px solid rgba(29,131,72,0.3)',borderRadius:8,padding:'4px 10px',fontWeight:600}}>{scannedNames.length} ✅ Present</span>
                      <span style={{fontSize:10,background:'rgba(192,57,43,0.15)',color:'#f87171',border:'1px solid rgba(192,57,43,0.25)',borderRadius:8,padding:'4px 10px',fontWeight:600}}>{remainingStudents.length} ⏳ Remaining</span>
                    </div>
                  </div>

                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                    {/* LEFT — Live Scanner Viewport */}
                    <div className="card" style={{height:'fit-content'}}>
                      <div className="ct"><div className="ct-dot" style={{background:'#2471A3'}}></div>
                        📷 Live QR Scanner
                        <span style={{marginLeft:'auto',fontSize:9,background:scanAnim?'rgba(29,131,72,0.25)':'rgba(36,113,163,0.15)',color:scanAnim?'#4ade80':'#60a5fa',border:`1px solid ${scanAnim?'rgba(29,131,72,0.4)':'rgba(36,113,163,0.3)'}`,borderRadius:8,padding:'2px 8px',fontWeight:700,transition:'all 0.3s'}}>
                          {scanAnim?'🟢 SCANNING...':'🔵 READY'}
                        </span>
                      </div>

                      {/* Scanner Viewport */}
                      <div style={{position:'relative',background:'#000',borderRadius:12,overflow:'hidden',height:200,marginBottom:12,border:`2px solid ${scanAnim?'rgba(29,131,72,0.8)':'rgba(36,113,163,0.4)'}`,transition:'border-color 0.3s',boxShadow:scanAnim?'0 0 20px rgba(29,131,72,0.3)':'none'}}>
                        {/* Camera feed simulation */}
                        <div style={{position:'absolute',inset:0,background:'linear-gradient(135deg,#0a0a0a 0%,#111 50%,#0a0a0a 100%)'}}>
                          {/* Grid lines to simulate camera */}
                          <div style={{position:'absolute',inset:0,backgroundImage:'linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)',backgroundSize:'20px 20px'}}/>
                        </div>

                        {/* Corner brackets */}
                        {[{t:12,l:12,bt:'borderTop',bl:'borderLeft'},{t:12,r:12,bt:'borderTop',bl:'borderRight'},{b:12,l:12,bt:'borderBottom',bl:'borderLeft'},{b:12,r:12,bt:'borderBottom',bl:'borderRight'}].map((pos,i)=>(
                          <div key={i} style={{position:'absolute',top:pos.t,bottom:pos.b,left:pos.l,right:pos.r,width:24,height:24,[pos.bt]:`2px solid ${scanAnim?'#1D9E75':'#2471A3'}`,[pos.bl]:`2px solid ${scanAnim?'#1D9E75':'#2471A3'}`,transition:'border-color 0.3s'}}/>
                        ))}

                        {/* Scan line animation */}
                        <div style={{position:'absolute',left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${scanAnim?'#1D9E75':'#2471A3'},transparent)`,animation:'scanLine 1.5s linear infinite',opacity:scanAnim?1:0.5,transition:'opacity 0.3s'}}/>

                        {/* Center QR display area */}
                        {lastScanned&&scanAnim?(
                          /* Scanning animation — showing the scanned student's QR */
                          <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',animation:'fadeIn 0.15s ease'}}>
                            <div style={{background:'white',padding:10,borderRadius:8,boxShadow:'0 0 30px rgba(29,131,72,0.6)',animation:'pulse 0.6s ease infinite'}}>
                              <QRCode scanning={true}/>
                            </div>
                          </div>
                        ):(
                          <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8}}>
                            <div style={{background:'rgba(255,255,255,0.06)',border:'1px dashed rgba(255,255,255,0.15)',borderRadius:8,padding:'14px 20px',display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                              <div style={{fontSize:24}}>📱</div>
                              <div style={{color:'rgba(255,255,255,0.4)',fontSize:10,textAlign:'center',lineHeight:1.5}}>Student apna QR card<br/>camera ke saamne rakhe</div>
                            </div>
                          </div>
                        )}

                        {/* SUCCESS overlay */}
                        {scanAnim&&(
                          <div style={{position:'absolute',inset:0,background:'rgba(29,131,72,0.25)',display:'flex',alignItems:'flex-end',justifyContent:'center',paddingBottom:10}}>
                            <div style={{background:'rgba(29,131,72,0.9)',borderRadius:8,padding:'6px 16px',fontSize:11,color:'#fff',fontWeight:700}}>
                              ✅ {lastScanned?.name} — Detected!
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Last scanned info */}
                      {lastScanned&&(
                        <div style={{background:'rgba(29,131,72,0.12)',border:'1px solid rgba(29,131,72,0.3)',borderRadius:10,padding:'10px 14px',marginBottom:10}}>
                          <div style={{fontSize:10,color:'rgba(255,255,255,0.35)',marginBottom:4}}>Last scanned ✅</div>
                          <div style={{display:'flex',alignItems:'center',gap:10}}>
                            <div style={{width:34,height:34,borderRadius:9,background:'rgba(29,131,72,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,fontWeight:700,color:'#fff',flexShrink:0}}>{lastScanned.name[0]}</div>
                            <div><div style={{color:'#fff',fontSize:13,fontWeight:600}}>{lastScanned.name}</div><div style={{fontSize:10,color:'rgba(255,255,255,0.35)'}}>{lastScanned.roll}</div></div>
                            <span style={{marginLeft:'auto',fontSize:20}}>✅</span>
                          </div>
                        </div>
                      )}

                      {/* Instructions */}
                      <div style={{background:'rgba(36,113,163,0.07)',border:'1px solid rgba(36,113,163,0.15)',borderRadius:8,padding:'8px 12px',fontSize:10,color:'rgba(255,255,255,0.4)',lineHeight:1.8}}>
                        <div style={{fontWeight:700,color:'#60a5fa',marginBottom:4}}>📋 How to scan:</div>
                        <div>1. Student apna QR card screen pe dikhaye 📱</div>
                        <div>2. Right side mein student ka naam click karein 👇</div>
                        <div>3. Scanner automatically detect karke mark karega ✅</div>
                      </div>
                    </div>

                    {/* RIGHT — Student List with Scan buttons */}
                    <div style={{display:'flex',flexDirection:'column',gap:10}}>
                      {/* Students to scan — ALL shown, scanned ones get ✓ tick */}
                      <div className="card" style={{flex:1}}>
                        <div className="ct"><div className="ct-dot" style={{background:'#C0392B'}}></div>
                          📋 Students ({scannedNames.length}/{students.length} ✅)
                        </div>
                        <div style={{fontSize:10,color:'rgba(255,255,255,0.3)',marginBottom:8,fontStyle:'italic'}}>Student ka QR scanner ke saamne ho to neeche naam par click karein — auto mark hoga</div>
                        <div style={{display:'flex',flexDirection:'column',gap:6,maxHeight:320,overflowY:'auto'}}>
                          {students.map(s=>{
                            const isScanned=scannedNames.includes(s.name);
                            const isScanning=scanAnim&&lastScanned?.name===s.name;
                            return(
                            <div key={s.roll} style={{display:'flex',alignItems:'center',gap:8,padding:'9px 12px',background:isScanned?'rgba(29,131,72,0.10)':'rgba(255,255,255,0.04)',border:`1px solid ${isScanned?'rgba(29,131,72,0.35)':isScanning?'rgba(36,113,163,0.6)':'rgba(255,255,255,0.08)'}`,borderRadius:10,transition:'all 0.3s'}}>
                              {/* Student QR mini card */}
                              <div style={{background:'#fff',padding:4,borderRadius:6,flexShrink:0,opacity:isScanned?0.5:1}}>
                                <svg viewBox="0 0 30 30" width="30" height="30">
                                  <rect width="30" height="30" fill="white"/>
                                  {[[0,0,8,8],[22,0,8,8],[0,22,8,8]].map(([x,y,w,h],i)=>(
                                    <g key={i}>
                                      <rect x={x} y={y} width={w} height={h} fill="#000"/>
                                      <rect x={x+2} y={y+2} width={w-4} height={h-4} fill="white"/>
                                      <rect x={x+4} y={y+4} width={w-8} height={h-8} fill="#000"/>
                                    </g>
                                  ))}
                                  {[[12,12],[15,12],[18,12],[21,12],[12,15],[18,15],[21,15],[12,18],[15,18],[21,18],[12,21],[15,21],[18,21]].map(([x,y])=>(<rect key={`${x}${y}`} x={x} y={y} width={2} height={2} fill="#000"/>))}
                                </svg>
                              </div>
                              <div style={{flex:1,minWidth:0}}>
                                <div style={{color:isScanned?'#4ade80':'var(--white2)',fontSize:12,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.name}</div>
                                <div style={{color:'rgba(255,255,255,0.3)',fontSize:9,marginTop:1}}>{s.roll}</div>
                              </div>
                              {/* Show ✓ if scanned, scanning animation if scanning, else Scan button */}
                              {isScanned?(
                                <div style={{width:36,height:36,borderRadius:8,background:'rgba(29,131,72,0.3)',border:'1px solid rgba(29,131,72,0.5)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,color:'#4ade80',flexShrink:0,animation:'fadeIn 0.3s ease'}}>✓</div>
                              ):isScanning?(
                                <div style={{padding:'6px 12px',background:'rgba(36,113,163,0.3)',border:'1px solid rgba(36,113,163,0.6)',borderRadius:8,color:'#60a5fa',fontSize:10,fontWeight:700,flexShrink:0,animation:'pulse 0.6s ease infinite'}}>
                                  📷 Scanning...
                                </div>
                              ):(
                                <button
                                  onClick={()=>simulateScan(s)}
                                  style={{padding:'6px 12px',background:'linear-gradient(135deg,rgba(36,113,163,0.4),rgba(36,113,163,0.2))',border:'1px solid rgba(36,113,163,0.5)',borderRadius:8,color:'#60a5fa',fontSize:10,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:5,flexShrink:0,transition:'all 0.15s'}}
                                >
                                  <span style={{fontSize:13}}>📷</span> Scan
                                </button>
                              )}
                            </div>
                            );
                          })}
                          {scannedNames.length===students.length&&(
                            <div style={{textAlign:'center',padding:'14px 0',color:'#4ade80',fontSize:13,fontWeight:700}}>
                              🎉 Sab students scan ho gaye!
                            </div>
                          )}
                        </div>
                      </div>



                      {/* Action buttons */}
                      <div style={{display:'flex',flexDirection:'column',gap:8}}>
                        <button onClick={()=>setAttStep('manual')} style={{padding:'9px',background:'rgba(212,172,13,0.12)',border:'1px solid rgba(212,172,13,0.3)',borderRadius:10,color:'#D4AC0D',fontSize:11,fontWeight:600,cursor:'pointer'}}>
                          ✍️ Remaining ko Manual Mark Karein
                        </button>
                        <button onClick={submitAttendance} style={{padding:'12px',background:'linear-gradient(135deg,#0d2a1a,#1D9E75)',border:'none',borderRadius:10,color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer'}}>
                          ✅ Submit Attendance ({scannedNames.length}/{students.length})
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              );
              // STEP 2B — MANUAL
              if(attStep==='manual') return(
                <>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14,flexWrap:'wrap'}}>
                    <button onClick={()=>setAttStep(attMode==='manual'?'setup':'scanning')} style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,color:'rgba(255,255,255,0.5)',cursor:'pointer',fontSize:11,padding:'6px 12px'}}>← Back</button>
                    <div style={{flex:1}}>
                      <div style={{color:'#fff',fontSize:14,fontWeight:700}}>✍️ Manual Attendance — {attClass}</div>
                      <div style={{fontSize:10,color:'rgba(255,255,255,0.35)'}}>{new Date(attDate).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}{attMode==='qr'?' · Completing remaining after QR scan':''}</div>
                    </div>
                  </div>

                  {attMode==='qr'&&scannedNames.length>0&&(
                    <div style={{background:'rgba(29,131,72,0.08)',border:'1px solid rgba(29,131,72,0.2)',borderRadius:10,padding:'10px 14px',marginBottom:12,fontSize:11,color:'rgba(255,255,255,0.5)',display:'flex',gap:8,alignItems:'center'}}>
                      <span>✅</span><span><strong style={{color:'#4ade80'}}>{scannedNames.length} students</strong> already marked Present via QR. Mark status for remaining {remainingStudents.length} students below.</span>
                    </div>
                  )}

                  <div className="card" style={{marginBottom:12}}>
                    <div className="ct"><div className="ct-dot" style={{background:'#D4AC0D'}}></div>Student List
                      <div style={{marginLeft:'auto',display:'flex',gap:5,alignItems:'center'}}>
                        {[['P','#1D9E75','Present'],['A','#C0392B','Absent'],['L','#D4AC0D','Leave']].map(([lbl,col,full])=>(
                          <span key={lbl} style={{padding:'2px 7px',borderRadius:4,background:`${col}22`,color:col,fontSize:9,fontWeight:700}}>{lbl}={full}</span>
                        ))}
                      </div>
                    </div>
                    <div className="search-bar" style={{marginBottom:10}}>
                      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="13" height="13"><circle cx="6" cy="6" r="4.5"/><line x1="9.2" y1="9.2" x2="13" y2="13"/></svg>
                      <input placeholder="Search student..." value={stuSearch} onChange={e=>setStuSearch(e.target.value)}/>
                    </div>
                    <div style={{display:'flex',gap:6,marginBottom:10,flexWrap:'wrap'}}>
                      <button className="d-btn d-btn-green" style={{fontSize:10}} onClick={()=>{const a={};(attMode==='qr'?remainingStudents:students).forEach(s=>a[s.name]='P');setManualData(prev=>({...prev,...a}));showToast('All marked Present');}}>✓ All Present</button>
                      <button className="d-btn" style={{background:'rgba(212,172,13,0.1)',color:'#D4AC0D',border:'1px solid rgba(212,172,13,0.25)',borderRadius:5,padding:'5px 12px',fontSize:10,cursor:'pointer'}} onClick={()=>{const a={};(attMode==='qr'?remainingStudents:students).forEach(s=>a[s.name]='L');setManualData(prev=>({...prev,...a}));showToast('All marked Leave');}}>⏸ All Leave</button>
                    </div>
                    <table className="mt">
                      <thead><tr><th>Student</th><th>Roll No</th><th>Status</th><th>Mark</th></tr></thead>
                      <tbody>{filtStu.map(s=>{
                        const isQrPresent=scannedNames.includes(s.name);
                        const st=isQrPresent?'P':(manualData[s.name]||'');
                        const col=st==='P'?'#1D9E75':st==='A'?'#C0392B':st==='L'?'#D4AC0D':'rgba(255,255,255,0.25)';
                        return(<tr key={s.name} style={{opacity:isQrPresent?0.55:1}}>
                          <td style={{fontWeight:500}}>{s.name}</td>
                          <td style={{fontFamily:'monospace',fontSize:10,color:'rgba(255,255,255,0.35)'}}>{s.roll}</td>
                          <td>
                            {isQrPresent?(
                              <span style={{fontSize:9,color:'#4ade80',background:'rgba(29,131,72,0.15)',border:'1px solid rgba(29,131,72,0.25)',borderRadius:8,padding:'2px 8px',fontWeight:700}}>✅ QR Scanned</span>
                            ):(
                              <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'3px 8px',borderRadius:6,background:`${col}22`,color:col||'rgba(255,255,255,0.3)',fontSize:11,fontWeight:700,border:`1px solid ${col}44`}}>
                                {st==='P'?'✓ Present':st==='A'?'✗ Absent':st==='L'?'⏸ Leave':'— Not marked'}
                              </span>
                            )}
                          </td>
                          <td>
                            {!isQrPresent&&(
                              <div style={{display:'flex',gap:4}}>
                                {[['P','#1D9E75','P'],['A','#C0392B','A'],['L','#D4AC0D','L']].map(([v,col,lbl])=>(
                                  <button key={v} onClick={()=>setManualData(prev=>({...prev,[s.name]:v}))} style={{width:28,height:28,borderRadius:6,border:`1px solid ${manualData[s.name]===v?col:'rgba(255,255,255,0.1)'}`,background:manualData[s.name]===v?`${col}25`:'transparent',color:manualData[s.name]===v?col:'rgba(255,255,255,0.35)',fontSize:10,fontWeight:700,cursor:'pointer'}}>{lbl}</button>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>);
                      })}</tbody>
                    </table>
                  </div>

                  <button onClick={submitAttendance} style={{width:'100%',padding:'13px',background:'linear-gradient(135deg,#0d2a1a,#1D9E75)',border:'none',borderRadius:12,color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer'}}>
                    ✅ Submit Attendance
                  </button>
                </>
              );

              // STEP 3 — SUBMITTED
              if(attStep==='submitted') return(
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'40px 20px',textAlign:'center'}}>
                  <div style={{fontSize:64,marginBottom:20}}>✅</div>
                  <div style={{color:'#fff',fontSize:20,fontWeight:700,marginBottom:8}}>Attendance Submitted!</div>
                  <div style={{color:'rgba(255,255,255,0.4)',fontSize:13,marginBottom:24}}>
                    {attClass} · {new Date(attDate).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'})}
                  </div>
                  <div style={{display:'flex',gap:20,marginBottom:32}}>
                    {[
                      [attMode==='qr'?scannedNames.length:students.filter(s=>manualData[s.name]==='P').length,'Present','#4ade80'],
                      [attMode==='qr'?remainingStudents.length:students.filter(s=>manualData[s.name]==='A'||!manualData[s.name]).length,'Absent','#f87171'],
                      [students.filter(s=>manualData[s.name]==='L').length,'Leave','#fbbf24'],
                    ].map(([v,l,c])=>(
                      <div key={l} style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:'14px 24px',textAlign:'center'}}>
                        <div style={{fontSize:26,fontWeight:700,color:c}}>{v}</div>
                        <div style={{fontSize:11,color:'rgba(255,255,255,0.35)',marginTop:2}}>{l}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{display:'flex',gap:10}}>
                    <button onClick={resetAtt} style={{padding:'11px 24px',background:'linear-gradient(135deg,#0d2a1a,#1D9E75)',border:'none',borderRadius:10,color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer'}}>
                      ➕ Take Another Class
                    </button>
                    <button onClick={saveAndDownload} style={{padding:'11px 24px',background:'rgba(36,113,163,0.2)',border:'1px solid rgba(36,113,163,0.3)',borderRadius:10,color:'#60a5fa',fontSize:13,fontWeight:600,cursor:'pointer'}}>
                      💾 Download Record
                    </button>
                  </div>
                </div>
              );

              return null;
            })()}
          </div>

          {/* ASSIGNMENTS */}
          <div className={`panel ${activePane==='t-assign'?'active':''}`}>
            {(()=>{
              const [tAssignTab,setTAssignTab]=useState('list');
              const [tAssignments,setTAssignments]=useState([
                {id:1,subject:'Mathematics',cls:'FSc Pre-Eng Sec B',topic:'Chapter 5 — Polynomials',instructions:'Complete all exercises. Show all working.',dueDate:'15 Apr 2026',assignedTo:'Class',status:'Active',totalMarks:25},
                {id:2,subject:'Mathematics',cls:'FSc Pre-Eng Sec A',topic:'Trigonometry Practice',instructions:'Solve questions 1-20.',dueDate:'18 Apr 2026',assignedTo:'Class',status:'Active',totalMarks:20},
              ]);
              const [editingAssign,setEditingAssign]=useState(null);
              const [newAssign,setNewAssign]=useState({subject:'Mathematics',cls:'',topic:'',instructions:'',dueDate:'',assignedTo:'Class',totalMarks:25,file:null});
              const [submissions,setSubmissions]=useState([
                {id:1,student:'Laiba Imtiaz',roll:'FSc-B-041',assignment:'Chapter 5 — Polynomials',subject:'Mathematics',submittedOn:'3 Apr',pastedContent:'Here is my solution to Chapter 5... (student work)',file:'Laiba_Ch5.pdf',status:'Pending',marks:'',feedback:''},
                {id:2,student:'Sara Khan',roll:'FSc-B-042',assignment:'Chapter 5 — Polynomials',subject:'Mathematics',submittedOn:'3 Apr',pastedContent:'Solved all exercises. Answer to Q1: x=3...',file:'Sara_Ch5.pdf',status:'Pending',marks:'',feedback:''},
                {id:3,student:'Ali Hassan',roll:'FSc-B-043',assignment:'Chapter 5 — Polynomials',subject:'Mathematics',submittedOn:'4 Apr',pastedContent:'',file:'Ali_Ch5.pdf',status:'Checked',marks:'22',feedback:'Great work! Minor error in Q4.'},
              ]);
              const [gradingId,setGradingId]=useState(null);
              const [tempMarks,setTempMarks]=useState('');
              const [tempFeedback,setTempFeedback]=useState('');
              const [viewingSubmission,setViewingSubmission]=useState(null);
              const [pdfViewLocation,setPdfViewLocation]=useState(null);

              const tSubjects=['Mathematics','Physics','Chemistry','English','Biology','Computer','Urdu','Islamic Studies','Pak Studies'];

              const addOrUpdateAssign=()=>{
                if(!newAssign.topic.trim()||!newAssign.dueDate){ showToast('Fill topic and due date','⚠'); return; }
                if(editingAssign){
                  setTAssignments(prev=>prev.map(a=>a.id===editingAssign.id?{...a,...newAssign}:a));
                  showToast('Assignment updated!'); setEditingAssign(null);
                } else {
                  setTAssignments(prev=>[...prev,{id:Date.now(),...newAssign}]);
                  showToast('Assignment created and assigned!');
                }
                setNewAssign({subject:'Mathematics',cls:'',topic:'',instructions:'',dueDate:'',assignedTo:'Class',totalMarks:25,file:null});
                setTAssignTab('list');
              };
              const deleteAssign=(id)=>{ setTAssignments(prev=>prev.filter(a=>a.id!==id)); showToast('Assignment deleted.','🗑'); };
              const startEdit=(a)=>{ setNewAssign({...a}); setEditingAssign(a); setTAssignTab('create'); };

              const saveGrade=()=>{
                if(!tempMarks){ showToast('Enter marks','⚠'); return; }
                setSubmissions(prev=>prev.map(s=>s.id===gradingId?{...s,marks:tempMarks,feedback:tempFeedback,status:'Checked'}:s));
                setGradingId(null); setTempMarks(''); setTempFeedback('');
                showToast('✅ Grade and feedback saved successfully!');
              };
              const openPdfView=(s)=>{ setPdfViewLocation({student:s.student,file:s.file,location:'Teacher Assignment Review Panel > Submissions Tab'}); setViewingSubmission(s); };

              return(<>
                <div className="tab-row">{[['list','📋 Assignments'],['create',editingAssign?'✏️ Edit':'➕ Create New'],['submissions','📥 Submissions'],['grade','⭐ Grade']].map(([t,l])=><button key={t} className={`tab-btn ${tAssignTab===t?'active':''}`} onClick={()=>{setTAssignTab(t);if(t!=='create')setEditingAssign(null);}}>{l}</button>)}</div>

                {tAssignTab==='list'&&(<>
                  <div className="card"><div className="ct"><div className="ct-dot" style={{background:'#2471A3'}}></div>All Assignments ({tAssignments.length}) <button className="add-btn" style={{marginLeft:'auto'}} onClick={()=>{setEditingAssign(null);setNewAssign({subject:'Mathematics',cls:'',topic:'',instructions:'',dueDate:'',assignedTo:'Class',totalMarks:25,file:null});setTAssignTab('create');}}>+ Create New</button></div>
                    <table className="mt"><thead><tr><th>Subject</th><th>Class</th><th>Topic</th><th>Due Date</th><th>Assigned To</th><th>Marks</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>{tAssignments.map(a=>(
                      <tr key={a.id}>
                        <td>{a.subject}</td><td style={{fontSize:10}}>{a.cls}</td><td style={{maxWidth:120,fontSize:11}}>{a.topic}</td>
                        <td style={{fontSize:10}}>{a.dueDate}</td><td style={{fontSize:10}}>{a.assignedTo}</td>
                        <td>/{a.totalMarks}</td>
                        <td><span className={`badge ${a.status==='Active'?'bg':'bb'}`}>{a.status}</span></td>
                        <td style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                          <button className="d-btn d-btn-blue" style={{fontSize:'9px',padding:'2px 7px'}} onClick={()=>startEdit(a)}>✎ Edit</button>
                          <button className="d-btn d-btn-red" style={{fontSize:'9px',padding:'2px 7px'}} onClick={()=>deleteAssign(a.id)}>🗑</button>
                        </td>
                      </tr>
                    ))}</tbody></table>
                  </div>
                </>)}

                {tAssignTab==='create'&&(
                  <div className="card">
                    <div className="ct"><div className="ct-dot" style={{background:'#1D9E75'}}></div>{editingAssign?'✏️ Edit Assignment':'➕ Create New Assignment'}</div>
                    <div className="form-row">
                      <div className="f-group"><div className="f-lab">Subject *</div>
                        <select className="d-select" style={{marginBottom:0}} value={newAssign.subject} onChange={e=>setNewAssign({...newAssign,subject:e.target.value})}>
                          {tSubjects.map(s=><option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="f-group"><div className="f-lab">Assign To Class *</div>
                        <select className="d-select" style={{marginBottom:0}} value={newAssign.cls} onChange={e=>setNewAssign({...newAssign,cls:e.target.value})}>
                          <option value="">— Select Class —</option>
                          {myClasses.map(c=><option key={c.name}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="f-group"><div className="f-lab">Assign To</div>
                        <select className="d-select" style={{marginBottom:0}} value={newAssign.assignedTo} onChange={e=>setNewAssign({...newAssign,assignedTo:e.target.value})}>
                          <option>Class</option><option>Group A</option><option>Group B</option><option>Individual</option>
                        </select>
                      </div>
                    </div>
                    <div className="f-group"><div className="f-lab">Topic / Title *</div><input className="f-inp" style={{width:'100%'}} placeholder="e.g. Chapter 5 — Polynomials" value={newAssign.topic} onChange={e=>setNewAssign({...newAssign,topic:e.target.value})}/></div>
                    <div className="f-group"><div className="f-lab">Instructions</div><textarea className="f-inp" style={{width:'100%',minHeight:70,resize:'vertical'}} placeholder="e.g. Complete all exercises. Show working." value={newAssign.instructions} onChange={e=>setNewAssign({...newAssign,instructions:e.target.value})}/></div>
                    <div className="form-row">
                      <div className="f-group"><div className="f-lab">Due Date *</div><input type="date" className="f-inp" style={{width:'100%'}} value={newAssign.dueDate} onChange={e=>setNewAssign({...newAssign,dueDate:e.target.value})}/></div>
                      <div className="f-group"><div className="f-lab">Total Marks</div><input type="number" className="f-inp" style={{width:'100%'}} value={newAssign.totalMarks} onChange={e=>setNewAssign({...newAssign,totalMarks:e.target.value})}/></div>
                    </div>
                    <div className="f-lab" style={{marginBottom:4}}>Upload Assignment File (PDF/Word/Image)</div>
                    <label htmlFor="teacher-assign-file" style={{display:'block',cursor:'pointer'}}>
                      <div className="d-upload" style={{marginBottom:12}}>
                        {newAssign.file?`📎 ${newAssign.file} (ready)`:'📎 Click to select file from PC (Downloads, Desktop, etc.)'}
                      </div>
                    </label>
                    <input id="teacher-assign-file" type="file" accept="*/*" style={{display:'none'}} onChange={e=>{const f=e.target.files[0];if(f){setNewAssign({...newAssign,file:f.name});showToast(`📎 File selected: ${f.name}`);}}}/>
                    <div className="f-group"><div className="f-lab">Or Paste Assignment Content Here</div>
                      <textarea className="f-inp" style={{width:'100%',minHeight:80,resize:'vertical'}} placeholder="Assignment content paste karein..." value={newAssign.pastedContent||''} onChange={e=>setNewAssign({...newAssign,pastedContent:e.target.value})}/>
                    </div>
                    <div style={{display:'flex',gap:8}}>
                      <button className="d-btn d-btn-green" onClick={addOrUpdateAssign}>{editingAssign?'💾 Update Assignment':'📤 Create & Assign'}</button>
                      <button className="d-btn d-btn-blue" onClick={()=>{setEditingAssign(null);setTAssignTab('list');}}>Cancel</button>
                    </div>
                  </div>
                )}

                {tAssignTab==='submissions'&&(<>
                  {viewingSubmission&&pdfViewLocation&&(
                    <div style={{position:'fixed',inset:0,background:'rgba(5,10,24,0.92)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(6px)',animation:'fadeIn 0.15s ease'}}>
                      <div style={{background:'#0d1f3c',border:'1px solid rgba(255,255,255,0.1)',borderRadius:16,width:'min(700px,95vw)',maxHeight:'88vh',display:'flex',flexDirection:'column',animation:'slideUp 0.2s ease',overflow:'hidden'}}>
                        {/* Header */}
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 20px',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
                          <div>
                            <div style={{color:'#fff',fontSize:14,fontWeight:600}}>📄 {pdfViewLocation.file}</div>
                            <div style={{fontSize:10,color:'rgba(255,255,255,0.35)',marginTop:2}}>Student: {pdfViewLocation.student}</div>
                          </div>
                          <button onClick={()=>{setViewingSubmission(null);setPdfViewLocation(null);}} style={{background:'rgba(255,255,255,0.07)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,color:'rgba(255,255,255,0.6)',cursor:'pointer',fontSize:16,width:32,height:32,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
                        </div>
                        {/* PDF Content Area */}
                        <div style={{flex:1,overflowY:'auto',padding:'20px 24px'}}>
                          {viewingSubmission.uploadedFile ? (
                            <iframe
                              src={URL.createObjectURL(viewingSubmission.uploadedFile)}
                              style={{width:'100%',height:'500px',border:'none',borderRadius:8,background:'#fff'}}
                              title="PDF Preview"
                            />
                          ) : viewingSubmission.pastedContent ? (
                            <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:10,padding:'20px 24px',fontSize:13,color:'rgba(255,255,255,0.7)',lineHeight:1.85,whiteSpace:'pre-wrap',minHeight:300}}>
                              {viewingSubmission.pastedContent}
                            </div>
                          ) : (
                            <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'60px 20px',color:'rgba(255,255,255,0.3)'}}>
                              <div style={{fontSize:48,marginBottom:16}}>📎</div>
                              <div style={{fontSize:13,fontWeight:600,marginBottom:6,color:'rgba(255,255,255,0.5)'}}>File: {pdfViewLocation.file}</div>
                              <div style={{fontSize:11,textAlign:'center',lineHeight:1.8}}>This submission was uploaded as a file.<br/>In the live system, the actual PDF would display here.</div>
                            </div>
                          )}
                        </div>
                        {/* Footer actions */}
                        <div style={{padding:'12px 20px',borderTop:'1px solid rgba(255,255,255,0.07)',display:'flex',gap:8,justifyContent:'flex-end'}}>
                          <button className="d-btn d-btn-green" onClick={()=>{setGradingId(viewingSubmission.id);setTempMarks(viewingSubmission.marks||'');setTempFeedback(viewingSubmission.feedback||'');setViewingSubmission(null);setPdfViewLocation(null);setTAssignTab('grade');}}>⭐ Grade This</button>
                          <button className="d-btn d-btn-blue" onClick={()=>{setViewingSubmission(null);setPdfViewLocation(null);}}>Close</button>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="card"><div className="ct"><div className="ct-dot" style={{background:'#2471A3'}}></div>Student Submissions ({submissions.length})</div>
                    <table className="mt"><thead><tr><th>Student</th><th>Roll</th><th>Assignment</th><th>Submitted</th><th>Content</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>{submissions.map(s=>(
                      <tr key={s.id}>
                        <td>{s.student}</td><td style={{fontSize:10}}>{s.roll}</td><td style={{fontSize:10,maxWidth:110}}>{s.assignment}</td>
                        <td style={{fontSize:10}}>{s.submittedOn}</td>
                        <td style={{fontSize:10,color:'rgba(255,255,255,0.4)',maxWidth:100}}>{s.pastedContent?s.pastedContent.substring(0,40)+'...':'—'}</td>
                        <td><span className={`badge ${s.status==='Checked'?'bg':'bb'}`}>{s.status}</span></td>
                        <td style={{display:'flex',gap:3,flexWrap:'wrap'}}>
                          <button className="d-btn d-btn-blue" style={{fontSize:'9px',padding:'2px 7px'}} onClick={()=>openPdfView(s)}>👁 View PDF</button>
                          <button className="d-btn d-btn-green" style={{fontSize:'9px',padding:'2px 7px'}} onClick={()=>handleDownload(s.file,s.pastedContent)}>⬇</button>
                          <button className="d-btn" style={{background:'rgba(212,172,13,0.12)',color:'#D4AC0D',border:'1px solid rgba(212,172,13,0.25)',borderRadius:5,padding:'2px 7px',fontSize:'9px',cursor:'pointer'}} onClick={()=>{setGradingId(s.id);setTempMarks(s.marks||'');setTempFeedback(s.feedback||'');setTAssignTab('grade');}}>⭐ Grade</button>
                        </td>
                      </tr>
                    ))}</tbody></table>
                  </div>
                </>)}

                {tAssignTab==='grade'&&(<>
                  <div className="card"><div className="ct"><div className="ct-dot" style={{background:'#D4AC0D'}}></div>Grade Submissions — Marks + Feedback</div>
                    {submissions.map(s=>(
                      <div key={s.id} style={{borderBottom:'1px solid rgba(255,255,255,0.06)',paddingBottom:14,marginBottom:14}}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:8,flexWrap:'wrap',gap:6}}>
                          <div><div className="user-name">{s.student} <span style={{fontSize:10,color:'rgba(255,255,255,0.3)'}}>{s.roll}</span></div><div className="user-detail">{s.assignment} · Submitted: {s.submittedOn}</div></div>
                          <div style={{display:'flex',gap:6,alignItems:'center'}}>
                            <span className={`badge ${s.status==='Checked'?'bg':'bb'}`}>{s.status}</span>
                            <button className="d-btn d-btn-blue" style={{fontSize:'9px',padding:'2px 8px'}} onClick={()=>openPdfView(s)}>👁 View PDF</button>
                          </div>
                        </div>
                        {s.pastedContent&&<div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.05)',borderRadius:6,padding:'8px 10px',fontSize:10.5,color:'rgba(255,255,255,0.4)',marginBottom:8,maxHeight:60,overflow:'hidden'}}>{s.pastedContent.substring(0,150)}...</div>}
                        <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                          <div style={{display:'flex',alignItems:'center',gap:4}}>
                            <input className="f-inp" style={{width:65,textAlign:'center'}} placeholder="Marks" type="number"
                              value={gradingId===s.id?tempMarks:s.marks}
                              onChange={e=>{if(gradingId===s.id)setTempMarks(e.target.value);}}
                              onFocus={()=>{setGradingId(s.id);setTempMarks(s.marks||'');setTempFeedback(s.feedback||'');}}
                            />
                            <span style={{color:'rgba(255,255,255,0.3)',fontSize:12}}>/{tAssignments.find(a=>a.topic===s.assignment)?.totalMarks||25}</span>
                          </div>
                          <select className="d-select" style={{width:80,marginBottom:0,fontSize:11}} onChange={e=>{if(gradingId===s.id)setTempFeedback(e.target.value+' '+tempFeedback);}}>
                            <option value="">Grade →</option>
                            {['A+','A','B+','B','C','D','F'].map(g=><option key={g} value={g}>{g}</option>)}
                          </select>
                          <input className="f-inp" style={{flex:1,minWidth:140}} placeholder="Feedback for student..."
                            value={gradingId===s.id?tempFeedback:s.feedback}
                            onChange={e=>{if(gradingId===s.id)setTempFeedback(e.target.value);}}
                            onFocus={()=>{setGradingId(s.id);setTempMarks(s.marks||'');setTempFeedback(s.feedback||'');}}
                          />
                          <button className="d-btn d-btn-green" style={{whiteSpace:'nowrap'}} onClick={()=>{
                            if(gradingId!==s.id){setGradingId(s.id);setTempMarks(s.marks||'');setTempFeedback(s.feedback||'');showToast('Click save after entering marks & feedback'); return;}
                            saveGrade();
                          }}>💾 Save</button>
                        </div>
                        {s.status==='Checked'&&s.marks&&<div style={{marginTop:6,fontSize:10,color:'#4ade80'}}>✅ Graded: {s.marks}/{tAssignments.find(a=>a.topic===s.assignment)?.totalMarks||25} — {s.feedback}</div>}
                      </div>
                    ))}
                  </div>
                </>)}
              </>);
            })()}
          </div>

          {/* RESULTS */}
          <div className={`panel ${activePane==='t-result'?'active':''}`}>
            {(()=>{
              const [examType,setExamType]=useState('Monthly Test');
              const [examClass,setExamClass]=useState(myClasses[0]?.name||'FSc Pre-Eng Sec A');
              const [totalMarks,setTotalMarks]=useState(100);
              const [resultRows,setResultRows]=useState(students.map(s=>({name:s.name,roll:s.roll,marks:s.marks,grade:s.grade})));
              const [showAddRow,setShowAddRow]=useState(false);
              const [newRow,setNewRow]=useState({name:'',roll:'',marks:0});
              const [editIdx,setEditIdx]=useState(null);
              const [editRow,setEditRow]=useState(null);
              const calcGrade=(m,t)=>{ const p=t>0?m/t*100:0; if(p>=90)return'A+'; if(p>=80)return'A'; if(p>=70)return'B+'; if(p>=60)return'B'; if(p>=50)return'C'; if(p>=40)return'D'; return'F'; };
              const updateMark=(i,val)=>{ setResultRows(prev=>{ const r=[...prev]; const m=Math.min(Number(val),totalMarks); r[i]={...r[i],marks:isNaN(m)?0:m,grade:calcGrade(isNaN(m)?0:m,totalMarks)}; return r; }); };
              const addRow=()=>{ if(!newRow.name.trim()){ showToast('Enter student name','⚠'); return; } const m=Math.min(Number(newRow.marks)||0,totalMarks); setResultRows(prev=>[...prev,{name:newRow.name,roll:newRow.roll||`NEW-${Date.now()}`,marks:m,grade:calcGrade(m,totalMarks)}]); setNewRow({name:'',roll:'',marks:0}); setShowAddRow(false); showToast('Student added to result!'); };
              const deleteRow=(i)=>{ setResultRows(prev=>prev.filter((_,idx)=>idx!==i)); showToast('Student removed from result.','🗑'); };
              const startEdit=(i)=>{ setEditIdx(i); setEditRow({...resultRows[i]}); };
              const saveEdit=()=>{ const m=Math.min(Number(editRow.marks)||0,totalMarks); setResultRows(prev=>{ const r=[...prev]; r[editIdx]={...editRow,marks:m,grade:calcGrade(m,totalMarks)}; return r; }); setEditIdx(null); setEditRow(null); showToast('Result updated!'); };
              const saveAndDownload=()=>{
                const date=new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'});
                const rowsHtml=resultRows.map((r,i)=>{
                  const pct=Math.round(r.marks/totalMarks*100);
                  const statusCol=pct>=40?'#166534':'#b91c1c';
                  return `<tr style="background:${i%2===0?'#fafafa':'#fff'}">
                    <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;font-family:'Times New Roman',serif;font-size:14pt">${r.name}</td>
                    <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;font-family:'Times New Roman',serif;font-size:12pt;color:#555">${r.roll}</td>
                    <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;text-align:center;font-family:'Times New Roman',serif;font-size:14pt;font-weight:bold;color:#1a3a6e">${r.marks}</td>
                    <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;text-align:center;font-family:'Times New Roman',serif;font-size:14pt">${totalMarks}</td>
                    <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;text-align:center;font-family:'Times New Roman',serif;font-size:14pt;font-weight:bold">${pct}%</td>
                    <td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;text-align:center"><span style="font-family:'Times New Roman',serif;font-size:13pt;font-weight:bold;color:${statusCol}">${pct>=40?'PASS':'FAIL'}</span></td>
                  </tr>`;
                }).join('');
                const passCount=resultRows.filter(r=>r.marks>=totalMarks*0.4).length;
                const failCount=resultRows.filter(r=>r.marks<totalMarks*0.4).length;
                const avgMks=resultRows.length>0?Math.round(resultRows.reduce((a,r)=>a+r.marks,0)/resultRows.length):0;
                const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Result Sheet — ${examType} — ${examClass}</title></head>
<body style="font-family:'Times New Roman',Times,serif;margin:0;padding:0;background:#f5f5f5">
<div style="max-width:800px;margin:30px auto;background:#fff;box-shadow:0 2px 20px rgba(0,0,0,0.1)">
  <div style="background:linear-gradient(135deg,#0f2444,#1a3a6e);padding:28px 36px;color:#fff;text-align:center">
    <div style="font-size:26pt;font-weight:bold;font-family:'Times New Roman',serif;margin-bottom:6px">Punjab Group of Colleges</div>
    <div style="font-size:14pt;font-family:'Times New Roman',serif;opacity:0.8">Gujrat Campus, Punjab, Pakistan</div>
    <div style="font-size:12pt;opacity:0.6;margin-top:4px">www.pgc.edu.pk | info@pgc.edu.pk | +92-53-3720000</div>
    <div style="margin-top:14px;border-top:1px solid rgba(255,255,255,0.3);padding-top:14px">
      <div style="font-size:18pt;font-weight:bold;font-family:'Times New Roman',serif">RESULT SHEET</div>
      <div style="font-size:14pt;font-family:'Times New Roman',serif;opacity:0.75;margin-top:4px">${examType}</div>
    </div>
  </div>
  <div style="padding:16px 36px;background:#f9fafb;border-bottom:2px solid #e5e7eb;display:flex;gap:20px;flex-wrap:wrap">
    <div><div style="font-size:11pt;color:#6b7280;font-family:'Times New Roman',serif;text-transform:uppercase;letter-spacing:0.06em">Class</div><div style="font-size:14pt;font-weight:bold;color:#0f2444;font-family:'Times New Roman',serif">${examClass}</div></div>
    <div><div style="font-size:11pt;color:#6b7280;font-family:'Times New Roman',serif;text-transform:uppercase;letter-spacing:0.06em">Total Marks</div><div style="font-size:14pt;font-weight:bold;color:#0f2444;font-family:'Times New Roman',serif">${totalMarks}</div></div>
    <div><div style="font-size:11pt;color:#6b7280;font-family:'Times New Roman',serif;text-transform:uppercase;letter-spacing:0.06em">Date</div><div style="font-size:14pt;font-weight:bold;color:#0f2444;font-family:'Times New Roman',serif">${date}</div></div>
    <div><div style="font-size:11pt;color:#6b7280;font-family:'Times New Roman',serif;text-transform:uppercase;letter-spacing:0.06em">Teacher</div><div style="font-size:14pt;font-weight:bold;color:#0f2444;font-family:'Times New Roman',serif">Sir Asif Mehmood</div></div>
  </div>
  <div style="padding:24px 36px">
    <div style="font-size:18pt;font-weight:bold;font-family:'Times New Roman',serif;color:#0f2444;margin-bottom:14px;border-bottom:2px solid #0f2444;padding-bottom:8px">Student Results — ${examType}</div>
    <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb">
      <thead><tr style="background:#0f2444;color:#fff">
        <th style="padding:12px 16px;text-align:left;font-size:14pt;font-family:'Times New Roman',serif;font-weight:bold">Student Name</th>
        <th style="padding:12px 16px;text-align:left;font-size:14pt;font-family:'Times New Roman',serif;font-weight:bold">Roll No</th>
        <th style="padding:12px 16px;text-align:center;font-size:14pt;font-family:'Times New Roman',serif;font-weight:bold">Marks</th>
        <th style="padding:12px 16px;text-align:center;font-size:14pt;font-family:'Times New Roman',serif;font-weight:bold">Total</th>
        <th style="padding:12px 16px;text-align:center;font-size:14pt;font-family:'Times New Roman',serif;font-weight:bold">%</th>
        <th style="padding:12px 16px;text-align:center;font-size:14pt;font-family:'Times New Roman',serif;font-weight:bold">Result</th>
      </tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>
    <div style="margin-top:16px;background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:8px;padding:14px 20px;display:flex;gap:24px;flex-wrap:wrap">
      <div><div style="font-size:11pt;color:#6b7280;font-family:'Times New Roman',serif;text-transform:uppercase">Total Students</div><div style="font-size:16pt;font-weight:bold;color:#1a3a6e;font-family:'Times New Roman',serif">${resultRows.length}</div></div>
      <div><div style="font-size:11pt;color:#6b7280;font-family:'Times New Roman',serif;text-transform:uppercase">Pass</div><div style="font-size:16pt;font-weight:bold;color:#166534;font-family:'Times New Roman',serif">${passCount}</div></div>
      <div><div style="font-size:11pt;color:#6b7280;font-family:'Times New Roman',serif;text-transform:uppercase">Fail</div><div style="font-size:16pt;font-weight:bold;color:#b91c1c;font-family:'Times New Roman',serif">${failCount}</div></div>
      <div><div style="font-size:11pt;color:#6b7280;font-family:'Times New Roman',serif;text-transform:uppercase">Class Average</div><div style="font-size:16pt;font-weight:bold;color:#1a3a6e;font-family:'Times New Roman',serif">${avgMks}/${totalMarks}</div></div>
    </div>
  </div>
  <div style="background:#f9fafb;border-top:2px solid #e5e7eb;padding:16px 36px;display:flex;justify-content:space-between;align-items:center">
    <div style="font-size:12pt;color:#6b7280;font-family:'Times New Roman',serif">Punjab Group of Colleges, Gujrat — Official Result Sheet</div>
    <button onclick="window.print()" style="background:#0f2444;color:#fff;border:none;padding:10px 22px;border-radius:6px;font-size:13pt;font-family:'Times New Roman',serif;font-weight:bold;cursor:pointer">🖨 Print / Save PDF</button>
  </div>
</div>
</body></html>`;
                const blob=new Blob([html],{type:'text/html'});
                const url=URL.createObjectURL(blob);
                const a=document.createElement('a');
                a.href=url;
                a.download=`Result_${examType.replace(/ /g,'_')}_${examClass.replace(/ /g,'_')}.html`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                showToast('✅ Result downloaded — open in browser to Print/Save PDF');
              };
              return(<>
                <div className="card">
                  <div className="ct"><div className="ct-dot" style={{background:'#D4AC0D'}}></div>Result Entry — Mathematics
                    <button className="add-btn" style={{marginLeft:'auto'}} onClick={()=>setShowAddRow(v=>!v)}>+ Add Student</button>
                  </div>
                  <div className="form-row" style={{marginBottom:12,gap:12}}>
                    <div style={{flex:1}}>
                      <div className="f-lab">Exam Type (type anything)</div>
                      <input className="f-inp" style={{width:'100%',marginTop:4}} placeholder="e.g. December Test, Phase 1, Quiz..." value={examType} onChange={e=>setExamType(e.target.value)}/>
                    </div>
                    <div style={{flex:1}}>
                      <div className="f-lab">Class (type or pick)</div>
                      <input className="f-inp" style={{width:'100%',marginTop:4}} placeholder="e.g. FSc Pre-Eng Sec A" value={examClass} onChange={e=>setExamClass(e.target.value)} list="class-list-res"/>
                      <datalist id="class-list-res">{myClasses.map(c=><option key={c.name} value={c.name}/>)}</datalist>
                    </div>
                    <div style={{width:110}}>
                      <div className="f-lab">Total Marks</div>
                      <input className="f-inp" type="number" style={{width:'100%',marginTop:4}} min="0" max="1000" value={totalMarks} onChange={e=>{ const t=parseInt(e.target.value)||100; setTotalMarks(t); setResultRows(prev=>prev.map(r=>({...r,grade:calcGrade(r.marks,t)}))); }}/>
                    </div>
                  </div>

                  {showAddRow&&<div className="mini-form" style={{marginBottom:12}}>
                    <div style={{color:'var(--white2)',fontSize:12,fontWeight:600,marginBottom:10}}>Add Student to Result</div>
                    <div className="form-row">
                      <div className="f-group"><div className="f-lab">Student Name *</div><input className="f-inp" style={{width:'100%'}} placeholder="Full name" value={newRow.name} onChange={e=>setNewRow({...newRow,name:e.target.value})}/></div>
                      <div className="f-group"><div className="f-lab">Roll No</div><input className="f-inp" style={{width:'100%'}} placeholder="e.g. FSc-B-050" value={newRow.roll} onChange={e=>setNewRow({...newRow,roll:e.target.value})}/></div>
                      <div className="f-group"><div className="f-lab">Marks Obtained</div><input className="f-inp" type="number" style={{width:'100%'}} min="0" max={totalMarks} value={newRow.marks} onChange={e=>setNewRow({...newRow,marks:e.target.value})}/></div>
                    </div>
                    <div style={{display:'flex',gap:8}}><button className="d-btn d-btn-green" onClick={addRow}>Add</button><button className="d-btn d-btn-blue" onClick={()=>setShowAddRow(false)}>Cancel</button></div>
                  </div>}

                  {editIdx!==null&&editRow&&<div className="mini-form" style={{marginBottom:12}}>
                    <div style={{color:'var(--white2)',fontSize:12,fontWeight:600,marginBottom:10}}>Edit: {editRow.name}</div>
                    <div className="form-row">
                      <div className="f-group"><div className="f-lab">Student Name</div><input className="f-inp" style={{width:'100%'}} value={editRow.name} onChange={e=>setEditRow({...editRow,name:e.target.value})}/></div>
                      <div className="f-group"><div className="f-lab">Roll No</div><input className="f-inp" style={{width:'100%'}} value={editRow.roll} onChange={e=>setEditRow({...editRow,roll:e.target.value})}/></div>
                      <div className="f-group"><div className="f-lab">Marks (out of {totalMarks})</div><input className="f-inp" type="number" style={{width:'100%'}} min="0" max={totalMarks} value={editRow.marks} onChange={e=>setEditRow({...editRow,marks:e.target.value})}/></div>
                    </div>
                    <div style={{display:'flex',gap:8}}><button className="d-btn d-btn-green" onClick={saveEdit}>Save</button><button className="d-btn d-btn-blue" onClick={()=>{setEditIdx(null);setEditRow(null);}}>Cancel</button></div>
                  </div>}

                  <table className="mt">
                    <thead><tr><th>Student</th><th>Roll No</th><th>Marks</th><th>Total</th><th>Grade</th><th>Actions</th></tr></thead>
                    <tbody>{resultRows.map((r,i)=>(<tr key={i}>
                      <td>{r.name}</td>
                      <td style={{fontSize:10,color:'rgba(255,255,255,0.4)'}}>{r.roll}</td>
                      <td><input className="f-inp" type="number" min="0" max={totalMarks} value={r.marks} style={{width:60}} onChange={e=>updateMark(i,e.target.value)}/></td>
                      <td style={{color:'rgba(255,255,255,0.4)',fontSize:11}}>{totalMarks}</td>
                      <td><span className={`badge ${getGradeColor(r.grade)}`}>{r.grade}</span></td>
                      <td><div style={{display:'flex',gap:4}}>
                        <button className="d-btn d-btn-blue" style={{fontSize:'9px',padding:'2px 7px'}} onClick={()=>startEdit(i)}>✎ Edit</button>
                        <button className="d-btn d-btn-red" style={{fontSize:'9px',padding:'2px 7px'}} onClick={()=>deleteRow(i)}>✕ Remove</button>
                      </div></td>
                    </tr>))}</tbody>
                  </table>
                  <div style={{marginTop:12,display:'flex',gap:8,flexWrap:'wrap',alignItems:'center'}}>
                    <button className="d-btn d-btn-green" onClick={saveAndDownload}>💾 Save & Download Result</button>
                    <span style={{fontSize:10,color:'rgba(255,255,255,0.3)'}}>File will download to your PC automatically</span>
                  </div>
                  <div style={{marginTop:10,padding:'8px 12px',background:'rgba(36,113,163,0.1)',borderRadius:8,border:'1px solid rgba(36,113,163,0.2)',fontSize:10.5,color:'rgba(255,255,255,0.4)'}}>
                    📊 <strong style={{color:'rgba(255,255,255,0.6)'}}>Summary:</strong> &nbsp;
                    Students: {resultRows.length} &nbsp;|&nbsp;
                    Pass: <span style={{color:'#4ade80'}}>{resultRows.filter(r=>r.marks>=totalMarks*0.4).length}</span> &nbsp;|&nbsp;
                    Fail: <span style={{color:'#f87171'}}>{resultRows.filter(r=>r.marks<totalMarks*0.4).length}</span> &nbsp;|&nbsp;
                    Avg: <span style={{color:'#fbbf24'}}>{resultRows.length>0?Math.round(resultRows.reduce((a,r)=>a+r.marks,0)/resultRows.length):0}/{totalMarks}</span>
                  </div>
                </div>
              </>);
            })()}
          </div>

          {/* STUDENT MODULE */}
          <div className={`panel ${activePane==='t-students'?'active':''}`}>
            {(()=>{
              const [stuModTab,setStuModTab]=useState('list');
              const [selectedStudent,setSelectedStudent]=useState(null);

              return(<>
                <div style={{display:'flex',gap:10,marginBottom:12,alignItems:'center',flexWrap:'wrap'}}>
                  <div style={{color:'var(--white2)',fontSize:14,fontWeight:600}}>👩‍🎓 Student Module</div>
                  <select className="d-select" style={{marginBottom:0,fontSize:11,minWidth:200}} value={attClass} onChange={e=>setAttClass(e.target.value)}>
                    {myClasses.map(c=><option key={c.name} value={c.name}>{c.name} — {c.subject} ({c.students} students)</option>)}
                  </select>
                  <button className="add-btn" onClick={()=>setShowAddStudent(!showAddStudent)}>+ Add Student</button>
                </div>

                {/* Add student form */}
                {showAddStudent&&(<div className="mini-form" style={{marginBottom:12}}>
                  <div style={{color:'var(--white2)',fontSize:12,fontWeight:600,marginBottom:12}}>Add New Student to {attClass}</div>
                  <div className="form-row">
                    <div className="f-group"><div className="f-lab">Full Name *</div><input className="f-inp" style={{width:'100%'}} placeholder="Student name" value={newStudent.name} onChange={e=>setNewStudent({...newStudent,name:e.target.value})}/></div>
                    <div className="f-group"><div className="f-lab">Roll No *</div><input className="f-inp" style={{width:'100%'}} placeholder="e.g. FSc-B-050" value={newStudent.roll} onChange={e=>setNewStudent({...newStudent,roll:e.target.value})}/></div>
                  </div>
                  <div style={{display:'flex',gap:8}}><button className="d-btn d-btn-green" onClick={addStudent}>Add Student</button><button className="d-btn d-btn-blue" onClick={()=>setShowAddStudent(false)}>Cancel</button></div>
                </div>)}

                <div className="tab-row">
                  {[['list','📋 Student List'],['profiles','👤 Class Profiles'],['performance','📊 Performance']].map(([t,l])=>(
                    <button key={t} className={`tab-btn ${stuModTab===t?'active':''}`} onClick={()=>{setStuModTab(t);setSelectedStudent(null);}}>{l}</button>
                  ))}
                </div>

                {stuModTab==='list'&&(<>
                  <div className="search-bar">
                    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="14" height="14"><circle cx="6" cy="6" r="4.5"/><line x1="9.2" y1="9.2" x2="13" y2="13"/></svg>
                    <input placeholder="Search by name or roll number..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
                  </div>
                  <div className="card">
                    <div className="ct"><div className="ct-dot" style={{background:'#2471A3'}}></div>Student List — {attClass} <span style={{marginLeft:'auto',color:'rgba(255,255,255,0.3)',fontSize:10}}>{filteredStudents.length} students</span></div>
                    {filteredStudents.map(s=>(<div className="user-row" key={s.roll} style={{cursor:'pointer'}} onClick={()=>{setStuModTab('profiles');setSelectedStudent(s);}}>
                      <div className="user-av" style={{background:'rgba(36,113,163,0.3)'}}>{s.name[0]}</div>
                      <div><div className="user-name">{s.name}</div><div className="user-detail">{s.roll}</div></div>
                      <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:10}}>
                        <div style={{textAlign:'right'}}><div style={{fontSize:11,color:'rgba(255,255,255,0.4)'}}>Att: <span style={{color:'#4ade80'}}>{s.attend}%</span></div><div style={{fontSize:11,color:'rgba(255,255,255,0.4)'}}>Marks: <span style={{color:'#60a5fa'}}>{s.marks}</span></div></div>
                        <span className={`badge ${getGradeColor(s.grade)}`}>{s.grade}</span>
                        <button className="delete-btn" onClick={e=>{e.stopPropagation();deleteStudent(s.roll);}}>Remove</button>
                      </div>
                    </div>))}
                  </div>
                </>)}

                {stuModTab==='profiles'&&(
                  <div>
                    {selectedStudent?(
                      <div className="card">
                        <div className="ct"><div className="ct-dot" style={{background:'#2471A3'}}></div>
                          <button style={{background:'none',border:'none',color:'#60a5fa',cursor:'pointer',fontSize:11,padding:'0 6px 0 0'}} onClick={()=>setSelectedStudent(null)}>← Back</button>
                          Student Profile — {selectedStudent.name}
                        </div>
                        <div style={{display:'flex',gap:20,flexWrap:'wrap',marginBottom:14}}>
                          <div className="user-av" style={{background:'rgba(36,113,163,0.3)',width:52,height:52,fontSize:22,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,flexShrink:0}}>{selectedStudent.name[0]}</div>
                          <div style={{flex:1}}>
                            <div style={{color:'#fff',fontSize:15,fontWeight:700,marginBottom:2}}>{selectedStudent.name}</div>
                            <div style={{color:'rgba(255,255,255,0.45)',fontSize:11,marginBottom:2}}>Roll No: <span style={{color:'#60a5fa'}}>{selectedStudent.roll}</span></div>
                            <div style={{color:'rgba(255,255,255,0.45)',fontSize:11}}>Class: <span style={{color:'var(--white2)'}}>{attClass}</span></div>
                          </div>
                        </div>
                        <div className="analy-grid" style={{gridTemplateColumns:'repeat(3,1fr)',marginBottom:12}}>
                          <div className="analy-card"><div className="analy-val" style={{color:'#4ade80'}}>{selectedStudent.attend}%</div><div className="analy-lab">Attendance</div></div>
                          <div className="analy-card"><div className="analy-val" style={{color:'#60a5fa'}}>{selectedStudent.marks}</div><div className="analy-lab">Marks</div></div>
                          <div className="analy-card"><div className="analy-val"><span className={`badge ${getGradeColor(selectedStudent.grade)}`}>{selectedStudent.grade}</span></div><div className="analy-lab">Grade</div></div>
                        </div>
                        <div className="pr"><span className="pl">Attendance</span><div className="pb"><div className="pf" style={{width:`${selectedStudent.attend}%`,background:'#1D9E75'}}/></div><span className="pv">{selectedStudent.attend}%</span></div>
                        <div className="pr"><span className="pl">Academic Score</span><div className="pb"><div className="pf" style={{width:`${selectedStudent.marks}%`,background:'#2471A3'}}/></div><span className="pv">{selectedStudent.marks}%</span></div>
                        <div style={{marginTop:10,display:'flex',gap:8}}>
                          <button className="d-btn d-btn-blue" onClick={()=>setActivePane('t-attend')}>✍️ Mark Attendance</button>
                          <button className="d-btn d-btn-green" onClick={()=>setActivePane('t-result')}>📊 View Results</button>
                        </div>
                      </div>
                    ):(
                      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:12}}>
                        {filteredStudents.map(s=>(
                          <div key={s.roll} className="card" style={{cursor:'pointer',padding:16}} onClick={()=>setSelectedStudent(s)}>
                            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
                              <div className="user-av" style={{background:'rgba(36,113,163,0.3)',width:38,height:38,fontSize:16,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,flexShrink:0}}>{s.name[0]}</div>
                              <div><div style={{color:'#fff',fontSize:12,fontWeight:600}}>{s.name}</div><div style={{color:'rgba(255,255,255,0.35)',fontSize:9}}>{s.roll}</div></div>
                            </div>
                            <div style={{display:'flex',gap:10,justifyContent:'space-between'}}>
                              <div style={{fontSize:10,color:'rgba(255,255,255,0.4)'}}>Att: <span style={{color:'#4ade80',fontWeight:600}}>{s.attend}%</span></div>
                              <div style={{fontSize:10,color:'rgba(255,255,255,0.4)'}}>Marks: <span style={{color:'#60a5fa',fontWeight:600}}>{s.marks}%</span></div>
                              <span className={`badge ${getGradeColor(s.grade)}`} style={{fontSize:9}}>{s.grade}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {stuModTab==='performance'&&(
                  <div className="card">
                    <div className="ct"><div className="ct-dot" style={{background:'#D4AC0D'}}></div>Class Performance Overview — {attClass}</div>
                    <div className="chart-bar-wrap">
                      {filteredStudents.map((s,i)=>{
                        const colors=['#2471A3','#7F77DD','#D4AC0D','#1D9E75','#C0392B'];
                        return(<div className="chart-row" key={s.roll}>
                          <span className="chart-label">{s.name.split(' ')[0]}</span>
                          <div className="chart-bar-bg"><div className="chart-bar-fill" style={{width:`${s.marks}%`,background:colors[i%colors.length]}}><span style={{color:'rgba(255,255,255,0.9)'}}>{s.marks}%</span></div></div>
                          <span className="chart-val" style={{color:'#4ade80'}}>{s.attend}%</span>
                        </div>);
                      })}
                    </div>
                    <div style={{fontSize:10,color:'rgba(255,255,255,0.3)',marginTop:6}}>Bar = Marks % · Right value = Attendance %</div>
                  </div>
                )}
              </>);
            })()}
          </div>
          {/* TIMETABLE — reads from per-class admin-managed timetable */}
          <div className={`panel ${activePane==='t-tt'?'active':''}`}>
            <div className="card">
              <div className="ct"><div className="ct-dot" style={{background:'#7F77DD'}}></div>My Timetable
                <span style={{marginLeft:'auto',fontSize:10,color:'rgba(255,255,255,0.3)'}}>Managed by Admin · auto-synced</span>
              </div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.3)',marginBottom:12}}>
                📅 Your timetable is set by the admin. Slots with your name are highlighted. NEW badge = recently added by admin.
              </div>
              {(()=>{
                const myLastName=d.name.toLowerCase().split(' ').pop();
                const myTtChangelog=(ttChangelog||[]).filter(c=>c.subject&&c.subject.toLowerCase().includes(myLastName));
                const allClassEntries=Object.entries(classTimetables||{});
                const myClassEntries=allClassEntries.filter(([cls,rows])=>rows.some(row=>['Mon','Tue','Wed','Thu','Fri'].some(day=>row[day]&&row[day].toLowerCase().includes(myLastName))));
                const displayEntries=myClassEntries.length>0?myClassEntries:allClassEntries;
                if(displayEntries.length===0) return <div style={{textAlign:'center',padding:'30px 0',color:'rgba(255,255,255,0.25)',fontSize:12}}>No timetable entries yet. Please wait for admin to set the schedule.</div>;
                return(<>
                  {myTtChangelog.length>0&&(
                    <div style={{background:'rgba(29,131,72,0.08)',border:'1px solid rgba(29,131,72,0.2)',borderRadius:8,padding:'8px 12px',marginBottom:10,fontSize:11,color:'rgba(255,255,255,0.55)',display:'flex',alignItems:'center',gap:8}}>
                      <span>🔔</span><span><strong style={{color:'#4ade80'}}>{myTtChangelog.length} new slot{myTtChangelog.length>1?'s':''}</strong> assigned to you — marked <span style={{background:'#1D9E75',borderRadius:3,fontSize:8,padding:'1px 4px',color:'#fff',marginLeft:2}}>NEW</span></span>
                    </div>
                  )}
                  {displayEntries.map(([cls,rows])=>(
                    <div key={cls} style={{marginBottom:14}}>
                      <div style={{fontSize:11,color:'#4ade80',fontWeight:600,marginBottom:6}}>📚 {cls}</div>
                      <div className="tt-g">
                        <div className="tt-h"></div>
                        {['Mon','Tue','Wed','Thu','Fri'].map(dy=><div className="tt-h" key={dy}>{dy}</div>)}
                        {rows.map((row,i)=>(
                          <React.Fragment key={i}>
                            <div className="tt-t">{row.time}</div>
                            {['Mon','Tue','Wed','Thu','Fri'].map(day=>{
                              const cell=row[day]||'';
                              const isMySlot=cell.toLowerCase().includes(myLastName);
                              const isNew=myTtChangelog.some(c=>c.cls===cls&&c.time===row.time&&c.day===day);
                              return(
                                <div key={day} className={`tt-c ${cell?['tc1','tc2','tc3','tc4','tc5'][i%5]:'tt-e'}`}
                                  style={isMySlot?{outline:'2px solid #1D9E75',outlineOffset:'-2px',position:'relative'}:{position:'relative'}}>
                                  {cell}
                                  {isNew&&cell&&<span style={{position:'absolute',top:2,right:2,background:'#1D9E75',borderRadius:3,fontSize:7,padding:'1px 3px',color:'#fff',lineHeight:1}}>NEW</span>}
                                </div>
                              );
                            })}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div style={{fontSize:10,color:'rgba(255,255,255,0.22)',display:'flex',alignItems:'center',gap:6,marginTop:4}}>
                    <span style={{display:'inline-block',width:10,height:10,outline:'2px solid #1D9E75',borderRadius:2}}></span>
                    Highlighted slots are assigned to you
                  </div>
                </>);
              })()}
            </div>
          </div>

          {/* COURSE MODULE */}
          <div className={`panel ${activePane==='t-courses'?'active':''}`}>
            {(()=>{
              const [courseTab,setCourseTab]=useState('list');
              const [courses,setCourses]=useState([
                {id:1,name:'Mathematics',code:'MATH-301',class:'FSc Pre-Eng Sec B',chapters:12,progress:7,status:'Active',desc:'Algebra, Trigonometry, Calculus basics'},
                {id:2,name:'Mathematics',code:'MATH-302',class:'FSc Pre-Eng Sec A',chapters:12,progress:5,status:'Active',desc:'Polynomials, Sequences & Series'},
              ]);
              const [newCourse,setNewCourse]=useState({name:'',code:'',class:'',chapters:'',desc:'',status:'Active'});
              const [editingCourse,setEditingCourse]=useState(null);
              const [selCourse,setSelCourse]=useState(null);
              const [chapters,setChapters]=useState({
                1:[{id:1,title:'Ch 1 — Real Numbers',status:'Completed',notes:'Explained number types, irrational numbers covered.'},{id:2,title:'Ch 2 — Sets & Functions',status:'Completed',notes:'Domain, range, types of functions.'},{id:3,title:'Ch 3 — Limits',status:'In Progress',notes:'Currently on continuity section.'},{id:4,title:'Ch 4 — Differentiation',status:'Pending',notes:''},],
                2:[{id:1,title:'Ch 1 — Polynomials',status:'Completed',notes:'All exercises done.'},{id:2,title:'Ch 2 — Trigonometry',status:'In Progress',notes:'Working on identities.'},{id:3,title:'Ch 3 — Sequences',status:'Pending',notes:''},],
              });
              const [newChapter,setNewChapter]=useState({title:'',status:'Pending',notes:''});
              const [editingChap,setEditingChap]=useState(null);

              const addCourse=()=>{
                if(!newCourse.name.trim()||!newCourse.class.trim()){showToast('Fill Course Name and Class','⚠');return;}
                const id=Date.now();
                setCourses(p=>[...p,{...newCourse,id,chapters:parseInt(newCourse.chapters)||0,progress:0}]);
                setChapters(p=>({...p,[id]:[]}));
                setNewCourse({name:'',code:'',class:'',chapters:'',desc:'',status:'Active'});
                if(editingCourse)setEditingCourse(null);
                setCourseTab('list');showToast('Course added!');
              };
              const deleteCourse=(id)=>{setCourses(p=>p.filter(c=>c.id!==id));showToast('Course deleted.','🗑');};
              const startEdit=(c)=>{setNewCourse({...c});setEditingCourse(c);setCourseTab('add');};
              const updateCourse=()=>{
                setCourses(p=>p.map(c=>c.id===editingCourse.id?{...c,...newCourse}:c));
                setEditingCourse(null);setNewCourse({name:'',code:'',class:'',chapters:'',desc:'',status:'Active'});
                setCourseTab('list');showToast('Course updated!');
              };
              const [uploadedFiles,setUploadedFiles]=useState({
                1:[{id:1,name:'Chapter_1_Real_Numbers_Notes.pdf',uploadedOn:'01 Apr 2026',size:'1.2 MB',uploadedFile:null}],
                2:[{id:1,name:'Polynomials_Practice_Questions.pdf',uploadedOn:'28 Mar 2026',size:'0.8 MB',uploadedFile:null}],
              });
              const [newUpload,setNewUpload]=useState({name:'',file:null,fileName:''});
              const handleFileUpload=(e)=>{
                const f=e.target.files[0];
                if(!f)return;
                if(f.size>20*1024*1024){showToast('File too large. Max 20MB.','⚠');return;}
                setNewUpload({name:f.name.replace(/\.[^.]+$/,''),file:f,fileName:f.name});
                showToast(`📎 ${f.name} selected — ready to upload`);
              };
              const uploadFile=()=>{
                if(!newUpload.fileName){showToast('Select a PDF file first','⚠');return;}
                if(!selCourse){showToast('Select a course first','⚠');return;}
                const entry={id:Date.now(),name:newUpload.name||newUpload.fileName,uploadedOn:new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}),size:`${(newUpload.file?.size/1024/1024||0.5).toFixed(1)} MB`,uploadedFile:newUpload.file};
                setUploadedFiles(p=>({...p,[selCourse.id]:[...(p[selCourse.id]||[]),entry]}));
                setNewUpload({name:'',file:null,fileName:''});
                showToast(`✅ ${entry.name} uploaded successfully — students can now download it!`);
              };
              const deleteUpload=(fileId)=>{
                setUploadedFiles(p=>({...p,[selCourse.id]:(p[selCourse.id]||[]).filter(f=>f.id!==fileId)}));
                showToast('File removed.','🗑');
              };
              const downloadAsTeacher=(entry)=>{
                // If real file was uploaded, use it directly
                if(entry.uploadedFile){
                  const url=URL.createObjectURL(entry.uploadedFile);
                  const a=document.createElement('a');a.href=url;a.download=entry.name;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
                } else {
                  showToast(`Preview: ${entry.name} (original PDF would download here)`,'📄');
                }
              };
              const addChapter=()=>{
                if(!newChapter.title.trim()){showToast('Enter chapter title','⚠');return;}
                setChapters(p=>({...p,[selCourse.id]:[...(p[selCourse.id]||[]),{id:Date.now(),...newChapter}]}));
                setNewChapter({title:'',status:'Pending',notes:''});
                showToast('Chapter added!');
              };
              const toggleChapStatus=(chapId)=>{
                setChapters(p=>({...p,[selCourse.id]:(p[selCourse.id]||[]).map(c=>c.id===chapId?{...c,status:c.status==='Completed'?'In Progress':c.status==='In Progress'?'Pending':'Completed'}:c)}));
              };
              const deleteChap=(chapId)=>{
                setChapters(p=>({...p,[selCourse.id]:(p[selCourse.id]||[]).filter(c=>c.id!==chapId)}));
                showToast('Chapter removed.','🗑');
              };
              const chapList=selCourse?(chapters[selCourse.id]||[]):[];
              const completed=chapList.filter(c=>c.status==='Completed').length;
              const inProg=chapList.filter(c=>c.status==='In Progress').length;

              return(<>
                <div className="tab-row">
                  {[['list','📚 My Courses']].map(([t,l])=><button key={t} className={`tab-btn ${courseTab===t?'active':''}`} onClick={()=>{setCourseTab(t);if(t!=='add')setEditingCourse(null);}}>{l}</button>)}
                  {selCourse&&<button className={`tab-btn ${courseTab==='outline'?'active':''}`} onClick={()=>setCourseTab('outline')}>📋 {selCourse.name} Outline</button>}
                  {selCourse&&<button className={`tab-btn ${courseTab==='upload'?'active':''}`} onClick={()=>setCourseTab('upload')}>📤 Upload PDFs</button>}
                </div>

                {courseTab==='list'&&(
                  <div className="card">
                    <div className="ct"><div className="ct-dot" style={{background:'#2471A3'}}></div>My Courses ({courses.length}) <span style={{marginLeft:'auto',fontSize:9,color:'rgba(255,255,255,0.3)',padding:'2px 8px',background:'rgba(192,57,43,0.1)',border:'1px solid rgba(192,57,43,0.2)',borderRadius:8}}>🔒 Courses assigned by Admin only</span></div>
                    {courses.length===0&&<div style={{color:'rgba(255,255,255,0.25)',fontSize:12,textAlign:'center',padding:'20px 0'}}>No courses assigned yet. Contact admin to add courses.</div>}
                    <table className="mt"><thead><tr><th>Course</th><th>Class</th><th>Progress</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>{courses.map(c=>{
                      const cl=chapters[c.id]||[];
                      const done=cl.filter(x=>x.status==='Completed').length;
                      const total=cl.length||c.chapters||1;
                      const pct=Math.round((done/total)*100);
                      return(<tr key={c.id}>
                        <td><div style={{fontWeight:600}}>{c.name}</div><div style={{fontSize:10,color:'rgba(255,255,255,0.3)'}}>{c.desc}</div></td>
                        <td style={{fontSize:11}}>{c.class}</td>
                        <td>
                          <div style={{display:'flex',alignItems:'center',gap:8}}>
                            <div style={{flex:1,background:'rgba(255,255,255,0.06)',borderRadius:4,height:6}}>
                              <div style={{width:`${pct}%`,height:'100%',background:pct>=80?'#1D9E75':pct>=40?'#D4AC0D':'#2471A3',borderRadius:4,transition:'width 0.5s'}}/>
                            </div>
                            <span style={{fontSize:10,color:'rgba(255,255,255,0.5)',flexShrink:0}}>{done}/{total}</span>
                          </div>
                        </td>
                        <td><span className={`badge ${c.status==='Active'?'bg':'bb'}`}>{c.status}</span></td>
                        <td><div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                          <button className="d-btn d-btn-blue" style={{fontSize:'9px',padding:'2px 7px'}} onClick={()=>{setSelCourse(c);setCourseTab('outline');}}>📋 Outline</button>
                          <button className="d-btn d-btn-green" style={{fontSize:'9px',padding:'2px 7px'}} onClick={()=>{setSelCourse(c);setCourseTab('upload');}}>📤 Upload PDF</button>
                        </div></td>
                      </tr>);
                    })}</tbody></table>
                  </div>
                )}

                {courseTab==='add'&&(
                  <div className="card">
                    <div className="ct"><div className="ct-dot" style={{background:'#1D9E75'}}></div>{editingCourse?'✏️ Edit Course':'➕ Add New Course'}</div>
                    <div className="form-row">
                      <div className="f-group"><div className="f-lab">Course / Subject Name *</div><input className="f-inp" style={{width:'100%'}} placeholder="e.g. Mathematics" value={newCourse.name} onChange={e=>setNewCourse({...newCourse,name:e.target.value})}/></div>

                    </div>
                    <div className="form-row">
                      <div className="f-group"><div className="f-lab">Assign to Class *</div>
                        <select className="d-select" style={{marginBottom:0}} value={newCourse.class} onChange={e=>setNewCourse({...newCourse,class:e.target.value})}>
                          <option value="">— Select Class —</option>
                          {myClasses.map(c=><option key={c.name}>{c.name}</option>)}
                        </select>
                      </div>
                      <div className="f-group"><div className="f-lab">Total Chapters</div><input className="f-inp" style={{width:'100%'}} type="number" placeholder="e.g. 12" value={newCourse.chapters} onChange={e=>setNewCourse({...newCourse,chapters:e.target.value})}/></div>
                      <div className="f-group"><div className="f-lab">Status</div>
                        <select className="d-select" style={{marginBottom:0}} value={newCourse.status} onChange={e=>setNewCourse({...newCourse,status:e.target.value})}>
                          <option>Active</option><option>Inactive</option><option>Completed</option>
                        </select>
                      </div>
                    </div>
                    <div className="f-group"><div className="f-lab">Description / Notes</div><textarea className="f-inp" style={{width:'100%',minHeight:60,resize:'vertical'}} placeholder="e.g. Topics covered in this course..." value={newCourse.desc} onChange={e=>setNewCourse({...newCourse,desc:e.target.value})}/></div>
                    <div style={{display:'flex',gap:8}}>
                      <button className="d-btn d-btn-green" onClick={editingCourse?updateCourse:addCourse}>{editingCourse?'💾 Update Course':'➕ Add Course'}</button>
                      <button className="d-btn d-btn-blue" onClick={()=>{setEditingCourse(null);setCourseTab('list');}}>Cancel</button>
                    </div>
                  </div>
                )}

                {courseTab==='outline'&&selCourse&&(
                  <>
                    <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:10,flexWrap:'wrap'}}>
                      <div style={{flex:1}}>
                        <div style={{color:'#fff',fontSize:14,fontWeight:600}}>{selCourse.name} <span style={{fontSize:11,color:'rgba(255,255,255,0.4)'}}>({selCourse.code})</span></div>
                        <div style={{fontSize:11,color:'rgba(255,255,255,0.35)'}}>{selCourse.class}</div>
                      </div>
                      <div className="analy-card" style={{padding:'8px 16px',minWidth:80}}><div className="analy-val" style={{fontSize:18}}>{completed}</div><div className="analy-lab">Done</div></div>
                      <div className="analy-card" style={{padding:'8px 16px',minWidth:80}}><div className="analy-val" style={{fontSize:18,color:'#D4AC0D'}}>{inProg}</div><div className="analy-lab">In Progress</div></div>
                      <div className="analy-card" style={{padding:'8px 16px',minWidth:80}}><div className="analy-val" style={{fontSize:18,color:'rgba(255,255,255,0.4)'}}>{chapList.length-completed-inProg}</div><div className="analy-lab">Pending</div></div>
                    </div>

                    <div className="card">
                      <div className="ct"><div className="ct-dot" style={{background:'#7F77DD'}}></div>Chapter Outline — {selCourse.name} <button className="add-btn" style={{marginLeft:'auto',fontSize:10}} onClick={()=>setNewChapter({title:'',status:'Pending',notes:''})}>+ Add Chapter</button></div>
                      <div className="form-row" style={{marginBottom:10,padding:'8px',background:'rgba(127,119,221,0.06)',borderRadius:8,border:'1px solid rgba(127,119,221,0.15)'}}>
                        <div className="f-group" style={{marginBottom:0}}><div className="f-lab">Chapter Title *</div><input className="f-inp" style={{width:'100%'}} placeholder="e.g. Ch 5 — Integration" value={newChapter.title} onChange={e=>setNewChapter({...newChapter,title:e.target.value})}/></div>
                        <div className="f-group" style={{marginBottom:0}}><div className="f-lab">Status</div>
                          <select className="d-select" style={{marginBottom:0}} value={newChapter.status} onChange={e=>setNewChapter({...newChapter,status:e.target.value})}>
                            <option>Pending</option><option>In Progress</option><option>Completed</option>
                          </select>
                        </div>
                        <div className="f-group" style={{marginBottom:0}}><div className="f-lab">Notes</div><input className="f-inp" style={{width:'100%'}} placeholder="Optional notes..." value={newChapter.notes} onChange={e=>setNewChapter({...newChapter,notes:e.target.value})}/></div>
                        <div style={{display:'flex',alignItems:'flex-end'}}><button className="d-btn d-btn-green" style={{marginBottom:0}} onClick={addChapter}>+ Add</button></div>
                      </div>
                      {chapList.length===0&&<div style={{color:'rgba(255,255,255,0.25)',fontSize:12,textAlign:'center',padding:'16px 0'}}>No chapters yet. Add chapters above.</div>}
                      {chapList.map((ch,idx)=>{
                        const col=ch.status==='Completed'?'#1D9E75':ch.status==='In Progress'?'#D4AC0D':'rgba(255,255,255,0.2)';
                        return(<div key={ch.id} style={{display:'flex',gap:10,alignItems:'center',padding:'7px 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                          <span style={{color:'rgba(255,255,255,0.25)',fontSize:11,minWidth:18}}>{idx+1}.</span>
                          <div style={{flex:1}}>
                            <div style={{color:'var(--white2)',fontSize:12,fontWeight:500}}>{ch.title}</div>
                            {ch.notes&&<div style={{fontSize:10,color:'rgba(255,255,255,0.3)',marginTop:2}}>{ch.notes}</div>}
                          </div>
                          <span style={{padding:'2px 8px',borderRadius:4,background:`${col}22`,color:col,fontSize:9,fontWeight:700,flexShrink:0}}>{ch.status}</span>
                          <button onClick={()=>toggleChapStatus(ch.id)} style={{fontSize:9,padding:'2px 8px',borderRadius:4,background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.5)',cursor:'pointer'}}>Toggle</button>
                          <button onClick={()=>deleteChap(ch.id)} style={{fontSize:9,padding:'2px 6px',borderRadius:4,background:'rgba(192,57,43,0.1)',border:'1px solid rgba(192,57,43,0.2)',color:'#f87171',cursor:'pointer'}}>🗑</button>
                        </div>);
                      })}
                    </div>
                  </>
                )}

                {/* ── PDF UPLOAD PANEL ── */}
                {courseTab==='upload'&&selCourse&&(
                  <>
                    <div style={{background:'rgba(36,113,163,0.07)',border:'1px solid rgba(36,113,163,0.2)',borderRadius:10,padding:'12px 18px',marginBottom:14,display:'flex',alignItems:'flex-start',gap:12}}>
                      <span style={{fontSize:20,flexShrink:0}}>📤</span>
                      <div>
                        <div style={{color:'#60a5fa',fontWeight:700,fontSize:13,marginBottom:3}}>Upload Study Materials for {selCourse.name}</div>
                        <div style={{color:'rgba(255,255,255,0.4)',fontSize:11.5,lineHeight:1.65}}>Upload PDF notes, past papers, or any course material. Students in <strong style={{color:'rgba(255,255,255,0.6)'}}>{selCourse.class}</strong> will be able to download them from the Courses section of their dashboard.</div>
                      </div>
                    </div>

                    {/* Upload Form */}
                    <div className="card">
                      <div className="ct"><div className="ct-dot" style={{background:'#1D9E75'}}></div>📎 Upload New PDF / Document</div>
                      <div className="form-row" style={{alignItems:'flex-end'}}>
                        <div className="f-group" style={{flex:2,marginBottom:0}}>
                          <div className="f-lab">Document Name (optional)</div>
                          <input className="f-inp" style={{width:'100%'}} placeholder="e.g. Chapter 3 Notes, Past Paper 2024..." value={newUpload.name} onChange={e=>setNewUpload({...newUpload,name:e.target.value})}/>
                        </div>
                        <div className="f-group" style={{flex:2,marginBottom:0}}>
                          <div className="f-lab">Select PDF File *</div>
                          <label htmlFor="course-pdf-upload" style={{display:'block',cursor:'pointer'}}>
                            <div style={{background:newUpload.fileName?'rgba(29,131,72,0.1)':'rgba(255,255,255,0.04)',border:`1px dashed ${newUpload.fileName?'#4ade80':'rgba(255,255,255,0.15)'}`,borderRadius:8,padding:'10px 14px',fontSize:11.5,color:newUpload.fileName?'#4ade80':'rgba(255,255,255,0.35)',display:'flex',alignItems:'center',gap:8}}>
                              <span>{newUpload.fileName?'✅':'📁'}</span>
                              <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{newUpload.fileName||'Click to select PDF, Word, or any file...'}</span>
                            </div>
                          </label>
                          <input id="course-pdf-upload" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,image/*" style={{display:'none'}} onChange={handleFileUpload}/>
                        </div>
                        <div style={{marginBottom:0,paddingBottom:1}}>
                          <button className="d-btn d-btn-green" style={{padding:'10px 20px',fontSize:12}} onClick={uploadFile}>⬆ Upload</button>
                        </div>
                      </div>
                      {newUpload.fileName&&(
                        <div style={{marginTop:8,fontSize:10.5,color:'rgba(255,255,255,0.35)',display:'flex',gap:8,alignItems:'center'}}>
                          <span style={{color:'#4ade80'}}>✅</span>
                          File ready: <strong style={{color:'rgba(255,255,255,0.6)'}}>{newUpload.fileName}</strong>
                          <button onClick={()=>setNewUpload({name:'',file:null,fileName:''})} style={{fontSize:9,color:'#f87171',background:'none',border:'none',cursor:'pointer',padding:'0 2px'}}>✕ Clear</button>
                        </div>
                      )}
                    </div>

                    {/* Uploaded Files List */}
                    <div className="card">
                      <div className="ct"><div className="ct-dot" style={{background:'#2471A3'}}></div>
                        Uploaded Materials — {selCourse.name}
                        <span style={{marginLeft:'auto',fontSize:9.5,color:'rgba(255,255,255,0.3)'}}>{(uploadedFiles[selCourse.id]||[]).length} file{(uploadedFiles[selCourse.id]||[]).length!==1?'s':''} uploaded</span>
                      </div>
                      {(uploadedFiles[selCourse.id]||[]).length===0&&(
                        <div style={{textAlign:'center',padding:'20px 0',color:'rgba(255,255,255,0.2)',fontSize:12}}>📭 No files uploaded yet for this course.</div>
                      )}
                      {(uploadedFiles[selCourse.id]||[]).map((f,i)=>(
                        <div key={f.id} style={{display:'flex',alignItems:'center',gap:12,padding:'11px 14px',borderRadius:10,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',marginBottom:8}}>
                          <div style={{width:38,height:38,borderRadius:9,background:'rgba(192,57,43,0.15)',border:'1px solid rgba(192,57,43,0.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>📄</div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{color:'var(--white2)',fontSize:13,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name}</div>
                            <div style={{fontSize:10,color:'rgba(255,255,255,0.3)',marginTop:2,display:'flex',gap:12}}>
                              <span>📅 {f.uploadedOn}</span>
                              <span>📦 {f.size}</span>
                              <span style={{color:'#4ade80'}}>✅ Visible to {selCourse.class} students</span>
                            </div>
                          </div>
                          <div style={{display:'flex',gap:6,flexShrink:0}}>
                            <button className="d-btn d-btn-blue" style={{fontSize:'10px',padding:'4px 12px'}} onClick={()=>downloadAsTeacher(f)}>
                              👁 Preview
                            </button>
                            <button style={{fontSize:'10px',padding:'4px 10px',borderRadius:6,background:'rgba(192,57,43,0.12)',border:'1px solid rgba(192,57,43,0.25)',color:'#f87171',cursor:'pointer'}} onClick={()=>deleteUpload(f.id)}>🗑</button>
                          </div>
                        </div>
                      ))}
                      <div style={{marginTop:8,fontSize:10,color:'rgba(255,255,255,0.25)',fontStyle:'italic',textAlign:'center'}}>
                        💡 Students in {selCourse.class} see all uploaded files in their Courses → Study Materials section.
                      </div>
                    </div>
                  </>
                )}
              </>);
            })()}
          </div>

          {/* NOTIFICATIONS */}
          <div className={`panel ${activePane==='t-notif'?'active':''}`}>
            {(()=>{
              const [tNotifTab,setTNotifTab]=useState('create');
              const [notifType,setNotifType]=useState('Announcement');
              const [notifTo,setNotifTo]=useState('All Students');
              const [notifTitle,setNotifTitle]=useState('');
              const [notifMsg,setNotifMsg]=useState('');
              const [schedDate,setSchedDate]=useState('');
              const [schedTime,setSchedTime]=useState('');
              const [sentList,setSentList]=useState(initMockData.student.notifications.slice(0,4).map(n=>({...n,to:'All Students',readBy:['Laiba Imtiaz']})));
              const [editingNotif,setEditingNotif]=useState(null);
              const [tReadIds,setTReadIds]=useState(new Set());

              const notifTypes=['Announcement','Class Cancel','Makeup Class','Assignment Due','Exam Schedule','General Reminder','Holiday Notice','Other'];
              const sendTargets=['All Students',...myClasses.map(c=>c.name),'Group A','Group B','Individual Student'];

              const sendOrUpdate=()=>{
                if(!notifTitle.trim()||!notifMsg.trim()){showToast('Fill title and message','⚠');return;}
                if(editingNotif){
                  setSentList(prev=>prev.map(n=>n.id===editingNotif.id?{...n,text:notifTitle+': '+notifMsg,to:notifTo,type:notifType,scheduled:!!schedDate,schedInfo:schedDate?schedDate+(schedTime?' '+schedTime:''):'',time:'Just now (edited)'}:n));
                  if(setTeacherNotifs) setTeacherNotifs(prev=>prev.map(n=>n.id===editingNotif.id?{...n,text:notifTitle+': '+notifMsg,to:notifTo}:n));
                  setEditingNotif(null); showToast('✅ Notification updated!');
                } else {
                  const newN={id:Date.now(),text:notifTitle+': '+notifMsg,time:schedDate?'Scheduled: '+schedDate+(schedTime?' '+schedTime:''):'Just now',color:notifType==='Class Cancel'?'#C0392B':notifType==='Exam Schedule'?'#D4AC0D':notifType==='Makeup Class'?'#7F77DD':'#1D9E75',to:notifTo,type:notifType,scheduled:!!schedDate,readBy:[]};
                  setSentList(p=>[newN,...p]);
                  if(setTeacherNotifs) setTeacherNotifs(prev=>[newN,...prev]);
                  showToast('🔔 Notification sent to '+notifTo+(schedDate?' (Scheduled)':'')+'!');
                }
                setNotifTitle('');setNotifMsg('');setSchedDate('');setSchedTime('');
              };
              const deleteNotif=(id)=>{setSentList(p=>p.filter(n=>n.id!==id));if(setTeacherNotifs)setTeacherNotifs(p=>p.filter(n=>n.id!==id));showToast('Deleted.','🗑');};
              const startEditNotif=(n)=>{
                const parts=n.text.split(': ');
                setNotifTitle(parts[0]||'');
                setNotifMsg(parts.slice(1).join(': ')||n.text);
                setNotifTo(n.to||'All Students');
                setNotifType(n.type||'Announcement');
                setEditingNotif(n);
                setTNotifTab('create');
              };
              const adminAnnsT=(adminAnns||[]).filter(a=>a.audience==='All Students & Teachers'||a.audience==='Teachers Only');

              return(<>
                <div className="tab-row">{[['create',editingNotif?'✏️ Edit':'➕ Create'],['sent','📤 Sent'],['admin','📢 Admin Msgs']].map(([t,l])=><button key={t} className={`tab-btn ${tNotifTab===t?'active':''}`} onClick={()=>{setTNotifTab(t);if(t!=='create')setEditingNotif(null);}}>{l}</button>)}</div>

                {tNotifTab==='create'&&(
                  <div className="card">
                    <div className="ct"><div className="ct-dot" style={{background:'#C0392B'}}></div>{editingNotif?'✏️ Edit Notification':'➕ Create Notification'}</div>
                    <div style={{fontSize:11,color:'rgba(255,255,255,0.3)',marginBottom:10}}>📡 Notifications instantly visible in student dashboards. Class cancel, makeup class, exam schedule — sab bhej sakte hain.</div>
                    <div className="form-row">
                      <div className="f-group"><div className="f-lab">Notification Type</div>
                        <select className="d-select" style={{marginBottom:0}} value={notifType} onChange={e=>setNotifType(e.target.value)}>
                          {notifTypes.map(t=><option key={t}>{t}</option>)}
                        </select>
                      </div>
                      <div className="f-group"><div className="f-lab">Send To</div>
                        <select className="d-select" style={{marginBottom:0}} value={notifTo} onChange={e=>setNotifTo(e.target.value)}>
                          {sendTargets.map(t=><option key={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="f-group" style={{marginTop:8}}><div className="f-lab">Title *</div><input className="f-inp" style={{width:'100%',marginTop:4}} placeholder={notifType==='Class Cancel'?'e.g. Class Cancel — 10 April':notifType==='Exam Schedule'?'e.g. Physics Test — 15 April':'e.g. Important Announcement'} value={notifTitle} onChange={e=>setNotifTitle(e.target.value)}/></div>
                    <div className="f-group" style={{marginTop:8}}><div className="f-lab">Message *</div><textarea className="f-inp" style={{width:'100%',marginTop:4,resize:'vertical',minHeight:80}} placeholder="Write your message here..." value={notifMsg} onChange={e=>setNotifMsg(e.target.value)}/></div>
                    <div style={{display:'flex',gap:8,marginTop:8,flexWrap:'wrap',alignItems:'center'}}>
                      <button className="d-btn d-btn-primary" onClick={()=>{setSchedDate('');setSchedTime('');sendOrUpdate();}}>{editingNotif?'💾 Update':'🔔 Send Now'}</button>
                      <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
                        <input type="date" className="f-inp" style={{width:'auto',fontSize:11}} value={schedDate} onChange={e=>setSchedDate(e.target.value)} title="Schedule Date"/>
                        <input type="time" className="f-inp" style={{width:'auto',fontSize:11}} value={schedTime} onChange={e=>setSchedTime(e.target.value)} title="Schedule Time"/>
                        <button className="d-btn d-btn-blue" onClick={()=>{if(!schedDate){showToast('Select a schedule date first','⚠');return;}sendOrUpdate();}}>📅 Schedule</button>
                      </div>
                      {editingNotif&&<button className="d-btn" style={{background:'rgba(255,255,255,0.05)',color:'rgba(255,255,255,0.4)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:6,padding:'6px 14px',fontSize:11,cursor:'pointer'}} onClick={()=>{setEditingNotif(null);setNotifTitle('');setNotifMsg('');setTNotifTab('sent');}}>Cancel</button>}
                    </div>
                  </div>
                )}

                {tNotifTab==='sent'&&(
                  <div className="card">
                    <div className="ct"><div className="ct-dot" style={{background:'#2471A3'}}></div>Sent Notifications ({sentList.length}) — Students ko visible hain</div>
                    {sentList.length===0&&<div style={{color:'rgba(255,255,255,0.25)',fontSize:12,textAlign:'center',padding:'20px 0'}}>No notifications sent yet.</div>}
                    {sentList.map(n=>(
                      <div className="notif-item" key={n.id}>
                        <div className="notif-dot" style={{background:n.color}}></div>
                        <div style={{flex:1}}>
                          <div className="notif-text">{n.text}</div>
                          <div className="notif-time">{n.time} · <span style={{color:'rgba(255,255,255,0.4)'}}>{n.to}</span>
                            {n.type&&<span className="badge bb" style={{marginLeft:6,fontSize:8}}>{n.type}</span>}
                            {n.scheduled&&<span className="badge ba" style={{marginLeft:4,fontSize:8}}>Scheduled</span>}
                          </div>
                          <div style={{fontSize:9,color:'rgba(255,255,255,0.25)',marginTop:2}}>👁 Read by: {n.readBy?.length||0} student(s)</div>
                        </div>
                        <div style={{display:'flex',gap:4,flexDirection:'column',alignItems:'flex-end'}}>
                          <button className="d-btn d-btn-blue" style={{fontSize:'9px',padding:'2px 7px'}} onClick={()=>startEditNotif(n)}>✎ Edit</button>
                          <button className="d-btn d-btn-red" style={{fontSize:'9px',padding:'2px 7px'}} onClick={()=>deleteNotif(n.id)}>🗑</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {tNotifTab==='admin'&&(
                  <div className="card">
                    <div className="ct"><div className="ct-dot" style={{background:'#C0392B'}}></div>Admin Announcements for You ({adminAnnsT.length})</div>
                    {adminAnnsT.map(a=>(
                      <div className="notif-item" key={a.id} style={{opacity:tReadIds.has(a.id)?0.45:1}} onClick={()=>setTReadIds(p=>new Set([...p,a.id]))}>
                        <div className="notif-dot" style={{background:a.color||'#C0392B'}}></div>
                        <div style={{flex:1}}>
                          <div className="notif-text">📢 {a.title}</div>
                          <div className="notif-time">{a.time} · {a.audience} <span className="badge br" style={{marginLeft:4,fontSize:8}}>Admin</span></div>
                          {a.msg&&<div style={{fontSize:10,color:'rgba(255,255,255,0.28)',marginTop:2}}>{a.msg}</div>}
                        </div>
                        {!tReadIds.has(a.id)&&<div style={{width:6,height:6,borderRadius:'50%',background:a.color||'#C0392B',marginLeft:'auto',flexShrink:0,marginTop:6}}></div>}
                      </div>
                    ))}
                    {adminAnnsT.length===0&&<div style={{color:'rgba(255,255,255,0.25)',fontSize:12,textAlign:'center',padding:'20px 0'}}>No admin announcements yet.</div>}
                  </div>
                )}
              </>);
            })()}
          </div>

          {/* ANALYTICS */}
          <div className={`panel ${activePane==='t-perf'?'active':''}`}>
            {(()=>{
              const [analyticsClass,setAnalyticsClass]=useState(myClasses[0]?.name||'FSc Pre-Eng Sec B');
              const classStudents=students; // In real app, filter by class
              const avgMarks=classStudents.length?Math.round(classStudents.reduce((a,s)=>a+s.marks,0)/classStudents.length):0;
              const avgAttendance=classStudents.length?Math.round(classStudents.reduce((a,s)=>a+s.attend,0)/classStudents.length):0;
              const passCount=classStudents.filter(s=>s.marks>=40).length;
              const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
              const monthlyAtt=months.map((m,i)=>({month:m,pct:Math.max(60,Math.min(98,avgAttendance+Math.round(Math.sin(i)*8)))}));
              return(<>
                {/* Class filter dropdown */}
                <div style={{display:'flex',gap:12,marginBottom:14,alignItems:'center',flexWrap:'wrap'}}>
                  <div style={{color:'rgba(255,255,255,0.5)',fontSize:12}}>📊 Analytics for:</div>
                  <select className="d-select" style={{marginBottom:0,minWidth:200,fontSize:12}} value={analyticsClass} onChange={e=>setAnalyticsClass(e.target.value)}>
                    {myClasses.map(c=><option key={c.name} value={c.name}>{c.name} — {c.subject}</option>)}
                  </select>
                  <span style={{fontSize:10,color:'rgba(255,255,255,0.3)'}}>Real-time performance report</span>
                </div>

                <div className="analy-grid" style={{gridTemplateColumns:'repeat(4,1fr)'}}>
                  <div className="analy-card"><div className="analy-val">{avgAttendance}%</div><div className="analy-lab">Avg Attendance</div></div>
                  <div className="analy-card"><div className="analy-val">{avgMarks}</div><div className="analy-lab">Avg Marks</div></div>
                  <div className="analy-card"><div className="analy-val">{passCount}/{classStudents.length}</div><div className="analy-lab">Pass / Total</div></div>
                  <div className="analy-card"><div className="analy-val" style={{color:'#4ade80'}}>A</div><div className="analy-lab">Class Grade</div></div>
                </div>

                <div className="card"><div className="ct"><div className="ct-dot" style={{background:'#2471A3'}}></div>Student Performance — {analyticsClass}</div>
                  <div className="chart-bar-wrap">{classStudents.map((s,i)=>{ const colors=['#2471A3','#7F77DD','#D4AC0D','#1D9E75','#C0392B','#7F77DD']; return(<div className="chart-row" key={s.name}><span className="chart-label">{s.name.split(' ')[0]}</span><div className="chart-bar-bg"><div className="chart-bar-fill" style={{width:`${s.marks}%`,background:colors[i%colors.length]}}><span style={{color:'rgba(255,255,255,0.9)'}}>{s.marks}%</span></div></div><span className="chart-val">{s.attend}%</span></div>); })}</div>
                </div>

                {/* Monthly attendance % chart */}
                <div className="card"><div className="ct"><div className="ct-dot" style={{background:'#1D9E75'}}></div>Monthly Attendance % — {analyticsClass}</div>
                  <div className="chart-bar-wrap">
                    {monthlyAtt.map(({month,pct})=>(
                      <div className="chart-row" key={month}>
                        <span className="chart-label">{month}</span>
                        <div className="chart-bar-bg">
                          <div className="chart-bar-fill" style={{width:`${pct}%`,background:pct>=75?'#1D9E75':'#C0392B'}}>
                            <span style={{color:'rgba(255,255,255,0.9)'}}>{pct}%</span>
                          </div>
                        </div>
                        <span className="chart-val" style={{color:pct>=75?'#4ade80':'#f87171'}}>{pct<75?'⚠':'✓'}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{fontSize:10,color:'rgba(255,255,255,0.28)',marginTop:6}}>🔴 Below 75% = Shortage risk &nbsp;|&nbsp; 🟢 Above 75% = Safe</div>
                </div>
              </>);
            })()}
          </div>

        </div>
      </div>
      {toast&&<Toast msg={toast}/>}

      {/* ── REAL QR SCANNER MODAL (v26 logic) ─────────────────────────────── */}
      {realScannerOpen&&activeScanStudent&&(
        <div style={{position:'fixed',inset:0,background:'#000',zIndex:9999,display:'flex',flexDirection:'column'}}>
          {/* Header */}
          <div style={{background:'#0f1e38',padding:'14px 20px',display:'flex',justifyContent:'space-between',alignItems:'center',borderBottom:'1px solid rgba(255,255,255,0.08)',flexShrink:0}}>
            <div>
              <div style={{color:'#fff',fontSize:15,fontWeight:700}}>📷 Scanning QR for: {activeScanStudent.name}</div>
              <div style={{color:'rgba(255,255,255,0.35)',fontSize:10,marginTop:2}}>{activeScanStudent.roll}</div>
            </div>
            <button onClick={closeRealScanner} style={{background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:10,color:'#fff',fontSize:13,cursor:'pointer',padding:'8px 16px',fontWeight:600}}>✕ Cancel</button>
          </div>
          {/* Body */}
          <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:20,gap:16}}>
            <div style={{color:'rgba(255,255,255,0.6)',fontSize:13,textAlign:'center',maxWidth:340}}>
              📱 <strong style={{color:'#fff'}}>{activeScanStudent.name}</strong> ko apna unique QR code camera ke saamne rakhne ko bolein
            </div>
            {/* QR Reader Container */}
            <div style={{width:'100%',maxWidth:380,background:'#000',borderRadius:16,overflow:'hidden',boxShadow:'0 0 0 2px #1D9E75,0 0 0 6px rgba(29,158,117,0.2)'}}>
              <div id="att-qr-reader" style={{width:'100%'}}></div>
            </div>
            {camError&&(
              <div style={{background:'rgba(192,57,43,0.15)',border:'1px solid rgba(192,57,43,0.3)',borderRadius:10,padding:'10px 16px',color:'#f87171',fontSize:12,textAlign:'center',maxWidth:340}}>
                ⚠️ Camera access denied. Browser settings mein camera allow karein aur dobara try karein.
              </div>
            )}
            <div style={{background:'rgba(29,158,117,0.12)',border:'1px solid rgba(29,158,117,0.25)',borderRadius:20,padding:'6px 16px',color:'#4ade80',fontSize:11}}>
              ⏳ Scanner active — Sirf <strong style={{color:'#4ade80'}}>{activeScanStudent.name}'s QR</strong> scan hoga
            </div>
          </div>
        </div>
      )}
      {/* ── END REAL QR SCANNER MODAL ───────────────────────────────────────── */}
    </div>
  );
}

export default TeacherDashboard;
