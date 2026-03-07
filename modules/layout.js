import typing from './typing.js'

function createElementFromHtml(
    htmlString
) {
    typing.assert(htmlString, String);

    const parent = document.createElement("div");
    parent.innerHTML = htmlString;
    if (parent.children.length) {
        return parent.children[0];
    }
    else {
        return document.createTextNode(htmlString);
    }
}

async function appendStyle(fileNameOrCSS, callback=null) {
    typing.assert(fileNameOrCSS, String);
    typing.assert(callback, Function, null);

    const fileNamePattern = /^(http|\/|\.\/|\.\.\/)/;
    if (fileNameOrCSS.match(fileNamePattern)) {
        if (fileNameOrCSS.startsWith("/")) {
            fileNameOrCSS = document.baseURI + fileNameOrCSS.slice(1);
        }
        return await fetch(fileNameOrCSS)
        .then(response => response.text())
        .then(text => {
            var newStyle = document.createElement("style");
            newStyle.innerHTML = text;
            document.head.append(newStyle);
            return newStyle;
        })
        .then(style => !callback ? style : callback(style))
    }
    else {
        return new Promise((resolve,reject) => {
            var newStyle = document.createElement("style");
            newStyle.innerHTML = fileNameOrCSS;
            document.head.append(newStyle);
        })
    }
}

function appendNewElement(
    tagNameOrHtml, 
    parentElement,
    useExisting=true,
    positionBefore=-1,
    appendExistingElementsSelector=""
) {
    typing.assert(tagNameOrHtml, String);
    typing.assert(parentElement, Element, null);
    typing.assert(positionBefore, Number);
    typing.assert(appendExistingElementsSelector, String);

    var newElement;
    var topElement;
    if (tagNameOrHtml.match(/<.*>/)) {
        // tagNameOrHtml is Html
        newElement = createElementFromHtml(tagNameOrHtml);
        if (useExisting && parentElement) {
            Array.from(parentElement.children)
            .map(e => e.isEqualNode(newElement) ? newElement = e : null);
        }
        topElement = (newElement.tagName.toLowerCase() == 'html');
    }
    else {
        // tagNameOrHtml is tagName
        // try to find or else create it
        if (useExisting) {
            newElement = document.querySelector(tagNameOrHtml);
            if (newElement) { // found?
                topElement = (!newElement.parentElement) // only html has no parent
            }
        }
        if (!newElement) { // not found or not searched
            newElement = document.createElement(tagNameOrHtml);
            topElement = (newElement.tagName.toLowerCase() == 'html');
        }
    }
    
    // append or move but not html node or if parent is already fitting if given
    if ((!topElement) 
        && (parentElement != null) 
        && (!newElement.parentElement 
            || !newElement.parentElement.isSameNode(parentElement))) {

        var count = parentElement.childElementCount;
        if (positionBefore<-count) {parentElement.prepend(newElement);} // before children[0]
        else if (positionBefore<-1) {parentElement.children[count+positionBefore].after(newElement);}
        else if (positionBefore==-1) {parentElement.append(newElement);} // after children[count-1]
        else if (positionBefore==0) {parentElement.prepend(newElement);} // before children[0]
        else if (positionBefore<count) {parentElement.children[positionBefore].before(newElement);}
        else /*(positionBefore>=count)*/ {parentElement.append(newElement);} // after children[count]
    }

    if (appendExistingElementsSelector != "") {
        // move selected if they're not there yet
        Array.from(document.querySelectorAll(appendExistingElementsSelector))
        .map(el => el.parentElement.isSameNode(newElement) ? null : newElement.append(el));
    }
    return newElement;
}

function select(selectors) {
    typing.assert(selectors, String);
    return Array.from(document.querySelectorAll(selectors));
}

function prependFooter(htmlString) {
    typing.assert(htmlString, String);

    var footer = document.querySelector("footer")
    if (!footer) {
        footer = appendNewElement("footer", document.body)
    }
    footer.prepend(" - ")
    var el = createElementFromHtml(htmlString)
    footer.prepend(el)
    return el
}

