import React, { useState, useEffect, useMemo } from 'react';
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
}
function generateUniqueQRText(student){
  const today=new Date().toISOString().split('T')[0];
  return `PGC-ATTEND|${student.roll}|${student.name}|${today}`;
}
function StudentDashboard({user,onLogout,classTimetables,ttChangelog,adminAnns,teacherNotifs}){
  const [activePane,setActivePane]=useState('s-home');
  const [toast,setToast]=useState(null);
  const [data]=useState(initMockData.student);
  const [realAssignments,setRealAssignments]=useState([]);
  const [realResults,setRealResults]=useState([]);
  const [notifications,setNotifications]=useState([]);
  const [submitStatuses,setSubmitStatuses]=useState({});
  const [searchTerm,setSearchTerm]=useState('');
  const [courses,setCourses]=useState([]);
  const [loadingCourses,setLoadingCourses]=useState(true);
  // Merge: local + admin + teacher notifications
const normalizeClass=(cls)=>(cls||'').toLowerCase().replace(/[-\s]+/g,' ').trim();
const studentClass = user.dept || '';
const studentSection = user.section || 'N/A';
const getProgramName=(cls)=>{
  const c=(cls||'').toLowerCase();
  if(c.includes('pre-eng')||c.includes('pre eng')) return 'FSc Pre-Engineering';
  if(c.includes('pre-med')||c.includes('pre med')) return 'FSc Pre-Medical';
  if(c.includes('ics')) return 'ICS';
  if(c.includes('icom')||c.includes('commerce')) return 'I.Com';
  if(c.includes('fa')) return 'F.A';
  if(c.includes('bsc')) return 'BSc';
  return cls||'N/A';
};
const studentProgram=getProgramName(studentClass);
const studentId=user.roll||'FSc-2026-B-041';
  useEffect(()=>{
    apiCall('/courses')
      .then(async data=>{
        if(Array.isArray(data)){
          const filtered=data.filter(c=>c.class===studentClass);
          const myCourses=await Promise.all(filtered.map(async c=>{
            let notes=[];
            try{
              const materials=await apiCall(`/materials/course/${c._id}`);
              if(Array.isArray(materials)){
                notes=materials.map(m=>({name:m.name,filePath:m.filePath}));
              }
            }catch(e){}
            return {
              id:c._id,
              name:c.name,
              teacher:c.teacher,
              code:c.code||'',
              lectures:c.chapters||0,
              notes
            };
          }));
          setCourses(myCourses);
        } else setCourses([]);
        setLoadingCourses(false);
      })
      .catch(()=>{ setCourses([]); setLoadingCourses(false); });
        // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  useEffect(()=>{
    apiCall(`/assignments/class/${encodeURIComponent(studentClass)}`)
      .then(data=>{
        if(Array.isArray(data)){
          setRealAssignments(data.map(a=>{
            const mySubmission=(a.submissions||[]).find(s=>String(s.student?._id||s.student)===String(user.id));
           return{
              id:a._id,
              subject:a.subject,
              title:a.title,
              due:new Date(a.dueDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}),
              instructions:a.description||'Complete and submit on time.',
              status: mySubmission ? (mySubmission.status==='Graded'?'Graded':'Submitted') : 'Pending',
              total:a.totalMarks,
              marks: mySubmission?.marks || null,
              feedback: mySubmission?.feedback || '',
              teacher:a.teacher?.name||'Unknown',
              attachmentPath: a.attachmentPath || null,
              attachmentName: a.attachmentName || null
            };
          }));
        } else setRealAssignments([]);
      })
      .catch(()=>setRealAssignments([]));
        // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
  const [myTimetableData, setMyTimetableData] = useState([]);
  const [realAnns,setRealAnns]=useState([]);
  useEffect(()=>{
    apiCall('/announcements')
      .then(data=>{
        if(Array.isArray(data)) setRealAnns(data);
        else setRealAnns([]);
      })
      .catch(()=>setRealAnns([]));
  },[]);
  useEffect(()=>{
  if(!studentClass) return;
  apiCall('/timetable').then(data=>{
    if(Array.isArray(data)){
      const mySlots=data.filter(entry=>
  (entry.normalizedClass||normalizeClass(entry.class||''))===normalizeClass(studentClass)
);
      const grouped={};
      mySlots.forEach(entry=>{
        const dayMap={Monday:'Mon',Tuesday:'Tue',Wednesday:'Wed',Thursday:'Thu',Friday:'Fri'};
        const shortDay=dayMap[entry.day]||entry.day;
        let row=grouped[entry.time];
        if(!row){ row={time:entry.time,Mon:'',Tue:'',Wed:'',Thu:'',Fri:''}; grouped[entry.time]=row; }
        row[shortDay]=entry.subject+(entry.teacher?' ('+entry.teacher+')':'')+(entry.room?' ['+entry.room+']':'');
      });
      setMyTimetableData(Object.values(grouped).sort((a,b)=>a.time.localeCompare(b.time)));
    }
  }).catch(()=>{});
},[studentClass]);
  const [realAttendance,setRealAttendance]=useState([]);
useEffect(()=>{
  apiCall(`/attendance/class/${encodeURIComponent(studentClass)}`)
    .then(data=>{
      if(Array.isArray(data)){
        setRealAttendance(data.filter(r=>r.rollNo===studentId));
      } else setRealAttendance([]);
    })
    .catch(()=>setRealAttendance([]));
      // eslint-disable-next-line react-hooks/exhaustive-deps
},[]);
  useEffect(()=>{
    if(user?.id){
      apiCall(`/studentresults/${user.id}`)
        .then(data=>{
          if(Array.isArray(data)){
            setRealResults(data.filter(r=>r.isPublished!==false).map(r=>{
              const pct = r.total>0 ? Math.round((r.marks/r.total)*100) : 0;
              return {
                subject:r.subject,
                marks:r.marks,
                total:r.total,
                percentage:pct,
                grade: pct>=90?'A+':pct>=80?'A':pct>=70?'B+':pct>=60?'B':pct>=50?'C':pct>=40?'D':'F'
              };
            }));
          } else setRealResults([]);
        })
        .catch(()=>setRealResults([]));
    }
  },[user]);
  const adminNotifsForStudent=(realAnns||[])
    .filter(a=>a.audience==='All Students & Teachers'||a.audience==='Students Only'||(a.audience&&a.audience.startsWith('Class:')&&a.audience.includes(studentClass)))
    .map(a=>({id:'adm_'+a._id,color:a.color||'#C0392B',text:'[Admin] '+a.title+(a.msg?': '+a.msg:''),time:a.time,read:false,_src:'admin'}));
  const teacherNotifsForStudent=(teacherNotifs||[])
    .map(n=>({id:'tch_'+n.id,color:'#1D9E75',text:'[Teacher] '+n.text,time:n.time,read:false,_src:'teacher'}));
  const allNotifs=[...teacherNotifsForStudent,...adminNotifsForStudent,...notifications];
  const [extReadIds,setExtReadIds]=useState(()=>{
    try{
      const saved=localStorage.getItem('readNotifIds');
      return saved?new Set(JSON.parse(saved)):new Set();
    }catch{ return new Set(); }
  });
  useEffect(()=>{
    localStorage.setItem('readNotifIds',JSON.stringify([...extReadIds]));
  },[extReadIds]);
  const markExtRead=(id)=>setExtReadIds(prev=>new Set([...prev,id]));
  const isNotifRead=(n)=>n._src?extReadIds.has(n.id):n.read;
  const unread=allNotifs.filter(n=>!isNotifRead(n)).length;
  // Student timetable from per-class store
const myTimetable=myTimetableData.length>0?myTimetableData:(classTimetables&&classTimetables[studentClass])||[];
  const myTtChangelog=(ttChangelog||[]).filter(c=>c.cls===studentClass);

  const showToast=(msg,icon='✓')=>{ setToast({msg,icon}); setTimeout(()=>setToast(null),3000); };
  const handleDownload=(name,content)=>{
    const isResultCard=name.includes('Result_Card');
    const isTranscript=name.includes('Transcript');
    const activeResults=realResults.length>0?realResults:data.results;
const totalObtained=activeResults.reduce((a,r)=>a+r.marks,0);
const totalMax=activeResults.reduce((a,r)=>a+r.total,0);
    const pct=Math.round(totalObtained/totalMax*100);
    const getGrade=(p)=>p>=90?'A+':p>=80?'A':p>=70?'B+':p>=60?'B':p>=50?'C':p>=40?'D':'F';
    const overallGrade=getGrade(pct);
    const todayStr=new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'});

    if(isResultCard){
      const rowsHtml=activeResults.map((r,i)=>{
        const p=Math.round(r.marks/r.total*100);
        const g=getGrade(p);
        const statusColor=p>=40?'#1a7a4a':'#b91c1c';
        return `<tr style="background:${i%2===0?'#f9fafb':'#ffffff'}">
          <td style="padding:11px 14px;border-bottom:1px solid #e5e7eb;font-size:13.5px;font-weight:500;color:#111">${r.subject}</td>
          <td style="padding:11px 14px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:13.5px;font-weight:700;color:#1d4ed8">${r.marks}</td>
          <td style="padding:11px 14px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:13.5px;color:#374151">${r.total}</td>
          <td style="padding:11px 14px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:13.5px;font-weight:600;color:#374151">${p}%</td>
          <td style="padding:11px 14px;border-bottom:1px solid #e5e7eb;text-align:center"><span style="background:${g.startsWith('A')?'#dcfce7':g==='B+'||g==='B'?'#dbeafe':'#fef9c3'};color:${g.startsWith('A')?'#166534':g==='B+'||g==='B'?'#1d4ed8':'#713f12'};padding:3px 12px;border-radius:20px;font-size:12px;font-weight:700">${g}</span></td>
          <td style="padding:11px 14px;border-bottom:1px solid #e5e7eb;text-align:center"><span style="color:${statusColor};font-weight:700;font-size:12.5px">${p>=40?'PASS':'FAIL'}</span></td>
        </tr>`;
      }).join('');
      const html=`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
<title>Result Card — ${data.name}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Times New Roman',Times,serif;background:#f1f5f9;display:flex;justify-content:center;padding:30px 16px;min-height:100vh;font-size:14px}
  .page{width:750px;background:#fff;border-radius:8px;box-shadow:0 4px 32px rgba(0,0,0,0.12);overflow:hidden;font-family:'Times New Roman',Times,serif}
  table{font-family:'Times New Roman',Times,serif;font-size:14px}
  th,td{font-family:'Times New Roman',Times,serif;font-size:14px}
  @media print{body{background:#fff;padding:0}.page{box-shadow:none;border-radius:0;width:100%}.no-print{display:none!important}}
</style>
</head><body>
<div class="page">
  <!-- Header -->
  <div style="background:linear-gradient(135deg,#0f2444,#1a3a6e);padding:28px 32px;color:#fff;display:flex;align-items:center;gap:20px">
    <div style="width:64px;height:64px;background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0">
      <svg viewBox="0 0 40 40" width="46" height="46"><circle cx="20" cy="20" r="18" fill="#0f2444"/><text x="20" y="26" text-anchor="middle" font-size="15" font-weight="bold" fill="#fff" font-family="serif">PGC</text></svg>
    </div>
    <div>
      <div style="font-family:'Times New Roman',serif;font-size:24px;font-weight:700;letter-spacing:0.01em">Punjab Group of Colleges</div>
      <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.7;margin-top:3px">Lalamusa Campus · Smart Campus Web System</div>
    </div>
    <div style="margin-left:auto;text-align:right">
      <div style="font-size:18px;font-weight:700;font-family:'Noto Serif',serif">RESULT CARD</div>
      <div style="font-size:11px;opacity:0.65;margin-top:3px">Monthly Test — March 2026</div>
    </div>
  </div>
  <!-- Student Info Bar -->
  <div style="background:#f8fafc;border-bottom:2px solid #e2e8f0;padding:16px 32px;display:flex;gap:40px;flex-wrap:wrap">
    ${[['Student Name',user.name||data.name],['Roll Number',user.roll||'FSc-B-041'],['Class / Section',studentSection],['Program',studentProgram],['Issue Date',todayStr]].map(([l,v])=>`<div><div style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:3px">${l}</div><div style="font-size:13.5px;font-weight:600;color:#111">${v}</div></div>`).join('')}
  </div>
  <!-- Table -->
  <div style="padding:24px 32px">
    <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:12px;font-weight:600">Examination Results</div>
    <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
      <thead><tr style="background:#1e3a5f;color:#fff">
        <th style="padding:11px 14px;text-align:left;font-size:11.5px;letter-spacing:0.06em;text-transform:uppercase;font-weight:600">Subject</th>
        <th style="padding:11px 14px;text-align:center;font-size:11.5px;letter-spacing:0.06em;text-transform:uppercase;font-weight:600">Marks Obtained</th>
        <th style="padding:11px 14px;text-align:center;font-size:11.5px;letter-spacing:0.06em;text-transform:uppercase;font-weight:600">Total Marks</th>
        <th style="padding:11px 14px;text-align:center;font-size:11.5px;letter-spacing:0.06em;text-transform:uppercase;font-weight:600">Percentage</th>
        <th style="padding:11px 14px;text-align:center;font-size:11.5px;letter-spacing:0.06em;text-transform:uppercase;font-weight:600">Grade</th>
        <th style="padding:11px 14px;text-align:center;font-size:11.5px;letter-spacing:0.06em;text-transform:uppercase;font-weight:600">Status</th>
      </tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>
    <!-- Summary -->
    <div style="margin-top:20px;background:linear-gradient(135deg,#eff6ff,#f0fdf4);border:1.5px solid #bfdbfe;border-radius:10px;padding:16px 24px;display:flex;gap:32px;flex-wrap:wrap;align-items:center">
      ${[['Total Obtained',`${totalObtained} / ${totalMax}`,'#1d4ed8'],['Overall Percentage',`${pct}%`,'#1d4ed8'],['Overall Grade',overallGrade,'#166534'],['Result',pct>=40?'PASS':'FAIL',pct>=40?'#166534':'#b91c1c']].map(([l,v,c])=>`<div><div style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:4px">${l}</div><div style="font-size:18px;font-weight:700;color:${c}">${v}</div></div>`).join('<div style="width:1px;background:#cbd5e1;align-self:stretch"></div>')}
    </div>
  </div>
  <!-- Footer -->
  <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:14px 32px;display:flex;justify-content:space-between;align-items:center">
    <div style="font-size:11px;color:#9ca3af">This is a computer-generated result card. Punjab Group of Colleges, Lalamusa.</div>
    <div class="no-print"><button onclick="window.print()" style="background:#1e3a5f;color:#fff;border:none;padding:8px 20px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer">🖨 Print</button></div>
  </div>
</div>
</body></html>`;
      const blob=new Blob([html],{type:'text/html'});
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');a.href=url;a.download=`Result_Card_${user.name||'Student'}_${new Date().getFullYear()}.html`;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
      showToast('✅ Result Card downloaded — open in browser to Print/Save PDF');
      return;
    }

    if(isTranscript){
      const rowsHtml=activeResults.map((r,i)=>{
        const p=Math.round(r.marks/r.total*100);
        const g=getGrade(p);
        return `<tr style="background:${i%2===0?'#f9fafb':'#ffffff'}">
          <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;font-size:13.5px;font-weight:500;color:#111">${r.subject}</td>
          <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:13px;color:#374151">${r.marks} / ${r.total}</td>
          <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:13px;font-weight:600;color:#374151">${p}%</td>
          <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;text-align:center"><span style="background:${g.startsWith('A')?'#dcfce7':g==='B+'||g==='B'?'#dbeafe':g==='C'?'#fef9c3':'#fee2e2'};color:${g.startsWith('A')?'#166534':g==='B+'||g==='B'?'#1d4ed8':g==='C'?'#713f12':'#b91c1c'};padding:4px 14px;border-radius:20px;font-size:12px;font-weight:700">${g}</span></td>
          <td style="padding:12px 16px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:12.5px;color:${p>=40?'#166534':'#b91c1c'};font-weight:700">${p>=40?'Pass':'Fail'}</td>
        </tr>`;
      }).join('');
      const html=`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
<title>Official Transcript — ${data.name}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Inter',sans-serif;background:#f1f5f9;display:flex;justify-content:center;padding:30px 16px;min-height:100vh}
  .page{width:780px;background:#fff;border-radius:12px;box-shadow:0 4px 32px rgba(0,0,0,0.12);overflow:hidden}
  @media print{body{background:#fff;padding:0}.page{box-shadow:none;border-radius:0;width:100%}.no-print{display:none!important}}
</style>
</head><body>
<div class="page">
  <!-- Official Header -->
  <div style="background:linear-gradient(135deg,#1a0a00,#7c2d12);padding:0 32px 0;color:#fff">
    <div style="display:flex;align-items:center;gap:20px;padding:24px 0 20px;border-bottom:1px solid rgba(255,255,255,0.15)">
      <div style="width:68px;height:68px;background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <svg viewBox="0 0 40 40" width="50" height="50"><circle cx="20" cy="20" r="18" fill="#7c2d12"/><text x="20" y="26" text-anchor="middle" font-size="14" font-weight="bold" fill="#fff" font-family="serif">PGC</text></svg>
      </div>
      <div>
        <div style="font-family:'Noto Serif',serif;font-size:24px;font-weight:700">Punjab Group of Colleges</div>
        <div style="font-size:11px;opacity:0.65;letter-spacing:0.1em;text-transform:uppercase;margin-top:4px">Lalamusa Campus · Established 1992</div>
      </div>
      <div style="margin-left:auto;text-align:right">
        <div style="font-family:'Noto Serif',serif;font-size:20px;font-weight:700;letter-spacing:0.02em">OFFICIAL TRANSCRIPT</div>
        <div style="font-size:11px;opacity:0.6;margin-top:4px">Academic Record Document</div>
      </div>
    </div>
    <div style="padding:12px 0;font-size:11.5px;opacity:0.55;text-align:center;letter-spacing:0.04em">
      This official transcript is issued by Punjab Group of Colleges, Lalamusa and certifies the academic record of the named student.
    </div>
  </div>
  <!-- Student Details Card -->
  <div style="padding:22px 32px;background:#fffbf5;border-bottom:2px solid #e7d7c9">
    <div style="font-size:11px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:14px">Student Information</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px">
      ${[['Student Name',user.name||data.name],['Father\'s Name','-'],['Roll Number',user.roll||'FSc-B-041'],['Program',studentProgram],['Section / Class',studentSection],['Academic Session','2025 – 2026'],['CNIC / B-Form No','XXXXX-XXXXXXX-X'],['Enrollment Date','01 Sept 2025'],['Issue Date',todayStr]].map(([l,v])=>`<div style="background:#fff;border:1px solid #e7d7c9;border-radius:8px;padding:10px 14px"><div style="font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px">${l}</div><div style="font-size:13px;font-weight:600;color:#111">${v}</div></div>`).join('')}
    </div>
  </div>
  <!-- Academic Record -->
  <div style="padding:24px 32px">
    <div style="font-size:12px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e5e7eb">Academic Performance Record — Monthly Test, March 2026</div>
    <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
      <thead><tr style="background:#7c2d12;color:#fff">
        <th style="padding:12px 16px;text-align:left;font-size:11px;letter-spacing:0.07em;text-transform:uppercase;font-weight:600">Subject / Course</th>
        <th style="padding:12px 16px;text-align:center;font-size:11px;letter-spacing:0.07em;text-transform:uppercase;font-weight:600">Marks (Obtained / Total)</th>
        <th style="padding:12px 16px;text-align:center;font-size:11px;letter-spacing:0.07em;text-transform:uppercase;font-weight:600">Percentage</th>
        <th style="padding:12px 16px;text-align:center;font-size:11px;letter-spacing:0.07em;text-transform:uppercase;font-weight:600">Grade</th>
        <th style="padding:12px 16px;text-align:center;font-size:11px;letter-spacing:0.07em;text-transform:uppercase;font-weight:600">Result</th>
      </tr></thead>
      <tbody>${rowsHtml}</tbody>
    </table>
    <!-- Cumulative Summary -->
    <div style="margin-top:20px;border:2px solid #7c2d12;border-radius:10px;overflow:hidden">
      <div style="background:#7c2d12;color:#fff;padding:10px 20px;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase">Cumulative Summary</div>
      <div style="padding:16px 20px;display:flex;gap:0;flex-wrap:wrap">
        ${[['Total Marks Obtained',`${totalObtained}`],['Total Marks',`${totalMax}`],['Overall Percentage',`${pct}%`],['Overall Grade',overallGrade],['Final Result',pct>=40?'PASS':'FAIL']].map(([l,v],idx)=>`<div style="flex:1;min-width:110px;padding:8px 16px;${idx>0?'border-left:1px solid #e5e7eb':''}"><div style="font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:5px">${l}</div><div style="font-size:20px;font-weight:700;color:${l==='Final Result'?(pct>=40?'#166534':'#b91c1c'):'#7c2d12'}">${v}</div></div>`).join('')}
      </div>
    </div>
    <!-- Signatures -->
    <div style="margin-top:28px;display:flex;justify-content:space-between;padding-top:16px;border-top:1px solid #e5e7eb">
      ${[['Class Teacher','Asif Mehmood'],['Controller of Examinations',''],['Principal','']].map(([role,name])=>`<div style="text-align:center;min-width:160px"><div style="height:40px;border-bottom:1px solid #374151;margin-bottom:6px"></div><div style="font-size:11.5px;font-weight:600;color:#111">${role}</div>${name?`<div style="font-size:10.5px;color:#6b7280">${name}</div>`:''}</div>`).join('')}
    </div>
  </div>
  <!-- Footer -->
  <div style="background:#f8fafc;border-top:2px solid #e2e8f0;padding:12px 32px;display:flex;justify-content:space-between;align-items:center">
    <div style="font-size:10.5px;color:#9ca3af">Document No: PGC/GJT/TR/${new Date().getFullYear()}/${Math.floor(1000+Math.random()*9000)} · Issued: ${todayStr}</div>
    <div class="no-print"><button onclick="window.print()" style="background:#7c2d12;color:#fff;border:none;padding:8px 20px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer">🖨 Print / Save PDF</button></div>
  </div>
</div>
</body></html>`;
      const blob=new Blob([html],{type:'text/html'});
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');a.href=url;a.download=`Official_Transcript_${user.name||'Student'}.html`;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
      showToast('✅ Transcript downloaded — open in browser to Print/Save PDF');
      return;
    }

    // Course material / other files
    const text=content||`PGC Study Material\n\nFile: ${name}\n\nPunjab Group of Colleges, Lalamusa\n${todayStr}`;
    const blob=new Blob([text],{type:'text/plain'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download=name.replace(/\.pdf$/i,'.txt');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`✅ Downloaded: ${name}`);
  };
  const navItems=[
    {id:'s-home',label:'Dashboard',icon:<svg viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" width="14" height="14"><rect x="1" y="1" width="4.5" height="4.5" rx="1"/><rect x="7.5" y="1" width="4.5" height="4.5" rx="1"/><rect x="1" y="7.5" width="4.5" height="4.5" rx="1"/><rect x="7.5" y="7.5" width="4.5" height="4.5" rx="1"/></svg>},
    {id:'s-attend',label:'Attendance',icon:<svg viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" width="14" height="14"><circle cx="6.5" cy="3.5" r="2.2"/><path d="M1 12c0-2.8 2.5-4.5 5.5-4.5s5.5 1.7 5.5 4.5"/></svg>},
    {id:'s-assign',label:'Assignments',icon:<svg viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" width="14" height="14"><rect x="2" y="1" width="9" height="11" rx="1.2"/><line x1="4" y1="4.5" x2="9" y2="4.5"/><line x1="4" y1="7" x2="9" y2="7"/><line x1="4" y1="9.5" x2="7" y2="9.5"/></svg>},
    {id:'s-tt',label:'Timetable',icon:<svg viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" width="14" height="14"><rect x="1" y="2" width="11" height="10" rx="1.2"/><line x1="1" y1="5" x2="12" y2="5"/><line x1="4" y1="1" x2="4" y2="3.5"/><line x1="9" y1="1" x2="9" y2="3.5"/></svg>},
    {id:'s-result',label:'Results',icon:<svg viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" width="14" height="14"><polyline points="1,9 3.5,5.5 6.5,7.5 9.5,3.5 12,5"/></svg>},
    {id:'s-course',label:'Courses',icon:<svg viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" width="14" height="14"><path d="M1 3.5L6.5 1 12 3.5v1.5L6.5 8 1 5V3.5z"/><path d="M1 7l5.5 2.5L12 7"/></svg>},
    {id:'s-notif',label:'Notifications',extra:unread>0&&<span style={{marginLeft:'auto',background:'rgba(192,57,43,0.2)',color:'#f87171',fontSize:8,padding:'1px 5px',borderRadius:8,border:'1px solid rgba(192,57,43,0.25)'}}>{unread}</span>,icon:<svg viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" width="14" height="14"><path d="M6.5 1a3.5 3.5 0 0 1 3.5 3.5c0 2.8 1 3.5 1 3.5H2s1-.7 1-3.5A3.5 3.5 0 0 1 6.5 1z"/><line x1="6.5" y1="12" x2="6.5" y2="10"/></svg>},
    {id:'s-perf',label:'Performance',icon:<svg viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" width="14" height="14"><polyline points="1,10 4,6 7,8 10,3 12,5"/></svg>},
  ];

  const attPresent=realAttendance.filter(r=>r.status==='P').length;
const attAbsent=realAttendance.filter(r=>r.status==='A').length;
const attTotal=realAttendance.length;
const attOverall=attTotal>0?Math.round((attPresent/attTotal)*100):0;
const attLog=[...realAttendance].sort((a,b)=>new Date(b.date)-new Date(a.date)).map(r=>({
  date:new Date(r.date).toLocaleDateString('en-GB',{day:'2-digit',month:'short'}),
  subject:r.subject||r.class,
  status:r.status==='P'?'Present':r.status==='A'?'Absent':'Leave',
  method:r.mode||'Manual'
}));
const d={
  ...data,
  assignments: realAssignments,
  results: realResults,
  attendance: { overall: attOverall, present: attPresent, absent: attAbsent, log: attLog, subjects: [] }
};
const avgMarks = d.results.length>0 ? Math.round(d.results.reduce((a,r)=>a+(r.percentage??(r.total>0?(r.marks/r.total*100):0)),0)/d.results.length) : 0;
const highestMarks = d.results.length>0 ? Math.max(...d.results.map(r=>r.percentage??(r.total>0?Math.round(r.marks/r.total*100):0))) : 0;
const overallGrade = d.results.length>0 ? (avgMarks>=90?'A+':avgMarks>=80?'A':avgMarks>=70?'B+':avgMarks>=60?'B':avgMarks>=50?'C':avgMarks>=40?'D':'F') : '—';
  const paneTitle=navItems.find(n=>n.id===activePane)?.label||'Dashboard';

  return(
    <div className="dash-wrap">
      <div className="sidebar" style={{background:'linear-gradient(180deg,#0b1e3d 0%,#07121f 100%)'}}>
        <div className="sb-logo">
          <div className="sb-logo-row">
            <PGCLogo size={28}/>
            <div><div className="sb-text">PGC Portal</div><div className="sb-sub">Student Panel</div></div>
          </div>
        </div>
        <div className="sb-nav">
          <div className="nav-grp">Main</div>
          {navItems.map(n=>(
            <button key={n.id} className={`nav-item ${activePane===n.id?'active':''}`} onClick={()=>setActivePane(n.id)}>
              {n.icon}{n.label}{n.extra}
            </button>
          ))}
        </div>
        <div className="sb-footer">
          <div className="sb-user">
            <div className="sb-av" style={{background:'rgba(36,113,163,0.35)'}}>{(user.name||d.name)[0]}</div>
            <div><div className="sb-uname">{user.name||d.name}</div><div className="sb-urole">{studentClass}</div></div>
          </div>
          <button className="logout-btn" onClick={onLogout}><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" width="12" height="12"><path d="M5 2H2v8h3"/><polyline points="8,4 11,6 8,8"/><line x1="5" y1="6" x2="11" y2="6"/></svg>Sign out</button>
        </div>
      </div>
      <div className="main">
        <div className="topbar">
          <div className="tb-title">{paneTitle}</div>
          <div className="tb-right">
            <button className="nb" onClick={()=>setActivePane('s-notif')}><svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2" width="13" height="13"><path d="M6 1a3.5 3.5 0 0 1 3.5 3.5c0 2.8 1 3.5 1 3.5H1s1-.7 1-3.5A3.5 3.5 0 0 1 6 1z"/><line x1="6" y1="11" x2="6" y2="9"/></svg>{unread>0&&<div className="ndot"></div>}</button>
            <div className="tb-date">7 Apr 2026</div>
          </div>
        </div>
        <div className="content">

          {/* HOME */}
          <div className={`panel ${activePane==='s-home'?'active':''}`}>
            <div className="sg">
              <div className="sc sc-green" onClick={()=>setActivePane('s-attend')}><div className="sc-icon"><svg viewBox="0 0 15 15" fill="none" stroke="#1D9E75" strokeWidth="1.3" width="14"><circle cx="7.5" cy="7.5" r="5.5"/><polyline points="5,7.5 7,9.5 10.5,5.5"/></svg></div><div className="sc-l">Attendance</div><div className="sc-v">{d.attendance.overall}%</div><div className="sc-s">Click to view →</div></div>
              <div className="sc sc-blue" onClick={()=>setActivePane('s-assign')}><div className="sc-icon"><svg viewBox="0 0 15 15" fill="none" stroke="#2471A3" strokeWidth="1.3" width="14"><rect x="2" y="1" width="11" height="13" rx="1.5"/><line x1="5" y1="5" x2="10" y2="5"/><line x1="5" y1="7.5" x2="10" y2="7.5"/></svg></div><div className="sc-l">Assignments</div><div className="sc-v">{d.assignments.length}</div><div className="sc-s">{d.assignments.filter(a=>a.status==='Pending').length} pending</div></div>
              <div className="sc sc-purple" onClick={()=>setActivePane('s-result')}><div className="sc-icon"><svg viewBox="0 0 15 15" fill="none" stroke="#7F77DD" strokeWidth="1.3" width="14"><polyline points="1,11 4,7 7,9 10.5,4.5 14,6"/></svg></div><div className="sc-l">Avg Marks</div><div className="sc-v">{avgMarks}%</div><div className="sc-s">Overall avg.</div></div>
              <div className="sc sc-red" onClick={()=>setActivePane('s-notif')}><div className="sc-icon"><svg viewBox="0 0 15 15" fill="none" stroke="#C0392B" strokeWidth="1.3" width="14"><path d="M7.5 1a4.5 4.5 0 0 1 4.5 4.5c0 3.5 1.3 4.5 1.3 4.5H1.7s1.3-1 1.3-4.5A4.5 4.5 0 0 1 7.5 1z"/><line x1="7.5" y1="14" x2="7.5" y2="11.5"/></svg></div><div className="sc-l">Notifications</div><div className="sc-v">{unread}</div><div className="sc-s">Unread</div></div>
            </div>
            <div className="twoC">
              <div className="card"><div className="ct"><div className="ct-dot" style={{background:'#2471A3'}}></div>Upcoming Assignments <button className="d-btn d-btn-blue" style={{marginLeft:'auto',fontSize:'9px',padding:'2px 8px'}} onClick={()=>setActivePane('s-assign')}>View All</button></div>
                {d.assignments.filter(a=>a.status!=='Graded').slice(0,3).map(a=>(<div className="ri" key={a.id}><div><div className="rm">{a.subject} – {a.title}</div><div className="rs">Due: {a.due}</div></div><span className={`badge ${getStatusColor(a.status)}`}>{a.status}</span></div>))}
              </div>
              <div className="card"><div className="ct"><div className="ct-dot" style={{background:'#1D9E75'}}></div>Today's Schedule</div>
                {(()=>{
  const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const today=days[new Date().getDay()];
  const todaySlots=(myTimetable||[]).map(row=>({time:row.time,subject:row[today]||''})).filter(r=>r.subject);
  if(todaySlots.length===0) return <div style={{color:'rgba(255,255,255,0.25)',fontSize:11,padding:'8px 0'}}>No classes scheduled today.</div>;
  return todaySlots.map((s,i)=>(
    <div className="ri" key={i}>
      <div><div className="rm">{s.subject}</div><div className="rs">{s.time}</div></div>
      <span className={`badge ${i===0?'bb':i===1?'bg':'ba'}`}>{i===0?'Now':i===1?'Next':'Later'}</span>
    </div>
  ));
})()}
              </div>
            </div>
            {allNotifs.filter(n=>!isNotifRead(n)).length>0&&(
              <div className="card">
                <div className="ct"><div className="ct-dot" style={{background:'#C0392B'}}></div>🔔 New Notifications
                  <button className="d-btn d-btn-blue" style={{marginLeft:'auto',fontSize:'9px',padding:'2px 8px'}} onClick={()=>setActivePane('s-notif')}>View All</button>
                </div>
                {allNotifs.filter(n=>!isNotifRead(n)).slice(0,4).map(n=>(
                  <div className="notif-item" key={n.id} onClick={()=>{ if(n._src) markExtRead(n.id); else setNotifications(notifications.map(x=>x.id===n.id?{...x,read:true}:x)); }}>
                    <div className="notif-dot" style={{background:n.color}}></div>
                    <div style={{flex:1}}>
                      <div className="notif-text">{n.text}</div>
                      <div className="notif-time">{n.time}{n._src&&<span className={`badge ${n._src==='admin'?'br':'bb'}`} style={{marginLeft:6,fontSize:8}}>{n._src==='admin'?'Admin':'Teacher'}</span>}</div>
                    </div>
                    <div style={{width:6,height:6,borderRadius:'50%',background:n.color,flexShrink:0,marginTop:6}}></div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ATTENDANCE */}
          <div className={`panel ${activePane==='s-attend'?'active':''}`}>
            {(()=>{
              const [showFullQR,setShowFullQR]=useState(false);
              const studentId=user.roll||'FSc-2026-B-041';
              const studentName=user.name||d.name;

              // ── REAL UNIQUE QR (v26 logic) ────────────────────────────────────────
              // Har student ka QR alag hoga — roll + name se unique text banta hai
              // jo teacher ka scanner verify karta hai
              const studentObj={
                id: user.id||studentId,
                name: studentName,
                roll: studentId
              };
              const uniqueQRText=generateUniqueQRText(studentObj);
              const qrApiUrl=(sz)=>`https://api.qrserver.com/v1/create-qr-code/?size=${sz}x${sz}&data=${encodeURIComponent(uniqueQRText)}`;

              function StudentQRCode({size=140,pulse=false}){
                return(
                  <div style={{position:'relative',display:'inline-block'}}>
                    <img
                      src={qrApiUrl(size)}
                      alt="Student QR Code"
                      width={size}
                      height={size}
                      style={{display:'block',borderRadius:8}}
                    />
                    {pulse&&<div style={{position:'absolute',inset:0,borderRadius:8,border:'3px solid #2471A3',animation:'pulse 2s ease infinite',pointerEvents:'none'}}/>}
                  </div>
                );
              }
              // ── END REAL UNIQUE QR ────────────────────────────────────────────────

              return(<>
                {/* Summary Stats */}
                <div className="sg">
                  <div className="sc sc-green"><div className="sc-l">Overall</div><div className="sc-v">{d.attendance.overall}%</div><div className="sc-s">{d.attendance.present}/{d.attendance.present+d.attendance.absent} classes</div></div>
                  <div className="sc sc-blue"><div className="sc-l">Present</div><div className="sc-v">{d.attendance.present}</div><div className="sc-s">This month</div></div>
                  <div className="sc sc-red"><div className="sc-l">Absent</div><div className="sc-v">{d.attendance.absent}</div><div className="sc-s">This month</div></div>
                  <div className="sc sc-amber"><div className="sc-l">Shortage Risk</div><div className="sc-v">{d.attendance.overall<75?'YES':'NO'}</div><div className="sc-s">{d.attendance.overall>=75?'Safe':'Below 75%'}</div></div>
                </div>

                {/* QR ID Card + Attendance Log — Side by Side */}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
                <div className="card" style={{marginBottom:0}}>
                  <div className="ct"><div className="ct-dot" style={{background:'#2471A3'}}></div>
                    My QR Code — Show to Teacher
                    <span style={{marginLeft:'auto',fontSize:9,color:'#4ade80',background:'rgba(29,131,72,0.15)',border:'1px solid rgba(29,131,72,0.25)',borderRadius:10,padding:'2px 8px'}}>🟢 Active</span>
                  </div>

                  {/* Student ID Card */}
                  <div style={{background:'linear-gradient(135deg,#0d1e38,#152647)',border:'1px solid rgba(36,113,163,0.35)',borderRadius:16,padding:'22px 24px',display:'flex',gap:22,alignItems:'center',position:'relative',overflow:'hidden'}}>
                    {/* Background decoration */}
                    <div style={{position:'absolute',top:-30,right:-30,width:120,height:120,borderRadius:'50%',background:'rgba(36,113,163,0.08)',pointerEvents:'none'}}/>
                    <div style={{position:'absolute',bottom:-20,left:-20,width:90,height:90,borderRadius:'50%',background:'rgba(192,57,43,0.05)',pointerEvents:'none'}}/>

                    {/* QR Code */}
                    <div style={{background:'#fff',padding:10,borderRadius:14,flexShrink:0,boxShadow:'0 4px 20px rgba(0,0,0,0.5)',cursor:'pointer'}} onClick={()=>setShowFullQR(true)} title="Click to expand">
                      <StudentQRCode size={120} pulse={true}/>
                      <div style={{textAlign:'center',fontSize:8.5,color:'#1e3a5f',marginTop:6,fontWeight:700,letterSpacing:'0.05em'}}>{studentId}</div>
                    </div>

                    {/* Info */}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:9,color:'rgba(255,255,255,0.3)',textTransform:'uppercase',letterSpacing:'0.12em',marginBottom:6}}>Punjab Group of Colleges · Lalamusa</div>
                      <div style={{fontSize:18,fontWeight:800,color:'#fff',marginBottom:4,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{studentName}</div>
                      <div style={{fontSize:11,color:'rgba(255,255,255,0.45)',marginBottom:2}}>Roll No: <span style={{color:'#90cdf4',fontWeight:700}}>{studentId}</span></div>
                      <div style={{fontSize:11,color:'rgba(255,255,255,0.45)',marginBottom:2}}>Section: <span style={{color:'var(--white2)',fontWeight:500}}>{studentClass}</span></div>
                      <div style={{fontSize:11,color:'rgba(255,255,255,0.45)',marginBottom:14}}>Program: <span style={{color:'var(--white2)',fontWeight:500}}>{studentProgram}</span></div>
                      <div style={{background:'rgba(29,131,72,0.1)',border:'1px solid rgba(29,131,72,0.25)',borderRadius:10,padding:'10px 14px',fontSize:10.5,color:'rgba(255,255,255,0.5)',lineHeight:1.8}}>
                        <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                          <span style={{width:7,height:7,borderRadius:'50%',background:'#4ade80',display:'inline-block',boxShadow:'0 0 8px #4ade80'}}></span>
                          <strong style={{color:'#4ade80',fontSize:11}}>How to use:</strong>
                        </div>
                        <div>1. Open this screen 📱</div>
                        <div>2. Show QR code to teacher 👩‍🏫</div>
                        <div>3. Teacher scans → Marked Present ✅</div>
                      </div>

                      <button onClick={()=>setShowFullQR(true)} style={{marginTop:12,padding:'9px 18px',background:'rgba(36,113,163,0.2)',border:'1px solid rgba(36,113,163,0.35)',borderRadius:8,color:'#60a5fa',fontSize:12,fontWeight:600,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:6}}>
                        🔍 Show Full Screen QR
                      </button>
                    </div>
                  </div>

                  {/* Anti-proxy notice */}
                  <div style={{marginTop:10,display:'flex',gap:8,flexWrap:'wrap'}}>
                    {[['🛡️ Anti-Proxy','Teacher verifies your face'],['🔐 Secure','Encrypted student ID'],['📸 Verified','Photo confirmation on teacher screen']].map(([icon,text])=>(
                      <span key={text} style={{fontSize:10,color:'rgba(255,255,255,0.35)',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:16,padding:'4px 12px'}}>{icon} {text}</span>
                    ))}
                  </div>
                </div>

                {/* Right side — Attendance Log */}
                <div className="card" style={{marginBottom:0}}>
                  <div className="ct"><div className="ct-dot" style={{background:'#D4AC0D'}}></div>My Attendance Log</div>
                  <div style={{fontSize:10,color:'rgba(255,255,255,0.25)',marginBottom:8,fontStyle:'italic'}}>Updated by teacher each class</div>
                  <table className="mt">
                    <thead><tr><th>Date</th><th>Subject</th><th>By</th><th>Status</th></tr></thead>
                    <tbody>{d.attendance.log.map((l,i)=>{
                      const raw=l.status;
                      const short=raw==='Present'?'P':raw==='Absent'?'A':'L';
                      const bc=short==='P'?'bg':short==='A'?'br':'ba';
                      return(
                        <tr key={i}>
                          <td style={{fontWeight:500,fontSize:11}}>{l.date}</td>
                          <td style={{fontSize:11}}>{l.subject}</td>
                          <td style={{fontSize:9,color:'rgba(255,255,255,0.35)'}}>
                            {l.method==='QR Scan'?<span style={{color:'#60a5fa'}}>📷 QR</span>:<span style={{color:'#D4AC0D'}}>✍️ Manual</span>}
                          </td>
                          <td><span className={`badge ${bc}`} style={{fontWeight:800}}>{short==='P'?'✓ P':short==='A'?'✗ A':'⏸ L'}</span></td>
                        </tr>
                      );
                    })}</tbody>
                  </table>
                </div>
                </div>{/* end side-by-side grid */}

                {d.attendance.overall<75&&(
  <div style={{background:'rgba(192,57,43,0.1)',border:'1px solid rgba(192,57,43,0.25)',borderRadius:8,padding:'12px 16px',fontSize:11,color:'#f87171',marginBottom:14}}>
    ⚠️ Your overall attendance is below 75%. Contact your class teacher for medical leave applications.
  </div>
)}

                {/* Full-screen QR modal */}
                {showFullQR&&(
                  <div style={{position:'fixed',inset:0,background:'rgba(5,10,24,0.97)',zIndex:9999,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',animation:'fadeIn 0.15s ease'}} onClick={()=>setShowFullQR(false)}>
                    <div style={{textAlign:'center',padding:32}} onClick={e=>e.stopPropagation()}>
                      <div style={{fontSize:12,color:'rgba(255,255,255,0.3)',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:16}}>Punjab Group of Colleges · Lalamusa</div>
                      <div style={{background:'#fff',padding:20,borderRadius:20,display:'inline-block',boxShadow:'0 8px 40px rgba(0,0,0,0.6)',marginBottom:16}}>
                        <StudentQRCode size={220}/>
                        <div style={{textAlign:'center',fontSize:11,color:'#1e3a5f',marginTop:10,fontWeight:700,letterSpacing:'0.05em'}}>{studentId}</div>
                      </div>
                      <div style={{color:'#fff',fontSize:18,fontWeight:700,marginBottom:4}}>{studentName}</div>
                      <div style={{color:'rgba(255,255,255,0.4)',fontSize:12,marginBottom:4}}>{studentClass}</div>
                      <div style={{color:'rgba(255,255,255,0.3)',fontSize:11,marginBottom:24}}>Show this QR code to your teacher for attendance</div>
                      <button onClick={()=>setShowFullQR(false)} style={{padding:'10px 28px',background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.15)',borderRadius:10,color:'rgba(255,255,255,0.7)',fontSize:13,cursor:'pointer'}}>Close ✕</button>
                    </div>
                  </div>
                )}
              </>);
            })()}
          </div>

          {/* ASSIGNMENTS */}
          <div className={`panel ${activePane==='s-assign'?'active':''}`}>
            {(()=>{
              const [assignTab,setAssignTab]=useState('view');
              const [subjectFilter,setSubjectFilter]=useState('All');
              const [statusFilter,setStatusFilter]=useState('All');
              const [selAssignId,setSelAssignId]=useState('');
              const [pastedText,setPastedText]=useState('');
              const [fileReady,setFileReady]=useState(null);
              const [uploadedFile,setUploadedFile]=useState(null);
              const [customSubject,setCustomSubject]=useState('');
              const [customTitle,setCustomTitle]=useState('');
              const [customDue,setCustomDue]=useState('');
              const [submissionHistory,setSubmissionHistory]=useState([]);

              const allSubjects=useMemo(()=>{
  const cls=studentClass.toLowerCase();
  if(cls.includes('pre-eng')||cls.includes('pre eng'))
    return['All','Physics','Chemistry','Mathematics','English','Urdu','Pak Studies','Islamic Studies','Other'];
  if(cls.includes('pre-med')||cls.includes('pre med'))
    return['All','Biology','Chemistry','Physics','English','Urdu','Pak Studies','Islamic Studies','Other'];
  if(cls.includes('ics'))
    return['All','Computer','Mathematics','Physics','English','Urdu','Pak Studies','Islamic Studies','Other'];
  if(cls.includes('icom')||cls.includes('commerce'))
    return['All','Accounting','Economics','Mathematics','English','Urdu','Pak Studies','Islamic Studies','Other'];
  if(cls.includes('fa'))
    return['All','Education','English','Urdu','Pak Studies','Islamic Studies','Fine Arts','Other'];
  if(cls.includes('bsc'))
    return['All','Mathematics','Physics','Chemistry','Biology','Computer Science','Statistics','English','Other'];
  return['All','Physics','Chemistry','Mathematics','English','Biology','Computer','Urdu','Islamic Studies','Other'];
    // eslint-disable-next-line react-hooks/exhaustive-deps
},[studentClass]);
              const filteredAssignments2=d.assignments.filter(a=>{
                const matchSubject=subjectFilter==='All'||a.subject===subjectFilter;
                const matchStatus=statusFilter==='All'||a.status===statusFilter;
                const matchSearch=a.subject.toLowerCase().includes(searchTerm.toLowerCase())||a.title.toLowerCase().includes(searchTerm.toLowerCase());
                return matchSubject&&matchStatus&&matchSearch;
              });

              const handlePaste=(e)=>{
                const text=e.clipboardData?.getData('text')||'';
                if(text) setPastedText(text);
              };

              const submitWithPaste=async()=>{
                if(!selAssignId){ showToast('Please select an assignment from the assigned list','⚠'); return; }
                if(!pastedText&&!uploadedFile){ showToast('Please paste assignment content or upload a file','⚠'); return; }
                try{
                  const token = localStorage.getItem('token');
                  let res;
                  if(uploadedFile){
                    const formData = new FormData();
                    formData.append('file', uploadedFile);
                    formData.append('studentId', user.id);
                    res = await fetch(`http://localhost:5000/api/assignments/${selAssignId}/submit`, {
                      method:'POST',
                      headers:{ 'Authorization': `Bearer ${token}` },
                      body: formData
                    });
                  } else {
                    res = await fetch(`http://localhost:5000/api/assignments/${selAssignId}/submit`, {
                      method:'POST',
                      headers:{ 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` },
                      body: JSON.stringify({ studentId: user.id, fileUrl: pastedText })
                    });
                  }
                  if(!res.ok) throw new Error('submit failed');
                  const subject=d.assignments.find(a=>String(a.id)===selAssignId)?.subject||customSubject;
                  const title=d.assignments.find(a=>String(a.id)===selAssignId)?.title||customTitle;
                  const newHistEntry={id:Date.now(),subject,title:title||'Assignment',submittedOn:new Date().toLocaleDateString('en-GB'),status:'Submitted',marks:'–',feedback:'–'};
                  setSubmissionHistory(prev=>[newHistEntry,...prev]);
                  setSubmitStatuses(prev=>({...prev,[selAssignId]:'Submitted'}));
                  setPastedText('');setFileReady(null);setUploadedFile(null);setSelAssignId('');setCustomSubject('');setCustomTitle('');setCustomDue('');
                  showToast('✅ Assignment submitted successfully!');
                  setAssignTab('history');
                }catch(err){
                  showToast('Error submitting assignment','⚠');
                }
              };

              const resubmit=(entry)=>{
                setAssignTab('submit');
                setCustomSubject(entry.subject);
                setCustomTitle(entry.title);
                showToast('Fill content and resubmit — resubmission allowed!','📝');
              };

               const realHistory=d.assignments.filter(a=>a.status==='Submitted'||a.status==='Graded').map(a=>({
                id:a.id,
                subject:a.subject,
                title:a.title,
                submittedOn:a.due,
                status:a.status==='Graded'?'Checked':'Submitted',
                marks:a.marks?`${a.marks}/${a.total}`:'–',
                feedback:a.feedback||'–'
              }));
              const combinedHistory=[...realHistory,...submissionHistory];

              return(<>
                <div className="tab-row">{[['view','📋 My Assignments'],['submit','📤 Submit'],['history','📁 History']].map(([t,l])=><button key={t} className={`tab-btn ${assignTab===t?'active':''}`} onClick={()=>setAssignTab(t)}>{l}</button>)}</div>

                {assignTab==='view'&&(<>
                  <div style={{display:'flex',gap:8,marginBottom:10,flexWrap:'wrap',alignItems:'center'}}>
                    <div className="search-bar" style={{flex:1,minWidth:180}}>
                      <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" width="14" height="14"><circle cx="6" cy="6" r="4.5"/><line x1="9.2" y1="9.2" x2="13" y2="13"/></svg>
                      <input placeholder="Search by subject or title..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
                    </div>
                    <select className="d-select" style={{width:'auto',marginBottom:0}} value={subjectFilter} onChange={e=>setSubjectFilter(e.target.value)}>
                      {allSubjects.map(s=><option key={s}>{s}</option>)}
                    </select>
                    <select className="d-select" style={{width:'auto',marginBottom:0}} value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
                      {['All','Pending','Submitted','Graded','Draft'].map(s=><option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="card"><div className="ct"><div className="ct-dot" style={{background:'#2471A3'}}></div>Assigned Assignments ({filteredAssignments2.length})</div>
                    <table className="mt"><thead><tr><th>Subject</th><th>Title</th><th>Due Date</th><th>Instructions</th><th>Status</th><th>Marks</th><th>Action</th></tr></thead>
                    <tbody>{filteredAssignments2.map((a,i)=>(<tr key={i}>
                      <td>{a.subject}</td><td>{a.title}</td><td>{a.due}</td>
                      <td style={{fontSize:10,color:'rgba(255,255,255,0.35)',maxWidth:100}}>
                        {a.instructions||'Complete and submit on time.'}
                        {a.attachmentPath&&(
                          <div style={{marginTop:4}}>
                            <a href={`http://localhost:5000/uploads/${a.attachmentPath}`} target="_blank" rel="noopener noreferrer" style={{color:'#60a5fa',fontSize:9,textDecoration:'none'}}>
                              📎 {a.attachmentName||'Download attachment'}
                            </a>
                          </div>
                        )}
                      </td>
                      <td><span className={`badge ${getStatusColor(submitStatuses[a.id]||a.status)}`}>{submitStatuses[a.id]||a.status}</span></td>
                      <td>{a.marks?`${a.marks}/${a.total}`:'–'}</td>
                      <td>
                        {(submitStatuses[a.id]||a.status)==='Pending' ? (
                          <button className="d-btn d-btn-blue" style={{fontSize:'9px',padding:'2px 8px'}} onClick={()=>{setAssignTab('submit');setSelAssignId(String(a.id));}}>Submit</button>
                        ) : (
                          <button className="d-btn" style={{background:'rgba(212,172,13,0.12)',color:'#D4AC0D',border:'1px solid rgba(212,172,13,0.25)',borderRadius:5,padding:'2px 8px',fontSize:'9px',cursor:'pointer'}} onClick={()=>{setAssignTab('submit');setSelAssignId(String(a.id));}}>🔁 Resubmit</button>
                        )}
                      </td>
                    </tr>))}</tbody></table>
                  </div>
                </>)}

                {assignTab==='submit'&&(
                  <div className="card">
                    <div className="ct"><div className="ct-dot" style={{background:'#1D9E75'}}></div>📤 Submit Assignment — Paste from PC or Upload File</div>
                    <div style={{fontSize:11,color:'rgba(255,255,255,0.3)',marginBottom:12}}>💡 Apne PC se assignment copy kar ke neeche paste karein, ya file upload karein. Koi bhi subject ki assignment submit kar sakte hain.</div>

                    <div className="f-group"><div className="f-lab">Select Assigned Assignment (Optional)</div>
                      <select className="d-select" value={selAssignId} onChange={e=>setSelAssignId(e.target.value)}>
                        <option value="">— Select from assigned list (optional) —</option>
                        {d.assignments.filter(a=>a.status!=='Graded').map(a=><option key={a.id} value={a.id}>{a.subject} – {a.title}</option>)}
                      </select>
                    </div>

                    <div style={{fontSize:11,color:'rgba(255,255,255,0.3)',marginBottom:4,textAlign:'center'}}>— OR Enter Custom Subject —</div>
                    <div className="form-row">
                      <div className="f-group"><div className="f-lab">Subject *</div>
                        <select className="d-select" style={{marginBottom:0}} value={customSubject} onChange={e=>setCustomSubject(e.target.value)}>
                          <option value="">— Select Subject —</option>
                          {['Physics','Chemistry','Mathematics','English','Biology','Computer','Urdu','Islamic Studies','Pak Studies','Other'].map(s=><option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <div className="f-group"><div className="f-lab">Assignment Title</div><input className="f-inp" style={{width:'100%'}} placeholder="e.g. Chapter 3 Exercise" value={customTitle} onChange={e=>setCustomTitle(e.target.value)}/></div>
                      <div className="f-group"><div className="f-lab">Due Date</div><input type="date" className="f-inp" style={{width:'100%'}} value={customDue} onChange={e=>setCustomDue(e.target.value)}/></div>
                    </div>

                    <div className="f-lab" style={{marginBottom:6,marginTop:8}}>📋 Paste Assignment Here (Ctrl+V or right-click paste)</div>
                    <textarea
                      className="f-inp"
                      style={{width:'100%',minHeight:160,resize:'vertical',fontSize:12,marginBottom:8,borderColor:pastedText?'rgba(29,131,72,0.5)':'rgba(255,255,255,0.09)'}}
                      placeholder="Apne PC se assignment copy karein aur yahan paste karein (Ctrl+V)...&#10;&#10;Ya neeche file upload option bhi use kar sakte hain."
                      value={pastedText}
                      onChange={e=>setPastedText(e.target.value)}
                      onPaste={handlePaste}
                    />
                    {pastedText&&<div style={{fontSize:10,color:'#4ade80',marginBottom:8}}>✅ {pastedText.length} characters pasted — ready to submit</div>}

                    <div style={{fontSize:11,color:'rgba(255,255,255,0.3)',marginBottom:4,textAlign:'center'}}>— OR Upload File —</div>
                    <label htmlFor="file-upload-assign" style={{display:'block',cursor:'pointer'}}>
                      <div className={`d-upload ${fileReady?'has-file':''}`} style={{marginBottom:8}}>
                        {fileReady?`📎 ${fileReady} (ready to submit)`:'📎 Click to select file from PC (Downloads, Desktop, etc.) — Any format, Max 10MB'}
                      </div>
                    </label>
                    <input id="file-upload-assign" type="file" accept="*/*" style={{display:'none'}} onChange={e=>{const f=e.target.files[0];if(f){setFileReady(f.name);setUploadedFile(f);showToast(`📎 File selected: ${f.name} (ready to submit!)`);}}}/>
                    {fileReady&&<div style={{fontSize:10,color:'#4ade80',marginBottom:8}}>✅ File ready: {fileReady}</div>}

                    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                      <button className="d-btn d-btn-green" onClick={submitWithPaste}>📤 Submit Assignment</button>
                      <button className="d-btn d-btn-blue" onClick={()=>{setPastedText('');setFileReady(null);setUploadedFile(null);setSelAssignId('');setCustomSubject('');setCustomTitle('');}}>🔄 Clear</button>
                      <button className="d-btn" style={{background:'rgba(255,255,255,0.06)',color:'rgba(255,255,255,0.4)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:6,padding:'6px 14px',fontSize:11,cursor:'pointer'}} onClick={()=>setAssignTab('view')}>Back to List</button>
                    </div>
                  </div>
                )}
{assignTab==='history'&&(
                  <div className="card">
                    <div className="ct"><div className="ct-dot" style={{background:'#D4AC0D'}}></div>📁 Submission History ({combinedHistory.length})</div>
                    <div style={{fontSize:11,color:'rgba(255,255,255,0.3)',marginBottom:10}}>Aap ki tamam submitted assignments ka record. Status check karein aur zarurat ho to resubmit karein.</div>
                    {combinedHistory.length===0&&<div style={{textAlign:'center',padding:'24px 0',color:'rgba(255,255,255,0.25)',fontSize:12}}>Koi submission nahi mili abhi tak.</div>}
                    <table className="mt"><thead><tr><th>Subject</th><th>Title</th><th>Submitted On</th><th>Status</th><th>Marks</th><th>Feedback</th><th>Action</th></tr></thead>
                    <tbody>{combinedHistory.map((h,i)=>(
                      <tr key={h.id}>
                        <td>{h.subject}</td>
                        <td>{h.title}</td>
                        <td style={{fontSize:10}}>{h.submittedOn}</td>
                        <td><span className={`badge ${h.status==='Checked'?'bg':h.status==='Submitted'?'bb':'ba'}`}>{h.status}</span></td>
                        <td style={{fontWeight:600,color:h.marks==='–'?'rgba(255,255,255,0.3)':'#4ade80'}}>{h.marks}</td>
                        <td style={{fontSize:10,color:'rgba(255,255,255,0.4)',maxWidth:120}}>{h.feedback}</td>
                        <td>
                          {(h.status==='Submitted'||h.status==='Pending')&&
                            <button className="d-btn d-btn-blue" style={{fontSize:'9px',padding:'2px 8px'}} onClick={()=>resubmit(h)}>🔁 Resubmit</button>}
                          {h.status==='Checked'&&
                            <button className="d-btn" style={{background:'rgba(29,131,72,0.15)',color:'#4ade80',border:'1px solid rgba(29,131,72,0.3)',borderRadius:5,padding:'2px 8px',fontSize:'9px',cursor:'pointer'}} onClick={()=>resubmit(h)}>🔁 Resubmit</button>}
                        </td>
                      </tr>
                    ))}</tbody></table>
                  </div>
                )}
              </>);
            })()}
          </div>

          {/* TIMETABLE */}
          <div className={`panel ${activePane==='s-tt'?'active':''}`}>
            <div className="card">
              <div className="ct"><div className="ct-dot" style={{background:'#7F77DD'}}></div>Weekly Timetable — {studentClass}
                <span style={{marginLeft:'auto',fontSize:10,color:'rgba(255,255,255,0.28)'}}>Updated by Admin</span>
              </div>
              {myTtChangelog.length>0&&(
                <div style={{background:'rgba(192,57,43,0.08)',border:'1px solid rgba(192,57,43,0.2)',borderRadius:8,padding:'8px 12px',marginBottom:10,fontSize:11,color:'rgba(255,255,255,0.55)',display:'flex',alignItems:'center',gap:8}}>
                  <span>🔔</span>
                  <span><strong style={{color:'#f87171'}}>{myTtChangelog.length} new change{myTtChangelog.length>1?'s':''}</strong> made to your timetable — slots marked <span style={{background:'#C0392B',borderRadius:3,fontSize:8,padding:'1px 4px',color:'#fff',marginLeft:2}}>NEW</span> are recently added.</span>
                </div>
              )}
              {myTimetable&&myTimetable.length>0?(
                <div className="tt-g">
                  <div className="tt-h"></div>
                  {['Mon','Tue','Wed','Thu','Fri'].map(dy=><div className="tt-h" key={dy}>{dy}</div>)}
                  {myTimetable.map((row,i)=>(
                    <React.Fragment key={i}>
                      <div className="tt-t">{row.time}</div>
                      {['Mon','Tue','Wed','Thu','Fri'].map(day=>{
                        const cell=row[day]||'';
                        const isNew=myTtChangelog.some(c=>c.time===row.time&&c.day===day);
                        return(
                          <div key={day} className={`tt-c ${cell?['tc1','tc2','tc3','tc4','tc5'][i%5]:'tt-e'}`} style={{position:'relative'}}>
                            {cell}
                            {isNew&&cell&&<span style={{position:'absolute',top:2,right:2,background:'#C0392B',borderRadius:3,fontSize:7,padding:'1px 3px',color:'#fff',lineHeight:1}}>NEW</span>}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              ):(
                <div style={{textAlign:'center',padding:'30px 0',color:'rgba(255,255,255,0.25)',fontSize:12}}>No timetable entries yet. Admin will add your schedule.</div>
              )}
            </div>
          </div>

          {/* RESULTS */}
          <div className={`panel ${activePane==='s-result'?'active':''}`}>
            <div className="card"><div className="ct"><div className="ct-dot" style={{background:'#D4AC0D'}}></div>Monthly Test Results — March 2026</div>
              <table className="mt"><thead><tr><th>Subject</th><th>Marks</th><th>Total</th><th>%</th><th>Grade</th><th>Status</th></tr></thead>
              <tbody>{d.results.map((r,i)=>{
  const pct = r.percentage??(r.total>0?Math.round(r.marks/r.total*100):0);
  return(<tr key={i}><td>{r.subject}</td><td>{r.marks}</td><td>{r.total}</td><td>{pct}%</td><td><span className={`badge ${getGradeColor(r.grade)}`}>{r.grade}</span></td><td><span className={`grade-pill ${pct>=40?'pass':'fail'}`}>{pct>=40?'Pass':'Fail'}</span></td></tr>);
})}</tbody>
              </table>
              <div style={{marginTop:12,display:'flex',gap:8,flexWrap:'wrap'}}>
                <button className="d-btn d-btn-blue" onClick={()=>handleDownload('Result_Card_March2026.pdf')}>⬇ Download Result Card</button>
                <button className="d-btn d-btn-primary" onClick={()=>handleDownload('Transcript_Laiba_Imtiaz.pdf')}>⬇ Download Transcript</button>
              </div>
            </div>
            <div className="card"><div className="ct"><div className="ct-dot" style={{background:'#7F77DD'}}></div>Overall Summary</div>
              <div className="analy-grid">
                <div className="analy-card"><div className="analy-val">{avgMarks}%</div><div className="analy-lab">Average</div></div>
<div className="analy-card"><div className="analy-val">{highestMarks}%</div><div className="analy-lab">Highest</div></div>
<div className="analy-card"><div className="analy-val" style={{color:avgMarks>=40?'#4ade80':'#f87171'}}>{avgMarks>=40?'Pass':'Fail'}</div><div className="analy-lab">Status</div></div>
              </div>
            </div>
          </div>

          {/* COURSES */}
          <div className={`panel ${activePane==='s-course'?'active':''}`}>
            {(()=>{
              const downloadCourseMaterial=(course,note)=>{
                if(note.filePath){
  window.open(`http://localhost:5000/uploads/${note.filePath}`, '_blank');
  return;
}
                const today=new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'});
                // Build a realistic, styled course notes HTML document
                const sampleTopics={
                  'Physics':['Newton\'s Laws of Motion','Work, Energy and Power','Waves and Oscillations','Thermodynamics','Electrostatics','Magnetic Effects of Current'],
                  'Mathematics':['Functions and Limits','Derivatives and Differentiation','Integration Techniques','Trigonometric Identities','Matrices and Determinants','Probability'],
                  'Chemistry':['Atomic Structure','Chemical Bonding','States of Matter','Chemical Equilibrium','Electrochemistry','Organic Reactions'],
                  'Biology':['Cell Structure and Function','Genetics and Heredity','Evolution','Human Physiology','Ecology','Plant Physiology'],
                  'English':['Essay Writing Techniques','Grammar Review','Reading Comprehension','Creative Writing','Formal Letter Format','Vocabulary Building'],
                  'Computer':['Programming Fundamentals','Data Structures','Algorithms','Database Concepts','Networking Basics','Web Technologies'],
                };
                const subjectKey=Object.keys(sampleTopics).find(k=>course.name.toLowerCase().includes(k.toLowerCase()))||'Physics';
                const topics=sampleTopics[subjectKey]||sampleTopics['Physics'];
                const topicsHtml=topics.map((t,i)=>`
                  <div style="display:flex;align-items:flex-start;gap:14px;padding:14px 18px;border-bottom:1px solid #f0f4f8;${i===topics.length-1?'border-bottom:none':''}">
                    <div style="width:28px;height:28px;border-radius:50%;background:#1e3a5f;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;margin-top:1px">${i+1}</div>
                    <div>
                      <div style="font-size:14px;font-weight:600;color:#1e293b;margin-bottom:4px">${t}</div>
                      <div style="font-size:12.5px;color:#64748b;line-height:1.6">Key concepts, definitions, and worked examples. Refer to textbook Chapter ${i+2} for additional practice questions and exercises.</div>
                    </div>
                  </div>`).join('');
                const html=`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
<title>${note.name} — ${course.name}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Serif:wght@700&family=Inter:wght@400;500;600;700&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Inter',sans-serif;background:#f1f5f9;display:flex;justify-content:center;padding:30px 16px;min-height:100vh}
  .page{width:760px;background:#fff;border-radius:12px;box-shadow:0 4px 32px rgba(0,0,0,0.12);overflow:hidden}
  @media print{body{background:#fff;padding:0}.page{box-shadow:none;border-radius:0;width:100%}.no-print{display:none!important}}
</style>
</head><body>
<div class="page">
  <!-- Header -->
  <div style="background:linear-gradient(135deg,#0f2444,#1a3a6e);padding:24px 32px;color:#fff">
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:14px">
      <div style="width:52px;height:52px;background:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <svg viewBox="0 0 40 40" width="40" height="40"><circle cx="20" cy="20" r="18" fill="#0f2444"/><text x="20" y="26" text-anchor="middle" font-size="13" font-weight="bold" fill="#fff" font-family="serif">PGC</text></svg>
      </div>
      <div>
        <div style="font-family:'Noto Serif',serif;font-size:18px;font-weight:700">Punjab Group of Colleges — Lalamusa</div>
        <div style="font-size:10px;opacity:0.6;letter-spacing:0.1em;text-transform:uppercase;margin-top:3px">Academic Study Material</div>
      </div>
      <div class="no-print" style="margin-left:auto">
        <button onclick="window.print()" style="background:rgba(255,255,255,0.15);color:#fff;border:1px solid rgba(255,255,255,0.3);padding:8px 18px;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer">🖨 Print / Save PDF</button>
      </div>
    </div>
    <div style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);border-radius:10px;padding:14px 20px;display:flex;gap:32px;flex-wrap:wrap">
      ${[['Course',course.name],['Course Code',course.code||'N/A'],['Teacher',course.teacher],['Total Lectures',course.lectures],['Document',note.name],['Issued On',today]].map(([l,v])=>`<div><div style="font-size:9.5px;opacity:0.5;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:3px">${l}</div><div style="font-size:12.5px;font-weight:600">${v}</div></div>`).join('')}
    </div>
  </div>

  <!-- Document Title -->
  <div style="padding:20px 32px 0">
    <div style="font-family:'Noto Serif',serif;font-size:20px;font-weight:700;color:#1e293b;margin-bottom:4px">📘 ${note.name}</div>
    <div style="font-size:12px;color:#64748b;margin-bottom:16px">Prepared by <strong>${course.teacher}</strong> · ${course.name} · Punjab Group of Colleges</div>
    <div style="background:#eff6ff;border-left:4px solid #2563eb;border-radius:4px;padding:12px 16px;font-size:12.5px;color:#1e40af;line-height:1.6;margin-bottom:20px">
      📌 <strong>Study Note:</strong> These materials are provided to supplement classroom learning. Read each topic carefully, highlight key points, and practice the example questions before your next class.
    </div>
  </div>

  <!-- Topics -->
  <div style="padding:0 32px 24px">
    <div style="font-size:11px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #e2e8f0">Topics Covered in This Document</div>
    <div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
      ${topicsHtml}
    </div>
  </div>

  <!-- Important Notes Box -->
  <div style="padding:0 32px 24px">
    <div style="background:#fafafa;border:1px solid #e2e8f0;border-radius:10px;padding:18px 22px">
      <div style="font-size:12px;font-weight:700;color:#374151;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.06em">📋 Important Reminders</div>
      <ul style="list-style:none;display:flex;flex-direction:column;gap:7px">
        ${['Complete all assigned exercises before the next class.','Review past paper questions for exam preparation.','Bring your textbook and notebook to every class.','Contact your teacher for any topic clarifications during office hours.','All materials are for personal academic use only.'].map(item=>`<li style="font-size:12.5px;color:#4b5563;display:flex;align-items:flex-start;gap:8px"><span style="color:#2563eb;flex-shrink:0">›</span>${item}</li>`).join('')}
      </ul>
    </div>
  </div>

  <!-- Footer -->
  <div style="background:#f8fafc;border-top:2px solid #e2e8f0;padding:12px 32px;display:flex;justify-content:space-between;align-items:center">
    <div style="font-size:10.5px;color:#9ca3af">© Punjab Group of Colleges, Lalamusa · ${note.name} · ${today}</div>
    <div style="font-size:10px;color:#9ca3af">For academic use only</div>
  </div>
</div>
</body></html>`;
                const blob=new Blob([html],{type:'text/html'});
                const url=URL.createObjectURL(blob);
                const a=document.createElement('a');
                a.href=url;
                a.download=`${course.code||course.name.replace(/\s/g,'_')}_${note.name.replace(/[\s.]/g,'_').replace(/pdf$/i,'')}.html`;
                document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
                showToast(`✅ ${note.name} downloaded — open in browser to Print/Save PDF`);
              };
              if(loadingCourses) return <div style={{textAlign:'center',padding:'30px 0',color:'rgba(255,255,255,0.3)'}}>Loading courses...</div>;
              return (
                <>
                  <div style={{display:'flex',alignItems:'center',marginBottom:14}}>
                    <div style={{color:'var(--white2)',fontSize:13,fontWeight:600}}>My Courses ({courses.length})</div>
                    <span style={{marginLeft:'auto',fontSize:10,color:'rgba(255,255,255,0.28)',fontStyle:'italic'}}>Courses are assigned by Admin · Materials uploaded by Teacher</span>
                  </div>
                  {courses.map(c=>(
                    <div className="card" key={c.id}>
                      <div className="ct">
                        <div className="ct-dot" style={{background:'#2471A3'}}></div>
                        <span style={{fontSize:13.5,fontWeight:600}}>{c.name}</span>
                        <span style={{color:'rgba(255,255,255,0.28)',fontSize:10,marginLeft:'auto',background:'rgba(36,113,163,0.1)',border:'1px solid rgba(36,113,163,0.2)',borderRadius:10,padding:'2px 8px'}}>{c.code}</span>
                      </div>
                      <div style={{display:'flex',gap:24,marginBottom:14,padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,0.06)'}}>
                        <div><div style={{color:'rgba(255,255,255,0.28)',fontSize:10,marginBottom:3}}>Teacher</div><div style={{color:'var(--white2)',fontSize:12.5,fontWeight:500}}>{c.teacher}</div></div>
                        <div><div style={{color:'rgba(255,255,255,0.28)',fontSize:10,marginBottom:3}}>Total Lectures</div><div style={{color:'var(--white2)',fontSize:12.5,fontWeight:500}}>{c.lectures}</div></div>
                        <div><div style={{color:'rgba(255,255,255,0.28)',fontSize:10,marginBottom:3}}>Materials</div><div style={{color:c.notes.length>0?'#4ade80':'rgba(255,255,255,0.3)',fontSize:12.5,fontWeight:500}}>{c.notes.length} file{c.notes.length!==1?'s':''}</div></div>
                      </div>
                      {c.notes.length>0&&(
                        <>
                          <div style={{color:'rgba(255,255,255,0.35)',fontSize:10,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.06em',fontWeight:600}}>📂 Study Materials — Uploaded by {c.teacher}</div>
                          {c.notes.map(n=>(
                            <div key={n.name} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',borderRadius:8,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.07)',marginBottom:8}}>
                              <div style={{display:'flex',alignItems:'center',gap:10}}>
                                <div style={{width:34,height:34,borderRadius:8,background:'rgba(192,57,43,0.15)',border:'1px solid rgba(192,57,43,0.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>📄</div>
                                <div>
                                  <div style={{color:'var(--white2)',fontSize:12.5,fontWeight:500}}>{n.name}</div>
                                  <div style={{color:'rgba(255,255,255,0.28)',fontSize:10,marginTop:2}}>PDF · Uploaded by {c.teacher}</div>
                                </div>
                              </div>
                              <button
                                className="d-btn d-btn-blue"
                                style={{fontSize:'10px',padding:'5px 14px',display:'flex',alignItems:'center',gap:5}}
                                onClick={()=>downloadCourseMaterial(c,n)}
                              >
                                <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4" width="11" height="11"><path d="M6 1v7M3 5l3 3 3-3"/><path d="M1 10h10"/></svg>
                                Download PDF
                              </button>
                            </div>
                          ))}
                        </>
                      )}
                      {c.notes.length===0&&(
                        <div style={{textAlign:'center',padding:'14px 0',color:'rgba(255,255,255,0.2)',fontSize:11.5,display:'flex',alignItems:'center',gap:8,justifyContent:'center'}}>
                          <span>📭</span> No study materials uploaded yet by {c.teacher}.
                        </div>
                      )}
                    </div>
                  ))}
                </>
              );
            })()}
          </div>

          {/* NOTIFICATIONS */}
          <div className={`panel ${activePane==='s-notif'?'active':''}`}>
            {(()=>{
              const [notifFilterType,setNotifFilterType]=useState('All');
              const [savedNotifs,setSavedNotifs]=useState(new Set());
              const [notifHistTab,setNotifHistTab]=useState('current');
              const [notifHistory,setNotifHistory]=useState([]);

              const filterTypes=['All','Assignments','Exams','General','Admin','Teacher'];
              const categorizeNotif=(n)=>{
                const t=n.text?.toLowerCase()||'';
                if(t.includes('assignment')||t.includes('submit')) return 'Assignments';
                if(t.includes('exam')||t.includes('test')||t.includes('result')) return 'Exams';
                if(n._src==='admin') return 'Admin';
                if(n._src==='teacher') return 'Teacher';
                return 'General';
              };
              const filteredNotifs=allNotifs.filter(n=>{
                if(notifFilterType==='All') return true;
                return categorizeNotif(n)===notifFilterType;
              });

              const toggleSaved=(id)=>{
                setSavedNotifs(prev=>{
                  const ns=new Set(prev);
                  if(ns.has(id)){ ns.delete(id); showToast('Notification unsaved'); }
                  else{ ns.add(id); showToast('⭐ Notification saved/highlighted!'); }
                  return ns;
                });
              };
              const markUnread=(n)=>{
                if(n._src) setExtReadIds(prev=>{const ns=new Set(prev);ns.delete(n.id);return ns;});
                else setNotifications(notifications.map(x=>x.id===n.id?{...x,read:false}:x));
                showToast('Marked as unread');
              };
              const archiveToHistory=()=>{
                const readOnes=allNotifs.filter(n=>isNotifRead(n));
                setNotifHistory(prev=>[...prev,...readOnes.filter(r=>!prev.find(p=>p.id===r.id))]);
                showToast(`${readOnes.length} notifications archived to history`);
              };

              return(<>
                <div style={{display:'flex',gap:8,marginBottom:10,flexWrap:'wrap',alignItems:'center'}}>
                  <div className="tab-row" style={{marginBottom:0,flex:1}}>
                    {[['current','🔔 Current'],['saved','⭐ Saved'],['history','🕐 History']].map(([t,l])=><button key={t} className={`tab-btn ${notifHistTab===t?'active':''}`} onClick={()=>setNotifHistTab(t)}>{l}</button>)}
                  </div>
                </div>

                {notifHistTab==='current'&&(<>
                  <div style={{display:'flex',gap:6,marginBottom:10,flexWrap:'wrap',alignItems:'center'}}>
                    <span style={{fontSize:11,color:'rgba(255,255,255,0.3)'}}>Filter:</span>
                    {filterTypes.map(ft=>(
                      <button key={ft} onClick={()=>setNotifFilterType(ft)} style={{padding:'3px 10px',borderRadius:14,border:`1px solid ${notifFilterType===ft?'rgba(192,57,43,0.6)':'rgba(255,255,255,0.1)'}`,background:notifFilterType===ft?'rgba(192,57,43,0.12)':'transparent',color:notifFilterType===ft?'#f87171':'rgba(255,255,255,0.4)',fontSize:10,cursor:'pointer'}}>{ft}</button>
                    ))}
                    <button className="d-btn d-btn-blue" style={{fontSize:'9px',padding:'2px 8px',marginLeft:'auto'}} onClick={()=>{setExtReadIds(new Set(allNotifs.map(n=>n.id)));setNotifications(notifications.map(n=>({...n,read:true})));showToast('All marked read');}}>✓ Mark All Read</button>
                    <button className="d-btn" style={{background:'rgba(255,255,255,0.05)',color:'rgba(255,255,255,0.4)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:6,padding:'3px 8px',fontSize:'9px',cursor:'pointer'}} onClick={archiveToHistory}>Archive Read</button>
                  </div>
                  {adminNotifsForStudent.length>0&&<div style={{fontSize:10,color:'#f87171',marginBottom:8,padding:'4px 8px',background:'rgba(192,57,43,0.06)',borderRadius:6,border:'1px solid rgba(192,57,43,0.15)'}}>📢 {adminNotifsForStudent.length} admin announcement{adminNotifsForStudent.length>1?'s':''}</div>}
                  {teacherNotifsForStudent.length>0&&<div style={{fontSize:10,color:'#4ade80',marginBottom:8,padding:'4px 8px',background:'rgba(29,131,72,0.06)',borderRadius:6,border:'1px solid rgba(29,131,72,0.15)'}}>👩‍🏫 {teacherNotifsForStudent.length} teacher notification{teacherNotifsForStudent.length>1?'s':''}</div>}
                  <div className="card">
                    <div className="ct"><div className="ct-dot" style={{background:'#C0392B'}}></div>Notifications ({filteredNotifs.length}) <span style={{fontSize:9,color:'rgba(255,255,255,0.3)',marginLeft:4}}>— {notifFilterType} filter</span></div>
                    {filteredNotifs.map(n=>(
                      <div className="notif-item" key={n.id} style={{opacity:isNotifRead(n)?0.5:1,background:savedNotifs.has(n.id)?'rgba(212,172,13,0.05)':'',border:savedNotifs.has(n.id)?'1px solid rgba(212,172,13,0.15)':'1px solid transparent',borderRadius:8,padding:'6px 4px',transition:'all 0.2s'}}>
                        <div className="notif-dot" style={{background:savedNotifs.has(n.id)?'#D4AC0D':n.color}}></div>
                        <div style={{flex:1}}>
                          <div className="notif-text">{savedNotifs.has(n.id)&&<span style={{fontSize:9,color:'#D4AC0D',marginRight:4}}>⭐</span>}{n.text}</div>
                          <div className="notif-time">{n.time}
                            {n._src&&<span className={`badge ${n._src==='admin'?'br':'bb'}`} style={{marginLeft:6,fontSize:8}}>{n._src==='admin'?'Admin':'Teacher'}</span>}
                            <span className={`badge ${isNotifRead(n)?'':' bb'}`} style={{marginLeft:6,fontSize:8,background:isNotifRead(n)?'rgba(255,255,255,0.05)':'rgba(36,113,163,0.2)',color:isNotifRead(n)?'rgba(255,255,255,0.3)':'#60a5fa'}}>{isNotifRead(n)?'Read':'Unread'}</span>
                            <span style={{fontSize:9,color:'rgba(255,255,255,0.25)',marginLeft:6}}>{categorizeNotif(n)}</span>
                          </div>
                        </div>
                        <div style={{display:'flex',flexDirection:'column',gap:3,alignItems:'flex-end'}}>
                          {!isNotifRead(n)
                            ?<button style={{background:'rgba(29,131,72,0.15)',border:'1px solid rgba(29,131,72,0.25)',color:'#4ade80',borderRadius:4,padding:'2px 6px',fontSize:8,cursor:'pointer'}} onClick={()=>{ if(n._src) markExtRead(n.id); else setNotifications(notifications.map(x=>x.id===n.id?{...x,read:true}:x)); showToast('Marked as read'); }}>✓ Read</button>
                            :<button style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',color:'rgba(255,255,255,0.35)',borderRadius:4,padding:'2px 6px',fontSize:8,cursor:'pointer'}} onClick={()=>markUnread(n)}>◉ Unread</button>}
                          <button style={{background:savedNotifs.has(n.id)?'rgba(212,172,13,0.15)':'rgba(255,255,255,0.04)',border:`1px solid ${savedNotifs.has(n.id)?'rgba(212,172,13,0.3)':'rgba(255,255,255,0.08)'}`,color:savedNotifs.has(n.id)?'#D4AC0D':'rgba(255,255,255,0.3)',borderRadius:4,padding:'2px 6px',fontSize:8,cursor:'pointer'}} onClick={()=>toggleSaved(n.id)}>{savedNotifs.has(n.id)?'★ Saved':'☆ Save'}</button>
                        </div>
                      </div>
                    ))}
                    {filteredNotifs.length===0&&<div style={{color:'rgba(255,255,255,0.25)',fontSize:12,textAlign:'center',padding:'20px 0'}}>No {notifFilterType==='All'?'':notifFilterType+' '}notifications yet.</div>}
                  </div>
                </>)}

                {notifHistTab==='saved'&&(
                  <div className="card">
                    <div className="ct"><div className="ct-dot" style={{background:'#D4AC0D'}}></div>⭐ Saved / Highlighted Notifications ({allNotifs.filter(n=>savedNotifs.has(n.id)).length})</div>
                    {allNotifs.filter(n=>savedNotifs.has(n.id)).map(n=>(
                      <div className="notif-item" key={n.id} style={{background:'rgba(212,172,13,0.05)',border:'1px solid rgba(212,172,13,0.15)',borderRadius:8,padding:'6px 4px'}}>
                        <div className="notif-dot" style={{background:'#D4AC0D'}}></div>
                        <div style={{flex:1}}><div className="notif-text">⭐ {n.text}</div><div className="notif-time">{n.time}</div></div>
                        <button style={{background:'rgba(192,57,43,0.1)',border:'1px solid rgba(192,57,43,0.2)',color:'#f87171',borderRadius:4,padding:'2px 6px',fontSize:8,cursor:'pointer'}} onClick={()=>toggleSaved(n.id)}>Remove</button>
                      </div>
                    ))}
                    {allNotifs.filter(n=>savedNotifs.has(n.id)).length===0&&<div style={{color:'rgba(255,255,255,0.25)',fontSize:12,textAlign:'center',padding:'20px 0'}}>Koi saved notification nahi. ☆ Save button se important notifications save karein.</div>}
                  </div>
                )}

                {notifHistTab==='history'&&(
                  <div className="card">
                    <div className="ct"><div className="ct-dot" style={{background:'#7F77DD'}}></div>🕐 Notification History ({notifHistory.length})</div>
                    <div style={{fontSize:11,color:'rgba(255,255,255,0.3)',marginBottom:8}}>Archived old notifications — purani announcements dobara check karein.</div>
                    {notifHistory.length===0&&<div style={{color:'rgba(255,255,255,0.25)',fontSize:12,textAlign:'center',padding:'20px 0'}}>History empty hai. "Archive Read" button se read notifications yahan store hongi.</div>}
                    {notifHistory.map(n=>(
                      <div className="notif-item" key={n.id} style={{opacity:0.55}}>
                        <div className="notif-dot" style={{background:n.color}}></div>
                        <div style={{flex:1}}><div className="notif-text">{n.text}</div><div className="notif-time">{n.time} <span className="badge" style={{background:'rgba(127,119,221,0.15)',color:'#a5b4fc',fontSize:8}}>Archived</span></div></div>
                      </div>
                    ))}
                  </div>
                )}
              </>);
            })()}
          </div>

          {/* PERFORMANCE */}
          <div className={`panel ${activePane==='s-perf'?'active':''}`}>
            <div className="analy-grid" style={{gridTemplateColumns:'repeat(4,1fr)'}}>
              <div className="analy-card"><div className="analy-val">{d.attendance.overall}%</div><div className="analy-lab">Attendance</div></div>
              <div className="analy-card"><div className="analy-val">{avgMarks}%</div><div className="analy-lab">Avg Marks</div></div>
              <div className="analy-card"><div className="analy-val">{d.assignments.filter(a=>a.status==='Graded').length}</div><div className="analy-lab">Graded</div></div>
              <div className="analy-card"><div className="analy-val" style={{color:overallGrade==='F'?'#f87171':'#4ade80'}}>{overallGrade}</div><div className="analy-lab">Avg Grade</div></div>
            </div>
            <div className="card"><div className="ct"><div className="ct-dot" style={{background:'#2471A3'}}></div>Subject-wise Performance</div>
  <div className="chart-bar-wrap">
    {d.results.length===0&&<div style={{color:'rgba(255,255,255,0.25)',fontSize:12,textAlign:'center',padding:'16px 0'}}>No published results yet.</div>}
    {d.results.map((r,i)=>{
      const colors=['#2471A3','#7F77DD','#D4AC0D','#1D9E75','#C0392B','#7F77DD'];
      const pct = r.percentage??(r.total>0?Math.round(r.marks/r.total*100):0);
      return(
        <div className="chart-row" key={r.subject}>
          <span className="chart-label">{r.subject.substring(0,8)}</span>
          <div className="chart-bar-bg"><div className="chart-bar-fill" style={{width:`${pct}%`,background:colors[i%colors.length]}}><span style={{color:'rgba(255,255,255,0.85)'}}>{pct}%</span></div></div>
          <span className="chart-val">{r.grade}</span>
        </div>
      );
    })}
  </div>
</div>
            
           <div className="card">
  <div className="ct"><div className="ct-dot" style={{background:'#D4AC0D'}}></div>Assignment Progress</div>
  {(()=>{
    const total=d.assignments.length||1;
    const rows=[
      ['Graded',d.assignments.filter(a=>a.status==='Graded').length,'#1D9E75'],
      ['Submitted',d.assignments.filter(a=>a.status==='Submitted').length,'#2471A3'],
      ['Pending',d.assignments.filter(a=>a.status==='Pending').length,'#C0392B'],
    ];
    return rows.map(([l,v,c])=>(
      <div className="pr" key={l}><span className="pl">{l}</span><div className="pb"><div className="pf" style={{width:`${(v/total)*100}%`,background:c}}/></div><span className="pv">{v}</span></div>
    ));
  })()}
</div> 
          </div>

        </div>
      </div>
      {toast&&<Toast msg={toast.msg} icon={toast.icon}/>}
    </div>
  );
}

// ══════════════════ TEACHER DASHBOARD ══════════════════

export default StudentDashboard;
