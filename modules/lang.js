/*
    lang.js - Multi-Language support

    call initLanguage() for init

    TEXT and attributes of main HTML DOM tree are loaded
    according to language given in <html lang="?">

    Additional texts are retrieved from elements like:
    <script type="text/strings" lang="de">
    Script is treated as a data block if type is not javascript.
    Text content has to resemble the format given by toString()

    Additional event: "language_changed" is dispatched on language change
*/

import typing from './typing.js'
import layout from './layout.js'
import events from './events.js'

class LangElement {
    constructor(element, parentLang=document.documentElement.lang) {
        if (element == undefined) return this;
        typing.assert(element, Node);
        typing.assert(parentLang, String);

        this.tagName = element.tagName ?? "TEXT";
        this.element = element;
        this.lang = parentLang;
        this.attributes = [];
        if (element.attributes) {
            for(const a of element.attributes) { // of not in
                const attrName = a.name;
                if (attrName == "lang") {
                    if (!a.value && a.value!="" && a.value!="*") {
                        this.lang = a.value;
                    }
                }
                else if (["alt","placeholder","lang","title"].includes(attrName)) {
                    if (typeof(a.value) == "string") {
                        const attr = [attrName, a.value];
                        this.attributes.push(attr);
                    }
                }
            }
        }
        if (!element.tagName) {
            this.textContent = element.textContent.replace(/^\s*|\s*$/, '');
        }
        this.children = [];
        for(const c of element.childNodes) { // of not in // childNodes include text
            const tagName = (c.tagName ?? "TEXT");
            if (!["SCRIPT","STYLE","IFRAME","META"].includes(tagName)) {
                try {
                    const child = new LangElement(c,this.lang);
                    if (!child.isEmpty) {
                        this.children.push(child);
                    }
                }
                catch (e) {
                    console.error(`${e} when reading ${c} being child of ${element}`);
                }
            }
        }

        this.isEmpty = (this.attributes.length == 0 && this.textContent == "" && this.children.length == 0);
    }

    pair(to) {
        // set this element to element of pair including children
        typing.assert(to, LangElement);

        return this.#pairedWalker(to, (left,right) => left.element = right.element);
    }

    #pairedWalker(partner, callback) {
        // walk two hierarchies in parallel and callback(this,partner) for every match
        typing.assert(partner, LangElement);
        typing.assert(callback, Function);

        if (this.tagName != partner.tagName) {
            console.error(`Tag names differ: ${this.tagName} vs ${partner.tagName} in pairing`);
        }

        if (callback(this, partner) == false) return this;

        var iLeft = 0;
        var iRight = 0;
        var nextFittingLeft = iLeft;
        var nextFittingRight = iRight;

