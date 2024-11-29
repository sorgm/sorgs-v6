export {Style, Footer}

class Style {
    #element;
    constructor(style) {
        const el = document.createElement("style");
        if (style.includes("\n")) {
            // multi-line equals css code
            el.textContent = style;
        }
        else {
            // single line is interpreted as filename
            fetch(style)
            .then(r => r.text())
            .then(t => el.textContent = t);
        }
        document.head.appendChild(el);
        this.#element = el;
    }

    createToggle(classname, elementsSelector) {
        class Toggle {
            #classname; #elementsSelector;
            constructor(classname, elementsSelector) {
                this.#classname = classname;
                this.#elementsSelector = elementsSelector;
            }
            switchTo(selector) {
                const all = document.querySelectorAll(elementsSelector);
                const selected = document.querySelectorAll(selector);
                for (const el of all) {
                    var isSelected = false;
                    for (const sel of selected) {
                        if (el.isEqualNode(sel)) {
                            isSelected = true;
                        }
                    }
                    if (isSelected == false) {
                        el.classList.add(this.#classname)
                    }
                    else {
                        el.classList.remove(this.#classname)
                    }
                }
            }
        }
        return new Toggle(classname, elementsSelector);
    }
}

class Footer {
    footer; entries; // class variables

    constructor() {
        if (!Footer.footer) {
            Footer.footer = document.querySelector("footer");
            Footer.entries = {}
        }
        if (!Footer.footer) {
            const footer = document.createElement("footer");
            document.body.appendChild(footer);
            Footer.footer = footer;
        }
    }
    refresh() {
        Footer.footer.innerHTML = Object.values(Footer.entries).reverse().join(" - ")
    }
    add(key, value, lang = "") {
        if ((lang != "") && (typeof value == "object")) {
            Footer.entries[key] = value[lang];
            document.sgl.events.refresh.listen(() => {
                Footer.entries[key] = value[document.sgl.language.lang];
                this.refresh();
            });
        } else {
            Footer.entries[key] = value;
        }
        this.refresh();
    }
    remove(key) {
        delete Footer.entries[key];
        this.refresh();
    }
}

new Style(`
body {
    padding: 3rem 1rem 2rem 1rem !important;
}
h1 {
    position: fixed;
    top: 0rem;
    left: 0rem;
    width: 100%;
    margin: 0rem !important;
    border: 0rem;
    padding: 0rem 1rem; /* top/bottom left/right */
    background-color: cyan;
    color: black;
    font-size: 2rem;
}

footer {
    position: fixed;
    bottom: 0rem;
    left: 0rem;
    width: 100%;
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
}`);
