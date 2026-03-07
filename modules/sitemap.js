import events from './events.js'
import typing from './typing.js'

class Webpage {
    constructor (loc, title, imgsrc, lastmod, changefreq) {
        typing.assert(loc, URL);
        typing.assert(title, String);
        typing.assert(imgsrc, URL, undefined);
        typing.assert(lastmod, Date, undefined);
        typing.assert(changefreq, String, undefined);

        this.location = loc;
        this.title = title;
        this.style = loc.pathname.split("/")[1];
        this.imgsrc = imgsrc;
        this.lastmod = lastmod;
        this.changefreq = changefreq;
    }

    static fromUrlEntry(urlEntry) {
        typing.assert(urlEntry, Object);
        const clang = document.documentElement.lang;
        var loc, title, imgsrc, lastmod, changefreq;

        Object.entries(urlEntry).map(([key, value]) => {
            if (value instanceof Array) {
                value = value.reduce((p,c) => (p == "" || c['sgl:lang'] == clang) ? c : p, "")
            }
            switch (key) {
                case 'loc':
                    loc = new URL(new URL(value).pathname, document.baseURI);
                    break;
                case 'sgl:title':
                    title = value.text ?? value;
                    break;
                case 'sgl:img':
                    imgsrc = new URL(new URL(value['sgl:src']).pathname, document.baseURI);
                    break;
                case 'lastmod':
                    lastmod = Date.parse(value);
                    break;
                case 'changefreq':
                    changefreq = value;
                    break;
                case 'text':
                    // ignore
                    break;
                case 'priority':
                    // ignore
                    break;
                default:
                    console.log(`Unknown tag in sitemap: ${key}`);
            }
        });
        try {
            return new Webpage(loc, title, imgsrc, lastmod, changefreq);
        }
        catch (e) {
            console.error(e, loc.href, title, imgsrc, lastmod, changefreq)
        }
    }
}

async function fetch_sitemap(filename = document.baseURI + "sitemap.xml") {
    return fetch(filename)
    .then(res => res.text())
    .then(str => typing.string_to_xml(str))
    .then(xml => typing.xml_to_object(xml))
    .then(obj => obj.urlset.url.map(url => Webpage.fromUrlEntry(url)))
    .then(webpages => Object.assign(sitemap, 
        Object.fromEntries(webpages.map((w) => [w.location.pathname,w]))))
    .then(_ => events.get("sitemap_ready").dispatchEvent())
}

events.create("sitemap_ready");
events.get("language_changed").addListener(e => fetch_sitemap());

const sitemap = {}

export default sitemap;