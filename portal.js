import {createJourney,discover,continueJourney} from './journey-state.mjs';
import {createGameAudio} from './game-audio.mjs';
import {createInputRouter} from './input-router.mjs';
const audio=createGameAudio();
const inputRouter=createInputRouter();
const W=1280,H=720,VIEW=1646,SCROLL_W=30000,$=id=>document.getElementById(id),chapters=window.PORTAL_CHAPTERS;
const canvas=$('stage'),ctx=canvas.getContext('2d'),surface=document.createElement('canvas'),dim=document.createElement('canvas'),scratch=document.createElement('canvas');
for(const c of [surface,dim,scratch]){c.width=W;c.height=H;}
const art=new Image();art.src='assets/qingming_scroll.jpg';
let journey=createJourney(chapters),pointer={x:.5,y:.5,active:false,source:'mouse'},viewX=chapters[0].x,last=performance.now(),lastInput=0,dwell=0,hover=-1,uiHover='',uiTime=0,frames=0,travel=null,searchArmed=true,searchOrigin=null,lastHint=0,artReady=false,celebration=null,recap=null,replayFinished=false;
const totalClues=chapters.reduce((n,c)=>n+c.targets.length,0);
const reward=$('rewardVideo');
let artPan=0,artOverflow=0;
function positionPainting(){const r=$('paintingWrap').getBoundingClientRect(),w=parseFloat(canvas.style.width);canvas.style.left=(artOverflow?-artPan:(r.width-w)/2)+'px';}
function layout(){
 const r=$('paintingWrap').getBoundingClientRect(),h=Math.max(10,r.height-40),w=h*16/9,ratio=artOverflow?artPan/artOverflow:.5;
 artOverflow=Math.max(0,w-r.width);artPan=artOverflow*ratio;
 canvas.style.position='absolute';canvas.style.width=w+'px';canvas.style.height=h+'px';canvas.style.top=(r.height-h)/2+'px';positionPainting();
 const m=$('mainView');m.style.setProperty('--artLeft',Math.max(0,(r.width-w)/2)+'px');m.style.setProperty('--artTop',(r.height-h)/2+'px');m.style.setProperty('--artW',Math.min(w,r.width)+'px');m.style.setProperty('--artH',h+'px');
}
new ResizeObserver(layout).observe($('paintingWrap'));layout();
function cacheView(){if(!artReady)return;surface.getContext('2d').drawImage(art,viewX,0,VIEW,926,0,0,W,H);const d=dim.getContext('2d');d.save();d.filter='grayscale(1) brightness(.58) sepia(.28)';d.drawImage(surface,0,0);d.restore();$('viewMarker').style.left=(viewX/SCROLL_W*100)+'%';$('viewMarker').style.width=(VIEW/SCROLL_W*100)+'%';$('scrollPosition').value=viewX;}
art.onload=()=>{artReady=true;$('loadingArt').hidden=true;cacheView();};art.onerror=()=>{$('loadingArt').textContent='長卷未能載入，請重新開啟遊戲。';};
function pointerClient(){const r=$('mainView').getBoundingClientRect();return {x:r.left+pointer.x*r.width,y:r.top+pointer.y*r.height};}
function paintingPoint(){const p=pointerClient(),r=canvas.getBoundingClientRect();return {x:(p.x-r.left)/r.width,y:(p.y-r.top)/r.height,inside:p.x>=r.left&&p.x<=r.right&&p.y>=r.top&&p.y<=r.bottom};}
function input(x,y,active=true,source='hand'){if(!inputRouter.accept(source,active,performance.now()))return false;pointer={x:Math.max(0,Math.min(1,Number(x)||0)),y:Math.max(0,Math.min(1,Number(y)||0)),active:!!active,source};lastInput=performance.now();$('mainView').dataset.inputSource=active?source:'none';$('status').textContent=source==='hand'?(active?'手掌控制':'手掌暫停'):source==='none'?'等待手掌':'滑鼠控制';return true;}
window.portalInput=input;
function updateCopy(){
 const c=chapters[journey.chapter],found=journey.found[journey.chapter];$('mainView').dataset.chapter=journey.chapter;
 $('chapterRail').innerHTML=chapters.map((c,i)=>`<li class="${i===journey.chapter?'current':i<journey.chapter?'done':''}" ${i===journey.chapter?'aria-current="step"':''}><b>${i<journey.chapter?'✓':i+1}</b>${c.name}</li>`).join('');
 audio.setChapter(journey.chapter);$('help').textContent=`第 ${journey.chapter+1} 關 · ${c.name} · 搵齊兩件`;
 $('taskTitle').textContent=c.targets.map((t,i)=>(found.includes(i)?'✓ ':'')+t.name).join(' · ');$('taskText').textContent='左右揮手展卷 · 停留兩秒尋寶';
 $('progress').textContent=journey.found.flat().length+' / '+totalClues;
 $('treasureList').innerHTML=c.targets.map((t,i)=>`<span class="treasure ${found.includes(i)?'done':''}" data-treasure="${i}"><b>${found.includes(i)?'✓':'？'}</b>${t.name}</span>`).join('');
 $('back').hidden=true;$('scrollPosition').hidden=true;$('exploreHint').hidden=true;
}
function haltFilm(){reward.pause();reward.removeAttribute('src');reward.load();reward.hidden=true;}
function reset(){audio.stopNarration();haltFilm();journey=createJourney(chapters);viewX=chapters[0].x;travel=null;celebration=null;recap=null;replayFinished=false;artPan=artOverflow/2;positionPainting();dwell=0;hover=-1;uiTime=0;uiHover='';searchArmed=true;$('notice').hidden=true;$('rewardMedia').hidden=false;$('travelBanner').hidden=true;$('skipReplay').hidden=true;$('mainView').classList.remove('is-exploring','is-celebrating');cacheView();updateCopy();}
function detail(target){const d=$('detailCanvas').getContext('2d'),cx=chapters[journey.chapter].x+target.x*VIEW,cy=target.y*926,cw=500,ch=234;d.drawImage(art,Math.max(0,Math.min(SCROLL_W-cw,cx-cw/2)),Math.max(0,Math.min(926-ch,cy-ch/2)),cw,ch,0,0,640,300);}
function showDiscovery(i){
 if(!discover(journey,chapters,i))return;const c=chapters[journey.chapter],t=c.targets[i],n=journey.found[journey.chapter].length;
 dwell=0;hover=-1;uiHover='';uiTime=0;updateCopy();detail(t);$('detailCanvas').hidden=false;
 $('discoveryKicker').textContent='發現畫中生活 · '+c.name;$('discoveryCount').textContent=n+' / '+c.targets.length;$('noticeTitle').textContent='搵到'+t.name+'！';$('noticeText').textContent=t.learn;
 $('continue').textContent=n<c.targets.length?'繼續尋找餘下 '+(c.targets.length-n)+' 件':journey.chapter<chapters.length-1?'兩件齊集，前往'+chapters[journey.chapter+1].name+' →':'十個線索齊集，點亮古城';
 $('rewardCaption').textContent=t.filmNote||'原畫細看 · 放大同一個物件';
 if(t.film){reward.src=t.film;reward.currentTime=0;reward.hidden=false;reward.play().catch(()=>{reward.hidden=true;$('rewardCaption').textContent='原畫細看 · 動畫未能播放';});}else haltFilm();
 $('notice').hidden=false;audio.effect('found');audio.narrate(t.id);
}
function finish(){
 journey.mode='complete';replayFinished=true;$('skipReplay').hidden=true;$('travelBanner').hidden=true;$('mainView').classList.remove('is-celebrating');$('discoveryKicker').textContent='尋寶清明上河圖 · 主線完成';$('discoveryCount').textContent=totalClues+' / '+totalClues;$('noticeTitle').textContent='十個線索，穿越一卷古城';$('noticeText').textContent='你由城門外行到長卷深處，認識交通、買賣、河岸同建築。蒙板已經化成光，再由城內回望城外。仲可以全卷漫遊，睇埋沿途未細看嘅地方。';$('continue').textContent='全卷漫遊，自由賞畫';$('rewardMedia').hidden=true;$('notice').hidden=false;audio.narrate('complete');
}
function next(){
 audio.stopNarration();haltFilm();$('notice').hidden=true;$('rewardMedia').hidden=false;
 if(journey.mode==='complete'){explore();return;}
 const from=viewX,result=continueJourney(journey,chapters);dwell=0;hover=-1;uiTime=0;uiHover='';searchOrigin=pointerClient();searchArmed=false;
 if(result==='transition'){audio.effect('transition');travel={from,to:chapters[journey.chapter].x,start:performance.now()};$('travelBanner').textContent='沿卷前進 · '+chapters[journey.chapter].name;$('travelBanner').hidden=false;updateCopy();}
 if(result==='complete')beginCelebration();
}
function explore(){
 audio.stopNarration();haltFilm();$('notice').hidden=true;$('travelBanner').hidden=true;travel=null;journey.mode='explore';dwell=0;hover=-1;
 $('mainView').classList.add('is-exploring');$('mainView').classList.remove('is-celebrating');$('skipReplay').hidden=true;
 $('help').textContent='全卷漫遊 · 自由欣賞';$('taskTitle').textContent='一幅長卷，慢慢展開';$('taskText').textContent='將光圈移到畫面左邊或右邊，可沿整幅畫移動；亦可拖動下方位置條。';$('treasureList').innerHTML='';$('progress').textContent='';$('back').hidden=false;$('scrollPosition').hidden=false;$('exploreHint').hidden=false;
}
function back(){journey.mode='search';viewX=chapters[journey.chapter].x;dwell=0;hover=-1;searchArmed=true;$('mainView').classList.remove('is-exploring');cacheView();updateCopy();if(journey.found.flat().length===totalClues){journey.mode='complete';finish();}}
$('reset').onclick=reset;$('continue').onclick=next;$('back').onclick=back;$('scrollPosition').oninput=e=>{viewX=Number(e.target.value);cacheView();};
$('skipReplay').onclick=finish;
function mouseInput(e){if(!$('welcome').hidden||!$('cameraPanel').hidden)return;const r=$('mainView').getBoundingClientRect();input((e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height,true,'mouse');}
$('mainView').addEventListener('pointermove',mouseInput);$('mainView').addEventListener('pointerdown',mouseInput);
$('mainView').addEventListener('pointerleave',()=>input(.5,.5,false,'mouse'));
$('aboutPainting').onclick=()=>{audio.stopNarration();$('welcome').hidden=false;};
window.addEventListener('keydown',e=>{if(e.target.matches('input,select'))return;if(e.key.toLowerCase()==='r')reset();if(e.key==='Escape'&&journey.mode==='explore')back();if(journey.mode==='explore'&&['ArrowLeft','ArrowRight'].includes(e.key)){viewX=Math.max(0,Math.min(SCROLL_W-VIEW,viewX+(e.key==='ArrowLeft'?-600:600)));cacheView();}});
function ring(x,y,p,r=32){ctx.save();ctx.strokeStyle='#f2d697';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();ctx.lineWidth=6;ctx.beginPath();ctx.arc(x,y,r+7,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,p));ctx.stroke();ctx.restore();}
function lens(p){if(!pointer.active||!p.inside)return;const x=p.x*W,y=p.y*H,r=116,fx=scratch.getContext('2d');fx.clearRect(0,0,W,H);fx.drawImage(surface,0,0);fx.globalCompositeOperation='destination-in';const g=fx.createRadialGradient(x,y,r*.6,x,y,r*1.35);g.addColorStop(0,'#fff');g.addColorStop(1,'#fff0');fx.fillStyle=g;fx.fillRect(0,0,W,H);fx.globalCompositeOperation='source-over';ctx.drawImage(scratch,0,0);ctx.strokeStyle='#efd58d77';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();}
function search(dt,p){
 const c=chapters[journey.chapter],found=journey.found[journey.chapter];ctx.drawImage(dim,0,0);
 for(const i of found){const t=c.targets[i];ctx.save();ctx.beginPath();ctx.arc(t.x*W,t.y*H,98,0,Math.PI*2);ctx.clip();ctx.drawImage(surface,0,0);ctx.restore();ctx.fillStyle='#e9d494';ctx.font='23px serif';ctx.fillText('✓',t.x*W-9,t.y*H+8);}
 lens(p);const pc=pointerClient();if(searchOrigin&&Math.hypot(pc.x-searchOrigin.x,pc.y-searchOrigin.y)>28)searchArmed=true;
 const artRect=canvas.getBoundingClientRect(),mainRect=$('mainView').getBoundingClientRect(),margin=Math.min(90,mainRect.width*.16);
 const candidates=c.targets.map((t,i)=>({i,t,dist:Math.hypot((p.x-t.x)*W,(p.y-t.y)*H),screenX:artRect.left+t.x*artRect.width})).filter(o=>!found.includes(o.i)&&o.dist<o.t.r*W&&o.screenX>=mainRect.left+margin&&o.screenX<=mainRect.right-margin).sort((a,b)=>a.dist-b.dist);
 const hit=pointer.active&&p.inside&&searchArmed&&$('welcome').hidden&&$('cameraPanel').hidden?candidates[0]?.i??-1:-1;
 if(hit!==hover){hover=hit;dwell=0;}else if(hit>=0){dwell+=dt;ring(p.x*W,p.y*H,dwell/1.8);if(dwell>=1.8)showDiscovery(hit);}else dwell=0;
 if(hit>=0&&journey.mode==='search'){const t=c.targets[hit];$('taskText').textContent='發現線索！照住停留約兩秒…';lastHint=performance.now();}
 else if(performance.now()-lastHint>1200&&journey.mode==='search')$('taskText').textContent='左右揮手展卷 · 停留兩秒尋寶';
}
function uiDwell(dt){
 let hit='';const pc=pointerClient();if(pointer.source!=='hand'||!$('welcome').hidden||!$('cameraPanel').hidden){uiHover='';uiTime=0;return;}
 for(const id of ['reset','aboutPainting','back','continue','replayNarration','skipReplay']){const b=$(id),r=b.getBoundingClientRect(),visible=r.width>0&&r.height>0&&(journey.mode==='discovery'||journey.mode==='complete'?['continue','replayNarration'].includes(id):!['continue','replayNarration'].includes(id));if(pointer.active&&visible&&pc.x>=r.left&&pc.x<=r.right&&pc.y>=r.top&&pc.y<=r.bottom)hit=id;else b.style.background='';}
 if(hit!==uiHover){uiHover=hit;uiTime=0;}else if(hit){uiTime+=dt;$(hit).style.background=`linear-gradient(90deg,#8a794b ${Math.min(100,uiTime/1.25*100)}%,#273224 0)`;if(uiTime>=1.25){uiTime=0;uiHover='';$(hit).click();}}
}
const mask=document.createElement('canvas');mask.width=160;mask.height=90;
const maskInk=mask.getContext('2d'),maskPixels=maskInk.createImageData(160,90),field=new Float32Array(160*90),burnLayer=document.createElement('canvas');burnLayer.width=W;burnLayer.height=H;
const fract=x=>x-Math.floor(x),hash=(x,y)=>fract(Math.sin(x*127.1+y*311.7)*43758.5453);
function noise(x,y){const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);return (hash(ix,iy)*(1-u)+hash(ix+1,iy)*u)*(1-v)+(hash(ix,iy+1)*(1-u)+hash(ix+1,iy+1)*u)*v;}
for(let y=0;y<90;y++)for(let x=0;x<160;x++)field[y*160+x]=Math.hypot((x/160-.5)*1.3,y/90-.5)+.22*noise(x/13,y/13)+.08*noise(x/4,y/4);
const sparks=Array.from({length:300},(_,i)=>{const x=hash(i,9),y=hash(i,2);return {x:x*W,y:y*H,at:field[Math.min(89,Math.floor(y*90))*160+Math.min(159,Math.floor(x*160))],vx:(hash(i,3)-.5)*70,vy:-30-hash(i,4)*90,size:1+hash(i,5)*2};});
function beginCelebration(){audio.stopNarration();audio.effect('victory');artPan=artOverflow/2;positionPainting();journey.mode='burn';celebration={start:performance.now()};$('notice').hidden=true;$('skipReplay').hidden=false;$('mainView').classList.add('is-celebrating');$('travelBanner').hidden=false;$('travelBanner').textContent='十個線索齊集 · 讓古城甦醒';$('help').textContent='通關時刻';$('taskTitle').textContent='灰幕化成光，古城現真色';$('taskText').textContent='';dwell=0;uiTime=0;uiHover='';}
function drawBurn(now){
 const elapsed=(now-celebration.start)/1000,t=Math.min(1,elapsed/4.5),front=t*1.5-.2;
 ctx.drawImage(surface,0,0);
 for(let i=0;i<field.length;i++){const k=i*4;maskPixels.data[k]=255;maskPixels.data[k+1]=255;maskPixels.data[k+2]=255;maskPixels.data[k+3]=Math.max(0,Math.min(255,(field[i]-front)*255*15));}
 maskInk.putImageData(maskPixels,0,0);const b=burnLayer.getContext('2d');b.clearRect(0,0,W,H);b.globalCompositeOperation='source-over';b.drawImage(dim,0,0);b.globalCompositeOperation='destination-in';b.drawImage(mask,0,0,W,H);b.globalCompositeOperation='source-over';ctx.drawImage(burnLayer,0,0);
 ctx.save();ctx.globalCompositeOperation='lighter';ctx.shadowColor='#ffdc83';ctx.shadowBlur=13;
 for(let y=1;y<89;y+=2)for(let x=1;x<159;x+=2){const d=Math.abs(field[y*160+x]-front);if(d<.035){ctx.fillStyle=`rgba(255,207,102,${(1-d/.035)*.62})`;ctx.beginPath();ctx.arc(x/160*W,y/90*H,2.1,0,Math.PI*2);ctx.fill();}}
 for(const p of sparks){const age=elapsed-(p.at+.2)/1.5*4.5;if(age>=0&&age<1.6){ctx.globalAlpha=(1-age/1.6)*.9;ctx.fillStyle=age<.25?'#fff4c7':'#efc46c';ctx.beginPath();ctx.arc(p.x+p.vx*age+Math.sin(age*7+p.x)*5,p.y+p.vy*age,p.size*(1-age/2),0,Math.PI*2);ctx.fill();}}
 ctx.restore();
 if(t===1){celebration=null;journey.mode='recap';recap={start:now};$('help').textContent='全彩回望 · 由城內到城外';$('travelBanner').textContent='回望古城 · 由內到外';}
}
function drawRecap(now){
 const elapsed=(now-recap.start)/1000,segment=Math.floor(elapsed/4),index=chapters.length-1-Math.min(segment,chapters.length-1);
 if(segment>=chapters.length){viewX=chapters[0].x;cacheView();recap=null;finish();ctx.drawImage(surface,0,0);return;}
 const local=elapsed%4,t=Math.max(0,Math.min(1,(local-.7)/2.6)),ease=t*t*(3-2*t),from=chapters[index].x,to=chapters[Math.max(0,index-1)].x;
 viewX=from+(to-from)*ease;cacheView();ctx.drawImage(surface,0,0);$('taskTitle').textContent=chapters[index].name;$('taskText').textContent='';$('travelBanner').textContent='回望古城 · '+chapters[index].name;
}
function vignette(){
 ctx.save();for(const [x0,y0,x1,y1,rx,ry,rw,rh]of [[0,0,120,0,0,0,120,H],[W,0,W-120,0,W-120,0,120,H],[0,0,0,65,0,0,W,65],[0,H,0,H-85,0,H-85,W,85]]){const g=ctx.createLinearGradient(x0,y0,x1,y1);g.addColorStop(0,'#070d09');g.addColorStop(.3,'#070d09d9');g.addColorStop(1,'#070d0900');ctx.fillStyle=g;ctx.fillRect(rx,ry,rw,rh);}ctx.restore();
}
function draw(now){
 const dt=Math.min(.06,(now-last)/1000);last=now;if(pointer.source==='hand'&&now-lastInput>450)pointer.active=false;
 if(artOverflow&&journey.mode==='search'&&pointer.active&&hover<0&&$('welcome').hidden&&$('cameraPanel').hidden){const speed=pointer.x<.16?-650*(1-pointer.x/.16):pointer.x>.84?650*(pointer.x-.84)/.16:0;if(speed){artPan=Math.max(0,Math.min(artOverflow,artPan+speed*dt));positionPainting();}}
 const p=paintingPoint();ctx.clearRect(0,0,W,H);
 if(artReady){
  if(journey.mode==='burn')drawBurn(now);
  else if(journey.mode==='recap')drawRecap(now);
  else if(journey.mode==='transition'&&travel){const t=Math.min(1,(now-travel.start)/3200),ease=t*t*(3-2*t);viewX=travel.from+(travel.to-travel.from)*ease;cacheView();ctx.drawImage(surface,0,0);if(t===1){travel=null;journey.mode='search';$('travelBanner').hidden=true;dwell=0;searchOrigin=pointerClient();searchArmed=false;}}
  else if(journey.mode==='explore'){if(pointer.active&&p.inside&&$('cameraPanel').hidden){const speed=p.x<.18?-1700*(1-p.x/.18):p.x>.82?1700*((p.x-.82)/.18):0;if(speed){const previousX=viewX;viewX=Math.max(0,Math.min(SCROLL_W-VIEW,viewX+speed*dt));if(viewX===previousX&&artOverflow){artPan=Math.max(0,Math.min(artOverflow,artPan+speed*dt*.45));positionPainting();}cacheView();}}ctx.drawImage(surface,0,0);}
  else if(journey.mode==='search')search(dt,p);
  else{ctx.drawImage(surface,0,0);ctx.fillStyle='#0005';ctx.fillRect(0,0,W,H);}
  vignette();
 }
 uiDwell(dt);const pc=pointerClient(),main=$('mainView').getBoundingClientRect();$('handCursor').hidden=!pointer.active||!$('welcome').hidden;$('handCursor').style.left=(pc.x-main.left)+'px';$('handCursor').style.top=(pc.y-main.top)+'px';
 const percent=Math.round(Math.min(1,uiHover?uiTime/1.25:dwell/1.8)*100);$('dwellPercent').textContent=percent+'%';$('dwellFill').style.width=percent+'%';
 frames++;if(frames%12===0)canvas.dataset.state=JSON.stringify(getState());requestAnimationFrame(draw);
}
function getState(){return {mode:journey.mode,chapter:journey.chapter,chapterName:chapters[journey.chapter].name,found:journey.found.map(a=>[...a]),total:journey.found.flat().length,totalClues,replayFinished,hover,dwell,pointer:{...pointer},viewX,artPan,artOverflow,artReady,frames,targets:chapters[journey.chapter].targets.map(t=>({id:t.id,x:t.x,y:t.y,r:t.r})),reward:{ready:reward.readyState,error:reward.error?.message||null,src:reward.getAttribute('src')}};}
window.portalGame={getState,reset};reset();requestAnimationFrame(draw);
