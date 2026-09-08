const {app,BrowserWindow,ipcMain,screen,Tray,Menu,nativeImage,dialog}=require('electron');
const {autoUpdater}=require('electron-updater');
const path=require('node:path');let mainWindow,alertWindow,tray,quitting=false,manualUpdateCheck=false;let alertPayload={title:'505th test alert',body:'This is a visual test. No live event is starting.'};
if(!app.requestSingleInstanceLock()){app.quit();}else{
function reveal(){if(mainWindow){if(mainWindow.isMinimized())mainWindow.restore();mainWindow.show();mainWindow.focus();}}
function secure(w){w.webContents.setWindowOpenHandler(()=>({action:'deny'}));w.webContents.on('will-navigate',e=>e.preventDefault());w.webContents.session.setPermissionRequestHandler((_w,_p,callback)=>callback(false));}
autoUpdater.autoDownload=true;autoUpdater.autoInstallOnAppQuit=false;
autoUpdater.on('error',err=>{if(manualUpdateCheck){manualUpdateCheck=false;dialog.showMessageBox(mainWindow,{type:'error',title:'505th Hub',message:'Could not check for updates.',detail:String(err?.message||err)});}else console.error('[505th Hub] update check failed:',err);});
autoUpdater.on('update-not-available',()=>{if(manualUpdateCheck){manualUpdateCheck=false;dialog.showMessageBox(mainWindow,{type:'info',title:'505th Hub',message:`You're up to date.`,detail:`Running version ${app.getVersion()}.`});}});
autoUpdater.on('update-available',info=>{manualUpdateCheck=false;if(tray)tray.setToolTip(`505th Hub — downloading update ${info.version}…`);});
autoUpdater.on('update-downloaded',info=>{if(tray)tray.setToolTip('505th Hub — update ready to install');const res=dialog.showMessageBoxSync(mainWindow,{type:'info',title:'505th Hub update ready',buttons:['Restart now','Later'],defaultId:0,cancelId:1,message:`505th Hub ${info.version} has been downloaded.`,detail:'Restart now to finish installing it, or keep working and it will install next time you quit.'});if(res===0){quitting=true;autoUpdater.quitAndInstall();}});
function checkForUpdates(manual){if(!app.isPackaged){if(manual)dialog.showMessageBox(mainWindow,{type:'info',title:'505th Hub',message:'Updates only run in the installed app, not this development build.'});return;}manualUpdateCheck=!!manual;autoUpdater.checkForUpdates().catch(()=>{});}
let badgeIcon=null;
function updateUnreadBadge(count){const n=Number(count)||0;if(tray)tray.setToolTip(n>0?`505th Hub — ${n} unread`:'505th Hub — running in background');if(!mainWindow)return;if(n<=0){mainWindow.setOverlayIcon(null,'');return;}if(!badgeIcon){try{badgeIcon=nativeImage.createFromPath(path.join(__dirname,'assets/badge.png'));}catch{badgeIcon=null;}}if(badgeIcon)mainWindow.setOverlayIcon(badgeIcon,`${n} unread notification${n===1?'':'s'}`);}
function showAlert(payload){alertPayload=payload&&typeof payload.title==='string'?{title:payload.title.slice(0,180),body:String(payload.body||'').slice(0,1200)}:{title:'505th test alert',body:'This is a visual test. No live event is starting.'};if(alertWindow){alertWindow.webContents.send('alert:payload',alertPayload);alertWindow.showInactive();return true;}const a=screen.getDisplayNearestPoint(screen.getCursorScreenPoint()).workArea;const width=Math.min(430,a.width-32),height=Math.min(310,a.height-32);alertWindow=new BrowserWindow({width,height,x:a.x+a.width-width-16,y:a.y+a.height-height-16,frame:false,resizable:false,skipTaskbar:true,alwaysOnTop:true,show:false,backgroundColor:'#09131e',webPreferences:{preload:path.join(__dirname,'alert-preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true}});secure(alertWindow);alertWindow.once('ready-to-show',()=>alertWindow?.showInactive());alertWindow.on('closed',()=>alertWindow=null);alertWindow.loadFile('alert.html');return true;}
app.on('second-instance',reveal);app.on('before-quit',()=>{quitting=true;});
app.whenReady().then(()=>{
 mainWindow=new BrowserWindow({width:1280,height:850,minWidth:850,minHeight:640,backgroundColor:'#080d13',title:'505th Hub',autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:false}});secure(mainWindow);
 function trayMenu(){return Menu.buildFromTemplate([{label:'Open 505th Hub',click:reveal},{label:'Test custom alert',click:showAlert},{type:'separator'},{label:'Check for Updates',click:()=>checkForUpdates(true)},{type:'separator'},{label:'Start with Windows',type:'checkbox',checked:app.getLoginItemSettings().openAtLogin,click:()=>{app.setLoginItemSettings({openAtLogin:!app.getLoginItemSettings().openAtLogin});tray?.setContextMenu(trayMenu());}},{type:'separator'},{label:'Quit 505th Hub',click:()=>app.quit()}]);}
 try{tray=new Tray(nativeImage.createFromPath(path.join(__dirname,'assets/logo.png')).resize({width:32,height:32}));tray.setToolTip('505th Hub — running in background');tray.setContextMenu(trayMenu());tray.on('click',reveal);}catch{tray=null;}
 mainWindow.on('close',event=>{if(!quitting&&tray){event.preventDefault();mainWindow.hide();}else{quitting=true;app.quit();}});
 ipcMain.handle('notification:live',(e,payload)=>e.sender===mainWindow?.webContents&&payload&&typeof payload.title==='string'?showAlert(payload):false);
 ipcMain.handle('notification:clear',e=>{if(e.sender!==mainWindow?.webContents)return false;alertWindow?.close();return true;});
 ipcMain.handle('alert:payload',e=>e.sender===alertWindow?.webContents?alertPayload:null);
 ipcMain.handle('notification:demo',e=>e.sender===mainWindow?.webContents?showAlert():false);
 ipcMain.on('notification:unread-count',(e,count)=>{if(e.sender!==mainWindow?.webContents)return;updateUnreadBadge(count);});
 ipcMain.on('alert:dismiss',e=>{if(e.sender===alertWindow?.webContents)alertWindow.close();});
 ipcMain.on('alert:view',e=>{if(e.sender!==alertWindow?.webContents)return;reveal();mainWindow.webContents.send('hub:notifications');alertWindow.close();});
 mainWindow.loadFile('live.html');app.on('activate',reveal);
 checkForUpdates(false);setInterval(()=>checkForUpdates(false),4*60*60*1000);
});app.on('window-all-closed',()=>{if(!tray)app.quit();});
}
