import fun from './jsext.js'
  
function isClass(obj) {
    if (obj === undefined 
        || obj === null) {
        return false // is falsey
    }
    else if (typeof obj !== 'function') {
        return false // all classes are functions
    }
    else if (obj.toString 
        && obj.toString().startsWith('class')) {
        return true // user-defined classes are "class xyz {}"
    }
    else if (Function.prototype !== Object.getPrototypeOf(obj)) {
        return true // the class inherited another class; top level classes are Function
    }
    else if (obj.prototype
        && Object.getOwnPropertyNames(obj.prototype).length > 1) {
        return true // classes have a prototype with more properties and methods except constructor
    }
    else if (obj.prototype && !obj.caller) {
        // function() {} ::= [ 'length', 'name', 'arguments', 'caller', 'prototype' ]
        // class {} ::= [ 'length', 'prototype', 'name' ]
        // Arrow and async functions ::= [ 'length', 'name', 'caller' ]
        // Built-in classes like Element or String have all five arguments :(
        return true
    }
    else {
        return false // it's a function
    }
}

function assertType(parameterValue, expectedType) {

    function assertMultipleTypes(parameterValue, expectedType) {
        // wrapper for multiple types as alternatives
        var expectedTypes = Array.from(arguments).slice(1);
        try {
            var result = expectedTypes.reduce((result, oneType) => result 
            || assertSingleType(parameterValue, oneType, true), false)
        }
        catch (e) {
            throw new TypeError(`TypeError: ${e} during evaluation of "${parameterValue}" being ${expectedType} when calling typing.assert in ${fun.caller()}`)
        }
        if (!result) {
            throw new TypeError(`TypeError: "${parameterValue}" is not in ${expectedTypes.map(t => t.name)} when calling typing.assert in ${fun.caller()}`)
        }
        return true;
    }

    function assertSingleType(parameterValue, expectedType, falseOnError) {

        if (!expectedType && !parameterValue) {return true;}
        if (expectedType === null) {expectedType = Object}; // there is no null type for legacy reasons

        if (!isClass(expectedType)) {
            throw new TypeError(`TypeError: "${expectedType}" is not a type when calling typing.assert in ${fun.caller()}`)
        }

        if (!((typeof(parameterValue) === expectedType.name.toLowerCase()) 
            || (parameterValue instanceof expectedType))) {
            if (falseOnError) {
                return false;
            }
            else {
                throw new TypeError(`TypeError: "${parameterValue}" is not a ${expectedType.name} when calling typing.assert in ${fun.caller()}`)
            }
        }
        return true
    }

    if (arguments.length > 2) {
        return assertMultipleTypes(... arguments);
    }
    else {
        return assertSingleType(parameterValue, expectedType, false)
    }
}

function xml_to_object(xml) {
    typing.assert(xml, XMLDocument, Element);
    var result = {};

    function children_to_object(p,c) {
        const tagName = c.tagName ?? 'text';
        var obj = (tagName == 'text' ? c.textContent : xml_to_object(c));

        if (!p[tagName]) {p[tagName] = obj;}
        else if (p[tagName] instanceof Array) {p[tagName].push(obj);}
        else {p[tagName] = [p[tagName]]; p[tagName].push(obj);}

        return p;
    }

    if (xml instanceof XMLDocument) {
        result = Array.from(xml.children).reduce(children_to_object, {});
        return result;
    }

    if (xml.attributes && xml.attributes.length) {
        result = Object.assign(result,
            Array.from(xml.attributes)
            .reduce((p,c) => {p[c.name] = c.value; return p;}, {}));
    }

    result = Object.assign(result, 
        Array.from(xml.childNodes)
        .reduce(children_to_object, {}));

    // just return text if it's the only child
    const ok = Object.keys(result);
    if (ok.length == 1 && ok[0] == 'text') {result = result['text'];}

    return result;
}

function string_to_xml(str) {
    typing.assert(str, String)

    return new DOMParser().parseFromString(str, "text/xml")
}

const typing = {
    assert: assertType,
    isClass,
    xml_to_object,
    string_to_xml
}

export default typing;