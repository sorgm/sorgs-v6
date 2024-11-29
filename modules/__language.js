export {LanguageHandler}
import {Style} from "./style.js"

var __lang__ = "navigator";
var __languagehandlers__ = [];
var __selector__ = undefined; // DIV element
var __sitemap__ = undefined; // Promise
var __sitemap_lang__ = undefined;

class LanguageHandler {
    #toggle;

    static prop = 'val';
    static meth() {return false;}
    static {
        //static init
    }

    constructor(lang = __lang__) {
        // default language or given language - global value in any case
        if (lang == "navigator") {
            if (document.querySelector("html").lang == "") {
                lang = this.defaultLanguage;
            }
            else {
                lang = document.querySelector("html").lang
            }
        }
        __lang__ = lang

        // local design for local HTML elements, toggle for lang marked elements
        const s = new Style(STYLE);
        this.#toggle = s.createToggle("hidden-language", "[lang]:not(q,blockquote)");

        // create language selector DIV if necessary
        if (!__selector__) {
            __selector__ = document.createElement("div");
            __selector__.classList.add("language-selector");
            document.header.append(__selector__);
        }

        const waitForInit=() => {
            if (!document.sgl) setTimeout(waitForInit)
            else this.refresh.bind(this);
        }
        waitForInit()
        __languagehandlers__.push(this);
    }

    get lang() {
        return __lang__
    }
    set lang(lang) {
        __lang__ = lang;
        __languagehandlers__.forEach(e => e.refresh());
        return __lang__;
    }

    refresh() {
        if (!document.sgl.events.refresh.dispatch()) {
            throw Error("refresh cancelled")
        };

        document.querySelector("html").lang = __lang__;

        __selector__.innerText = "";
        this.fittingLanguages.forEach(v => {
            const a = document.createElement("button");
            a.onclick = () => document.sgl.language.lang = `${v}`;
            a.innerText = v
            if (v == __lang__) {a.disabled = true;}
            __selector__.appendChild(a);
        })

        this.#toggle.switchTo(`[lang='${__lang__}']`);

        this.reloadSitemap().then(() => {
            this.localTitle.then(t => {
                document.title = `${t} | sorgs.de`;
                var h1 = document.querySelector("h1");
                if (!h1) {
                    var article = document.querySelector("article");
                    var header = document.querySelector("header");
                    if (!!header) header.prepend(h1 = document.createElement("h1"))
                    else if (!!article) article.prepend(h1 = document.createElement("h1"))
                    else document.body.prepend(h1 = document.createElement("h1"));
                }
                h1.innerHTML = `${t}`;
            });
        });

        __sitemap_lang__ = __lang__
    }

    get userLanguages() {
        return navigator.languages.reduce((prev,v) => {
            var short = v.substring(0,2);
            if (!prev.includes(short)) prev.push(short);
            return prev;
        }, [])
    }

    get htmlLanguages() {
        return Array.from(document.querySelectorAll("[lang]")).reduce((prev,v) => {
            var short = v.getAttribute("lang").substring(0,2);
            if (!prev.includes(short)) prev.push(short);
            return prev;
        }, [])
    }

    get fittingLanguages() {
        return this.userLanguages.filter(v => this.htmlLanguages.includes(v));
    }

    get defaultLanguage() {
        const fl = this.fittingLanguages
        if (fl.length > 0) {
            return fl[0];
        }
        else {
            return "en";
        }
    }

    reloadSitemap() {
        return __sitemap__ = fetch("/sitemap.xml")
        .then((r) => r.text())
        .then((t) => new DOMParser().parseFromString(t, "text/xml"))
        .then((xml) => {
            return Array.from(xml.getElementsByTagName("url")).map(e => {
                const loc = (
                    (e.getElementsByTagName("loc").length > 0)
                    ? e.getElementsByTagName("loc")[0].innerHTML
                    : ".").replace("https://sorgs.de", "");
                return {
                    loc: loc,
                    style: loc.split("/")[1],
                    title: (
                        (e.getElementsByTagName("sgl:title").length > 0)
                        ? Array.from(e.getElementsByTagName("sgl:title")).reduce((p,c) => {
                            const clang = c.getAttribute("sgl:lang");
                            if ((!!clang) && (clang == __lang__)) {
                                p = c.innerHTML;
                            }
                            return p;
                        }, e.getElementsByTagName("sgl:title")[0].innerHTML)
                        : loc),
                    imgsrc: (
                        (e.getElementsByTagName("sgl:img").length > 0)
                        ? e.getElementsByTagName("sgl:img")[0].getAttribute("sgl:src")
                        : undefined),
                    lastmod: new Date(
                        (e.getElementsByTagName("lastmod").length > 0)
                        ? e.getElementsByTagName("lastmod")[0].innerHTML
                        : undefined),
                    changefreq: (
                        (e.getElementsByTagName("changefreq").length > 0)
                        ? e.getElementsByTagName("changefreq")[0].innerHTML
                        : undefined)
                }
            });
        });
    }

    get sitemap() {
        if (__sitemap_lang__ == __lang__) {
            return __sitemap__;
        }
        else {
            return this.reloadSitemap();
        }
    }
    get localSitemapEntry() {
        var url = window.location.pathname;
        if (url.endsWith("/")) url += "index.html";

        return this.sitemap.then(
            s => s.reduce(
                (r,e) => url.endsWith(e.loc.replace("https://sorgs.de","")) ? e : r, 
                {
                    loc: document.URL,
                    title: document.title,
                    x: 1
                }
            , {}));
    }
    get localTitle() {
        return this.localSitemapEntry.then(e => e.title);
    }
}

const STYLE = `

    .hidden-language {
        display: none;
    }

    .language-selector {
        background-color: green;
        position: fixed;
        top: .5rem;
        right: .5rem;
    }

    .language-selector button:disabled {
        background-color: cyan;
        color: black;
        font-weight: bold;
    }

`;