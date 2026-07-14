import { useState, useEffect } from 'react';

// ══ PGC LOGO ══
function PGCLogo({size=32}){
  return(
    <img 
      src="/assets/pgc-logo.jpg" 
      alt="PGC Logo" 
      width={size} 
      height={size} 
      style={{objectFit:'contain',borderRadius:'4px'}}
    />
  );
}

// ══ TOAST ══
function Toast({msg,icon='✓'}){
  return <div className="toast"><span style={{color:'#4ade80',fontWeight:600,flexShrink:0}}>{icon}</span>{msg}</div>;
}

function HomePage({onSignIn, setPage}){
  const [liveStats, setLiveStats] = useState({ students: null, faculty: null, classes: null, passRate: null });

useEffect(() => {
  fetch('http://localhost:5000/api/students')
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)) {
        setLiveStats(prev => ({ ...prev, students: data.length }));
      }
    })
    .catch(() => {});

  fetch('http://localhost:5000/api/teachers')
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)) {
        setLiveStats(prev => ({ ...prev, faculty: data.length }));
      }
    })
    .catch(() => {});

  fetch('http://localhost:5000/api/courses')
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)) {
        const uniqueClasses = new Set(data.map(c => c.class));
        setLiveStats(prev => ({ ...prev, classes: uniqueClasses.size }));
      }
    })
    .catch(() => {});
    fetch('http://localhost:5000/api/results/stats/passrate')
    .then(res => res.json())
    .then(data => {
      if (data.passRate !== null && data.passRate !== undefined) {
        setLiveStats(prev => ({ ...prev, passRate: data.passRate }));
      }
    })
    .catch(() => {});
}, []);
  const scrollTo=(id)=>{ setTimeout(()=>{ const el=document.getElementById('section-'+id); if(el) el.scrollIntoView({behavior:'smooth'}); },50); };

  const features=[
    {name:'Attendance Management',desc:'ESP32-CAM QR code-based automated attendance with anti-proxy, Present/Late/Absent auto-marking and percentage tracking.',color:'#2471A3',icon:'📊',page:'student'},
    {name:'Assignments Module',desc:'Upload, submit, and grade assignments with PDF feedback.',color:'#1D9E75',icon:'📝',page:'student'},
    {name:'Timetable',desc:'Role-specific timetables managed by admin for all roles.',color:'#7F77DD',icon:'📅',page:'student'},
    {name:'Course Materials',desc:'Lecture notes, outlines, and downloadable study materials.',color:'#D4AC0D',icon:'📚',page:'student'},
    {name:'Result Management',desc:'Monthly test results with PDF result cards and transcripts.',color:'#C0392B',icon:'🏆',page:'student'},
    {name:'Notifications',desc:'Real-time announcements from teachers and administration.',color:'#1D9E75',icon:'🔔',page:'student'},
    {name:'Performance Analytics',desc:'Charts showing academic progress and subject analysis.',color:'#7F77DD',icon:'📈',page:'student'},
    {name:'Role-Based Dashboards',desc:'Separate dashboards for Students, Teachers, and Admins.',color:'#C0392B',icon:'👤',page:'student'},
  ];

  return(
    <div className="home-page">
      <div className="home-bg"><div className="grid-lines"></div></div>
      <nav className="home-nav">
        <div className="nav-logo" onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}>
          <PGCLogo size={36}/>
          <div>
            <div className="nav-brand">PGC Smart Campus</div>
            <div className="nav-tagline">Punjab Group of Colleges</div>
          </div>
        </div>
        <div className="nav-links">
          <button className="nav-link" onClick={()=>scrollTo('about')}>About</button>
          <button className="nav-link" onClick={()=>scrollTo('features')}>Features</button>
          <button className="nav-link" onClick={()=>scrollTo('contact')}>Contact</button>
        </div>
        <button className="nav-cta" onClick={onSignIn}>Sign in to Portal →</button>
      </nav>

      <div className="home-hero">
        <div className="hero-badge">🎓 Pakistan's Leading Campus Management System</div>
        <h1 className="hero-title">Smart Campus<br/><span>Web System</span></h1>
        <p className="hero-sub">Punjab Group of Colleges</p>
        <p className="hero-desc">A unified digital platform for students, teachers and administrators — attendance, assignments, results and more, all in one place.</p>
        <div className="hero-stats">
          {[
  [liveStats.students!==null?`${liveStats.students}`:'...','Students'],
  [liveStats.faculty!==null?`${liveStats.faculty}`:'...','Faculty'],
  [liveStats.classes!==null?`${liveStats.classes}`:'...','Classes'],
  [liveStats.passRate!==null?`${liveStats.passRate}%`:'...','Pass Rate']
].map(([n,l])=>(
            <div className="hstat" key={l}><div className="hstat-n">{n}</div><div className="hstat-l">{l}</div></div>
          ))}
        </div>
        <div className="hero-btns">
          <button className="hero-btn-primary" onClick={onSignIn}>Get Started →</button>
          <button className="hero-btn-sec" onClick={()=>scrollTo('features')}>Explore Features</button>
        </div>
      </div>

      {/* FEATURES */}
      <div className="section-wrap" id="section-features">
        <div className="section-title">Everything You Need</div>
        <div className="section-sub">8 powerful modules to manage every aspect of campus life</div>
        <div className="features-grid">
          {features.map(f=>(
            <div className="feature-card" key={f.name} onClick={onSignIn}>
              <div className="feat-icon" style={{background:`${f.color}22`}}><span>{f.icon}</span></div>
              <div className="feat-name">{f.name}</div>
              <div className="feat-desc">{f.desc}</div>
              <div style={{marginTop:8,fontSize:11,color:f.color,fontWeight:500}}>Explore →</div>
            </div>
          ))}
        </div>
      </div>

      {/* ABOUT */}
      <div className="section-wrap" id="section-about" style={{background:'rgba(255,255,255,0.01)'}}>
        <div className="about-inner">
          <div className="about-text">
            <div className="section-title" style={{textAlign:'left'}}>About PGC</div>
            <div className="section-sub" style={{textAlign:'left',marginBottom:16}}>Punjab Group of Colleges — Est. 1992</div>
            <p className="about-p">Punjab Group of Colleges (PGC) is one of Pakistan's largest and most reputable educational institutions, providing quality education from intermediate to postgraduate level across Lalamusa, Punjab.</p>
            <p className="about-p">The Smart Campus Web System is our digital transformation initiative — bringing all academic processes online for students, teachers, and administrators in one seamless platform.</p>
          </div>
          <div className="about-stats">
            {[
  [liveStats.students!==null?`${liveStats.students}`:'...','Students Enrolled'],
  [liveStats.faculty!==null?`${liveStats.faculty}`:'...','Faculty Members'],
  [liveStats.classes!==null?`${liveStats.classes}`:'...','Classes Running'],
  [liveStats.passRate!==null?`${liveStats.passRate}%`:'...','Annual Pass Rate'],
  ['1992','Year Founded'],
  ['8','Modules Active']
].map(([n,l])=>(
              <div className="about-stat" key={l}><div className="about-stat-n">{n}</div><div className="about-stat-l">{l}</div></div>
            ))}
          </div>
        </div>
      </div>

      {/* CONTACT */}
      <div className="section-wrap" id="section-contact">
        <div className="section-title">Contact Us</div>
        <div className="section-sub">Get in touch with PGC Administration</div>
        <div className="contact-grid">
          {[
            {icon:'📍',label:'Address',val:'Punjab Group of Colleges, Main Campus, Lalamusa, Punjab, Pakistan'},
            {icon:'📞',label:'Phone',val:'+92-53-3720000'},
            {icon:'✉️',label:'Email',val:'info@pgc.edu.pk'},
            {icon:'🕐',label:'Office Hours',val:'Mon–Fri: 8:00 AM – 4:00 PM'},
          ].map(c=>(
            <div className="contact-card" key={c.label}>
              <div className="contact-icon"><span style={{fontSize:17}}>{c.icon}</span></div>
              <div><div className="contact-label">{c.label}</div><div className="contact-val">{c.val}</div></div>
            </div>
          ))}
        </div>
      </div>

      <footer className="home-footer">
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <PGCLogo size={22}/>
          <span className="footer-copy">© 2026 Punjab Group of Colleges, Lalamusa. All rights reserved.</span>
        </div>
        <div className="footer-links">
          <span className="footer-link" onClick={()=>scrollTo('about')}>About</span>
          <span className="footer-link" onClick={()=>scrollTo('features')}>Features</span>
          <span className="footer-link" onClick={()=>scrollTo('contact')}>Contact</span>
        </div>
      </footer>
    </div>
  );
}

