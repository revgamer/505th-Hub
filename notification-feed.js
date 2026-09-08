// Initial inbox history is shown silently. Only new server-confirmed IDs alert.
export function createNotificationFeed(deliver) {
 let initialized=false;
 const seen=new Set();
 return snapshot=>{
  if(snapshot.metadata.fromCache) return;
  const fresh=[];
  for(const item of snapshot.docs){
   const data=item.data();
   if(initialized&&!seen.has(item.id)&&data.read!==true) fresh.push({id:item.id,...data});
   seen.add(item.id);
  }
  initialized=true;
  // Bound memory for long-running sessions; current query has at most 50 docs.
  if(seen.size>5000){seen.clear();for(const item of snapshot.docs)seen.add(item.id);}
  if(fresh.length) deliver(fresh);
 };
}
