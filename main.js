/*
    Mainboard, backend, etc.

    In html after body before html integrate js code:
    <script type="module">
        import {footer} from '/main.js'
        footer.add("<...>")
    </script>

    or if you don't have own code
    <script src="/main.js" type="module"></script>
*/
export {default as layout} from "./modules/layout.js"
export {default as events} from "./modules/events.js"
export {default as lang} from "./modules/lang.js"
export {default as typing} from "./modules/typing.js"
export {default as jsext} from "./modules/jsext.js"
export {default as sitemap} from "./modules/sitemap.js"

import {default as events} from "./modules/events.js"
import {default as layout} from "./modules/layout.js"
import {default as lang} from "./modules/lang.js"
(() => {
    function initialize() {
        if (document.readyState == "loading") return setTimeout(initialize);
    
        if (events.get("initialized").dispatched) return;
      
        layout.initHtmlStructure();
        layout.styleSheets.add("/default.css");
        lang.init();

        events.initialized.dispatchEvent();
    }
    if (document.readyState != "loading") {
        initialize();
    }
    else {
        // script loaded synchronously
        setTimeout(initialize);
    }
})()
