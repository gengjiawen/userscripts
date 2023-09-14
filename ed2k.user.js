// ==UserScript==
// @name         get ed2k or other staff
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  print ed2ks to console
// @author       You
// @match        **/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.com
// @grant        none
// ==/UserScript==

;(function () {
  let ed2ks = Array.from(document.body.getElementsByTagName('a'))
    .filter((i) => i.getAttribute('href')?.startsWith('ed2k'))
    .map((i) => i.getAttribute('href'))
    .join('\n')
  console.log(ed2ks)
})()