function initHtmlStructure() {
    // Define standard HTML structure and store standard nodes in document
    // <head><title></title><meta name="viewport" .../></head>
    // <body><header><h1></h1><nav></nav></header><article></article><footer></footer></body>

    if (document.doctype.name != "html") {
        throw new Error("Doctype is not html!")
    };
    appendNewElement("html",null,true,0,"base, head, body");
    if (!document.documentElement.attributes.getNamedItem("lang")) {
        document.documentElement.lang = "und" // undefined
    }
    var baseEl = appendNewElement("base", document.documentElement, true, 0);
    // set base to parent of main.js to make all links relative to it; don't overwrite "base"
    baseEl.href = '/' + import.meta.url.split('/').slice(3, -2).map(s=>s+ '/').join('');

    appendNewElement("head", document.documentElement, true, 0, "title, link, meta, style");

    // meta tags must be part of original html file
    var meta = [{"charset":"UTF-8"}, 
        {"name":"google-site-verification", "content":"d7ufTXK2lwvT5S9JJmFloyXXNGC2GJOL6e9-Pq4DqI0"},
        {"name":"viewport", "content":"width=device-width"}]
    
    for(const m of meta) {
        var selector1 = "meta"+Object.entries(m).map(([k,v]) => `[${k}="${v}"]`).join("");
        var selector2 = "meta"+Object.entries(m).map(([k,v]) => `[${k}${k=='name'?'="'+v+'"':''}]`).join("");
        var fragment = "<meta"+Object.entries(m).map(([k,v]) => ` ${k}="${v}"`).join("")+">";
        //console.log(selector1,selector2,fragment)
        var el1 = document.querySelector(selector1);
        var el2 = document.querySelector(selector2);
        if (el2 && !el1) {
            console.log(fragment,"is recommended to set in HEAD.");
        }
        if (!el2) {
            console.warn(fragment,"is missing in HEAD.");
            appendNewElement(fragment, document.head)
        }
    }

    appendNewElement("body", document.documentElement, true, 1, "header, article:not(article article), aside:not(aside aside), footer:not(footer footer), script");
    var header = appendNewElement("header", document.body, true, 0, "nav, h1:first-of-type");
    appendNewElement("h1", header).innerHTML = document.title.replace(' - sorgs.de','');
    //appendNewElement("nav", header); is optional
    var article = appendNewElement("article", document.body, true, 1, "body>*:not(header, main, article, aside, footer, script)");
    var footer = appendNewElement("footer", document.body, true, -1);

    Array.from(document.querySelectorAll("a[target]:not([rel])")).forEach((v,i,a) => v.rel = "noopener noreferrer"); // avoid exploitation of the window.opener API.

    if (document.querySelector("code[class*=language-]")) {
        // load code highlighting library prism
        appendStyle("https://cdnjs.cloudflare.com/ajax/libs/prism/1.23.0/themes/prism.min.css");
        appendNewElement("script", article, false)
        .src = "https://cdnjs.cloudflare.com/ajax/libs/prism/1.23.0/prism.min.js";
    }
}

const layout = {
    initHtmlStructure,
    htmlElement: {
        add: appendNewElement,
        fromId: elementId => document.getElementById(elementId),
        fromHtml: createElementFromHtml,
        fromSelector: selectors => document.querySelector(selectors),
        fromPoint: (x,y) => document.elementFromPoint(x,y),
        select: select
    },
    styleSheets: {
        item: () => document.styleSheets.item,
        length: () => document.styleSheets.length,
        add: appendStyle
    },
    footer: {
        add: prependFooter
    }
}

export default layout;

appendStyle(`
    header h1:first-of-type {
        position: fixed;
        top: 0rem;
        left: 0rem;
        width: 100%;
        margin: 0rem !important;
        border: 0rem;
        padding: 0rem 1rem;
        background-color: cyan;
        color: black;
        font-size: 2rem;
    }
    header h1 {
        margin: 0rem;
        border: 0rem;
        padding: 0rem;
    }
    footer {
        position: fixed;
        bottom: 0rem;
        left: 0rem;
        width: 100%;
        height: 1.5rem;
        margin: 0rem;
        border: 0rem;
        padding: 0rem 1rem;
        background-color: gray;
        color: whitesmoke;
    }
    footer a {
        background-color: gray;
        color: whitesmoke !important;
    }
    footer div, footer address {
        display: inline-block;
    }
    iframe {
        width: 100%;
        height: 10000rem;
        border: none;
    }
`);
