(function(){
const G=860,SX=110,SY=690,MAXP=105,K=0.125,A=0.001*(1000/60)*(1000/60);
const MAT={w:{hp:70,d:.0022,fr:.6,re:.12,v:500},s:{hp:240,d:.004,fr:.8,re:.06,v:1000},m:{hp:480,d:.0065,fr:.45,re:.25,v:2000}};
const P={G,SX,SY,MAXP,K,A,MAT,hills:[],bodies:[],targets:0,max:0,car:null};
let M,eng,world,cb,rm=[],solid=[],warm=0;
function dmg(b,d){const p=b.plugin;if(!p||p.hp===undefined||p.dead)return;p.hp-=d;if(p.hp<=0){p.dead=true;rm.push(b);}}
P.load=(L,callbacks)=>{M=window.Matter;cb=callbacks;
eng=M.Engine.create({enableSleeping:true});eng.positionIterations=10;eng.velocityIterations=8;world=eng.world;
rm=[];solid=[];P.hills=[];P.bodies=[];P.targets=0;P.max=0;P.car=null;warm=80;
const gr=M.Bodies.rectangle(270,G+80,3000,160,{isStatic:true,friction:.9,label:'ground'});M.World.add(world,gr);
for(const s of LV.specs(L)){let b;
if(s.k==='hill'){b=M.Bodies.rectangle(s.x,G-s.h/2,s.w,s.h,{isStatic:true,friction:.9,label:'hill'});P.hills.push(s);solid.push(b);}
else if(s.k==='blk'){const m=MAT[s.m];b=M.Bodies.rectangle(s.x,s.y,s.w,s.h,{density:m.d,friction:m.fr,restitution:m.re,frictionStatic:.8,label:'blk'});
Object.assign(b.plugin,{k:'blk',m:s.m,hp:m.hp,max:m.hp,w:s.w,h:s.h,v:m.v});P.max+=m.v;P.bodies.push(b);solid.push(b);}
else{b=M.Bodies.circle(s.x,s.y,17,{density:.0012,friction:.5,restitution:.2,label:'tgt'});
Object.assign(b.plugin,{k:'tgt',m:'w',hp:26,max:26,v:5000});P.max+=5000;P.targets++;P.bodies.push(b);solid.push(b);}
M.World.add(world,b);}
M.Events.on(eng,'collisionStart',ev=>{if(warm>0)return;
for(const p of ev.pairs){const a=p.bodyA,b=p.bodyB;
const rv=Math.hypot(a.velocity.x-b.velocity.x,a.velocity.y-b.velocity.y);if(rv<1.6)continue;
const mr=a.isStatic?b.mass:b.isStatic?a.mass:a.mass*b.mass/(a.mass+b.mass);const d=rv*mr*3.2;
const c=(p.collision.supports&&p.collision.supports[0])||a.position;
const mat=(a.plugin&&a.plugin.m)||(b.plugin&&b.plugin.m)||'s';
cb.onHit(mat,rv,c.x,c.y,a.label==='car'||b.label==='car');dmg(a,d);dmg(b,d);}});};
P.step=()=>{M.Engine.update(eng,1000/60);if(warm>0)warm--;
for(const b of P.bodies){if(!b.plugin.dead&&(b.position.y>1250||b.position.x>900||b.position.x<-300)){b.plugin.dead=true;b.plugin.off=true;rm.push(b);}}
for(const b of rm){M.World.remove(world,b);const i=P.bodies.indexOf(b);if(i>=0)P.bodies.splice(i,1);const j=solid.indexOf(b);if(j>=0)solid.splice(j,1);
if(b.plugin.k==='tgt')P.targets--;cb.onBreak(b);}
rm.length=0;};
P.launch=(x,y,ang,vx,vy)=>{const c=M.Bodies.rectangle(x,y,70,32,{density:.004,friction:.5,restitution:.25,frictionAir:0,chamfer:{radius:8},angle:ang,label:'car'});
M.World.add(world,c);M.Body.setVelocity(c,{x:vx,y:vy});P.car=c;return c;};
P.removeCar=()=>{if(P.car){M.World.remove(world,P.car);P.car=null;}};
P.predict=(vx,vy,x,y)=>{const pts=[];for(let i=0;i<160;i++){vy+=A;x+=vx;y+=vy;if(y>G-6)break;
if(i%3===0)pts.push({x,y});if(M.Query.point(solid,{x,y}).length)break;}return pts;};
P.calm=()=>P.bodies.every(b=>b.speed<.5&&Math.abs(b.angularVelocity)<.03);
window.Phys=P;})();
