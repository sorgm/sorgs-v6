/*
    Mainboard, backend, etc.

    In html after body before html integrate js code:
    <script type="module">
        import {layout} from '../main.js'
        layout.footer.add("<...>")
    </script>

    or if you don't have own code
    <script src="../main.js" type="module"></script>
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
import {default as sitemap} from "./modules/sitemap.js"
import "./modules/toc.js"

(() => {
    function initialize() {
        if (document.readyState == "loading") return setTimeout(initialize);
    
        if (events.get("initialized").dispatched) return;
      
        layout.initHtmlStructure();
        layout.styleSheets.add("default.css");

        const dateEl = layout.footer.add(".");
        events.get("sitemap_ready").addListener(() => 
            dateEl.textContent = new Date((sitemap[location.pathname] ?? sitemap["/index.html"]).lastmod).toLocaleDateString());
        const dateElTitle = {"en": "Content last modified on", "de": "Inhalt zuletzt geändert am"}
        events.get("language_changed").addListener(() => 
            dateEl.title = (dateElTitle[document.documentElement.lang] ?? dateElTitle["en"]));
        const homeEl = layout.footer.add("<a href='index.html' rel='bookmark'>Home</a>");
        const homeElTitle = {"en": "Index of pages at sorgs.de", "de": "Übersicht der Seiten auf sorgs.de"}
        events.get("language_changed").addListener(() => 
            homeEl.title = (homeElTitle[document.documentElement.lang] ?? homeElTitle["en"]));
        layout.footer.add("<a href='impressum.html' rel='author license terms-of-service' title='Impressum'>Impressum</a>");
        
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
