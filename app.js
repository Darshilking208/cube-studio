let THREE,OrbitControls;

const COLORS={U:0xf7f7f3,D:0xf2cf36,F:0x45a86a,B:0x448bd1,R:0xe64f45,L:0xff8a3d};
const LABELS={U:'UP',D:'DOWN',F:'FRONT',B:'BACK',R:'RIGHT',L:'LEFT'};
const NORMALS={U:new THREE.Vector3(0,1,0),D:new THREE.Vector3(0,-1,0),F:new THREE.Vector3(0,0,1),B:new THREE.Vector3(0,0,-1),R:new THREE.Vector3(1,0,0),L:new THREE.Vector3(-1,0,0)};
const FACE_KEYS=['U','D','L','R','F','B'];
const mount=document.querySelector('#cubeMount'),loading=document.querySelector('#loading');
let scene,camera,renderer,controls,pieces=[],animating=false,moveTotal=0,history=[],future=[],startedAt=Date.now(),timerRunning=false,customColors={...COLORS},turnQueue=Promise.resolve();
const moveCount=document.querySelector('#moveCount'),statusText=document.querySelector('#statusText'),toastEl=document.querySelector('#toast');
const colorCss=n=>'#'+Number(n).toString(16).padStart(6,'0').toUpperCase();
function toast(message){toastEl.textContent=message;toastEl.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>toastEl.classList.remove('show'),2100)}
function updateTimer(){if(!timerRunning)return;const s=Math.floor((Date.now()-startedAt)/1000),m=String(Math.floor(s/60)).padStart(2,'0'),r=String(s%60).padStart(2,'0');document.querySelector('#timer').textContent=`${m}:${r}`}
function setStatus(){const n=pieces.filter(p=>{if(p.position.distanceTo(p.userData.home)>.12)return true;const q=p.quaternion,identity=new THREE.Quaternion();return q.angleTo(identity)>.12}).length;statusText.textContent=n===0?'Cube is solved. Your move.':`${n} piece${n===1?'':'s'} moved from home.`}
function makeCube(){
  scene=new THREE.Scene();scene.background=new THREE.Color('#191d1f');
  camera=new THREE.PerspectiveCamera(36,mount.clientWidth/mount.clientHeight,.1,100);camera.position.set(6.3,5.2,7.5);
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(mount.clientWidth,mount.clientHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;mount.appendChild(renderer.domElement);
  controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.08;controls.minDistance=5.2;controls.maxDistance=12;controls.target.set(0,0,0);controls.update();
  scene.add(new THREE.AmbientLight(0xffffff,1.45));const key=new THREE.DirectionalLight(0xffffff,3.2);key.position.set(4,7,6);scene.add(key);const fill=new THREE.DirectionalLight(0xc5ddff,1.3);fill.position.set(-5,2,-4);scene.add(fill);const rim=new THREE.DirectionalLight(0xc3f36b,.7);rim.position.set(0,-4,3);scene.add(rim);
  const boxGeo=new THREE.BoxGeometry(.96,.96,.96);
  for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++){
    if(!x&&!y&&!z)continue;
    const pos=new THREE.Vector3(x,y,z),mats=[];
    // Box material order is +x, -x, +y, -y, +z, -z.
    const keys=['R','L','U','D','F','B'];
    for(const face of keys){const normal=NORMALS[face],isSticker=Math.round(pos.dot(normal))===1;const hex=isSticker?customColors[face]:0x15191a;mats.push(new THREE.MeshStandardMaterial({color:hex,roughness:.29,metalness:.035}));}
    const mesh=new THREE.Mesh(boxGeo,mats);mesh.position.copy(pos);mesh.userData={home:pos.clone(),stickers:keys.map((k,i)=>Math.round(pos.dot(NORMALS[k]))===1?k:null)};
    const edges=new THREE.LineSegments(new THREE.EdgesGeometry(boxGeo),new THREE.LineBasicMaterial({color:0x0c0e0f,transparent:true,opacity:.8}));mesh.add(edges);scene.add(mesh);pieces.push(mesh);
  }
  const floor=new THREE.Mesh(new THREE.CircleGeometry(3.15,64),new THREE.MeshBasicMaterial({color:0x202522,transparent:true,opacity:.56}));floor.rotation.x=-Math.PI/2;floor.position.y=-1.57;scene.add(floor);
  const resize=()=>{const w=mount.clientWidth,h=mount.clientHeight;if(!w||!h)return;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h)};new ResizeObserver(resize).observe(mount);
  renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera)});loading.style.display='none';
}
function animateTurn(face,dir){animating=true;return new Promise(resolve=>{const normal=NORMALS[face].clone();scene.updateMatrixWorld(true);const layer=pieces.filter(p=>Math.round(p.position.dot(normal))===1);const pivot=new THREE.Group();scene.add(pivot);for(const p of layer)pivot.attach(p);const total=dir*Math.PI/2,start=performance.now(),duration=175;function frame(now){const t=Math.min(1,(now-start)/duration);pivot.quaternion.setFromAxisAngle(normal,total*t);if(t<1){requestAnimationFrame(frame);return}pivot.updateMatrixWorld(true);for(const p of layer){scene.attach(p);p.position.set(Math.round(p.position.x),Math.round(p.position.y),Math.round(p.position.z));p.quaternion.setFromRotationMatrix(new THREE.Matrix4().extractRotation(p.matrix)).normalize()}scene.remove(pivot);animating=false;resolve()}requestAnimationFrame(frame)})}
function doMove(face,dir,record=true){turnQueue=turnQueue.then(async()=>{if(!timerRunning){timerRunning=true;startedAt=Date.now();setInterval(updateTimer,250)}if(record){history.push({face,dir});if(history.length>300)history.shift();future=[]}moveTotal++;moveCount.textContent=moveTotal;await animateTurn(face,dir);setStatus()});return turnQueue}
function randomize(n=24){let seq=[],last='';for(let i=0;i<n;i++){let f=FACE_KEYS[Math.floor(Math.random()*6)];while(f===last)f=FACE_KEYS[Math.floor(Math.random()*6)];last=f;seq.push({face:f,dir:Math.random()<.5?1:-1})}for(const m of seq)doMove(m.face,m.dir,true);toast('Scramble on. You’ve got this.')}
function createControls(){const grid=document.querySelector('#faceControls');for(const f of FACE_KEYS){const b=document.createElement('button');b.className='face-btn';b.innerHTML=`<b>${f}</b><small>${LABELS[f]}</small>`;b.title=`Turn ${LABELS[f]} face (hold Shift for reverse)`;b.onclick=e=>doMove(f,e.shiftKey?-1:1);grid.append(b)}
 const picker=document.querySelector('#colorFacePicker');const positions={U:[0,1],L:[1,0],F:[1,1],R:[1,2],B:[1,3],D:[2,1]};for(let y=0;y<3;y++)for(let x=0;x<4;x++){const f=Object.keys(positions).find(k=>positions[k][0]===y&&positions[k][1]===x);const c=document.createElement('button');c.className='picker-cell'+(f?' center':' blank');if(f){c.textContent=f;c.dataset.face=f;c.onclick=()=>selectColorFace(f)}picker.append(c)}
 const sw=document.querySelector('#swatches');for(const f of FACE_KEYS){const s=document.createElement('button');s.className='swatch';s.style.background=colorCss(COLORS[f]);s.title=LABELS[f];s.onclick=()=>{document.querySelector('#colorPicker').value=colorCss(COLORS[f]);document.querySelector('#colorHex').textContent=colorCss(COLORS[f])};sw.append(s)}selectColorFace('U')}