// ══════════════════ ROLE OVERLAY ══════════════════

function RoleOverlay({onClose,onSelect}){
  const roles=[
    {key:'student',name:'Student',desc:'Attendance, assignments, timetable & results',color:'rgba(26,82,118,0.25)',stroke:'#2471A3'},
    {key:'teacher',name:'Teacher',desc:'Classes, attendance & grade assignments',color:'rgba(30,132,73,0.25)',stroke:'#1D9E75'},
    {key:'admin',name:'Administrator',desc:'Full system control & monitoring',color:'rgba(192,57,43,0.2)',stroke:'#C0392B'},
  ];
  return(
    <div className="overlay" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div className="role-modal">
        <div className="role-modal-top">
          <span className="role-modal-title">Who are you?</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <p className="role-prompt">Select your role to continue to the portal.</p>
        <div className="role-cards">
          {roles.map(r=>(
            <div className="role-card" key={r.key} onClick={()=>onSelect(r.key)}>
              <div className="role-icon" style={{background:r.color}}>
                <svg viewBox="0 0 20 20" fill="none" stroke={r.stroke} strokeWidth="1.5" width="22" height="22">
                  {r.key==='student'&&<><circle cx="10" cy="6" r="3.5"/><path d="M3 18c0-3.9 3.1-7 7-7s7 3.1 7 7"/></>}
                  {r.key==='teacher'&&<><rect x="3" y="4" width="14" height="10" rx="1.5"/><line x1="6" y1="8" x2="14" y2="8"/><line x1="6" y1="11" x2="10" y2="11"/></>}
                  {r.key==='admin'&&<><circle cx="10" cy="10" r="7"/><circle cx="10" cy="10" r="3"/><line x1="10" y1="3" x2="10" y2="7"/><line x1="10" y1="13" x2="10" y2="17"/><line x1="3" y1="10" x2="7" y2="10"/><line x1="13" y1="10" x2="17" y2="10"/></>}
                </svg>
              </div>
              <div className="role-name">{r.name}</div>
              <div className="role-desc">{r.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════ GOOGLE OAUTH ══════════════════
// Real user credentials database
const GOOGLE_USERS = [
  {email:'laiba.imtiaz@gmail.com', name:'Laiba Imtiaz', color:'#1a73e8', password:'Laiba@2026', phone:'03XX-XXXXX01'},
  {email:'hamna.asif2007@gmail.com', name:'Hamna Asif', color:'#34a853', password:'Hamna@2007', phone:'03XX-XXXXX02'},
];


function GoogleOAuthModal({onClose,onSuccess}){
  const [step,setStep]=useState('accounts');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [showPw,setShowPw]=useState(false);
  const [selUser,setSelUser]=useState(null);
  const [emailErr,setEmailErr]=useState('');
  const [passErr,setPassErr]=useState('');
  const [emailFilled,setEmailFilled]=useState(false);
  const [passFilled,setPassFilled]=useState(false);
  const [loadText,setLoadText]=useState('Signing you in...');
  // Forgot password states
  const [fpEmail,setFpEmail]=useState('');
  const [fpEmailErr,setFpEmailErr]=useState('');
  const [fpCode,setFpCode]=useState('');
  const [fpCodeErr,setFpCodeErr]=useState('');
  const [fpNewPw,setFpNewPw]=useState('');
  const [fpNewPwErr,setFpNewPwErr]=useState('');
  const [fpGenCode,setFpGenCode]=useState('');
  const [fpStep,setFpStep]=useState('email'); // email | code | newpw | done
  const [fpShowPw,setFpShowPw]=useState(false);

  const accounts = GOOGLE_USERS;

  const selectAccount=(acc)=>{ setSelUser(acc); setStep('password'); };

  const nextFromEmail=()=>{
    if(!email||!email.includes('@')||!email.includes('.')){ setEmailErr('Enter a valid email address'); return; }
    const found=GOOGLE_USERS.find(u=>u.email.toLowerCase()===email.toLowerCase());
    if(found){ setSelUser(found); setStep('password'); return; }
    const colors=['#1a73e8','#34a853','#ea4335','#fbbc04','#9334e6','#d93025'];
    const newUser={email:email.toLowerCase(),name:email.split('@')[0].replace(/[._]/g,' ').replace(/\b\w/g,c=>c.toUpperCase()),color:colors[Math.floor(Math.random()*colors.length)],password:null,phone:'your registered number',_new:true};
    GOOGLE_USERS.push(newUser);
    setSelUser(newUser); setStep('password');
  };

  const signIn=()=>{
    if(!password){ setPassErr('Enter your password'); return; }
    if(selUser){
      // New account (first time) — any password works, save it
      if(selUser._new || selUser.password===null){
        selUser.password = password;
        selUser._new = false;
      } else if(password !== selUser.password){
        setPassErr('Wrong password. Try again or click "Forgot password?"');
        return;
      }
    }
    setStep('loading');
    setTimeout(()=>setLoadText('Connecting to PGC Portal...'),900);
    setTimeout(()=>{ onSuccess(selUser); },1900);
  };

  // Forgot password flow
  const [fpSending,setFpSending]=useState(false);
  const fpSendCode=async()=>{
    if(!fpEmail||!fpEmail.includes('@')){ setFpEmailErr('Enter a valid email address'); return; }
    const code=String(Math.floor(100000+Math.random()*900000));
    setFpGenCode(code);
    setFpEmailErr('');
    setFpSending(true);
    // EmailJS abhi configure nahi hai — dev code hi dikha do (in-page notice mein)
    setFpDevCode(code);
    setFpSending(false);
    setFpStep('code');
  };
  const [fpDevCode,setFpDevCode]=useState('');

  const fpVerifyCode=()=>{
    if(!fpCode){ setFpCodeErr('Enter the verification code'); return; }
    if(fpCode.trim()!==fpGenCode){ setFpCodeErr('Incorrect code. Please try again.'); return; }
    setFpCodeErr(''); setFpStep('newpw');
  };

  const fpResetPassword=()=>{
    if(!fpNewPw||fpNewPw.length<8){ setFpNewPwErr('Password must be at least 8 characters'); return; }
    // Update password in runtime (in-memory)
    const user=GOOGLE_USERS.find(u=>u.email.toLowerCase()===fpEmail.toLowerCase());
    if(user) user.password=fpNewPw;
    setFpStep('done');
  };

  const gC=[{c:'#4285F4'},{c:'#EA4335'},{c:'#FBBC05'},{c:'#4285F4'},{c:'#34A853'},{c:'#EA4335'}];
  return(
    <div className="g-modal-overlay" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div className="g-modal">
        <div className="g-topbar">
          <div className="g-logo-text">{'Google'.split('').map((l,i)=><span key={i} style={{color:gC[i].c}}>{l}</span>)}</div>
          <button className="g-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* ── CHOOSE ACCOUNT ── */}
        {step==='accounts'&&<div className="g-body">
          <div className="g-headline">Choose an account</div>
          <div className="g-subline">to continue to <strong>PGC Smart Campus</strong></div>
          {accounts.map(a=>(<div className="g-account-row" key={a.email} onClick={()=>selectAccount(a)}><div className="g-av" style={{background:a.color}}>{a.name[0]}</div><div><div className="g-acc-name">{a.name}</div><div className="g-acc-email">{a.email}</div></div><span className="g-acc-arrow">›</span></div>))}
          <div className="g-account-row" onClick={()=>setStep('email')}><div className="g-av" style={{background:'#5f6368',fontSize:20,fontWeight:300}}>+</div><div><div className="g-acc-name">Use another account</div></div><span className="g-acc-arrow">›</span></div>
          <div style={{fontSize:12,color:'#5f6368',textAlign:'center',lineHeight:1.6,marginTop:16}}>Google will share your name, email and profile picture with PGC Smart Campus.</div>
          <div className="g-footer"><span className="g-foot-link">Help</span><span>•</span><span className="g-foot-link">Privacy</span><span>•</span><span className="g-foot-link">Terms</span></div>
        </div>}

        {/* ── ENTER EMAIL ── */}
        {step==='email'&&<div className="g-body">
          <div className="g-headline">Sign in</div>
          <div className="g-subline">Use your Google Account</div>
          <div className="g-field-wrap"><input className="g-input" type="email" value={email} onChange={e=>{setEmail(e.target.value);setEmailFilled(e.target.value.length>0);setEmailErr('');}} onKeyDown={e=>e.key==='Enter'&&nextFromEmail()} style={{paddingRight:14}}/><label className={`g-float-label ${emailFilled?'up':''}`}>Email or phone</label></div>
          {emailErr&&<div className="g-err">⚠ {emailErr}</div>}
          <div className="g-actions" style={{marginTop:28}}><button className="g-btn-text" onClick={()=>setStep('accounts')}>Back</button><button className="g-btn-fill" onClick={nextFromEmail}>Next</button></div>
        </div>}

        {/* ── ENTER PASSWORD ── */}
        {step==='password'&&<div className="g-body">
          <div className="g-headline">{selUser?._new ? 'Create password' : 'Welcome'}</div>
          <div className="g-user-chip" onClick={()=>setStep('accounts')}><div className="g-chip-av" style={{background:selUser?.color||'#1a73e8'}}>{selUser?.name?.[0]||'?'}</div><span className="g-chip-email">{selUser?.email}</span></div>
          {selUser?._new && <div style={{fontSize:12,color:'#1a73e8',background:'#e8f0fe',borderRadius:6,padding:'8px 12px',marginBottom:12,lineHeight:1.6}}>🔐 First time signing in with this account — set a password to use next time.</div>}
          <div className="g-field-wrap" style={{position:'relative'}}>
            <input className="g-input" type={showPw?'text':'password'} value={password} onChange={e=>{setPassword(e.target.value);setPassFilled(e.target.value.length>0);setPassErr('');}} onKeyDown={e=>e.key==='Enter'&&signIn()} style={{paddingRight:60}}/>
            <label className={`g-float-label ${passFilled?'up':''}`}>{selUser?._new ? 'Create a password' : 'Enter your password'}</label>
            <button className="g-show-pw" onClick={()=>setShowPw(!showPw)}>{showPw?'Hide':'Show'}</button>
          </div>
          {passErr&&<div className="g-err">⚠ {passErr}</div>}
          {!selUser?._new && <div style={{marginTop:12,marginBottom:20}}>
            <button className="g-btn-text" style={{padding:0}} onClick={()=>{ setFpEmail(selUser?.email||''); setFpStep('email'); setStep('forgot'); }}>Forgot password?</button>
          </div>}
          <div className="g-actions" style={{marginTop: selUser?._new ? 20 : 0}}><button className="g-btn-text" onClick={()=>setStep('accounts')}>Back</button><button className="g-btn-fill" onClick={signIn}>Next</button></div>
        </div>}

        {/* ── FORGOT PASSWORD ── */}
        {step==='forgot'&&<div className="g-body">
          {fpStep==='email'&&<>
            <div className="g-headline" style={{fontSize:20}}>Reset your password</div>
            <div className="g-subline" style={{marginBottom:20}}>Enter your Gmail address. A 6-digit verification code will be sent directly to your email.</div>
            <div className="g-field-wrap"><input className="g-input" type="email" value={fpEmail} onChange={e=>{setFpEmail(e.target.value);setFpEmailErr('');}} style={{paddingTop:14,paddingBottom:14}} placeholder="your@gmail.com" disabled={fpSending}/></div>
            {fpEmailErr&&<div className="g-err">⚠ {fpEmailErr}</div>}
            <div className="g-actions" style={{marginTop:20}}>
              <button className="g-btn-text" onClick={()=>setStep('password')} disabled={fpSending}>Back</button>
              <button className="g-btn-fill" onClick={fpSendCode} disabled={fpSending} style={{opacity:fpSending?0.7:1,display:'flex',alignItems:'center',gap:8}}>
                {fpSending&&<svg width="14" height="14" viewBox="0 0 36 36" style={{animation:'spin 0.9s linear infinite'}}><circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="4"/><circle cx="18" cy="18" r="14" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeDasharray="40 40" style={{transformOrigin:'center'}}/></svg>}
                {fpSending ? 'Sending…' : 'Send Code'}
              </button>
            </div>
          </>}
          {fpStep==='code'&&<>
            <div className="g-headline" style={{fontSize:20}}>Check your email</div>
            <div style={{background:'#e8f0fe',borderRadius:8,padding:'10px 14px',marginBottom:16,display:'flex',gap:10,alignItems:'flex-start'}}>
              <span style={{fontSize:18}}>📧</span>
              <div style={{fontSize:13,color:'#1a5276',lineHeight:1.6}}>
                A 6-digit code was sent to <strong>{fpEmail}</strong>.<br/>
                <span style={{fontSize:11,color:'#555'}}>Check your inbox (and spam folder).</span>
              </div>
            </div>
            {fpDevCode&&<div style={{background:'#fff3cd',border:'1px solid #ffc107',borderRadius:8,padding:'10px 14px',marginBottom:12,fontSize:12,color:'#856404',lineHeight:1.7}}>
              <strong>⚙️ EmailJS not configured yet.</strong><br/>
              Your code is: <strong style={{fontSize:20,letterSpacing:4,color:'#333'}}>{fpDevCode}</strong><br/>
              <span style={{fontSize:10}}>To receive real emails: setup EmailJS (instructions below the file).</span>
            </div>}
            <div className="g-field-wrap"><input className="g-input" type="text" maxLength={6} value={fpCode} onChange={e=>{setFpCode(e.target.value.replace(/\D/g,''));setFpCodeErr('');}} style={{paddingTop:14,paddingBottom:14,letterSpacing:8,fontSize:22,textAlign:'center',fontWeight:600}} placeholder="——————" autoFocus/></div>
            {fpCodeErr&&<div className="g-err">⚠ {fpCodeErr}</div>}
            <div style={{marginTop:8,marginBottom:4,display:'flex',alignItems:'center',gap:6}}>
              <button className="g-btn-text" style={{padding:0,fontSize:12}} onClick={fpSendCode} disabled={fpSending}>{fpSending?'Sending…':'Resend code'}</button>
            </div>
            <div className="g-actions" style={{marginTop:16}}><button className="g-btn-text" onClick={()=>setFpStep('email')}>Back</button><button className="g-btn-fill" onClick={fpVerifyCode}>Verify</button></div>
          </>}
          {fpStep==='newpw'&&<>
            <div className="g-headline" style={{fontSize:20}}>Create new password</div>
            <div className="g-subline" style={{marginBottom:20}}>Enter a new password for <strong>{fpEmail}</strong>.</div>
            <div className="g-field-wrap" style={{position:'relative'}}>
              <input className="g-input" type={fpShowPw?'text':'password'} value={fpNewPw} onChange={e=>{setFpNewPw(e.target.value);setFpNewPwErr('');}} style={{paddingTop:14,paddingBottom:14,paddingRight:60}} placeholder="New password (min 8 chars)"/>
              <button className="g-show-pw" onClick={()=>setFpShowPw(!fpShowPw)}>{fpShowPw?'Hide':'Show'}</button>
            </div>
            {fpNewPwErr&&<div className="g-err">⚠ {fpNewPwErr}</div>}
            <div className="g-actions" style={{marginTop:20}}><button className="g-btn-text" onClick={()=>setFpStep('code')}>Back</button><button className="g-btn-fill" onClick={fpResetPassword}>Save Password</button></div>
          </>}
          {fpStep==='done'&&<>
            <div style={{textAlign:'center',padding:'20px 0 10px'}}>
              <div style={{fontSize:48,marginBottom:12}}>✅</div>
              <div className="g-headline" style={{fontSize:20}}>Password updated!</div>
              <div className="g-subline">Your password has been reset. You can now sign in with your new password.</div>
            </div>
            <div style={{marginTop:24,textAlign:'center'}}>
              <button className="g-btn-fill" onClick={()=>{ setStep('password'); setPassword(''); setFpEmail(''); setFpCode(''); setFpNewPw(''); setFpStep('email'); }}>Sign In</button>
            </div>
          </>}
        </div>}

        {/* ── LOADING ── */}
        {step==='loading'&&<div className="g-loading"><svg className="g-spinner" viewBox="0 0 36 36"><circle cx="18" cy="18" r="14" fill="none" stroke="#e0e0e0" strokeWidth="3"/><circle cx="18" cy="18" r="14" fill="none" stroke="#1a73e8" strokeWidth="3" strokeLinecap="round" strokeDasharray="60 28" style={{transformOrigin:'center'}}/></svg><div className="g-loading-text">{loadText}</div></div>}
      </div>
    </div>
  );
}

// ══════════════════ LOGIN PAGE ══════════════════

export { PGCLogo, Toast };
export default HomePage;
export { RoleOverlay, GoogleOAuthModal };