        while ((iLeft < this.children.length) 
            && (iRight < partner.children.length)) {

            nextFittingLeft = iLeft;
            nextFittingRight = iRight;
    
            // search next fitting
            while (this.children[nextFittingLeft].tagName != partner.children[iRight].tagName) {
                nextFittingLeft += 1;
                if (nextFittingLeft >= this.children.length) break;
            }
            while (this.children[iLeft].tagName != partner.children[nextFittingRight].tagName) {
                nextFittingRight += 1;
                if (nextFittingRight >= partner.children.length) break;
            }

            // check boundaries
            if ((nextFittingLeft >= this.children.length) 
                && (nextFittingRight >= partner.children.length)) {
                break;
            }

            // check parallelity
            if ((nextFittingLeft < this.children.length) 
                && (nextFittingRight >= partner.children.length)) {
                iLeft = nextFittingLeft;
            }
            else if ((nextFittingLeft >= this.children.length) 
                && (nextFittingRight < partner.children.length)) {
                iRight = nextFittingRight;
            }
            else{// both fit
                if ((nextFittingLeft - iLeft) <= (nextFittingRight - iRight)) {
                    iLeft = nextFittingLeft;
                }
                else {
                    iRight = nextFittingRight;
                }
            }

            this.children[iLeft].#pairedWalker(partner.children[iRight], callback);
            iLeft += 1;
            iRight += 1;
        }
        return this;
    }

    assign() {
        // like Object.assign but to assign new text to existing HTML elements
        var errors = [];

        if (this.tagName == "TEXT" && this.element) {
            try {this.element.textContent = ' '+this.textContent+' ';}
            catch (e) {errors.push(e);}
        }        
        for(const attr of this.attributes) {
            try {this.element.attributes[attr[0]] = attr[1];}
            catch (e) {errors.push(e);}
        }
        for(const child of this.children) {
            try {errors = errors.concat(child.assign());}
            catch (e) {errors.push(e);}
        }
        
        if (this.tagName == "HTML") {
            document.documentElement.lang = this.lang;
            events.language_changed.dispatchEvent();
        }

        return errors;
    }

    merge(from) {
        // like Object.assign but to assign new text to existing LangElement objects
        typing.assert(from, LangElement);

        return this.#pairedWalker(from, (l,r) => {
            if (l.tagName == "TEXT") {
                l.text = r.text;
            }

            // intersect attribute keys
            l.attributes.map(l1 => {
                r.attributes.map(r1 => {
                    if (l1[0] == r1[0]) l1[1] = r1[1];
                })
            });
        });
    }

    toString() {
        return this.#toString();
    }

    #toString(lang = undefined, indent = 2, pastIndentation = 0) {
        typing.assert(lang, String, undefined);
        typing.assert(indent, Number);
        typing.assert(pastIndentation, Number);

        const prefix = " ".repeat(pastIndentation);
        var result = prefix+this.tagName;
        if (this.lang != lang) {
            lang = this.lang
            result+=" ["+lang+"]";
        }
        if (this.textContent) {
            result+=" "+this.textContent;
        }
        for(const attr of this.attributes) {
            result += "\n"+prefix+"- "+attr[0]+"="+attr[1];
        }
        for(const child of this.children) {
            result += "\n"+child.#toString(lang, indent, pastIndentation + indent);
        }
        return result;
    }

    static fromLangString(langString, language) {
        typing.assert(langString, String);
        typing.assert(language, String, undefined);

        if (langString.replace(/^\s/,"")[0] == "<") {
            l = new LangElement(layout.createElementFromHtml(langString));
            return l;
        }
        return LangElement.#fromLangString(langString, language)["childElement"]
    }

    static #fromLangString(langString, language, previousIndent = -1) {
        var el;

        var re = [
            "(?<indent>^[ \\t]*)",
            "(?<tagName>\\w+)",
            "(?<spaceA>[ \\t]?)",
            "(?<language>(?:\\[\\w\\w])?)",
            "(?<spaceB>[ \\t]?)",
            "(?<text>.*)",
            "(?<nl>[$|\\n]?)"
        ]
        var parts = langString.match(re.join(""));

        if (!parts) throw new Error(
            `Lang string does not fit to pattern: ${langString.substring(0,50)}...`);

        var indent = parts.groups.indent.length;
        if (indent < previousIndent) {
            // end of child element, return home - this is why default<0
            return {childElement:el, remainingLangString:langString, newIndent:indent}
        }

        var lineString = parts.map((v,i) => i?v:"").join("");
        var lineLength = lineString.length;
        var langString = langString.substring(lineLength);
        //console.log(lineString);

        el = new LangElement(undefined);
        el.isEmpty = true;
        el.tagName = parts.groups.tagName;
        if (!parts.groups.language) {el.lang = language;}
        else {el.lang = parts.groups.language.substring(1,3);}
        if (parts.groups.text) {
            el.textContent = parts.groups.text;
            el.isEmpty = false;
        }

        // attributes
        re[0] = "(?<indent>^[ \t]+- )";

        el.attributes = [];
        while (parts) {
            parts = langString.match(re.join(""));

            if (parts) {
                lineString = parts.map((v,i) => i?v:"").join("");
                lineLength = lineString.length;
                langString = langString.substring(lineLength);
                //console.log(lineString);
        
                el.attributes[parts.groups.tagName] = parts.groups.text;
                el.isEmpty = false;
            }
        }

        // children
        el.children = [];
        var subEl = el;
        previousIndent = indent;
        while (subEl && langString!="") {
            const childResult = LangElement.#fromLangString(langString, el.lang, indent);
            if (childResult.childElement) {
                el.children.push(childResult.childElement);
                el.isEmpty = false;
            }
            langString = childResult.remainingLangString;
            indent = childResult.newIndent;
            if (indent<=previousIndent) break;
        }
        return {childElement:el, remainingLangString:langString, newIndent:indent};
    }
}

