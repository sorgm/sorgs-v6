import {Style, Footer} from "/modules/style.js"
import {LanguageHandler} from "/modules/language.js";

document.createElementFromHtml = (htmlString) => {
    const parent = document.createElement("template");
    parent.innerHTML = htmlString;
    return parent.content.firstChild;
}

// Define standard HTML structure and store standard nodes in document
// <head><title></title><meta name="viewport" .../></head>
// <body><header><h1></h1><nav></nav></header><article></article><footer></footer></body>

function addUniqueElementAsChildOf(tagName, parentElement, position=1, moveSelector="") {
    var newElement = document.querySelector(tagName);
    if (!newElement) {newElement = document.createElement(tagName);}
    else if (!newElement.parentElement) {return newElement;}
    else if (newElement.parentElement.tagName == parentElement.tagName) {return newElement;}

    if (position==0) {parentElement.prepend(newElement);}
    else if (position==-1) {parentElement.append(newElement);}
    else if (position>parentElement.childElementCount) {parentElement.append(newElement);}
    else {parentElement.children[position-1].after(newElement);}

    if (moveSelector != "") {
        Array.from(document.querySelectorAll(moveSelector))
        .map(el=>newElement.append(el));
    }
    return newElement;
}

addUniqueElementAsChildOf("html",document,1,"*");
addUniqueElementAsChildOf("head",document.documentElement,0,"meta, style, title, script");
addUniqueElementAsChildOf("body",document.documentElement,1,"html>*:not(head)");
document.header = addUniqueElementAsChildOf("header",document.body,0,"nav, h1");
addUniqueElementAsChildOf("h1",document.header);
document.nav = addUniqueElementAsChildOf("nav",document.header);
document.article = addUniqueElementAsChildOf("article",document.body,1,"body>*:not(header,article,footer)");
document.footer = addUniqueElementAsChildOf("footer",document.body,-1);

if (!document.querySelector("meta[name=viewport]")) {
    document.head.prepend(
        document.createElementFromHtml(`<meta name="viewport" content="width=device-width">`)
    );
}

// Eventhandling simplified by binding to an HTMLElement
class BoundEvent extends Event {
    constructor(type, onElement=document) {
        super(type);
        this.element = onElement;
    }
    dispatch() {
        this.element.dispatchEvent(this);
    }
    listen(listener, callNow = true) {
        if (callNow) setTimeout(listener);
        this.element.addEventListener(this.type, listener);
        return this;
    }
    stopListening(listener) {
        this.element.removeEventListener(this.type, listener);
        return this;
    }
}

// sorgs global library
document.sgl = {
    language: new LanguageHandler(),
    footer: new Footer(),
    defaultStyle: new Style("/default.css"),
    events: {
        refresh: new BoundEvent("refresh")
    }
}

// Fill footer
document.sgl.language.localSitemapEntry.then(e => {
    document.sgl.footer.add("lastmod", {
        "en":`<time datetime="${e.lastmod.toISOString()}" title="content last changed at // form might have changed later">${e.lastmod.toLocaleDateString()}</time>`,
        "de":`<time datetime="${e.lastmod.toISOString()}" title="Inhalt zuletzt geändert am // Darstellungsform kann sich später geändert haben">${e.lastmod.toLocaleDateString()}</time>`
    }, document.sgl.language.lang);
    document.sgl.footer.add("Home", `<a href="/">Home</a>`);
    document.sgl.footer.add("Impressum", `<address><a href="/impressum.html">Impressum</a></address>`);
});
