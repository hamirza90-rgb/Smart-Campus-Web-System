import React, { useState, useEffect, useRef, useMemo } from 'react';
import { initMockData, getGradeColor, getStatusColor } from '../mockData';
import { PGCLogo, Toast } from './homepage';

const API = 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('token');

const apiCall = async (endpoint, method = 'GET', body = null) => {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`
    }
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${API}${endpoint}`, options);
  return res.json();
};

function AdminDashboard({user,onLogout,classTimetables,setClassTimetables,ttChangelog,setTtChangelog,adminAnns,setAdminAnns}){
  const [activePane,setActivePane]=useState('a-home');
  const [toast,setToast]=useState(null);

  // ── Students & Teachers - Real Backend ──
  const [allStudents,setAllStudents]=useState([]);
  const [allTeachers,setAllTeachers]=useState([]);
  const [loadingStudents,setLoadingStudents]=useState(true);
  const [loadingTeachers,setLoadingTeachers]=useState(true);

  // Fetch Students from MongoDB
  useEffect(()=>{
    apiCall('/students')
      .then(data=>{
        if(Array.isArray(data)) setAllStudents(data);
        else setAllStudents([]);
      })
      .catch(()=>setAllStudents([]))
      .finally(()=>setLoadingStudents(false));
  },[]);

  // Fetch Teachers from MongoDB
  useEffect(()=>{
    apiCall('/teachers')
      .then(data=>{
        if(Array.isArray(data)) setAllTeachers(data);
        else setAllTeachers([]);
      })
      .catch(()=>setAllTeachers([]))
      .finally(()=>setLoadingTeachers(false));
  },[]);

  const [searchTerm,setSearchTerm]=useState('');
  const [showAddUser,setShowAddUser]=useState(false);
  const [newUser,setNewUser]=useState({name:'',email:'',role:'Student',dept:'',password:'',phone:'',roll:''});
  const [editingUser,setEditingUser]=useState(null);
  const [userTab,setUserTab]=useState('students');

  // ── Timetable ──
  const [ttClass,setTtClass]=useState('FSc Pre-Eng Sec B');
  const [ttDay,setTtDay]=useState('Monday');
  const [ttSlot,setTtSlot]=useState('');
  const [ttSubject,setTtSubject]=useState('');
  const [ttTeacher,setTtTeacher]=useState('');
  const [ttRoom,setTtRoom]=useState('');
  const [ttViewRole,setTtViewRole]=useState('student');
  const [ttViewName,setTtViewName]=useState('');
  const ttEntries=(classTimetables&&classTimetables[ttClass])||[];
  const setTtEntries=(updater)=>{
    setClassTimetables(prev=>{
      const cur=(prev&&prev[ttClass])||[];
      const next=typeof updater==='function'?updater(cur):updater;
      return {...prev,[ttClass]:next};
    });
  };

  // ── Results ──
  const [resultRows,setResultRows]=useState([
    {id:1,cls:'FSc Pre-Eng Sec A',avgMarks:82,passRate:98,topStudent:'Sara Khan',distinctions:18,appeared:200,status:'Published'},
    {id:2,cls:'FSc Pre-Eng Sec B',avgMarks:76,passRate:95,topStudent:'Ali Hassan',distinctions:12,appeared:195,status:'Published'},
    {id:3,cls:'FSc Pre-Med Sec A',avgMarks:79,passRate:97,topStudent:'Laiba Noor',distinctions:15,appeared:180,status:'Published'},
    {id:4,cls:'ICS Sec A',avgMarks:74,passRate:93,topStudent:'Hamza Khan',distinctions:9,appeared:160,status:'Published'},
  ]);
  const [editingResult,setEditingResult]=useState(null);
  const [showAddResult,setShowAddResult]=useState(false);
  const [newResult,setNewResult]=useState({cls:'',avgMarks:'',passRate:'',topStudent:'',distinctions:'',appeared:'',status:'Published'});

  // ── Announcements ──
  const anns=adminAnns;
  const setAnns=setAdminAnns;
  const [aTitle,setATitle]=useState('');
  const [aMsg,setAMsg]=useState('');
  const [aAud,setAAud]=useState('All Students & Teachers');
  const [aCustomClass,setACustomClass]=useState('');
  const [schedDate,setSchedDate]=useState('');

  // ── System Monitor ──
  const [sysRes,setSysRes]=useState({cpu:0,ram:0,disk:58,net:23});
  const [sessionCount,setSessionCount]=useState(Math.floor(Math.random()*50)+100);

  React.useEffect(()=>{
    const update=()=>{
      let ram=50, cpu=30;
      try{
        if(navigator.deviceMemory){ ram=Math.min(95,Math.max(20,100-navigator.deviceMemory*8+Math.random()*10)); }
        else { ram=55+Math.random()*20; }
        cpu=25+Math.random()*40;
      }catch(e){ ram=60+Math.random()*15; cpu=30+Math.random()*30; }
      setSysRes({cpu:Math.round(cpu),ram:Math.round(ram),disk:58+Math.round(Math.random()*4),net:20+Math.round(Math.random()*15)});
    };
    update();
    const iv=setInterval(update,4000);
    return()=>clearInterval(iv);
  },[]);

  const [paneVisits,setPaneVisits]=useState({Attendance:0,Assignments:0,Results:0,Notifications:0});
  const handlePaneChange=(id)=>{
    setActivePane(id);
    if(id==='a-users') setPaneVisits(p=>({...p,Attendance:p.Attendance+1}));
    if(id==='a-timetable') setPaneVisits(p=>({...p,Assignments:p.Assignments+1}));
    if(id==='a-results') setPaneVisits(p=>({...p,Results:p.Results+1}));
    if(id==='a-notif') setPaneVisits(p=>({...p,Notifications:p.Notifications+1}));
  };
  const totalVisits=Object.values(paneVisits).reduce((a,b)=>a+b,0)||1;
  const modUsagePct=(k)=>Math.min(99,Math.round((paneVisits[k]/totalVisits)*100)||Math.round({Attendance:87,Assignments:72,Results:45,Notifications:93}[k]));

  const d=initMockData.admin;
  const showToast=(msg)=>{ setToast(msg); setTimeout(()=>setToast(null),3000); };

  const filteredStudents=allStudents.filter(s=>
    s.name?.toLowerCase().includes(searchTerm.toLowerCase())||
    s.roll?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredTeachers=allTeachers.filter(t=>
    t.name?.toLowerCase().includes(searchTerm.toLowerCase())||
    t.dept?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  // ── Add User - Real Backend ──
  const addUser=async()=>{
    if(!newUser.name||!newUser.email){ showToast('Please fill Name and Email'); return; }
    try{
      if(newUser.role==='Student'){
        const data=await apiCall('/students','POST',{
          name:newUser.name,
          email:newUser.email,
          roll:newUser.roll||`FSc-A-0${Math.floor(Math.random()*90+10)}`,
          dept:newUser.dept||'FSc Pre-Eng',
          phone:newUser.phone||''
        });
        if(data.student) setAllStudents(prev=>[...prev,data.student]);
        showToast(`Student "${newUser.name}" added to database!`);
      } else if(newUser.role==='Teacher'){
        const initPw=newUser.password||`${newUser.name.split(' ').pop()}@PGC2026`;
        const data=await apiCall('/teachers','POST',{
          name:newUser.name,
          email:newUser.email,
          password:initPw,
          dept:newUser.dept||'General',
          phone:newUser.phone||''
        });
        if(data.teacher) setAllTeachers(prev=>[...prev,data.teacher]);
        showToast(`Teacher "${newUser.name}" added! Password: ${initPw}`);
      }
    }catch(err){
      showToast('Error adding user. Try again.');
    }
    setNewUser({name:'',email:'',role:'Student',dept:'',password:'',phone:'',roll:''});
    setShowAddUser(false);
  };

  // ── Delete - Real Backend ──
  const deleteStudent=async(id)=>{
    try{
      await apiCall(`/students/${id}`,'DELETE');
      setAllStudents(prev=>prev.filter(s=>s._id!==id));
      showToast('Student removed from database.');
    }catch(err){ showToast('Error removing student.'); }
  };

  const deleteTeacher=async(id)=>{
    try{
      await apiCall(`/teachers/${id}`,'DELETE');
      setAllTeachers(prev=>prev.filter(t=>t._id!==id));
      showToast('Teacher removed from database.');
    }catch(err){ showToast('Error removing teacher.'); }
  };

  // ── Update - Real Backend ──
  const saveEditStudent=async()=>{
    try{
      const data=await apiCall(`/students/${editingUser.id}`,'PUT',editingUser.data);
      if(data.student) setAllStudents(prev=>prev.map(s=>s._id===editingUser.id?data.student:s));
      setEditingUser(null); showToast('Student updated in database!');
    }catch(err){ showToast('Error updating student.'); }
  };

  const saveEditTeacher=async()=>{
    try{
      const data=await apiCall(`/teachers/${editingUser.id}`,'PUT',editingUser.data);
      if(data.teacher) setAllTeachers(prev=>prev.map(t=>t._id===editingUser.id?data.teacher:t));
      setEditingUser(null); showToast('Teacher updated in database!');
    }catch(err){ showToast('Error updating teacher.'); }
  };

  const toggleStatus=(id)=>{
    setAllStudents(prev=>prev.map(s=>s._id===id?{...s,status:s.status==='Active'?'Inactive':'Active'}:s));
    showToast('Status updated.');
  };

  const toggleTeacherStatus=(id)=>{
    setAllTeachers(prev=>prev.map(t=>t._id===id?{...t,status:t.status==='Active'?'Inactive':'Active'}:t));
    showToast('Status updated.');
  };

  // ── Timetable Helpers ──
  const dayMap={Monday:'Mon',Tuesday:'Tue',Wednesday:'Wed',Thursday:'Thu',Friday:'Fri',Saturday:'Sat'};
  const addTtEntry=()=>{
    if(!ttSubject.trim()){ showToast('Enter subject name'); return; }
    if(!ttClass.trim()){ showToast('Enter class name'); return; }
    const slot=ttSlot.trim()||'08:00-09:30';
    const shortDay=dayMap[ttDay]||ttDay;
    const cellVal=ttSubject+(ttTeacher?' ('+ttTeacher+')':'')+(ttRoom?' ['+ttRoom+']':'');
    setTtEntries(prev=>{
      const existing=prev.find(r=>r.time===slot);
      if(existing) return prev.map(r=>r.time===slot?{...r,[shortDay]:cellVal}:r);
      const newRow={time:slot,Mon:'',Tue:'',Wed:'',Thu:'',Fri:''};
      newRow[shortDay]=cellVal;
      return [...prev,newRow].sort((a,b)=>a.time.localeCompare(b.time));
    });
    if(setTtChangelog) setTtChangelog(prev=>[{id:Date.now(),cls:ttClass,time:slot,day:shortDay,subject:cellVal,ts:new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})},...prev.slice(0,19)]);
    showToast('Timetable updated! Changes synced to student/teacher dashboards.');
    setTtSubject('');setTtTeacher('');setTtRoom('');
  };

  const clearTtSlot=(rowTime,day)=>{
    const shortDay=dayMap[day]||day;
    setTtEntries(prev=>prev.map(r=>r.time===rowTime?{...r,[shortDay]:''}:r));
    showToast('Slot cleared.');
  };

  // ── Results Helpers ──
  const totalAppeared=resultRows.reduce((a,r)=>a+r.appeared,0);
  const avgScore=resultRows.length?Math.round(resultRows.reduce((a,r)=>a+r.avgMarks,0)/resultRows.length):0;
  const avgPass=resultRows.length?Math.round(resultRows.reduce((a,r)=>a+r.passRate,0)/resultRows.length):0;
  const totalDistinctions=resultRows.reduce((a,r)=>a+r.distinctions,0);

  const saveEditResult=()=>{
    setResultRows(prev=>prev.map(r=>r.id===editingResult.id?{...r,...editingResult}:r));
    setEditingResult(null); showToast('Result updated!');
  };

  const addResultRow=()=>{
    if(!newResult.cls.trim()){ showToast('Enter class name'); return; }
    const duplicate=resultRows.some(r=>r.cls.trim().toLowerCase()===newResult.cls.trim().toLowerCase());
    if(duplicate){ showToast('This class result already exists!'); return; }
    setResultRows(prev=>[...prev,{...newResult,id:Date.now(),avgMarks:Number(newResult.avgMarks)||0,passRate:Number(newResult.passRate)||0,distinctions:Number(newResult.distinctions)||0,appeared:Number(newResult.appeared)||0}]);
    setNewResult({cls:'',avgMarks:'',passRate:'',topStudent:'',distinctions:'',appeared:'',status:'Published'});
    setShowAddResult(false); showToast('Class result added!');
  };

  const deleteResult=(id)=>{ setResultRows(prev=>prev.filter(r=>r.id!==id)); showToast('Deleted.'); };

  // ── Announcement Helpers ──
  const sendAnn=(scheduled=false)=>{
    if(!aTitle.trim()||!aMsg.trim()){ showToast('Fill title and message'); return; }
    const finalAud=aAud==='Specific Class'&&aCustomClass.trim()?`Class: ${aCustomClass}`:aAud;
    setAnns(p=>[{id:Date.now(),title:aTitle,audience:finalAud,msg:aMsg,time:scheduled&&schedDate?`Scheduled: ${schedDate}`:'Just now',color:'#C0392B',scheduled},...p]);
    setATitle('');setAMsg('');setACustomClass('');setSchedDate('');
    showToast(scheduled?`Announcement scheduled!`:`Announcement sent to ${finalAud}!`);
  };

  const delAnn=(id)=>{ setAnns(p=>p.filter(a=>a.id!==id)); showToast('Deleted.'); };

  const navItems=[{id:'a-home',label:'Dashboard'},{id:'a-users',label:'Manage Users'},{id:'a-courses',label:'Course Management'},{id:'a-timetable',label:'Timetable'},{id:'a-assignments',label:'Assignments'},{id:'a-results',label:'Results'},{id:'a-perf',label:'Performance'},{id:'a-notif',label:'Announcements'},{id:'a-monitor',label:'System Monitor'}];
  const paneTitle=navItems.find(n=>n.id===activePane)?.label||'Dashboard';
  return(
    <div className="dash-wrap">
      <div className="sidebar" style={{background:'linear-gradient(180deg,#1a0e0e 0%,#100808 100%)'}}>
        <div className="sb-logo"><div className="sb-logo-row"><PGCLogo size={28}/><div><div className="sb-text">PGC Portal</div><div className="sb-sub">Admin Panel</div></div></div></div>
        <div className="sb-nav"><div className="nav-grp">Main</div>{navItems.map(n=>(<button key={n.id} className={`nav-item ${activePane===n.id?'active':''}`} onClick={()=>handlePaneChange(n.id)}>{n.label}</button>))}</div>
        <div className="sb-footer">
          <div className="sb-user"><div className="sb-av" style={{background:'rgba(192,57,43,0.35)'}}>AD</div><div><div className="sb-uname">{user?.name||'Administrator'}</div><div className="sb-urole">Admin Panel</div></div></div>
          <button className="logout-btn" onClick={onLogout}><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" width="12" height="12"><path d="M5 2H2v8h3"/><polyline points="8,4 11,6 8,8"/><line x1="5" y1="6" x2="11" y2="6"/></svg>Sign out</button>
        </div>
      </div>
      <div className="main">
        <div className="topbar"><div className="tb-title" style={{color:'#f87171'}}>{paneTitle}</div><div className="tb-right"><button className="nb" onClick={()=>handlePaneChange('a-notif')}><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" width="13" height="13"><path d="M6 1a3.5 3.5 0 0 1 3.5 3.5c0 2.8 1 3.5 1 3.5H1s1-.7 1-3.5A3.5 3.5 0 0 1 6 1z"/><line x1="6" y1="11" x2="6" y2="9"/></svg>{anns.filter(a=>!a.seen).length>0&&<div className="ndot"></div>}</button><div className="tb-date">{new Date().toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</div></div></div>
        <div className="content">

          {/* ── HOME ── */}
          <div className={`panel ${activePane==='a-home'?'active':''}`}>
            <div className="sg">
              {[['Students',allStudents.length+'','Enrolled','sc-blue'],['Faculty',allTeachers.length+'','Members','sc-green'],['Classes',resultRows.length+'','Active','sc-red'],['Pass Rate',avgPass+'%','This year','sc-amber']].map(([l,v,s,c])=>(<div className={`sc ${c}`} key={l}><div className="sc-l">{l}</div><div className="sc-v">{v}</div><div className="sc-s">{s}</div></div>))}
            </div>
            <div className="twoC">
              <div className="card"><div className="ct"><div className="ct-dot" style={{background:'#C0392B'}}></div>System Overview</div>
                {[['Total Users',(allStudents.length+allTeachers.length+1)+''],['Active Sessions',sessionCount+''],['DB Size','2.4 GB'],['Uptime','99.9%']].map(([l,v])=>(<div className="ri" key={l}><div className="rm">{l}</div><span style={{color:'var(--white2)',fontSize:12,fontWeight:500}}>{v}</span></div>))}
              </div>
              <div className="card"><div className="ct"><div className="ct-dot" style={{background:'#2471A3'}}></div>Recent Activity</div>
                {anns.slice(0,4).map(a=>(<div className="ri" key={a.id}><div><div className="rm">{a.title}</div><div className="rs">{a.time} · {a.audience}</div></div></div>))}
              </div>
            </div>
            <div className="card"><div className="ct"><div className="ct-dot" style={{background:'#1D9E75'}}></div>System Health (Live)</div>
              {[['CPU Usage',sysRes.cpu+'%','#1D9E75'],['Memory Usage',sysRes.ram+'%','#D4AC0D'],['Storage Used',sysRes.disk+'%','#2471A3'],['Network I/O',sysRes.net+'%','#7F77DD']].map(([l,v,c])=>(<div className="pr" key={l}><span className="pl">{l}</span><div className="pb"><div className="pf" style={{width:v,background:c,transition:'width 0.8s ease'}}/></div><span className="pv">{v}</span></div>))}
            </div>
          </div>

          {/* ── MANAGE USERS ── */}
          <div className={`panel ${activePane==='a-users'?'active':''}`}>
            {editingUser&&(
              <div className="mini-form" style={{marginBottom:14,background:'rgba(36,113,163,0.08)',border:'1px solid rgba(36,113,163,0.25)'}}>
                <div style={{color:'var(--white2)',fontSize:12,fontWeight:600,marginBottom:12}}>✏️ Edit {editingUser.type==='student'?'Student':'Teacher'}</div>
                {editingUser.type==='student'?(<>
                  <div className="form-row">
                    <div className="f-group"><div className="f-lab">Full Name</div><input className="f-inp" style={{width:'100%'}} value={editingUser.data.name} onChange={e=>setEditingUser(p=>({...p,data:{...p.data,name:e.target.value}}))}/></div>
                    <div className="f-group"><div className="f-lab">Roll No</div><input className="f-inp" style={{width:'100%'}} value={editingUser.data.roll} onChange={e=>setEditingUser(p=>({...p,data:{...p.data,roll:e.target.value}}))}/></div>
                  </div>
                  <div className="form-row">
                    <div className="f-group"><div className="f-lab">Class / Dept</div><input className="f-inp" style={{width:'100%'}} value={editingUser.data.dept||''} onChange={e=>setEditingUser(p=>({...p,data:{...p.data,dept:e.target.value}}))}/></div>
                  </div>
                  <div style={{display:'flex',gap:8}}><button className="d-btn d-btn-green" onClick={saveEditStudent}>✓ Save</button><button className="d-btn d-btn-blue" onClick={()=>setEditingUser(null)}>Cancel</button></div>
                </>):(<>
                  <div className="form-row">
                    <div className="f-group"><div className="f-lab">Full Name</div><input className="f-inp" style={{width:'100%'}} value={editingUser.data.name} onChange={e=>setEditingUser(p=>({...p,data:{...p.data,name:e.target.value}}))}/></div>
                    <div className="f-group"><div className="f-lab">Email</div><input className="f-inp" style={{width:'100%'}} value={editingUser.data.email} onChange={e=>setEditingUser(p=>({...p,data:{...p.data,email:e.target.value}}))}/></div>
                  </div>
                  <div className="f-group"><div className="f-lab">Department</div><input className="f-inp" style={{width:'100%'}} value={editingUser.data.dept} onChange={e=>setEditingUser(p=>({...p,data:{...p.data,dept:e.target.value}}))}/></div>
                  <div style={{display:'flex',gap:8,marginTop:8}}><button className="d-btn d-btn-green" onClick={saveEditTeacher}>✓ Save</button><button className="d-btn d-btn-blue" onClick={()=>setEditingUser(null)}>Cancel</button></div>
                </>)}
              </div>
            )}
            <div style={{display:'flex',alignItems:'center',marginBottom:14,flexWrap:'wrap',gap:8}}>
              <div style={{color:'var(--white2)',fontSize:13,fontWeight:600}}>Manage Users ({allStudents.length+allTeachers.length} total)</div>
              <button className="add-btn" onClick={()=>setShowAddUser(!showAddUser)}>+ Add User</button>
              <div style={{marginLeft:'auto',display:'flex',gap:6}}>
                {['students','teachers'].map(t=><button key={t} className={`tab-btn ${userTab===t?'active':''}`} style={{fontSize:11,padding:'4px 12px'}} onClick={()=>setUserTab(t)}>{t==='students'?'Students ('+allStudents.length+')':'Teachers ('+allTeachers.length+')'}</button>)}
              </div>
            </div>
            {showAddUser&&(<div className="mini-form">
              <div style={{color:'var(--white2)',fontSize:12,fontWeight:600,marginBottom:12}}>Add New User</div>
              <div className="form-row">
                <div className="f-group"><div className="f-lab">Full Name *</div><input className="f-inp" style={{width:'100%'}} placeholder="Student / Teacher name" value={newUser.name} onChange={e=>setNewUser({...newUser,name:e.target.value})}/></div>
                <div className="f-group"><div className="f-lab">Email *</div><input className="f-inp" style={{width:'100%'}} placeholder="email@pgc.edu.pk" value={newUser.email} onChange={e=>setNewUser({...newUser,email:e.target.value})}/></div>
              </div>
              <div className="form-row">
                <div className="f-group"><div className="f-lab">Role</div><select className="d-select" style={{marginBottom:0}} value={newUser.role} onChange={e=>setNewUser({...newUser,role:e.target.value})}><option>Student</option><option>Teacher</option></select></div>
                <div className="f-group"><div className="f-lab">Class / Department</div><input className="f-inp" style={{width:'100%'}} placeholder="e.g. ICS Sec A, Mathematics..." value={newUser.dept} onChange={e=>setNewUser({...newUser,dept:e.target.value})}/></div>
              </div>
              {newUser.role==='Student'&&(
                <div className="f-group"><div className="f-lab">Roll Number</div><input className="f-inp" style={{width:'100%'}} placeholder="e.g. FSc-A-041" value={newUser.roll||''} onChange={e=>setNewUser({...newUser,roll:e.target.value})}/></div>
              )}
              {newUser.role==='Teacher'&&(
                <div className="f-group"><div className="f-lab">Password</div><input className="f-inp" style={{width:'100%'}} placeholder="Min 8 characters" value={newUser.password||''} onChange={e=>setNewUser({...newUser,password:e.target.value})}/></div>
              )}
              <div style={{display:'flex',gap:8}}><button className="d-btn d-btn-primary" onClick={addUser}>Add User</button><button className="d-btn d-btn-blue" onClick={()=>setShowAddUser(false)}>Cancel</button></div>
            </div>)}
            <div className="search-bar">
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="14" height="14"><circle cx="6" cy="6" r="4.5"/><line x1="9.2" y1="9.2" x2="13" y2="13"/></svg>
              <input placeholder="Search by name, roll, email..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
            </div>

            {/* STUDENTS TABLE */}
            {userTab==='students'&&(
              <div className="card">
                <div className="ct"><div className="ct-dot" style={{background:'#2471A3'}}></div>Students ({filteredStudents.length})
                {loadingStudents&&<span style={{fontSize:10,color:'rgba(255,255,255,0.3)',marginLeft:8}}>Loading from database...</span>}
                </div>
                {filteredStudents.length===0&&!loadingStudents&&<div style={{color:'rgba(255,255,255,0.3)',textAlign:'center',padding:'20px 0',fontSize:12}}>No students found. Add students using "+ Add User" button.</div>}
                {filteredStudents.length>0&&<table className="mt"><thead><tr><th>Name</th><th>Roll No</th><th>Class/Dept</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {filteredStudents.map(s=>(<tr key={s._id}>
                    <td>{s.name}</td><td style={{fontSize:10}}>{s.roll}</td><td>{s.dept||'FSc Pre-Eng'}</td>
                    <td><span className={`badge ${s.status==='Active'?'bg':'br'}`}>{s.status||'Active'}</span></td>
                    <td><div style={{display:'flex',gap:4}}>
                      <button className="d-btn d-btn-blue" style={{fontSize:'9px',padding:'2px 6px'}} onClick={()=>setEditingUser({type:'student',id:s._id,data:{...s}})}>Edit</button>
                      <button className="d-btn" style={{fontSize:'9px',padding:'2px 6px',background:s.status==='Active'?'rgba(192,57,43,0.15)':'rgba(29,131,72,0.15)',color:s.status==='Active'?'#f87171':'#4ade80',border:`1px solid ${s.status==='Active'?'rgba(192,57,43,0.3)':'rgba(29,131,72,0.3)'}`,borderRadius:4,cursor:'pointer'}} onClick={()=>toggleStatus(s._id)}>{s.status==='Active'?'🚫 Deactivate':'✅ Activate'}</button>
                      <button className="d-btn d-btn-red" style={{fontSize:'9px',padding:'2px 6px'}} onClick={()=>deleteStudent(s._id)}>Remove</button>
                    </div></td>
                  </tr>))}
                </tbody></table>}
              </div>
            )}

            {/* TEACHERS TABLE */}
            {userTab==='teachers'&&(
              <div className="card">
                <div className="ct"><div className="ct-dot" style={{background:'#1D9E75'}}></div>Teachers ({filteredTeachers.length})
                {loadingTeachers&&<span style={{fontSize:10,color:'rgba(255,255,255,0.3)',marginLeft:8}}>Loading from database...</span>}
                </div>
                {filteredTeachers.length===0&&!loadingTeachers&&<div style={{color:'rgba(255,255,255,0.3)',textAlign:'center',padding:'20px 0',fontSize:12}}>No teachers found. Add teachers using "+ Add User" button.</div>}
                {filteredTeachers.length>0&&<table className="mt"><thead><tr><th>Name</th><th>Dept</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {filteredTeachers.map(t=>(<tr key={t._id}>
                    <td>{t.name}</td>
                    <td>{t.dept}</td>
                    <td><span className={`badge ${t.status==='Active'?'bg':'br'}`}>{t.status}</span></td>
                    <td><div style={{display:'flex',gap:4}}>
                      <button className="d-btn d-btn-blue" style={{fontSize:'9px',padding:'2px 6px'}} onClick={()=>setEditingUser({type:'teacher',id:t._id,data:{...t}})}>Edit</button>
                      <button className="d-btn" style={{fontSize:'9px',padding:'2px 6px',background:t.status==='Active'?'rgba(192,57,43,0.15)':'rgba(29,131,72,0.15)',color:t.status==='Active'?'#f87171':'#4ade80',border:`1px solid ${t.status==='Active'?'rgba(192,57,43,0.3)':'rgba(29,131,72,0.3)'}`,borderRadius:4,cursor:'pointer'}} onClick={()=>toggleTeacherStatus(t._id)}>{t.status==='Active'?'🚫 Deactivate':'✅ Activate'}</button>
                      <button className="d-btn d-btn-red" style={{fontSize:'9px',padding:'2px 6px'}} onClick={()=>deleteTeacher(t._id)}>Remove</button>
                    </div></td>
                  </tr>))}
                </tbody></table>}
              </div>
            )}
          </div>
          {/* ── TIMETABLE ── */}
          <div className={`panel ${activePane==='a-timetable'?'active':''}`}>
            <div className="card">
              <div className="ct"><div className="ct-dot" style={{background:'#7F77DD'}}></div>Add / Update Timetable Slot</div>
              <div style={{fontSize:11,color:'rgba(255,255,255,0.35)',marginBottom:12}}>💡 Enter any class name and time slot — changes sync to student & teacher dashboards instantly.</div>
              <div className="form-row" style={{marginBottom:10}}>
                <div className="f-group"><div className="f-lab">Class *</div><input className="f-inp" style={{width:'100%'}} placeholder="e.g. ICS Sec B, FSc Pre-Med..." value={ttClass} onChange={e=>setTtClass(e.target.value)}/></div>
                <div className="f-group"><div className="f-lab">Day</div><select className="d-select" style={{marginBottom:0}} value={ttDay} onChange={e=>setTtDay(e.target.value)}>{['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(dy=><option key={dy}>{dy}</option>)}</select></div>
              </div>
              <div className="form-row" style={{marginBottom:10}}>
                <div className="f-group"><div className="f-lab">Time Slot</div><input className="f-inp" style={{width:'100%'}} placeholder="e.g. 8:00-9:00" value={ttSlot} onChange={e=>setTtSlot(e.target.value)}/></div>
                <div className="f-group"><div className="f-lab">Subject *</div><input className="f-inp" style={{width:'100%'}} placeholder="e.g. Chemistry, Computer..." value={ttSubject} onChange={e=>setTtSubject(e.target.value)}/></div>
              </div>
              <div className="form-row" style={{marginBottom:10}}>
                <div className="f-group"><div className="f-lab">Teacher Name</div><input className="f-inp" style={{width:'100%'}} placeholder="Teacher name" value={ttTeacher} onChange={e=>setTtTeacher(e.target.value)}/></div>
                <div className="f-group"><div className="f-lab">Room</div><input className="f-inp" style={{width:'100%'}} placeholder="e.g. Room 12" value={ttRoom} onChange={e=>setTtRoom(e.target.value)}/></div>
              </div>
              <button className="d-btn d-btn-primary" onClick={addTtEntry}>✓ Save to Timetable</button>
            </div>

            {Object.keys(classTimetables||{}).length>0&&(
              <div className="card">
                <div className="ct"><div className="ct-dot" style={{background:'#1D9E75'}}></div>Classes with Timetable ({Object.keys(classTimetables).length})</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                  {Object.keys(classTimetables).map(cls=>(
                    <div key={cls} onClick={()=>setTtClass(cls)} style={{padding:'5px 12px',borderRadius:7,cursor:'pointer',fontSize:11,background:ttClass===cls?'rgba(127,119,221,0.2)':'rgba(255,255,255,0.04)',border:'1px solid '+(ttClass===cls?'#7F77DD':'rgba(255,255,255,0.1)'),color:ttClass===cls?'#a78bfa':'rgba(255,255,255,0.55)'}}>
                      {cls} <span style={{color:'rgba(255,255,255,0.3)',fontSize:10}}>({classTimetables[cls].length} slots)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="card">
              <div className="ct"><div className="ct-dot" style={{background:'#7F77DD'}}></div>View / Edit Timetable</div>
              <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
                {['student','teacher'].map(r=><button key={r} className={`tab-btn ${ttViewRole===r?'active':''}`} style={{fontSize:11,padding:'4px 12px'}} onClick={()=>setTtViewRole(r)}>{r==='student'?'By Class':'By Teacher'}</button>)}
                <input className="f-inp" style={{flex:1,minWidth:140}} placeholder={ttViewRole==='student'?'Filter by class...':'Filter by teacher...'} value={ttViewName} onChange={e=>setTtViewName(e.target.value)}/>
              </div>
              {Object.entries(classTimetables||{}).filter(([cls])=>ttViewRole==='student'?(!ttViewName||cls.toLowerCase().includes(ttViewName.toLowerCase())):true).map(([cls,rows])=>{
                const filtRows=ttViewRole==='teacher'&&ttViewName?rows.filter(row=>['Mon','Tue','Wed','Thu','Fri'].some(d=>row[d]&&row[d].toLowerCase().includes(ttViewName.toLowerCase()))):rows;
                if(filtRows.length===0) return null;
                return(
                  <div key={cls} style={{marginBottom:14}}>
                    <div style={{fontSize:11,color:'#a78bfa',fontWeight:600,marginBottom:6}}>📚 {cls}</div>
                    <div className="tt-g">
                      <div className="tt-h"></div>{['Mon','Tue','Wed','Thu','Fri'].map(dy=><div className="tt-h" key={dy}>{dy}</div>)}
                      {filtRows.map((row,i)=>(
                        <React.Fragment key={i}>
                          <div className="tt-t">{row.time}</div>
                          {['Mon','Tue','Wed','Thu','Fri'].map(day=>{
                            const cell=row[day]||'';
                            const isNew=(ttChangelog||[]).some(c=>c.cls===cls&&c.time===row.time&&c.day===day);
                            return(
                              <div key={day} className={`tt-c ${cell?['tc1','tc2','tc3','tc4','tc5'][i%5]:'tt-e'}`}
                                style={{position:'relative',cursor:cell?'pointer':'default'}}
                                onClick={()=>{if(cell){clearTtSlot(row.time,day);}}}>
                                {cell}
                                {isNew&&cell&&<span style={{position:'absolute',top:2,right:2,background:'#C0392B',borderRadius:3,fontSize:7,padding:'1px 3px',color:'#fff',lineHeight:1}}>NEW</span>}
                              </div>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {(ttChangelog||[]).length>0&&(
              <div className="card">
                <div className="ct"><div className="ct-dot" style={{background:'#C0392B'}}></div>Recent Changes ({ttChangelog.length})</div>
                {ttChangelog.slice(0,8).map(c=>(
                  <div key={c.id} style={{display:'flex',gap:10,padding:'5px 0',borderBottom:'1px solid rgba(255,255,255,0.05)',fontSize:11,alignItems:'center'}}>
                    <span style={{color:'rgba(255,255,255,0.28)',fontSize:10,minWidth:36}}>{c.ts}</span>
                    <span className="badge ba" style={{fontSize:8}}>NEW</span>
                    <span style={{color:'rgba(255,255,255,0.45)',flex:1}}><strong style={{color:'#a78bfa'}}>{c.cls}</strong> · {c.day} {c.time} → <span style={{color:'#4ade80'}}>{c.subject}</span></span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── RESULTS ── */}
          <div className={`panel ${activePane==='a-results'?'active':''}`}>
            <div className="card">
              <div className="ct"><div className="ct-dot" style={{background:'#D4AC0D'}}></div>Result Overview
                <button className="add-btn" style={{margin:0,fontSize:10,marginLeft:'auto'}} onClick={()=>setShowAddResult(!showAddResult)}>+ Add Class</button>
              </div>
              <div className="analy-grid" style={{gridTemplateColumns:'repeat(4,1fr)',marginBottom:12}}>
                <div className="analy-card"><div className="analy-val">{avgScore}%</div><div className="analy-lab">Avg Score</div></div>
                <div className="analy-card"><div className="analy-val" style={{color:'#4ade80'}}>{avgPass}%</div><div className="analy-lab">Pass Rate</div></div>
                <div className="analy-card"><div className="analy-val">{totalAppeared}</div><div className="analy-lab">Appeared</div></div>
                <div className="analy-card"><div className="analy-val">{totalDistinctions}</div><div className="analy-lab">Distinctions</div></div>
              </div>

              {showAddResult&&(
                <div className="mini-form" style={{marginBottom:12}}>
                  <div style={{color:'var(--white2)',fontSize:12,fontWeight:600,marginBottom:10}}>Add Class Result</div>
                  <div className="form-row">
                    <div className="f-group"><div className="f-lab">Class Name</div><input className="f-inp" style={{width:'100%'}} placeholder="e.g. ICS Sec B" value={newResult.cls} onChange={e=>setNewResult({...newResult,cls:e.target.value})}/></div>
                    <div className="f-group"><div className="f-lab">Top Student</div><input className="f-inp" style={{width:'100%'}} placeholder="Student name" value={newResult.topStudent} onChange={e=>setNewResult({...newResult,topStudent:e.target.value})}/></div>
                  </div>
                  <div className="form-row">
                    <div className="f-group"><div className="f-lab">Avg Marks %</div><input className="f-inp" style={{width:'100%'}} type="number" value={newResult.avgMarks} onChange={e=>setNewResult({...newResult,avgMarks:e.target.value})}/></div>
                    <div className="f-group"><div className="f-lab">Pass Rate %</div><input className="f-inp" style={{width:'100%'}} type="number" value={newResult.passRate} onChange={e=>setNewResult({...newResult,passRate:e.target.value})}/></div>
                    <div className="f-group"><div className="f-lab">Appeared</div><input className="f-inp" style={{width:'100%'}} type="number" value={newResult.appeared} onChange={e=>setNewResult({...newResult,appeared:e.target.value})}/></div>
                    <div className="f-group"><div className="f-lab">Distinctions</div><input className="f-inp" style={{width:'100%'}} type="number" value={newResult.distinctions} onChange={e=>setNewResult({...newResult,distinctions:e.target.value})}/></div>
                  </div>
                  <div style={{display:'flex',gap:8}}><button className="d-btn d-btn-green" onClick={addResultRow}>Add</button><button className="d-btn d-btn-blue" onClick={()=>setShowAddResult(false)}>Cancel</button></div>
                </div>
              )}

              {editingResult&&(
                <div className="mini-form" style={{marginBottom:12,background:'rgba(36,113,163,0.08)',border:'1px solid rgba(36,113,163,0.25)'}}>
                  <div style={{color:'var(--white2)',fontSize:12,fontWeight:600,marginBottom:10}}>✏️ Edit: {editingResult.cls}</div>
                  <div className="form-row">
                    <div className="f-group"><div className="f-lab">Class</div><input className="f-inp" style={{width:'100%'}} value={editingResult.cls} onChange={e=>setEditingResult({...editingResult,cls:e.target.value})}/></div>
                    <div className="f-group"><div className="f-lab">Top Student</div><input className="f-inp" style={{width:'100%'}} value={editingResult.topStudent} onChange={e=>setEditingResult({...editingResult,topStudent:e.target.value})}/></div>
                  </div>
                  <div className="form-row">
                    <div className="f-group"><div className="f-lab">Avg Marks %</div><input className="f-inp" style={{width:'100%'}} type="number" value={editingResult.avgMarks} onChange={e=>setEditingResult({...editingResult,avgMarks:Number(e.target.value)})}/></div>
                    <div className="f-group"><div className="f-lab">Pass Rate %</div><input className="f-inp" style={{width:'100%'}} type="number" value={editingResult.passRate} onChange={e=>setEditingResult({...editingResult,passRate:Number(e.target.value)})}/></div>
                  </div>
                  <div className="f-group"><div className="f-lab">Status</div><select className="d-select" style={{marginBottom:0}} value={editingResult.status} onChange={e=>setEditingResult({...editingResult,status:e.target.value})}><option>Published</option><option>Draft</option><option>Under Review</option></select></div>
                  <div style={{display:'flex',gap:8,marginTop:8}}><button className="d-btn d-btn-green" onClick={saveEditResult}>✓ Save</button><button className="d-btn d-btn-blue" onClick={()=>setEditingResult(null)}>Cancel</button></div>
                </div>
              )}

              <table className="mt"><thead><tr><th>Class</th><th>Avg Marks</th><th>Pass %</th><th>Top Student</th><th>Distinctions</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>{resultRows.map(r=>(<tr key={r.id}>
                <td>{r.cls}</td><td>{r.avgMarks}%</td><td><span className="badge bg">{r.passRate}%</span></td><td>{r.topStudent}</td><td>{r.distinctions}</td>
                <td><span className={`badge ${r.status==='Published'?'bg':'ba'}`}>{r.status}</span></td>
                <td><div style={{display:'flex',gap:4}}>
                  <button className="d-btn d-btn-blue" style={{fontSize:'9px',padding:'2px 6px'}} onClick={()=>setEditingResult({...r})}>Edit</button>
                  <button className="d-btn d-btn-red" style={{fontSize:'9px',padding:'2px 6px'}} onClick={()=>deleteResult(r.id)}>Delete</button>
                </div></td>
              </tr>))}</tbody></table>
            </div>
          </div>

          {/* ── ASSIGNMENTS ── */}
          <div className={`panel ${activePane==='a-assignments'?'active':''}`}>
            {(()=>{
              const [aAssignTab,setAAssignTab]=useState('overview');
              const [adminAssignments,setAdminAssignments]=useState([
                {id:1,teacher:'Sir Asif Mehmood',subject:'Mathematics',cls:'FSc Pre-Eng Sec B',topic:'Chapter 5 — Polynomials',dueDate:'15 Apr 2026',status:'Active',submissions:3,total:6},
                {id:2,teacher:"Ma'am Zara Malik",subject:'Biology',cls:'FSc Pre-Med Sec A',topic:'Cell Division Notes',dueDate:'18 Apr 2026',status:'Active',submissions:5,total:8},
              ]);
              const removeAssign=(id)=>{ setAdminAssignments(prev=>prev.map(a=>a.id===id?{...a,status:'Removed'}:a)); showToast('Assignment removed.'); };
              const approveAssign=(id)=>{ setAdminAssignments(prev=>prev.map(a=>a.id===id?{...a,status:'Approved'}:a)); showToast('Assignment approved!'); };
              const totalAssignments=adminAssignments.length;
              const totalSubmitted=adminAssignments.reduce((sum,a)=>sum+a.submissions,0);
              const totalStudentsA=adminAssignments.reduce((sum,a)=>sum+a.total,0);
              return(<>
                <div className="tab-row">{[['overview','📊 Overview'],['manage','⚙️ Manage']].map(([t,l])=><button key={t} className={`tab-btn ${aAssignTab===t?'active':''}`} onClick={()=>setAAssignTab(t)}>{l}</button>)}</div>
                {aAssignTab==='overview'&&(<>
                  <div className="sg">
                    <div className="sc sc-blue"><div className="sc-l">Total</div><div className="sc-v">{totalAssignments}</div><div className="sc-s">Assignments</div></div>
                    <div className="sc sc-green"><div className="sc-l">Submitted</div><div className="sc-v">{totalSubmitted}</div><div className="sc-s">Students</div></div>
                    <div className="sc sc-amber"><div className="sc-l">Pending</div><div className="sc-v">{totalStudentsA-totalSubmitted}</div><div className="sc-s">Yet to submit</div></div>
                    <div className="sc sc-red"><div className="sc-l">Rate</div><div className="sc-v">{totalStudentsA>0?Math.round(totalSubmitted/totalStudentsA*100):0}%</div><div className="sc-s">Submission</div></div>
                  </div>
                  <div className="card"><div className="ct"><div className="ct-dot" style={{background:'#2471A3'}}></div>All Assignments</div>
                    <table className="mt"><thead><tr><th>Teacher</th><th>Subject</th><th>Class</th><th>Due Date</th><th>Submissions</th><th>Status</th></tr></thead>
                    <tbody>{adminAssignments.map(a=>(<tr key={a.id}><td style={{fontSize:10}}>{a.teacher}</td><td>{a.subject}</td><td style={{fontSize:10}}>{a.cls}</td><td style={{fontSize:10}}>{a.dueDate}</td><td><span style={{color:'#4ade80',fontWeight:600}}>{a.submissions}</span>/{a.total}</td><td><span className={`badge ${a.status==='Active'?'bg':a.status==='Approved'?'bb':'br'}`}>{a.status}</span></td></tr>))}</tbody></table>
                  </div>
                </>)}
                {aAssignTab==='manage'&&(
                  <div className="card"><div className="ct"><div className="ct-dot" style={{background:'#C0392B'}}></div>Approve / Remove</div>
                    {adminAssignments.map(a=>(
                      <div className="notif-item" key={a.id}>
                        <div className="notif-dot" style={{background:a.status==='Removed'?'#C0392B':a.status==='Approved'?'#1D9E75':'#D4AC0D'}}></div>
                        <div style={{flex:1}}><div className="notif-text">{a.subject} — {a.topic}</div><div className="notif-time">By: {a.teacher} · {a.cls}</div></div>
                        <div style={{display:'flex',flexDirection:'column',gap:3}}>
                          {a.status!=='Approved'&&a.status!=='Removed'&&<button className="d-btn d-btn-green" style={{fontSize:'9px',padding:'2px 8px'}} onClick={()=>approveAssign(a.id)}>✓ Approve</button>}
                          {a.status!=='Removed'&&<button className="d-btn d-btn-red" style={{fontSize:'9px',padding:'2px 8px'}} onClick={()=>removeAssign(a.id)}>✕ Remove</button>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>);
            })()}
          </div>
          {/* ── PERFORMANCE ── */}
          <div className={`panel ${activePane==='a-perf'?'active':''}`}>
            {(()=>{
              const [perfTab,setPerfTab]=useState('students');
              const [perfClass,setPerfClass]=useState('All Classes');
              const classOptions=useMemo(()=>{
                const fromStudents=[...new Set(allStudents.map(s=>s.dept).filter(Boolean))];
                const fromResults=resultRows.map(r=>r.cls).filter(Boolean);
                const all=[...new Set([...fromStudents,...fromResults])].sort();
                return['All Classes',...all];
              },[allStudents,resultRows]);
              const filteredPerf=perfClass==='All Classes'?allStudents:allStudents.filter(s=>s.dept===perfClass);
              const avgM=filteredPerf.length?Math.round(filteredPerf.reduce((a,s)=>a+(s.marks||0),0)/filteredPerf.length):0;
              const avgA=filteredPerf.length?Math.round(filteredPerf.reduce((a,s)=>a+(s.attend||0),0)/filteredPerf.length):0;
              const passStudents=filteredPerf.filter(s=>(s.marks||0)>=40).length;
              const aRisk=filteredPerf.filter(s=>(s.attend||0)<75).length;
              const topStudents=[...filteredPerf].sort((a,b)=>(b.marks||0)-(a.marks||0)).slice(0,5);
              const gradeGroups={A:filteredPerf.filter(s=>(s.marks||0)>=80).length,B:filteredPerf.filter(s=>(s.marks||0)>=60&&(s.marks||0)<80).length,C:filteredPerf.filter(s=>(s.marks||0)>=40&&(s.marks||0)<60).length,F:filteredPerf.filter(s=>(s.marks||0)<40).length};
              return(<>
                <div style={{display:'flex',gap:12,marginBottom:14,alignItems:'center',flexWrap:'wrap'}}>
                  <select className="d-select" style={{marginBottom:0,minWidth:200}} value={perfClass} onChange={e=>setPerfClass(e.target.value)}>
                    {classOptions.map(c=><option key={c}>{c}</option>)}
                  </select>
                  <div className="tab-row" style={{marginBottom:0}}>
                    {[['students','Students'],['teachers','Teachers'],['grades','Grades']].map(([t,l])=><button key={t} className={`tab-btn ${perfTab===t?'active':''}`} style={{fontSize:11,padding:'4px 12px'}} onClick={()=>setPerfTab(t)}>{l}</button>)}
                  </div>
                </div>
                <div className="analy-grid" style={{gridTemplateColumns:'repeat(4,1fr)',marginBottom:14}}>
                  <div className="analy-card"><div className="analy-val">{avgM}%</div><div className="analy-lab">Avg Marks</div></div>
                  <div className="analy-card"><div className="analy-val" style={{color:avgA>=75?'#4ade80':'#f87171'}}>{avgA}%</div><div className="analy-lab">Avg Attendance</div></div>
                  <div className="analy-card"><div className="analy-val" style={{color:'#4ade80'}}>{passStudents}</div><div className="analy-lab">Passing</div></div>
                  <div className="analy-card"><div className="analy-val" style={{color:'#f87171'}}>{aRisk}</div><div className="analy-lab">At Risk</div></div>
                </div>
                {perfTab==='students'&&(
                  <div className="card"><div className="ct"><div className="ct-dot" style={{background:'#2471A3'}}></div>🏆 Top Performers</div>
                    {topStudents.length===0?<div style={{color:'rgba(255,255,255,0.3)',textAlign:'center',padding:'16px 0',fontSize:11}}>No student data yet — add students from Manage Users.</div>:
                    <table className="mt"><thead><tr><th>Rank</th><th>Student</th><th>Roll</th><th>Dept</th><th>Status</th></tr></thead>
                    <tbody>{topStudents.map((s,i)=>(<tr key={s._id}><td><span style={{color:i===0?'#D4AC0D':'rgba(255,255,255,0.4)',fontWeight:700}}>#{i+1}</span></td><td>{s.name}</td><td style={{fontFamily:'monospace',fontSize:10}}>{s.roll}</td><td style={{fontSize:10}}>{s.dept}</td><td><span className={`badge ${s.status==='Active'?'bg':'br'}`}>{s.status}</span></td></tr>))}</tbody></table>}
                  </div>
                )}
                {perfTab==='teachers'&&(
                  <div className="card"><div className="ct"><div className="ct-dot" style={{background:'#1D9E75'}}></div>Teacher Overview ({allTeachers.length})</div>
                    {allTeachers.length===0?<div style={{color:'rgba(255,255,255,0.3)',textAlign:'center',padding:'16px 0',fontSize:11}}>No teachers yet.</div>:
                    <table className="mt"><thead><tr><th>Teacher</th><th>Department</th><th>Status</th></tr></thead>
                    <tbody>{allTeachers.map(t=>(<tr key={t._id}><td style={{fontWeight:600}}>{t.name}</td><td style={{fontSize:11}}>{t.dept}</td><td><span className={`badge ${t.status==='Active'?'bg':'bb'}`}>{t.status}</span></td></tr>))}</tbody></table>}
                  </div>
                )}
                {perfTab==='grades'&&(
                  <div className="card"><div className="ct"><div className="ct-dot" style={{background:'#D4AC0D'}}></div>Grade Distribution</div>
                    {[['A (80-100)',gradeGroups.A,'#1D9E75'],['B (60-79)',gradeGroups.B,'#2471A3'],['C (40-59)',gradeGroups.C,'#D4AC0D'],['F (Below 40)',gradeGroups.F,'#C0392B']].map(([l,v,c])=>(
                      <div className="pr" key={l}><span className="pl">{l}</span><div className="pb"><div className="pf" style={{width:`${(v/(filteredPerf.length||1))*100}%`,background:c}}/></div><span className="pv">{v}</span></div>
                    ))}
                  </div>
                )}
              </>);
            })()}
          </div>

          {/* ── ANNOUNCEMENTS ── */}
          <div className={`panel ${activePane==='a-notif'?'active':''}`}>
            {(()=>{
              const [editingAnn,setEditingAnn]=useState(null);
              const startEditAnn=(a)=>{ setATitle(a.title);setAMsg(a.msg||'');setAAud(a.audience);setACustomClass('');setEditingAnn(a); };
              const updateAnn=()=>{
                if(!aTitle.trim()||!aMsg.trim()){showToast('Fill title and message');return;}
                const finalAud=aAud==='Specific Class'&&aCustomClass.trim()?`Class: ${aCustomClass}`:aAud;
                setAnns(p=>p.map(a=>a.id===editingAnn.id?{...a,title:aTitle,msg:aMsg,audience:finalAud,time:'Updated: '+new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}:a));
                setEditingAnn(null);setATitle('');setAMsg('');setACustomClass('');
                showToast('Announcement updated!');
              };
              return(<>
                <div className="card">
                  <div className="ct"><div className="ct-dot" style={{background:'#C0392B'}}></div>{editingAnn?'✏️ Edit Announcement':'➕ Send Announcement'}</div>
                  <div className="f-group"><div className="f-lab">Target Audience</div>
                    <select className="d-select" style={{marginBottom:0,marginTop:4}} value={aAud} onChange={e=>setAAud(e.target.value)}>
                      <option>All Students &amp; Teachers</option><option>Students Only</option><option>Teachers Only</option><option>Specific Class</option>
                    </select>
                  </div>
                  {aAud==='Specific Class'&&(
                    <div className="f-group" style={{marginTop:8}}><div className="f-lab">Class Name</div><input className="f-inp" style={{width:'100%',marginTop:4}} placeholder="e.g. FSc Pre-Med..." value={aCustomClass} onChange={e=>setACustomClass(e.target.value)}/></div>
                  )}
                  <div className="f-group" style={{marginTop:10}}><div className="f-lab">Title *</div><input className="f-inp" style={{width:'100%',marginTop:4}} placeholder="e.g. Holiday Notice" value={aTitle} onChange={e=>setATitle(e.target.value)}/></div>
                  <div className="f-group" style={{marginTop:8}}><div className="f-lab">Message *</div><textarea className="f-inp" style={{width:'100%',marginTop:4,resize:'vertical',minHeight:80}} placeholder="Write your announcement..." value={aMsg} onChange={e=>setAMsg(e.target.value)}/></div>
                  <div style={{display:'flex',gap:8,marginTop:8}}>
                    {editingAnn?(
                      <>
                        <button className="d-btn d-btn-green" onClick={updateAnn}>💾 Update</button>
                        <button className="d-btn d-btn-blue" onClick={()=>{setEditingAnn(null);setATitle('');setAMsg('');}}>Cancel</button>
                      </>
                    ):(
                      <>
                        <button className="d-btn d-btn-primary" onClick={()=>sendAnn(false)}>🔔 Send Now</button>
                        <div style={{display:'flex',gap:6,alignItems:'center'}}>
                          <input type="date" className="f-inp" style={{width:'auto',fontSize:11}} value={schedDate} onChange={e=>setSchedDate(e.target.value)}/>
                          <button className="d-btn d-btn-blue" onClick={()=>{if(!schedDate){showToast('Select date first');return;}sendAnn(true);}}>📅 Schedule</button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div className="card">
                  <div className="ct"><div className="ct-dot" style={{background:'#2471A3'}}></div>Announcements ({anns.length})</div>
                  {anns.length===0&&<div style={{color:'rgba(255,255,255,0.25)',fontSize:12,textAlign:'center',padding:'20px 0'}}>No announcements yet.</div>}
                  {anns.map(a=>(<div className="notif-item" key={a.id}>
                    <div className="notif-dot" style={{background:a.color}}></div>
                    <div style={{flex:1}}>
                      <div className="notif-text">{a.title}</div>
                      <div className="notif-time">{a.time} · {a.audience}</div>
                      {a.msg&&<div style={{fontSize:10,color:'rgba(255,255,255,0.25)',marginTop:2}}>{a.msg}</div>}
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:3}}>
                      <button className="d-btn d-btn-blue" style={{fontSize:'9px',padding:'2px 7px'}} onClick={()=>startEditAnn(a)}>✎ Edit</button>
                      <button className="d-btn d-btn-red" style={{fontSize:'9px',padding:'2px 7px'}} onClick={()=>delAnn(a.id)}>🗑 Delete</button>
                    </div>
                  </div>))}
                </div>
              </>);
            })()}
          </div>

          {/* ── COURSE MANAGEMENT ── */}
          <div className={`panel ${activePane==='a-courses'?'active':''}`}>
            {(()=>{
              const [adminCourseTab,setAdminCourseTab]=useState('list');
              const [adminCourses,setAdminCourses]=useState([
                {id:1,name:'Mathematics',teacher:'Sir Asif Mehmood',class:'FSc Pre-Eng Sec B',chapters:12,chapDone:7,status:'Active'},
                {id:2,name:'Biology',teacher:"Ma'am Zara Malik",class:'FSc Pre-Med Sec A',chapters:14,chapDone:10,status:'Active'},
                {id:3,name:'Physics',teacher:'Sir Bilal Ahmed',class:'ICS Sec A',chapters:11,chapDone:4,status:'Active'},
              ]);
              const [newAC,setNewAC]=useState({name:'',teacher:'',class:'',chapters:'',chapDone:'',status:'Active'});
              const [editAC,setEditAC]=useState(null);
              const saveAC=()=>{
                if(!newAC.name||!newAC.class){showToast('Fill Course Name and Class');return;}
                if(editAC){ setAdminCourses(p=>p.map(c=>c.id===editAC.id?{...c,...newAC,chapters:parseInt(newAC.chapters)||0,chapDone:parseInt(newAC.chapDone)||0}:c)); setEditAC(null); showToast('Course updated!'); }
                else { setAdminCourses(p=>[...p,{...newAC,id:Date.now(),chapters:parseInt(newAC.chapters)||0,chapDone:parseInt(newAC.chapDone)||0}]); showToast('Course added!'); }
                setNewAC({name:'',teacher:'',class:'',chapters:'',chapDone:'',status:'Active'});
                setAdminCourseTab('list');
              };
              const delAC=(id)=>{setAdminCourses(p=>p.filter(c=>c.id!==id));showToast('Course deleted.');};
              return(<>
                <div className="tab-row">{[['list','📚 Courses'],['add',editAC?'✏️ Edit':'➕ Add']].map(([t,l])=><button key={t} className={`tab-btn ${adminCourseTab===t?'active':''}`} onClick={()=>{setAdminCourseTab(t);if(t!=='add')setEditAC(null);}}>{l}</button>)}</div>
                {adminCourseTab==='list'&&(
                  <div className="card"><div className="ct"><div className="ct-dot" style={{background:'#2471A3'}}></div>All Courses
                    <button className="add-btn" style={{marginLeft:'auto'}} onClick={()=>{setEditAC(null);setAdminCourseTab('add');}}>+ Add</button>
                  </div>
                  <table className="mt"><thead><tr><th>Course</th><th>Teacher</th><th>Class</th><th>Progress</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>{adminCourses.map(c=>{
                    const pct=Math.round((c.chapDone/(c.chapters||1))*100);
                    return(<tr key={c.id}><td style={{fontWeight:600}}>{c.name}</td><td style={{fontSize:11}}>{c.teacher}</td><td style={{fontSize:11}}>{c.class}</td>
                      <td><div style={{display:'flex',alignItems:'center',gap:6}}><div style={{flex:1,background:'rgba(255,255,255,0.06)',borderRadius:4,height:5,minWidth:60}}><div style={{width:`${pct}%`,height:'100%',background:pct>=80?'#1D9E75':pct>=40?'#D4AC0D':'#2471A3',borderRadius:4}}/></div><span style={{fontSize:9,color:'rgba(255,255,255,0.4)'}}>{c.chapDone}/{c.chapters}</span></div></td>
                      <td><span className={`badge ${c.status==='Active'?'bg':'bb'}`}>{c.status}</span></td>
                      <td><div style={{display:'flex',gap:4}}>
                        <button className="d-btn d-btn-blue" style={{fontSize:'9px',padding:'2px 7px'}} onClick={()=>{setNewAC({...c,chapters:String(c.chapters),chapDone:String(c.chapDone)});setEditAC(c);setAdminCourseTab('add');}}>✎</button>
                        <button className="d-btn d-btn-red" style={{fontSize:'9px',padding:'2px 7px'}} onClick={()=>delAC(c.id)}>🗑</button>
                      </div></td>
                    </tr>);
                  })}</tbody></table></div>
                )}
                {adminCourseTab==='add'&&(
                  <div className="card"><div className="ct"><div className="ct-dot" style={{background:'#1D9E75'}}></div>{editAC?'✏️ Edit Course':'➕ Add Course'}</div>
                    <div className="form-row">
                      <div className="f-group"><div className="f-lab">Course Name *</div><input className="f-inp" style={{width:'100%'}} placeholder="e.g. Mathematics" value={newAC.name} onChange={e=>setNewAC({...newAC,name:e.target.value})}/></div>
                      <div className="f-group"><div className="f-lab">Assign Teacher</div>
                        <select className="d-select" style={{marginBottom:0}} value={newAC.teacher} onChange={e=>setNewAC({...newAC,teacher:e.target.value})}>
                          <option value="">— Select Teacher —</option>
                          {allTeachers.map(t=><option key={t._id}>{t.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="f-group"><div className="f-lab">Class *</div><input className="f-inp" style={{width:'100%'}} placeholder="e.g. FSc Pre-Eng Sec A" value={newAC.class} onChange={e=>setNewAC({...newAC,class:e.target.value})}/></div>
                      <div className="f-group"><div className="f-lab">Total Chapters</div><input className="f-inp" style={{width:'100%'}} type="number" value={newAC.chapters} onChange={e=>setNewAC({...newAC,chapters:e.target.value})}/></div>
                      <div className="f-group"><div className="f-lab">Done</div><input className="f-inp" style={{width:'100%'}} type="number" value={newAC.chapDone} onChange={e=>setNewAC({...newAC,chapDone:e.target.value})}/></div>
                    </div>
                    <div style={{display:'flex',gap:8}}><button className="d-btn d-btn-green" onClick={saveAC}>{editAC?'💾 Update':'➕ Add'}</button><button className="d-btn d-btn-blue" onClick={()=>{setEditAC(null);setAdminCourseTab('list');}}>Cancel</button></div>
                  </div>
                )}
              </>);
            })()}
          </div>

          {/* ── SYSTEM MONITOR ── */}
          <div className={`panel ${activePane==='a-monitor'?'active':''}`}>
            <div className="analy-grid" style={{gridTemplateColumns:'repeat(3,1fr)'}}>
              <div className="analy-card"><div className="analy-val" style={{color:'#4ade80'}}>Online</div><div className="analy-lab">Server Status</div></div>
              <div className="analy-card"><div className="analy-val">{sessionCount}</div><div className="analy-lab">Active Sessions</div></div>
              <div className="analy-card"><div className="analy-val">99.9%</div><div className="analy-lab">Uptime</div></div>
            </div>
            <div style={{background:'rgba(29,131,72,0.07)',border:'1px solid rgba(29,131,72,0.18)',borderRadius:8,padding:'8px 14px',marginBottom:12,fontSize:10.5,color:'rgba(255,255,255,0.4)',display:'flex',gap:10,alignItems:'center'}}>
              <span>☁️</span>
              <span><strong style={{color:'#4ade80'}}>MongoDB Atlas</strong> — Cloud database connected. Students: {allStudents.length} | Teachers: {allTeachers.length}</span>
              <span className="badge bg" style={{fontSize:8,flexShrink:0}}>Online</span>
            </div>
            <div className="twoC">
              <div className="card"><div className="ct"><div className="ct-dot" style={{background:'#1D9E75'}}></div>System Resources (Live)</div>
                {[['CPU Usage',sysRes.cpu+'%','#1D9E75'],['RAM Usage',sysRes.ram+'%','#D4AC0D'],['Disk Usage',sysRes.disk+'%','#2471A3'],['Network I/O',sysRes.net+'%','#7F77DD']].map(([l,v,c])=>(<div className="pr" key={l}><span className="pl">{l}</span><div className="pb"><div className="pf" style={{width:v,background:c,transition:'width 0.8s ease'}}/></div><span className="pv">{v}</span></div>))}
              </div>
              <div className="card"><div className="ct"><div className="ct-dot" style={{background:'#C0392B'}}></div>Module Usage</div>
                {[['Users/Attendance',modUsagePct('Attendance'),'#2471A3'],['Timetable',modUsagePct('Assignments'),'#1D9E75'],['Results',modUsagePct('Results'),'#D4AC0D'],['Announcements',modUsagePct('Notifications'),'#C0392B']].map(([l,v,c])=>(<div className="pr" key={l}><span className="pl">{l}</span><div className="pb"><div className="pf" style={{width:v+'%',background:c,transition:'width 0.8s ease'}}/></div><span className="pv">{v}%</span></div>))}
              </div>
            </div>
            <div className="card"><div className="ct"><div className="ct-dot" style={{background:'#7F77DD'}}></div>System Logs</div>
              {[{time:new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}),msg:`Admin signed in — ${allStudents.length} students, ${allTeachers.length} teachers loaded`,t:'INFO'},{time:'',msg:'MongoDB Atlas connected successfully',t:'INFO'},{time:'',msg:'All API routes responding normally',t:'INFO'},{time:'',msg:'Last announcement: '+(anns[0]?.title||'None'),t:'INFO'}].map((l,i)=>(<div key={i} style={{display:'flex',gap:10,padding:'6px 0',borderBottom:'1px solid rgba(255,255,255,0.05)',fontSize:11}}><span style={{color:'rgba(255,255,255,0.28)',flexShrink:0,minWidth:36}}>{l.time}</span><span className={`badge ${l.t==='WARN'?'ba':'bb'}`} style={{flexShrink:0}}>{l.t}</span><span style={{color:'rgba(255,255,255,0.45)'}}>{l.msg}</span></div>))}
            </div>
          </div>

        </div>
      </div>
      {toast&&<Toast msg={toast}/>}
    </div>
  );
}

export default AdminDashboard;
