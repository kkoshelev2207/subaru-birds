(function(){'use strict';
const P=Phys,W=540,H=960,G=P.G,SX=P.SX,SY=P.SY,MAXP=P.MAXP,K=P.K,BONUS=10000;
const $=s=>document.querySelector(s),cv=$('#c'),ctx=cv.getContext('2d'),app=$('#app');
const KEY='subarubirds.v1';let save={stars:[],best:[],snd:true};
try{Object.assign(save,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){}
const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(save))}catch(e){}};
/* ---------- audio ---------- */
const Snd={c:null,t:null,
init(){if(this.c){if(this.c.state==='suspended')this.c.resume();return}try{const C=window.AudioContext||window.webkitAudioContext;this.c=new C();const b=this.c.createBuffer(1,this.c.sampleRate,this.c.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;this.nb=b}catch(e){}},
ok(){return this.c&&save.snd},
tone(f1,f2,d,type,v,t0){if(!this.ok())return;const c=this.c,t=c.currentTime+(t0||0),o=c.createOscillator(),g=c.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f1,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f2),t+d);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g).connect(c.destination);o.start(t);o.stop(t+d+.02)},
noise(d,v,f1,f2,type,t0){if(!this.ok())return;const c=this.c,t=c.currentTime+(t0||0),s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=this.nb;f.type=type||'lowpass';f.frequency.setValueAtTime(f1,t);f.frequency.exponentialRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);s.connect(f).connect(g).connect(c.destination);s.start(t);s.stop(t+d+.02)},
turboStart(){if(!this.ok()||this.t)return;const c=this.c,o=c.createOscillator(),g=c.createGain(),f=c.createBiquadFilter();o.type='sawtooth';f.type='bandpass';f.Q.value=6;f.frequency.value=900;g.gain.value=0;o.frequency.value=400;o.connect(f).connect(g).connect(c.destination);o.start();this.t={o,g,f}},
turboSet(p){if(!this.t)return;const n=this.c.currentTime;this.t.o.frequency.setTargetAtTime(400+p*1800,n,.05);this.t.f.frequency.setTargetAtTime(900+p*2500,n,.05);this.t.g.gain.setTargetAtTime(.03+p*.09,n,.05)},
turboStop(blow){if(!this.t)return;const t=this.t;this.t=null;try{t.g.gain.setTargetAtTime(0,this.c.currentTime,.03);t.o.stop(this.c.currentTime+.2)}catch(e){}if(blow)this.noise(.45,.2,6000,2500,'highpass')},
launch(){this.noise(.5,.3,500,4000,'bandpass');this.tone(140,50,.35,'sawtooth',.18)},
hit(m,v,car){const a=Math.min(.35,v*.03);if(m==='w'){this.noise(.14,a,1800,300,'lowpass');this.tone(180,90,.1,'triangle',a)}else if(m==='s'){this.noise(.16,a,1200,200,'lowpass');this.tone(110,60,.14,'square',a*.6)}else{this.tone(900,500,.25,'triangle',a*.9);this.tone(1350,800,.2,'sine',a*.5);this.noise(.05,a*.5,5000,2000,'highpass')}},
brk(m){this.noise(.35,.3,3000,200,'lowpass');this.tone(260,70,.25,'sawtooth',.1)},
crow(){this.tone(500,250,.18,'square',.08);this.tone(420,200,.2,'square',.07,.1)},
win(){[523,659,784,1047].forEach((f,i)=>this.tone(f,f,.22,'triangle',.18,i*.12))},
lose(){[392,330,262,196].forEach((f,i)=>this.tone(f,f*.97,.3,'sawtooth',.1,i*.17))}};
/* ---------- state ---------- */
const TH=[{a:'#6ec6ff',b:'#e4f6ff',g:'#58b947',g2:'#3b8a34',d:'#8a5a2b',h1:'#7fcf7a',h2:'#5eb866',sun:'#fff3a0',sx:420,sy:150},
{a:'#ff8a5c',b:'#ffd9a0',g:'#6aa84f',g2:'#4a7f3a',d:'#7a4a2a',h1:'#b86fa0',h2:'#8c4f86',sun:'#ffe28a',sx:380,sy:430},
{a:'#ffcf6b',b:'#fff0c8',g:'#e3b062',g2:'#c98f45',d:'#a8692f',h1:'#f0b868',h2:'#d9954e',sun:'#fff7cc',sx:150,sy:170},
{a:'#080c2a',b:'#2c3a80',g:'#2f5d4a',g2:'#1f3f35',d:'#3b2a22',h1:'#1d2a5c',h2:'#16204a',moon:1,sx:400,sy:160},
{a:'#a9cdea',b:'#f6fbff',g:'#f4f9ff',g2:'#cfe2f2',d:'#8aa0b4',h1:'#d9e8f5',h2:'#bcd3e8',sun:'#fffbe0',sx:140,sy:190,snow:1}];
let st='menu',lvIdx=0,shots=0,score=0,combo=0,comboT=0,car=null,lt=0,still=0,settleT=0,endT=0,shake=0,popT=0,tick=0,launched=false;
let pulling=false,pid=-1,pull={x:SX,y:SY},traj=[],parts=[],pops=[],paused=false,scale=1,q=2,bg=null,bgTh=0,spr=null,clouds=[],snow=[];
for(let i=0;i<4;i++)clouds.push({x:Math.random()*W,y:60+Math.random()*220,s:.6+Math.random()*.8});
for(let i=0;i<40;i++)snow.push({x:Math.random()*W,y:Math.random()*H,v:.6+Math.random()*1.2});
const face=new Image();face.onload=()=>{spr=carSprite()};face.src='assets/head.png';
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
/* ---------- sprites ---------- */
function carSprite(){const s=3,c=document.createElement('canvas');c.width=100*s;c.height=70*s;const x=c.getContext('2d');x.scale(s,s);x.translate(50,40);
x.lineJoin='round';const dk='#0a1a4d';
x.fillStyle='#10286e';x.fillRect(-33,-14,3,11);x.fillRect(29,-14,0,0);rr(x,-41,-18,18,4.5,2);x.fillStyle='#1d4ed8';x.fill();x.strokeStyle=dk;x.lineWidth=1.3;x.stroke();
const body=()=>{x.beginPath();x.moveTo(-35,10);x.lineTo(-35,-1);x.quadraticCurveTo(-35,-4,-31,-4);x.lineTo(-21,-5);x.lineTo(-14,-16);x.lineTo(12,-16);x.lineTo(25,-4);x.lineTo(33,-3);x.quadraticCurveTo(36,-2,36,2);x.lineTo(36,10);x.closePath()};
const fill=()=>{const g=x.createLinearGradient(0,-16,0,10);g.addColorStop(0,'#4a8dff');g.addColorStop(.5,'#1d4ed8');g.addColorStop(1,'#14358f');x.fillStyle=g;x.fill();x.strokeStyle=dk;x.lineWidth=1.8;x.stroke()};
body();fill();
x.fillStyle='#0b1330';x.beginPath();x.moveTo(-12,-14);x.lineTo(10,-14);x.lineTo(21,-5);x.lineTo(-18,-5);x.closePath();x.fill();
if(face.complete&&face.naturalWidth)x.drawImage(face,-10,-39,25,35);else{x.fillStyle='#e8b894';x.beginPath();x.arc(2,-20,12,0,6.3);x.fill()}
x.save();x.beginPath();x.rect(-40,-5,80,30);x.clip();body();fill();x.restore();
x.strokeStyle='rgba(255,255,255,.35)';x.lineWidth=1;x.beginPath();x.moveTo(-30,-1);x.lineTo(30,-1);x.stroke();
x.strokeStyle=dk;x.lineWidth=1.1;x.beginPath();x.moveTo(-3,-4);x.lineTo(-3,9);x.stroke();
x.fillStyle=dk;x.fillRect(17,-3.5,10,2.2);x.fillStyle='#f5c518';x.fillRect(-26,7,48,1.6);
x.fillStyle='#fff3a0';x.fillRect(32,0,4,3.5);x.fillStyle='#ff3b30';x.fillRect(-36,0,2,4);
for(const cx of [-21,22]){x.fillStyle='#111';x.beginPath();x.arc(cx,9,8.5,0,6.3);x.fill();x.fillStyle='#f2c230';x.beginPath();x.arc(cx,9,5.3,0,6.3);x.fill();
x.strokeStyle='#8a6a10';x.lineWidth=.9;for(let i=0;i<5;i++){const a=i*1.2566;x.beginPath();x.moveTo(cx,9);x.lineTo(cx+Math.cos(a)*5,9+Math.sin(a)*5);x.stroke()}x.fillStyle='#222';x.beginPath();x.arc(cx,9,1.5,0,6.3);x.fill()}
return c}
spr=carSprite();
function makeBg(){const th=TH[bgTh],c=document.createElement('canvas');c.width=cv.width;c.height=cv.height;const x=c.getContext('2d');x.scale(c.width/W,c.height/H);
let g=x.createLinearGradient(0,0,0,G);g.addColorStop(0,th.a);g.addColorStop(1,th.b);x.fillStyle=g;x.fillRect(0,0,W,H);
if(th.moon){x.fillStyle='#fff';for(let i=0;i<60;i++){x.globalAlpha=.4+Math.random()*.6;x.fillRect(Math.random()*W,Math.random()*560,1.6,1.6)}x.globalAlpha=1}
g=x.createRadialGradient(th.sx,th.sy,10,th.sx,th.sy,130);g.addColorStop(0,th.moon?'rgba(200,220,255,.5)':'rgba(255,240,170,.7)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(th.sx-140,th.sy-140,280,280);
x.fillStyle=th.moon?'#f4f1dd':th.sun;x.beginPath();x.arc(th.sx,th.sy,th.moon?34:42,0,6.3);x.fill();
const hills=(col,base,amp,f,ph)=>{x.fillStyle=col;x.beginPath();x.moveTo(0,G);for(let i=0;i<=W;i+=10)x.lineTo(i,base-Math.sin(i*f+ph)*amp-Math.sin(i*f*2.3+ph)*amp*.4);x.lineTo(W,G);x.fill()};
hills(th.h2,G-130,45,.011,1);hills(th.h1,G-70,35,.016,3);
for(const h of P.hills){x.fillStyle=th.d;x.fillRect(h.x-h.w/2,G-h.h,h.w,h.h);x.fillStyle=th.g;rr(x,h.x-h.w/2-4,G-h.h-4,h.w+8,16,6);x.fill();x.fillStyle=th.g2;x.fillRect(h.x-h.w/2,G-h.h+10,h.w,3)}
g=x.createLinearGradient(0,G,0,H);g.addColorStop(0,th.d);g.addColorStop(1,'#1a1008');x.fillStyle=g;x.fillRect(0,G,W,H-G);
x.fillStyle=th.g;x.fillRect(0,G-4,W,18);x.fillStyle=th.g2;x.fillRect(0,G+12,W,4);
for(let i=0;i<W;i+=14){x.fillStyle=th.g;x.beginPath();x.moveTo(i,G-4);x.lineTo(i+4,G-11);x.lineTo(i+8,G-4);x.fill()}
return x.canvas}
/* ---------- drawing ---------- */
function drawCar(px,py,a,s){ctx.save();ctx.translate(px,py);ctx.rotate(a);if(s!==1)ctx.scale(s,s);ctx.drawImage(spr,-50,-40,100,70);ctx.restore()}
function drawBlk(b){const p=b.plugin,w=p.w,h=p.h,m=p.m;ctx.save();ctx.translate(b.position.x,b.position.y);ctx.rotate(b.angle);
const C=m==='w'?['#e0a05c','#a8692f']:m==='s'?['#c0c6ce','#7d848e']:['#a3b6ca','#4b5c6f'];
rr(ctx,-w/2,-h/2,w,h,3);ctx.fillStyle=C[1];ctx.fill();ctx.fillStyle=C[0];ctx.fillRect(-w/2+2,-h/2+2,w-4,Math.max(2,(h-4)*.55));
ctx.strokeStyle='rgba(30,20,10,.7)';ctx.lineWidth=2;rr(ctx,-w/2,-h/2,w,h,3);ctx.stroke();ctx.strokeStyle='rgba(0,0,0,.2)';ctx.lineWidth=1;ctx.beginPath();
if(m==='w'){if(w>h){ctx.moveTo(-w/2+6,0);ctx.lineTo(w/2-6,0)}else{ctx.moveTo(0,-h/2+6);ctx.lineTo(0,h/2-6)}}
else if(m==='s'){if(w>h){ctx.moveTo(-w/6,-h/2);ctx.lineTo(-w/6,h/2);ctx.moveTo(w/4,-h/2);ctx.lineTo(w/4,h/2)}else{ctx.moveTo(-w/2,0);ctx.lineTo(w/2,0)}}
else{ctx.fillStyle='#e8eef5';for(const[ax,ay]of[[-1,-1],[1,-1],[-1,1],[1,1]]){const rx=ax*(w/2-4),ry=ay*(h/2-4);ctx.moveTo(rx+2,ry);ctx.arc(rx,ry,2,0,6.3)}ctx.fill();ctx.beginPath()}
ctx.stroke();const r=p.hp/p.max;if(r<.7){const n=r<.35?4:2,rn=i=>((b.id*9301+i*49297)%233280)/233280;ctx.strokeStyle='rgba(20,10,0,.75)';ctx.lineWidth=1.5;ctx.beginPath();
for(let i=0;i<n;i++){const x0=(rn(i)-.5)*w*.8,y0=(rn(i+9)-.5)*h*.8;ctx.moveTo(x0,y0);ctx.lineTo(x0+(rn(i+3)-.5)*14,y0+(rn(i+5)-.5)*14);ctx.lineTo(x0+(rn(i+7)-.5)*22,y0+(rn(i+11)-.5)*22)}ctx.stroke()}
ctx.restore()}
function drawCrow(b){const p=b.plugin,low=p.hp<p.max*.6;ctx.save();ctx.translate(b.position.x,b.position.y);ctx.rotate(b.angle);
ctx.fillStyle='#2b2f3a';ctx.beginPath();ctx.arc(0,0,17,0,6.3);ctx.fill();ctx.strokeStyle='#0d0f14';ctx.lineWidth=2;ctx.stroke();
ctx.fillStyle='#454c5e';ctx.beginPath();ctx.ellipse(0,8,11,7,0,0,6.3);ctx.fill();
ctx.fillStyle='#2b2f3a';ctx.beginPath();ctx.moveTo(-4,-16);ctx.lineTo(0,-26);ctx.lineTo(4,-15);ctx.fill();
ctx.fillStyle='#ff9a1f';ctx.beginPath();ctx.moveTo(-2,2);ctx.lineTo(12,6);ctx.lineTo(-2,10);ctx.closePath();ctx.fill();ctx.strokeStyle='#8a4a00';ctx.lineWidth=1.2;ctx.stroke();
if(low){ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();for(const ex of[-6,6]){ctx.moveTo(ex-3,-7);ctx.lineTo(ex+3,-1);ctx.moveTo(ex+3,-7);ctx.lineTo(ex-3,-1)}ctx.stroke()}
else{ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-6,-4,5,0,6.3);ctx.arc(6,-4,5,0,6.3);ctx.fill();ctx.fillStyle='#000';ctx.beginPath();ctx.arc(-4.5,-3.5,2.2,0,6.3);ctx.arc(7.5,-3.5,2.2,0,6.3);ctx.fill();
ctx.strokeStyle='#0d0f14';ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(-11,-12);ctx.lineTo(-2,-8);ctx.moveTo(11,-12);ctx.lineTo(2,-8);ctx.stroke()}
ctx.restore()}
function sling(front){ctx.lineCap='round';ctx.strokeStyle=front?'#7a4e26':'#4a2f14';ctx.lineWidth=15;ctx.beginPath();
if(!front){ctx.moveTo(SX,G);ctx.lineTo(SX,SY+48);ctx.lineTo(SX+18,SY-12)}else{ctx.moveTo(SX,SY+48);ctx.lineTo(SX-18,SY-12)}ctx.stroke()}
function band(tx,ty,cx,cy,w){ctx.strokeStyle='#2e1608';ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(cx,cy);ctx.stroke()}
function emit(t,x,y,n,c,sp){if(parts.length>(q>1?220:90))return;sp=sp||3;for(let i=0;i<n;i++){const a=Math.random()*6.28,v=Math.random()*sp;parts.push({t,x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-(t==='r'?2:0),l:0,ml:t==='s'?16:t==='r'?70:38,r:t==='r'?3+Math.random()*4:4+Math.random()*5,a:Math.random()*6,va:(Math.random()-.5)*.4,c})}}
function pop(x,y,txt){pops.push({x,y,txt,l:0})}
function render(){ctx.setTransform(scale,0,0,scale,0,0);if(!bg)bg=makeBg();ctx.drawImage(bg,0,0,W,H);
const th=TH[bgTh];ctx.fillStyle='rgba(255,255,255,.85)';for(const c of clouds){c.x+=.15*c.s;if(c.x>W+80)c.x=-80;if(th.moon)ctx.fillStyle='rgba(120,140,200,.35)';ctx.beginPath();ctx.arc(c.x,c.y,26*c.s,0,6.3);ctx.arc(c.x+28*c.s,c.y+6,20*c.s,0,6.3);ctx.arc(c.x-26*c.s,c.y+8,18*c.s,0,6.3);ctx.fill()}
if(th.snow&&q>1){ctx.fillStyle='#fff';for(const s of snow){s.y+=s.v;s.x+=Math.sin(s.y*.02)*.5;if(s.y>G)s.y=-5;ctx.fillRect(s.x,s.y,3,3)}}
if(st==='menu'){const b=Math.sin(tick*.05)*6;ctx.save();ctx.translate(0,b);drawCar(270,520,-.08,3);ctx.restore();return}
let sx=0,sy=0;if(shake>.3){sx=(Math.random()-.5)*shake;sy=(Math.random()-.5)*shake;shake*=.9}ctx.save();ctx.translate(sx,sy);
sling(false);
for(const b of P.bodies)b.plugin.k==='blk'?drawBlk(b):drawCrow(b);
const ready=st==='ready',dr=pulling;
if(ready||(st==='fly'&&false)){const cx=dr?pull.x:SX,cy=dr?pull.y:SY,a=dr?Math.max(-1.2,Math.min(1.2,Math.atan2(SY-pull.y,SX-pull.x))):0,sc=Math.min(1,popT/12);
ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(cx,G+4,40,7,0,0,6.3);ctx.fill();
const w=dr?9-Math.hypot(SX-cx,SY-cy)/MAXP*4:8;band(SX+18,SY-12,cx,cy,w);drawCar(cx,cy+(dr?0:Math.sin(tick*.1)*1.5),a,sc);band(SX-18,SY-12,cx,cy,w)}
else{ctx.strokeStyle='#2e1608';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(SX-18,SY-12);ctx.quadraticCurveTo(SX,SY+14,SX+18,SY-12);ctx.stroke()}
sling(true);
if(P.car){const c=P.car;drawCar(c.position.x,c.position.y,c.angle,1)}
if(pulling&&traj.length){for(let i=0;i<traj.length;i++){ctx.globalAlpha=1-i/traj.length*.75;ctx.fillStyle=i%2?'#fff':'#ffd23f';ctx.strokeStyle='rgba(0,0,0,.5)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(traj[i].x,traj[i].y,5.5-i*.05,0,6.3);ctx.fill();ctx.stroke()}ctx.globalAlpha=1}
for(const p of parts){const k=1-p.l/p.ml;ctx.globalAlpha=Math.max(0,k);
if(p.t==='d'||p.t==='k'){ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x,p.y,p.r*(1+(1-k)*1.5),0,6.3);ctx.fill()}
else if(p.t==='s'){ctx.strokeStyle=p.c;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-p.vx*2,p.y-p.vy*2);ctx.stroke()}
else{ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.a);ctx.fillStyle=p.c;ctx.fillRect(-p.r,-p.r/2,p.r*2,p.r);ctx.restore()}}ctx.globalAlpha=1;
ctx.font='900 30px system-ui,sans-serif';ctx.textAlign='center';ctx.lineWidth=6;ctx.strokeStyle='#2a1600';
for(const t of pops){ctx.globalAlpha=Math.max(0,1-t.l/60);ctx.strokeText(t.txt,t.x,t.y-t.l*.8);ctx.fillStyle='#ffd23f';ctx.fillText(t.txt,t.x,t.y-t.l*.8)}ctx.globalAlpha=1;
if(lvIdx===0&&!launched&&ready&&!pulling){ctx.font='800 26px system-ui,sans-serif';ctx.lineWidth=5;ctx.strokeText('Оттяни машину назад и отпусти',270,610);ctx.fillStyle='#fff';ctx.fillText('Оттяни машину назад и отпусти',270,610)}
ctx.restore()}
/* ---------- game logic ---------- */
const cbk={onHit(m,rv,x,y,isCar){if(rv<2.2)return;Snd.hit(m,rv,isCar);shake=Math.max(shake,Math.min(9,rv*.6));
if(m==='m'||m==='s')emit('s',x,y,Math.min(6,rv|0),'#ffe9a0',4);else emit('d',x,y,2,'rgba(220,200,170,.8)',1.5)},
onBreak(b){const p=b.plugin,x=b.position.x,y=b.position.y;
if(p.k==='tgt'){Snd.crow();emit('r',x,y,10,'#2b2f3a',5);emit('d',x,y,6,'rgba(255,255,255,.8)',3)}else{Snd.brk(p.m);const c=p.m==='w'?'#c98b4a':p.m==='s'?'#9aa0a8':'#7a8ca0';emit('r',x,y,14,c,5);emit('d',x,y,5,'rgba(200,185,160,.8)',2.5)}
if(p.off)return;combo=comboT>0?Math.min(5,combo+1):1;comboT=110;const pts=p.v*combo;score+=pts;pop(x,y-10,'+'+pts+(combo>1?' x'+combo:''));hud();
if(P.targets===0&&st!=='won'&&st!=='over'){st='won';endT=100}}};
function hud(){$('#hScore').textContent=score;$('#hShots').innerHTML='<i></i>'.repeat(Math.max(0,shots))}
function startLevel(i){lvIdx=i;const L=LEVELS[i];P.load(L,cbk);shots=L.s;score=0;combo=0;comboT=0;car=null;parts=[];pops=[];traj=[];pulling=false;shake=0;bgTh=L.th;bg=makeBg();st='ready';popT=0;paused=false;
['#menu','#lv','#modal'].forEach(s=>$(s).classList.add('hide'));$('#hud').classList.remove('hide');$('#hLvl').textContent='УРОВЕНЬ '+(i+1);hud()}
function launch(){const vx=(SX-pull.x)*K,vy=(SY-pull.y)*K,a=Math.max(-1.2,Math.min(1.2,Math.atan2(vy,vx)));
car=P.launch(pull.x,pull.y,a,vx,vy);shots--;st='fly';lt=0;still=0;launched=true;Snd.turboStop(true);Snd.launch();emit('d',SX,G,8,'rgba(220,200,170,.8)',3);shake=4;traj=[];hud()}
function endShot(){if(P.car){emit('k',P.car.position.x,Math.min(G-10,P.car.position.y),6,'rgba(90,90,90,.6)',2)}P.removeCar();st='settle';settleT=0}
function update(){if(paused)return;tick++;if(st==='menu')return;P.step();
if(comboT>0&&--comboT===0)combo=0;if(popT<12)popT++;
for(let i=parts.length-1;i>=0;i--){const p=parts[i];p.x+=p.vx;p.y+=p.vy;p.l++;if(p.t==='r'){p.vy+=.28;p.a+=p.va;if(p.y>G-2){p.y=G-2;p.vy*=-.4;p.vx*=.7}}else if(p.t==='s')p.vy+=.15;else{p.vy-=.02;p.vx*=.97}if(p.l>p.ml)parts.splice(i,1)}
for(let i=pops.length-1;i>=0;i--)if(++pops[i].l>60)pops.splice(i,1);
if(st==='fly'&&P.car){const c=P.car;lt++;if(lt%3===0)emit('k',c.position.x-30*Math.cos(c.angle),c.position.y-30*Math.sin(c.angle),1,'rgba(235,235,235,.7)',.6);
if(c.position.y>G-30&&c.speed>2&&lt%4===0)emit('d',c.position.x-20,G,1,'rgba(220,200,170,.8)',1.5);
if(lt>40&&c.speed<.4)still++;else still=0;
if(c.position.x>W+150||c.position.x<-150||c.position.y>H+150||lt>900||still>50)endShot()}
else if(st==='settle'){if(++settleT>40&&(P.calm()||settleT>220)){if(P.targets===0){st='won';endT=60}else if(shots<=0)finish(false);else{st='ready';popT=0}}}
else if(st==='won'){if(--endT<=0)finish(true)}}
function finish(win){st='over';Snd.turboStop();const L=LEVELS[lvIdx];$('#hud').classList.add('hide');
const m=$('#modal');m.classList.remove('hide');const btns=$('#mBtns');let html='';
if(win){const base=score,bonus=shots*BONUS;score+=bonus;let s=1+(shots>=1?1:0)+(base>=P.max*.55?1:0);
const rec=score>(save.best[lvIdx]||0);if(rec)save.best[lvIdx]=score;save.stars[lvIdx]=Math.max(save.stars[lvIdx]||0,s);persist();Snd.win();
$('#mT').textContent='УРОВЕНЬ ПРОЙДЕН!';$('#mS').innerHTML=[1,2,3].map(n=>'<span class="st'+(n<=s?' on':'')+'"></span>').join('');
$('#mP').textContent=score;$('#mB').textContent=(rec?'НОВЫЙ РЕКОРД! ':'Рекорд: '+save.best[lvIdx]+' · ')+(bonus?'бонус за запуски +'+bonus:'');
if(lvIdx<LEVELS.length-1)html+='<button class="btn" data-a="next">ДАЛЬШЕ</button>';else $('#mB').textContent+=' Все уровни пройдены!'}
else{Snd.lose();$('#mT').textContent='НЕ ПОЛУЧИЛОСЬ';$('#mS').innerHTML='';$('#mP').textContent=score;$('#mB').textContent='Попытки закончились. Рекорд: '+(save.best[lvIdx]||0)}
html+='<button class="btn alt" data-a="retry">ЕЩЁ РАЗ</button><button class="btn alt" data-a="lv">УРОВНИ</button>';btns.innerHTML=html}
function pauseModal(){paused=true;st=st;$('#modal').classList.remove('hide');$('#mT').textContent='ПАУЗА';$('#mS').innerHTML='';$('#mP').textContent=score;$('#mB').textContent='Рекорд: '+(save.best[lvIdx]||0);
$('#mBtns').innerHTML='<button class="btn" data-a="resume">ПРОДОЛЖИТЬ</button><button class="btn alt" data-a="retry">ЗАНОВО</button><button class="btn alt" data-a="lv">УРОВНИ</button>'}
$('#mBtns').addEventListener('click',e=>{const a=e.target.dataset.a;if(!a)return;Snd.init();
if(a==='resume'){paused=false;$('#modal').classList.add('hide')}else if(a==='retry')startLevel(lvIdx);else if(a==='next')startLevel(lvIdx+1);else if(a==='lv')showLevels()});
function showLevels(){st='menu';paused=false;Snd.turboStop();['#menu','#modal','#hud'].forEach(s=>$(s).classList.add('hide'));$('#lv').classList.remove('hide');
$('#grid').innerHTML=LEVELS.map((L,i)=>{const lk=i>0&&!(save.stars[i-1]>0),n=save.stars[i]||0;return'<button class="lc'+(lk?' lk':'')+'" data-i="'+i+'">'+(i+1)+'<span class="stars" style="min-height:0;gap:3px">'+[1,2,3].map(k=>'<span class="st'+(k<=n?' on':'')+'" style="width:26px;height:26px"></span>').join('')+'</span></button>'}).join('')}
$('#grid').addEventListener('click',e=>{const b=e.target.closest('.lc');if(!b||b.classList.contains('lk'))return;Snd.init();startLevel(+b.dataset.i)});
$('#bPlay').onclick=()=>{Snd.init();let n=0;while(n<LEVELS.length-1&&save.stars[n]>0)n++;showLevels()};
$('#bBack').onclick=()=>{$('#lv').classList.add('hide');$('#menu').classList.remove('hide')};
const sndBtn=()=>$('#bSnd').textContent='ЗВУК: '+(save.snd?'ВКЛ':'ВЫКЛ');sndBtn();
$('#bSnd').onclick=()=>{Snd.init();save.snd=!save.snd;if(!save.snd)Snd.turboStop();persist();sndBtn();Snd.tone(600,800,.1,'triangle',.15)};
$('#bPause').onclick=()=>{if(st==='over'||paused)return;Snd.init();pauseModal()};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&!paused&&['ready','fly','settle'].includes(st)){pulling=false;Snd.turboStop();pauseModal()}});
/* ---------- input ---------- */
function pt(e){const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*W,y:(e.clientY-r.top)/r.height*H}}
function setPull(p){let dx=p.x-SX,dy=p.y-SY,d=Math.hypot(dx,dy);if(d>MAXP){dx*=MAXP/d;dy*=MAXP/d}pull.x=SX+dx;pull.y=Math.min(G-24,SY+dy);
const vx=(SX-pull.x)*K,vy=(SY-pull.y)*K;traj=P.predict(vx,vy,pull.x,pull.y);Snd.turboSet(Math.min(1,Math.hypot(dx,dy)/MAXP))}
cv.addEventListener('pointerdown',e=>{Snd.init();e.preventDefault();if(st!=='ready'||paused||pulling)return;const p=pt(e);
if(Math.hypot(p.x-SX,p.y-SY)<110&&p.y<G){pulling=true;pid=e.pointerId;try{cv.setPointerCapture(pid)}catch(_){}Snd.turboStart();pull.x=SX;pull.y=SY;setPull(p)}});
cv.addEventListener('pointermove',e=>{if(!pulling||e.pointerId!==pid)return;e.preventDefault();setPull(pt(e))});
const up=e=>{if(!pulling||e.pointerId!==pid)return;pulling=false;if(e.type==='pointercancel'||Math.hypot(SX-pull.x,SY-pull.y)<22){Snd.turboStop(false);traj=[]}else launch()};
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
document.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});document.addEventListener('gesturestart',e=>e.preventDefault());document.addEventListener('contextmenu',e=>e.preventDefault());
/* ---------- resize / loop ---------- */
function resize(){const w=Math.min(innerWidth,innerHeight*9/16),h=w*16/9;app.style.width=w+'px';app.style.height=h+'px';app.style.setProperty('--u',w/W+'px');
const d=Math.min(window.devicePixelRatio||1,q);cv.width=Math.round(w*d);cv.height=Math.round(h*d);scale=cv.width/W;bg=null}
addEventListener('resize',resize);addEventListener('orientationchange',()=>setTimeout(resize,150));resize();
let last=performance.now(),acc=0,ft=0,fc=0;
function frame(t){const dt=Math.min(100,t-last);last=t;acc+=dt;let n=0;while(acc>=16.667&&n<3){update();acc-=16.667;n++}if(n===3)acc=0;render();
ft+=dt;if(++fc===90){if(ft/fc>24&&q>1){q=1;resize()}ft=0;fc=0}requestAnimationFrame(frame)}
function boot(){P.ready=true;requestAnimationFrame(frame)}
function load(src,ok,bad){const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=bad;document.head.appendChild(s)}
function fail(){const e=$('#err');e.classList.remove('hide');e.firstElementChild.innerHTML='<h2>Нет физики</h2><div>Не удалось загрузить Matter.js.<br>Положите matter.min.js в папку assets/ или подключитесь к интернету.</div>'}
if(window.Matter)boot();else load('assets/matter.min.js',boot,()=>load('https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js',boot,fail));
if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
