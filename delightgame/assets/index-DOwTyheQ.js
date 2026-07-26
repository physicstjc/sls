(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=12,t=6,n={wire_single:1,wire_straight:2,wire_corner:2,wire_t:2,wire_cross:2,bulb:3},r={n:{dr:-1,dc:0,opposite:`s`,left:`w`,right:`e`},e:{dr:0,dc:1,opposite:`w`,left:`n`,right:`s`},s:{dr:1,dc:0,opposite:`n`,left:`e`,right:`w`},w:{dr:0,dc:-1,opposite:`e`,left:`s`,right:`n`}},i=[`n`,`e`,`s`,`w`];function a(e=7,t=7){let r={rows:e,cols:t,turn:`red`,turnCount:0,selectedKind:`wire_straight`,selectedDir:`e`,board:Array.from({length:e},()=>Array.from({length:t},()=>null)),history:[],inventory:{red:{...n},blue:{...n}},pendingPlacement:null,evaluation:{score:{red:0,blue:0},bulbs:[],currentFlows:[]}};return r.evaluation=A(r),r}function o(e,t,n){if(e.pendingPlacement!==null)return!1;let r=e.inventory[e.turn];if(r[e.selectedKind]<=0)return!1;let i={owner:e.turn,kind:e.selectedKind,dir:e.selectedDir};return!d(e,t,n,i)||v(e)?!1:(e.board[t][n]=i,--r[e.selectedKind],e.history.push({tile:i,cell:{row:t,col:n}}),e.turnCount+=1,e.pendingPlacement={row:t,col:n},e.evaluation=A(e),!0)}function s(e,t){e.selectedKind=t}function c(e,t,n){if(!e.pendingPlacement||e.pendingPlacement.row!==t||e.pendingPlacement.col!==n)return!1;let r=e.board[t][n];return!r||r.owner!==e.turn?!1:(r.dir=me(r.dir),e.evaluation=A(e),!0)}function l(e,t){let n=e.pendingPlacement;if(!n)return!1;let r=e.board[n.row][n.col];if(!r||r.owner!==e.turn)return!1;if(r.kind===t)return e.selectedKind=t,!0;let a=e.inventory[e.turn];if(a[t]<=0)return!1;let o={...r,kind:t};if(!d(e,n.row,n.col,o,n)){let t=i.find(t=>d(e,n.row,n.col,{...o,dir:t},n));if(!t)return!1;o.dir=t}if(!d(e,n.row,n.col,o,n))return!1;e.selectedKind=t,a[r.kind]+=1,--a[t],r.kind=t,r.dir=o.dir;let s=e.history[e.history.length-1];return s&&s.cell.row===n.row&&s.cell.col===n.col&&(s.tile=r),e.evaluation=A(e),!0}function u(e,t,n){let r=e.pendingPlacement;if(!r)return!1;let a=e.board[r.row][r.col];if(!a||a.owner!==e.turn)return!1;if(!d(e,t,n,a,r)){let o=i.find(i=>d(e,t,n,{...a,dir:i},r));if(!o)return!1;a.dir=o}e.board[r.row][r.col]=null,e.board[t][n]=a,e.pendingPlacement={row:t,col:n};let o=e.history[e.history.length-1];return o&&o.cell.row===r.row&&o.cell.col===r.col&&(o.cell={row:t,col:n}),e.evaluation=A(e),!0}function d(e,t,n,i,a=null){if(!M(e,t,n)||N(e,t,n)||e.board[t][n]!==null&&!(a?.row===t&&a.col===n))return!1;let o=e.board.some((e,t)=>e.some((e,n)=>e?.owner===i.owner&&!(a?.row===t&&a.col===n)));for(let s of k(i)){let c=r[s],l=t+c.dr,u=n+c.dc;if(!M(e,l,u))continue;let d=i.owner===`red`&&l===0&&u===0,f=i.owner===`blue`&&l===e.rows-1&&u===e.cols-1;if(d||f)return!0;if(!o||a?.row===l&&a.col===u)continue;let p=e.board[l][u];if(p?.owner===i.owner&&k(p).includes(c.opposite))return!0}return!1}function f(e,t,n,r){let a=e.inventory[r];for(let o of Object.keys(a))if(!(a[o]<=0)){for(let a of i)if(d(e,t,n,{owner:r,kind:o,dir:a}))return!0}return!1}function p(e){return e.pendingPlacement?m(e):!w(e,e.turn)}function m(e){let t=e.pendingPlacement;if(!t)return!1;let n=e.board[t.row][t.col];return!!n&&d(e,t.row,t.col,n,t)}function h(e){return p(e)?(e.pendingPlacement=null,e.turn=e.turn===`red`?`blue`:`red`,!w(e,e.turn)&&!v(e)&&(e.turn=e.turn===`red`?`blue`:`red`),!0):!1}function g(e){return e.pendingPlacement!==null}function _(e,t,n){return!!e.pendingPlacement&&e.pendingPlacement.row===t&&e.pendingPlacement.col===n}function v(e){return pe(e)||!w(e,`red`)&&!w(e,`blue`)||!e.pendingPlacement&&(y(e)||C(e)||b(e))}function y(e){return te(ee(e,!1,!1),`potential:positive`,`potential:negative`)}function b(e){if(e.board.flat().filter(e=>e===null).length-2>6)return!1;let t=x(e),n=new Set,r=0,a=!1,o=e=>{if(r+=1,r>12e3)return a=!0,!0;let s=S(e);if(n.has(s))return!1;n.add(s);let c=w(e,e.turn)?[e.turn]:[e.turn===`red`?`blue`:`red`];for(let n of c){let r=e.inventory[n];for(let a of Object.keys(r))if(!(r[a]<=0))for(let r=0;r<e.rows;r+=1)for(let s=0;s<e.cols;s+=1){let c=new Set;for(let l of i){let i={owner:n,kind:a,dir:l},u=[...k(i)].sort().join(``);if(c.has(u)||(c.add(u),!d(e,r,s,i)))continue;let f=structuredClone(e);if(f.board[r][s]=i,--f.inventory[n][a],f.turn=n===`red`?`blue`:`red`,f.pendingPlacement=null,f.evaluation=A(f),x(f)!==t||o(f))return!0}}}return!1};return!o(e)&&!a}function x(e){let t=[];for(let n=0;n<e.rows;n+=1)for(let r=0;r<e.cols;r+=1){let i=e.board[n][r]?.kind===`bulb`?se(e,n,r):0;t.push(i.toFixed(8))}return t.join(`|`)}function S(e){let t=e.board.flat().map(e=>e?`${e.owner[0]}:${e.kind}:${e.dir}`:`.`).join(`,`);return`${e.turn}|${t}|${JSON.stringify(e.inventory)}`}function C(e){if(e.evaluation.bulbs.some(e=>e.power>1e-9))return!1;let t=e.inventory.red.bulb+e.inventory.blue.bulb>0,n=`possible:positive`,a=`possible:negative`,o=new Map,s=(e,t,n=!1)=>{o.has(e)||o.set(e,[]),o.has(t)||o.set(t,[]),o.get(e).push({node:t,includesBulb:n}),o.get(t).push({node:e,includesBulb:n})},c=(t,n)=>N(e,t,n)?[]:e.board[t][n]?k(e.board[t][n]):[...i];for(let n=0;n<e.rows;n+=1)for(let i=0;i<e.cols;i+=1){if(N(e,n,i))continue;let a=e.board[n][i],o=c(n,i);for(let e=0;e<o.length;e+=1)for(let r=e+1;r<o.length;r+=1){let c=P(n,i,o[e]),l=P(n,i,o[r]);s(c,l,a?.kind===`bulb`),!a&&t&&s(c,l,!0)}for(let t of o){let a=r[t],o=n+a.dr,l=i+a.dc;!M(e,o,l)||N(e,o,l)||c(o,l).includes(a.opposite)&&s(P(n,i,t),P(o,l,a.opposite))}}for(let[t,r,i]of[[0,1,`w`],[1,0,`n`]])M(e,t,r)&&c(t,r).includes(i)&&s(n,P(t,r,i));for(let[t,n,r]of[[e.rows-1,e.cols-2,`e`],[e.rows-2,e.cols-1,`s`]])M(e,t,n)&&c(t,n).includes(r)&&s(a,P(t,n,r));let l=[{node:n,includesBulb:!1}],u=new Set;for(;l.length;){let e=l.shift(),t=`${e.node}|${+!!e.includesBulb}`;if(!u.has(t)){if(u.add(t),e.node===a&&e.includesBulb)return!1;for(let t of o.get(e.node)??[])l.push({node:t.node,includesBulb:e.includesBulb||t.includesBulb})}}return!0}function w(e,t){if(pe(e)||!T(e,t))return!1;let n=e.inventory[t];return Object.values(n).some(e=>e>0)}function T(e,t){for(let n=0;n<e.rows;n+=1)for(let r=0;r<e.cols;r+=1)if(f(e,n,r,t))return!0;return!1}function E(e){if(!e.pendingPlacement&&y(e))return`Draw: a wire-only path short-circuits the entire circuit.`;if(!e.pendingPlacement&&C(e))return`Draw: no remaining move can create a circuit that lights a bulb.`;let t=e.evaluation.score.red,n=e.evaluation.score.blue;return Math.abs(t-n)<1e-6?`Draw: both teams matched total bulb power.`:t>n?`Red wins by total brightness.`:`Blue wins by total brightness.`}function ee(e,t,n,a=``){let o=new Map,s=(e,t)=>{o.has(e)||o.set(e,new Set),o.has(t)||o.set(t,new Set),o.get(e).add(t),o.get(t).add(e)},c=(n,r)=>{if(!M(e,n,r)||N(e,n,r))return[];let a=e.board[n][r];return a?k(a):t?[...i]:[]};for(let i=0;i<e.rows;i+=1)for(let o=0;o<e.cols;o+=1){if(N(e,i,o))continue;let l=e.board[i][o],u=c(i,o);if(!l&&t||l&&l.kind!==`bulb`||l&&l.kind===`bulb`&&n&&O(i,o)!==a)for(let t=0;t<u.length;t+=1)for(let n=t+1;n<u.length;n+=1)!l&&!D(e,u[t],u[n])||s(P(i,o,u[t]),P(i,o,u[n]));for(let e of u){let t=r[e],n=i+t.dr,a=o+t.dc;c(n,a).includes(t.opposite)&&s(P(i,o,e),P(n,a,t.opposite))}}for(let[e,t,n]of[[0,1,`w`],[1,0,`n`]])c(e,t).includes(n)&&s(`potential:positive`,P(e,t,n));for(let[t,n,r]of[[e.rows-1,e.cols-2,`e`],[e.rows-2,e.cols-1,`s`]])c(t,n).includes(r)&&s(`potential:negative`,P(t,n,r));return o}function D(e,t,n){let i=t=>e.inventory.red[t]+e.inventory.blue[t];return i(`wire_t`)>0||i(`wire_cross`)>0?!0:r[t].opposite===n?i(`wire_straight`)>0:i(`wire_corner`)>0}function te(e,t,n){if(t===n)return!0;let r=new Set,i=[t];for(;i.length;){let t=i.shift();if(!r.has(t)){r.add(t);for(let a of e.get(t)??[]){if(a===n)return!0;r.has(a)||i.push(a)}}}return!1}function ne(){return`Brightness follows P = IV = V^2/R. Junction cards split branches, and directional bulbs can be rotated after placement during the same turn.`}function re(e,t,n){return t===0&&n===0?`+`:t===e.rows-1&&n===e.cols-1?`-`:``}function O(e,t){return`${e},${t}`}function ie(e){switch(e){case`wire_single`:return`Single`;case`wire_straight`:return`Straight`;case`wire_corner`:return`Corner`;case`wire_t`:return`T Junction`;case`wire_cross`:return`Cross`;case`bulb`:return`Bulb`;default:return e}}function ae(e,t){let n=e.inventory[t];return[{kind:`wire_straight`,count:n.wire_straight},{kind:`wire_corner`,count:n.wire_corner},{kind:`wire_t`,count:n.wire_t},{kind:`wire_cross`,count:n.wire_cross},{kind:`wire_single`,count:n.wire_single},{kind:`bulb`,count:n.bulb}]}function oe(e,t){let n=e.inventory[t];return Object.values(n).reduce((e,t)=>e+t,0)}function k(e){if(!e)return[];if(e.kind===`wire_cross`)return[...i];if(e.kind===`wire_t`){let t=e.dir;return[t,r[t].left,r[t].right]}return e.kind===`wire_corner`?[e.dir,r[e.dir].right]:e.kind===`wire_straight`||e.kind===`bulb`?[e.dir,r[e.dir].opposite]:[e.dir]}function se(e,t,n){let r=e.evaluation.bulbs.find(e=>e.row===t&&e.col===n);return r?r.power:0}function ce(e,t,n){return e.evaluation.bulbs.find(e=>e.row===t&&e.col===n)??null}function le(e,t,n){return e.evaluation.currentFlows.find(e=>e.row===t&&e.col===n)??null}function ue(e,t,n){let r=[`cell`],i=e.board[t][n];return i?(r.push(`occupied`),r.push(i.owner),r.push(i.kind),_(e,t,n)&&r.push(`pending`),r):r}function A(n){let i=he(),a=[],o=`source:pos`,s=`source:neg`;i.find(o),i.find(s);for(let e=0;e<n.rows;e+=1)for(let o=0;o<n.cols;o+=1){let s=n.board[e][o];if(!s)continue;let c=k(s);if(s.kind===`bulb`&&c.length===2)a.push({a:P(e,o,c[0]),b:P(e,o,c[1]),r:t,row:e,col:o,tile:s});else for(let t=1;t<c.length;t+=1)i.union(P(e,o,c[0]),P(e,o,c[t]));for(let t of c){let a=r[t],s=e+a.dr,c=o+a.dc;if(s<0||s>=n.rows||c<0||c>=n.cols)continue;let l=n.board[s][c];l&&k(l).includes(a.opposite)&&i.union(P(e,o,t),P(s,c,a.opposite))}}fe(i,n,o,s);let c=[];for(let e of a){let t=i.find(e.a),n=i.find(e.b);t!==n&&c.push({...e,a:t,b:n})}let l=i.find(o),u=i.find(s),d=new Map,f=(e,t)=>{d.has(e)||d.set(e,new Set),d.get(e).add(t)};for(let e of c)f(e.a,e.b),f(e.b,e.a);let p=F(d,l),m=F(d,u),h=new Set;for(let e of p)m.has(e)&&h.add(e);if(!h.has(l)||!h.has(u))return{score:{red:0,blue:0},bulbs:[],currentFlows:[]};let g=c.filter(e=>h.has(e.a)&&h.has(e.b)),_=ge(Array.from(h).filter(e=>e!==l&&e!==u),g,l,u,e),v=[],y={red:0,blue:0};for(let t of g){if(t.tile.kind!==`bulb`)continue;let n=ve(t.a,_,l,u,e),r=ve(t.b,_,l,u,e),i=Math.abs(n-r),a=i/t.r,o=i*a;v.push({row:t.row,col:t.col,owner:t.tile.owner,voltage:i,current:a,power:o}),y[t.tile.owner]+=o}return{score:y,bulbs:v,currentFlows:de(n,v)}}function de(e,t){let n=`terminal:positive`,i=`terminal:negative`,a=new Map,o=(e,t)=>{a.has(e)||a.set(e,new Set),a.has(t)||a.set(t,new Set),a.get(e).add(t),a.get(t).add(e)},s=(e,t)=>`${e},${t}`,c=new Set(t.filter(e=>e.current>1e-9).map(e=>s(e.row,e.col)));for(let t=0;t<e.rows;t+=1)for(let n=0;n<e.cols;n+=1){let i=e.board[t][n];if(i&&!(i.kind===`bulb`&&!c.has(s(t,n))))for(let a of k(i)){let i=r[a],l=t+i.dr,u=n+i.dc;if(!M(e,l,u))continue;let d=e.board[l][u];d&&(d.kind!==`bulb`||c.has(s(l,u)))&&k(d).includes(i.opposite)&&o(s(t,n),s(l,u))}}for(let[t,r,i]of[[0,1,`w`],[1,0,`n`]]){let a=e.board[t]?.[r];a&&k(a).includes(i)&&o(n,s(t,r))}for(let[t,n,r]of[[e.rows-1,e.cols-2,`e`],[e.rows-2,e.cols-1,`s`]]){let a=e.board[t]?.[n];a&&k(a).includes(r)&&o(i,s(t,n))}if(!F(a,n).has(i))return[];let l=new Set(a.keys()),u=Array.from(l).filter(e=>e!==n&&e!==i&&(a.get(e)?.size??0)<=1);for(;u.length;){let e=u.shift();if(l.delete(e))for(let t of a.get(e)??[])l.has(t)&&t!==n&&t!==i&&Array.from(a.get(t)??[]).filter(e=>l.has(e)).length<=1&&u.push(t)}let d=e=>{let t=new Map([[e,0]]),n=[e];for(;n.length;){let e=n.shift();for(let r of a.get(e)??[])l.has(r)&&!t.has(r)&&(t.set(r,t.get(e)+1),n.push(r))}return t},f=d(n),p=d(i),m=e=>{let t=f.get(e)??1/0;return t/(t+(p.get(e)??1/0))},h=[];for(let t of l){if(t.startsWith(`terminal:`))continue;let[o,c]=t.split(`,`).map(Number),u=e.board[o][c];if(!u)continue;let d=[],f=[];for(let p of k(u)){let u=r[p],h=s(o+u.dr,c+u.dc);(o===0&&c===1&&p===`w`||o===1&&c===0&&p===`n`)&&(h=n),(o===e.rows-1&&c===e.cols-2&&p===`e`||o===e.rows-2&&c===e.cols-1&&p===`s`)&&(h=i),!(!l.has(h)||!a.get(t)?.has(h))&&(m(h)<m(t)?d.push(p):m(h)>m(t)&&f.push(p))}(d.length||f.length)&&h.push({row:o,col:c,incoming:d,outgoing:f})}return h}function fe(e,t,n,r){j(e,t,0,1,`w`,n),j(e,t,1,0,`n`,n),j(e,t,t.rows-1,t.cols-2,`e`,r),j(e,t,t.rows-2,t.cols-1,`s`,r)}function j(e,t,n,r,i,a){if(!M(t,n,r))return;let o=t.board[n][r];o&&k(o).includes(i)&&e.union(P(n,r,i),a)}function M(e,t,n){return t>=0&&t<e.rows&&n>=0&&n<e.cols}function N(e,t,n){return t===0&&n===0||t===e.rows-1&&n===e.cols-1}function pe(e){for(let t=0;t<e.rows;t+=1)for(let n=0;n<e.cols;n+=1)if(e.board[t][n]===null)return!1;return!0}function me(e){switch(e){case`n`:return`e`;case`e`:return`s`;case`s`:return`w`;case`w`:return`n`;default:return`n`}}function P(e,t,n){return`${e},${t},${n}`}function he(){let e=new Map,t=n=>{let r=e.get(n);if(!r)return e.set(n,n),n;if(r===n)return n;let i=t(r);return e.set(n,i),i};return{find:t,union:(n,r)=>{let i=t(n),a=t(r);i!==a&&e.set(i,a)}}}function F(e,t){let n=new Set,r=[t];for(;r.length>0;){let t=r.shift();if(!t||n.has(t))continue;n.add(t);let i=e.get(t);if(i)for(let e of i)n.has(e)||r.push(e)}return n}function ge(e,t,n,r,i){let a=e.length,o=new Map;for(let t=0;t<a;t+=1)o.set(e[t],t);let s=Array.from({length:a},()=>Array.from({length:a},()=>0)),c=Array.from({length:a},()=>0);for(let e of t){let t=1/e.r,a=o.get(e.a),l=o.get(e.b);a!==void 0&&(s[a][a]+=t,l===void 0?c[a]+=t*_e(e.b,n,r,i):s[a][l]-=t),l!==void 0&&(s[l][l]+=t,a===void 0?c[l]+=t*_e(e.a,n,r,i):s[l][a]-=t)}let l=ye(s,c),u=new Map;for(let t=0;t<a;t+=1)u.set(e[t],l[t]);return u}function _e(e,t,n,r){return e===t?r:0}function ve(e,t,n,r,i){return e===n?i:e===r?0:t.get(e)??0}function ye(e,t){let n=t.length;if(n===0)return[];let r=e.map((e,n)=>[...e,t[n]]);for(let e=0;e<n;e+=1){let t=e;for(let i=e+1;i<n;i+=1)Math.abs(r[i][e])>Math.abs(r[t][e])&&(t=i);if(Math.abs(r[t][e])<1e-12)continue;if(t!==e){let n=r[e];r[e]=r[t],r[t]=n}let i=r[e][e];for(let t=e;t<=n;t+=1)r[e][t]/=i;for(let t=0;t<n;t+=1){if(t===e)continue;let i=r[t][e];if(!(Math.abs(i)<1e-12))for(let a=e;a<=n;a+=1)r[t][a]-=i*r[e][a]}}return r.map(e=>e[n])}var be=`modulepreload`,xe=function(e,t){return new URL(e,t).href},Se={},Ce=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}function s(e){return import.meta.resolve?import.meta.resolve(e):new URL(e,import.meta.url).href}r=o(t.map(t=>{if(t=xe(t,n),t=s(t),t in Se)return;Se[t]=!0;let r=t.endsWith(`.css`);for(let n=e.length-1;n>=0;n--){let i=e[n];if(i.href===t&&(!r||i.rel===`stylesheet`))return}let i=document.createElement(`link`);if(i.rel=r?`stylesheet`:be,r||(i.as=`script`),i.crossOrigin=``,i.href=t,a&&i.setAttribute(`nonce`,a),document.head.appendChild(i),r)return new Promise((e,n)=>{i.addEventListener(`load`,e),i.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},I=a(5,5),we=document.querySelector(`#app`);if(!we)throw Error(`App root not found.`);var L=we,R=null,z=null,B=!1,V=!1,H=!1,U=`mode`,W=null,G=null,K=!1,q={red:`Red Player`,blue:`Blue Player`},J=!1,Y=[],Te=!1,X=``,Ee=`delight-leaderboard-v1`,Z={easy:{name:`Sparky`,title:`The Curious Tinkerer`,description:`Plays quickly and experiments with unpredictable moves.`},medium:{name:`Tommy`,title:`The Circuit Builder`,description:`Looks for useful connections and brighter bulbs.`},hard:{name:`Nikki`,title:`The Master Engineer`,description:`Claims bulbs early and builds parallel branches for maximum power.`}};function Q(){let e=v(I),t=I.evaluation.score.red,n=I.evaluation.score.blue,r=g(I),i=!r||m(I),a=!r&&y(I),o=!r&&(a||C(I)),s=!r&&b(I),c=G?Z[G]:null,l=w(I,I.turn);e&&!U&&!J&&Ve(t,n),L.innerHTML=`
    <div class="ambient"></div>
    <main class="shell ${K?`ai-turn-active`:``}">
      <button class="tool quiet reset corner-reset" data-action="reset">New match</button>
      <section class="hud">
        <div class="hud-left">
          <div class="title-strip">
            <h1>DeLight</h1>
            <button
              class="help-icon"
              data-action="open-instructions"
              aria-label="How to play"
              title="How to play"
            >?</button>
            <button
              class="help-icon leaderboard-icon"
              data-action="open-leaderboard"
              aria-label="View leaderboard"
              title="Leaderboard"
            >♛</button>
          </div>

          <div class="status ${I.turn}">
            <span class="dot"></span>
            <span>${e?`Game over`:K&&c?`${c.name} is thinking…`:`${I.turn.toUpperCase()} turn`}</span>
          </div>
        </div>

      </section>

      <section class="arena" aria-label="Game board">
        <div class="board-stage">
          <div class="controls">
            <div class="move-tools">
              ${r?`
                    <span class="action-hint">${i?`Move ready — click it to rotate or click an empty square to reposition`:`Rotate or move the card until it connects to one of your cards`}</span>
                    <button class="tool primary" data-action="end-turn" ${p(I)?``:`disabled`}>End turn <span aria-hidden="true">→</span></button>
                  `:!l&&!e?`
                      <span class="action-hint">No cards are available for this player</span>
                      <button class="tool primary" data-action="end-turn">Pass turn <span aria-hidden="true">→</span></button>
                    `:`
                    <span class="action-hint"><span class="available-swatch" aria-hidden="true"></span> Highlighted squares are available</span>
                  `}
            </div>
          </div>
          <div class="board" role="grid">
            ${Ne(e)}
          </div>
        </div>

        <aside class="side-column">
          <div class="scoreboard side">
            <div class="card red">
              <h2>Red Team</h2>
              <p class="watts">${t.toFixed(2)} W</p>
              <p class="turns">Cards left: ${oe(I,`red`)}</p>
            </div>
            <div class="card blue">
              <h2>Blue Team</h2>
              <p class="watts">${n.toFixed(2)} W</p>
              <p class="turns">Cards left: ${oe(I,`blue`)}</p>
            </div>
          </div>

          <div class="picker-wrap">
            <div class="picker-heading">
              <strong>${r?`Change your card`:`Choose a card`}</strong>
              <span>${r?`Click any available card to swap`:`Drag or click to select`}</span>
            </div>
            <div class="picker" aria-label="Cards left">
            ${Me()}
            </div>
          </div>

          <div class="panel">
          <h3>Match Status</h3>
          <p>${r?`A card is pending. Move it to another square, replace it, rotate it, or end your turn.`:`Place a card and build a conducting path.`}</p>
          <p>Red moves: ${w(I,`red`)?`available`:`none`}</p>
          <p>Blue moves: ${w(I,`blue`)?`available`:`none`}</p>
          ${s&&!o?`<p>All bulb outcomes are fixed; no remaining wire can light or short-circuit another bulb.</p>`:``}
          ${e?`<p class="result">${E(I)}</p>`:``}
          </div>
        </aside>
      </section>

      ${V?je():``}
      ${o?Ae(a):``}
      ${s&&!o?Oe(t,n):``}
      ${U?ke():``}
      ${H?De():``}
      ${K&&!e?`<div class="ai-input-shield" aria-hidden="true"></div>`:``}
    </main>
  `,Ie()}function De(){let e=Y.sort((e,t)=>t.score-e.score||t.playedAt.localeCompare(e.playedAt)).slice(0,25);return`
    <div class="modal-backdrop leaderboard-backdrop">
      <section class="modal leaderboard-modal" role="dialog" aria-modal="true" aria-labelledby="leaderboard-title">
        <header class="modal-header">
          <div>
            <p class="setup-eyebrow">Best performances</p>
            <h3 id="leaderboard-title">Leaderboard</h3>
          </div>
          <button class="help-icon" data-action="close-leaderboard" aria-label="Close leaderboard">×</button>
        </header>
        <div class="leaderboard-content">
          ${Te?`<div class="empty-leaderboard">
                  <span class="leaderboard-loader" aria-hidden="true"></span>
                  <strong>Loading scores…</strong>
                </div>`:e.length?`<ol class="leaderboard-list">
                  ${e.map((e,t)=>`
                        <li>
                          <span class="leaderboard-rank">${t+1}</span>
                          <span class="leaderboard-player">
                            <strong>${Re(e.name)}</strong>
                            <small>${e.isComputer?`Computer`:e.mode===`solo`?`vs ${Re(e.opponent)}`:`2 Players`}</small>
                          </span>
                          <span class="leaderboard-team ${e.team}">${e.team}</span>
                          <strong class="leaderboard-score">${e.score.toFixed(2)} W</strong>
                        </li>
                      `).join(``)}
                </ol>`:`<div class="empty-leaderboard">
                  <span aria-hidden="true">♛</span>
                  <strong>No scores yet</strong>
                  <p>${X?`Firebase is unavailable; showing scores saved on this browser.`:`Finish a match to add the first result.`}</p>
                </div>`}
          ${X&&e.length?`<p class="leaderboard-notice">${Re(X)}</p>`:``}
        </div>
      </section>
    </div>
  `}function Oe(e,t){let n=Math.abs(e-t)<1e-6,r=e>t?`Red`:`Blue`;return`
    <div class="modal-backdrop result-backdrop">
      <section class="modal winner-modal" role="alertdialog" aria-modal="true" aria-labelledby="winner-title" aria-describedby="winner-description">
        <p class="setup-eyebrow">Final result</p>
        <div class="winner-symbol ${n?`tied`:r.toLowerCase()}" aria-hidden="true">${n?`＝`:`★`}</div>
        <h2 id="winner-title">${n?`The match is tied`:`${r} wins!`}</h2>
        <p id="winner-description">No remaining move can change any bulb’s brightness.</p>
        <div class="final-scores">
          <div class="final-score red">
            <span>Red</span>
            <strong>${e.toFixed(2)} W</strong>
          </div>
          <div class="final-score blue">
            <span>Blue</span>
            <strong>${t.toFixed(2)} W</strong>
          </div>
        </div>
        <button class="tool primary draw-action" data-action="reset">Play again</button>
      </section>
    </div>
  `}function ke(){if(U===`players`){let e=G?Z[G]:null;return`
      <div class="modal-backdrop setup-backdrop">
        <section class="modal setup-modal player-setup-modal" role="dialog" aria-modal="true" aria-labelledby="players-title">
          <p class="setup-eyebrow">${W===`solo`?`Playing ${e?.name??`Computer`}`:`Two-player game`}</p>
          <h2 id="players-title">${W===`solo`?`What is your name?`:`Enter player names`}</h2>
          <p class="setup-copy">Scores will be saved to this browser’s leaderboard.</p>
          <form class="player-name-form" data-action="start-game">
            <label>
              <span>Red player</span>
              <input name="red-name" maxlength="24" autocomplete="name" placeholder="Enter name" required autofocus />
            </label>
            ${W===`two-player`?`<label>
                    <span>Blue player</span>
                    <input name="blue-name" maxlength="24" placeholder="Enter name" required />
                  </label>`:`<div class="computer-opponent">
                    <span>Blue opponent</span>
                    <strong>${e?.name??`Computer`}</strong>
                    <small>${e?.title??``}</small>
                  </div>`}
            <button class="tool primary start-game-button" type="submit">Start match <span aria-hidden="true">→</span></button>
          </form>
          <button class="tool quiet setup-back" data-action="setup-back">← Back</button>
        </section>
      </div>
    `}return U===`difficulty`?`
      <div class="modal-backdrop setup-backdrop">
        <section class="modal setup-modal" role="dialog" aria-modal="true" aria-labelledby="difficulty-title">
          <p class="setup-eyebrow">Solo game</p>
          <h2 id="difficulty-title">Choose your opponent</h2>
          <p class="setup-copy">Each persona uses a different playing strategy.</p>
          <div class="persona-grid">
            ${[`easy`,`medium`,`hard`].map(e=>{let t=Z[e];return`
                  <button class="persona-card ${e}" data-difficulty="${e}">
                    <span class="persona-level">${e}</span>
                    <strong>${t.name}</strong>
                    <span class="persona-title">${t.title}</span>
                    <span class="persona-description">${t.description}</span>
                  </button>
                `}).join(``)}
          </div>
          <button class="tool quiet setup-back" data-action="setup-back">← Back</button>
        </section>
      </div>
    `:`
    <div class="modal-backdrop setup-backdrop">
      <section class="modal setup-modal" role="dialog" aria-modal="true" aria-labelledby="mode-title">
        <p class="setup-eyebrow">DeLight</p>
        <h2 id="mode-title">How would you like to play?</h2>
        <p class="setup-copy">Choose a local two-player match or challenge an AI opponent.</p>
          <div class="mode-grid">
          <button class="mode-card" data-mode="solo">
            <span class="mode-icon" aria-hidden="true">1</span>
            <strong>1 Player</strong>
            <span>Play as Red against an AI persona</span>
          </button>
          <button class="mode-card" data-mode="two-player">
            <span class="mode-icon two" aria-hidden="true">2</span>
            <strong>2 Players</strong>
            <span>Take turns together on this device</span>
          </button>
          </div>
          <button class="tool quiet setup-leaderboard" data-action="open-leaderboard">♛ View leaderboard</button>
      </section>
    </div>
  `}function Ae(e){return`
    <div class="modal-backdrop draw-backdrop">
      <section class="modal draw-modal" role="alertdialog" aria-modal="true" aria-labelledby="draw-title" aria-describedby="draw-description">
        <div class="draw-symbol" aria-hidden="true">＝</div>
        <h3 id="draw-title">${e?`Draw — global short circuit`:`The match is a draw`}</h3>
        <p id="draw-description">${e?`A wire-only path directly connects the positive and negative terminals, bypassing every bulb.`:`No remaining move can complete a circuit that lights a bulb between the positive and negative terminals.`}</p>
        <button class="tool primary draw-action" data-action="reset">Start a new match</button>
      </section>
    </div>
  `}function je(){return`
    <div class="modal-backdrop" data-action="close-instructions">
      <section class="modal" role="dialog" aria-modal="true" aria-label="Game Instructions">
        <header class="modal-header">
          <h3>Instructions</h3>
          <button class="tool" data-action="close-instructions">Close</button>
        </header>
        <div class="modal-content">
          <p>1) Pick a card image by click or drag.</p>
          <p>2) Red starts from + in the top-left; Blue starts from − in the bottom-right.</p>
          <p>3) Every later card must physically connect to one of your own cards.</p>
          <p>4) Click that dropped card to rotate it.</p>
          <p>5) Click another empty square to reposition the pending card.</p>
          <p>6) Click another card in the picker to replace the pending card.</p>
          <p>7) Press End Turn to lock in the move.</p>
          <h4>Physics</h4>
          <p>${ne()}</p>
          <ul>
            <li>Shared + terminal: top-left corner</li>
            <li>Shared - terminal: bottom-right corner</li>
            <li>Bulb resistance: 6 Ohm</li>
          </ul>
        </div>
      </section>
    </div>
  `}function Me(){let e=ae(I,I.turn),t=[];for(let n of e){let e=n.count<=0,r=I.selectedKind===n.kind;t.push(`
      <button
        class="pick-card ${r?`selected`:``} ${e?`disabled`:``}"
        data-kind="${n.kind}"
        draggable="${e?`false`:`true`}"
        ${e?`disabled`:``}
        title="${ie(n.kind)}"
      >
        <span class="pick-image">${Pe(n.kind,I.selectedDir,`neutral`,!0)}</span>
        <span class="pick-meta">
          <span class="pick-name">${ie(n.kind)}</span>
          <span class="pick-count">x${n.count}</span>
        </span>
      </button>
    `)}return t.join(``)}function Ne(e){let t=[],n=g(I),r={owner:I.turn,kind:I.selectedKind,dir:I.selectedDir};for(let i=0;i<I.rows;i+=1)for(let a=0;a<I.cols;a+=1){let o=I.board[i][a],s=ue(I,i,a).join(` `),c=re(I,i,a),l=O(i,a),u=c===`+`?`terminal-pos`:c===`-`?`terminal-neg`:``,d=o?.kind===`bulb`?ce(I,i,a):null,p=o?.kind===`bulb`?se(I,i,a):0,m=d?.current??0,h=le(I,i,a),v=o?.kind===`bulb`?m>1e-6?`bulb-lit`:`bulb-off`:``,y=Math.min(1,p/24),b=!o&&!g(I)&&!e&&$(i,a,r)!==null&&R?.row===i&&R?.col===a,x=z===l,S=n&&!o&&!c&&!!I.pendingPlacement&&!!I.board[I.pendingPlacement.row][I.pendingPlacement.col]&&$(i,a,I.board[I.pendingPlacement.row][I.pendingPlacement.col],I.pendingPlacement)!==null,C=!o&&!c&&!e&&(n?S:f(I,i,a,I.turn));t.push(`
        <button
          class="${s} ${u} ${v} ${x?`rotating`:``} ${S?`shift-target`:``} ${C?`available-target`:``}"
          data-cell="${l}"
          style="--bulb-power: ${y.toFixed(3)}"
          role="gridcell"
          aria-label="Cell ${i+1}, ${a+1}${C?`, available for placement`:``}"
        >
          ${c?`<span class="source">${c}</span>`:``}
          ${b?`<span class="tile-image ghost">${Pe(I.selectedKind,I.selectedDir,I.turn,!1)}</span>`:``}
          ${o?`<span class="tile-image">${Pe(o.kind,o.dir,o.owner,!1,h)}</span>`:``}
          ${_(I,i,a)?`<span class="pending-tag">Rotate me</span>`:``}
        </button>
      `)}return t.join(``)}function $(e,t,n,r=null){return[n.dir,...[`n`,`e`,`s`,`w`].filter(e=>e!==n.dir)].find(i=>d(I,e,t,{...n,dir:i},r))??null}function Pe(e,t,n,r,i=null){let a=k({owner:`red`,kind:e,dir:t}),o=n===`red`?`#c33224`:n===`blue`?`#1f4f8d`:`#37454d`,s=n===`red`?`#fff5f2`:n===`blue`?`#f3f8ff`:`#f8fbfb`,c=r?44:100,l=c/2,u=r?4:6,d=a.map(e=>e===`n`?`<line x1="${l}" y1="${l}" x2="${l}" y2="0" />`:e===`e`?`<line x1="${l}" y1="${l}" x2="${c}" y2="${l}" />`:e===`s`?`<line x1="${l}" y1="${l}" x2="${l}" y2="${c}" />`:`<line x1="${l}" y1="${l}" x2="0" y2="${l}" />`).join(``),f=Fe(t),p=e===`bulb`?`
      <g transform="rotate(${f} ${l} ${l})">
        <circle cx="${l}" cy="${l}" r="${r?11:22}" fill="#fff8d1" stroke="#8e7750" stroke-width="${r?1.5:2}" />
        <circle cx="${l}" cy="${l}" r="${r?7:14}" fill="#ffe59f" opacity="0.9" />
        <path d="M ${l-(r?5:10)} ${l+(r?1:2)} C ${l-(r?3:6)} ${l-(r?3:6)}, ${l+(r?3:6)} ${l-(r?3:6)}, ${l+(r?5:10)} ${l+(r?1:2)}" fill="none" stroke="#7c5609" stroke-width="${r?1.4:2}" />
        <line x1="${l-(r?4:8)}" y1="${l+(r?4:8)}" x2="${l-(r?2:4)}" y2="${l+(r?1:2)}" stroke="#7c5609" stroke-width="${r?1.3:2}" />
        <line x1="${l+(r?4:8)}" y1="${l+(r?4:8)}" x2="${l+(r?2:4)}" y2="${l+(r?1:2)}" stroke="#7c5609" stroke-width="${r?1.3:2}" />
        <rect x="${l-(r?2.5:5)}" y="${l-(r?11:22)}" width="${r?5:10}" height="${r?3:6}" rx="1" fill="#8e7750" />
        <circle cx="${l-(r?7:14)}" cy="${l}" r="${r?1.2:2}" fill="#8e7750" />
        <circle cx="${l+(r?7:14)}" cy="${l}" r="${r?1.2:2}" fill="#8e7750" />
      </g>
    `:``,m=(e,t)=>{let n=e===`n`?[l,0]:e===`e`?[c,l]:e===`s`?[l,c]:[0,l],[r,i,a,o]=t?[n[0],n[1],l,l]:[l,l,n[0],n[1]];return`<line class="current-flow" x1="${r}" y1="${i}" x2="${a}" y2="${o}" />`},h=!r&&i?`<g class="current-layer">${i.incoming.map(e=>m(e,!0)).join(``)}${i.outgoing.map(e=>m(e,!1)).join(``)}</g>`:``;return`<svg viewBox="0 0 ${c} ${c}" width="${r?`${c}`:`100%`}" height="${r?`${c}`:`100%`}" preserveAspectRatio="none" aria-hidden="true">
    <rect x="0" y="0" width="${c}" height="${c}" rx="${r?5:0}" fill="${s}" stroke="#9fb0a9" stroke-width="1.5" />
    <g stroke="${o}" stroke-width="${u}" stroke-linecap="round">${d}</g>
    ${p}
    ${h}
  </svg>`}function Fe(e){switch(e){case`n`:return 180;case`e`:return-90;case`s`:return 0;case`w`:return 90;default:return 0}}function Ie(){let e=L.querySelectorAll(`[data-mode]`);for(let t of e)t.addEventListener(`click`,()=>{t.dataset.mode===`solo`?(W=`solo`,U=`difficulty`):(W=`two-player`,G=null,U=`players`),Q()});let t=L.querySelectorAll(`[data-difficulty]`);for(let e of t)e.addEventListener(`click`,()=>{G=e.dataset.difficulty,W=`solo`,U=`players`,Q()});L.querySelector(`[data-action="setup-back"]`)?.addEventListener(`click`,()=>{U===`players`&&W===`solo`?U=`difficulty`:(U=`mode`,W!==`solo`&&(W=null)),Q()}),L.querySelector(`[data-action="start-game"]`)?.addEventListener(`submit`,e=>{e.preventDefault();let t=new FormData(e.currentTarget);q={red:Le(t.get(`red-name`),`Red Player`),blue:W===`solo`?Z[G??`easy`].name:Le(t.get(`blue-name`),`Blue Player`)},J=!1,U=null,Q()});let n=L.querySelectorAll(`[data-action="open-leaderboard"]`);for(let e of n)e.addEventListener(`click`,()=>{Be()});L.querySelector(`[data-action="close-leaderboard"]`)?.addEventListener(`click`,()=>{H=!1,Q()});let r=L.querySelectorAll(`[data-kind]`);for(let e of r)e.addEventListener(`click`,()=>{if(K)return;let t=e.dataset.kind;g(I)?l(I,t):s(I,t),Q()}),e.addEventListener(`dragstart`,t=>{B=!0;let n=e.dataset.kind;s(I,n),t.dataTransfer?.setData(`text/card-kind`,n),t.dataTransfer?.setData(`text/plain`,n)}),e.addEventListener(`dragend`,()=>{B=!1,R=null});L.querySelector(`[data-action="open-instructions"]`)?.addEventListener(`click`,()=>{V=!0,Q()});let i=L.querySelectorAll(`[data-action="close-instructions"]`);for(let e of i)e.addEventListener(`click`,e=>{e.target instanceof Element&&e.currentTarget instanceof Element&&e.currentTarget.classList.contains(`modal-backdrop`)&&!e.target.classList.contains(`modal-backdrop`)||(V=!1,Q())});L.querySelector(`[data-action="end-turn"]`)?.addEventListener(`click`,()=>{K||(h(I),Q(),He())});let d=L.querySelectorAll(`[data-action="reset"]`);for(let e of d)e.addEventListener(`click`,()=>{let e=a(5,5);Object.assign(I,e),U=`mode`,W=null,G=null,K=!1,H=!1,J=!1,q={red:`Red Player`,blue:`Blue Player`},Q()});let f=L.querySelectorAll(`[data-cell]`),p=e=>{if(K)return;let[t,n]=e.split(`,`),r=Number(t),i=Number(n);if(I.board[r][i]===null){if(v(I))return;if(g(I)){u(I,r,i),R=null,Q();return}let e=R,t=e?.row===r&&e?.col===i,n=t?e.row:r,a=t?e.col:i;if(I.board[n][a]!==null)return;let s=$(n,a,{owner:I.turn,kind:I.selectedKind,dir:I.selectedDir});if(!s)return;I.selectedDir=s,o(I,n,a),R=null,Q();return}c(I,r,i)&&(z=O(r,i),Q(),setTimeout(()=>{z===O(r,i)&&(z=null,Q())},180))};for(let e of f)e.addEventListener(`mouseenter`,()=>{let t=e.dataset.cell;if(!t||g(I)||v(I)||B)return;let[n,r]=t.split(`,`),i=Number(n),a=Number(r);if(I.board[i][a]!==null)return;let o=$(i,a,{owner:I.turn,kind:I.selectedKind,dir:I.selectedDir});o&&(I.selectedDir=o,!(R?.row===i&&R?.col===a)&&(R={row:i,col:a},Q()))}),e.addEventListener(`mouseleave`,()=>{!R||B||(R=null,Q())}),e.addEventListener(`dragover`,t=>{let n=e.dataset.cell;if(!n)return;let[r,i]=n.split(`,`),a=Number(r),o=Number(i);I.board[a][o]!==null||g(I)||v(I)||!$(a,o,{owner:I.turn,kind:I.selectedKind,dir:I.selectedDir})||(t.dataTransfer&&(t.dataTransfer.dropEffect=`copy`),t.preventDefault())}),e.addEventListener(`dragleave`,()=>{}),e.addEventListener(`drop`,t=>{if(t.preventDefault(),v(I)||g(I))return;let n=t.dataTransfer?.getData(`text/card-kind`);if(!n)return;let r=e.dataset.cell;if(!r)return;let[i,a]=r.split(`,`),c=Number(i),l=Number(a);s(I,n);let u=$(c,l,{owner:I.turn,kind:n,dir:I.selectedDir});u&&(I.selectedDir=u,o(I,c,l),B=!1,R=null,Q())}),e.addEventListener(`pointerdown`,t=>{if(t.button!==0)return;t.preventDefault();let n=e.dataset.cell;n&&p(n)}),e.addEventListener(`click`,()=>{let t=e.dataset.cell;t&&p(t)}),e.addEventListener(`keydown`,t=>{if(t.key!==`Enter`&&t.key!==` `)return;t.preventDefault();let n=e.dataset.cell;n&&p(n)})}function Le(e,t){return(typeof e==`string`?e.trim().replace(/\s+/g,` `):``)||t}function Re(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#039;`)}function ze(){try{let e=localStorage.getItem(Ee);if(!e)return[];let t=JSON.parse(e);return Array.isArray(t)?t:[]}catch{return[]}}async function Be(){H=!0,Te=!0,X=``,Q();try{let{loadScoresFromFirebase:e}=await Ce(async()=>{let{loadScoresFromFirebase:e}=await import(`./firebase-vsJINfje.js`);return{loadScoresFromFirebase:e}},[],import.meta.url);Y=await e()}catch{Y=ze(),X=`Could not reach the shared leaderboard. Local scores are shown instead.`}finally{Te=!1,Q()}}function Ve(e,t){if(!W)return;let n=new Date().toISOString(),r=ze(),i=[{id:`${n}-red`,name:q.red,score:e,team:`red`,mode:W,opponent:q.blue,isComputer:!1,playedAt:n},{id:`${n}-blue`,name:q.blue,score:t,team:`blue`,mode:W,opponent:q.red,isComputer:W===`solo`,playedAt:n}];J=!0;try{localStorage.setItem(Ee,JSON.stringify([...r,...i].slice(-200)))}catch{}Ce(async()=>{let{saveScoresToFirebase:e}=await import(`./firebase-vsJINfje.js`);return{saveScoresToFirebase:e}},[],import.meta.url).then(({saveScoresToFirebase:e})=>e(i)).catch(()=>{})}function He(){W!==`solo`||I.turn!==`blue`||v(I)||!G||(K=!0,Q(),window.setTimeout(()=>{Ue(G),K=!1,Q(),He()},650))}function Ue(e){let t=We(I,e);if(t.length){let n=e===`easy`?qe(t):t.sort((e,t)=>t.score-e.score)[0];s(I,n.kind),I.selectedDir=n.dir,o(I,n.row,n.col)}h(I)}function We(e,t){let n=[],r=[`n`,`e`,`s`,`w`];for(let i of ae(e,e.turn))if(!(i.count<=0))for(let a of r)for(let r=0;r<e.rows;r+=1)for(let s=0;s<e.cols;s+=1){let c=structuredClone(e);c.selectedKind=i.kind,c.selectedDir=a,o(c,r,s)&&n.push({kind:i.kind,dir:a,row:r,col:s,score:Ge(c,r,s,t)})}return n}function Ge(e,t,n,r){let i=e.turn,a=i===`red`?`blue`:`red`,o=e.board[t][n],s=e.evaluation.score[i],c=e.evaluation.score[a],l=k(o),u=0,d=0,f=0,p={n:`s`,e:`w`,s:`n`,w:`e`};for(let r of l){let i=r===`n`?[-1,0]:r===`e`?[0,1]:r===`s`?[1,0]:[0,-1],a=t+i[0],o=n+i[1],s=e.board[a]?.[o];s?k(s).includes(p[r])&&(u+=1):a>=0&&a<e.rows&&o>=0&&o<e.cols&&(f+=1),(t===0&&n===1&&r===`w`||t===1&&n===0&&r===`n`||t===e.rows-1&&n===e.cols-2&&r===`e`||t===e.rows-2&&n===e.cols-1&&r===`s`)&&(u+=1)}let m=[[t-1,n,`n`],[t,n+1,`e`],[t+1,n,`s`],[t,n-1,`w`]];for(let[t,n,r]of m){let i=e.board[t]?.[n];i&&(!l.includes(r)||!k(i).includes(p[r]))&&(d+=1)}let h=Je(e),g=`${t},${n}`,_=h.positive.has(g),v=h.negative.has(g),y=t+n,b=e.rows-1-t+(e.cols-1-n),x=(_?e.rows+e.cols-b:0)+(v?e.rows+e.cols-y:0),S=Math.abs(t-(e.rows-1)/2)+Math.abs(n-(e.cols-1)/2),w=!C(e),T=u*7+f*1.5-d*5+(_||v?12:0)+(_&&v?30:0)+x*1.5-S*.1+(w?0:-1e4),E=Math.random()*(r===`easy`?8:r===`medium`?2.5:.15);if(r===`easy`)return T+s*8+E;if(r===`medium`)return T*1.4+s*22-c*4+E;let ee=e.evaluation.bulbs.filter(e=>e.owner===i&&e.power>1e-9).length,D=e.board.flat().filter(e=>e?.owner===i&&e.kind===`bulb`).length,te=o.kind===`bulb`?Math.max(0,52-e.turnCount*4)+(D<=2?24:0):D<2&&e.turnCount<=8?-18:0,ne=Ke(e,t,n,o,i);return(s-c)*45+s*12+ee*8+T*2+te+ne+E}function Ke(e,t,n,r,i){let a=0,o=r.dir===`n`||r.dir===`s`?`vertical`:`horizontal`;if(r.kind===`bulb`)for(let r=0;r<e.rows;r+=1)for(let s=0;s<e.cols;s+=1){if(r===t&&s===n)continue;let c=e.board[r][s];c?.owner!==i||c.kind!==`bulb`||(c.dir===`n`||c.dir===`s`?`vertical`:`horizontal`)===o&&((o===`horizontal`?r===t:s===n)?a-=22:(a+=18,Math.abs(o===`horizontal`?r-t:s-n)<=2&&(a+=5)))}let s=[[t-1,n],[t,n+1],[t+1,n],[t,n-1]];for(let[t,n]of s){let o=e.board[t]?.[n];o?.owner===i&&(o.kind===`wire_t`||o.kind===`wire_cross`)&&(a+=r.kind===`bulb`?16:5)}let c=e.evaluation.bulbs.filter(e=>e.owner===i&&e.power>1e-9);if(c.length>=2){let e=Math.min(...c.map(e=>e.voltage)),t=Math.max(...c.map(e=>e.voltage));e>=10&&t-e<.25&&(a+=c.length*20)}return a}function qe(e){let t=[...e].sort((e,t)=>t.score-e.score),n=Math.max(1,Math.ceil(t.length*.2));return t[Math.floor(Math.random()*n)]}function Je(e){let t={n:`s`,e:`w`,s:`n`,w:`e`},n=n=>{let[r,i]=n.split(`,`).map(Number),a=e.board[r]?.[i];if(!a)return[];let o=[];for(let n of k(a)){let a=n===`n`?[-1,0]:n===`e`?[0,1]:n===`s`?[1,0]:[0,-1],s=r+a[0],c=i+a[1],l=e.board[s]?.[c];l&&k(l).includes(t[n])&&o.push(`${s},${c}`)}return o},r=e=>{let t=new Set,r=[...e];for(;r.length;){let e=r.shift();t.has(e)||(t.add(e),r.push(...n(e)))}return t},i=[],a=[],o=(t,n,r,i)=>{let a=e.board[n]?.[r];a&&k(a).includes(i)&&t.push(`${n},${r}`)};return o(i,0,1,`w`),o(i,1,0,`n`),o(a,e.rows-1,e.cols-2,`e`),o(a,e.rows-2,e.cols-1,`s`),{positive:r(i),negative:r(a)}}Q();