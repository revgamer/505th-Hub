document.getElementById('close').onclick=()=>window.alertControls.dismiss();
document.getElementById('dismiss').onclick=()=>window.alertControls.dismiss();
document.getElementById('view').onclick=()=>window.alertControls.view();
document.addEventListener('keydown',event=>{if(event.key==='Escape')window.alertControls.dismiss();});

function showPayload(data){if(!data)return;document.querySelector('h1').textContent=data.title;document.querySelector('main > p').textContent=data.body;}
window.alertControls.onPayload(showPayload);
void window.alertControls.getPayload().then(showPayload);
