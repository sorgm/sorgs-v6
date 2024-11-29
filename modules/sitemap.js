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
        this.style = loc.split("/")[1];
        this.imgsrc = imgsrc;
        this.lastmod = lastmod;
        this.changefreq = changefreq;
    }

    static fromUrlEntry(urlEntry) {
        typing.assert(urlEntry, Object);

        Object.entries(urlEntry).map(([key, value]) => {
            const clang = document.documentElement.lang;
            var loc, thetitle, anytitle, imgsrc, lastmod, changefreq;
            switch (key) {
                case 'loc':
                    loc = value;
                    break;
                case 'sgl:title':
                    if (value['sgl:lang'] == clang) {
                        thetitle = value['sgl:lang'];
                    }
                    else {
                        anytitle = value['sgl:lang'];
                    }
                    break;
                case 'sgl:img':
                    imgsrc = value['sgl:src'];
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
                default:
                    console.log(`Unknown tag in sitemap: ${key}`);
            }
        });
        return new Webpage(loc, thetitle??anytitle, imgsrc, lastmod, changefreq);
    }
}

if (!document.sitemap) {
    document.sitemap = [];
}

async function fetch_sitemap(filename = "/sitemap.xml") {
    return fetch(filename)
    .then(res => res.text())
    .then(str => typing.string_to_xml(str))
    .then(xml => typing.xml_to_object(xml))
    .then(obj => obj.urlset.url.map(url => Webpage.fromUrlEntry(url)))
    .then(webpages => document.sitemap = webpages)
    .then(webpages => events.get("sitemap_ready").dispatch())
}

events.create("sitemap_ready");
events.get("language_changed").addListener(e => fetch_sitemap());

export default document.sitemap;