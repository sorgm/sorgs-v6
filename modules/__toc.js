export {TableOfContent}

class TableOfContent {

    constructor(minlevel=2, maxlevel=3) {
        this.headerSelector = Array(maxlevel+1-minlevel).fill().map((v,i) => `H${i+minlevel}`).join(", ");
        document.sgl.events.refresh.listen(this.refresh.bind(this))
    }

    refresh() {
        var oldLevel = 1;
        var retval = Array.from(document.querySelectorAll(this.headerSelector)).map(el => {
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
        document.nav.innerHTML = retval;
    }

}
