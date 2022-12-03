// ==UserScript==
// @name         with new word selectable
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.arealme.com/vocabulary-size-test/en/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=arealme.com
// @grant        none
// @run-at         document-idle
// ==/UserScript==

(function () {
  "use strict";
  function act() {
    var divs = document.getElementsByClassName("answer");
    console.log("answers", divs.length);
    if (divs.length > 0) {
      for (var i = 0; i < divs.length; i++) {
        let div = divs[i];
        var newDiv = document.createElement("div");
        newDiv.style.display = "flex";
        var newContent = document.createTextNode(div.textContent);
        newDiv.appendChild(newContent);
        divs[i].after(newDiv);
      }
    } else {
      return false;
    }

    return true;
  }
  let id = setInterval(() => {
    const r = act();
    if (r == true) {
      console.log("clearup. Have fun :)");
      clearInterval(id);
    }
  }, 2000);
})();
