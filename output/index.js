/*!
 * event-subscribe cjs 0.3.0
 * (c) 2020 - 2021 jackness
 * Released under the MIT License.
 */
"use strict";Object.defineProperty(exports,"__esModule",{value:!0});var n={},e={},t=new Map,i=0;function r(n,e){return e?""+e:n+"-"+i++}var o={on:function(i,f,u,c){i in e?e[i].push(f):e[i]=[f],c&&o.off(i,c);var a=r(i,c);return t.set(a,f),u&&i in n&&f(n[i]),a},once:function(n,e){var t=this,i=this.on(n,(function(r){t.off(n,i),e(r)}),!1,r(n));return i},off:function(n,i){var r,o=e[n];if((null==o?void 0:o.length)&&(r="string"==typeof i?t.get(i):i)){var f=o.indexOf(r);-1!==f&&o.splice(f,1)}},trigger:function(t,i){t in e&&e[t].forEach((function(n){n(i)})),n[t]=i},replay:function(t){if(t in e&&t in n){var i=n[t];e[t].forEach((function(n){n(i)}))}},reset:function(){n={},e={},t.clear()}};exports.eventSubscribe=o;
