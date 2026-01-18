const BASE_UNITS=[{symbol:"kg",name:"kilogram"},{symbol:"m",name:"metre"},{symbol:"s",name:"second"},{symbol:"A",name:"ampere"},{symbol:"K",name:"kelvin"},{symbol:"mol",name:"mole"},{symbol:"cd",name:"candela"}]
const DERIVED_UNITS=[
{symbol:"ρ",name:"density",desc:"Density",hint:"density = mass ÷ volume",hintTex:"\\rho = \\dfrac{m}{V}",termDims:{m:{kg:1},V:{m:3}},dims:{kg:1,m:-3}},
{symbol:"m³",name:"volume",desc:"Volume",hint:"volume = length × length × length",hintTex:"V = l^3",dims:{m:3}},
{symbol:"m²",name:"area",desc:"Area",hint:"area = length × length",hintTex:"A = l^2",dims:{m:2}},
{symbol:"v",name:"velocity",desc:"Velocity",hint:"velocity = distance ÷ time",hintTex:"v = \\dfrac{d}{t}",termDims:{d:{m:1},t:{s:1}},dims:{m:1,s:-1}},
{symbol:"a",name:"acceleration",desc:"Acceleration",hint:"acceleration = velocity ÷ time",hintTex:"a = \\dfrac{\\Delta v}{\\Delta t}",termDims:{v:{m:1,s:-1},t:{s:1}},dims:{m:1,s:-2}},
{symbol:"p",name:"momentum",desc:"Momentum",hint:"momentum = mass × velocity",hintTex:"p = m\\,v",termDims:{m:{kg:1},v:{m:1,s:-1}},dims:{kg:1,m:1,s:-1}},
{symbol:"τ",name:"torque",desc:"Torque",hint:"torque = force × radius",hintTex:"\\tau = F\\,r",termDims:{F:{kg:1,m:1,s:-2},r:{m:1}},dims:{kg:1,m:2,s:-2}},
{symbol:"L",name:"angular momentum",desc:"Angular Momentum",hint:"angular momentum = mass × radius × velocity",hintTex:"L = m\\,r\\,v",termDims:{m:{kg:1},r:{m:1},v:{m:1,s:-1}},dims:{kg:1,m:2,s:-1}},
{symbol:"N",si:"N",name:"newton",desc:"Force",hint:"force = mass × acceleration",hintTex:"F = m\\,a",termDims:{m:{kg:1},a:{m:1,s:-2}},dims:{kg:1,m:1,s:-2}},
{symbol:"Pa",si:"Pa",name:"pascal",desc:"Pressure",hint:"pressure = force ÷ area",hintTex:"p = \\dfrac{F}{A}",termDims:{F:{kg:1,m:1,s:-2},A:{m:2}},dims:{kg:1,m:-1,s:-2}},
{symbol:"J",si:"J",name:"joule",desc:"Energy",hint:"energy = force × distance",hintTex:"E = F\\,d",termDims:{F:{kg:1,m:1,s:-2},d:{m:1}},dims:{kg:1,m:2,s:-2}},
{symbol:"W",si:"W",name:"watt",desc:"Power",hint:"power = energy ÷ time",hintTex:"P = \\dfrac{E}{t}",termDims:{E:{kg:1,m:2,s:-2},t:{s:1}},dims:{kg:1,m:2,s:-3}},
{symbol:"C",si:"C",name:"coulomb",desc:"Electric charge",hint:"charge = current × time",dims:{A:1,s:1}},
{symbol:"V",si:"V",name:"volt",desc:"Electric potential",hint:"voltage = power ÷ current",dims:{kg:1,m:2,s:-3,A:-1}},
{symbol:"Ω",si:"Ω",name:"ohm",desc:"Electric resistance",hint:"resistance = voltage ÷ current",dims:{kg:1,m:2,s:-3,A:-2}},
{symbol:"Hz",si:"Hz",name:"hertz",desc:"Frequency",hint:"frequency = cycles ÷ time",dims:{s:-1}}
]
const palette=document.getElementById("palette")
const canvas=document.getElementById("canvas")
const numerator=document.getElementById("numerator")
const denominator=document.getElementById("denominator")
const targetFormula=document.getElementById("target-formula")
const conceptHint=document.getElementById("concept-hint")
const termHints=document.getElementById("term-hints")
const quantityName=document.getElementById("quantity-name")
const currentFormula=document.getElementById("current-formula")
const result=document.getElementById("result")
const resetBtn=document.getElementById("reset")
const clearBtn=document.getElementById("clear-canvas")
const checkBtn=document.getElementById("check")
const nextBtn=document.getElementById("next")
const prevBtn=document.getElementById("prev")
const showTermsBtn=document.getElementById("show-terms")
let target=null
let tokens=[]
let tokenSeq=0
let quizIndex=0
const QUIZ_ORDER=["ρ","m³","m²","v","a","p","τ","L","N","Pa","J","W"]
const QUIZ=QUIZ_ORDER.map(sym=>DERIVED_UNITS.find(u=>u.symbol===sym)).filter(Boolean)
const TERM_NAMES={m:"mass",V:"volume",A:"area",d:"distance",t:"time",v:"velocity",a:"acceleration",F:"force",E:"energy",r:"radius",p:"momentum",L:"angular momentum",τ:"torque"}
function initPalette(){BASE_UNITS.forEach(u=>{const el=document.createElement("div");el.className="palette-item";const t=document.createElement("div");t.className="token";t.draggable=true;t.dataset.symbol=u.symbol;const sym=document.createElement("span");sym.className="sym";sym.textContent=u.symbol;const name=document.createElement("span");name.className="name";name.textContent=u.name;t.appendChild(sym);t.appendChild(name);el.appendChild(t);palette.appendChild(el);t.addEventListener("dragstart",e=>{e.dataTransfer.setData("text/plain","base:"+u.symbol)})});palette.addEventListener("dragover",e=>{e.preventDefault()});palette.addEventListener("drop",e=>{e.preventDefault();const data=e.dataTransfer.getData("text/plain");if(data.startsWith("token:")){const id=data.slice(6);const idx=tokens.findIndex(t=>t.id===id);if(idx>=0){tokens[idx].el.remove();tokens.splice(idx,1);updateCurrent()}}})}
function dimsToTeX(d){const order=["kg","m","s","A","K","mol","cd"];const parts=[];order.forEach(k=>{const v=d[k]||0;if(v===0)return;if(v===1){parts.push("\\mathrm{"+k+"}")}else{parts.push("\\mathrm{"+k+"}^{"+v+"}")}});return parts.length?parts.join("\\, "):"1"}
function renderMath(el,tex){el.innerHTML="$"+tex+"$";if(window.MathJax&&MathJax.typesetPromise){MathJax.typesetPromise([el])}}
function toSup(n){const m={"-":"⁻","0":"⁰","1":"¹","2":"²","3":"³","4":"⁴","5":"⁵","6":"⁶","7":"⁷","8":"⁸","9":"⁹"};return String(n).split("").map(c=>m[c]||c).join("")}
function sumDims(){const d={};tokens.forEach(t=>{const val=t.side==="num"?1:-1;d[t.symbol]=(d[t.symbol]||0)+val});return d}
function updateSeparators(row){Array.from(row.querySelectorAll(":scope > .sep")).forEach(el=>el.remove());const toks=Array.from(row.querySelectorAll(":scope > .token"));for(let i=0;i<toks.length-1;i++){const sep=document.createElement("span");sep.className="sep";sep.textContent="×";row.insertBefore(sep,toks[i+1])}}
function updateCurrent(){renderMath(currentFormula,dimsToTeX(sumDims()));updateSeparators(numerator);updateSeparators(denominator)}
function renderTermHints(u){
  if(!u.termDims){termHints.classList.add("hidden");termHints.innerHTML="";return}
  termHints.innerHTML=""
  Object.entries(u.termDims).forEach(([k,v])=>{
    const nm=TERM_NAMES[k]||k
    const box=document.createElement("div")
    box.className="term-box"
    renderMath(box,"\\text{"+nm+" ("+k+"): } "+dimsToTeX(v))
    termHints.appendChild(box)
  })
  termHints.classList.add("hidden")
}
function setTarget(u){target=u;quantityName.textContent=u.desc||u.name;renderMath(targetFormula,"\\text{Base: } "+dimsToTeX(u.dims));conceptHint.innerHTML=u.hintTex?("$"+u.hintTex+"$"):u.hint||"";renderTermHints(u);if(window.MathJax&&MathJax.typesetPromise&&u.hintTex){MathJax.typesetPromise([conceptHint])}}
function initUnits(){}
function updateTargetFormulaVisibility(){if(targetFormula.classList.contains("hidden"))return;targetFormula.classList.remove("hidden")}
function addToken(sym,side){const tokenEl=document.createElement("div");tokenEl.className="token";tokenEl.draggable=true;const symEl=document.createElement("span");symEl.className="sym";symEl.textContent=sym;tokenEl.appendChild(symEl);const id="t"+(++tokenSeq);const token={id,symbol:sym,side,el:tokenEl};tokens.push(token);tokenEl.addEventListener("dragstart",e=>{e.dataTransfer.setData("text/plain","token:"+id)});if(side==="num"){numerator.appendChild(tokenEl)}else{denominator.appendChild(tokenEl)}updateCurrent()}
function clearCanvas(){tokens.forEach(t=>t.el.remove());tokens=[];updateCurrent();result.textContent=""}
function compareDims(a,b){const keys=["kg","m","s","A","K","mol","cd"];return keys.every(k=>(a[k]||0)===(b[k]||0))}
function diffHint(a,b){const keys=["kg","m","s","A","K","mol","cd"];const parts=keys.map(k=>{const da=(a[k]||0),db=(b[k]||0);const d=db-da;if(d!==0)return k+(d>0?" "+toSup(d):" "+toSup(d));return null}).filter(Boolean);return parts.length?("Adjust: "+parts.join(" · ")):""}
function check(){if(!target){result.textContent="Select a unit";return}const a=sumDims();const ok=compareDims(a,target.dims);result.textContent=ok?"Correct":"Not correct";if(!ok)result.textContent+=" — "+diffHint(a,target.dims)}
function goNext(){if(quizIndex<QUIZ.length-1){quizIndex++}clearCanvas();setTarget(QUIZ[quizIndex]);result.textContent=""}
function goPrev(){if(quizIndex>0){quizIndex--}clearCanvas();setTarget(QUIZ[quizIndex]);result.textContent=""}
function handleDrop(side,data){if(data.startsWith("base:")){const sym=data.slice(5);if(!BASE_UNITS.find(u=>u.symbol===sym))return;addToken(sym,side)}else if(data.startsWith("token:")){const id=data.slice(6);const t=tokens.find(x=>x.id===id);if(!t)return;t.side=side;if(side==="num"){numerator.appendChild(t.el)}else{denominator.appendChild(t.el)}updateCurrent()}}
function initDnD(){numerator.addEventListener("dragover",e=>{e.preventDefault()});denominator.addEventListener("dragover",e=>{e.preventDefault()});numerator.addEventListener("drop",e=>{e.preventDefault();handleDrop("num",e.dataTransfer.getData("text/plain"))});denominator.addEventListener("drop",e=>{e.preventDefault();handleDrop("den",e.dataTransfer.getData("text/plain"))})}
document.addEventListener("dragover",e=>{e.preventDefault()})
document.addEventListener("drop",e=>{const data=e.dataTransfer.getData("text/plain");if(!data||!data.startsWith("token:"))return;const r=canvas.getBoundingClientRect();const x=e.clientX;const y=e.clientY;const inside=(x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom);if(!inside){const id=data.slice(6);const idx=tokens.findIndex(t=>t.id===id);if(idx>=0){tokens[idx].el.remove();tokens.splice(idx,1);updateCurrent()}}})
resetBtn.addEventListener("click",()=>{clearCanvas();result.textContent=""})
clearBtn.addEventListener("click",()=>{clearCanvas()})
checkBtn.addEventListener("click",()=>{check()})
nextBtn.addEventListener("click",()=>{goNext()})
prevBtn.addEventListener("click",()=>{goPrev()})
showTermsBtn.addEventListener("click",()=>{termHints.classList.toggle("hidden")})
initPalette()
initDnD()
updateCurrent()
setTarget(QUIZ[quizIndex])
