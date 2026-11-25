(function(){
const G=860,H=(x,m,t,l)=>({x,m,t,l:l||0});
const LEVELS=[
{s:3,th:0,h:[H(430,'w',1)]},
{s:3,th:0,h:[H(390,'w',1),H(485,'w',2)]},
{s:3,th:0,h:[H(440,'ww',3)]},
{s:4,th:1,h:[H(380,'s',1),H(485,'ww',3)]},
{s:4,th:1,h:[H(440,'wsw',2)],b:[[350,'w',3]]},
{s:4,th:1,hill:[[430,140,80]],h:[H(430,'ws',3,80)]},
{s:4,th:2,h:[H(335,'s',1),H(425,'ww',1),H(485,'ws',2)]},
{s:4,th:2,h:[H(400,'m',1),H(485,'ww',3)]},
{s:5,th:2,h:[H(330,'ws',1),H(440,'wsm',3)]},
{s:4,th:3,hill:[[440,150,120]],h:[H(440,'ws',3,120)],b:[[330,'m',2]]},
{s:5,th:3,h:[H(340,'mw',1),H(450,'sws',3)]},
{s:5,th:3,h:[H(330,'ww',1),H(430,'msm',2)],b:[[515,'s',2]]},
{s:5,th:4,hill:[[330,120,70],[470,120,130]],h:[H(330,'ws',1,70),H(470,'ms',3,130)]},
{s:5,th:4,h:[H(320,'sm',1),H(425,'wsw',3)],b:[[515,'m',2]]},
{s:6,th:4,hill:[[460,160,100]],h:[H(320,'msm',1),H(460,'mswm',3,100)],b:[[385,'s',3]]}
];
function specs(L){const o=[];
(L.hill||[]).forEach(([x,w,h])=>o.push({k:'hill',x,w,h}));
L.h.forEach(u=>{let base=G-u.l;
[...u.m].forEach(c=>{o.push({k:'blk',x:u.x-38,y:base-32,w:16,h:64,m:c});o.push({k:'blk',x:u.x+38,y:base-32,w:16,h:64,m:c});
o.push({k:'blk',x:u.x,y:base-72,w:110,h:16,m:c});base-=81;});
if(u.t&1)o.push({k:'tgt',x:u.x,y:G-u.l-20});
if(u.t&2)o.push({k:'tgt',x:u.x,y:base-19});});
(L.b||[]).forEach(([x,m,n])=>{for(let i=0;i<n;i++)o.push({k:'blk',x,y:G-18-i*37,w:36,h:36,m});});
return o;}
window.LEVELS=LEVELS;window.LV={specs};
})();