function appendLanguageFromLangElement(langElement, language) {
    typing.assert(langElement, LangElement);
    typing.assert(language, String);

    if (lang[language]) {
        lang[language].merge(langElement);
    }
    else {
        lang[language] = document.customLanguages[language] = langElement;
    }
    events.language_added.dispatchEvent();
    return langElement;
}

const lang = {
    init: initLanguage,
    append: appendLanguageFromLangElement,
    create: LangElement.fromLangString
}

export default lang;

function syncLanguages() {
    // sync with other instance
    if (!document["customLanguages"]) document.customLanguages = {};

    Object.keys(document.customLanguages).forEach(k => 
        lang[k] = document.customLanguages[k]);
    Object.keys(lang).forEach(k => 
        k.length<=2 ? document.customLanguages[k] = lang[k] : k);    
}

events.get("language_added").addListener(syncLanguages);

function languages() {
    // returns languages with existing text in preferred order

    var text_languages = Object.keys(lang)
        .filter(l => l.length<=2);

    var navigator_languages = navigator.languages
        .map(l => l.substring(0,2))
        .reduce((p,v) => p.includes(v)?p:p.concat([v]), []);

    var top_languages = navigator_languages
        .filter(l => text_languages.includes(l));

    var remaining_languages = text_languages
        .filter(l => !navigator_languages.includes(l));

    return top_languages.concat(remaining_languages);
}

events.get("language_changing").addListener((e) => {
    if (e.target.value) {
        const l = lang[e.target.value];
        if (l) l.assign();
        return true;
    }
    else return false;
});

function refreshLanguageSelector() {
    var lang_select_aside = layout.htmlElement.fromId("lang-select");
    var langs = languages();

    if ((!lang_select_aside) && (langs.length<=1)) return;

    if (langs.length<=1) {
        lang_select_aside.remove();
        return
    }

    if (!lang_select_aside) {
        lang_select_aside = layout.htmlElement.add("aside",document.querySelector("header"));
        lang_select_aside.id = "lang-select";
        var selector = layout.htmlElement.add("select",lang_select_aside)
        selector.title = "language-selector";
        events.capture(selector, "change", "language_changing");
    }
 
    var c = document.documentElement.lang; // current lang
    lang_select_aside.childNodes[0].innerHTML = 
        langs.map((v,i) => `<option value="${v}" ${v==c?'selected':''}">${v}</option>`).join("\n");
    lang_select_aside.children[0].value = c;
}

events.get("language_changed").addListener(refreshLanguageSelector);

function initLanguage() {
    syncLanguages();

    const documentLangElement = lang.append(
        new LangElement(document.documentElement), 
        document.documentElement.lang
    );

    Array.from(document.querySelectorAll("script[type='text/strings'][lang]"))
        .forEach(s => lang.append(
            lang.create(
                s.text.trim(),
                s.lang
            )
            .pair(documentLangElement),
            s.lang
        ));

    lang[languages()[0]].assign();
}

layout.styleSheets.add(`
    #lang-select {
        position: absolute;
        top: 0rem;
        right:2rem;
    }
`);