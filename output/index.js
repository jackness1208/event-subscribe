/*!
 * eventbridge cjs 0.1.0
 * (c) 2020 - 2021 jackness
 * Released under the MIT License.
 */
"use strict";Object.defineProperty(exports,"__esModule",{value:!0});var n={},e={},i={on:function(i,t,r){i in e?e[i].push(t):e[i]=[t],r&&i in n&&t(n[i])},trigger:function(i,t){i in e&&e[i].forEach((function(n){n(t)})),n[i]=t},replay:function(i){if(i in e&&i in n){var t=n[i];e[i].forEach((function(n){n(t)}))}},reset:function(){n={},e={}}};exports.eventBridge=i;
