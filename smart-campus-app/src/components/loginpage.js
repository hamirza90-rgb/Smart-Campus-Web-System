import { useState } from 'react';
import { PGCLogo, GoogleOAuthModal } from './homepage';

function LoginPage({role,onBack,onLogin,portalCreds,updateCred}){
  const cred = portalCreds[role] || {};
  const isFirstTime = role!=='admin' ? !cred.isSet : false;// pehli baar = credentials abhi set nahi

  // Setup mode state (pehli baar)
  const [setupEmail,setSetupEmail]=useState('');
  const [setupPw,setSetupPw]=useState('');
  const [setupPw2,setSetupPw2]=useState('');
  const [setupErr,setSetupErr]=useState('');
  const [setupShowPw,setSetupShowPw]=useState(false);

  // Normal login state
  const [emailStep,setEmailStep]=useState(true);
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [showPw,setShowPw]=useState(false);
  const [emailErr,setEmailErr]=useState('');
  const [passErr,setPassErr]=useState('');
  const [showGoogle,setShowGoogle]=useState(false);

  // Forgot password state
  const [forgotMode,setForgotMode]=useState(false);
  const [fpStep,setFpStep]=useState('email');
  const [fpEmail,setFpEmail]=useState('');
  const [fpEmailErr,setFpEmailErr]=useState('');
  const [fpCode,setFpCode]=useState('');
  const [fpCodeErr,setFpCodeErr]=useState('');
  const [fpGenCode,setFpGenCode]=useState('');
  const [fpNewPw,setFpNewPw]=useState('');
  const [fpNewPwErr,setFpNewPwErr]=useState('');
  const [fpShowPw,setFpShowPw]=useState(false);
  // Master code for admin forgot password (hardcoded secret)
  const ADMIN_MASTER_CODE='PGC-2026-Lalamusa';

  const cfg={
    student:{badge:'Student Portal',badgeBg:'rgba(26,82,118,0.2)',badgeColor:'#2471A3',greeting:'Welcome, Student',heading:'Sign in as Student',btnBg:'linear-gradient(135deg,#0d2744,#2471A3)'},
    teacher:{badge:'Teacher Portal',badgeBg:'rgba(29,131,72,0.2)',badgeColor:'#1D9E75',greeting:'Welcome, Teacher',heading:'Sign in as Teacher',btnBg:'linear-gradient(135deg,#0d2a1a,#1D9E75)'},
    admin:{badge:'Admin Portal',badgeBg:'rgba(192,57,43,0.15)',badgeColor:'#C0392B',greeting:'Welcome, Administrator',heading:'Sign in as Admin',btnBg:'linear-gradient(135deg,#5c1a10,var(--red))'},
  }[role];

  // ── SETUP: pehli baar email+password set karo ──
  const doSetup=()=>{
    if(!setupEmail||!setupEmail.includes('@')||!setupEmail.includes('.')){ setSetupErr('Please enter a valid email address'); return; }
    if(!setupPw||setupPw.length<8){ setSetupErr('Password must be at least 8 characters'); return; }
    if(setupPw!==setupPw2){ setSetupErr('Passwords do not match'); return; }
    setSetupErr('');
    updateCred(role,{ email:setupEmail.toLowerCase(), password:setupPw, isSet:true });
    // Auto login after setup
    onLogin(role,{ name:cred.name });
  };

  // ── NORMAL LOGIN ──
  const proceedStudentEmail=()=>{
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ setEmailErr('Please enter a valid email address'); return; }
    setEmailErr(''); setEmailStep(false);
  };

  const doStudentLogin=async()=>{
    if(!password){ setPassErr('Please enter your password'); return; }
    try{
      const res=await fetch('http://localhost:5000/api/students/login',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({email:email.toLowerCase(),password})
      });
      const data=await res.json();
      if(res.ok){
        setPassErr('');
        console.log('Student data being passed:', data);
        onLogin('student',{id:data.id,name:data.name,email:data.email,roll:data.roll,dept:data.dept,section:data.section});
      } else {
        setPassErr(data.message||'Login failed. Check email and password.');
      }
    }catch(err){
      setPassErr('Server error. Make sure backend is running.');
    }
  };
  const proceedEmail=()=>{
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){ setEmailErr('Please enter a valid email address'); return; }
    setEmailErr(''); setEmailStep(false);
  };
  const doLogin=async()=>{
    if(!password){ setPassErr('Please enter your password'); return; }
    if(role==='teacher'){
      try{
        const res=await fetch('http://localhost:5000/api/teachers/login',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({email:email.toLowerCase(),password})
        });
        const data=await res.json();
        if(res.ok){
          setPassErr('');
          if(data.token) localStorage.setItem('token', data.token);
          onLogin('teacher',{id:data.id,name:data.name,email:data.email,dept:data.dept});
        } else {
          setPassErr(data.message||'Login failed. Check email and password.');
        }
      }catch(err){
        setPassErr('Server error. Make sure backend is running.');
      }
    } else {
      if(password!==cred.password){ setPassErr('Incorrect password. Try again or use "Forgot password?"'); return; }
      setPassErr('');
      onLogin(role,{ name:cred.name });
    }
  };
  // ── FORGOT PASSWORD ──
  const fpSendCode=()=>{
    if(!fpEmail||!fpEmail.includes('@')){ setFpEmailErr('Enter your registered email'); return; }
    if(fpEmail.toLowerCase()!==cred.email.toLowerCase()){ setFpEmailErr('No account found with this email'); return; }
    if(role==='admin'){
      setFpEmailErr(''); setFpStep('code');
    } else {
      const code=String(Math.floor(100000+Math.random()*900000));
      setFpGenCode(code); setFpEmailErr(''); setFpStep('code');
      setTimeout(()=>alert('🔐 Verification code sent to '+cred.phone+':\n\nYour code: '+code+'\n\n(In production this arrives via SMS)'),200);
    }
  };
  const fpVerifyCode=()=>{
    if(!fpCode){ setFpCodeErr('Enter the code'); return; }
    if(role==='admin'){
      if(fpCode.trim()!==ADMIN_MASTER_CODE){ setFpCodeErr('Incorrect master code. Contact college administration.'); return; }
    } else {
      if(fpCode.trim()!==fpGenCode){ setFpCodeErr('Incorrect code. Please try again.'); return; }
    }
    setFpCodeErr(''); setFpStep('newpw');
  };
  const fpResetPw=()=>{
    if(!fpNewPw||fpNewPw.length<8){ setFpNewPwErr('Password must be at least 8 characters'); return; }
    updateCred(role,{ password:fpNewPw });
    setFpStep('done');
  };

  const quotes={student:'"Empowering students with digital access to their academic journey."',teacher:'"Helping educators manage classes, attendance, and results effortlessly."',admin:'"Complete visibility and control over the Smart Campus system."'};

  return(
    <div className="login-page">
      <div className="login-bg"><div className="login-grid"></div></div>
      <div className="login-left">
        <button className="login-back" onClick={onBack}><svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14"><path d="M10 7H3M6 4L3 7l3 3"/></svg>Back to home</button>
        <PGCLogo size={52}/>
        <div className="login-college-name">Punjab Group<br/>of Colleges</div>
        <div className="login-college-sub">Smart Campus Web System · Lalamusa</div>
        <div className="login-role-badge" style={{background:cfg.badgeBg}}>
          <div className="login-role-dot" style={{background:cfg.badgeColor}}></div>
          <span style={{color:cfg.badgeColor,fontSize:13,fontWeight:500}}>{cfg.badge}</span>
        </div>
        <div className="login-quote">{quotes[role]}</div>
      </div>
      <div className="login-right">
        <div className="login-card">

          {/* ══ STUDENT: Google Login ══ */}
          {role==='student'&&(
            <>
              <div className="login-greeting">{cfg.greeting}</div>
              <div className="login-title">{cfg.heading}</div>
              {emailStep?(
                <>
                  <label className="f-label">Email Address</label>
                  <input className="f-input" type="email" placeholder="your@email.com" value={email} onChange={e=>{setEmail(e.target.value);setEmailErr('');}} onKeyDown={e=>e.key==='Enter'&&proceedStudentEmail()}/>
                  {emailErr&&<div style={{fontSize:11,color:'#f87171',marginTop:-10,marginBottom:10}}>⚠ {emailErr}</div>}
                  <button className="submit-btn" style={{background:cfg.btnBg}} onClick={proceedStudentEmail}>Continue <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" width="14"><path d="M3 8h10M9 4l4 4-4 4"/></svg></button>
                </>
              ):(
                <>
                  <div className="email-chip"><span className="email-chip-addr">{email}</span><button className="email-chip-change" onClick={()=>{setEmailStep(true);setPassword('');setPassErr('');}}>Change</button></div>
                  <label className="f-label">Password</label>
                  <div style={{position:'relative'}}>
                    <input className="f-input" type={showPw?'text':'password'} autoComplete="off" placeholder="Enter your password" value={password} style={{paddingRight:50}} onChange={e=>{setPassword(e.target.value);setPassErr('');}} onKeyDown={e=>e.key==='Enter'&&doStudentLogin()}/>
                    <button onClick={()=>setShowPw(!showPw)} style={{position:'absolute',right:14,top:12,background:'none',border:'none',color:'rgba(255,255,255,0.35)',cursor:'pointer',fontSize:12}}>
                      {showPw?'Hide':'Show'}
                    </button>
                  </div>
                  {passErr&&<div style={{fontSize:11,color:'#f87171',marginBottom:10,padding:'6px 10px',background:'rgba(192,57,43,0.08)',borderRadius:6,border:'1px solid rgba(192,57,43,0.2)'}}>⚠ {passErr}</div>}
                  <button className="submit-btn" style={{background:cfg.btnBg}} onClick={doStudentLogin}>Sign In <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" width="14"><path d="M3 8h10M9 4l4 4-4 4"/></svg></button>
                </>
              )}
            </>
          )}

          {/* ══ TEACHER / ADMIN ══ */}
          {role!=='student'&&(
            <>
              {/* ── FORGOT PASSWORD OVERLAY ── */}
              {forgotMode?(
                <>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:20}}>
                    <button onClick={()=>{setForgotMode(false);setFpStep('email');setFpEmail('');setFpCode('');setFpNewPw('');}} style={{background:'none',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:18,lineHeight:1}}>←</button>
                    <div className="login-title" style={{marginBottom:0,fontSize:18}}>Reset Password</div>
                  </div>
                  {fpStep==='email'&&<>
                    <p style={{color:'rgba(255,255,255,0.35)',fontSize:12,marginBottom:16,lineHeight:1.7}}>
                      {role==='admin'?'Enter your admin email. You will then need the secret Master Code.':'Enter your registered email. A verification code will be sent to your linked phone number.'}
                    </p>
                    <label className="f-label">Registered Email</label>
                    <input className="f-input" type="email" placeholder={cred.email||'your@email.com'} value={fpEmail} onChange={e=>{setFpEmail(e.target.value);setFpEmailErr('');}}/>
                    {fpEmailErr&&<div style={{fontSize:11,color:'#f87171',marginBottom:10}}>⚠ {fpEmailErr}</div>}
                    <button className="submit-btn" style={{background:cfg.btnBg}} onClick={fpSendCode}>Continue →</button>
                  </>}
                  {fpStep==='code'&&<>
                    <p style={{color:'rgba(255,255,255,0.35)',fontSize:12,marginBottom:16,lineHeight:1.7}}>
                      {role==='admin'?<>Enter the <strong style={{color:'rgba(255,255,255,0.6)'}}>Secret Master Code</strong> provided by college administration.</>:<>A 6-digit code was sent to the phone linked to <strong style={{color:'rgba(255,255,255,0.6)'}}>{fpEmail}</strong>.</>}
                    </p>
                    <label className="f-label">{role==='admin'?'Master Code':'Verification Code'}</label>
                    <input className="f-input" type="text" maxLength={role==='admin'?20:6} placeholder={role==='admin'?'e.g. PGC-2026-Lalamusa':'_ _ _ _ _ _'} value={fpCode} onChange={e=>{setFpCode(e.target.value);setFpCodeErr('');}} style={role==='teacher'?{letterSpacing:8,fontSize:18,textAlign:'center'}:{}}/>
                    {fpCodeErr&&<div style={{fontSize:11,color:'#f87171',marginBottom:10}}>⚠ {fpCodeErr}</div>}
                    {role==='admin'&&<div style={{fontSize:10,color:'rgba(255,255,255,0.25)',marginBottom:12,padding:'6px 10px',background:'rgba(192,57,43,0.06)',borderRadius:6,border:'1px solid rgba(192,57,43,0.1)'}}>🔒 The Master Code is set by the college. Contact PGC Administration if you don't have it.</div>}
                    {role==='teacher'&&<button style={{background:'none',border:'none',color:'rgba(255,255,255,0.35)',cursor:'pointer',fontSize:11,marginBottom:12,padding:0}} onClick={fpSendCode}>Resend code</button>}
                    <button className="submit-btn" style={{background:cfg.btnBg}} onClick={fpVerifyCode}>Verify →</button>
                  </>}
                  {fpStep==='newpw'&&<>
                    <p style={{color:'rgba(255,255,255,0.35)',fontSize:12,marginBottom:16,lineHeight:1.7}}>Identity verified! Enter your new password.</p>
                    <label className="f-label">New Password</label>
                    <div style={{position:'relative'}}>
                      <input className="f-input" type={fpShowPw?'text':'password'} placeholder="New password (min 8 chars)" value={fpNewPw} onChange={e=>{setFpNewPw(e.target.value);setFpNewPwErr('');}} style={{paddingRight:50}}/>
                      <button onClick={()=>setFpShowPw(!fpShowPw)} style={{position:'absolute',right:14,top:12,background:'none',border:'none',color:'rgba(255,255,255,0.35)',cursor:'pointer',fontSize:12,fontFamily:"'DM Sans',sans-serif"}}>{fpShowPw?'Hide':'Show'}</button>
                    </div>
                    {fpNewPwErr&&<div style={{fontSize:11,color:'#f87171',marginBottom:10}}>⚠ {fpNewPwErr}</div>}
                    <button className="submit-btn" style={{background:cfg.btnBg}} onClick={fpResetPw}>Save New Password →</button>
                  </>}
                  {fpStep==='done'&&<>
                    <div style={{textAlign:'center',padding:'20px 0'}}>
                      <div style={{fontSize:44,marginBottom:12}}>✅</div>
                      <div style={{color:'#fff',fontSize:16,fontWeight:600,marginBottom:8}}>Password Reset!</div>
                      <div style={{color:'rgba(255,255,255,0.4)',fontSize:12,lineHeight:1.7,marginBottom:20}}>Your password has been updated. Sign in with your new password.</div>
                      <button className="submit-btn" style={{background:cfg.btnBg}} onClick={()=>{setForgotMode(false);setEmailStep(false);setPassword('');}}>Go to Sign In →</button>
                    </div>
                  </>}
                </>
              ) : (isFirstTime && role==='admin') ? (
                /* ── FIRST TIME SETUP ── */
                <>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
                    <div style={{width:36,height:36,borderRadius:10,background:cfg.badgeBg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18}}>🔐</div>
                    <div>
                      <div className="login-title" style={{marginBottom:0,fontSize:16}}>Set Your Credentials</div>
                      <div style={{color:'rgba(255,255,255,0.3)',fontSize:11}}>First time setup — done once, remembered always</div>
                    </div>
                  </div>
                  <div style={{padding:'10px 14px',background:role==='admin'?'rgba(192,57,43,0.07)':'rgba(29,131,72,0.07)',border:'1px solid '+(role==='admin'?'rgba(192,57,43,0.2)':'rgba(29,131,72,0.2)'),borderRadius:10,fontSize:11,color:'rgba(255,255,255,0.45)',lineHeight:1.8,marginBottom:20}}>
                    {role==='admin'
                      ? '👑 Admin portal — set your email and password. This is a one-time setup. These credentials will be used for all future logins.'
                      : '👩‍🏫 Teacher portal — the college has granted you access. Set your email and password below. Your credentials will remain the same unless you reset them.'}
                  </div>
                  <label className="f-label">Your Email *</label>
                  <input className="f-input" type="email" placeholder={role==='admin'?'admin@pgc.edu.pk':'yourname@pgc.edu.pk'} value={setupEmail} onChange={e=>{setSetupEmail(e.target.value);setSetupErr('');}}/>
                  <label className="f-label" style={{marginTop:10}}>Set Password *</label>
                  <div style={{position:'relative'}}>
                    <input className="f-input" type={setupShowPw?'text':'password'} placeholder="Min 8 characters" value={setupPw} onChange={e=>{setSetupPw(e.target.value);setSetupErr('');}} style={{paddingRight:50}}/>
                    <button onClick={()=>setSetupShowPw(!setupShowPw)} style={{position:'absolute',right:14,top:12,background:'none',border:'none',color:'rgba(255,255,255,0.35)',cursor:'pointer',fontSize:12,fontFamily:"'DM Sans',sans-serif"}}>{setupShowPw?'Hide':'Show'}</button>
                  </div>
                  <label className="f-label" style={{marginTop:10}}>Confirm Password *</label>
                  <input className="f-input" type="password" placeholder="Re-enter password" value={setupPw2} onChange={e=>{setSetupPw2(e.target.value);setSetupErr('');}} onKeyDown={e=>e.key==='Enter'&&doSetup()}/>
                  {setupErr&&<div style={{fontSize:11,color:'#f87171',marginBottom:10,padding:'6px 10px',background:'rgba(192,57,43,0.08)',borderRadius:6,border:'1px solid rgba(192,57,43,0.2)'}}>⚠ {setupErr}</div>}
                  <button className="submit-btn" style={{background:cfg.btnBg,marginTop:6}} onClick={doSetup}>
                    Save & Continue <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" width="14"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
                  </button>
                  <div style={{fontSize:10,color:'rgba(255,255,255,0.2)',textAlign:'center',marginTop:12,lineHeight:1.6}}>
                    🔒 These credentials are only for you — do not share with anyone
                  </div>
                </>
              ) : (
                /* ── RETURNING LOGIN ── */
                <>
                  {role==='admin'&&(
                    <div style={{marginBottom:14,padding:'8px 12px',background:'rgba(192,57,43,0.06)',border:'1px solid rgba(192,57,43,0.18)',borderRadius:10,fontSize:11,color:'rgba(255,255,255,0.4)',lineHeight:1.8}}>
                      🔐 <strong style={{color:'rgba(255,255,255,0.6)'}}>Admin Portal</strong> — Use your college-issued admin credentials.
                    </div>
                  )}
                  <div className="login-greeting">{cfg.greeting}</div>
                  <div className="login-title">{cfg.heading}</div>
                  {emailStep?(
                    <>
                      <label className="f-label">Email Address</label>
                      <input className="f-input" type="email" autoComplete="off" placeholder={cred.email||'your@email.com'} value={email} onChange={e=>{setEmail(e.target.value);setEmailErr('');}} onKeyDown={e=>e.key==='Enter'&&proceedEmail()}/>
                      {emailErr&&<div style={{fontSize:11,color:'#f87171',marginTop:-10,marginBottom:10}}>⚠ {emailErr}</div>}
                      <button className="submit-btn" style={{background:cfg.btnBg}} onClick={proceedEmail}>Continue <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" width="14"><path d="M3 8h10M9 4l4 4-4 4"/></svg></button>
                    </>
                  ):(
                    <>
                      <div className="email-chip"><span className="email-chip-addr">{email}</span><button className="email-chip-change" onClick={()=>{setEmailStep(true);setPassword('');setPassErr('');}}>Change</button></div>
                      <label className="f-label">Password</label>
                      <div style={{position:'relative'}}>
                        <input className="f-input" type={showPw?'text':'password'} autoComplete="off" placeholder="Enter your password" value={password} style={{paddingRight:50}} onChange={e=>{setPassword(e.target.value);setPassErr('');}} onKeyDown={e=>e.key==='Enter'&&doLogin()}/>
                        <button onClick={()=>setShowPw(!showPw)} style={{position:'absolute',right:14,top:12,background:'none',border:'none',color:'rgba(255,255,255,0.35)',cursor:'pointer',fontSize:12,fontFamily:"'DM Sans',sans-serif"}}>{showPw?'Hide':'Show'}</button>
                      </div>
                      {passErr&&<div style={{fontSize:11,color:'#f87171',marginBottom:10,padding:'6px 10px',background:'rgba(192,57,43,0.08)',borderRadius:6,border:'1px solid rgba(192,57,43,0.2)'}}>⚠ {passErr}</div>}
                      <button className="forgot-link" onClick={()=>{setForgotMode(true);setFpEmail(email);setFpStep('email');}}>Forgot password?</button>
                      <button className="submit-btn" style={{background:cfg.btnBg}} onClick={doLogin}>Sign In <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" width="14"><path d="M3 8h10M9 4l4 4-4 4"/></svg></button>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
      {showGoogle&&<GoogleOAuthModal onClose={()=>setShowGoogle(false)} onSuccess={async u=>{
        setShowGoogle(false);
        try{
          const res=await fetch('http://localhost:5000/api/students');
          const students=await res.json();
          const matched=Array.isArray(students)?students.find(s=>s.email?.toLowerCase()===u.email?.toLowerCase()):null;
          const finalUser=matched?{...u,id:matched._id,roll:matched.roll,dept:matched.dept}:u;
          onLogin('student',finalUser);
        }catch(err){
          onLogin('student',u);
        }
      }}/>}
    </div>
  );
}

// ══════════════════ STUDENT DASHBOARD ══════════════════

export default LoginPage;
