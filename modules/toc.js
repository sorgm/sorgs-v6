import {default as layout} from "./layout.js"
import {default as events} from "./events.js"

const HEADER_SELECTOR = "h2, h3, h4";

function refresh() {
    var oldLevel = 1;
    var retval = Array.from(document.querySelectorAll(HEADER_SELECTOR)).map(el => {
        var anchor = el.querySelector("a[name]");
        var anchorName = "";
        if (!anchor) {
            var anchorName = encodeURIComponent(el.innerText);
            el.innerHTML = `<a name="${anchorName}">`+el.innerHTML+"</a>";
        } else {
            var anchorName = anchor.getAttribute("name");
        }

        var retval = "";
        var level = Number.parseInt(el.tagName.replace("H",""));

        while (oldLevel < level) {
            oldLevel += 1;
            retval += `<ul class="H${oldLevel}">`;
        }
        while (oldLevel > level) {
            oldLevel -= 1;
            retval += "</li></ul>";
        }

        retval += `<li><a href="#${anchorName}">${el.innerText}</a>`;

        return retval;
    }).join("")
    while (oldLevel > 1) {
        oldLevel -= 1;
        retval += "</li></ul>";
    }
    document.querySelector("#toc").innerHTML = retval;
}

if (document.querySelector("#toc")) {
    events.get("language_changed").addListener(refresh);
}

layout.styleSheets.add(`
#toc {columns: 10rem auto !important; font-size: .5rem !important;}
#toc .H1 {list-style: none; margin: 0; padding: 0; font-weight: bold; font-size: bigger;}
#toc .H2 {list-style: none; margin: 0; padding: 0; font-weight: bold;}
#toc .H3 {list-style: disc outside; padding-left: 0rem; font-weight: normal;}
#toc .H4 {list-style: circle inside; padding-left: 0rem; font-weight: normal;}
#toc a {text-decoration: none;}
`)