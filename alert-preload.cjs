const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('alertControls',{getPayload:()=>ipcRenderer.invoke('alert:payload'),onPayload:callback=>ipcRenderer.on('alert:payload',(_event,data)=>callback(data)),dismiss:()=>ipcRenderer.send('alert:dismiss'),view:()=>ipcRenderer.send('alert:view')});
