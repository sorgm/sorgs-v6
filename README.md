# sorgs.de v6

## Concept

sorgs.de v6 is a digital collection of diverse topics. Mainly these are coding samples and artistic impressions on topics from Maths, Physics, Genealogy, History, and Computer Sciences. It is meant to be self-contained and therefore uses nearly no external libraries. Nonetheless it is meant to be modern.

Manfred Sorg, September 2024

## Site structure

"Academic disciplines are conventionally divided into the humanities (including philosophy, language, art and cultural studies), the scientific disciplines (such as physics, chemistry, and biology), the formal sciences like mathematics and computer science; the social sciences are sometimes considered a fourth category."[[1]](#1) I follow this logic for site structure.

"The humanities include the studies of philosophy, religion, [history](#history), language [arts](#arts) (literature, writing, oratory, rhetoric, poetry, etc.), performing arts (theater, music, dance, etc.), and visual arts (painting, sculpture, photography, filmmaking, etc.)."[[2]](#2)

"Natural science can be divided into two main branches: life science and physical science. Life science is alternatively known as biology, and physical science is subdivided into branches: physics, chemistry, earth science, and astronomy."[[3]](#3)

"Formal science is a branch of science studying disciplines concerned with abstract structures described by formal systems, such as [logic](#logic), [mathematics](#maths), statistics, theoretical [computer science](#coding), artificial intelligence, information theory, game theory, systems theory, decision theory and theoretical linguistics."[[4]](#4)

"Social science is one of the branches of science, devoted to the study of societies and the relationships among members within those societies. The term was formerly used to refer to the field of sociology, the original "science of society", established in the 18th century. In addition to sociology, it now encompasses a wide array of academic disciplines, including anthropology, archaeology, economics, geography, linguistics, management, communication studies, psychology, culturology and political science."[[5]](#5)

### <a name="history">History and Genealogy</a>

"History (derived from Ancient Greek ἱστορία (historía) 'inquiry; knowledge acquired by investigation') is the systematic study and documentation of the human past. History is an academic discipline which uses a narrative to describe, examine, question, and analyze past events, and investigate their patterns of cause and effect."[[6]](#6)

"Genealogy (from Ancient Greek γενεαλογία (genealogía) 'the making of a pedigree') is the study of families, family history, and the tracing of their lineages."[[7]](#7)

### <a name="arts">Arts</a>

"The arts or creative arts are a vast range of human practices of creative expression, storytelling, and cultural participation. The arts encompass diverse and plural modes of thinking, doing, and being in an extensive range of media."[[8]](#8)

### <a name="logic">Logic</a>

"Logic is the study of correct reasoning. It includes both formal and informal logic. Formal logic is the study of deductively valid inferences or logical truths. It examines how conclusions follow from premises based on the structure of arguments alone, independent of their topic and content. Informal logic is associated with informal fallacies, critical thinking, and argumentation theory"[[9]](#9)

### <a name="maths">Mathematics / Maths</a>

"Mathematics is a field of study that discovers and organizes methods, theories and theorems that are developed and proved for the needs of empirical sciences and mathematics itself. There are many areas of mathematics, which include number theory (the study of numbers), algebra (the study of formulas and related structures), geometry (the study of shapes and spaces that contain them), analysis (the study of continuous changes), and set theory (presently used as a foundation for all mathematics)."[[10]](#10)

### <a name="coding">Computer science</a>

"Computer science is the study of computation, information, and automation.[1][2][3] Computer science spans theoretical disciplines (such as algorithms, theory of computation, and information theory) to applied disciplines (including the design and implementation of hardware and software)."[[11]](#11)

## Capabilities

From a technical point of view some features had to be implemented in modules in the backend. Aim is to implement near to nothing in the individual pages. The pages' codes should focus on the content itself. The standard tasks are made in the background. These are initiated by including **/main.js** as script or as import.

Implemented capabilities are:
- automated loading of modules, layout and stylesheets for consistent user experience.
- automated checking and sorting of document structure.
  ```html
  <html lang=".."><head><title/><link/><meta/><style/></head>
  <body><header><h1/></header><article/><aside/><footer/><script/></body></html>
  ```
- event structure for code events e.g. 
  ```js
  events.get("language-changed").addListener(..)
  ```
- sitemap-based index page, page titles and (soon) prev/next links
- multi-language text preparation via declaration
  ```html
  <script type="text/strings" lang="..">
  ```
- conditionally load [prism.js](https://prismjs.com/docs/) for syntax highlighting
  ```html
  <pre><code class="language-html">...</code></pre>
  ```
- automated table of contents with
  ```html
  <nav id="toc"></nav>
  ```
- assertion logic for pseudo-typed function parameters in javascript.
  ```js
  typing.assert(optionalObjectParameter, Object, undefined);
  ```

## References

<a name="1">[1]</a>
Wikipedia contributors. (2024, October 8). Academic discipline. In Wikipedia, The Free Encyclopedia. Retrieved 10:02, October 27, 2024, from https://en.wikipedia.org/w/index.php?title=Academic_discipline&oldid=1250174009

<a name="2">[2]</a>
Wikipedia contributors. (2024, October 3). Humanities. In Wikipedia, The Free Encyclopedia. Retrieved 09:30, October 27, 2024, from https://en.wikipedia.org/w/index.php?title=Humanities&oldid=1249115007

<a name="3">[3]</a>
Wikipedia contributors. (2024, October 8). Natural science. In Wikipedia, The Free Encyclopedia. Retrieved 09:32, October 27, 2024, from https://en.wikipedia.org/w/index.php?title=Natural_science&oldid=1250049167

<a name="4">[4]</a>
Wikipedia contributors. (2024, September 28). Formal science. In Wikipedia, The Free Encyclopedia. Retrieved 09:33, October 27, 2024, from https://en.wikipedia.org/w/index.php?title=Formal_science&oldid=1248196911

<a name="5">[5]</a>
Wikipedia contributors. (2024, October 26). Social science. In Wikipedia, The Free Encyclopedia. Retrieved 10:00, October 27, 2024, from https://en.wikipedia.org/w/index.php?title=Social_science&oldid=1253460608

<a name="6">[6]</a>
Wikipedia contributors. (2024, October 26). History. In Wikipedia, The Free Encyclopedia. Retrieved 09:00, October 27, 2024, from https://en.wikipedia.org/w/index.php?title=History&oldid=1253596363

<a name="7">[7]</a>
Wikipedia contributors. (2024, October 17). Genealogy. In Wikipedia, The Free Encyclopedia. Retrieved 08:58, October 27, 2024, from https://en.wikipedia.org/w/index.php?title=Genealogy&oldid=1251766567

<a name="8">[8]</a>
Wikipedia contributors. (2024, October 16). The arts. In Wikipedia, The Free Encyclopedia. Retrieved 08:55, October 27, 2024, from https://en.wikipedia.org/w/index.php?title=The_arts&oldid=1251565950

<a name="9">[9]</a>
Wikipedia contributors. (2024, October 9). Logic. In Wikipedia, The Free Encyclopedia. Retrieved 10:01, October 27, 2024, from https://en.wikipedia.org/w/index.php?title=Logic&oldid=1250287366

<a name="10">[10]</a>
Wikipedia contributors. (2024, October 17). Mathematics. In Wikipedia, The Free Encyclopedia. Retrieved 09:11, October 27, 2024, from https://en.wikipedia.org/w/index.php?title=Mathematics&oldid=1251637913

<a name="11">[11]</a>
Wikipedia contributors. (2024, October 15). Computer science. In Wikipedia, The Free Encyclopedia. Retrieved 11:34, October 27, 2024, from https://en.wikipedia.org/w/index.php?title=Computer_science&oldid=1251358141