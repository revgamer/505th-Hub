import {initializeApp} from 'firebase/app';
import {getAuth,setPersistence,inMemoryPersistence,onAuthStateChanged,signInWithEmailAndPassword,signOut} from 'firebase/auth';
import {createNotificationFeed} from './notification-feed.js';
import {getFirestore,doc,getDoc,onSnapshot,collection,query,orderBy,limit,updateDoc} from 'firebase/firestore';
const app=initializeApp({apiKey:'AIzaSyCYWrWE8-xBJsvh228xzcg5VOD7dIn48fg',authDomain:'th-website-91533.firebaseapp.com',projectId:'th-website-91533',appId:'1:1046139150142:web:01f409ae4a38c4f79d966f'});
const auth=getAuth(app),db=getFirestore(app);const ready=setPersistence(auth,inMemoryPersistence);
const content=document.querySelector('#content');let profile=null,unsubscribe=null,page='home',status='Sign in required';
let inbox=[],stopInbox=null,inboxUid=null,inboxStatus='Waiting for member login';
let appVersion=null,updateStatus={state:'idle'},startWithWindows=null,startWithWindowsLoading=false,discordInviteUrl=null,discordInviteStatus='idle';
let notifAlertsEnabled=(()=>{try{return localStorage.getItem('505th-hub-alerts')!=='off';}catch{return true;}})();
function clearInbox(){stopInbox?.();stopInbox=null;inboxUid=null;inbox=[];inboxStatus='Waiting for member login';void window.hubDesktop?.clearNotifications?.();void window.hubDesktop?.setUnreadCount?.(0);}
function connectInbox(uid){if(inboxUid===uid)return;clearInbox();inboxUid=uid;inboxStatus='Loading notifications…';const receive=createNotificationFeed(items=>{if(auth.currentUser?.uid!==uid||!profile||!notifAlertsEnabled)return;const latest=items[0];void window.hubDesktop?.showNotification?.({title:items.length>1?`${items.length} new 505th notifications`:String(latest.title||'505th update'),body:String(latest.body||'Open your notification inbox for details.')});});stopInbox=onSnapshot(query(collection(db,'notifications',uid,'items'),orderBy('createdAt','desc'),limit(50)),{includeMetadataChanges:true},snapshot=>{if(auth.currentUser?.uid!==uid||!profile)return;inbox=snapshot.docs.map(d=>({...d.data(),id:d.id}));inboxStatus=snapshot.metadata.fromCache?'Cached inbox · waiting for connection':'Live inbox connected';void window.hubDesktop?.setUnreadCount?.(inbox.filter(n=>!n.read).length);receive(snapshot);if(page==='notifications')render();},()=>{if(auth.currentUser?.uid!==uid)return;inbox=[];inboxStatus='Inbox unavailable · check your connection or account access';if(page==='notifications')render();});}
const esc=v=>String(v??'—').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const date=v=>{if(!v)return 'Not recorded';const d=v?.toDate?v.toDate():new Date(v);return Number.isNaN(+d)?'Not recorded':d.toLocaleDateString('en-GB');};
const toDateObj=v=>{if(!v)return null;const d=v?.toDate?v.toDate():new Date(v);return Number.isNaN(+d)?null:d;};
function message(text){document.querySelector('#toast').textContent=text;}
function loginView(){content.innerHTML=`<div class="intro"><div class="eyebrow">505TH EXPEDITIONARY FORCE</div><h1>Welcome to the Hub</h1><p>Sign in with your existing 505th website account.</p></div><section class="card"><form id="login" class="form"><label>Email<input type="email" name="email" required autocomplete="username"></label><label>Password<input type="password" name="password" required autocomplete="current-password"></label><button class="primary">Sign in</button></form><p>Closing the window keeps the Hub running in your system tray. Quit from the tray menu to exit.</p><p class="small">This development build keeps your login in memory until you quit. Your website notification inbox connects after sign-in. Shared events and Discord attendance integration are still being built.</p></section>`;}
function history(title,items){return `<section class="card"><h2>${title}</h2>${Array.isArray(items)&&items.length?items.map(i=>`<article class="event"><h3>${esc(i.title||i.name||i.ribbon||i.to||i.rank||'Service entry')}</h3><span class="small">${esc(date(i.date))}</span>${i.from?`<p>${esc(i.from)} → ${esc(i.to)}</p>`:''}<p>${esc(i.note||i.reason||'No citation recorded.')}</p>${i.addedBy?`<div class="small">Recorded by ${esc(i.addedBy)}</div>`:''}</article>`).join(''):'<p>No entries recorded.</p>'}</section>`;}
function render(){document.querySelector('#connection').textContent=status;document.querySelector('#logout').hidden=!auth.currentUser;document.querySelectorAll('[data-page]').forEach(b=>{b.disabled=!profile;b.classList.toggle('active',b.dataset.page===page);});if(!profile){loginView();return;}const p=profile;document.querySelector('#breadcrumb').textContent=page.toUpperCase();const name=[p.firstName,p.callsign?'“'+p.callsign+'”':null,p.lastName].filter(Boolean).join(' ');
 if(page==='record')content.innerHTML=`<section class="hero"><span class="badge">${esc(p.status)} · ${esc(p.platoon)}</span><h2>${esc(name)}</h2><p>${esc(p.rank)}</p><div class="meta"><span>Joined: ${esc(date(p.joinedAt))}</span><span>Role: ${esc(p.role)}</span></div></section><div class="stats"><section class="card"><div class="small">CURRENT CYCLE</div><div class="stat">${esc(p.attendance??'—')}/3</div></section><section class="card"><div class="small">WEBSITE ATTENDED COUNTER</div><div class="stat">${esc(p.opsAttended??'—')}</div><p class="small">Period not verified; this is not labelled all-time.</p></section><section class="card"><div class="small">WEBSITE ELIGIBLE COUNTER</div><div class="stat">${esc(p.opsEligible??'—')}</div><p class="small">Detailed history integration pending.</p></section></div><div class="grid">${history('Commendations',p.commendationHistory)}${history('Ribbons',p.ribbonHistory)}${history('Promotions',p.promotionHistory)}${history('Transfers',p.platoonHistory)}</div>`;
 else if(page==='operations')content.innerHTML='<h1>Operations</h1><section class="card"><h2>Server integration pending</h2><p>Shared events and sign-ups will be enabled after Firebase rules and the Cortana server integration are verified. No sample events are presented as live events.</p></section>';
 else if(page==='notifications')content.innerHTML=`<h1>Notifications</h1><section class="card"><p>${esc(inboxStatus)}</p><p>New website notifications appear as silent 505th alerts while the Hub is open or in your tray. Older notifications load quietly.</p><button class="primary" id="testAlert">Test custom alert</button></section><section class="card">${inbox.length?inbox.map(n=>`<article class="event"><h3>${esc(n.title||'505th update')}</h3><p>${esc(n.body||'')}</p><span class="small">${esc(date(n.createdAt))} · ${n.read?'Read':'Unread'}</span>${!n.read?`<button class="secondary" data-read="${esc(n.id)}">Mark as read</button>`:''}</article>`).join(''):'<p>No notifications loaded.</p>'}</section>`;
 else if(page==='settings')content.innerHTML=settingsView();
 else{
  const now=new Date();
  const ribbonsThisMonth=(p.ribbonHistory||[]).filter(r=>{const d=toDateObj(r.date);return d&&d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth();}).length;
  const commendCount=(p.commendationHistory||[]).length;
  const medalNames=(p.commendationHistory||[]).map(c=>c.title||c.name||'Medal').filter(Boolean);
  const attRate=(p.opsEligible>0)?Math.round((p.opsAttended/p.opsEligible)*100)+'%':'—';
  content.innerHTML=`<div class="intro"><div class="eyebrow">MEMBER TERMINAL</div><h1>Welcome, ${esc(p.firstName||p.callsign||'member')}.</h1><p>${esc(p.rank)} · ${esc(p.platoon)}</p></div><div class="stats"><section class="card"><div class="small">RANK</div><div class="stat">${esc(p.rank)}</div></section><section class="card"><div class="small">PLATOON</div><div class="stat">${esc(p.platoon)}</div></section><section class="card"><div class="small">ROLE</div><div class="stat">${esc(p.role)}</div></section></div><div class="stats"><section class="card"><div class="small">ATTENDANCE RATE</div><div class="stat">${attRate}</div><p class="small">From website attended/eligible counters. Period not verified; not labelled all-time.</p></section><section class="card"><div class="small">RIBBONS THIS MONTH</div><div class="stat">${ribbonsThisMonth}</div></section><section class="card"><div class="small">COMMENDATIONS</div><div class="stat">${commendCount}</div><p class="small">${medalNames.length?esc(medalNames.join(', ')):'None recorded yet.'}</p></section></div><section class="card"><h2>Your account is connected</h2><p>My service record reads only your own website member document and listens for updates.</p><p>Use the tray icon to reopen the Hub after closing the window. Your server PC continues running Cortana independently.</p><p class="small">Staff event tools remain unavailable until their server permissions are verified.</p></section>`;
 }
}
function updateStatusLine(){
 const s=updateStatus.state;
 if(s==='checking')return '<p class="small">Checking for updates…</p>';
 if(s==='downloading')return `<p class="small">Downloading update ${esc(updateStatus.version)}…</p>`;
 if(s==='ready')return `<p class="small">Update ${esc(updateStatus.version)} downloaded and ready. <button class="secondary" id="restartToUpdateBtn">Restart now</button></p>`;
 if(s==='up-to-date')return '<p class="small">You\'re up to date.</p>';
 if(s==='error')return '<p class="small">Could not check for updates. Check your connection and try again.</p>';
 return '<p class="small">Update status unknown yet.</p>';
}
function settingsView(){
 if(startWithWindows===null&&!startWithWindowsLoading){startWithWindowsLoading=true;window.hubDesktop?.getStartWithWindows?.().then(v=>{startWithWindows=!!v;startWithWindowsLoading=false;if(page==='settings')render();}).catch(()=>{startWithWindowsLoading=false;});}
 if(discordInviteStatus==='idle'){discordInviteStatus='loading';loadDiscordInvite();}
 const startLabel=startWithWindows===null?'Loading…':(startWithWindows?'On':'Off');
 const discordText=discordInviteStatus==='ready'?'Join the 505th Discord server.':discordInviteStatus==='error'?'Could not load the invite link right now.':'Loading invite link…';
 return `<h1>Settings</h1>
<section class="card"><h2>Start with Windows</h2><p class="small">Launch 505th Hub automatically when you sign in to Windows.</p><button class="${startWithWindows?'primary':'secondary'}" id="toggleStartWithWindows" ${startWithWindows===null?'disabled':''}>${startLabel}</button></section>
<section class="card"><h2>Notifications</h2><p class="small">Show a silent visual alert in the corner of your screen when a new notification arrives. Never plays sound.</p><button class="${notifAlertsEnabled?'primary':'secondary'}" id="toggleNotifAlerts">${notifAlertsEnabled?'On':'Off'}</button></section>
<section class="card"><h2>Version</h2><p class="small">505th Hub ${esc(appVersion||'—')}</p><button class="secondary" id="checkForUpdatesBtn">Check for Updates</button>${updateStatusLine()}</section>
<section class="card"><h2>Discord</h2><p class="small">${discordText}</p><button class="primary" id="openDiscordInvite" ${discordInviteUrl?'':'disabled'}>Open Discord Invite</button></section>
<section class="card"><h2>Help</h2><details class="help-guide"><summary>505th Hub Guide</summary><div class="small"><p><strong>Signing in</strong> — use your existing 505th website email and password.</p><p><strong>Closing the window</strong> keeps the Hub running quietly in your system tray. Right-click the tray icon to reopen it or quit fully.</p><p><strong>Notifications</strong> appear as a silent pop-up in the corner of your screen — nothing plays sound.</p><p><strong>Updates</strong> download automatically in the background. When one's ready, you'll see a prompt to restart, or you can check any time from here or the tray menu.</p></div></details></section>
<section class="card"><h2>Contact us</h2><p class="small">Coming soon.</p></section>`;
}
async function loadDiscordInvite(){
 try{const snap=await getDoc(doc(db,'settings','site'));const url=snap.exists()?snap.data().discord_invite:null;if(url){discordInviteUrl=url;discordInviteStatus='ready';}else{discordInviteStatus='error';}}
 catch{discordInviteStatus='error';}
 if(page==='settings')render();
}
function renderUpdateBadge(){
 const el=document.querySelector('#updateIndicator');if(!el)return;
 const s=updateStatus.state;
 const label=s==='checking'?'Checking for updates…':s==='downloading'?`Downloading update ${updateStatus.version||''}…`:s==='ready'?'Update ready — click to restart':s==='up-to-date'?'Up to date':s==='error'?'Update check failed':'';
 el.textContent=label;el.hidden=!label;
}
onAuthStateChanged(auth,user=>{unsubscribe?.();unsubscribe=null;clearInbox();profile=null;status=user?'Loading member record…':'Sign in required';render();if(!user)return;unsubscribe=onSnapshot(doc(db,'users',user.uid),{includeMetadataChanges:true},snapshot=>{if(auth.currentUser?.uid!==user.uid)return;const p=snapshot.data();if(!p||!['active','approved'].includes(p.status)||p.suspended===true){message('This account does not have approved Hub access. Contact command.');void signOut(auth);return;}profile=p;connectInbox(user.uid);status=snapshot.metadata.fromCache?'Cached profile · waiting for server':'Profile synced with Firebase';render();},()=>{clearInbox();profile=null;status='Member record unavailable';render();message('Could not read your member record. Check your connection and Firebase access rules.');});});
document.addEventListener('submit',async event=>{if(event.target.id!=='login')return;event.preventDefault();const form=event.target,button=form.querySelector('button'),email=form.elements.email.value.trim(),password=form.elements.password.value;button.disabled=true;message('Signing in…');try{await ready;await signInWithEmailAndPassword(auth,email,password);message('');}catch(error){message(error.code==='auth/network-request-failed'?'Cannot reach Firebase. Check your internet connection.':'Sign-in failed. Check your website email and password.');}finally{if(form.isConnected){form.elements.password.value='';button.disabled=false;}}});
document.addEventListener('click',async event=>{const b=event.target.closest('button');if(!b)return;if(b.dataset.page&&profile){page=b.dataset.page;render();}if(b.dataset.read&&profile&&auth.currentUser){b.disabled=true;try{await updateDoc(doc(db,'notifications',auth.currentUser.uid,'items',b.dataset.read),{read:true});}catch{message('Could not mark notification as read. Try again when connected.');if(b.isConnected)b.disabled=false;}}if(b.id==='logout'){await signOut(auth);message('Signed out.');}if(b.id==='testAlert'){await window.hubDesktop?.testNotification();}
if(b.id==='updateIndicator'&&updateStatus.state==='ready'){window.hubDesktop?.restartToUpdate?.();}
if(b.id==='restartToUpdateBtn'){window.hubDesktop?.restartToUpdate?.();}
if(b.id==='checkForUpdatesBtn'){window.hubDesktop?.checkForUpdates?.();}
if(b.id==='toggleStartWithWindows'&&startWithWindows!==null){b.disabled=true;const next=!startWithWindows;const result=await window.hubDesktop?.setStartWithWindows?.(next);startWithWindows=(typeof result==='boolean')?result:next;render();}
if(b.id==='toggleNotifAlerts'){notifAlertsEnabled=!notifAlertsEnabled;try{localStorage.setItem('505th-hub-alerts',notifAlertsEnabled?'on':'off');}catch{}render();}
if(b.id==='openDiscordInvite'&&discordInviteUrl){window.hubDesktop?.openExternal?.(discordInviteUrl);}
});
window.hubDesktop?.onOperations?.(()=>{if(profile){page='operations';render();}});
window.addEventListener('offline',()=>{status='Offline · waiting to reconnect';document.querySelector('#connection').textContent=status;});
window.addEventListener('online',()=>{status='Reconnecting to Firebase…';document.querySelector('#connection').textContent=status;});

window.hubDesktop?.onNotifications?.(()=>{if(profile){page='notifications';render();}});
window.hubDesktop?.onUpdateStatus?.(status=>{updateStatus=status||{state:'idle'};renderUpdateBadge();if(page==='settings')render();});
window.hubDesktop?.getVersion?.().then(v=>{appVersion=v;const fv=document.querySelector('#footerVersion');if(fv&&v)fv.textContent=`${v} / DEVELOPMENT BUILD`;if(page==='settings')render();}).catch(()=>{});