let selectedFace='U';function selectColorFace(f){selectedFace=f;document.querySelectorAll('.picker-cell.center').forEach(c=>c.style.borderColor=c.dataset.face===f?'var(--lime)':'#353b3a');document.querySelector('#colorPicker').value=colorCss(customColors[f]);document.querySelector('#colorHex').textContent=colorCss(customColors[f])}
function repaint(){for(const p of pieces)for(let i=0;i<p.userData.stickers.length;i++){const f=p.userData.stickers[i];if(f)p.material[i].color.setHex(customColors[f])}}
function resetCube(){turnQueue=turnQueue.then(()=>{for(const p of pieces){scene.attach(p);p.position.copy(p.userData.home);p.quaternion.identity()}moveTotal=0;moveCount.textContent='0';history=[];future=[];timerRunning=false;startedAt=Date.now();document.querySelector('#timer').textContent='00:00';setStatus();toast('Back to a fresh, solved cube.')})}
document.querySelector('#scrambleBtn').onclick=()=>randomize();document.querySelector('#solveBtn').onclick=resetCube;
document.querySelector('#undoBtn').onclick=()=>{const m=history.pop();if(!m)return toast('Nothing to undo yet.');future.push(m);turnQueue=turnQueue.then(async()=>{moveTotal=Math.max(0,moveTotal-1);moveCount.textContent=moveTotal;await animateTurn(m.face,-m.dir);setStatus()})};
document.querySelector('#redoBtn').onclick=()=>{const m=future.pop();if(!m)return toast('Nothing to redo yet.');turnQueue=turnQueue.then(async()=>{moveTotal++;moveCount.textContent=moveTotal;await animateTurn(m.face,m.dir);history.push(m);setStatus()})};
document.querySelector('#viewReset').onclick=()=>{if(!camera)return;camera.position.set(6.3,5.2,7.5);controls.target.set(0,0,0);controls.update()};document.querySelector('#zoomIn').onclick=()=>{camera.position.multiplyScalar(.88);controls.update()};document.querySelector('#zoomOut').onclick=()=>{camera.position.multiplyScalar(1.12);controls.update()};
document.querySelector('#colorPicker').oninput=e=>document.querySelector('#colorHex').textContent=e.target.value.toUpperCase();document.querySelector('#applyColor').onclick=()=>{customColors[selectedFace]=parseInt(document.querySelector('#colorPicker').value.slice(1),16);repaint();toast(`${LABELS[selectedFace]} center color updated.`)};
window.addEventListener('keydown',e=>{if(e.target.matches('input'))return;const f=e.key.toUpperCase();if(FACE_KEYS.includes(f)){e.preventDefault();doMove(f,e.shiftKey?-1:1)}});
// Starter theme and optional color edits are applied to each piece's fixed local sticker face.
Promise.all([import('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js'),import('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js')]).then(([three,controls])=>{THREE=three;OrbitControls=controls.OrbitControls;makeCube();createControls()}).catch(err=>{console.error(err);loading.textContent='Could not load 3D modules. Check your internet connection and reload.'});

