/*!
 * event-subscribe cjs 0.2.0
 * (c) 2020 - 2021 jackness
 * Released under the MIT License.
 */
"use strict";Object.defineProperty(exports,"__esModule",{value:!0});var n={},e={},t=new Map,i=0,r={on:function(f,o,u,c){f in e?e[f].push(o):e[f]=[o],c&&r.off(f,c);var a=function(n,e){return e?""+e:n+"-"+i++}(f,c);return t.set(a,o),u&&f in n&&o(n[f]),a},off:function(n,i){var r,f=e[n];if((null==f?void 0:f.length)&&(r="string"==typeof i?t.get(i):i)){var o=f.indexOf(r);-1!==o&&f.splice(o,1)}},trigger:function(t,i){t in e&&e[t].forEach((function(n){n(i)})),n[t]=i},replay:function(t){if(t in e&&t in n){var i=n[t];e[t].forEach((function(n){n(i)}))}},reset:function(){n={},e={},t.clear()}};exports.eventSubscribe=r;
