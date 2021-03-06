(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
        typeof define === 'function' && define.amd ? define(['exports'], factory) :
            (global = global || self, factory(global.csso = {}));
}(this, (function (exports) { 'use strict';

    //
    //                              list
    //                            ┌──────┐
    //             ┌──────────────┼─head │
    //             │              │ tail─┼──────────────┐
    //             │              └──────┘              │
    //             ▼                                    ▼
    //            item        item        item        item
    //          ┌──────┐    ┌──────┐    ┌──────┐    ┌──────┐
    //  null ◀──┼─prev │◀───┼─prev │◀───┼─prev │◀───┼─prev │
    //          │ next─┼───▶│ next─┼───▶│ next─┼───▶│ next─┼──▶ null
    //          ├──────┤    ├──────┤    ├──────┤    ├──────┤
    //          │ data │    │ data │    │ data │    │ data │
    //          └──────┘    └──────┘    └──────┘    └──────┘
    //

    function createItem(data) {
        return {
            prev: null,
            next: null,
            data: data
        };
    }

    function allocateCursor(node, prev, next) {
        var cursor;

        if (cursors !== null) {
            cursor = cursors;
            cursors = cursors.cursor;
            cursor.prev = prev;
            cursor.next = next;
            cursor.cursor = node.cursor;
        } else {
            cursor = {
                prev: prev,
                next: next,
                cursor: node.cursor
            };
        }

        node.cursor = cursor;

        return cursor;
    }

    function releaseCursor(node) {
        var cursor = node.cursor;

        node.cursor = cursor.cursor;
        cursor.prev = null;
        cursor.next = null;
        cursor.cursor = cursors;
        cursors = cursor;
    }

    var cursors = null;
    var List = function() {
        this.cursor = null;
        this.head = null;
        this.tail = null;
    };

    List.createItem = createItem;
    List.prototype.createItem = createItem;

    List.prototype.updateCursors = function(prevOld, prevNew, nextOld, nextNew) {
        var cursor = this.cursor;

        while (cursor !== null) {
            if (cursor.prev === prevOld) {
                cursor.prev = prevNew;
            }

            if (cursor.next === nextOld) {
                cursor.next = nextNew;
            }

            cursor = cursor.cursor;
        }
    };

    List.prototype.getSize = function() {
        var size = 0;
        var cursor = this.head;

        while (cursor) {
            size++;
            cursor = cursor.next;
        }

        return size;
    };

    List.prototype.fromArray = function(array) {
        var cursor = null;

        this.head = null;

        for (var i = 0; i < array.length; i++) {
            var item = createItem(array[i]);

            if (cursor !== null) {
                cursor.next = item;
            } else {
                this.head = item;
            }

            item.prev = cursor;
            cursor = item;
        }

        this.tail = cursor;

        return this;
    };

    List.prototype.toArray = function() {
        var cursor = this.head;
        var result = [];

        while (cursor) {
            result.push(cursor.data);
            cursor = cursor.next;
        }

        return result;
    };

    List.prototype.toJSON = List.prototype.toArray;

    List.prototype.isEmpty = function() {
        return this.head === null;
    };

    List.prototype.first = function() {
        return this.head && this.head.data;
    };

    List.prototype.last = function() {
        return this.tail && this.tail.data;
    };

    List.prototype.each = function(fn, context) {
        var item;

        if (context === undefined) {
            context = this;
        }

        // push cursor
        var cursor = allocateCursor(this, null, this.head);

        while (cursor.next !== null) {
            item = cursor.next;
            cursor.next = item.next;

            fn.call(context, item.data, item, this);
        }

        // pop cursor
        releaseCursor(this);
    };

    List.prototype.forEach = List.prototype.each;

    List.prototype.eachRight = function(fn, context) {
        var item;

        if (context === undefined) {
            context = this;
        }

        // push cursor
        var cursor = allocateCursor(this, this.tail, null);

        while (cursor.prev !== null) {
            item = cursor.prev;
            cursor.prev = item.prev;

            fn.call(context, item.data, item, this);
        }

        // pop cursor
        releaseCursor(this);
    };

    List.prototype.forEachRight = List.prototype.eachRight;

    List.prototype.nextUntil = function(start, fn, context) {
        if (start === null) {
            return;
        }

        var item;

        if (context === undefined) {
            context = this;
        }

        // push cursor
        var cursor = allocateCursor(this, null, start);

        while (cursor.next !== null) {
            item = cursor.next;
            cursor.next = item.next;

            if (fn.call(context, item.data, item, this)) {
                break;
            }
        }

        // pop cursor
        releaseCursor(this);
    };

    List.prototype.prevUntil = function(start, fn, context) {
        if (start === null) {
            return;
        }

        var item;

        if (context === undefined) {
            context = this;
        }

        // push cursor
        var cursor = allocateCursor(this, start, null);

        while (cursor.prev !== null) {
            item = cursor.prev;
            cursor.prev = item.prev;

            if (fn.call(context, item.data, item, this)) {
                break;
            }
        }

        // pop cursor
        releaseCursor(this);
    };

    List.prototype.some = function(fn, context) {
        var cursor = this.head;

        if (context === undefined) {
            context = this;
        }

        while (cursor !== null) {
            if (fn.call(context, cursor.data, cursor, this)) {
                return true;
            }

            cursor = cursor.next;
        }

        return false;
    };

    List.prototype.map = function(fn, context) {
        var result = new List();
        var cursor = this.head;

        if (context === undefined) {
            context = this;
        }

        while (cursor !== null) {
            result.appendData(fn.call(context, cursor.data, cursor, this));
            cursor = cursor.next;
        }

        return result;
    };

    List.prototype.filter = function(fn, context) {
        var result = new List();
        var cursor = this.head;

        if (context === undefined) {
            context = this;
        }

        while (cursor !== null) {
            if (fn.call(context, cursor.data, cursor, this)) {
                result.appendData(cursor.data);
            }
            cursor = cursor.next;
        }

        return result;
    };

    List.prototype.clear = function() {
        this.head = null;
        this.tail = null;
    };

    List.prototype.copy = function() {
        var result = new List();
        var cursor = this.head;

        while (cursor !== null) {
            result.insert(createItem(cursor.data));
            cursor = cursor.next;
        }

        return result;
    };

    List.prototype.prepend = function(item) {
        //      head
        //    ^
        // item
        this.updateCursors(null, item, this.head, item);

        // insert to the beginning of the list
        if (this.head !== null) {
            // new item <- first item
            this.head.prev = item;

            // new item -> first item
            item.next = this.head;
        } else {
            // if list has no head, then it also has no tail
            // in this case tail points to the new item
            this.tail = item;
        }

        // head always points to new item
        this.head = item;

        return this;
    };

    List.prototype.prependData = function(data) {
        return this.prepend(createItem(data));
    };

    List.prototype.append = function(item) {
        return this.insert(item);
    };

    List.prototype.appendData = function(data) {
        return this.insert(createItem(data));
    };

    List.prototype.insert = function(item, before) {
        if (before !== undefined && before !== null) {
            // prev   before
            //      ^
            //     item
            this.updateCursors(before.prev, item, before, item);

            if (before.prev === null) {
                // insert to the beginning of list
                if (this.head !== before) {
                    throw new Error('before doesn\'t belong to list');
                }

                // since head points to before therefore list doesn't empty
                // no need to check tail
                this.head = item;
                before.prev = item;
                item.next = before;

                this.updateCursors(null, item);
            } else {

                // insert between two items
                before.prev.next = item;
                item.prev = before.prev;

                before.prev = item;
                item.next = before;
            }
        } else {
            // tail
            //      ^
            //      item
            this.updateCursors(this.tail, item, null, item);

            // insert to the ending of the list
            if (this.tail !== null) {
                // last item -> new item
                this.tail.next = item;

                // last item <- new item
                item.prev = this.tail;
            } else {
                // if list has no tail, then it also has no head
                // in this case head points to new item
                this.head = item;
            }

            // tail always points to new item
            this.tail = item;
        }

        return this;
    };

    List.prototype.insertData = function(data, before) {
        return this.insert(createItem(data), before);
    };

    List.prototype.remove = function(item) {
        //      item
        //       ^
        // prev     next
        this.updateCursors(item, item.prev, item, item.next);

        if (item.prev !== null) {
            item.prev.next = item.next;
        } else {
            if (this.head !== item) {
                throw new Error('item doesn\'t belong to list');
            }

            this.head = item.next;
        }

        if (item.next !== null) {
            item.next.prev = item.prev;
        } else {
            if (this.tail !== item) {
                throw new Error('item doesn\'t belong to list');
            }

            this.tail = item.prev;
        }

        item.prev = null;
        item.next = null;

        return item;
    };

    List.prototype.push = function(data) {
        this.insert(createItem(data));
    };

    List.prototype.pop = function() {
        if (this.tail !== null) {
            return this.remove(this.tail);
        }
    };

    List.prototype.unshift = function(data) {
        this.prepend(createItem(data));
    };

    List.prototype.shift = function() {
        if (this.head !== null) {
            return this.remove(this.head);
        }
    };

    List.prototype.prependList = function(list) {
        return this.insertList(list, this.head);
    };

    List.prototype.appendList = function(list) {
        return this.insertList(list);
    };

    List.prototype.insertList = function(list, before) {
        // ignore empty lists
        if (list.head === null) {
            return this;
        }

        if (before !== undefined && before !== null) {
            this.updateCursors(before.prev, list.tail, before, list.head);

            // insert in the middle of dist list
            if (before.prev !== null) {
                // before.prev <-> list.head
                before.prev.next = list.head;
                list.head.prev = before.prev;
            } else {
                this.head = list.head;
            }

            before.prev = list.tail;
            list.tail.next = before;
        } else {
            this.updateCursors(this.tail, list.tail, null, list.head);

            // insert to end of the list
            if (this.tail !== null) {
                // if destination list has a tail, then it also has a head,
                // but head doesn't change

                // dest tail -> source head
                this.tail.next = list.head;

                // dest tail <- source head
                list.head.prev = this.tail;
            } else {
                // if list has no a tail, then it also has no a head
                // in this case points head to new item
                this.head = list.head;
            }

            // tail always start point to new item
            this.tail = list.tail;
        }

        list.head = null;
        list.tail = null;

        return this;
    };

    List.prototype.replace = function(oldItem, newItemOrList) {
        if ('head' in newItemOrList) {
            this.insertList(newItemOrList, oldItem);
        } else {
            this.insert(newItemOrList, oldItem);
        }

        this.remove(oldItem);
    };

    var List_1 = List;

    var createCustomError = function createCustomError(name, message) {
        // use Object.create(), because some VMs prevent setting line/column otherwise
        // (iOS Safari 10 even throws an exception)
        var error = Object.create(SyntaxError.prototype);
        var errorStack = new Error();

        error.name = name;
        error.message = message;

        Object.defineProperty(error, 'stack', {
            get: function() {
                return (errorStack.stack || '').replace(/^(.+\n){1,3}/, name + ': ' + message + '\n');
            }
        });

        return error;
    };

    var MAX_LINE_LENGTH = 100;
    var OFFSET_CORRECTION = 60;
    var TAB_REPLACEMENT = '    ';

    function sourceFragment(error, extraLines) {
        function processLines(start, end) {
            return lines.slice(start, end).map(function(line, idx) {
                var num = String(start + idx + 1);

                while (num.length < maxNumLength) {
                    num = ' ' + num;
                }

                return num + ' |' + line;
            }).join('\n');
        }

        var lines = error.source.split(/\r\n?|\n|\f/);
        var line = error.line;
        var column = error.column;
        var startLine = Math.max(1, line - extraLines) - 1;
        var endLine = Math.min(line + extraLines, lines.length + 1);
        var maxNumLength = Math.max(4, String(endLine).length) + 1;
        var cutLeft = 0;

        // column correction according to replaced tab before column
        column += (TAB_REPLACEMENT.length - 1) * (lines[line - 1].substr(0, column - 1).match(/\t/g) || []).length;

        if (column > MAX_LINE_LENGTH) {
            cutLeft = column - OFFSET_CORRECTION + 3;
            column = OFFSET_CORRECTION - 2;
        }

        for (var i = startLine; i <= endLine; i++) {
            if (i >= 0 && i < lines.length) {
                lines[i] = lines[i].replace(/\t/g, TAB_REPLACEMENT);
                lines[i] =
                    (cutLeft > 0 && lines[i].length > cutLeft ? '\u2026' : '') +
                    lines[i].substr(cutLeft, MAX_LINE_LENGTH - 2) +
                    (lines[i].length > cutLeft + MAX_LINE_LENGTH - 1 ? '\u2026' : '');
            }
        }

        return [
            processLines(startLine, line),
            new Array(column + maxNumLength + 2).join('-') + '^',
            processLines(line, endLine)
        ].filter(Boolean).join('\n');
    }

    var SyntaxError$1 = function(message, source, offset, line, column) {
        var error = createCustomError('SyntaxError', message);

        error.source = source;
        error.offset = offset;
        error.line = line;
        error.column = column;

        error.sourceFragment = function(extraLines) {
            return sourceFragment(error, isNaN(extraLines) ? 0 : extraLines);
        };
        Object.defineProperty(error, 'formattedMessage', {
            get: function() {
                return (
                    'Parse error: ' + error.message + '\n' +
                    sourceFragment(error, 2)
                );
            }
        });

        // for backward capability
        error.parseError = {
            offset: offset,
            line: line,
            column: column
        };

        return error;
    };

    var _SyntaxError = SyntaxError$1;

    // CSS Syntax Module Level 3
    // https://www.w3.org/TR/css-syntax-3/
    var TYPE = {
        EOF: 0,                 // <EOF-token>
        Ident: 1,               // <ident-token>
        Function: 2,            // <function-token>
        AtKeyword: 3,           // <at-keyword-token>
        Hash: 4,                // <hash-token>
        String: 5,              // <string-token>
        BadString: 6,           // <bad-string-token>
        Url: 7,                 // <url-token>
        BadUrl: 8,              // <bad-url-token>
        Delim: 9,               // <delim-token>
        Number: 10,             // <number-token>
        Percentage: 11,         // <percentage-token>
        Dimension: 12,          // <dimension-token>
        WhiteSpace: 13,         // <whitespace-token>
        CDO: 14,                // <CDO-token>
        CDC: 15,                // <CDC-token>
        Colon: 16,              // <colon-token>     :
        Semicolon: 17,          // <semicolon-token> ;
        Comma: 18,              // <comma-token>     ,
        LeftSquareBracket: 19,  // <[-token>
        RightSquareBracket: 20, // <]-token>
        LeftParenthesis: 21,    // <(-token>
        RightParenthesis: 22,   // <)-token>
        LeftCurlyBracket: 23,   // <{-token>
        RightCurlyBracket: 24,  // <}-token>
        Comment: 25
    };

    var NAME = Object.keys(TYPE).reduce(function(result, key) {
        result[TYPE[key]] = key;
        return result;
    }, {});

    var _const = {
        TYPE: TYPE,
        NAME: NAME
    };

    var EOF = 0;

    // https://drafts.csswg.org/css-syntax-3/
    // § 4.2. Definitions

    // digit
    // A code point between U+0030 DIGIT ZERO (0) and U+0039 DIGIT NINE (9).
    function isDigit(code) {
        return code >= 0x0030 && code <= 0x0039;
    }

    // hex digit
    // A digit, or a code point between U+0041 LATIN CAPITAL LETTER A (A) and U+0046 LATIN CAPITAL LETTER F (F),
    // or a code point between U+0061 LATIN SMALL LETTER A (a) and U+0066 LATIN SMALL LETTER F (f).
    function isHexDigit(code) {
        return (
            isDigit(code) || // 0 .. 9
            (code >= 0x0041 && code <= 0x0046) || // A .. F
            (code >= 0x0061 && code <= 0x0066)    // a .. f
        );
    }

    // uppercase letter
    // A code point between U+0041 LATIN CAPITAL LETTER A (A) and U+005A LATIN CAPITAL LETTER Z (Z).
    function isUppercaseLetter(code) {
        return code >= 0x0041 && code <= 0x005A;
    }

    // lowercase letter
    // A code point between U+0061 LATIN SMALL LETTER A (a) and U+007A LATIN SMALL LETTER Z (z).
    function isLowercaseLetter(code) {
        return code >= 0x0061 && code <= 0x007A;
    }

    // letter
    // An uppercase letter or a lowercase letter.
    function isLetter(code) {
        return isUppercaseLetter(code) || isLowercaseLetter(code);
    }

    // non-ASCII code point
    // A code point with a value equal to or greater than U+0080 <control>.
    function isNonAscii(code) {
        return code >= 0x0080;
    }

    // name-start code point
    // A letter, a non-ASCII code point, or U+005F LOW LINE (_).
    function isNameStart(code) {
        return isLetter(code) || isNonAscii(code) || code === 0x005F;
    }

    // name code point
    // A name-start code point, a digit, or U+002D HYPHEN-MINUS (-).
    function isName(code) {
        return isNameStart(code) || isDigit(code) || code === 0x002D;
    }

    // non-printable code point
    // A code point between U+0000 NULL and U+0008 BACKSPACE, or U+000B LINE TABULATION,
    // or a code point between U+000E SHIFT OUT and U+001F INFORMATION SEPARATOR ONE, or U+007F DELETE.
    function isNonPrintable(code) {
        return (
            (code >= 0x0000 && code <= 0x0008) ||
            (code === 0x000B) ||
            (code >= 0x000E && code <= 0x001F) ||
            (code === 0x007F)
        );
    }

    // newline
    // U+000A LINE FEED. Note that U+000D CARRIAGE RETURN and U+000C FORM FEED are not included in this definition,
    // as they are converted to U+000A LINE FEED during preprocessing.
    // TODO: we doesn't do a preprocessing, so check a code point for U+000D CARRIAGE RETURN and U+000C FORM FEED
    function isNewline(code) {
        return code === 0x000A || code === 0x000D || code === 0x000C;
    }

    // whitespace
    // A newline, U+0009 CHARACTER TABULATION, or U+0020 SPACE.
    function isWhiteSpace(code) {
        return isNewline(code) || code === 0x0020 || code === 0x0009;
    }

    // § 4.3.8. Check if two code points are a valid escape
    function isValidEscape(first, second) {
        // If the first code point is not U+005C REVERSE SOLIDUS (\), return false.
        if (first !== 0x005C) {
            return false;
        }

        // Otherwise, if the second code point is a newline or EOF, return false.
        if (isNewline(second) || second === EOF) {
            return false;
        }

        // Otherwise, return true.
        return true;
    }

    // § 4.3.9. Check if three code points would start an identifier
    function isIdentifierStart(first, second, third) {
        // Look at the first code point:

        // U+002D HYPHEN-MINUS
        if (first === 0x002D) {
            // If the second code point is a name-start code point or a U+002D HYPHEN-MINUS,
            // or the second and third code points are a valid escape, return true. Otherwise, return false.
            return (
                isNameStart(second) ||
                second === 0x002D ||
                isValidEscape(second, third)
            );
        }

        // name-start code point
        if (isNameStart(first)) {
            // Return true.
            return true;
        }

        // U+005C REVERSE SOLIDUS (\)
        if (first === 0x005C) {
            // If the first and second code points are a valid escape, return true. Otherwise, return false.
            return isValidEscape(first, second);
        }

        // anything else
        // Return false.
        return false;
    }

    // § 4.3.10. Check if three code points would start a number
    function isNumberStart(first, second, third) {
        // Look at the first code point:

        // U+002B PLUS SIGN (+)
        // U+002D HYPHEN-MINUS (-)
        if (first === 0x002B || first === 0x002D) {
            // If the second code point is a digit, return true.
            if (isDigit(second)) {
                return 2;
            }

            // Otherwise, if the second code point is a U+002E FULL STOP (.)
            // and the third code point is a digit, return true.
            // Otherwise, return false.
            return second === 0x002E && isDigit(third) ? 3 : 0;
        }

        // U+002E FULL STOP (.)
        if (first === 0x002E) {
            // If the second code point is a digit, return true. Otherwise, return false.
            return isDigit(second) ? 2 : 0;
        }

        // digit
        if (isDigit(first)) {
            // Return true.
            return 1;
        }

        // anything else
        // Return false.
        return 0;
    }

    //
    // Misc
    //

    // detect BOM (https://en.wikipedia.org/wiki/Byte_order_mark)
    function isBOM(code) {
        // UTF-16BE
        if (code === 0xFEFF) {
            return 1;
        }

        // UTF-16LE
        if (code === 0xFFFE) {
            return 1;
        }

        return 0;
    }

    // Fast code category
    //
    // https://drafts.csswg.org/css-syntax/#tokenizer-definitions
    // > non-ASCII code point
    // >   A code point with a value equal to or greater than U+0080 <control>
    // > name-start code point
    // >   A letter, a non-ASCII code point, or U+005F LOW LINE (_).
    // > name code point
    // >   A name-start code point, a digit, or U+002D HYPHEN-MINUS (-)
    // That means only ASCII code points has a special meaning and we define a maps for 0..127 codes only
    var CATEGORY = new Array(0x80);
    charCodeCategory.Eof = 0x80;
    charCodeCategory.WhiteSpace = 0x82;
    charCodeCategory.Digit = 0x83;
    charCodeCategory.NameStart = 0x84;
    charCodeCategory.NonPrintable = 0x85;

    for (var i = 0; i < CATEGORY.length; i++) {
        switch (true) {
            case isWhiteSpace(i):
                CATEGORY[i] = charCodeCategory.WhiteSpace;
                break;

            case isDigit(i):
                CATEGORY[i] = charCodeCategory.Digit;
                break;

            case isNameStart(i):
                CATEGORY[i] = charCodeCategory.NameStart;
                break;

            case isNonPrintable(i):
                CATEGORY[i] = charCodeCategory.NonPrintable;
                break;

            default:
                CATEGORY[i] = i || charCodeCategory.Eof;
        }
    }

    function charCodeCategory(code) {
        return code < 0x80 ? CATEGORY[code] : charCodeCategory.NameStart;
    }
    var charCodeDefinitions = {
        isDigit: isDigit,
        isHexDigit: isHexDigit,
        isUppercaseLetter: isUppercaseLetter,
        isLowercaseLetter: isLowercaseLetter,
        isLetter: isLetter,
        isNonAscii: isNonAscii,
        isNameStart: isNameStart,
        isName: isName,
        isNonPrintable: isNonPrintable,
        isNewline: isNewline,
        isWhiteSpace: isWhiteSpace,
        isValidEscape: isValidEscape,
        isIdentifierStart: isIdentifierStart,
        isNumberStart: isNumberStart,

        isBOM: isBOM,
        charCodeCategory: charCodeCategory
    };

    var isDigit$1 = charCodeDefinitions.isDigit;
    var isHexDigit$1 = charCodeDefinitions.isHexDigit;
    var isUppercaseLetter$1 = charCodeDefinitions.isUppercaseLetter;
    var isName$1 = charCodeDefinitions.isName;
    var isWhiteSpace$1 = charCodeDefinitions.isWhiteSpace;
    var isValidEscape$1 = charCodeDefinitions.isValidEscape;

    function getCharCode(source, offset) {
        return offset < source.length ? source.charCodeAt(offset) : 0;
    }

    function getNewlineLength(source, offset, code) {
        if (code === 13 /* \r */ && getCharCode(source, offset + 1) === 10 /* \n */) {
            return 2;
        }

        return 1;
    }

    function cmpChar(testStr, offset, referenceCode) {
        var code = testStr.charCodeAt(offset);

        // code.toLowerCase() for A..Z
        if (isUppercaseLetter$1(code)) {
            code = code | 32;
        }

        return code === referenceCode;
    }

    function cmpStr(testStr, start, end, referenceStr) {
        if (end - start !== referenceStr.length) {
            return false;
        }

        if (start < 0 || end > testStr.length) {
            return false;
        }

        for (var i = start; i < end; i++) {
            var testCode = testStr.charCodeAt(i);
            var referenceCode = referenceStr.charCodeAt(i - start);

            // testCode.toLowerCase() for A..Z
            if (isUppercaseLetter$1(testCode)) {
                testCode = testCode | 32;
            }

            if (testCode !== referenceCode) {
                return false;
            }
        }

        return true;
    }

    function findWhiteSpaceStart(source, offset) {
        for (; offset >= 0; offset--) {
            if (!isWhiteSpace$1(source.charCodeAt(offset))) {
                break;
            }
        }

        return offset + 1;
    }

    function findWhiteSpaceEnd(source, offset) {
        for (; offset < source.length; offset++) {
            if (!isWhiteSpace$1(source.charCodeAt(offset))) {
                break;
            }
        }

        return offset;
    }

    function findDecimalNumberEnd(source, offset) {
        for (; offset < source.length; offset++) {
            if (!isDigit$1(source.charCodeAt(offset))) {
                break;
            }
        }

        return offset;
    }

    // § 4.3.7. Consume an escaped code point
    function consumeEscaped(source, offset) {
        // It assumes that the U+005C REVERSE SOLIDUS (\) has already been consumed and
        // that the next input code point has already been verified to be part of a valid escape.
        offset += 2;

        // hex digit
        if (isHexDigit$1(getCharCode(source, offset - 1))) {
            // Consume as many hex digits as possible, but no more than 5.
            // Note that this means 1-6 hex digits have been consumed in total.
            for (var maxOffset = Math.min(source.length, offset + 5); offset < maxOffset; offset++) {
                if (!isHexDigit$1(getCharCode(source, offset))) {
                    break;
                }
            }

            // If the next input code point is whitespace, consume it as well.
            var code = getCharCode(source, offset);
            if (isWhiteSpace$1(code)) {
                offset += getNewlineLength(source, offset, code);
            }
        }

        return offset;
    }

    // §4.3.11. Consume a name
    // Note: This algorithm does not do the verification of the first few code points that are necessary
    // to ensure the returned code points would constitute an <ident-token>. If that is the intended use,
    // ensure that the stream starts with an identifier before calling this algorithm.
    function consumeName(source, offset) {
        // Let result initially be an empty string.
        // Repeatedly consume the next input code point from the stream:
        for (; offset < source.length; offset++) {
            var code = source.charCodeAt(offset);

            // name code point
            if (isName$1(code)) {
                // Append the code point to result.
                continue;
            }

            // the stream starts with a valid escape
            if (isValidEscape$1(code, getCharCode(source, offset + 1))) {
                // Consume an escaped code point. Append the returned code point to result.
                offset = consumeEscaped(source, offset) - 1;
                continue;
            }

            // anything else
            // Reconsume the current input code point. Return result.
            break;
        }

        return offset;
    }

    // §4.3.12. Consume a number
    function consumeNumber(source, offset) {
        var code = source.charCodeAt(offset);

        // 2. If the next input code point is U+002B PLUS SIGN (+) or U+002D HYPHEN-MINUS (-),
        // consume it and append it to repr.
        if (code === 0x002B || code === 0x002D) {
            code = source.charCodeAt(offset += 1);
        }

        // 3. While the next input code point is a digit, consume it and append it to repr.
        if (isDigit$1(code)) {
            offset = findDecimalNumberEnd(source, offset + 1);
            code = source.charCodeAt(offset);
        }

        // 4. If the next 2 input code points are U+002E FULL STOP (.) followed by a digit, then:
        if (code === 0x002E && isDigit$1(source.charCodeAt(offset + 1))) {
            // 4.1 Consume them.
            // 4.2 Append them to repr.
            code = source.charCodeAt(offset += 2);

            // 4.3 Set type to "number".
            // TODO

            // 4.4 While the next input code point is a digit, consume it and append it to repr.

            offset = findDecimalNumberEnd(source, offset);
        }

        // 5. If the next 2 or 3 input code points are U+0045 LATIN CAPITAL LETTER E (E)
        // or U+0065 LATIN SMALL LETTER E (e), ... , followed by a digit, then:
        if (cmpChar(source, offset, 101 /* e */)) {
            var sign = 0;
            code = source.charCodeAt(offset + 1);

            // ... optionally followed by U+002D HYPHEN-MINUS (-) or U+002B PLUS SIGN (+) ...
            if (code === 0x002D || code === 0x002B) {
                sign = 1;
                code = source.charCodeAt(offset + 2);
            }

            // ... followed by a digit
            if (isDigit$1(code)) {
                // 5.1 Consume them.
                // 5.2 Append them to repr.

                // 5.3 Set type to "number".
                // TODO

                // 5.4 While the next input code point is a digit, consume it and append it to repr.
                offset = findDecimalNumberEnd(source, offset + 1 + sign + 1);
            }
        }

        return offset;
    }

    // § 4.3.14. Consume the remnants of a bad url
    // ... its sole use is to consume enough of the input stream to reach a recovery point
    // where normal tokenizing can resume.
    function consumeBadUrlRemnants(source, offset) {
        // Repeatedly consume the next input code point from the stream:
        for (; offset < source.length; offset++) {
            var code = source.charCodeAt(offset);

            // U+0029 RIGHT PARENTHESIS ())
            // EOF
            if (code === 0x0029) {
                // Return.
                offset++;
                break;
            }

            if (isValidEscape$1(code, getCharCode(source, offset + 1))) {
                // Consume an escaped code point.
                // Note: This allows an escaped right parenthesis ("\)") to be encountered
                // without ending the <bad-url-token>. This is otherwise identical to
                // the "anything else" clause.
                offset = consumeEscaped(source, offset);
            }
        }

        return offset;
    }

    var utils = {
        consumeEscaped: consumeEscaped,
        consumeName: consumeName,
        consumeNumber: consumeNumber,
        consumeBadUrlRemnants: consumeBadUrlRemnants,

        cmpChar: cmpChar,
        cmpStr: cmpStr,

        getNewlineLength: getNewlineLength,
        findWhiteSpaceStart: findWhiteSpaceStart,
        findWhiteSpaceEnd: findWhiteSpaceEnd
    };

    var TYPE$1 = _const.TYPE;
    var NAME$1 = _const.NAME;


    var cmpStr$1 = utils.cmpStr;

    var EOF$1 = TYPE$1.EOF;
    var WHITESPACE = TYPE$1.WhiteSpace;
    var COMMENT = TYPE$1.Comment;

    var OFFSET_MASK = 0x00FFFFFF;
    var TYPE_SHIFT = 24;

    var TokenStream = function() {
        this.offsetAndType = null;
        this.balance = null;

        this.reset();
    };

    TokenStream.prototype = {
        reset: function() {
            this.eof = false;
            this.tokenIndex = -1;
            this.tokenType = 0;
            this.tokenStart = this.firstCharOffset;
            this.tokenEnd = this.firstCharOffset;
        },

        lookupType: function(offset) {
            offset += this.tokenIndex;

            if (offset < this.tokenCount) {
                return this.offsetAndType[offset] >> TYPE_SHIFT;
            }

            return EOF$1;
        },
        lookupOffset: function(offset) {
            offset += this.tokenIndex;

            if (offset < this.tokenCount) {
                return this.offsetAndType[offset - 1] & OFFSET_MASK;
            }

            return this.source.length;
        },
        lookupValue: function(offset, referenceStr) {
            offset += this.tokenIndex;

            if (offset < this.tokenCount) {
                return cmpStr$1(
                    this.source,
                    this.offsetAndType[offset - 1] & OFFSET_MASK,
                    this.offsetAndType[offset] & OFFSET_MASK,
                    referenceStr
                );
            }

            return false;
        },
        getTokenStart: function(tokenIndex) {
            if (tokenIndex === this.tokenIndex) {
                return this.tokenStart;
            }

            if (tokenIndex > 0) {
                return tokenIndex < this.tokenCount
                    ? this.offsetAndType[tokenIndex - 1] & OFFSET_MASK
                    : this.offsetAndType[this.tokenCount] & OFFSET_MASK;
            }

            return this.firstCharOffset;
        },

        // TODO: -> skipUntilBalanced
        getRawLength: function(startToken, mode) {
            var cursor = startToken;
            var balanceEnd;
            var offset = this.offsetAndType[Math.max(cursor - 1, 0)] & OFFSET_MASK;
            var type;

            loop:
                for (; cursor < this.tokenCount; cursor++) {
                    balanceEnd = this.balance[cursor];

                    // stop scanning on balance edge that points to offset before start token
                    if (balanceEnd < startToken) {
                        break loop;
                    }

                    type = this.offsetAndType[cursor] >> TYPE_SHIFT;

                    // check token is stop type
                    switch (mode(type, this.source, offset)) {
                        case 1:
                            break loop;

                        case 2:
                            cursor++;
                            break loop;

                        default:
                            offset = this.offsetAndType[cursor] & OFFSET_MASK;

                            // fast forward to the end of balanced block
                            if (this.balance[balanceEnd] === cursor) {
                                cursor = balanceEnd;
                            }
                    }
                }

            return cursor - this.tokenIndex;
        },
        isBalanceEdge: function(pos) {
            return this.balance[this.tokenIndex] < pos;
        },
        isDelim: function(code, offset) {
            if (offset) {
                return (
                    this.lookupType(offset) === TYPE$1.Delim &&
                    this.source.charCodeAt(this.lookupOffset(offset)) === code
                );
            }

            return (
                this.tokenType === TYPE$1.Delim &&
                this.source.charCodeAt(this.tokenStart) === code
            );
        },

        getTokenValue: function() {
            return this.source.substring(this.tokenStart, this.tokenEnd);
        },
        getTokenLength: function() {
            return this.tokenEnd - this.tokenStart;
        },
        substrToCursor: function(start) {
            return this.source.substring(start, this.tokenStart);
        },

        skipWS: function() {
            for (var i = this.tokenIndex, skipTokenCount = 0; i < this.tokenCount; i++, skipTokenCount++) {
                if ((this.offsetAndType[i] >> TYPE_SHIFT) !== WHITESPACE) {
                    break;
                }
            }

            if (skipTokenCount > 0) {
                this.skip(skipTokenCount);
            }
        },
        skipSC: function() {
            while (this.tokenType === WHITESPACE || this.tokenType === COMMENT) {
                this.next();
            }
        },
        skip: function(tokenCount) {
            var next = this.tokenIndex + tokenCount;

            if (next < this.tokenCount) {
                this.tokenIndex = next;
                this.tokenStart = this.offsetAndType[next - 1] & OFFSET_MASK;
                next = this.offsetAndType[next];
                this.tokenType = next >> TYPE_SHIFT;
                this.tokenEnd = next & OFFSET_MASK;
            } else {
                this.tokenIndex = this.tokenCount;
                this.next();
            }
        },
        next: function() {
            var next = this.tokenIndex + 1;

            if (next < this.tokenCount) {
                this.tokenIndex = next;
                this.tokenStart = this.tokenEnd;
                next = this.offsetAndType[next];
                this.tokenType = next >> TYPE_SHIFT;
                this.tokenEnd = next & OFFSET_MASK;
            } else {
                this.tokenIndex = this.tokenCount;
                this.eof = true;
                this.tokenType = EOF$1;
                this.tokenStart = this.tokenEnd = this.source.length;
            }
        },

        dump: function() {
            var offset = this.firstCharOffset;

            return Array.prototype.slice.call(this.offsetAndType, 0, this.tokenCount).map(function(item, idx) {
                var start = offset;
                var end = item & OFFSET_MASK;

                offset = end;

                return {
                    idx: idx,
                    type: NAME$1[item >> TYPE_SHIFT],
                    chunk: this.source.substring(start, end),
                    balance: this.balance[idx]
                };
            }, this);
        }
    };

    var TokenStream_1 = TokenStream;

    function noop(value) {
        return value;
    }

    function generateMultiplier(multiplier) {
        if (multiplier.min === 0 && multiplier.max === 0) {
            return '*';
        }

        if (multiplier.min === 0 && multiplier.max === 1) {
            return '?';
        }

        if (multiplier.min === 1 && multiplier.max === 0) {
            return multiplier.comma ? '#' : '+';
        }

        if (multiplier.min === 1 && multiplier.max === 1) {
            return '';
        }

        return (
            (multiplier.comma ? '#' : '') +
            (multiplier.min === multiplier.max
                    ? '{' + multiplier.min + '}'
                    : '{' + multiplier.min + ',' + (multiplier.max !== 0 ? multiplier.max : '') + '}'
            )
        );
    }

    function generateTypeOpts(node) {
        switch (node.type) {
            case 'Range':
                return (
                    ' [' +
                    (node.min === null ? '-∞' : node.min) +
                    ',' +
                    (node.max === null ? '∞' : node.max) +
                    ']'
                );

            default:
                throw new Error('Unknown node type `' + node.type + '`');
        }
    }

    function generateSequence(node, decorate, forceBraces, compact) {
        var combinator = node.combinator === ' ' || compact ? node.combinator : ' ' + node.combinator + ' ';
        var result = node.terms.map(function(term) {
            return generate(term, decorate, forceBraces, compact);
        }).join(combinator);

        if (node.explicit || forceBraces) {
            result = (compact || result[0] === ',' ? '[' : '[ ') + result + (compact ? ']' : ' ]');
        }

        return result;
    }

    function generate(node, decorate, forceBraces, compact) {
        var result;

        switch (node.type) {
            case 'Group':
                result =
                    generateSequence(node, decorate, forceBraces, compact) +
                    (node.disallowEmpty ? '!' : '');
                break;

            case 'Multiplier':
                // return since node is a composition
                return (
                    generate(node.term, decorate, forceBraces, compact) +
                    decorate(generateMultiplier(node), node)
                );

            case 'Type':
                result = '<' + node.name + (node.opts ? decorate(generateTypeOpts(node.opts), node.opts) : '') + '>';
                break;

            case 'Property':
                result = '<\'' + node.name + '\'>';
                break;

            case 'Keyword':
                result = node.name;
                break;

            case 'AtKeyword':
                result = '@' + node.name;
                break;

            case 'Function':
                result = node.name + '(';
                break;

            case 'String':
            case 'Token':
                result = node.value;
                break;

            case 'Comma':
                result = ',';
                break;

            default:
                throw new Error('Unknown node type `' + node.type + '`');
        }

        return decorate(result, node);
    }

    var generate_1 = function(node, options) {
        var decorate = noop;
        var forceBraces = false;
        var compact = false;

        if (typeof options === 'function') {
            decorate = options;
        } else if (options) {
            forceBraces = Boolean(options.forceBraces);
            compact = Boolean(options.compact);
            if (typeof options.decorate === 'function') {
                decorate = options.decorate;
            }
        }

        return generate(node, decorate, forceBraces, compact);
    };

    function fromMatchResult(matchResult) {
        var tokens = matchResult.tokens;
        var longestMatch = matchResult.longestMatch;
        var node = longestMatch < tokens.length ? tokens[longestMatch].node : null;
        var mismatchOffset = -1;
        var entries = 0;
        var css = '';

        for (var i = 0; i < tokens.length; i++) {
            if (i === longestMatch) {
                mismatchOffset = css.length;
            }

            if (node !== null && tokens[i].node === node) {
                if (i <= longestMatch) {
                    entries++;
                } else {
                    entries = 0;
                }
            }

            css += tokens[i].value;
        }

        return {
            node: node,
            css: css,
            mismatchOffset: mismatchOffset === -1 ? css.length : mismatchOffset,
            last: node === null || entries > 1
        };
    }

    function getLocation(node, point) {
        var loc = node && node.loc && node.loc[point];

        if (loc) {
            return {
                offset: loc.offset,
                line: loc.line,
                column: loc.column
            };
        }

        return null;
    }

    var SyntaxReferenceError = function(type, referenceName) {
        var error = createCustomError(
            'SyntaxReferenceError',
            type + (referenceName ? ' `' + referenceName + '`' : '')
        );

        error.reference = referenceName;

        return error;
    };

    var MatchError = function(message, syntax, node, matchResult) {
        var error = createCustomError('SyntaxMatchError', message);
        var details = fromMatchResult(matchResult);
        var mismatchOffset = details.mismatchOffset || 0;
        var badNode = details.node || node;
        var end = getLocation(badNode, 'end');
        var start = details.last ? end : getLocation(badNode, 'start');
        var css = details.css;

        error.rawMessage = message;
        error.syntax = syntax ? generate_1(syntax) : '<generic>';
        error.css = css;
        error.mismatchOffset = mismatchOffset;
        error.loc = {
            source: (badNode && badNode.loc && badNode.loc.source) || '<unknown>',
            start: start,
            end: end
        };
        error.line = start ? start.line : undefined;
        error.column = start ? start.column : undefined;
        error.offset = start ? start.offset : undefined;
        error.message = message + '\n' +
            '  syntax: ' + error.syntax + '\n' +
            '   value: ' + (error.css || '<empty string>') + '\n' +
            '  --------' + new Array(error.mismatchOffset + 1).join('-') + '^';

        return error;
    };

    var error = {
        SyntaxReferenceError: SyntaxReferenceError,
        MatchError: MatchError
    };

    var hasOwnProperty = Object.prototype.hasOwnProperty;
    var keywords = Object.create(null);
    var properties = Object.create(null);
    var HYPHENMINUS = 45; // '-'.charCodeAt()

    function isCustomProperty(str, offset) {
        offset = offset || 0;

        return str.length - offset >= 2 &&
            str.charCodeAt(offset) === HYPHENMINUS &&
            str.charCodeAt(offset + 1) === HYPHENMINUS;
    }

    function getVendorPrefix(str, offset) {
        offset = offset || 0;

        // verdor prefix should be at least 3 chars length
        if (str.length - offset >= 3) {
            // vendor prefix starts with hyper minus following non-hyper minus
            if (str.charCodeAt(offset) === HYPHENMINUS &&
                str.charCodeAt(offset + 1) !== HYPHENMINUS) {
                // vendor prefix should contain a hyper minus at the ending
                var secondDashIndex = str.indexOf('-', offset + 2);

                if (secondDashIndex !== -1) {
                    return str.substring(offset, secondDashIndex + 1);
                }
            }
        }

        return '';
    }

    function getKeywordDescriptor(keyword) {
        if (hasOwnProperty.call(keywords, keyword)) {
            return keywords[keyword];
        }

        var name = keyword.toLowerCase();

        if (hasOwnProperty.call(keywords, name)) {
            return keywords[keyword] = keywords[name];
        }

        var custom = isCustomProperty(name, 0);
        var vendor = !custom ? getVendorPrefix(name, 0) : '';

        return keywords[keyword] = Object.freeze({
            basename: name.substr(vendor.length),
            name: name,
            vendor: vendor,
            prefix: vendor,
            custom: custom
        });
    }

    function getPropertyDescriptor(property) {
        if (hasOwnProperty.call(properties, property)) {
            return properties[property];
        }

        var name = property;
        var hack = property[0];

        if (hack === '/') {
            hack = property[1] === '/' ? '//' : '/';
        } else if (hack !== '_' &&
            hack !== '*' &&
            hack !== '$' &&
            hack !== '#' &&
            hack !== '+' &&
            hack !== '&') {
            hack = '';
        }

        var custom = isCustomProperty(name, hack.length);

        // re-use result when possible (the same as for lower case)
        if (!custom) {
            name = name.toLowerCase();
            if (hasOwnProperty.call(properties, name)) {
                return properties[property] = properties[name];
            }
        }

        var vendor = !custom ? getVendorPrefix(name, hack.length) : '';
        var prefix = name.substr(0, hack.length + vendor.length);

        return properties[property] = Object.freeze({
            basename: name.substr(prefix.length),
            name: name.substr(hack.length),
            hack: hack,
            vendor: vendor,
            prefix: prefix,
            custom: custom
        });
    }

    var names = {
        keyword: getKeywordDescriptor,
        property: getPropertyDescriptor,
        isCustomProperty: isCustomProperty,
        vendorPrefix: getVendorPrefix
    };

    var MIN_SIZE = 16 * 1024;
    var SafeUint32Array = typeof Uint32Array !== 'undefined' ? Uint32Array : Array; // fallback on Array when TypedArray is not supported

    var adoptBuffer = function adoptBuffer(buffer, size) {
        if (buffer === null || buffer.length < size) {
            return new SafeUint32Array(Math.max(size + 1024, MIN_SIZE));
        }

        return buffer;
    };

    var TYPE$2 = _const.TYPE;


    var isNewline$1 = charCodeDefinitions.isNewline;
    var isName$2 = charCodeDefinitions.isName;
    var isValidEscape$2 = charCodeDefinitions.isValidEscape;
    var isNumberStart$1 = charCodeDefinitions.isNumberStart;
    var isIdentifierStart$1 = charCodeDefinitions.isIdentifierStart;
    var charCodeCategory$1 = charCodeDefinitions.charCodeCategory;
    var isBOM$1 = charCodeDefinitions.isBOM;


    var cmpStr$2 = utils.cmpStr;
    var getNewlineLength$1 = utils.getNewlineLength;
    var findWhiteSpaceEnd$1 = utils.findWhiteSpaceEnd;
    var consumeEscaped$1 = utils.consumeEscaped;
    var consumeName$1 = utils.consumeName;
    var consumeNumber$1 = utils.consumeNumber;
    var consumeBadUrlRemnants$1 = utils.consumeBadUrlRemnants;

    var OFFSET_MASK$1 = 0x00FFFFFF;
    var TYPE_SHIFT$1 = 24;

    function tokenize(source, stream) {
        function getCharCode(offset) {
            return offset < sourceLength ? source.charCodeAt(offset) : 0;
        }

        // § 4.3.3. Consume a numeric token
        function consumeNumericToken() {
            // Consume a number and let number be the result.
            offset = consumeNumber$1(source, offset);

            // If the next 3 input code points would start an identifier, then:
            if (isIdentifierStart$1(getCharCode(offset), getCharCode(offset + 1), getCharCode(offset + 2))) {
                // Create a <dimension-token> with the same value and type flag as number, and a unit set initially to the empty string.
                // Consume a name. Set the <dimension-token>’s unit to the returned value.
                // Return the <dimension-token>.
                type = TYPE$2.Dimension;
                offset = consumeName$1(source, offset);
                return;
            }

            // Otherwise, if the next input code point is U+0025 PERCENTAGE SIGN (%), consume it.
            if (getCharCode(offset) === 0x0025) {
                // Create a <percentage-token> with the same value as number, and return it.
                type = TYPE$2.Percentage;
                offset++;
                return;
            }

            // Otherwise, create a <number-token> with the same value and type flag as number, and return it.
            type = TYPE$2.Number;
        }

        // § 4.3.4. Consume an ident-like token
        function consumeIdentLikeToken() {
            const nameStartOffset = offset;

            // Consume a name, and let string be the result.
            offset = consumeName$1(source, offset);

            // If string’s value is an ASCII case-insensitive match for "url",
            // and the next input code point is U+0028 LEFT PARENTHESIS ((), consume it.
            if (cmpStr$2(source, nameStartOffset, offset, 'url') && getCharCode(offset) === 0x0028) {
                // While the next two input code points are whitespace, consume the next input code point.
                offset = findWhiteSpaceEnd$1(source, offset + 1);

                // If the next one or two input code points are U+0022 QUOTATION MARK ("), U+0027 APOSTROPHE ('),
                // or whitespace followed by U+0022 QUOTATION MARK (") or U+0027 APOSTROPHE ('),
                // then create a <function-token> with its value set to string and return it.
                if (getCharCode(offset) === 0x0022 ||
                    getCharCode(offset) === 0x0027) {
                    type = TYPE$2.Function;
                    offset = nameStartOffset + 4;
                    return;
                }

                // Otherwise, consume a url token, and return it.
                consumeUrlToken();
                return;
            }

            // Otherwise, if the next input code point is U+0028 LEFT PARENTHESIS ((), consume it.
            // Create a <function-token> with its value set to string and return it.
            if (getCharCode(offset) === 0x0028) {
                type = TYPE$2.Function;
                offset++;
                return;
            }

            // Otherwise, create an <ident-token> with its value set to string and return it.
            type = TYPE$2.Ident;
        }

        // § 4.3.5. Consume a string token
        function consumeStringToken(endingCodePoint) {
            // This algorithm may be called with an ending code point, which denotes the code point
            // that ends the string. If an ending code point is not specified,
            // the current input code point is used.
            if (!endingCodePoint) {
                endingCodePoint = getCharCode(offset++);
            }

            // Initially create a <string-token> with its value set to the empty string.
            type = TYPE$2.String;

            // Repeatedly consume the next input code point from the stream:
            for (; offset < source.length; offset++) {
                var code = source.charCodeAt(offset);

                switch (charCodeCategory$1(code)) {
                    // ending code point
                    case endingCodePoint:
                        // Return the <string-token>.
                        offset++;
                        return;

                    // EOF
                    case charCodeCategory$1.Eof:
                        // This is a parse error. Return the <string-token>.
                        return;

                    // newline
                    case charCodeCategory$1.WhiteSpace:
                        if (isNewline$1(code)) {
                            // This is a parse error. Reconsume the current input code point,
                            // create a <bad-string-token>, and return it.
                            offset += getNewlineLength$1(source, offset, code);
                            type = TYPE$2.BadString;
                            return;
                        }
                        break;

                    // U+005C REVERSE SOLIDUS (\)
                    case 0x005C:
                        // If the next input code point is EOF, do nothing.
                        if (offset === source.length - 1) {
                            break;
                        }

                        var nextCode = getCharCode(offset + 1);

                        // Otherwise, if the next input code point is a newline, consume it.
                        if (isNewline$1(nextCode)) {
                            offset += getNewlineLength$1(source, offset + 1, nextCode);
                        } else if (isValidEscape$2(code, nextCode)) {
                            // Otherwise, (the stream starts with a valid escape) consume
                            // an escaped code point and append the returned code point to
                            // the <string-token>’s value.
                            offset = consumeEscaped$1(source, offset) - 1;
                        }
                        break;

                    // anything else
                    // Append the current input code point to the <string-token>’s value.
                }
            }
        }

        // § 4.3.6. Consume a url token
        // Note: This algorithm assumes that the initial "url(" has already been consumed.
        // This algorithm also assumes that it’s being called to consume an "unquoted" value, like url(foo).
        // A quoted value, like url("foo"), is parsed as a <function-token>. Consume an ident-like token
        // automatically handles this distinction; this algorithm shouldn’t be called directly otherwise.
        function consumeUrlToken() {
            // Initially create a <url-token> with its value set to the empty string.
            type = TYPE$2.Url;

            // Consume as much whitespace as possible.
            offset = findWhiteSpaceEnd$1(source, offset);

            // Repeatedly consume the next input code point from the stream:
            for (; offset < source.length; offset++) {
                var code = source.charCodeAt(offset);

                switch (charCodeCategory$1(code)) {
                    // U+0029 RIGHT PARENTHESIS ())
                    case 0x0029:
                        // Return the <url-token>.
                        offset++;
                        return;

                    // EOF
                    case charCodeCategory$1.Eof:
                        // This is a parse error. Return the <url-token>.
                        return;

                    // whitespace
                    case charCodeCategory$1.WhiteSpace:
                        // Consume as much whitespace as possible.
                        offset = findWhiteSpaceEnd$1(source, offset);

                        // If the next input code point is U+0029 RIGHT PARENTHESIS ()) or EOF,
                        // consume it and return the <url-token>
                        // (if EOF was encountered, this is a parse error);
                        if (getCharCode(offset) === 0x0029 || offset >= source.length) {
                            if (offset < source.length) {
                                offset++;
                            }
                            return;
                        }

                        // otherwise, consume the remnants of a bad url, create a <bad-url-token>,
                        // and return it.
                        offset = consumeBadUrlRemnants$1(source, offset);
                        type = TYPE$2.BadUrl;
                        return;

                    // U+0022 QUOTATION MARK (")
                    // U+0027 APOSTROPHE (')
                    // U+0028 LEFT PARENTHESIS (()
                    // non-printable code point
                    case 0x0022:
                    case 0x0027:
                    case 0x0028:
                    case charCodeCategory$1.NonPrintable:
                        // This is a parse error. Consume the remnants of a bad url,
                        // create a <bad-url-token>, and return it.
                        offset = consumeBadUrlRemnants$1(source, offset);
                        type = TYPE$2.BadUrl;
                        return;

                    // U+005C REVERSE SOLIDUS (\)
                    case 0x005C:
                        // If the stream starts with a valid escape, consume an escaped code point and
                        // append the returned code point to the <url-token>’s value.
                        if (isValidEscape$2(code, getCharCode(offset + 1))) {
                            offset = consumeEscaped$1(source, offset) - 1;
                            break;
                        }

                        // Otherwise, this is a parse error. Consume the remnants of a bad url,
                        // create a <bad-url-token>, and return it.
                        offset = consumeBadUrlRemnants$1(source, offset);
                        type = TYPE$2.BadUrl;
                        return;

                    // anything else
                    // Append the current input code point to the <url-token>’s value.
                }
            }
        }

        if (!stream) {
            stream = new TokenStream_1();
        }

        // ensure source is a string
        source = String(source || '');

        var sourceLength = source.length;
        var offsetAndType = adoptBuffer(stream.offsetAndType, sourceLength + 1); // +1 because of eof-token
        var balance = adoptBuffer(stream.balance, sourceLength + 1);
        var tokenCount = 0;
        var start = isBOM$1(getCharCode(0));
        var offset = start;
        var balanceCloseType = 0;
        var balanceStart = 0;
        var balancePrev = 0;

        // https://drafts.csswg.org/css-syntax-3/#consume-token
        // § 4.3.1. Consume a token
        while (offset < sourceLength) {
            var code = source.charCodeAt(offset);
            var type = 0;

            balance[tokenCount] = sourceLength;

            switch (charCodeCategory$1(code)) {
                // whitespace
                case charCodeCategory$1.WhiteSpace:
                    // Consume as much whitespace as possible. Return a <whitespace-token>.
                    type = TYPE$2.WhiteSpace;
                    offset = findWhiteSpaceEnd$1(source, offset + 1);
                    break;

                // U+0022 QUOTATION MARK (")
                case 0x0022:
                    // Consume a string token and return it.
                    consumeStringToken();
                    break;

                // U+0023 NUMBER SIGN (#)
                case 0x0023:
                    // If the next input code point is a name code point or the next two input code points are a valid escape, then:
                    if (isName$2(getCharCode(offset + 1)) || isValidEscape$2(getCharCode(offset + 1), getCharCode(offset + 2))) {
                        // Create a <hash-token>.
                        type = TYPE$2.Hash;

                        // If the next 3 input code points would start an identifier, set the <hash-token>’s type flag to "id".
                        // if (isIdentifierStart(getCharCode(offset + 1), getCharCode(offset + 2), getCharCode(offset + 3))) {
                        //     // TODO: set id flag
                        // }

                        // Consume a name, and set the <hash-token>’s value to the returned string.
                        offset = consumeName$1(source, offset + 1);

                        // Return the <hash-token>.
                    } else {
                        // Otherwise, return a <delim-token> with its value set to the current input code point.
                        type = TYPE$2.Delim;
                        offset++;
                    }

                    break;

                // U+0027 APOSTROPHE (')
                case 0x0027:
                    // Consume a string token and return it.
                    consumeStringToken();
                    break;

                // U+0028 LEFT PARENTHESIS (()
                case 0x0028:
                    // Return a <(-token>.
                    type = TYPE$2.LeftParenthesis;
                    offset++;
                    break;

                // U+0029 RIGHT PARENTHESIS ())
                case 0x0029:
                    // Return a <)-token>.
                    type = TYPE$2.RightParenthesis;
                    offset++;
                    break;

                // U+002B PLUS SIGN (+)
                case 0x002B:
                    // If the input stream starts with a number, ...
                    if (isNumberStart$1(code, getCharCode(offset + 1), getCharCode(offset + 2))) {
                        // ... reconsume the current input code point, consume a numeric token, and return it.
                        consumeNumericToken();
                    } else {
                        // Otherwise, return a <delim-token> with its value set to the current input code point.
                        type = TYPE$2.Delim;
                        offset++;
                    }
                    break;

                // U+002C COMMA (,)
                case 0x002C:
                    // Return a <comma-token>.
                    type = TYPE$2.Comma;
                    offset++;
                    break;

                // U+002D HYPHEN-MINUS (-)
                case 0x002D:
                    // If the input stream starts with a number, reconsume the current input code point, consume a numeric token, and return it.
                    if (isNumberStart$1(code, getCharCode(offset + 1), getCharCode(offset + 2))) {
                        consumeNumericToken();
                    } else {
                        // Otherwise, if the next 2 input code points are U+002D HYPHEN-MINUS U+003E GREATER-THAN SIGN (->), consume them and return a <CDC-token>.
                        if (getCharCode(offset + 1) === 0x002D &&
                            getCharCode(offset + 2) === 0x003E) {
                            type = TYPE$2.CDC;
                            offset = offset + 3;
                        } else {
                            // Otherwise, if the input stream starts with an identifier, ...
                            if (isIdentifierStart$1(code, getCharCode(offset + 1), getCharCode(offset + 2))) {
                                // ... reconsume the current input code point, consume an ident-like token, and return it.
                                consumeIdentLikeToken();
                            } else {
                                // Otherwise, return a <delim-token> with its value set to the current input code point.
                                type = TYPE$2.Delim;
                                offset++;
                            }
                        }
                    }
                    break;

                // U+002E FULL STOP (.)
                case 0x002E:
                    // If the input stream starts with a number, ...
                    if (isNumberStart$1(code, getCharCode(offset + 1), getCharCode(offset + 2))) {
                        // ... reconsume the current input code point, consume a numeric token, and return it.
                        consumeNumericToken();
                    } else {
                        // Otherwise, return a <delim-token> with its value set to the current input code point.
                        type = TYPE$2.Delim;
                        offset++;
                    }

                    break;

                // U+002F SOLIDUS (/)
                case 0x002F:
                    // If the next two input code point are U+002F SOLIDUS (/) followed by a U+002A ASTERISK (*),
                    if (getCharCode(offset + 1) === 0x002A) {
                        // ... consume them and all following code points up to and including the first U+002A ASTERISK (*)
                        // followed by a U+002F SOLIDUS (/), or up to an EOF code point.
                        type = TYPE$2.Comment;
                        offset = source.indexOf('*/', offset + 2) + 2;
                        if (offset === 1) {
                            offset = source.length;
                        }
                    } else {
                        type = TYPE$2.Delim;
                        offset++;
                    }
                    break;

                // U+003A COLON (:)
                case 0x003A:
                    // Return a <colon-token>.
                    type = TYPE$2.Colon;
                    offset++;
                    break;

                // U+003B SEMICOLON (;)
                case 0x003B:
                    // Return a <semicolon-token>.
                    type = TYPE$2.Semicolon;
                    offset++;
                    break;

                // U+003C LESS-THAN SIGN (<)
                case 0x003C:
                    // If the next 3 input code points are U+0021 EXCLAMATION MARK U+002D HYPHEN-MINUS U+002D HYPHEN-MINUS (!--), ...
                    if (getCharCode(offset + 1) === 0x0021 &&
                        getCharCode(offset + 2) === 0x002D &&
                        getCharCode(offset + 3) === 0x002D) {
                        // ... consume them and return a <CDO-token>.
                        type = TYPE$2.CDO;
                        offset = offset + 4;
                    } else {
                        // Otherwise, return a <delim-token> with its value set to the current input code point.
                        type = TYPE$2.Delim;
                        offset++;
                    }

                    break;

                // U+0040 COMMERCIAL AT (@)
                case 0x0040:
                    // If the next 3 input code points would start an identifier, ...
                    if (isIdentifierStart$1(getCharCode(offset + 1), getCharCode(offset + 2), getCharCode(offset + 3))) {
                        // ... consume a name, create an <at-keyword-token> with its value set to the returned value, and return it.
                        type = TYPE$2.AtKeyword;
                        offset = consumeName$1(source, offset + 1);
                    } else {
                        // Otherwise, return a <delim-token> with its value set to the current input code point.
                        type = TYPE$2.Delim;
                        offset++;
                    }

                    break;

                // U+005B LEFT SQUARE BRACKET ([)
                case 0x005B:
                    // Return a <[-token>.
                    type = TYPE$2.LeftSquareBracket;
                    offset++;
                    break;

                // U+005C REVERSE SOLIDUS (\)
                case 0x005C:
                    // If the input stream starts with a valid escape, ...
                    if (isValidEscape$2(code, getCharCode(offset + 1))) {
                        // ... reconsume the current input code point, consume an ident-like token, and return it.
                        consumeIdentLikeToken();
                    } else {
                        // Otherwise, this is a parse error. Return a <delim-token> with its value set to the current input code point.
                        type = TYPE$2.Delim;
                        offset++;
                    }
                    break;

                // U+005D RIGHT SQUARE BRACKET (])
                case 0x005D:
                    // Return a <]-token>.
                    type = TYPE$2.RightSquareBracket;
                    offset++;
                    break;

                // U+007B LEFT CURLY BRACKET ({)
                case 0x007B:
                    // Return a <{-token>.
                    type = TYPE$2.LeftCurlyBracket;
                    offset++;
                    break;

                // U+007D RIGHT CURLY BRACKET (})
                case 0x007D:
                    // Return a <}-token>.
                    type = TYPE$2.RightCurlyBracket;
                    offset++;
                    break;

                // digit
                case charCodeCategory$1.Digit:
                    // Reconsume the current input code point, consume a numeric token, and return it.
                    consumeNumericToken();
                    break;

                // name-start code point
                case charCodeCategory$1.NameStart:
                    // Reconsume the current input code point, consume an ident-like token, and return it.
                    consumeIdentLikeToken();
                    break;

                // EOF
                case charCodeCategory$1.Eof:
                    // Return an <EOF-token>.
                    break;

                // anything else
                default:
                    // Return a <delim-token> with its value set to the current input code point.
                    type = TYPE$2.Delim;
                    offset++;
            }

            switch (type) {
                case balanceCloseType:
                    balancePrev = balanceStart & OFFSET_MASK$1;
                    balanceStart = balance[balancePrev];
                    balanceCloseType = balanceStart >> TYPE_SHIFT$1;
                    balance[tokenCount] = balancePrev;
                    balance[balancePrev++] = tokenCount;
                    for (; balancePrev < tokenCount; balancePrev++) {
                        if (balance[balancePrev] === sourceLength) {
                            balance[balancePrev] = tokenCount;
                        }
                    }
                    break;

                case TYPE$2.LeftParenthesis:
                case TYPE$2.Function:
                    balance[tokenCount] = balanceStart;
                    balanceCloseType = TYPE$2.RightParenthesis;
                    balanceStart = (balanceCloseType << TYPE_SHIFT$1) | tokenCount;
                    break;

                case TYPE$2.LeftSquareBracket:
                    balance[tokenCount] = balanceStart;
                    balanceCloseType = TYPE$2.RightSquareBracket;
                    balanceStart = (balanceCloseType << TYPE_SHIFT$1) | tokenCount;
                    break;

                case TYPE$2.LeftCurlyBracket:
                    balance[tokenCount] = balanceStart;
                    balanceCloseType = TYPE$2.RightCurlyBracket;
                    balanceStart = (balanceCloseType << TYPE_SHIFT$1) | tokenCount;
                    break;
            }

            offsetAndType[tokenCount++] = (type << TYPE_SHIFT$1) | offset;
        }

        // finalize buffers
        offsetAndType[tokenCount] = (TYPE$2.EOF << TYPE_SHIFT$1) | offset; // <EOF-token>
        balance[tokenCount] = sourceLength;
        balance[sourceLength] = sourceLength; // prevents false positive balance match with any token
        while (balanceStart !== 0) {
            balancePrev = balanceStart & OFFSET_MASK$1;
            balanceStart = balance[balancePrev];
            balance[balancePrev] = sourceLength;
        }

        // update stream
        stream.source = source;
        stream.firstCharOffset = start;
        stream.offsetAndType = offsetAndType;
        stream.tokenCount = tokenCount;
        stream.balance = balance;
        stream.reset();
        stream.next();

        return stream;
    }

    // extend tokenizer with constants
    Object.keys(_const).forEach(function(key) {
        tokenize[key] = _const[key];
    });

    // extend tokenizer with static methods from utils
    Object.keys(charCodeDefinitions).forEach(function(key) {
        tokenize[key] = charCodeDefinitions[key];
    });
    Object.keys(utils).forEach(function(key) {
        tokenize[key] = utils[key];
    });

    var tokenizer = tokenize;

    var isDigit$2 = tokenizer.isDigit;
    var cmpChar$1 = tokenizer.cmpChar;
    var TYPE$3 = tokenizer.TYPE;

    var DELIM = TYPE$3.Delim;
    var WHITESPACE$1 = TYPE$3.WhiteSpace;
    var COMMENT$1 = TYPE$3.Comment;
    var IDENT = TYPE$3.Ident;
    var NUMBER = TYPE$3.Number;
    var DIMENSION = TYPE$3.Dimension;
    var PLUSSIGN = 0x002B;    // U+002B PLUS SIGN (+)
    var HYPHENMINUS$1 = 0x002D; // U+002D HYPHEN-MINUS (-)
    var N = 0x006E;           // U+006E LATIN SMALL LETTER N (n)
    var DISALLOW_SIGN = true;
    var ALLOW_SIGN = false;

    function isDelim(token, code) {
        return token !== null && token.type === DELIM && token.value.charCodeAt(0) === code;
    }

    function skipSC(token, offset, getNextToken) {
        while (token !== null && (token.type === WHITESPACE$1 || token.type === COMMENT$1)) {
            token = getNextToken(++offset);
        }

        return offset;
    }

    function checkInteger(token, valueOffset, disallowSign, offset) {
        if (!token) {
            return 0;
        }

        var code = token.value.charCodeAt(valueOffset);

        if (code === PLUSSIGN || code === HYPHENMINUS$1) {
            if (disallowSign) {
                // Number sign is not allowed
                return 0;
            }
            valueOffset++;
        }

        for (; valueOffset < token.value.length; valueOffset++) {
            if (!isDigit$2(token.value.charCodeAt(valueOffset))) {
                // Integer is expected
                return 0;
            }
        }

        return offset + 1;
    }

    // ... <signed-integer>
    // ... ['+' | '-'] <signless-integer>
    function consumeB(token, offset_, getNextToken) {
        var sign = false;
        var offset = skipSC(token, offset_, getNextToken);

        token = getNextToken(offset);

        if (token === null) {
            return offset_;
        }

        if (token.type !== NUMBER) {
            if (isDelim(token, PLUSSIGN) || isDelim(token, HYPHENMINUS$1)) {
                sign = true;
                offset = skipSC(getNextToken(++offset), offset, getNextToken);
                token = getNextToken(offset);

                if (token === null && token.type !== NUMBER) {
                    return 0;
                }
            } else {
                return offset_;
            }
        }

        if (!sign) {
            var code = token.value.charCodeAt(0);
            if (code !== PLUSSIGN && code !== HYPHENMINUS$1) {
                // Number sign is expected
                return 0;
            }
        }

        return checkInteger(token, sign ? 0 : 1, sign, offset);
    }

    // An+B microsyntax https://www.w3.org/TR/css-syntax-3/#anb
    var genericAnPlusB = function anPlusB(token, getNextToken) {
        /* eslint-disable brace-style*/
        var offset = 0;

        if (!token) {
            return 0;
        }

        // <integer>
        if (token.type === NUMBER) {
            return checkInteger(token, 0, ALLOW_SIGN, offset); // b
        }

            // -n
            // -n <signed-integer>
            // -n ['+' | '-'] <signless-integer>
            // -n- <signless-integer>
        // <dashndashdigit-ident>
        else if (token.type === IDENT && token.value.charCodeAt(0) === HYPHENMINUS$1) {
            // expect 1st char is N
            if (!cmpChar$1(token.value, 1, N)) {
                return 0;
            }

            switch (token.value.length) {
                // -n
                // -n <signed-integer>
                // -n ['+' | '-'] <signless-integer>
                case 2:
                    return consumeB(getNextToken(++offset), offset, getNextToken);

                // -n- <signless-integer>
                case 3:
                    if (token.value.charCodeAt(2) !== HYPHENMINUS$1) {
                        return 0;
                    }

                    offset = skipSC(getNextToken(++offset), offset, getNextToken);
                    token = getNextToken(offset);

                    return checkInteger(token, 0, DISALLOW_SIGN, offset);

                // <dashndashdigit-ident>
                default:
                    if (token.value.charCodeAt(2) !== HYPHENMINUS$1) {
                        return 0;
                    }

                    return checkInteger(token, 3, DISALLOW_SIGN, offset);
            }
        }

            // '+'? n
            // '+'? n <signed-integer>
            // '+'? n ['+' | '-'] <signless-integer>
            // '+'? n- <signless-integer>
        // '+'? <ndashdigit-ident>
        else if (token.type === IDENT || (isDelim(token, PLUSSIGN) && getNextToken(offset + 1).type === IDENT)) {
            // just ignore a plus
            if (token.type !== IDENT) {
                token = getNextToken(++offset);
            }

            if (token === null || !cmpChar$1(token.value, 0, N)) {
                return 0;
            }

            switch (token.value.length) {
                // '+'? n
                // '+'? n <signed-integer>
                // '+'? n ['+' | '-'] <signless-integer>
                case 1:
                    return consumeB(getNextToken(++offset), offset, getNextToken);

                // '+'? n- <signless-integer>
                case 2:
                    if (token.value.charCodeAt(1) !== HYPHENMINUS$1) {
                        return 0;
                    }

                    offset = skipSC(getNextToken(++offset), offset, getNextToken);
                    token = getNextToken(offset);

                    return checkInteger(token, 0, DISALLOW_SIGN, offset);

                // '+'? <ndashdigit-ident>
                default:
                    if (token.value.charCodeAt(1) !== HYPHENMINUS$1) {
                        return 0;
                    }

                    return checkInteger(token, 2, DISALLOW_SIGN, offset);
            }
        }

            // <ndashdigit-dimension>
            // <ndash-dimension> <signless-integer>
            // <n-dimension>
            // <n-dimension> <signed-integer>
        // <n-dimension> ['+' | '-'] <signless-integer>
        else if (token.type === DIMENSION) {
            var code = token.value.charCodeAt(0);
            var sign = code === PLUSSIGN || code === HYPHENMINUS$1 ? 1 : 0;

            for (var i = sign; i < token.value.length; i++) {
                if (!isDigit$2(token.value.charCodeAt(i))) {
                    break;
                }
            }

            if (i === sign) {
                // Integer is expected
                return 0;
            }

            if (!cmpChar$1(token.value, i, N)) {
                return 0;
            }

            // <n-dimension>
            // <n-dimension> <signed-integer>
            // <n-dimension> ['+' | '-'] <signless-integer>
            if (i + 1 === token.value.length) {
                return consumeB(getNextToken(++offset), offset, getNextToken);
            } else {
                if (token.value.charCodeAt(i + 1) !== HYPHENMINUS$1) {
                    return 0;
                }

                // <ndash-dimension> <signless-integer>
                if (i + 2 === token.value.length) {
                    offset = skipSC(getNextToken(++offset), offset, getNextToken);
                    token = getNextToken(offset);

                    return checkInteger(token, 0, DISALLOW_SIGN, offset);
                }
                // <ndashdigit-dimension>
                else {
                    return checkInteger(token, i + 2, DISALLOW_SIGN, offset);
                }
            }
        }

        return 0;
    };

    var isHexDigit$2 = tokenizer.isHexDigit;
    var cmpChar$2 = tokenizer.cmpChar;
    var TYPE$4 = tokenizer.TYPE;

    var IDENT$1 = TYPE$4.Ident;
    var DELIM$1 = TYPE$4.Delim;
    var NUMBER$1 = TYPE$4.Number;
    var DIMENSION$1 = TYPE$4.Dimension;
    var PLUSSIGN$1 = 0x002B;     // U+002B PLUS SIGN (+)
    var HYPHENMINUS$2 = 0x002D;  // U+002D HYPHEN-MINUS (-)
    var QUESTIONMARK = 0x003F; // U+003F QUESTION MARK (?)
    var U = 0x0075;            // U+0075 LATIN SMALL LETTER U (u)

    function isDelim$1(token, code) {
        return token !== null && token.type === DELIM$1 && token.value.charCodeAt(0) === code;
    }

    function startsWith(token, code) {
        return token.value.charCodeAt(0) === code;
    }

    function hexSequence(token, offset, allowDash) {
        for (var pos = offset, hexlen = 0; pos < token.value.length; pos++) {
            var code = token.value.charCodeAt(pos);

            if (code === HYPHENMINUS$2 && allowDash && hexlen !== 0) {
                if (hexSequence(token, offset + hexlen + 1, false) > 0) {
                    return 6; // dissallow following question marks
                }

                return 0; // dash at the ending of a hex sequence is not allowed
            }

            if (!isHexDigit$2(code)) {
                return 0; // not a hex digit
            }

            if (++hexlen > 6) {
                return 0; // too many hex digits
            }    }

        return hexlen;
    }

    function withQuestionMarkSequence(consumed, length, getNextToken) {
        if (!consumed) {
            return 0; // nothing consumed
        }

        while (isDelim$1(getNextToken(length), QUESTIONMARK)) {
            if (++consumed > 6) {
                return 0; // too many question marks
            }

            length++;
        }

        return length;
    }

    // https://drafts.csswg.org/css-syntax/#urange
    // Informally, the <urange> production has three forms:
    // U+0001
    //      Defines a range consisting of a single code point, in this case the code point "1".
    // U+0001-00ff
    //      Defines a range of codepoints between the first and the second value, in this case
    //      the range between "1" and "ff" (255 in decimal) inclusive.
    // U+00??
    //      Defines a range of codepoints where the "?" characters range over all hex digits,
    //      in this case defining the same as the value U+0000-00ff.
    // In each form, a maximum of 6 digits is allowed for each hexadecimal number (if you treat "?" as a hexadecimal digit).
    //
    // <urange> =
    //   u '+' <ident-token> '?'* |
    //   u <dimension-token> '?'* |
    //   u <number-token> '?'* |
    //   u <number-token> <dimension-token> |
    //   u <number-token> <number-token> |
    //   u '+' '?'+
    var genericUrange = function urange(token, getNextToken) {
        var length = 0;

        // should start with `u` or `U`
        if (token === null || token.type !== IDENT$1 || !cmpChar$2(token.value, 0, U)) {
            return 0;
        }

        token = getNextToken(++length);
        if (token === null) {
            return 0;
        }

        // u '+' <ident-token> '?'*
        // u '+' '?'+
        if (isDelim$1(token, PLUSSIGN$1)) {
            token = getNextToken(++length);
            if (token === null) {
                return 0;
            }

            if (token.type === IDENT$1) {
                // u '+' <ident-token> '?'*
                return withQuestionMarkSequence(hexSequence(token, 0, true), ++length, getNextToken);
            }

            if (isDelim$1(token, QUESTIONMARK)) {
                // u '+' '?'+
                return withQuestionMarkSequence(1, ++length, getNextToken);
            }

            // Hex digit or question mark is expected
            return 0;
        }

        // u <number-token> '?'*
        // u <number-token> <dimension-token>
        // u <number-token> <number-token>
        if (token.type === NUMBER$1) {
            if (!startsWith(token, PLUSSIGN$1)) {
                return 0;
            }

            var consumedHexLength = hexSequence(token, 1, true);
            if (consumedHexLength === 0) {
                return 0;
            }

            token = getNextToken(++length);
            if (token === null) {
                // u <number-token> <eof>
                return length;
            }

            if (token.type === DIMENSION$1 || token.type === NUMBER$1) {
                // u <number-token> <dimension-token>
                // u <number-token> <number-token>
                if (!startsWith(token, HYPHENMINUS$2) || !hexSequence(token, 1, false)) {
                    return 0;
                }

                return length + 1;
            }

            // u <number-token> '?'*
            return withQuestionMarkSequence(consumedHexLength, length, getNextToken);
        }

        // u <dimension-token> '?'*
        if (token.type === DIMENSION$1) {
            if (!startsWith(token, PLUSSIGN$1)) {
                return 0;
            }

            return withQuestionMarkSequence(hexSequence(token, 1, true), ++length, getNextToken);
        }

        return 0;
    };

    var isIdentifierStart$2 = tokenizer.isIdentifierStart;
    var isHexDigit$3 = tokenizer.isHexDigit;
    var isDigit$3 = tokenizer.isDigit;
    var cmpStr$3 = tokenizer.cmpStr;
    var consumeNumber$2 = tokenizer.consumeNumber;
    var TYPE$5 = tokenizer.TYPE;



    var cssWideKeywords = ['unset', 'initial', 'inherit'];
    var calcFunctionNames = ['calc(', '-moz-calc(', '-webkit-calc('];

    // https://www.w3.org/TR/css-values-3/#lengths
    var LENGTH = {
        // absolute length units
        'px': true,
        'mm': true,
        'cm': true,
        'in': true,
        'pt': true,
        'pc': true,
        'q': true,

        // relative length units
        'em': true,
        'ex': true,
        'ch': true,
        'rem': true,

        // viewport-percentage lengths
        'vh': true,
        'vw': true,
        'vmin': true,
        'vmax': true,
        'vm': true
    };

    var ANGLE = {
        'deg': true,
        'grad': true,
        'rad': true,
        'turn': true
    };

    var TIME = {
        's': true,
        'ms': true
    };

    var FREQUENCY = {
        'hz': true,
        'khz': true
    };

    // https://www.w3.org/TR/css-values-3/#resolution (https://drafts.csswg.org/css-values/#resolution)
    var RESOLUTION = {
        'dpi': true,
        'dpcm': true,
        'dppx': true,
        'x': true      // https://github.com/w3c/csswg-drafts/issues/461
    };

    // https://drafts.csswg.org/css-grid/#fr-unit
    var FLEX = {
        'fr': true
    };

    // https://www.w3.org/TR/css3-speech/#mixing-props-voice-volume
    var DECIBEL = {
        'db': true
    };

    // https://www.w3.org/TR/css3-speech/#voice-props-voice-pitch
    var SEMITONES = {
        'st': true
    };

    // safe char code getter
    function charCode(str, index) {
        return index < str.length ? str.charCodeAt(index) : 0;
    }

    function eqStr(actual, expected) {
        return cmpStr$3(actual, 0, actual.length, expected);
    }

    function eqStrAny(actual, expected) {
        for (var i = 0; i < expected.length; i++) {
            if (eqStr(actual, expected[i])) {
                return true;
            }
        }

        return false;
    }

    // IE postfix hack, i.e. 123\0 or 123px\9
    function isPostfixIeHack(str, offset) {
        if (offset !== str.length - 2) {
            return false;
        }

        return (
            str.charCodeAt(offset) === 0x005C &&  // U+005C REVERSE SOLIDUS (\)
            isDigit$3(str.charCodeAt(offset + 1))
        );
    }

    function outOfRange(opts, value, numEnd) {
        if (opts && opts.type === 'Range') {
            var num = Number(
                numEnd !== undefined && numEnd !== value.length
                    ? value.substr(0, numEnd)
                    : value
            );

            if (isNaN(num)) {
                return true;
            }

            if (opts.min !== null && num < opts.min) {
                return true;
            }

            if (opts.max !== null && num > opts.max) {
                return true;
            }
        }

        return false;
    }

    function consumeFunction(token, getNextToken) {
        var startIdx = token.index;
        var length = 0;

        // balanced token consuming
        do {
            length++;

            if (token.balance <= startIdx) {
                break;
            }
        } while (token = getNextToken(length));

        return length;
    }

    // TODO: implement
    // can be used wherever <length>, <frequency>, <angle>, <time>, <percentage>, <number>, or <integer> values are allowed
    // https://drafts.csswg.org/css-values/#calc-notation
    function calc(next) {
        return function(token, getNextToken, opts) {
            if (token === null) {
                return 0;
            }

            if (token.type === TYPE$5.Function && eqStrAny(token.value, calcFunctionNames)) {
                return consumeFunction(token, getNextToken);
            }

            return next(token, getNextToken, opts);
        };
    }

    function tokenType(expectedTokenType) {
        return function(token) {
            if (token === null || token.type !== expectedTokenType) {
                return 0;
            }

            return 1;
        };
    }

    function func(name) {
        name = name + '(';

        return function(token, getNextToken) {
            if (token !== null && eqStr(token.value, name)) {
                return consumeFunction(token, getNextToken);
            }

            return 0;
        };
    }

    // =========================
    // Complex types
    //

    // https://drafts.csswg.org/css-values-4/#custom-idents
    // 4.2. Author-defined Identifiers: the <custom-ident> type
    // Some properties accept arbitrary author-defined identifiers as a component value.
    // This generic data type is denoted by <custom-ident>, and represents any valid CSS identifier
    // that would not be misinterpreted as a pre-defined keyword in that property’s value definition.
    //
    // See also: https://developer.mozilla.org/en-US/docs/Web/CSS/custom-ident
    function customIdent(token) {
        if (token === null || token.type !== TYPE$5.Ident) {
            return 0;
        }

        var name = token.value.toLowerCase();

        // The CSS-wide keywords are not valid <custom-ident>s
        if (eqStrAny(name, cssWideKeywords)) {
            return 0;
        }

        // The default keyword is reserved and is also not a valid <custom-ident>
        if (eqStr(name, 'default')) {
            return 0;
        }

        // TODO: ignore property specific keywords (as described https://developer.mozilla.org/en-US/docs/Web/CSS/custom-ident)
        // Specifications using <custom-ident> must specify clearly what other keywords
        // are excluded from <custom-ident>, if any—for example by saying that any pre-defined keywords
        // in that property’s value definition are excluded. Excluded keywords are excluded
        // in all ASCII case permutations.

        return 1;
    }

    // https://drafts.csswg.org/css-variables/#typedef-custom-property-name
    // A custom property is any property whose name starts with two dashes (U+002D HYPHEN-MINUS), like --foo.
    // The <custom-property-name> production corresponds to this: it’s defined as any valid identifier
    // that starts with two dashes, except -- itself, which is reserved for future use by CSS.
    // NOTE: Current implementation treat `--` as a valid name since most (all?) major browsers treat it as valid.
    function customPropertyName(token) {
        // ... defined as any valid identifier
        if (token === null || token.type !== TYPE$5.Ident) {
            return 0;
        }

        // ... that starts with two dashes (U+002D HYPHEN-MINUS)
        if (charCode(token.value, 0) !== 0x002D || charCode(token.value, 1) !== 0x002D) {
            return 0;
        }

        return 1;
    }

    // https://drafts.csswg.org/css-color-4/#hex-notation
    // The syntax of a <hex-color> is a <hash-token> token whose value consists of 3, 4, 6, or 8 hexadecimal digits.
    // In other words, a hex color is written as a hash character, "#", followed by some number of digits 0-9 or
    // letters a-f (the case of the letters doesn’t matter - #00ff00 is identical to #00FF00).
    function hexColor(token) {
        if (token === null || token.type !== TYPE$5.Hash) {
            return 0;
        }

        var length = token.value.length;

        // valid values (length): #rgb (4), #rgba (5), #rrggbb (7), #rrggbbaa (9)
        if (length !== 4 && length !== 5 && length !== 7 && length !== 9) {
            return 0;
        }

        for (var i = 1; i < length; i++) {
            if (!isHexDigit$3(token.value.charCodeAt(i))) {
                return 0;
            }
        }

        return 1;
    }

    function idSelector(token) {
        if (token === null || token.type !== TYPE$5.Hash) {
            return 0;
        }

        if (!isIdentifierStart$2(charCode(token.value, 1), charCode(token.value, 2), charCode(token.value, 3))) {
            return 0;
        }

        return 1;
    }

    // https://drafts.csswg.org/css-syntax/#any-value
    // It represents the entirety of what a valid declaration can have as its value.
    function declarationValue(token, getNextToken) {
        if (!token) {
            return 0;
        }

        var length = 0;
        var level = 0;
        var startIdx = token.index;

        // The <declaration-value> production matches any sequence of one or more tokens,
        // so long as the sequence ...
        scan:
            do {
                switch (token.type) {
                    // ... does not contain <bad-string-token>, <bad-url-token>,
                    case TYPE$5.BadString:
                    case TYPE$5.BadUrl:
                        break scan;

                    // ... unmatched <)-token>, <]-token>, or <}-token>,
                    case TYPE$5.RightCurlyBracket:
                    case TYPE$5.RightParenthesis:
                    case TYPE$5.RightSquareBracket:
                        if (token.balance > token.index || token.balance < startIdx) {
                            break scan;
                        }

                        level--;
                        break;

                    // ... or top-level <semicolon-token> tokens
                    case TYPE$5.Semicolon:
                        if (level === 0) {
                            break scan;
                        }

                        break;

                    // ... or <delim-token> tokens with a value of "!"
                    case TYPE$5.Delim:
                        if (token.value === '!' && level === 0) {
                            break scan;
                        }

                        break;

                    case TYPE$5.Function:
                    case TYPE$5.LeftParenthesis:
                    case TYPE$5.LeftSquareBracket:
                    case TYPE$5.LeftCurlyBracket:
                        level++;
                        break;
                }

                length++;

                // until balance closing
                if (token.balance <= startIdx) {
                    break;
                }
            } while (token = getNextToken(length));

        return length;
    }

    // https://drafts.csswg.org/css-syntax/#any-value
    // The <any-value> production is identical to <declaration-value>, but also
    // allows top-level <semicolon-token> tokens and <delim-token> tokens
    // with a value of "!". It represents the entirety of what valid CSS can be in any context.
    function anyValue(token, getNextToken) {
        if (!token) {
            return 0;
        }

        var startIdx = token.index;
        var length = 0;

        // The <any-value> production matches any sequence of one or more tokens,
        // so long as the sequence ...
        scan:
            do {
                switch (token.type) {
                    // ... does not contain <bad-string-token>, <bad-url-token>,
                    case TYPE$5.BadString:
                    case TYPE$5.BadUrl:
                        break scan;

                    // ... unmatched <)-token>, <]-token>, or <}-token>,
                    case TYPE$5.RightCurlyBracket:
                    case TYPE$5.RightParenthesis:
                    case TYPE$5.RightSquareBracket:
                        if (token.balance > token.index || token.balance < startIdx) {
                            break scan;
                        }

                        break;
                }

                length++;

                // until balance closing
                if (token.balance <= startIdx) {
                    break;
                }
            } while (token = getNextToken(length));

        return length;
    }

    // =========================
    // Dimensions
    //

    function dimension(type) {
        return function(token, getNextToken, opts) {
            if (token === null || token.type !== TYPE$5.Dimension) {
                return 0;
            }

            var numberEnd = consumeNumber$2(token.value, 0);

            // check unit
            if (type !== null) {
                // check for IE postfix hack, i.e. 123px\0 or 123px\9
                var reverseSolidusOffset = token.value.indexOf('\\', numberEnd);
                var unit = reverseSolidusOffset === -1 || !isPostfixIeHack(token.value, reverseSolidusOffset)
                    ? token.value.substr(numberEnd)
                    : token.value.substring(numberEnd, reverseSolidusOffset);

                if (type.hasOwnProperty(unit.toLowerCase()) === false) {
                    return 0;
                }
            }

            // check range if specified
            if (outOfRange(opts, token.value, numberEnd)) {
                return 0;
            }

            return 1;
        };
    }

    // =========================
    // Percentage
    //

    // §5.5. Percentages: the <percentage> type
    // https://drafts.csswg.org/css-values-4/#percentages
    function percentage(token, getNextToken, opts) {
        // ... corresponds to the <percentage-token> production
        if (token === null || token.type !== TYPE$5.Percentage) {
            return 0;
        }

        // check range if specified
        if (outOfRange(opts, token.value, token.value.length - 1)) {
            return 0;
        }

        return 1;
    }

    // =========================
    // Numeric
    //

    // https://drafts.csswg.org/css-values-4/#numbers
    // The value <zero> represents a literal number with the value 0. Expressions that merely
    // evaluate to a <number> with the value 0 (for example, calc(0)) do not match <zero>;
    // only literal <number-token>s do.
    function zero(next) {
        if (typeof next !== 'function') {
            next = function() {
                return 0;
            };
        }

        return function(token, getNextToken, opts) {
            if (token !== null && token.type === TYPE$5.Number) {
                if (Number(token.value) === 0) {
                    return 1;
                }
            }

            return next(token, getNextToken, opts);
        };
    }

    // § 5.3. Real Numbers: the <number> type
    // https://drafts.csswg.org/css-values-4/#numbers
    // Number values are denoted by <number>, and represent real numbers, possibly with a fractional component.
    // ... It corresponds to the <number-token> production
    function number(token, getNextToken, opts) {
        if (token === null) {
            return 0;
        }

        var numberEnd = consumeNumber$2(token.value, 0);
        var isNumber = numberEnd === token.value.length;
        if (!isNumber && !isPostfixIeHack(token.value, numberEnd)) {
            return 0;
        }

        // check range if specified
        if (outOfRange(opts, token.value, numberEnd)) {
            return 0;
        }

        return 1;
    }

    // §5.2. Integers: the <integer> type
    // https://drafts.csswg.org/css-values-4/#integers
    function integer(token, getNextToken, opts) {
        // ... corresponds to a subset of the <number-token> production
        if (token === null || token.type !== TYPE$5.Number) {
            return 0;
        }

        // The first digit of an integer may be immediately preceded by `-` or `+` to indicate the integer’s sign.
        var i = token.value.charCodeAt(0) === 0x002B ||       // U+002B PLUS SIGN (+)
        token.value.charCodeAt(0) === 0x002D ? 1 : 0; // U+002D HYPHEN-MINUS (-)

        // When written literally, an integer is one or more decimal digits 0 through 9 ...
        for (; i < token.value.length; i++) {
            if (!isDigit$3(token.value.charCodeAt(i))) {
                return 0;
            }
        }

        // check range if specified
        if (outOfRange(opts, token.value, i)) {
            return 0;
        }

        return 1;
    }

    var generic = {
        // token types
        'ident-token': tokenType(TYPE$5.Ident),
        'function-token': tokenType(TYPE$5.Function),
        'at-keyword-token': tokenType(TYPE$5.AtKeyword),
        'hash-token': tokenType(TYPE$5.Hash),
        'string-token': tokenType(TYPE$5.String),
        'bad-string-token': tokenType(TYPE$5.BadString),
        'url-token': tokenType(TYPE$5.Url),
        'bad-url-token': tokenType(TYPE$5.BadUrl),
        'delim-token': tokenType(TYPE$5.Delim),
        'number-token': tokenType(TYPE$5.Number),
        'percentage-token': tokenType(TYPE$5.Percentage),
        'dimension-token': tokenType(TYPE$5.Dimension),
        'whitespace-token': tokenType(TYPE$5.WhiteSpace),
        'CDO-token': tokenType(TYPE$5.CDO),
        'CDC-token': tokenType(TYPE$5.CDC),
        'colon-token': tokenType(TYPE$5.Colon),
        'semicolon-token': tokenType(TYPE$5.Semicolon),
        'comma-token': tokenType(TYPE$5.Comma),
        '[-token': tokenType(TYPE$5.LeftSquareBracket),
        ']-token': tokenType(TYPE$5.RightSquareBracket),
        '(-token': tokenType(TYPE$5.LeftParenthesis),
        ')-token': tokenType(TYPE$5.RightParenthesis),
        '{-token': tokenType(TYPE$5.LeftCurlyBracket),
        '}-token': tokenType(TYPE$5.RightCurlyBracket),

        // token type aliases
        'string': tokenType(TYPE$5.String),
        'ident': tokenType(TYPE$5.Ident),

        // complex types
        'custom-ident': customIdent,
        'custom-property-name': customPropertyName,
        'hex-color': hexColor,
        'id-selector': idSelector, // element( <id-selector> )
        'an-plus-b': genericAnPlusB,
        'urange': genericUrange,
        'declaration-value': declarationValue,
        'any-value': anyValue,

        // dimensions
        'dimension': calc(dimension(null)),
        'angle': calc(dimension(ANGLE)),
        'decibel': calc(dimension(DECIBEL)),
        'frequency': calc(dimension(FREQUENCY)),
        'flex': calc(dimension(FLEX)),
        'length': calc(zero(dimension(LENGTH))),
        'resolution': calc(dimension(RESOLUTION)),
        'semitones': calc(dimension(SEMITONES)),
        'time': calc(dimension(TIME)),

        // percentage
        'percentage': calc(percentage),

        // numeric
        'zero': zero(),
        'number': calc(number),
        'integer': calc(integer),

        // old IE stuff
        '-ms-legacy-expression': func('expression')
    };

    var _SyntaxError$1 = function SyntaxError(message, input, offset) {
        var error = createCustomError('SyntaxError', message);

        error.input = input;
        error.offset = offset;
        error.rawMessage = message;
        error.message = error.rawMessage + '\n' +
            '  ' + error.input + '\n' +
            '--' + new Array((error.offset || error.input.length) + 1).join('-') + '^';

        return error;
    };

    var TAB = 9;
    var N$1 = 10;
    var F = 12;
    var R = 13;
    var SPACE = 32;

    var Tokenizer = function(str) {
        this.str = str;
        this.pos = 0;
    };

    Tokenizer.prototype = {
        charCodeAt: function(pos) {
            return pos < this.str.length ? this.str.charCodeAt(pos) : 0;
        },
        charCode: function() {
            return this.charCodeAt(this.pos);
        },
        nextCharCode: function() {
            return this.charCodeAt(this.pos + 1);
        },
        nextNonWsCode: function(pos) {
            return this.charCodeAt(this.findWsEnd(pos));
        },
        findWsEnd: function(pos) {
            for (; pos < this.str.length; pos++) {
                var code = this.str.charCodeAt(pos);
                if (code !== R && code !== N$1 && code !== F && code !== SPACE && code !== TAB) {
                    break;
                }
            }

            return pos;
        },
        substringToPos: function(end) {
            return this.str.substring(this.pos, this.pos = end);
        },
        eat: function(code) {
            if (this.charCode() !== code) {
                this.error('Expect `' + String.fromCharCode(code) + '`');
            }

            this.pos++;
        },
        peek: function() {
            return this.pos < this.str.length ? this.str.charAt(this.pos++) : '';
        },
        error: function(message) {
            throw new _SyntaxError$1(message, this.str, this.pos);
        }
    };

    var tokenizer$1 = Tokenizer;

    var TAB$1 = 9;
    var N$2 = 10;
    var F$1 = 12;
    var R$1 = 13;
    var SPACE$1 = 32;
    var EXCLAMATIONMARK = 33;    // !
    var NUMBERSIGN = 35;         // #
    var AMPERSAND = 38;          // &
    var APOSTROPHE = 39;         // '
    var LEFTPARENTHESIS = 40;    // (
    var RIGHTPARENTHESIS = 41;   // )
    var ASTERISK = 42;           // *
    var PLUSSIGN$2 = 43;           // +
    var COMMA = 44;              // ,
    var HYPERMINUS = 45;         // -
    var LESSTHANSIGN = 60;       // <
    var GREATERTHANSIGN = 62;    // >
    var QUESTIONMARK$1 = 63;       // ?
    var COMMERCIALAT = 64;       // @
    var LEFTSQUAREBRACKET = 91;  // [
    var RIGHTSQUAREBRACKET = 93; // ]
    var LEFTCURLYBRACKET = 123;  // {
    var VERTICALLINE = 124;      // |
    var RIGHTCURLYBRACKET = 125; // }
    var INFINITY = 8734;         // ∞
    var NAME_CHAR = createCharMap(function(ch) {
        return /[a-zA-Z0-9\-]/.test(ch);
    });
    var COMBINATOR_PRECEDENCE = {
        ' ': 1,
        '&&': 2,
        '||': 3,
        '|': 4
    };

    function createCharMap(fn) {
        var array = typeof Uint32Array === 'function' ? new Uint32Array(128) : new Array(128);
        for (var i = 0; i < 128; i++) {
            array[i] = fn(String.fromCharCode(i)) ? 1 : 0;
        }
        return array;
    }

    function scanSpaces(tokenizer) {
        return tokenizer.substringToPos(
            tokenizer.findWsEnd(tokenizer.pos)
        );
    }

    function scanWord(tokenizer) {
        var end = tokenizer.pos;

        for (; end < tokenizer.str.length; end++) {
            var code = tokenizer.str.charCodeAt(end);
            if (code >= 128 || NAME_CHAR[code] === 0) {
                break;
            }
        }

        if (tokenizer.pos === end) {
            tokenizer.error('Expect a keyword');
        }

        return tokenizer.substringToPos(end);
    }

    function scanNumber(tokenizer) {
        var end = tokenizer.pos;

        for (; end < tokenizer.str.length; end++) {
            var code = tokenizer.str.charCodeAt(end);
            if (code < 48 || code > 57) {
                break;
            }
        }

        if (tokenizer.pos === end) {
            tokenizer.error('Expect a number');
        }

        return tokenizer.substringToPos(end);
    }

    function scanString(tokenizer) {
        var end = tokenizer.str.indexOf('\'', tokenizer.pos + 1);

        if (end === -1) {
            tokenizer.pos = tokenizer.str.length;
            tokenizer.error('Expect an apostrophe');
        }

        return tokenizer.substringToPos(end + 1);
    }

    function readMultiplierRange(tokenizer) {
        var min = null;
        var max = null;

        tokenizer.eat(LEFTCURLYBRACKET);

        min = scanNumber(tokenizer);

        if (tokenizer.charCode() === COMMA) {
            tokenizer.pos++;
            if (tokenizer.charCode() !== RIGHTCURLYBRACKET) {
                max = scanNumber(tokenizer);
            }
        } else {
            max = min;
        }

        tokenizer.eat(RIGHTCURLYBRACKET);

        return {
            min: Number(min),
            max: max ? Number(max) : 0
        };
    }

    function readMultiplier(tokenizer) {
        var range = null;
        var comma = false;

        switch (tokenizer.charCode()) {
            case ASTERISK:
                tokenizer.pos++;

                range = {
                    min: 0,
                    max: 0
                };

                break;

            case PLUSSIGN$2:
                tokenizer.pos++;

                range = {
                    min: 1,
                    max: 0
                };

                break;

            case QUESTIONMARK$1:
                tokenizer.pos++;

                range = {
                    min: 0,
                    max: 1
                };

                break;

            case NUMBERSIGN:
                tokenizer.pos++;

                comma = true;

                if (tokenizer.charCode() === LEFTCURLYBRACKET) {
                    range = readMultiplierRange(tokenizer);
                } else {
                    range = {
                        min: 1,
                        max: 0
                    };
                }

                break;

            case LEFTCURLYBRACKET:
                range = readMultiplierRange(tokenizer);
                break;

            default:
                return null;
        }

        return {
            type: 'Multiplier',
            comma: comma,
            min: range.min,
            max: range.max,
            term: null
        };
    }

    function maybeMultiplied(tokenizer, node) {
        var multiplier = readMultiplier(tokenizer);

        if (multiplier !== null) {
            multiplier.term = node;
            return multiplier;
        }

        return node;
    }

    function maybeToken(tokenizer) {
        var ch = tokenizer.peek();

        if (ch === '') {
            return null;
        }

        return {
            type: 'Token',
            value: ch
        };
    }

    function readProperty(tokenizer) {
        var name;

        tokenizer.eat(LESSTHANSIGN);
        tokenizer.eat(APOSTROPHE);

        name = scanWord(tokenizer);

        tokenizer.eat(APOSTROPHE);
        tokenizer.eat(GREATERTHANSIGN);

        return maybeMultiplied(tokenizer, {
            type: 'Property',
            name: name
        });
    }

    // https://drafts.csswg.org/css-values-3/#numeric-ranges
    // 4.1. Range Restrictions and Range Definition Notation
    //
    // Range restrictions can be annotated in the numeric type notation using CSS bracketed
    // range notation—[min,max]—within the angle brackets, after the identifying keyword,
    // indicating a closed range between (and including) min and max.
    // For example, <integer [0, 10]> indicates an integer between 0 and 10, inclusive.
    function readTypeRange(tokenizer) {
        // use null for Infinity to make AST format JSON serializable/deserializable
        var min = null; // -Infinity
        var max = null; // Infinity
        var sign = 1;

        tokenizer.eat(LEFTSQUAREBRACKET);

        if (tokenizer.charCode() === HYPERMINUS) {
            tokenizer.peek();
            sign = -1;
        }

        if (sign == -1 && tokenizer.charCode() === INFINITY) {
            tokenizer.peek();
        } else {
            min = sign * Number(scanNumber(tokenizer));
        }

        scanSpaces(tokenizer);
        tokenizer.eat(COMMA);
        scanSpaces(tokenizer);

        if (tokenizer.charCode() === INFINITY) {
            tokenizer.peek();
        } else {
            sign = 1;

            if (tokenizer.charCode() === HYPERMINUS) {
                tokenizer.peek();
                sign = -1;
            }

            max = sign * Number(scanNumber(tokenizer));
        }

        tokenizer.eat(RIGHTSQUAREBRACKET);

        // If no range is indicated, either by using the bracketed range notation
        // or in the property description, then [−∞,∞] is assumed.
        if (min === null && max === null) {
            return null;
        }

        return {
            type: 'Range',
            min: min,
            max: max
        };
    }

    function readType(tokenizer) {
        var name;
        var opts = null;

        tokenizer.eat(LESSTHANSIGN);
        name = scanWord(tokenizer);

        if (tokenizer.charCode() === LEFTPARENTHESIS &&
            tokenizer.nextCharCode() === RIGHTPARENTHESIS) {
            tokenizer.pos += 2;
            name += '()';
        }

        if (tokenizer.charCodeAt(tokenizer.findWsEnd(tokenizer.pos)) === LEFTSQUAREBRACKET) {
            scanSpaces(tokenizer);
            opts = readTypeRange(tokenizer);
        }

        tokenizer.eat(GREATERTHANSIGN);

        return maybeMultiplied(tokenizer, {
            type: 'Type',
            name: name,
            opts: opts
        });
    }

    function readKeywordOrFunction(tokenizer) {
        var name;

        name = scanWord(tokenizer);

        if (tokenizer.charCode() === LEFTPARENTHESIS) {
            tokenizer.pos++;

            return {
                type: 'Function',
                name: name
            };
        }

        return maybeMultiplied(tokenizer, {
            type: 'Keyword',
            name: name
        });
    }

    function regroupTerms(terms, combinators) {
        function createGroup(terms, combinator) {
            return {
                type: 'Group',
                terms: terms,
                combinator: combinator,
                disallowEmpty: false,
                explicit: false
            };
        }

        combinators = Object.keys(combinators).sort(function(a, b) {
            return COMBINATOR_PRECEDENCE[a] - COMBINATOR_PRECEDENCE[b];
        });

        while (combinators.length > 0) {
            var combinator = combinators.shift();
            for (var i = 0, subgroupStart = 0; i < terms.length; i++) {
                var term = terms[i];
                if (term.type === 'Combinator') {
                    if (term.value === combinator) {
                        if (subgroupStart === -1) {
                            subgroupStart = i - 1;
                        }
                        terms.splice(i, 1);
                        i--;
                    } else {
                        if (subgroupStart !== -1 && i - subgroupStart > 1) {
                            terms.splice(
                                subgroupStart,
                                i - subgroupStart,
                                createGroup(terms.slice(subgroupStart, i), combinator)
                            );
                            i = subgroupStart + 1;
                        }
                        subgroupStart = -1;
                    }
                }
            }

            if (subgroupStart !== -1 && combinators.length) {
                terms.splice(
                    subgroupStart,
                    i - subgroupStart,
                    createGroup(terms.slice(subgroupStart, i), combinator)
                );
            }
        }

        return combinator;
    }

    function readImplicitGroup(tokenizer) {
        var terms = [];
        var combinators = {};
        var token;
        var prevToken = null;
        var prevTokenPos = tokenizer.pos;

        while (token = peek(tokenizer)) {
            if (token.type !== 'Spaces') {
                if (token.type === 'Combinator') {
                    // check for combinator in group beginning and double combinator sequence
                    if (prevToken === null || prevToken.type === 'Combinator') {
                        tokenizer.pos = prevTokenPos;
                        tokenizer.error('Unexpected combinator');
                    }

                    combinators[token.value] = true;
                } else if (prevToken !== null && prevToken.type !== 'Combinator') {
                    combinators[' '] = true;  // a b
                    terms.push({
                        type: 'Combinator',
                        value: ' '
                    });
                }

                terms.push(token);
                prevToken = token;
                prevTokenPos = tokenizer.pos;
            }
        }

        // check for combinator in group ending
        if (prevToken !== null && prevToken.type === 'Combinator') {
            tokenizer.pos -= prevTokenPos;
            tokenizer.error('Unexpected combinator');
        }

        return {
            type: 'Group',
            terms: terms,
            combinator: regroupTerms(terms, combinators) || ' ',
            disallowEmpty: false,
            explicit: false
        };
    }

    function readGroup(tokenizer) {
        var result;

        tokenizer.eat(LEFTSQUAREBRACKET);
        result = readImplicitGroup(tokenizer);
        tokenizer.eat(RIGHTSQUAREBRACKET);

        result.explicit = true;

        if (tokenizer.charCode() === EXCLAMATIONMARK) {
            tokenizer.pos++;
            result.disallowEmpty = true;
        }

        return result;
    }

    function peek(tokenizer) {
        var code = tokenizer.charCode();

        if (code < 128 && NAME_CHAR[code] === 1) {
            return readKeywordOrFunction(tokenizer);
        }

        switch (code) {
            case RIGHTSQUAREBRACKET:
                // don't eat, stop scan a group
                break;

            case LEFTSQUAREBRACKET:
                return maybeMultiplied(tokenizer, readGroup(tokenizer));

            case LESSTHANSIGN:
                return tokenizer.nextCharCode() === APOSTROPHE
                    ? readProperty(tokenizer)
                    : readType(tokenizer);

            case VERTICALLINE:
                return {
                    type: 'Combinator',
                    value: tokenizer.substringToPos(
                        tokenizer.nextCharCode() === VERTICALLINE
                            ? tokenizer.pos + 2
                            : tokenizer.pos + 1
                    )
                };

            case AMPERSAND:
                tokenizer.pos++;
                tokenizer.eat(AMPERSAND);

                return {
                    type: 'Combinator',
                    value: '&&'
                };

            case COMMA:
                tokenizer.pos++;
                return {
                    type: 'Comma'
                };

            case APOSTROPHE:
                return maybeMultiplied(tokenizer, {
                    type: 'String',
                    value: scanString(tokenizer)
                });

            case SPACE$1:
            case TAB$1:
            case N$2:
            case R$1:
            case F$1:
                return {
                    type: 'Spaces',
                    value: scanSpaces(tokenizer)
                };

            case COMMERCIALAT:
                code = tokenizer.nextCharCode();

                if (code < 128 && NAME_CHAR[code] === 1) {
                    tokenizer.pos++;
                    return {
                        type: 'AtKeyword',
                        name: scanWord(tokenizer)
                    };
                }

                return maybeToken(tokenizer);

            case ASTERISK:
            case PLUSSIGN$2:
            case QUESTIONMARK$1:
            case NUMBERSIGN:
            case EXCLAMATIONMARK:
                // prohibited tokens (used as a multiplier start)
                break;

            case LEFTCURLYBRACKET:
                // LEFTCURLYBRACKET is allowed since mdn/data uses it w/o quoting
                // check next char isn't a number, because it's likely a disjoined multiplier
                code = tokenizer.nextCharCode();

                if (code < 48 || code > 57) {
                    return maybeToken(tokenizer);
                }

                break;

            default:
                return maybeToken(tokenizer);
        }
    }

    function parse(source) {
        var tokenizer = new tokenizer$1(source);
        var result = readImplicitGroup(tokenizer);

        if (tokenizer.pos !== source.length) {
            tokenizer.error('Unexpected input');
        }

        // reduce redundant groups with single group term
        if (result.terms.length === 1 && result.terms[0].type === 'Group') {
            result = result.terms[0];
        }

        return result;
    }

    // warm up parse to elimitate code branches that never execute
    // fix soft deoptimizations (insufficient type feedback)
    parse('[a&&<b>#|<\'c\'>*||e() f{2} /,(% g#{1,2} h{2,})]!');

    var parse_1 = parse;

    var noop$1 = function() {};

    function ensureFunction(value) {
        return typeof value === 'function' ? value : noop$1;
    }

    var walk = function(node, options, context) {
        function walk(node) {
            enter.call(context, node);

            switch (node.type) {
                case 'Group':
                    node.terms.forEach(walk);
                    break;

                case 'Multiplier':
                    walk(node.term);
                    break;

                case 'Type':
                case 'Property':
                case 'Keyword':
                case 'AtKeyword':
                case 'Function':
                case 'String':
                case 'Token':
                case 'Comma':
                    break;

                default:
                    throw new Error('Unknown type: ' + node.type);
            }

            leave.call(context, node);
        }

        var enter = noop$1;
        var leave = noop$1;

        if (typeof options === 'function') {
            enter = options;
        } else if (options) {
            enter = ensureFunction(options.enter);
            leave = ensureFunction(options.leave);
        }

        if (enter === noop$1 && leave === noop$1) {
            throw new Error('Neither `enter` nor `leave` walker handler is set or both aren\'t a function');
        }

        walk(node);
    };

    var tokenStream = new TokenStream_1();
    var astToTokens = {
        decorator: function(handlers) {
            var curNode = null;
            var prev = { len: 0, node: null };
            var nodes = [prev];
            var buffer = '';

            return {
                children: handlers.children,
                node: function(node) {
                    var tmp = curNode;
                    curNode = node;
                    handlers.node.call(this, node);
                    curNode = tmp;
                },
                chunk: function(chunk) {
                    buffer += chunk;
                    if (prev.node !== curNode) {
                        nodes.push({
                            len: chunk.length,
                            node: curNode
                        });
                    } else {
                        prev.len += chunk.length;
                    }
                },
                result: function() {
                    return prepareTokens(buffer, nodes);
                }
            };
        }
    };

    function prepareTokens(str, nodes) {
        var tokens = [];
        var nodesOffset = 0;
        var nodesIndex = 0;
        var currentNode = nodes ? nodes[nodesIndex].node : null;

        tokenizer(str, tokenStream);

        while (!tokenStream.eof) {
            if (nodes) {
                while (nodesIndex < nodes.length && nodesOffset + nodes[nodesIndex].len <= tokenStream.tokenStart) {
                    nodesOffset += nodes[nodesIndex++].len;
                    currentNode = nodes[nodesIndex].node;
                }
            }

            tokens.push({
                type: tokenStream.tokenType,
                value: tokenStream.getTokenValue(),
                index: tokenStream.tokenIndex, // TODO: remove it, temporary solution
                balance: tokenStream.balance[tokenStream.tokenIndex], // TODO: remove it, temporary solution
                node: currentNode
            });
            tokenStream.next();
            // console.log({ ...tokens[tokens.length - 1], node: undefined });
        }

        return tokens;
    }

    var prepareTokens_1 = function(value, syntax) {
        if (typeof value === 'string') {
            return prepareTokens(value, null);
        }

        return syntax.generate(value, astToTokens);
    };

    var MATCH = { type: 'Match' };
    var MISMATCH = { type: 'Mismatch' };
    var DISALLOW_EMPTY = { type: 'DisallowEmpty' };
    var LEFTPARENTHESIS$1 = 40;  // (
    var RIGHTPARENTHESIS$1 = 41; // )

    function createCondition(match, thenBranch, elseBranch) {
        // reduce node count
        if (thenBranch === MATCH && elseBranch === MISMATCH) {
            return match;
        }

        if (match === MATCH && thenBranch === MATCH && elseBranch === MATCH) {
            return match;
        }

        if (match.type === 'If' && match.else === MISMATCH && thenBranch === MATCH) {
            thenBranch = match.then;
            match = match.match;
        }

        return {
            type: 'If',
            match: match,
            then: thenBranch,
            else: elseBranch
        };
    }

    function isFunctionType(name) {
        return (
            name.length > 2 &&
            name.charCodeAt(name.length - 2) === LEFTPARENTHESIS$1 &&
            name.charCodeAt(name.length - 1) === RIGHTPARENTHESIS$1
        );
    }

    function isEnumCapatible(term) {
        return (
            term.type === 'Keyword' ||
            term.type === 'AtKeyword' ||
            term.type === 'Function' ||
            term.type === 'Type' && isFunctionType(term.name)
        );
    }

    function buildGroupMatchGraph(combinator, terms, atLeastOneTermMatched) {
        switch (combinator) {
            case ' ':
                // Juxtaposing components means that all of them must occur, in the given order.
                //
                // a b c
                // =
                // match a
                //   then match b
                //     then match c
                //       then MATCH
                //       else MISMATCH
                //     else MISMATCH
                //   else MISMATCH
                var result = MATCH;

                for (var i = terms.length - 1; i >= 0; i--) {
                    var term = terms[i];

                    result = createCondition(
                        term,
                        result,
                        MISMATCH
                    );
                }
                return result;

            case '|':
                // A bar (|) separates two or more alternatives: exactly one of them must occur.
                //
                // a | b | c
                // =
                // match a
                //   then MATCH
                //   else match b
                //     then MATCH
                //     else match c
                //       then MATCH
                //       else MISMATCH

                var result = MISMATCH;
                var map = null;

                for (var i = terms.length - 1; i >= 0; i--) {
                    var term = terms[i];

                    // reduce sequence of keywords into a Enum
                    if (isEnumCapatible(term)) {
                        if (map === null && i > 0 && isEnumCapatible(terms[i - 1])) {
                            map = Object.create(null);
                            result = createCondition(
                                {
                                    type: 'Enum',
                                    map: map
                                },
                                MATCH,
                                result
                            );
                        }

                        if (map !== null) {
                            var key = (isFunctionType(term.name) ? term.name.slice(0, -1) : term.name).toLowerCase();
                            if (key in map === false) {
                                map[key] = term;
                                continue;
                            }
                        }
                    }

                    map = null;

                    // create a new conditonal node
                    result = createCondition(
                        term,
                        MATCH,
                        result
                    );
                }
                return result;

            case '&&':
                // A double ampersand (&&) separates two or more components,
                // all of which must occur, in any order.

                // Use MatchOnce for groups with a large number of terms,
                // since &&-groups produces at least N!-node trees
                if (terms.length > 5) {
                    return {
                        type: 'MatchOnce',
                        terms: terms,
                        all: true
                    };
                }

                // Use a combination tree for groups with small number of terms
                //
                // a && b && c
                // =
                // match a
                //   then [b && c]
                //   else match b
                //     then [a && c]
                //     else match c
                //       then [a && b]
                //       else MISMATCH
                //
                // a && b
                // =
                // match a
                //   then match b
                //     then MATCH
                //     else MISMATCH
                //   else match b
                //     then match a
                //       then MATCH
                //       else MISMATCH
                //     else MISMATCH
                var result = MISMATCH;

                for (var i = terms.length - 1; i >= 0; i--) {
                    var term = terms[i];
                    var thenClause;

                    if (terms.length > 1) {
                        thenClause = buildGroupMatchGraph(
                            combinator,
                            terms.filter(function(newGroupTerm) {
                                return newGroupTerm !== term;
                            }),
                            false
                        );
                    } else {
                        thenClause = MATCH;
                    }

                    result = createCondition(
                        term,
                        thenClause,
                        result
                    );
                }
                return result;

            case '||':
                // A double bar (||) separates two or more options:
                // one or more of them must occur, in any order.

                // Use MatchOnce for groups with a large number of terms,
                // since ||-groups produces at least N!-node trees
                if (terms.length > 5) {
                    return {
                        type: 'MatchOnce',
                        terms: terms,
                        all: false
                    };
                }

                // Use a combination tree for groups with small number of terms
                //
                // a || b || c
                // =
                // match a
                //   then [b || c]
                //   else match b
                //     then [a || c]
                //     else match c
                //       then [a || b]
                //       else MISMATCH
                //
                // a || b
                // =
                // match a
                //   then match b
                //     then MATCH
                //     else MATCH
                //   else match b
                //     then match a
                //       then MATCH
                //       else MATCH
                //     else MISMATCH
                var result = atLeastOneTermMatched ? MATCH : MISMATCH;

                for (var i = terms.length - 1; i >= 0; i--) {
                    var term = terms[i];
                    var thenClause;

                    if (terms.length > 1) {
                        thenClause = buildGroupMatchGraph(
                            combinator,
                            terms.filter(function(newGroupTerm) {
                                return newGroupTerm !== term;
                            }),
                            true
                        );
                    } else {
                        thenClause = MATCH;
                    }

                    result = createCondition(
                        term,
                        thenClause,
                        result
                    );
                }
                return result;
        }
    }

    function buildMultiplierMatchGraph(node) {
        var result = MATCH;
        var matchTerm = buildMatchGraph(node.term);

        if (node.max === 0) {
            // disable repeating of empty match to prevent infinite loop
            matchTerm = createCondition(
                matchTerm,
                DISALLOW_EMPTY,
                MISMATCH
            );

            // an occurrence count is not limited, make a cycle;
            // to collect more terms on each following matching mismatch
            result = createCondition(
                matchTerm,
                null, // will be a loop
                MISMATCH
            );

            result.then = createCondition(
                MATCH,
                MATCH,
                result // make a loop
            );

            if (node.comma) {
                result.then.else = createCondition(
                    { type: 'Comma', syntax: node },
                    result,
                    MISMATCH
                );
            }
        } else {
            // create a match node chain for [min .. max] interval with optional matches
            for (var i = node.min || 1; i <= node.max; i++) {
                if (node.comma && result !== MATCH) {
                    result = createCondition(
                        { type: 'Comma', syntax: node },
                        result,
                        MISMATCH
                    );
                }

                result = createCondition(
                    matchTerm,
                    createCondition(
                        MATCH,
                        MATCH,
                        result
                    ),
                    MISMATCH
                );
            }
        }

        if (node.min === 0) {
            // allow zero match
            result = createCondition(
                MATCH,
                MATCH,
                result
            );
        } else {
            // create a match node chain to collect [0 ... min - 1] required matches
            for (var i = 0; i < node.min - 1; i++) {
                if (node.comma && result !== MATCH) {
                    result = createCondition(
                        { type: 'Comma', syntax: node },
                        result,
                        MISMATCH
                    );
                }

                result = createCondition(
                    matchTerm,
                    result,
                    MISMATCH
                );
            }
        }

        return result;
    }

    function buildMatchGraph(node) {
        if (typeof node === 'function') {
            return {
                type: 'Generic',
                fn: node
            };
        }

        switch (node.type) {
            case 'Group':
                var result = buildGroupMatchGraph(
                    node.combinator,
                    node.terms.map(buildMatchGraph),
                    false
                );

                if (node.disallowEmpty) {
                    result = createCondition(
                        result,
                        DISALLOW_EMPTY,
                        MISMATCH
                    );
                }

                return result;

            case 'Multiplier':
                return buildMultiplierMatchGraph(node);

            case 'Type':
            case 'Property':
                return {
                    type: node.type,
                    name: node.name,
                    syntax: node
                };

            case 'Keyword':
                return {
                    type: node.type,
                    name: node.name.toLowerCase(),
                    syntax: node
                };

            case 'AtKeyword':
                return {
                    type: node.type,
                    name: '@' + node.name.toLowerCase(),
                    syntax: node
                };

            case 'Function':
                return {
                    type: node.type,
                    name: node.name.toLowerCase() + '(',
                    syntax: node
                };

            case 'String':
                // convert a one char length String to a Token
                if (node.value.length === 3) {
                    return {
                        type: 'Token',
                        value: node.value.charAt(1),
                        syntax: node
                    };
                }

                // otherwise use it as is
                return {
                    type: node.type,
                    value: node.value.substr(1, node.value.length - 2).replace(/\\'/g, '\''),
                    syntax: node
                };

            case 'Token':
                return {
                    type: node.type,
                    value: node.value,
                    syntax: node
                };

            case 'Comma':
                return {
                    type: node.type,
                    syntax: node
                };

            default:
                throw new Error('Unknown node type:', node.type);
        }
    }

    var matchGraph = {
        MATCH: MATCH,
        MISMATCH: MISMATCH,
        DISALLOW_EMPTY: DISALLOW_EMPTY,
        buildMatchGraph: function(syntaxTree, ref) {
            if (typeof syntaxTree === 'string') {
                syntaxTree = parse_1(syntaxTree);
            }

            return {
                type: 'MatchGraph',
                match: buildMatchGraph(syntaxTree),
                syntax: ref || null,
                source: syntaxTree
            };
        }
    };

    var hasOwnProperty$1 = Object.prototype.hasOwnProperty;

    var MATCH$1 = matchGraph.MATCH;
    var MISMATCH$1 = matchGraph.MISMATCH;
    var DISALLOW_EMPTY$1 = matchGraph.DISALLOW_EMPTY;
    var TYPE$6 = _const.TYPE;

    var STUB = 0;
    var TOKEN = 1;
    var OPEN_SYNTAX = 2;
    var CLOSE_SYNTAX = 3;

    var EXIT_REASON_MATCH = 'Match';
    var EXIT_REASON_MISMATCH = 'Mismatch';
    var EXIT_REASON_ITERATION_LIMIT = 'Maximum iteration number exceeded (please fill an issue on https://github.com/csstree/csstree/issues)';

    var ITERATION_LIMIT = 15000;
    var totalIterationCount = 0;

    function reverseList(list) {
        var prev = null;
        var next = null;
        var item = list;

        while (item !== null) {
            next = item.prev;
            item.prev = prev;
            prev = item;
            item = next;
        }

        return prev;
    }

    function areStringsEqualCaseInsensitive(testStr, referenceStr) {
        if (testStr.length !== referenceStr.length) {
            return false;
        }

        for (var i = 0; i < testStr.length; i++) {
            var testCode = testStr.charCodeAt(i);
            var referenceCode = referenceStr.charCodeAt(i);

            // testCode.toLowerCase() for U+0041 LATIN CAPITAL LETTER A (A) .. U+005A LATIN CAPITAL LETTER Z (Z).
            if (testCode >= 0x0041 && testCode <= 0x005A) {
                testCode = testCode | 32;
            }

            if (testCode !== referenceCode) {
                return false;
            }
        }

        return true;
    }

    function isCommaContextStart(token) {
        if (token === null) {
            return true;
        }

        return (
            token.type === TYPE$6.Comma ||
            token.type === TYPE$6.Function ||
            token.type === TYPE$6.LeftParenthesis ||
            token.type === TYPE$6.LeftSquareBracket ||
            token.type === TYPE$6.LeftCurlyBracket ||
            token.type === TYPE$6.Delim
        );
    }

    function isCommaContextEnd(token) {
        if (token === null) {
            return true;
        }

        return (
            token.type === TYPE$6.RightParenthesis ||
            token.type === TYPE$6.RightSquareBracket ||
            token.type === TYPE$6.RightCurlyBracket ||
            token.type === TYPE$6.Delim
        );
    }

    function internalMatch(tokens, state, syntaxes) {
        function moveToNextToken() {
            do {
                tokenIndex++;
                token = tokenIndex < tokens.length ? tokens[tokenIndex] : null;
            } while (token !== null && (token.type === TYPE$6.WhiteSpace || token.type === TYPE$6.Comment));
        }

        function getNextToken(offset) {
            var nextIndex = tokenIndex + offset;

            return nextIndex < tokens.length ? tokens[nextIndex] : null;
        }

        function stateSnapshotFromSyntax(nextState, prev) {
            return {
                nextState: nextState,
                matchStack: matchStack,
                syntaxStack: syntaxStack,
                thenStack: thenStack,
                tokenIndex: tokenIndex,
                prev: prev
            };
        }

        function pushThenStack(nextState) {
            thenStack = {
                nextState: nextState,
                matchStack: matchStack,
                syntaxStack: syntaxStack,
                prev: thenStack
            };
        }

        function pushElseStack(nextState) {
            elseStack = stateSnapshotFromSyntax(nextState, elseStack);
        }

        function addTokenToMatch() {
            matchStack = {
                type: TOKEN,
                syntax: state.syntax,
                token: token,
                prev: matchStack
            };

            moveToNextToken();
            syntaxStash = null;

            if (tokenIndex > longestMatch) {
                longestMatch = tokenIndex;
            }
        }

        function openSyntax() {
            syntaxStack = {
                syntax: state.syntax,
                opts: state.syntax.opts || (syntaxStack !== null && syntaxStack.opts) || null,
                prev: syntaxStack
            };

            matchStack = {
                type: OPEN_SYNTAX,
                syntax: state.syntax,
                token: matchStack.token,
                prev: matchStack
            };
        }

        function closeSyntax() {
            if (matchStack.type === OPEN_SYNTAX) {
                matchStack = matchStack.prev;
            } else {
                matchStack = {
                    type: CLOSE_SYNTAX,
                    syntax: syntaxStack.syntax,
                    token: matchStack.token,
                    prev: matchStack
                };
            }

            syntaxStack = syntaxStack.prev;
        }

        var syntaxStack = null;
        var thenStack = null;
        var elseStack = null;

        // null – stashing allowed, nothing stashed
        // false – stashing disabled, nothing stashed
        // anithing else – fail stashable syntaxes, some syntax stashed
        var syntaxStash = null;

        var iterationCount = 0; // count iterations and prevent infinite loop
        var exitReason = null;

        var token = null;
        var tokenIndex = -1;
        var longestMatch = 0;
        var matchStack = {
            type: STUB,
            syntax: null,
            token: null,
            prev: null
        };

        moveToNextToken();

        while (exitReason === null && ++iterationCount < ITERATION_LIMIT) {
            // function mapList(list, fn) {
            //     var result = [];
            //     while (list) {
            //         result.unshift(fn(list));
            //         list = list.prev;
            //     }
            //     return result;
            // }
            // console.log('--\n',
            //     '#' + iterationCount,
            //     require('util').inspect({
            //         match: mapList(matchStack, x => x.type === TOKEN ? x.token && x.token.value : x.syntax ? ({ [OPEN_SYNTAX]: '<', [CLOSE_SYNTAX]: '</' }[x.type] || x.type) + '!' + x.syntax.name : null),
            //         token: token && token.value,
            //         tokenIndex,
            //         syntax: syntax.type + (syntax.id ? ' #' + syntax.id : '')
            //     }, { depth: null })
            // );
            switch (state.type) {
                case 'Match':
                    if (thenStack === null) {
                        // turn to MISMATCH when some tokens left unmatched
                        if (token !== null) {
                            // doesn't mismatch if just one token left and it's an IE hack
                            if (tokenIndex !== tokens.length - 1 || (token.value !== '\\0' && token.value !== '\\9')) {
                                state = MISMATCH$1;
                                break;
                            }
                        }

                        // break the main loop, return a result - MATCH
                        exitReason = EXIT_REASON_MATCH;
                        break;
                    }

                    // go to next syntax (`then` branch)
                    state = thenStack.nextState;

                    // check match is not empty
                    if (state === DISALLOW_EMPTY$1) {
                        if (thenStack.matchStack === matchStack) {
                            state = MISMATCH$1;
                            break;
                        } else {
                            state = MATCH$1;
                        }
                    }

                    // close syntax if needed
                    while (thenStack.syntaxStack !== syntaxStack) {
                        closeSyntax();
                    }

                    // pop stack
                    thenStack = thenStack.prev;
                    break;

                case 'Mismatch':
                    // when some syntax is stashed
                    if (syntaxStash !== null && syntaxStash !== false) {
                        // there is no else branches or a branch reduce match stack
                        if (elseStack === null || tokenIndex > elseStack.tokenIndex) {
                            // restore state from the stash
                            elseStack = syntaxStash;
                            syntaxStash = false; // disable stashing
                        }
                    } else if (elseStack === null) {
                        // no else branches -> break the main loop
                        // return a result - MISMATCH
                        exitReason = EXIT_REASON_MISMATCH;
                        break;
                    }

                    // go to next syntax (`else` branch)
                    state = elseStack.nextState;

                    // restore all the rest stack states
                    thenStack = elseStack.thenStack;
                    syntaxStack = elseStack.syntaxStack;
                    matchStack = elseStack.matchStack;
                    tokenIndex = elseStack.tokenIndex;
                    token = tokenIndex < tokens.length ? tokens[tokenIndex] : null;

                    // pop stack
                    elseStack = elseStack.prev;
                    break;

                case 'MatchGraph':
                    state = state.match;
                    break;

                case 'If':
                    // IMPORTANT: else stack push must go first,
                    // since it stores the state of thenStack before changes
                    if (state.else !== MISMATCH$1) {
                        pushElseStack(state.else);
                    }

                    if (state.then !== MATCH$1) {
                        pushThenStack(state.then);
                    }

                    state = state.match;
                    break;

                case 'MatchOnce':
                    state = {
                        type: 'MatchOnceBuffer',
                        syntax: state,
                        index: 0,
                        mask: 0
                    };
                    break;

                case 'MatchOnceBuffer':
                    var terms = state.syntax.terms;

                    if (state.index === terms.length) {
                        // no matches at all or it's required all terms to be matched
                        if (state.mask === 0 || state.syntax.all) {
                            state = MISMATCH$1;
                            break;
                        }

                        // a partial match is ok
                        state = MATCH$1;
                        break;
                    }

                    // all terms are matched
                    if (state.mask === (1 << terms.length) - 1) {
                        state = MATCH$1;
                        break;
                    }

                    for (; state.index < terms.length; state.index++) {
                        var matchFlag = 1 << state.index;

                        if ((state.mask & matchFlag) === 0) {
                            // IMPORTANT: else stack push must go first,
                            // since it stores the state of thenStack before changes
                            pushElseStack(state);
                            pushThenStack({
                                type: 'AddMatchOnce',
                                syntax: state.syntax,
                                mask: state.mask | matchFlag
                            });

                            // match
                            state = terms[state.index++];
                            break;
                        }
                    }
                    break;

                case 'AddMatchOnce':
                    state = {
                        type: 'MatchOnceBuffer',
                        syntax: state.syntax,
                        index: 0,
                        mask: state.mask
                    };
                    break;

                case 'Enum':
                    if (token !== null) {
                        var name = token.value.toLowerCase();

                        // drop \0 and \9 hack from keyword name
                        if (name.indexOf('\\') !== -1) {
                            name = name.replace(/\\[09].*$/, '');
                        }

                        if (hasOwnProperty$1.call(state.map, name)) {
                            state = state.map[name];
                            break;
                        }
                    }

                    state = MISMATCH$1;
                    break;

                case 'Generic':
                    var opts = syntaxStack !== null ? syntaxStack.opts : null;
                    var lastTokenIndex = tokenIndex + Math.floor(state.fn(token, getNextToken, opts));

                    if (!isNaN(lastTokenIndex) && lastTokenIndex > tokenIndex) {
                        while (tokenIndex < lastTokenIndex) {
                            addTokenToMatch();
                        }

                        state = MATCH$1;
                    } else {
                        state = MISMATCH$1;
                    }

                    break;

                case 'Type':
                case 'Property':
                    var syntaxDict = state.type === 'Type' ? 'types' : 'properties';
                    var dictSyntax = hasOwnProperty$1.call(syntaxes, syntaxDict) ? syntaxes[syntaxDict][state.name] : null;

                    if (!dictSyntax || !dictSyntax.match) {
                        throw new Error(
                            'Bad syntax reference: ' +
                            (state.type === 'Type'
                                ? '<' + state.name + '>'
                                : '<\'' + state.name + '\'>')
                        );
                    }

                    // stash a syntax for types with low priority
                    if (syntaxStash !== false && token !== null && state.type === 'Type') {
                        var lowPriorityMatching =
                            // https://drafts.csswg.org/css-values-4/#custom-idents
                            // When parsing positionally-ambiguous keywords in a property value, a <custom-ident> production
                            // can only claim the keyword if no other unfulfilled production can claim it.
                            (state.name === 'custom-ident' && token.type === TYPE$6.Ident) ||

                            // https://drafts.csswg.org/css-values-4/#lengths
                            // ... if a `0` could be parsed as either a <number> or a <length> in a property (such as line-height),
                            // it must parse as a <number>
                            (state.name === 'length' && token.value === '0');

                        if (lowPriorityMatching) {
                            if (syntaxStash === null) {
                                syntaxStash = stateSnapshotFromSyntax(state, elseStack);
                            }

                            state = MISMATCH$1;
                            break;
                        }
                    }

                    openSyntax();
                    state = dictSyntax.match;
                    break;

                case 'Keyword':
                    var name = state.name;

                    if (token !== null) {
                        var keywordName = token.value;

                        // drop \0 and \9 hack from keyword name
                        if (keywordName.indexOf('\\') !== -1) {
                            keywordName = keywordName.replace(/\\[09].*$/, '');
                        }

                        if (areStringsEqualCaseInsensitive(keywordName, name)) {
                            addTokenToMatch();
                            state = MATCH$1;
                            break;
                        }
                    }

                    state = MISMATCH$1;
                    break;

                case 'AtKeyword':
                case 'Function':
                    if (token !== null && areStringsEqualCaseInsensitive(token.value, state.name)) {
                        addTokenToMatch();
                        state = MATCH$1;
                        break;
                    }

                    state = MISMATCH$1;
                    break;

                case 'Token':
                    if (token !== null && token.value === state.value) {
                        addTokenToMatch();
                        state = MATCH$1;
                        break;
                    }

                    state = MISMATCH$1;
                    break;

                case 'Comma':
                    if (token !== null && token.type === TYPE$6.Comma) {
                        if (isCommaContextStart(matchStack.token)) {
                            state = MISMATCH$1;
                        } else {
                            addTokenToMatch();
                            state = isCommaContextEnd(token) ? MISMATCH$1 : MATCH$1;
                        }
                    } else {
                        state = isCommaContextStart(matchStack.token) || isCommaContextEnd(token) ? MATCH$1 : MISMATCH$1;
                    }

                    break;

                case 'String':
                    var string = '';

                    for (var lastTokenIndex = tokenIndex; lastTokenIndex < tokens.length && string.length < state.value.length; lastTokenIndex++) {
                        string += tokens[lastTokenIndex].value;
                    }

                    if (areStringsEqualCaseInsensitive(string, state.value)) {
                        while (tokenIndex < lastTokenIndex) {
                            addTokenToMatch();
                        }

                        state = MATCH$1;
                    } else {
                        state = MISMATCH$1;
                    }

                    break;

                default:
                    throw new Error('Unknown node type: ' + state.type);
            }
        }

        totalIterationCount += iterationCount;

        switch (exitReason) {
            case null:
                console.warn('[csstree-match] BREAK after ' + ITERATION_LIMIT + ' iterations');
                exitReason = EXIT_REASON_ITERATION_LIMIT;
                matchStack = null;
                break;

            case EXIT_REASON_MATCH:
                while (syntaxStack !== null) {
                    closeSyntax();
                }
                break;

            default:
                matchStack = null;
        }

        return {
            tokens: tokens,
            reason: exitReason,
            iterations: iterationCount,
            match: matchStack,
            longestMatch: longestMatch
        };
    }

    function matchAsList(tokens, matchGraph, syntaxes) {
        var matchResult = internalMatch(tokens, matchGraph, syntaxes || {});

        if (matchResult.match !== null) {
            var item = reverseList(matchResult.match).prev;

            matchResult.match = [];

            while (item !== null) {
                switch (item.type) {
                    case STUB:
                        break;

                    case OPEN_SYNTAX:
                    case CLOSE_SYNTAX:
                        matchResult.match.push({
                            type: item.type,
                            syntax: item.syntax
                        });
                        break;

                    default:
                        matchResult.match.push({
                            token: item.token.value,
                            node: item.token.node
                        });
                        break;
                }

                item = item.prev;
            }
        }

        return matchResult;
    }

    function matchAsTree(tokens, matchGraph, syntaxes) {
        var matchResult = internalMatch(tokens, matchGraph, syntaxes || {});

        if (matchResult.match === null) {
            return matchResult;
        }

        var item = matchResult.match;
        var host = matchResult.match = {
            syntax: matchGraph.syntax || null,
            match: []
        };
        var hostStack = [host];

        // revert a list and start with 2nd item since 1st is a stub item
        item = reverseList(item).prev;

        // build a tree
        while (item !== null) {
            switch (item.type) {
                case OPEN_SYNTAX:
                    host.match.push(host = {
                        syntax: item.syntax,
                        match: []
                    });
                    hostStack.push(host);
                    break;

                case CLOSE_SYNTAX:
                    hostStack.pop();
                    host = hostStack[hostStack.length - 1];
                    break;

                default:
                    host.match.push({
                        syntax: item.syntax || null,
                        token: item.token.value,
                        node: item.token.node
                    });
            }

            item = item.prev;
        }

        return matchResult;
    }

    var match = {
        matchAsList: matchAsList,
        matchAsTree: matchAsTree,
        getTotalIterationCount: function() {
            return totalIterationCount;
        }
    };

    function getTrace(node) {
        function shouldPutToTrace(syntax) {
            if (syntax === null) {
                return false;
            }

            return (
                syntax.type === 'Type' ||
                syntax.type === 'Property' ||
                syntax.type === 'Keyword'
            );
        }

        function hasMatch(matchNode) {
            if (Array.isArray(matchNode.match)) {
                // use for-loop for better perfomance
                for (var i = 0; i < matchNode.match.length; i++) {
                    if (hasMatch(matchNode.match[i])) {
                        if (shouldPutToTrace(matchNode.syntax)) {
                            result.unshift(matchNode.syntax);
                        }

                        return true;
                    }
                }
            } else if (matchNode.node === node) {
                result = shouldPutToTrace(matchNode.syntax)
                    ? [matchNode.syntax]
                    : [];

                return true;
            }

            return false;
        }

        var result = null;

        if (this.matched !== null) {
            hasMatch(this.matched);
        }

        return result;
    }

    function testNode(match, node, fn) {
        var trace = getTrace.call(match, node);

        if (trace === null) {
            return false;
        }

        return trace.some(fn);
    }

    function isType(node, type) {
        return testNode(this, node, function(matchNode) {
            return matchNode.type === 'Type' && matchNode.name === type;
        });
    }

    function isProperty(node, property) {
        return testNode(this, node, function(matchNode) {
            return matchNode.type === 'Property' && matchNode.name === property;
        });
    }

    function isKeyword(node) {
        return testNode(this, node, function(matchNode) {
            return matchNode.type === 'Keyword';
        });
    }

    var trace = {
        getTrace: getTrace,
        isType: isType,
        isProperty: isProperty,
        isKeyword: isKeyword
    };

    function getFirstMatchNode(matchNode) {
        if ('node' in matchNode) {
            return matchNode.node;
        }

        return getFirstMatchNode(matchNode.match[0]);
    }

    function getLastMatchNode(matchNode) {
        if ('node' in matchNode) {
            return matchNode.node;
        }

        return getLastMatchNode(matchNode.match[matchNode.match.length - 1]);
    }

    function matchFragments(lexer, ast, match, type, name) {
        function findFragments(matchNode) {
            if (matchNode.syntax !== null &&
                matchNode.syntax.type === type &&
                matchNode.syntax.name === name) {
                var start = getFirstMatchNode(matchNode);
                var end = getLastMatchNode(matchNode);

                lexer.syntax.walk(ast, function(node, item, list) {
                    if (node === start) {
                        var nodes = new List_1();

                        do {
                            nodes.appendData(item.data);

                            if (item.data === end) {
                                break;
                            }

                            item = item.next;
                        } while (item !== null);

                        fragments.push({
                            parent: list,
                            nodes: nodes
                        });
                    }
                });
            }

            if (Array.isArray(matchNode.match)) {
                matchNode.match.forEach(findFragments);
            }
        }

        var fragments = [];

        if (match.matched !== null) {
            findFragments(match.matched);
        }

        return fragments;
    }

    var search = {
        matchFragments: matchFragments
    };

    var hasOwnProperty$2 = Object.prototype.hasOwnProperty;

    function isValidNumber(value) {
        // Number.isInteger(value) && value >= 0
        return (
            typeof value === 'number' &&
            isFinite(value) &&
            Math.floor(value) === value &&
            value >= 0
        );
    }

    function isValidLocation(loc) {
        return (
            Boolean(loc) &&
            isValidNumber(loc.offset) &&
            isValidNumber(loc.line) &&
            isValidNumber(loc.column)
        );
    }

    function createNodeStructureChecker(type, fields) {
        return function checkNode(node, warn) {
            if (!node || node.constructor !== Object) {
                return warn(node, 'Type of node should be an Object');
            }

            for (var key in node) {
                var valid = true;

                if (hasOwnProperty$2.call(node, key) === false) {
                    continue;
                }

                if (key === 'type') {
                    if (node.type !== type) {
                        warn(node, 'Wrong node type `' + node.type + '`, expected `' + type + '`');
                    }
                } else if (key === 'loc') {
                    if (node.loc === null) {
                        continue;
                    } else if (node.loc && node.loc.constructor === Object) {
                        if (typeof node.loc.source !== 'string') {
                            key += '.source';
                        } else if (!isValidLocation(node.loc.start)) {
                            key += '.start';
                        } else if (!isValidLocation(node.loc.end)) {
                            key += '.end';
                        } else {
                            continue;
                        }
                    }

                    valid = false;
                } else if (fields.hasOwnProperty(key)) {
                    for (var i = 0, valid = false; !valid && i < fields[key].length; i++) {
                        var fieldType = fields[key][i];

                        switch (fieldType) {
                            case String:
                                valid = typeof node[key] === 'string';
                                break;

                            case Boolean:
                                valid = typeof node[key] === 'boolean';
                                break;

                            case null:
                                valid = node[key] === null;
                                break;

                            default:
                                if (typeof fieldType === 'string') {
                                    valid = node[key] && node[key].type === fieldType;
                                } else if (Array.isArray(fieldType)) {
                                    valid = node[key] instanceof List_1;
                                }
                        }
                    }
                } else {
                    warn(node, 'Unknown field `' + key + '` for ' + type + ' node type');
                }

                if (!valid) {
                    warn(node, 'Bad value for `' + type + '.' + key + '`');
                }
            }

            for (var key in fields) {
                if (hasOwnProperty$2.call(fields, key) &&
                    hasOwnProperty$2.call(node, key) === false) {
                    warn(node, 'Field `' + type + '.' + key + '` is missed');
                }
            }
        };
    }

    function processStructure(name, nodeType) {
        var structure = nodeType.structure;
        var fields = {
            type: String,
            loc: true
        };
        var docs = {
            type: '"' + name + '"'
        };

        for (var key in structure) {
            if (hasOwnProperty$2.call(structure, key) === false) {
                continue;
            }

            var docsTypes = [];
            var fieldTypes = fields[key] = Array.isArray(structure[key])
                ? structure[key].slice()
                : [structure[key]];

            for (var i = 0; i < fieldTypes.length; i++) {
                var fieldType = fieldTypes[i];
                if (fieldType === String || fieldType === Boolean) {
                    docsTypes.push(fieldType.name);
                } else if (fieldType === null) {
                    docsTypes.push('null');
                } else if (typeof fieldType === 'string') {
                    docsTypes.push('<' + fieldType + '>');
                } else if (Array.isArray(fieldType)) {
                    docsTypes.push('List'); // TODO: use type enum
                } else {
                    throw new Error('Wrong value `' + fieldType + '` in `' + name + '.' + key + '` structure definition');
                }
            }

            docs[key] = docsTypes.join(' | ');
        }

        return {
            docs: docs,
            check: createNodeStructureChecker(name, fields)
        };
    }

    var structure = {
        getStructureFromConfig: function(config) {
            var structure = {};

            if (config.node) {
                for (var name in config.node) {
                    if (hasOwnProperty$2.call(config.node, name)) {
                        var nodeType = config.node[name];

                        if (nodeType.structure) {
                            structure[name] = processStructure(name, nodeType);
                        } else {
                            throw new Error('Missed `structure` field in `' + name + '` node type definition');
                        }
                    }
                }
            }

            return structure;
        }
    };

    var SyntaxReferenceError$1 = error.SyntaxReferenceError;
    var MatchError$1 = error.MatchError;






    var buildMatchGraph$1 = matchGraph.buildMatchGraph;
    var matchAsTree$1 = match.matchAsTree;


    var getStructureFromConfig = structure.getStructureFromConfig;
    var cssWideKeywords$1 = buildMatchGraph$1('inherit | initial | unset');
    var cssWideKeywordsWithExpression = buildMatchGraph$1('inherit | initial | unset | <-ms-legacy-expression>');

    function dumpMapSyntax(map, compact, syntaxAsAst) {
        var result = {};

        for (var name in map) {
            if (map[name].syntax) {
                result[name] = syntaxAsAst
                    ? map[name].syntax
                    : generate_1(map[name].syntax, { compact: compact });
            }
        }

        return result;
    }

    function valueHasVar(tokens) {
        for (var i = 0; i < tokens.length; i++) {
            if (tokens[i].value.toLowerCase() === 'var(') {
                return true;
            }
        }

        return false;
    }

    function buildMatchResult(match, error, iterations) {
        return {
            matched: match,
            iterations: iterations,
            error: error,
            getTrace: trace.getTrace,
            isType: trace.isType,
            isProperty: trace.isProperty,
            isKeyword: trace.isKeyword
        };
    }

    function matchSyntax(lexer, syntax, value, useCommon) {
        var tokens = prepareTokens_1(value, lexer.syntax);
        var result;

        if (valueHasVar(tokens)) {
            return buildMatchResult(null, new Error('Matching for a tree with var() is not supported'));
        }

        if (useCommon) {
            result = matchAsTree$1(tokens, lexer.valueCommonSyntax, lexer);
        }

        if (!useCommon || !result.match) {
            result = matchAsTree$1(tokens, syntax.match, lexer);
            if (!result.match) {
                return buildMatchResult(
                    null,
                    new MatchError$1(result.reason, syntax.syntax, value, result),
                    result.iterations
                );
            }
        }

        return buildMatchResult(result.match, null, result.iterations);
    }

    var Lexer = function(config, syntax, structure) {
        this.valueCommonSyntax = cssWideKeywords$1;
        this.syntax = syntax;
        this.generic = false;
        this.atrules = {};
        this.properties = {};
        this.types = {};
        this.structure = structure || getStructureFromConfig(config);

        if (config) {
            if (config.types) {
                for (var name in config.types) {
                    this.addType_(name, config.types[name]);
                }
            }

            if (config.generic) {
                this.generic = true;
                for (var name in generic) {
                    this.addType_(name, generic[name]);
                }
            }

            if (config.atrules) {
                for (var name in config.atrules) {
                    this.addAtrule_(name, config.atrules[name]);
                }
            }

            if (config.properties) {
                for (var name in config.properties) {
                    this.addProperty_(name, config.properties[name]);
                }
            }
        }
    };

    Lexer.prototype = {
        structure: {},
        checkStructure: function(ast) {
            function collectWarning(node, message) {
                warns.push({
                    node: node,
                    message: message
                });
            }

            var structure = this.structure;
            var warns = [];

            this.syntax.walk(ast, function(node) {
                if (structure.hasOwnProperty(node.type)) {
                    structure[node.type].check(node, collectWarning);
                } else {
                    collectWarning(node, 'Unknown node type `' + node.type + '`');
                }
            });

            return warns.length ? warns : false;
        },

        createDescriptor: function(syntax, type, name) {
            var ref = {
                type: type,
                name: name
            };
            var descriptor = {
                type: type,
                name: name,
                syntax: null,
                match: null
            };

            if (typeof syntax === 'function') {
                descriptor.match = buildMatchGraph$1(syntax, ref);
            } else {
                if (typeof syntax === 'string') {
                    // lazy parsing on first access
                    Object.defineProperty(descriptor, 'syntax', {
                        get: function() {
                            Object.defineProperty(descriptor, 'syntax', {
                                value: parse_1(syntax)
                            });

                            return descriptor.syntax;
                        }
                    });
                } else {
                    descriptor.syntax = syntax;
                }

                // lazy graph build on first access
                Object.defineProperty(descriptor, 'match', {
                    get: function() {
                        Object.defineProperty(descriptor, 'match', {
                            value: buildMatchGraph$1(descriptor.syntax, ref)
                        });

                        return descriptor.match;
                    }
                });
            }

            return descriptor;
        },
        addAtrule_: function(name, syntax) {
            this.atrules[name] = {
                prelude: syntax.prelude ? this.createDescriptor(syntax.prelude, 'AtrulePrelude', name) : null,
                descriptors: syntax.descriptors
                    ? Object.keys(syntax.descriptors).reduce((res, name) => {
                        res[name] = this.createDescriptor(syntax.descriptors[name], 'AtruleDescriptor', name);
                        return res;
                    }, {})
                    : null
            };
        },
        addProperty_: function(name, syntax) {
            this.properties[name] = this.createDescriptor(syntax, 'Property', name);
        },
        addType_: function(name, syntax) {
            this.types[name] = this.createDescriptor(syntax, 'Type', name);

            if (syntax === generic['-ms-legacy-expression']) {
                this.valueCommonSyntax = cssWideKeywordsWithExpression;
            }
        },

        matchAtrulePrelude: function(atruleName, prelude) {
            var atrule = names.keyword(atruleName);

            var atrulePreludeSyntax = atrule.vendor
                ? this.getAtrulePrelude(atrule.name) || this.getAtrulePrelude(atrule.basename)
                : this.getAtrulePrelude(atrule.name);

            if (!atrulePreludeSyntax) {
                if (atrule.basename in this.atrules) {
                    return buildMatchResult(null, new Error('At-rule `' + atruleName + '` should not contain a prelude'));
                }

                return buildMatchResult(null, new SyntaxReferenceError$1('Unknown at-rule', atruleName));
            }

            return matchSyntax(this, atrulePreludeSyntax, prelude, true);
        },
        matchAtruleDescriptor: function(atruleName, descriptorName, value) {
            var atrule = names.keyword(atruleName);
            var descriptor = names.keyword(descriptorName);

            var atruleEntry = atrule.vendor
                ? this.atrules[atrule.name] || this.atrules[atrule.basename]
                : this.atrules[atrule.name];

            if (!atruleEntry) {
                return buildMatchResult(null, new SyntaxReferenceError$1('Unknown at-rule', atruleName));
            }

            if (!atruleEntry.descriptors) {
                return buildMatchResult(null, new Error('At-rule `' + atruleName + '` has no known descriptors'));
            }

            var atruleDescriptorSyntax = descriptor.vendor
                ? atruleEntry.descriptors[descriptor.name] || atruleEntry.descriptors[descriptor.basename]
                : atruleEntry.descriptors[descriptor.name];

            if (!atruleDescriptorSyntax) {
                return buildMatchResult(null, new SyntaxReferenceError$1('Unknown at-rule descriptor', descriptorName));
            }

            return matchSyntax(this, atruleDescriptorSyntax, value, true);
        },
        matchDeclaration: function(node) {
            if (node.type !== 'Declaration') {
                return buildMatchResult(null, new Error('Not a Declaration node'));
            }

            return this.matchProperty(node.property, node.value);
        },
        matchProperty: function(propertyName, value) {
            var property = names.property(propertyName);

            // don't match syntax for a custom property
            if (property.custom) {
                return buildMatchResult(null, new Error('Lexer matching doesn\'t applicable for custom properties'));
            }

            var propertySyntax = property.vendor
                ? this.getProperty(property.name) || this.getProperty(property.basename)
                : this.getProperty(property.name);

            if (!propertySyntax) {
                return buildMatchResult(null, new SyntaxReferenceError$1('Unknown property', propertyName));
            }

            return matchSyntax(this, propertySyntax, value, true);
        },
        matchType: function(typeName, value) {
            var typeSyntax = this.getType(typeName);

            if (!typeSyntax) {
                return buildMatchResult(null, new SyntaxReferenceError$1('Unknown type', typeName));
            }

            return matchSyntax(this, typeSyntax, value, false);
        },
        match: function(syntax, value) {
            if (typeof syntax !== 'string' && (!syntax || !syntax.type)) {
                return buildMatchResult(null, new SyntaxReferenceError$1('Bad syntax'));
            }

            if (typeof syntax === 'string' || !syntax.match) {
                syntax = this.createDescriptor(syntax, 'Type', 'anonymous');
            }

            return matchSyntax(this, syntax, value, false);
        },

        findValueFragments: function(propertyName, value, type, name) {
            return search.matchFragments(this, value, this.matchProperty(propertyName, value), type, name);
        },
        findDeclarationValueFragments: function(declaration, type, name) {
            return search.matchFragments(this, declaration.value, this.matchDeclaration(declaration), type, name);
        },
        findAllFragments: function(ast, type, name) {
            var result = [];

            this.syntax.walk(ast, {
                visit: 'Declaration',
                enter: function(declaration) {
                    result.push.apply(result, this.findDeclarationValueFragments(declaration, type, name));
                }.bind(this)
            });

            return result;
        },

        getAtrulePrelude: function(atruleName) {
            return this.atrules.hasOwnProperty(atruleName) ? this.atrules[atruleName].prelude : null;
        },
        getAtruleDescriptor: function(atruleName, name) {
            return this.atrules.hasOwnProperty(atruleName) && this.atrules.declarators
                ? this.atrules[atruleName].declarators[name] || null
                : null;
        },
        getProperty: function(name) {
            return this.properties.hasOwnProperty(name) ? this.properties[name] : null;
        },
        getType: function(name) {
            return this.types.hasOwnProperty(name) ? this.types[name] : null;
        },

        validate: function() {
            function validate(syntax, name, broken, descriptor) {
                if (broken.hasOwnProperty(name)) {
                    return broken[name];
                }

                broken[name] = false;
                if (descriptor.syntax !== null) {
                    walk(descriptor.syntax, function(node) {
                        if (node.type !== 'Type' && node.type !== 'Property') {
                            return;
                        }

                        var map = node.type === 'Type' ? syntax.types : syntax.properties;
                        var brokenMap = node.type === 'Type' ? brokenTypes : brokenProperties;

                        if (!map.hasOwnProperty(node.name) || validate(syntax, node.name, brokenMap, map[node.name])) {
                            broken[name] = true;
                        }
                    }, this);
                }
            }

            var brokenTypes = {};
            var brokenProperties = {};

            for (var key in this.types) {
                validate(this, key, brokenTypes, this.types[key]);
            }

            for (var key in this.properties) {
                validate(this, key, brokenProperties, this.properties[key]);
            }

            brokenTypes = Object.keys(brokenTypes).filter(function(name) {
                return brokenTypes[name];
            });
            brokenProperties = Object.keys(brokenProperties).filter(function(name) {
                return brokenProperties[name];
            });

            if (brokenTypes.length || brokenProperties.length) {
                return {
                    types: brokenTypes,
                    properties: brokenProperties
                };
            }

            return null;
        },
        dump: function(syntaxAsAst, pretty) {
            return {
                generic: this.generic,
                types: dumpMapSyntax(this.types, !pretty, syntaxAsAst),
                properties: dumpMapSyntax(this.properties, !pretty, syntaxAsAst)
            };
        },
        toString: function() {
            return JSON.stringify(this.dump());
        }
    };

    var Lexer_1 = Lexer;

    var definitionSyntax = {
        SyntaxError: _SyntaxError$1,
        parse: parse_1,
        generate: generate_1,
        walk: walk
    };

    var isBOM$2 = tokenizer.isBOM;

    var N$3 = 10;
    var F$2 = 12;
    var R$2 = 13;

    function computeLinesAndColumns(host, source) {
        var sourceLength = source.length;
        var lines = adoptBuffer(host.lines, sourceLength); // +1
        var line = host.startLine;
        var columns = adoptBuffer(host.columns, sourceLength);
        var column = host.startColumn;
        var startOffset = source.length > 0 ? isBOM$2(source.charCodeAt(0)) : 0;

        for (var i = startOffset; i < sourceLength; i++) { // -1
            var code = source.charCodeAt(i);

            lines[i] = line;
            columns[i] = column++;

            if (code === N$3 || code === R$2 || code === F$2) {
                if (code === R$2 && i + 1 < sourceLength && source.charCodeAt(i + 1) === N$3) {
                    i++;
                    lines[i] = line;
                    columns[i] = column;
                }

                line++;
                column = 1;
            }
        }

        lines[i] = line;
        columns[i] = column;

        host.lines = lines;
        host.columns = columns;
    }

    var OffsetToLocation = function() {
        this.lines = null;
        this.columns = null;
        this.linesAndColumnsComputed = false;
    };

    OffsetToLocation.prototype = {
        setSource: function(source, startOffset, startLine, startColumn) {
            this.source = source;
            this.startOffset = typeof startOffset === 'undefined' ? 0 : startOffset;
            this.startLine = typeof startLine === 'undefined' ? 1 : startLine;
            this.startColumn = typeof startColumn === 'undefined' ? 1 : startColumn;
            this.linesAndColumnsComputed = false;
        },

        ensureLinesAndColumnsComputed: function() {
            if (!this.linesAndColumnsComputed) {
                computeLinesAndColumns(this, this.source);
                this.linesAndColumnsComputed = true;
            }
        },
        getLocation: function(offset, filename) {
            this.ensureLinesAndColumnsComputed();

            return {
                source: filename,
                offset: this.startOffset + offset,
                line: this.lines[offset],
                column: this.columns[offset]
            };
        },
        getLocationRange: function(start, end, filename) {
            this.ensureLinesAndColumnsComputed();

            return {
                source: filename,
                start: {
                    offset: this.startOffset + start,
                    line: this.lines[start],
                    column: this.columns[start]
                },
                end: {
                    offset: this.startOffset + end,
                    line: this.lines[end],
                    column: this.columns[end]
                }
            };
        }
    };

    var OffsetToLocation_1 = OffsetToLocation;

    var TYPE$7 = tokenizer.TYPE;
    var WHITESPACE$2 = TYPE$7.WhiteSpace;
    var COMMENT$2 = TYPE$7.Comment;

    var sequence = function readSequence(recognizer) {
        var children = this.createList();
        var child = null;
        var context = {
            recognizer: recognizer,
            space: null,
            ignoreWS: false,
            ignoreWSAfter: false
        };

        this.scanner.skipSC();

        while (!this.scanner.eof) {
            switch (this.scanner.tokenType) {
                case COMMENT$2:
                    this.scanner.next();
                    continue;

                case WHITESPACE$2:
                    if (context.ignoreWS) {
                        this.scanner.next();
                    } else {
                        context.space = this.WhiteSpace();
                    }
                    continue;
            }

            child = recognizer.getNode.call(this, context);

            if (child === undefined) {
                break;
            }

            if (context.space !== null) {
                children.push(context.space);
                context.space = null;
            }

            children.push(child);

            if (context.ignoreWSAfter) {
                context.ignoreWSAfter = false;
                context.ignoreWS = true;
            } else {
                context.ignoreWS = false;
            }
        }

        return children;
    };

    var findWhiteSpaceStart$1 = utils.findWhiteSpaceStart;

    var noop$2 = function() {};

    var TYPE$8 = _const.TYPE;
    var NAME$2 = _const.NAME;
    var WHITESPACE$3 = TYPE$8.WhiteSpace;
    var IDENT$2 = TYPE$8.Ident;
    var FUNCTION = TYPE$8.Function;
    var URL = TYPE$8.Url;
    var HASH = TYPE$8.Hash;
    var PERCENTAGE = TYPE$8.Percentage;
    var NUMBER$2 = TYPE$8.Number;
    var NUMBERSIGN$1 = 0x0023; // U+0023 NUMBER SIGN (#)
    var NULL = 0;

    function createParseContext(name) {
        return function() {
            return this[name]();
        };
    }

    function processConfig(config) {
        var parserConfig = {
            context: {},
            scope: {},
            atrule: {},
            pseudo: {}
        };

        if (config.parseContext) {
            for (var name in config.parseContext) {
                switch (typeof config.parseContext[name]) {
                    case 'function':
                        parserConfig.context[name] = config.parseContext[name];
                        break;

                    case 'string':
                        parserConfig.context[name] = createParseContext(config.parseContext[name]);
                        break;
                }
            }
        }

        if (config.scope) {
            for (var name in config.scope) {
                parserConfig.scope[name] = config.scope[name];
            }
        }

        if (config.atrule) {
            for (var name in config.atrule) {
                var atrule = config.atrule[name];

                if (atrule.parse) {
                    parserConfig.atrule[name] = atrule.parse;
                }
            }
        }

        if (config.pseudo) {
            for (var name in config.pseudo) {
                var pseudo = config.pseudo[name];

                if (pseudo.parse) {
                    parserConfig.pseudo[name] = pseudo.parse;
                }
            }
        }

        if (config.node) {
            for (var name in config.node) {
                parserConfig[name] = config.node[name].parse;
            }
        }

        return parserConfig;
    }

    var create = function createParser(config) {
        var parser = {
            scanner: new TokenStream_1(),
            locationMap: new OffsetToLocation_1(),

            filename: '<unknown>',
            needPositions: false,
            onParseError: noop$2,
            onParseErrorThrow: false,
            parseAtrulePrelude: true,
            parseRulePrelude: true,
            parseValue: true,
            parseCustomProperty: false,

            readSequence: sequence,

            createList: function() {
                return new List_1();
            },
            createSingleNodeList: function(node) {
                return new List_1().appendData(node);
            },
            getFirstListNode: function(list) {
                return list && list.first();
            },
            getLastListNode: function(list) {
                return list.last();
            },

            parseWithFallback: function(consumer, fallback) {
                var startToken = this.scanner.tokenIndex;

                try {
                    return consumer.call(this);
                } catch (e) {
                    if (this.onParseErrorThrow) {
                        throw e;
                    }

                    var fallbackNode = fallback.call(this, startToken);

                    this.onParseErrorThrow = true;
                    this.onParseError(e, fallbackNode);
                    this.onParseErrorThrow = false;

                    return fallbackNode;
                }
            },

            lookupNonWSType: function(offset) {
                do {
                    var type = this.scanner.lookupType(offset++);
                    if (type !== WHITESPACE$3) {
                        return type;
                    }
                } while (type !== NULL);

                return NULL;
            },

            eat: function(tokenType) {
                if (this.scanner.tokenType !== tokenType) {
                    var offset = this.scanner.tokenStart;
                    var message = NAME$2[tokenType] + ' is expected';

                    // tweak message and offset
                    switch (tokenType) {
                        case IDENT$2:
                            // when identifier is expected but there is a function or url
                            if (this.scanner.tokenType === FUNCTION || this.scanner.tokenType === URL) {
                                offset = this.scanner.tokenEnd - 1;
                                message = 'Identifier is expected but function found';
                            } else {
                                message = 'Identifier is expected';
                            }
                            break;

                        case HASH:
                            if (this.scanner.isDelim(NUMBERSIGN$1)) {
                                this.scanner.next();
                                offset++;
                                message = 'Name is expected';
                            }
                            break;

                        case PERCENTAGE:
                            if (this.scanner.tokenType === NUMBER$2) {
                                offset = this.scanner.tokenEnd;
                                message = 'Percent sign is expected';
                            }
                            break;

                        default:
                            // when test type is part of another token show error for current position + 1
                            // e.g. eat(HYPHENMINUS) will fail on "-foo", but pointing on "-" is odd
                            if (this.scanner.source.charCodeAt(this.scanner.tokenStart) === tokenType) {
                                offset = offset + 1;
                            }
                    }

                    this.error(message, offset);
                }

                this.scanner.next();
            },

            consume: function(tokenType) {
                var value = this.scanner.getTokenValue();

                this.eat(tokenType);

                return value;
            },
            consumeFunctionName: function() {
                var name = this.scanner.source.substring(this.scanner.tokenStart, this.scanner.tokenEnd - 1);

                this.eat(FUNCTION);

                return name;
            },

            getLocation: function(start, end) {
                if (this.needPositions) {
                    return this.locationMap.getLocationRange(
                        start,
                        end,
                        this.filename
                    );
                }

                return null;
            },
            getLocationFromList: function(list) {
                if (this.needPositions) {
                    var head = this.getFirstListNode(list);
                    var tail = this.getLastListNode(list);
                    return this.locationMap.getLocationRange(
                        head !== null ? head.loc.start.offset - this.locationMap.startOffset : this.scanner.tokenStart,
                        tail !== null ? tail.loc.end.offset - this.locationMap.startOffset : this.scanner.tokenStart,
                        this.filename
                    );
                }

                return null;
            },

            error: function(message, offset) {
                var location = typeof offset !== 'undefined' && offset < this.scanner.source.length
                    ? this.locationMap.getLocation(offset)
                    : this.scanner.eof
                        ? this.locationMap.getLocation(findWhiteSpaceStart$1(this.scanner.source, this.scanner.source.length - 1))
                        : this.locationMap.getLocation(this.scanner.tokenStart);

                throw new _SyntaxError(
                    message || 'Unexpected input',
                    this.scanner.source,
                    location.offset,
                    location.line,
                    location.column
                );
            }
        };

        config = processConfig(config || {});
        for (var key in config) {
            parser[key] = config[key];
        }

        return function(source, options) {
            options = options || {};

            var context = options.context || 'default';
            var ast;

            tokenizer(source, parser.scanner);
            parser.locationMap.setSource(
                source,
                options.offset,
                options.line,
                options.column
            );

            parser.filename = options.filename || '<unknown>';
            parser.needPositions = Boolean(options.positions);
            parser.onParseError = typeof options.onParseError === 'function' ? options.onParseError : noop$2;
            parser.onParseErrorThrow = false;
            parser.parseAtrulePrelude = 'parseAtrulePrelude' in options ? Boolean(options.parseAtrulePrelude) : true;
            parser.parseRulePrelude = 'parseRulePrelude' in options ? Boolean(options.parseRulePrelude) : true;
            parser.parseValue = 'parseValue' in options ? Boolean(options.parseValue) : true;
            parser.parseCustomProperty = 'parseCustomProperty' in options ? Boolean(options.parseCustomProperty) : false;

            if (!parser.context.hasOwnProperty(context)) {
                throw new Error('Unknown context `' + context + '`');
            }

            ast = parser.context[context].call(parser, options);

            if (!parser.scanner.eof) {
                parser.error();
            }

            return ast;
        };
    };

    /* -*- Mode: js; js-indent-level: 2; -*- */
    /*
     * Copyright 2011 Mozilla Foundation and contributors
     * Licensed under the New BSD license. See LICENSE or:
     * http://opensource.org/licenses/BSD-3-Clause
     */

    var intToCharMap = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('');

    /**
     * Encode an integer in the range of 0 to 63 to a single base 64 digit.
     */
    var encode = function (number) {
        if (0 <= number && number < intToCharMap.length) {
            return intToCharMap[number];
        }
        throw new TypeError("Must be between 0 and 63: " + number);
    };

    /**
     * Decode a single base 64 character code digit to an integer. Returns -1 on
     * failure.
     */
    var decode = function (charCode) {
        var bigA = 65;     // 'A'
        var bigZ = 90;     // 'Z'

        var littleA = 97;  // 'a'
        var littleZ = 122; // 'z'

        var zero = 48;     // '0'
        var nine = 57;     // '9'

        var plus = 43;     // '+'
        var slash = 47;    // '/'

        var littleOffset = 26;
        var numberOffset = 52;

        // 0 - 25: ABCDEFGHIJKLMNOPQRSTUVWXYZ
        if (bigA <= charCode && charCode <= bigZ) {
            return (charCode - bigA);
        }

        // 26 - 51: abcdefghijklmnopqrstuvwxyz
        if (littleA <= charCode && charCode <= littleZ) {
            return (charCode - littleA + littleOffset);
        }

        // 52 - 61: 0123456789
        if (zero <= charCode && charCode <= nine) {
            return (charCode - zero + numberOffset);
        }

        // 62: +
        if (charCode == plus) {
            return 62;
        }

        // 63: /
        if (charCode == slash) {
            return 63;
        }

        // Invalid base64 digit.
        return -1;
    };

    var base64 = {
        encode: encode,
        decode: decode
    };

    /* -*- Mode: js; js-indent-level: 2; -*- */
    /*
     * Copyright 2011 Mozilla Foundation and contributors
     * Licensed under the New BSD license. See LICENSE or:
     * http://opensource.org/licenses/BSD-3-Clause
     *
     * Based on the Base 64 VLQ implementation in Closure Compiler:
     * https://code.google.com/p/closure-compiler/source/browse/trunk/src/com/google/debugging/sourcemap/Base64VLQ.java
     *
     * Copyright 2011 The Closure Compiler Authors. All rights reserved.
     * Redistribution and use in source and binary forms, with or without
     * modification, are permitted provided that the following conditions are
     * met:
     *
     *  * Redistributions of source code must retain the above copyright
     *    notice, this list of conditions and the following disclaimer.
     *  * Redistributions in binary form must reproduce the above
     *    copyright notice, this list of conditions and the following
     *    disclaimer in the documentation and/or other materials provided
     *    with the distribution.
     *  * Neither the name of Google Inc. nor the names of its
     *    contributors may be used to endorse or promote products derived
     *    from this software without specific prior written permission.
     *
     * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
     * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
     * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
     * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
     * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
     * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
     * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
     * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
     * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
     * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
     * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
     */



    // A single base 64 digit can contain 6 bits of data. For the base 64 variable
    // length quantities we use in the source map spec, the first bit is the sign,
    // the next four bits are the actual value, and the 6th bit is the
    // continuation bit. The continuation bit tells us whether there are more
    // digits in this value following this digit.
    //
    //   Continuation
    //   |    Sign
    //   |    |
    //   V    V
    //   101011

    var VLQ_BASE_SHIFT = 5;

    // binary: 100000
    var VLQ_BASE = 1 << VLQ_BASE_SHIFT;

    // binary: 011111
    var VLQ_BASE_MASK = VLQ_BASE - 1;

    // binary: 100000
    var VLQ_CONTINUATION_BIT = VLQ_BASE;

    /**
     * Converts from a two-complement value to a value where the sign bit is
     * placed in the least significant bit.  For example, as decimals:
     *   1 becomes 2 (10 binary), -1 becomes 3 (11 binary)
     *   2 becomes 4 (100 binary), -2 becomes 5 (101 binary)
     */
    function toVLQSigned(aValue) {
        return aValue < 0
            ? ((-aValue) << 1) + 1
            : (aValue << 1) + 0;
    }

    /**
     * Converts to a two-complement value from a value where the sign bit is
     * placed in the least significant bit.  For example, as decimals:
     *   2 (10 binary) becomes 1, 3 (11 binary) becomes -1
     *   4 (100 binary) becomes 2, 5 (101 binary) becomes -2
     */
    function fromVLQSigned(aValue) {
        var isNegative = (aValue & 1) === 1;
        var shifted = aValue >> 1;
        return isNegative
            ? -shifted
            : shifted;
    }

    /**
     * Returns the base 64 VLQ encoded value.
     */
    var encode$1 = function base64VLQ_encode(aValue) {
        var encoded = "";
        var digit;

        var vlq = toVLQSigned(aValue);

        do {
            digit = vlq & VLQ_BASE_MASK;
            vlq >>>= VLQ_BASE_SHIFT;
            if (vlq > 0) {
                // There are still more digits in this value, so we must make sure the
                // continuation bit is marked.
                digit |= VLQ_CONTINUATION_BIT;
            }
            encoded += base64.encode(digit);
        } while (vlq > 0);

        return encoded;
    };

    /**
     * Decodes the next base 64 VLQ value from the given string and returns the
     * value and the rest of the string via the out parameter.
     */
    var decode$1 = function base64VLQ_decode(aStr, aIndex, aOutParam) {
        var strLen = aStr.length;
        var result = 0;
        var shift = 0;
        var continuation, digit;

        do {
            if (aIndex >= strLen) {
                throw new Error("Expected more digits in base 64 VLQ value.");
            }

            digit = base64.decode(aStr.charCodeAt(aIndex++));
            if (digit === -1) {
                throw new Error("Invalid base64 digit: " + aStr.charAt(aIndex - 1));
            }

            continuation = !!(digit & VLQ_CONTINUATION_BIT);
            digit &= VLQ_BASE_MASK;
            result = result + (digit << shift);
            shift += VLQ_BASE_SHIFT;
        } while (continuation);

        aOutParam.value = fromVLQSigned(result);
        aOutParam.rest = aIndex;
    };

    var base64Vlq = {
        encode: encode$1,
        decode: decode$1
    };

    function createCommonjsModule(fn, module) {
        return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    function getCjsExportFromNamespace (n) {
        return n && n['default'] || n;
    }

    var util = createCommonjsModule(function (module, exports) {
        /* -*- Mode: js; js-indent-level: 2; -*- */
        /*
         * Copyright 2011 Mozilla Foundation and contributors
         * Licensed under the New BSD license. See LICENSE or:
         * http://opensource.org/licenses/BSD-3-Clause
         */

        /**
         * This is a helper function for getting values from parameter/options
         * objects.
         *
         * @param args The object we are extracting values from
         * @param name The name of the property we are getting.
         * @param defaultValue An optional value to return if the property is missing
         * from the object. If this is not specified and the property is missing, an
         * error will be thrown.
         */
        function getArg(aArgs, aName, aDefaultValue) {
            if (aName in aArgs) {
                return aArgs[aName];
            } else if (arguments.length === 3) {
                return aDefaultValue;
            } else {
                throw new Error('"' + aName + '" is a required argument.');
            }
        }
        exports.getArg = getArg;

        var urlRegexp = /^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.-]*)(?::(\d+))?(.*)$/;
        var dataUrlRegexp = /^data:.+\,.+$/;

        function urlParse(aUrl) {
            var match = aUrl.match(urlRegexp);
            if (!match) {
                return null;
            }
            return {
                scheme: match[1],
                auth: match[2],
                host: match[3],
                port: match[4],
                path: match[5]
            };
        }
        exports.urlParse = urlParse;

        function urlGenerate(aParsedUrl) {
            var url = '';
            if (aParsedUrl.scheme) {
                url += aParsedUrl.scheme + ':';
            }
            url += '//';
            if (aParsedUrl.auth) {
                url += aParsedUrl.auth + '@';
            }
            if (aParsedUrl.host) {
                url += aParsedUrl.host;
            }
            if (aParsedUrl.port) {
                url += ":" + aParsedUrl.port;
            }
            if (aParsedUrl.path) {
                url += aParsedUrl.path;
            }
            return url;
        }
        exports.urlGenerate = urlGenerate;

        /**
         * Normalizes a path, or the path portion of a URL:
         *
         * - Replaces consecutive slashes with one slash.
         * - Removes unnecessary '.' parts.
         * - Removes unnecessary '<dir>/..' parts.
         *
         * Based on code in the Node.js 'path' core module.
         *
         * @param aPath The path or url to normalize.
         */
        function normalize(aPath) {
            var path = aPath;
            var url = urlParse(aPath);
            if (url) {
                if (!url.path) {
                    return aPath;
                }
                path = url.path;
            }
            var isAbsolute = exports.isAbsolute(path);

            var parts = path.split(/\/+/);
            for (var part, up = 0, i = parts.length - 1; i >= 0; i--) {
                part = parts[i];
                if (part === '.') {
                    parts.splice(i, 1);
                } else if (part === '..') {
                    up++;
                } else if (up > 0) {
                    if (part === '') {
                        // The first part is blank if the path is absolute. Trying to go
                        // above the root is a no-op. Therefore we can remove all '..' parts
                        // directly after the root.
                        parts.splice(i + 1, up);
                        up = 0;
                    } else {
                        parts.splice(i, 2);
                        up--;
                    }
                }
            }
            path = parts.join('/');

            if (path === '') {
                path = isAbsolute ? '/' : '.';
            }

            if (url) {
                url.path = path;
                return urlGenerate(url);
            }
            return path;
        }
        exports.normalize = normalize;

        /**
         * Joins two paths/URLs.
         *
         * @param aRoot The root path or URL.
         * @param aPath The path or URL to be joined with the root.
         *
         * - If aPath is a URL or a data URI, aPath is returned, unless aPath is a
         *   scheme-relative URL: Then the scheme of aRoot, if any, is prepended
         *   first.
         * - Otherwise aPath is a path. If aRoot is a URL, then its path portion
         *   is updated with the result and aRoot is returned. Otherwise the result
         *   is returned.
         *   - If aPath is absolute, the result is aPath.
         *   - Otherwise the two paths are joined with a slash.
         * - Joining for example 'http://' and 'www.example.com' is also supported.
         */
        function join(aRoot, aPath) {
            if (aRoot === "") {
                aRoot = ".";
            }
            if (aPath === "") {
                aPath = ".";
            }
            var aPathUrl = urlParse(aPath);
            var aRootUrl = urlParse(aRoot);
            if (aRootUrl) {
                aRoot = aRootUrl.path || '/';
            }

            // `join(foo, '//www.example.org')`
            if (aPathUrl && !aPathUrl.scheme) {
                if (aRootUrl) {
                    aPathUrl.scheme = aRootUrl.scheme;
                }
                return urlGenerate(aPathUrl);
            }

            if (aPathUrl || aPath.match(dataUrlRegexp)) {
                return aPath;
            }

            // `join('http://', 'www.example.com')`
            if (aRootUrl && !aRootUrl.host && !aRootUrl.path) {
                aRootUrl.host = aPath;
                return urlGenerate(aRootUrl);
            }

            var joined = aPath.charAt(0) === '/'
                ? aPath
                : normalize(aRoot.replace(/\/+$/, '') + '/' + aPath);

            if (aRootUrl) {
                aRootUrl.path = joined;
                return urlGenerate(aRootUrl);
            }
            return joined;
        }
        exports.join = join;

        exports.isAbsolute = function (aPath) {
            return aPath.charAt(0) === '/' || urlRegexp.test(aPath);
        };

        /**
         * Make a path relative to a URL or another path.
         *
         * @param aRoot The root path or URL.
         * @param aPath The path or URL to be made relative to aRoot.
         */
        function relative(aRoot, aPath) {
            if (aRoot === "") {
                aRoot = ".";
            }

            aRoot = aRoot.replace(/\/$/, '');

            // It is possible for the path to be above the root. In this case, simply
            // checking whether the root is a prefix of the path won't work. Instead, we
            // need to remove components from the root one by one, until either we find
            // a prefix that fits, or we run out of components to remove.
            var level = 0;
            while (aPath.indexOf(aRoot + '/') !== 0) {
                var index = aRoot.lastIndexOf("/");
                if (index < 0) {
                    return aPath;
                }

                // If the only part of the root that is left is the scheme (i.e. http://,
                // file:///, etc.), one or more slashes (/), or simply nothing at all, we
                // have exhausted all components, so the path is not relative to the root.
                aRoot = aRoot.slice(0, index);
                if (aRoot.match(/^([^\/]+:\/)?\/*$/)) {
                    return aPath;
                }

                ++level;
            }

            // Make sure we add a "../" for each component we removed from the root.
            return Array(level + 1).join("../") + aPath.substr(aRoot.length + 1);
        }
        exports.relative = relative;

        var supportsNullProto = (function () {
            var obj = Object.create(null);
            return !('__proto__' in obj);
        }());

        function identity (s) {
            return s;
        }

        /**
         * Because behavior goes wacky when you set `__proto__` on objects, we
         * have to prefix all the strings in our set with an arbitrary character.
         *
         * See https://github.com/mozilla/source-map/pull/31 and
         * https://github.com/mozilla/source-map/issues/30
         *
         * @param String aStr
         */
        function toSetString(aStr) {
            if (isProtoString(aStr)) {
                return '$' + aStr;
            }

            return aStr;
        }
        exports.toSetString = supportsNullProto ? identity : toSetString;

        function fromSetString(aStr) {
            if (isProtoString(aStr)) {
                return aStr.slice(1);
            }

            return aStr;
        }
        exports.fromSetString = supportsNullProto ? identity : fromSetString;

        function isProtoString(s) {
            if (!s) {
                return false;
            }

            var length = s.length;

            if (length < 9 /* "__proto__".length */) {
                return false;
            }

            if (s.charCodeAt(length - 1) !== 95  /* '_' */ ||
                s.charCodeAt(length - 2) !== 95  /* '_' */ ||
                s.charCodeAt(length - 3) !== 111 /* 'o' */ ||
                s.charCodeAt(length - 4) !== 116 /* 't' */ ||
                s.charCodeAt(length - 5) !== 111 /* 'o' */ ||
                s.charCodeAt(length - 6) !== 114 /* 'r' */ ||
                s.charCodeAt(length - 7) !== 112 /* 'p' */ ||
                s.charCodeAt(length - 8) !== 95  /* '_' */ ||
                s.charCodeAt(length - 9) !== 95  /* '_' */) {
                return false;
            }

            for (var i = length - 10; i >= 0; i--) {
                if (s.charCodeAt(i) !== 36 /* '$' */) {
                    return false;
                }
            }

            return true;
        }

        /**
         * Comparator between two mappings where the original positions are compared.
         *
         * Optionally pass in `true` as `onlyCompareGenerated` to consider two
         * mappings with the same original source/line/column, but different generated
         * line and column the same. Useful when searching for a mapping with a
         * stubbed out mapping.
         */
        function compareByOriginalPositions(mappingA, mappingB, onlyCompareOriginal) {
            var cmp = strcmp(mappingA.source, mappingB.source);
            if (cmp !== 0) {
                return cmp;
            }

            cmp = mappingA.originalLine - mappingB.originalLine;
            if (cmp !== 0) {
                return cmp;
            }

            cmp = mappingA.originalColumn - mappingB.originalColumn;
            if (cmp !== 0 || onlyCompareOriginal) {
                return cmp;
            }

            cmp = mappingA.generatedColumn - mappingB.generatedColumn;
            if (cmp !== 0) {
                return cmp;
            }

            cmp = mappingA.generatedLine - mappingB.generatedLine;
            if (cmp !== 0) {
                return cmp;
            }

            return strcmp(mappingA.name, mappingB.name);
        }
        exports.compareByOriginalPositions = compareByOriginalPositions;

        /**
         * Comparator between two mappings with deflated source and name indices where
         * the generated positions are compared.
         *
         * Optionally pass in `true` as `onlyCompareGenerated` to consider two
         * mappings with the same generated line and column, but different
         * source/name/original line and column the same. Useful when searching for a
         * mapping with a stubbed out mapping.
         */
        function compareByGeneratedPositionsDeflated(mappingA, mappingB, onlyCompareGenerated) {
            var cmp = mappingA.generatedLine - mappingB.generatedLine;
            if (cmp !== 0) {
                return cmp;
            }

            cmp = mappingA.generatedColumn - mappingB.generatedColumn;
            if (cmp !== 0 || onlyCompareGenerated) {
                return cmp;
            }

            cmp = strcmp(mappingA.source, mappingB.source);
            if (cmp !== 0) {
                return cmp;
            }

            cmp = mappingA.originalLine - mappingB.originalLine;
            if (cmp !== 0) {
                return cmp;
            }

            cmp = mappingA.originalColumn - mappingB.originalColumn;
            if (cmp !== 0) {
                return cmp;
            }

            return strcmp(mappingA.name, mappingB.name);
        }
        exports.compareByGeneratedPositionsDeflated = compareByGeneratedPositionsDeflated;

        function strcmp(aStr1, aStr2) {
            if (aStr1 === aStr2) {
                return 0;
            }

            if (aStr1 === null) {
                return 1; // aStr2 !== null
            }

            if (aStr2 === null) {
                return -1; // aStr1 !== null
            }

            if (aStr1 > aStr2) {
                return 1;
            }

            return -1;
        }

        /**
         * Comparator between two mappings with inflated source and name strings where
         * the generated positions are compared.
         */
        function compareByGeneratedPositionsInflated(mappingA, mappingB) {
            var cmp = mappingA.generatedLine - mappingB.generatedLine;
            if (cmp !== 0) {
                return cmp;
            }

            cmp = mappingA.generatedColumn - mappingB.generatedColumn;
            if (cmp !== 0) {
                return cmp;
            }

            cmp = strcmp(mappingA.source, mappingB.source);
            if (cmp !== 0) {
                return cmp;
            }

            cmp = mappingA.originalLine - mappingB.originalLine;
            if (cmp !== 0) {
                return cmp;
            }

            cmp = mappingA.originalColumn - mappingB.originalColumn;
            if (cmp !== 0) {
                return cmp;
            }

            return strcmp(mappingA.name, mappingB.name);
        }
        exports.compareByGeneratedPositionsInflated = compareByGeneratedPositionsInflated;

        /**
         * Strip any JSON XSSI avoidance prefix from the string (as documented
         * in the source maps specification), and then parse the string as
         * JSON.
         */
        function parseSourceMapInput(str) {
            return JSON.parse(str.replace(/^\)]}'[^\n]*\n/, ''));
        }
        exports.parseSourceMapInput = parseSourceMapInput;

        /**
         * Compute the URL of a source given the the source root, the source's
         * URL, and the source map's URL.
         */
        function computeSourceURL(sourceRoot, sourceURL, sourceMapURL) {
            sourceURL = sourceURL || '';

            if (sourceRoot) {
                // This follows what Chrome does.
                if (sourceRoot[sourceRoot.length - 1] !== '/' && sourceURL[0] !== '/') {
                    sourceRoot += '/';
                }
                // The spec says:
                //   Line 4: An optional source root, useful for relocating source
                //   files on a server or removing repeated values in the
                //   “sources” entry.  This value is prepended to the individual
                //   entries in the “source” field.
                sourceURL = sourceRoot + sourceURL;
            }

            // Historically, SourceMapConsumer did not take the sourceMapURL as
            // a parameter.  This mode is still somewhat supported, which is why
            // this code block is conditional.  However, it's preferable to pass
            // the source map URL to SourceMapConsumer, so that this function
            // can implement the source URL resolution algorithm as outlined in
            // the spec.  This block is basically the equivalent of:
            //    new URL(sourceURL, sourceMapURL).toString()
            // ... except it avoids using URL, which wasn't available in the
            // older releases of node still supported by this library.
            //
            // The spec says:
            //   If the sources are not absolute URLs after prepending of the
            //   “sourceRoot”, the sources are resolved relative to the
            //   SourceMap (like resolving script src in a html document).
            if (sourceMapURL) {
                var parsed = urlParse(sourceMapURL);
                if (!parsed) {
                    throw new Error("sourceMapURL could not be parsed");
                }
                if (parsed.path) {
                    // Strip the last path component, but keep the "/".
                    var index = parsed.path.lastIndexOf('/');
                    if (index >= 0) {
                        parsed.path = parsed.path.substring(0, index + 1);
                    }
                }
                sourceURL = join(urlGenerate(parsed), sourceURL);
            }

            return normalize(sourceURL);
        }
        exports.computeSourceURL = computeSourceURL;
    });
    var util_1 = util.getArg;
    var util_2 = util.urlParse;
    var util_3 = util.urlGenerate;
    var util_4 = util.normalize;
    var util_5 = util.join;
    var util_6 = util.isAbsolute;
    var util_7 = util.relative;
    var util_8 = util.toSetString;
    var util_9 = util.fromSetString;
    var util_10 = util.compareByOriginalPositions;
    var util_11 = util.compareByGeneratedPositionsDeflated;
    var util_12 = util.compareByGeneratedPositionsInflated;
    var util_13 = util.parseSourceMapInput;
    var util_14 = util.computeSourceURL;

    /* -*- Mode: js; js-indent-level: 2; -*- */
    /*
     * Copyright 2011 Mozilla Foundation and contributors
     * Licensed under the New BSD license. See LICENSE or:
     * http://opensource.org/licenses/BSD-3-Clause
     */


    var has = Object.prototype.hasOwnProperty;
    var hasNativeMap = typeof Map !== "undefined";

    /**
     * A data structure which is a combination of an array and a set. Adding a new
     * member is O(1), testing for membership is O(1), and finding the index of an
     * element is O(1). Removing elements from the set is not supported. Only
     * strings are supported for membership.
     */
    function ArraySet() {
        this._array = [];
        this._set = hasNativeMap ? new Map() : Object.create(null);
    }

    /**
     * Static method for creating ArraySet instances from an existing array.
     */
    ArraySet.fromArray = function ArraySet_fromArray(aArray, aAllowDuplicates) {
        var set = new ArraySet();
        for (var i = 0, len = aArray.length; i < len; i++) {
            set.add(aArray[i], aAllowDuplicates);
        }
        return set;
    };

    /**
     * Return how many unique items are in this ArraySet. If duplicates have been
     * added, than those do not count towards the size.
     *
     * @returns Number
     */
    ArraySet.prototype.size = function ArraySet_size() {
        return hasNativeMap ? this._set.size : Object.getOwnPropertyNames(this._set).length;
    };

    /**
     * Add the given string to this set.
     *
     * @param String aStr
     */
    ArraySet.prototype.add = function ArraySet_add(aStr, aAllowDuplicates) {
        var sStr = hasNativeMap ? aStr : util.toSetString(aStr);
        var isDuplicate = hasNativeMap ? this.has(aStr) : has.call(this._set, sStr);
        var idx = this._array.length;
        if (!isDuplicate || aAllowDuplicates) {
            this._array.push(aStr);
        }
        if (!isDuplicate) {
            if (hasNativeMap) {
                this._set.set(aStr, idx);
            } else {
                this._set[sStr] = idx;
            }
        }
    };

    /**
     * Is the given string a member of this set?
     *
     * @param String aStr
     */
    ArraySet.prototype.has = function ArraySet_has(aStr) {
        if (hasNativeMap) {
            return this._set.has(aStr);
        } else {
            var sStr = util.toSetString(aStr);
            return has.call(this._set, sStr);
        }
    };

    /**
     * What is the index of the given string in the array?
     *
     * @param String aStr
     */
    ArraySet.prototype.indexOf = function ArraySet_indexOf(aStr) {
        if (hasNativeMap) {
            var idx = this._set.get(aStr);
            if (idx >= 0) {
                return idx;
            }
        } else {
            var sStr = util.toSetString(aStr);
            if (has.call(this._set, sStr)) {
                return this._set[sStr];
            }
        }

        throw new Error('"' + aStr + '" is not in the set.');
    };

    /**
     * What is the element at the given index?
     *
     * @param Number aIdx
     */
    ArraySet.prototype.at = function ArraySet_at(aIdx) {
        if (aIdx >= 0 && aIdx < this._array.length) {
            return this._array[aIdx];
        }
        throw new Error('No element indexed by ' + aIdx);
    };

    /**
     * Returns the array representation of this set (which has the proper indices
     * indicated by indexOf). Note that this is a copy of the internal array used
     * for storing the members so that no one can mess with internal state.
     */
    ArraySet.prototype.toArray = function ArraySet_toArray() {
        return this._array.slice();
    };

    var ArraySet_1 = ArraySet;

    var arraySet = {
        ArraySet: ArraySet_1
    };

    /* -*- Mode: js; js-indent-level: 2; -*- */
    /*
     * Copyright 2014 Mozilla Foundation and contributors
     * Licensed under the New BSD license. See LICENSE or:
     * http://opensource.org/licenses/BSD-3-Clause
     */



    /**
     * Determine whether mappingB is after mappingA with respect to generated
     * position.
     */
    function generatedPositionAfter(mappingA, mappingB) {
        // Optimized for most common case
        var lineA = mappingA.generatedLine;
        var lineB = mappingB.generatedLine;
        var columnA = mappingA.generatedColumn;
        var columnB = mappingB.generatedColumn;
        return lineB > lineA || lineB == lineA && columnB >= columnA ||
            util.compareByGeneratedPositionsInflated(mappingA, mappingB) <= 0;
    }

    /**
     * A data structure to provide a sorted view of accumulated mappings in a
     * performance conscious manner. It trades a neglibable overhead in general
     * case for a large speedup in case of mappings being added in order.
     */
    function MappingList() {
        this._array = [];
        this._sorted = true;
        // Serves as infimum
        this._last = {generatedLine: -1, generatedColumn: 0};
    }

    /**
     * Iterate through internal items. This method takes the same arguments that
     * `Array.prototype.forEach` takes.
     *
     * NOTE: The order of the mappings is NOT guaranteed.
     */
    MappingList.prototype.unsortedForEach =
        function MappingList_forEach(aCallback, aThisArg) {
            this._array.forEach(aCallback, aThisArg);
        };

    /**
     * Add the given source mapping.
     *
     * @param Object aMapping
     */
    MappingList.prototype.add = function MappingList_add(aMapping) {
        if (generatedPositionAfter(this._last, aMapping)) {
            this._last = aMapping;
            this._array.push(aMapping);
        } else {
            this._sorted = false;
            this._array.push(aMapping);
        }
    };

    /**
     * Returns the flat, sorted array of mappings. The mappings are sorted by
     * generated position.
     *
     * WARNING: This method returns internal data without copying, for
     * performance. The return value must NOT be mutated, and should be treated as
     * an immutable borrow. If you want to take ownership, you must make your own
     * copy.
     */
    MappingList.prototype.toArray = function MappingList_toArray() {
        if (!this._sorted) {
            this._array.sort(util.compareByGeneratedPositionsInflated);
            this._sorted = true;
        }
        return this._array;
    };

    var MappingList_1 = MappingList;

    var mappingList = {
        MappingList: MappingList_1
    };

    /* -*- Mode: js; js-indent-level: 2; -*- */
    /*
     * Copyright 2011 Mozilla Foundation and contributors
     * Licensed under the New BSD license. See LICENSE or:
     * http://opensource.org/licenses/BSD-3-Clause
     */



    var ArraySet$1 = arraySet.ArraySet;
    var MappingList$1 = mappingList.MappingList;

    /**
     * An instance of the SourceMapGenerator represents a source map which is
     * being built incrementally. You may pass an object with the following
     * properties:
     *
     *   - file: The filename of the generated source.
     *   - sourceRoot: A root for all relative URLs in this source map.
     */
    function SourceMapGenerator(aArgs) {
        if (!aArgs) {
            aArgs = {};
        }
        this._file = util.getArg(aArgs, 'file', null);
        this._sourceRoot = util.getArg(aArgs, 'sourceRoot', null);
        this._skipValidation = util.getArg(aArgs, 'skipValidation', false);
        this._sources = new ArraySet$1();
        this._names = new ArraySet$1();
        this._mappings = new MappingList$1();
        this._sourcesContents = null;
    }

    SourceMapGenerator.prototype._version = 3;

    /**
     * Creates a new SourceMapGenerator based on a SourceMapConsumer
     *
     * @param aSourceMapConsumer The SourceMap.
     */
    SourceMapGenerator.fromSourceMap =
        function SourceMapGenerator_fromSourceMap(aSourceMapConsumer) {
            var sourceRoot = aSourceMapConsumer.sourceRoot;
            var generator = new SourceMapGenerator({
                file: aSourceMapConsumer.file,
                sourceRoot: sourceRoot
            });
            aSourceMapConsumer.eachMapping(function (mapping) {
                var newMapping = {
                    generated: {
                        line: mapping.generatedLine,
                        column: mapping.generatedColumn
                    }
                };

                if (mapping.source != null) {
                    newMapping.source = mapping.source;
                    if (sourceRoot != null) {
                        newMapping.source = util.relative(sourceRoot, newMapping.source);
                    }

                    newMapping.original = {
                        line: mapping.originalLine,
                        column: mapping.originalColumn
                    };

                    if (mapping.name != null) {
                        newMapping.name = mapping.name;
                    }
                }

                generator.addMapping(newMapping);
            });
            aSourceMapConsumer.sources.forEach(function (sourceFile) {
                var sourceRelative = sourceFile;
                if (sourceRoot !== null) {
                    sourceRelative = util.relative(sourceRoot, sourceFile);
                }

                if (!generator._sources.has(sourceRelative)) {
                    generator._sources.add(sourceRelative);
                }

                var content = aSourceMapConsumer.sourceContentFor(sourceFile);
                if (content != null) {
                    generator.setSourceContent(sourceFile, content);
                }
            });
            return generator;
        };

    /**
     * Add a single mapping from original source line and column to the generated
     * source's line and column for this source map being created. The mapping
     * object should have the following properties:
     *
     *   - generated: An object with the generated line and column positions.
     *   - original: An object with the original line and column positions.
     *   - source: The original source file (relative to the sourceRoot).
     *   - name: An optional original token name for this mapping.
     */
    SourceMapGenerator.prototype.addMapping =
        function SourceMapGenerator_addMapping(aArgs) {
            var generated = util.getArg(aArgs, 'generated');
            var original = util.getArg(aArgs, 'original', null);
            var source = util.getArg(aArgs, 'source', null);
            var name = util.getArg(aArgs, 'name', null);

            if (!this._skipValidation) {
                this._validateMapping(generated, original, source, name);
            }

            if (source != null) {
                source = String(source);
                if (!this._sources.has(source)) {
                    this._sources.add(source);
                }
            }

            if (name != null) {
                name = String(name);
                if (!this._names.has(name)) {
                    this._names.add(name);
                }
            }

            this._mappings.add({
                generatedLine: generated.line,
                generatedColumn: generated.column,
                originalLine: original != null && original.line,
                originalColumn: original != null && original.column,
                source: source,
                name: name
            });
        };

    /**
     * Set the source content for a source file.
     */
    SourceMapGenerator.prototype.setSourceContent =
        function SourceMapGenerator_setSourceContent(aSourceFile, aSourceContent) {
            var source = aSourceFile;
            if (this._sourceRoot != null) {
                source = util.relative(this._sourceRoot, source);
            }

            if (aSourceContent != null) {
                // Add the source content to the _sourcesContents map.
                // Create a new _sourcesContents map if the property is null.
                if (!this._sourcesContents) {
                    this._sourcesContents = Object.create(null);
                }
                this._sourcesContents[util.toSetString(source)] = aSourceContent;
            } else if (this._sourcesContents) {
                // Remove the source file from the _sourcesContents map.
                // If the _sourcesContents map is empty, set the property to null.
                delete this._sourcesContents[util.toSetString(source)];
                if (Object.keys(this._sourcesContents).length === 0) {
                    this._sourcesContents = null;
                }
            }
        };

    /**
     * Applies the mappings of a sub-source-map for a specific source file to the
     * source map being generated. Each mapping to the supplied source file is
     * rewritten using the supplied source map. Note: The resolution for the
     * resulting mappings is the minimium of this map and the supplied map.
     *
     * @param aSourceMapConsumer The source map to be applied.
     * @param aSourceFile Optional. The filename of the source file.
     *        If omitted, SourceMapConsumer's file property will be used.
     * @param aSourceMapPath Optional. The dirname of the path to the source map
     *        to be applied. If relative, it is relative to the SourceMapConsumer.
     *        This parameter is needed when the two source maps aren't in the same
     *        directory, and the source map to be applied contains relative source
     *        paths. If so, those relative source paths need to be rewritten
     *        relative to the SourceMapGenerator.
     */
    SourceMapGenerator.prototype.applySourceMap =
        function SourceMapGenerator_applySourceMap(aSourceMapConsumer, aSourceFile, aSourceMapPath) {
            var sourceFile = aSourceFile;
            // If aSourceFile is omitted, we will use the file property of the SourceMap
            if (aSourceFile == null) {
                if (aSourceMapConsumer.file == null) {
                    throw new Error(
                        'SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, ' +
                        'or the source map\'s "file" property. Both were omitted.'
                    );
                }
                sourceFile = aSourceMapConsumer.file;
            }
            var sourceRoot = this._sourceRoot;
            // Make "sourceFile" relative if an absolute Url is passed.
            if (sourceRoot != null) {
                sourceFile = util.relative(sourceRoot, sourceFile);
            }
            // Applying the SourceMap can add and remove items from the sources and
            // the names array.
            var newSources = new ArraySet$1();
            var newNames = new ArraySet$1();

            // Find mappings for the "sourceFile"
            this._mappings.unsortedForEach(function (mapping) {
                if (mapping.source === sourceFile && mapping.originalLine != null) {
                    // Check if it can be mapped by the source map, then update the mapping.
                    var original = aSourceMapConsumer.originalPositionFor({
                        line: mapping.originalLine,
                        column: mapping.originalColumn
                    });
                    if (original.source != null) {
                        // Copy mapping
                        mapping.source = original.source;
                        if (aSourceMapPath != null) {
                            mapping.source = util.join(aSourceMapPath, mapping.source);
                        }
                        if (sourceRoot != null) {
                            mapping.source = util.relative(sourceRoot, mapping.source);
                        }
                        mapping.originalLine = original.line;
                        mapping.originalColumn = original.column;
                        if (original.name != null) {
                            mapping.name = original.name;
                        }
                    }
                }

                var source = mapping.source;
                if (source != null && !newSources.has(source)) {
                    newSources.add(source);
                }

                var name = mapping.name;
                if (name != null && !newNames.has(name)) {
                    newNames.add(name);
                }

            }, this);
            this._sources = newSources;
            this._names = newNames;

            // Copy sourcesContents of applied map.
            aSourceMapConsumer.sources.forEach(function (sourceFile) {
                var content = aSourceMapConsumer.sourceContentFor(sourceFile);
                if (content != null) {
                    if (aSourceMapPath != null) {
                        sourceFile = util.join(aSourceMapPath, sourceFile);
                    }
                    if (sourceRoot != null) {
                        sourceFile = util.relative(sourceRoot, sourceFile);
                    }
                    this.setSourceContent(sourceFile, content);
                }
            }, this);
        };

    /**
     * A mapping can have one of the three levels of data:
     *
     *   1. Just the generated position.
     *   2. The Generated position, original position, and original source.
     *   3. Generated and original position, original source, as well as a name
     *      token.
     *
     * To maintain consistency, we validate that any new mapping being added falls
     * in to one of these categories.
     */
    SourceMapGenerator.prototype._validateMapping =
        function SourceMapGenerator_validateMapping(aGenerated, aOriginal, aSource,
                                                    aName) {
            // When aOriginal is truthy but has empty values for .line and .column,
            // it is most likely a programmer error. In this case we throw a very
            // specific error message to try to guide them the right way.
            // For example: https://github.com/Polymer/polymer-bundler/pull/519
            if (aOriginal && typeof aOriginal.line !== 'number' && typeof aOriginal.column !== 'number') {
                throw new Error(
                    'original.line and original.column are not numbers -- you probably meant to omit ' +
                    'the original mapping entirely and only map the generated position. If so, pass ' +
                    'null for the original mapping instead of an object with empty or null values.'
                );
            }

            if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
                && aGenerated.line > 0 && aGenerated.column >= 0
                && !aOriginal && !aSource && !aName) {
                // Case 1.
                return;
            }
            else if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
                && aOriginal && 'line' in aOriginal && 'column' in aOriginal
                && aGenerated.line > 0 && aGenerated.column >= 0
                && aOriginal.line > 0 && aOriginal.column >= 0
                && aSource) {
                // Cases 2 and 3.
                return;
            }
            else {
                throw new Error('Invalid mapping: ' + JSON.stringify({
                    generated: aGenerated,
                    source: aSource,
                    original: aOriginal,
                    name: aName
                }));
            }
        };

    /**
     * Serialize the accumulated mappings in to the stream of base 64 VLQs
     * specified by the source map format.
     */
    SourceMapGenerator.prototype._serializeMappings =
        function SourceMapGenerator_serializeMappings() {
            var previousGeneratedColumn = 0;
            var previousGeneratedLine = 1;
            var previousOriginalColumn = 0;
            var previousOriginalLine = 0;
            var previousName = 0;
            var previousSource = 0;
            var result = '';
            var next;
            var mapping;
            var nameIdx;
            var sourceIdx;

            var mappings = this._mappings.toArray();
            for (var i = 0, len = mappings.length; i < len; i++) {
                mapping = mappings[i];
                next = '';

                if (mapping.generatedLine !== previousGeneratedLine) {
                    previousGeneratedColumn = 0;
                    while (mapping.generatedLine !== previousGeneratedLine) {
                        next += ';';
                        previousGeneratedLine++;
                    }
                }
                else {
                    if (i > 0) {
                        if (!util.compareByGeneratedPositionsInflated(mapping, mappings[i - 1])) {
                            continue;
                        }
                        next += ',';
                    }
                }

                next += base64Vlq.encode(mapping.generatedColumn
                    - previousGeneratedColumn);
                previousGeneratedColumn = mapping.generatedColumn;

                if (mapping.source != null) {
                    sourceIdx = this._sources.indexOf(mapping.source);
                    next += base64Vlq.encode(sourceIdx - previousSource);
                    previousSource = sourceIdx;

                    // lines are stored 0-based in SourceMap spec version 3
                    next += base64Vlq.encode(mapping.originalLine - 1
                        - previousOriginalLine);
                    previousOriginalLine = mapping.originalLine - 1;

                    next += base64Vlq.encode(mapping.originalColumn
                        - previousOriginalColumn);
                    previousOriginalColumn = mapping.originalColumn;

                    if (mapping.name != null) {
                        nameIdx = this._names.indexOf(mapping.name);
                        next += base64Vlq.encode(nameIdx - previousName);
                        previousName = nameIdx;
                    }
                }

                result += next;
            }

            return result;
        };

    SourceMapGenerator.prototype._generateSourcesContent =
        function SourceMapGenerator_generateSourcesContent(aSources, aSourceRoot) {
            return aSources.map(function (source) {
                if (!this._sourcesContents) {
                    return null;
                }
                if (aSourceRoot != null) {
                    source = util.relative(aSourceRoot, source);
                }
                var key = util.toSetString(source);
                return Object.prototype.hasOwnProperty.call(this._sourcesContents, key)
                    ? this._sourcesContents[key]
                    : null;
            }, this);
        };

    /**
     * Externalize the source map.
     */
    SourceMapGenerator.prototype.toJSON =
        function SourceMapGenerator_toJSON() {
            var map = {
                version: this._version,
                sources: this._sources.toArray(),
                names: this._names.toArray(),
                mappings: this._serializeMappings()
            };
            if (this._file != null) {
                map.file = this._file;
            }
            if (this._sourceRoot != null) {
                map.sourceRoot = this._sourceRoot;
            }
            if (this._sourcesContents) {
                map.sourcesContent = this._generateSourcesContent(map.sources, map.sourceRoot);
            }

            return map;
        };

    /**
     * Render the source map being generated to a string.
     */
    SourceMapGenerator.prototype.toString =
        function SourceMapGenerator_toString() {
            return JSON.stringify(this.toJSON());
        };

    var SourceMapGenerator_1 = SourceMapGenerator;

    var sourceMapGenerator = {
        SourceMapGenerator: SourceMapGenerator_1
    };

    var SourceMapGenerator$1 = sourceMapGenerator.SourceMapGenerator;
    var trackNodes = {
        Atrule: true,
        Selector: true,
        Declaration: true
    };

    var sourceMap = function generateSourceMap(handlers) {
        var map = new SourceMapGenerator$1();
        var line = 1;
        var column = 0;
        var generated = {
            line: 1,
            column: 0
        };
        var original = {
            line: 0, // should be zero to add first mapping
            column: 0
        };
        var sourceMappingActive = false;
        var activatedGenerated = {
            line: 1,
            column: 0
        };
        var activatedMapping = {
            generated: activatedGenerated
        };

        var handlersNode = handlers.node;
        handlers.node = function(node) {
            if (node.loc && node.loc.start && trackNodes.hasOwnProperty(node.type)) {
                var nodeLine = node.loc.start.line;
                var nodeColumn = node.loc.start.column - 1;

                if (original.line !== nodeLine ||
                    original.column !== nodeColumn) {
                    original.line = nodeLine;
                    original.column = nodeColumn;

                    generated.line = line;
                    generated.column = column;

                    if (sourceMappingActive) {
                        sourceMappingActive = false;
                        if (generated.line !== activatedGenerated.line ||
                            generated.column !== activatedGenerated.column) {
                            map.addMapping(activatedMapping);
                        }
                    }

                    sourceMappingActive = true;
                    map.addMapping({
                        source: node.loc.source,
                        original: original,
                        generated: generated
                    });
                }
            }

            handlersNode.call(this, node);

            if (sourceMappingActive && trackNodes.hasOwnProperty(node.type)) {
                activatedGenerated.line = line;
                activatedGenerated.column = column;
            }
        };

        var handlersChunk = handlers.chunk;
        handlers.chunk = function(chunk) {
            for (var i = 0; i < chunk.length; i++) {
                if (chunk.charCodeAt(i) === 10) { // \n
                    line++;
                    column = 0;
                } else {
                    column++;
                }
            }

            handlersChunk(chunk);
        };

        var handlersResult = handlers.result;
        handlers.result = function() {
            if (sourceMappingActive) {
                map.addMapping(activatedMapping);
            }

            return {
                css: handlersResult(),
                map: map
            };
        };

        return handlers;
    };

    var hasOwnProperty$3 = Object.prototype.hasOwnProperty;

    function processChildren(node, delimeter) {
        var list = node.children;
        var prev = null;

        if (typeof delimeter !== 'function') {
            list.forEach(this.node, this);
        } else {
            list.forEach(function(node) {
                if (prev !== null) {
                    delimeter.call(this, prev);
                }

                this.node(node);
                prev = node;
            }, this);
        }
    }

    var create$1 = function createGenerator(config) {
        function processNode(node) {
            if (hasOwnProperty$3.call(types, node.type)) {
                types[node.type].call(this, node);
            } else {
                throw new Error('Unknown node type: ' + node.type);
            }
        }

        var types = {};

        if (config.node) {
            for (var name in config.node) {
                types[name] = config.node[name].generate;
            }
        }

        return function(node, options) {
            var buffer = '';
            var handlers = {
                children: processChildren,
                node: processNode,
                chunk: function(chunk) {
                    buffer += chunk;
                },
                result: function() {
                    return buffer;
                }
            };

            if (options) {
                if (typeof options.decorator === 'function') {
                    handlers = options.decorator(handlers);
                }

                if (options.sourceMap) {
                    handlers = sourceMap(handlers);
                }
            }

            handlers.node(node);

            return handlers.result();
        };
    };

    var create$2 = function createConvertors(walk) {
        return {
            fromPlainObject: function(ast) {
                walk(ast, {
                    enter: function(node) {
                        if (node.children && node.children instanceof List_1 === false) {
                            node.children = new List_1().fromArray(node.children);
                        }
                    }
                });

                return ast;
            },
            toPlainObject: function(ast) {
                walk(ast, {
                    leave: function(node) {
                        if (node.children && node.children instanceof List_1) {
                            node.children = node.children.toArray();
                        }
                    }
                });

                return ast;
            }
        };
    };

    var hasOwnProperty$4 = Object.prototype.hasOwnProperty;
    var noop$3 = function() {};

    function ensureFunction$1(value) {
        return typeof value === 'function' ? value : noop$3;
    }

    function invokeForType(fn, type) {
        return function(node, item, list) {
            if (node.type === type) {
                fn.call(this, node, item, list);
            }
        };
    }

    function getWalkersFromStructure(name, nodeType) {
        var structure = nodeType.structure;
        var walkers = [];

        for (var key in structure) {
            if (hasOwnProperty$4.call(structure, key) === false) {
                continue;
            }

            var fieldTypes = structure[key];
            var walker = {
                name: key,
                type: false,
                nullable: false
            };

            if (!Array.isArray(structure[key])) {
                fieldTypes = [structure[key]];
            }

            for (var i = 0; i < fieldTypes.length; i++) {
                var fieldType = fieldTypes[i];
                if (fieldType === null) {
                    walker.nullable = true;
                } else if (typeof fieldType === 'string') {
                    walker.type = 'node';
                } else if (Array.isArray(fieldType)) {
                    walker.type = 'list';
                }
            }

            if (walker.type) {
                walkers.push(walker);
            }
        }

        if (walkers.length) {
            return {
                context: nodeType.walkContext,
                fields: walkers
            };
        }

        return null;
    }

    function getTypesFromConfig(config) {
        var types = {};

        for (var name in config.node) {
            if (hasOwnProperty$4.call(config.node, name)) {
                var nodeType = config.node[name];

                if (!nodeType.structure) {
                    throw new Error('Missed `structure` field in `' + name + '` node type definition');
                }

                types[name] = getWalkersFromStructure(name, nodeType);
            }
        }

        return types;
    }

    function createTypeIterator(config, reverse) {
        var fields = config.fields.slice();
        var contextName = config.context;
        var useContext = typeof contextName === 'string';

        if (reverse) {
            fields.reverse();
        }

        return function(node, context, walk) {
            var prevContextValue;

            if (useContext) {
                prevContextValue = context[contextName];
                context[contextName] = node;
            }

            for (var i = 0; i < fields.length; i++) {
                var field = fields[i];
                var ref = node[field.name];

                if (!field.nullable || ref) {
                    if (field.type === 'list') {
                        if (reverse) {
                            ref.forEachRight(walk);
                        } else {
                            ref.forEach(walk);
                        }
                    } else {
                        walk(ref);
                    }
                }
            }

            if (useContext) {
                context[contextName] = prevContextValue;
            }
        };
    }

    function createFastTraveralMap(iterators) {
        return {
            Atrule: {
                StyleSheet: iterators.StyleSheet,
                Atrule: iterators.Atrule,
                Rule: iterators.Rule,
                Block: iterators.Block
            },
            Rule: {
                StyleSheet: iterators.StyleSheet,
                Atrule: iterators.Atrule,
                Rule: iterators.Rule,
                Block: iterators.Block
            },
            Declaration: {
                StyleSheet: iterators.StyleSheet,
                Atrule: iterators.Atrule,
                Rule: iterators.Rule,
                Block: iterators.Block,
                DeclarationList: iterators.DeclarationList
            }
        };
    }

    var create$3 = function createWalker(config) {
        var types = getTypesFromConfig(config);
        var iteratorsNatural = {};
        var iteratorsReverse = {};

        for (var name in types) {
            if (hasOwnProperty$4.call(types, name) && types[name] !== null) {
                iteratorsNatural[name] = createTypeIterator(types[name], false);
                iteratorsReverse[name] = createTypeIterator(types[name], true);
            }
        }

        var fastTraversalIteratorsNatural = createFastTraveralMap(iteratorsNatural);
        var fastTraversalIteratorsReverse = createFastTraveralMap(iteratorsReverse);

        var walk = function(root, options) {
            function walkNode(node, item, list) {
                enter.call(context, node, item, list);

                if (iterators.hasOwnProperty(node.type)) {
                    iterators[node.type](node, context, walkNode);
                }

                leave.call(context, node, item, list);
            }

            var enter = noop$3;
            var leave = noop$3;
            var iterators = iteratorsNatural;
            var context = {
                root: root,
                stylesheet: null,
                atrule: null,
                atrulePrelude: null,
                rule: null,
                selector: null,
                block: null,
                declaration: null,
                function: null
            };

            if (typeof options === 'function') {
                enter = options;
            } else if (options) {
                enter = ensureFunction$1(options.enter);
                leave = ensureFunction$1(options.leave);

                if (options.reverse) {
                    iterators = iteratorsReverse;
                }

                if (options.visit) {
                    if (fastTraversalIteratorsNatural.hasOwnProperty(options.visit)) {
                        iterators = options.reverse
                            ? fastTraversalIteratorsReverse[options.visit]
                            : fastTraversalIteratorsNatural[options.visit];
                    } else if (!types.hasOwnProperty(options.visit)) {
                        throw new Error('Bad value `' + options.visit + '` for `visit` option (should be: ' + Object.keys(types).join(', ') + ')');
                    }

                    enter = invokeForType(enter, options.visit);
                    leave = invokeForType(leave, options.visit);
                }
            }

            if (enter === noop$3 && leave === noop$3) {
                throw new Error('Neither `enter` nor `leave` walker handler is set or both aren\'t a function');
            }

            // swap handlers in reverse mode to invert visit order
            if (options.reverse) {
                var tmp = enter;
                enter = leave;
                leave = tmp;
            }

            walkNode(root);
        };

        walk.find = function(ast, fn) {
            var found = null;

            walk(ast, function(node, item, list) {
                if (found === null && fn.call(this, node, item, list)) {
                    found = node;
                }
            });

            return found;
        };

        walk.findLast = function(ast, fn) {
            var found = null;

            walk(ast, {
                reverse: true,
                enter: function(node, item, list) {
                    if (found === null && fn.call(this, node, item, list)) {
                        found = node;
                    }
                }
            });

            return found;
        };

        walk.findAll = function(ast, fn) {
            var found = [];

            walk(ast, function(node, item, list) {
                if (fn.call(this, node, item, list)) {
                    found.push(node);
                }
            });

            return found;
        };

        return walk;
    };

    var clone = function clone(node) {
        var result = {};

        for (var key in node) {
            var value = node[key];

            if (value) {
                if (Array.isArray(value) || value instanceof List_1) {
                    value = value.map(clone);
                } else if (value.constructor === Object) {
                    value = clone(value);
                }
            }

            result[key] = value;
        }

        return result;
    };

    var hasOwnProperty$5 = Object.prototype.hasOwnProperty;
    var shape = {
        generic: true,
        types: {},
        atrules: {},
        properties: {},
        parseContext: {},
        scope: {},
        atrule: ['parse'],
        pseudo: ['parse'],
        node: ['name', 'structure', 'parse', 'generate', 'walkContext']
    };

    function isObject(value) {
        return value && value.constructor === Object;
    }

    function copy(value) {
        if (isObject(value)) {
            return Object.assign({}, value);
        } else {
            return value;
        }
    }
    function extend(dest, src) {
        for (var key in src) {
            if (hasOwnProperty$5.call(src, key)) {
                if (isObject(dest[key])) {
                    extend(dest[key], copy(src[key]));
                } else {
                    dest[key] = copy(src[key]);
                }
            }
        }
    }

    function mix(dest, src, shape) {
        for (var key in shape) {
            if (hasOwnProperty$5.call(shape, key) === false) {
                continue;
            }

            if (shape[key] === true) {
                if (key in src) {
                    if (hasOwnProperty$5.call(src, key)) {
                        dest[key] = copy(src[key]);
                    }
                }
            } else if (shape[key]) {
                if (isObject(shape[key])) {
                    var res = {};
                    extend(res, dest[key]);
                    extend(res, src[key]);
                    dest[key] = res;
                } else if (Array.isArray(shape[key])) {
                    var res = {};
                    var innerShape = shape[key].reduce(function(s, k) {
                        s[k] = true;
                        return s;
                    }, {});
                    for (var name in dest[key]) {
                        if (hasOwnProperty$5.call(dest[key], name)) {
                            res[name] = {};
                            if (dest[key] && dest[key][name]) {
                                mix(res[name], dest[key][name], innerShape);
                            }
                        }
                    }
                    for (var name in src[key]) {
                        if (hasOwnProperty$5.call(src[key], name)) {
                            if (!res[name]) {
                                res[name] = {};
                            }
                            if (src[key] && src[key][name]) {
                                mix(res[name], src[key][name], innerShape);
                            }
                        }
                    }
                    dest[key] = res;
                }
            }
        }
        return dest;
    }

    var mix_1 = function(dest, src) {
        return mix(dest, src, shape);
    };

    function createSyntax(config) {
        var parse = create(config);
        var walk = create$3(config);
        var generate = create$1(config);
        var convert = create$2(walk);

        var syntax = {
            List: List_1,
            SyntaxError: _SyntaxError,
            TokenStream: TokenStream_1,
            Lexer: Lexer_1,

            vendorPrefix: names.vendorPrefix,
            keyword: names.keyword,
            property: names.property,
            isCustomProperty: names.isCustomProperty,

            definitionSyntax: definitionSyntax,
            lexer: null,
            createLexer: function(config) {
                return new Lexer_1(config, syntax, syntax.lexer.structure);
            },

            tokenize: tokenizer,
            parse: parse,
            walk: walk,
            generate: generate,

            find: walk.find,
            findLast: walk.findLast,
            findAll: walk.findAll,

            clone: clone,
            fromPlainObject: convert.fromPlainObject,
            toPlainObject: convert.toPlainObject,

            createSyntax: function(config) {
                return createSyntax(mix_1({}, config));
            },
            fork: function(extension) {
                var base = mix_1({}, config); // copy of config
                return createSyntax(
                    typeof extension === 'function'
                        ? extension(base, Object.assign)
                        : mix_1(base, extension)
                );
            }
        };

        syntax.lexer = new Lexer_1({
            generic: true,
            types: config.types,
            atrules: config.atrules,
            properties: config.properties,
            node: config.node
        }, syntax);

        return syntax;
    }
    var create_1 = function(config) {
        return createSyntax(mix_1({}, config));
    };

    var create$4 = {
        create: create_1
    };

    var generic$1 = true;
    var types = {
        "absolute-size": "xx-small|x-small|small|medium|large|x-large|xx-large",
        "alpha-value": "<number>|<percentage>",
        "angle-percentage": "<angle>|<percentage>",
        "angular-color-hint": "<angle-percentage>",
        "angular-color-stop": "<color>&&<color-stop-angle>?",
        "angular-color-stop-list": "[<angular-color-stop> [, <angular-color-hint>]?]# , <angular-color-stop>",
        "animateable-feature": "scroll-position|contents|<custom-ident>",
        attachment: "scroll|fixed|local",
        "attr()": "attr( <attr-name> <type-or-unit>? [, <attr-fallback>]? )",
        "attr-matcher": "['~'|'|'|'^'|'$'|'*']? '='",
        "attr-modifier": "i|s",
        "attribute-selector": "'[' <wq-name> ']'|'[' <wq-name> <attr-matcher> [<string-token>|<ident-token>] <attr-modifier>? ']'",
        "auto-repeat": "repeat( [auto-fill|auto-fit] , [<line-names>? <fixed-size>]+ <line-names>? )",
        "auto-track-list": "[<line-names>? [<fixed-size>|<fixed-repeat>]]* <line-names>? <auto-repeat> [<line-names>? [<fixed-size>|<fixed-repeat>]]* <line-names>?",
        "baseline-position": "[first|last]? baseline",
        "basic-shape": "<inset()>|<circle()>|<ellipse()>|<polygon()>",
        "bg-image": "none|<image>",
        "bg-layer": "<bg-image>||<bg-position> [/ <bg-size>]?||<repeat-style>||<attachment>||<box>||<box>",
        "bg-position": "[[left|center|right|top|bottom|<length-percentage>]|[left|center|right|<length-percentage>] [top|center|bottom|<length-percentage>]|[center|[left|right] <length-percentage>?]&&[center|[top|bottom] <length-percentage>?]]",
        "bg-size": "[<length-percentage>|auto]{1,2}|cover|contain",
        "blur()": "blur( <length> )",
        "blend-mode": "normal|multiply|screen|overlay|darken|lighten|color-dodge|color-burn|hard-light|soft-light|difference|exclusion|hue|saturation|color|luminosity",
        box: "border-box|padding-box|content-box",
        "brightness()": "brightness( <number-percentage> )",
        "calc()": "calc( <calc-sum> )",
        "calc-sum": "<calc-product> [['+'|'-'] <calc-product>]*",
        "calc-product": "<calc-value> ['*' <calc-value>|'/' <number>]*",
        "calc-value": "<number>|<dimension>|<percentage>|( <calc-sum> )",
        "cf-final-image": "<image>|<color>",
        "cf-mixing-image": "<percentage>?&&<image>",
        "circle()": "circle( [<shape-radius>]? [at <position>]? )",
        "clamp()": "clamp( <calc-sum>#{3} )",
        "class-selector": "'.' <ident-token>",
        "clip-source": "<url>",
        color: "<rgb()>|<rgba()>|<hsl()>|<hsla()>|<hex-color>|<named-color>|currentcolor|<deprecated-system-color>",
        "color-stop": "<color-stop-length>|<color-stop-angle>",
        "color-stop-angle": "<angle-percentage>{1,2}",
        "color-stop-length": "<length-percentage>{1,2}",
        "color-stop-list": "[<linear-color-stop> [, <linear-color-hint>]?]# , <linear-color-stop>",
        combinator: "'>'|'+'|'~'|['||']",
        "common-lig-values": "[common-ligatures|no-common-ligatures]",
        compat: "searchfield|textarea|push-button|button-bevel|slider-horizontal|checkbox|radio|square-button|menulist|menulist-button|listbox|meter|progress-bar",
        "composite-style": "clear|copy|source-over|source-in|source-out|source-atop|destination-over|destination-in|destination-out|destination-atop|xor",
        "compositing-operator": "add|subtract|intersect|exclude",
        "compound-selector": "[<type-selector>? <subclass-selector>* [<pseudo-element-selector> <pseudo-class-selector>*]*]!",
        "compound-selector-list": "<compound-selector>#",
        "complex-selector": "<compound-selector> [<combinator>? <compound-selector>]*",
        "complex-selector-list": "<complex-selector>#",
        "conic-gradient()": "conic-gradient( [from <angle>]? [at <position>]? , <angular-color-stop-list> )",
        "contextual-alt-values": "[contextual|no-contextual]",
        "content-distribution": "space-between|space-around|space-evenly|stretch",
        "content-list": "[<string>|contents|<url>|<quote>|<attr()>|counter( <ident> , <'list-style-type'>? )]+",
        "content-position": "center|start|end|flex-start|flex-end",
        "content-replacement": "<image>",
        "contrast()": "contrast( [<number-percentage>] )",
        "counter()": "counter( <custom-ident> , [<counter-style>|none]? )",
        "counter-style": "<counter-style-name>|symbols( )",
        "counter-style-name": "<custom-ident>",
        "counters()": "counters( <custom-ident> , <string> , [<counter-style>|none]? )",
        "cross-fade()": "cross-fade( <cf-mixing-image> , <cf-final-image>? )",
        "cubic-bezier-timing-function": "ease|ease-in|ease-out|ease-in-out|cubic-bezier( <number> , <number> , <number> , <number> )",
        "deprecated-system-color": "ActiveBorder|ActiveCaption|AppWorkspace|Background|ButtonFace|ButtonHighlight|ButtonShadow|ButtonText|CaptionText|GrayText|Highlight|HighlightText|InactiveBorder|InactiveCaption|InactiveCaptionText|InfoBackground|InfoText|Menu|MenuText|Scrollbar|ThreeDDarkShadow|ThreeDFace|ThreeDHighlight|ThreeDLightShadow|ThreeDShadow|Window|WindowFrame|WindowText",
        "discretionary-lig-values": "[discretionary-ligatures|no-discretionary-ligatures]",
        "display-box": "contents|none",
        "display-inside": "flow|flow-root|table|flex|grid|ruby",
        "display-internal": "table-row-group|table-header-group|table-footer-group|table-row|table-cell|table-column-group|table-column|table-caption|ruby-base|ruby-text|ruby-base-container|ruby-text-container",
        "display-legacy": "inline-block|inline-list-item|inline-table|inline-flex|inline-grid",
        "display-listitem": "<display-outside>?&&[flow|flow-root]?&&list-item",
        "display-outside": "block|inline|run-in",
        "drop-shadow()": "drop-shadow( <length>{2,3} <color>? )",
        "east-asian-variant-values": "[jis78|jis83|jis90|jis04|simplified|traditional]",
        "east-asian-width-values": "[full-width|proportional-width]",
        "element()": "element( <id-selector> )",
        "ellipse()": "ellipse( [<shape-radius>{2}]? [at <position>]? )",
        "ending-shape": "circle|ellipse",
        "env()": "env( <custom-ident> , <declaration-value>? )",
        "explicit-track-list": "[<line-names>? <track-size>]+ <line-names>?",
        "family-name": "<string>|<custom-ident>+",
        "feature-tag-value": "<string> [<integer>|on|off]?",
        "feature-type": "@stylistic|@historical-forms|@styleset|@character-variant|@swash|@ornaments|@annotation",
        "feature-value-block": "<feature-type> '{' <feature-value-declaration-list> '}'",
        "feature-value-block-list": "<feature-value-block>+",
        "feature-value-declaration": "<custom-ident> : <integer>+ ;",
        "feature-value-declaration-list": "<feature-value-declaration>",
        "feature-value-name": "<custom-ident>",
        "fill-rule": "nonzero|evenodd",
        "filter-function": "<blur()>|<brightness()>|<contrast()>|<drop-shadow()>|<grayscale()>|<hue-rotate()>|<invert()>|<opacity()>|<saturate()>|<sepia()>",
        "filter-function-list": "[<filter-function>|<url>]+",
        "final-bg-layer": "<'background-color'>||<bg-image>||<bg-position> [/ <bg-size>]?||<repeat-style>||<attachment>||<box>||<box>",
        "fit-content()": "fit-content( [<length>|<percentage>] )",
        "fixed-breadth": "<length-percentage>",
        "fixed-repeat": "repeat( [<positive-integer>] , [<line-names>? <fixed-size>]+ <line-names>? )",
        "fixed-size": "<fixed-breadth>|minmax( <fixed-breadth> , <track-breadth> )|minmax( <inflexible-breadth> , <fixed-breadth> )",
        "font-stretch-absolute": "normal|ultra-condensed|extra-condensed|condensed|semi-condensed|semi-expanded|expanded|extra-expanded|ultra-expanded|<percentage>",
        "font-variant-css21": "[normal|small-caps]",
        "font-weight-absolute": "normal|bold|<number>",
        "frequency-percentage": "<frequency>|<percentage>",
        "general-enclosed": "[<function-token> <any-value> )]|( <ident> <any-value> )",
        "generic-family": "serif|sans-serif|cursive|fantasy|monospace|-apple-system",
        "generic-name": "serif|sans-serif|cursive|fantasy|monospace",
        "geometry-box": "<shape-box>|fill-box|stroke-box|view-box",
        gradient: "<linear-gradient()>|<repeating-linear-gradient()>|<radial-gradient()>|<repeating-radial-gradient()>|<conic-gradient()>|<-legacy-gradient>",
        "grayscale()": "grayscale( <number-percentage> )",
        "grid-line": "auto|<custom-ident>|[<integer>&&<custom-ident>?]|[span&&[<integer>||<custom-ident>]]",
        "historical-lig-values": "[historical-ligatures|no-historical-ligatures]",
        "hsl()": "hsl( <hue> <percentage> <percentage> [/ <alpha-value>]? )|hsl( <hue> , <percentage> , <percentage> , <alpha-value>? )",
        "hsla()": "hsla( <hue> <percentage> <percentage> [/ <alpha-value>]? )|hsla( <hue> , <percentage> , <percentage> , <alpha-value>? )",
        hue: "<number>|<angle>",
        "hue-rotate()": "hue-rotate( <angle> )",
        image: "<url>|<image()>|<image-set()>|<element()>|<cross-fade()>|<gradient>",
        "image()": "image( <image-tags>? [<image-src>? , <color>?]! )",
        "image-set()": "image-set( <image-set-option># )",
        "image-set-option": "[<image>|<string>] <resolution>",
        "image-src": "<url>|<string>",
        "image-tags": "ltr|rtl",
        "inflexible-breadth": "<length>|<percentage>|min-content|max-content|auto",
        "inset()": "inset( <length-percentage>{1,4} [round <'border-radius'>]? )",
        "invert()": "invert( <number-percentage> )",
        "keyframes-name": "<custom-ident>|<string>",
        "keyframe-block": "<keyframe-selector># { <declaration-list> }",
        "keyframe-block-list": "<keyframe-block>+",
        "keyframe-selector": "from|to|<percentage>",
        "leader()": "leader( <leader-type> )",
        "leader-type": "dotted|solid|space|<string>",
        "length-percentage": "<length>|<percentage>",
        "line-names": "'[' <custom-ident>* ']'",
        "line-name-list": "[<line-names>|<name-repeat>]+",
        "line-style": "none|hidden|dotted|dashed|solid|double|groove|ridge|inset|outset",
        "line-width": "<length>|thin|medium|thick",
        "linear-color-hint": "<length-percentage>",
        "linear-color-stop": "<color> <color-stop-length>?",
        "linear-gradient()": "linear-gradient( [<angle>|to <side-or-corner>]? , <color-stop-list> )",
        "mask-layer": "<mask-reference>||<position> [/ <bg-size>]?||<repeat-style>||<geometry-box>||[<geometry-box>|no-clip]||<compositing-operator>||<masking-mode>",
        "mask-position": "[<length-percentage>|left|center|right] [<length-percentage>|top|center|bottom]?",
        "mask-reference": "none|<image>|<mask-source>",
        "mask-source": "<url>",
        "masking-mode": "alpha|luminance|match-source",
        "matrix()": "matrix( <number>#{6} )",
        "matrix3d()": "matrix3d( <number>#{16} )",
        "max()": "max( <calc-sum># )",
        "media-and": "<media-in-parens> [and <media-in-parens>]+",
        "media-condition": "<media-not>|<media-and>|<media-or>|<media-in-parens>",
        "media-condition-without-or": "<media-not>|<media-and>|<media-in-parens>",
        "media-feature": "( [<mf-plain>|<mf-boolean>|<mf-range>] )",
        "media-in-parens": "( <media-condition> )|<media-feature>|<general-enclosed>",
        "media-not": "not <media-in-parens>",
        "media-or": "<media-in-parens> [or <media-in-parens>]+",
        "media-query": "<media-condition>|[not|only]? <media-type> [and <media-condition-without-or>]?",
        "media-query-list": "<media-query>#",
        "media-type": "<ident>",
        "mf-boolean": "<mf-name>",
        "mf-name": "<ident>",
        "mf-plain": "<mf-name> : <mf-value>",
        "mf-range": "<mf-name> ['<'|'>']? '='? <mf-value>|<mf-value> ['<'|'>']? '='? <mf-name>|<mf-value> '<' '='? <mf-name> '<' '='? <mf-value>|<mf-value> '>' '='? <mf-name> '>' '='? <mf-value>",
        "mf-value": "<number>|<dimension>|<ident>|<ratio>",
        "min()": "min( <calc-sum># )",
        "minmax()": "minmax( [<length>|<percentage>|<flex>|min-content|max-content|auto] , [<length>|<percentage>|<flex>|min-content|max-content|auto] )",
        "named-color": "transparent|aliceblue|antiquewhite|aqua|aquamarine|azure|beige|bisque|black|blanchedalmond|blue|blueviolet|brown|burlywood|cadetblue|chartreuse|chocolate|coral|cornflowerblue|cornsilk|crimson|cyan|darkblue|darkcyan|darkgoldenrod|darkgray|darkgreen|darkgrey|darkkhaki|darkmagenta|darkolivegreen|darkorange|darkorchid|darkred|darksalmon|darkseagreen|darkslateblue|darkslategray|darkslategrey|darkturquoise|darkviolet|deeppink|deepskyblue|dimgray|dimgrey|dodgerblue|firebrick|floralwhite|forestgreen|fuchsia|gainsboro|ghostwhite|gold|goldenrod|gray|green|greenyellow|grey|honeydew|hotpink|indianred|indigo|ivory|khaki|lavender|lavenderblush|lawngreen|lemonchiffon|lightblue|lightcoral|lightcyan|lightgoldenrodyellow|lightgray|lightgreen|lightgrey|lightpink|lightsalmon|lightseagreen|lightskyblue|lightslategray|lightslategrey|lightsteelblue|lightyellow|lime|limegreen|linen|magenta|maroon|mediumaquamarine|mediumblue|mediumorchid|mediumpurple|mediumseagreen|mediumslateblue|mediumspringgreen|mediumturquoise|mediumvioletred|midnightblue|mintcream|mistyrose|moccasin|navajowhite|navy|oldlace|olive|olivedrab|orange|orangered|orchid|palegoldenrod|palegreen|paleturquoise|palevioletred|papayawhip|peachpuff|peru|pink|plum|powderblue|purple|rebeccapurple|red|rosybrown|royalblue|saddlebrown|salmon|sandybrown|seagreen|seashell|sienna|silver|skyblue|slateblue|slategray|slategrey|snow|springgreen|steelblue|tan|teal|thistle|tomato|turquoise|violet|wheat|white|whitesmoke|yellow|yellowgreen|<-non-standard-color>",
        "namespace-prefix": "<ident>",
        "ns-prefix": "[<ident-token>|'*']? '|'",
        "number-percentage": "<number>|<percentage>",
        "numeric-figure-values": "[lining-nums|oldstyle-nums]",
        "numeric-fraction-values": "[diagonal-fractions|stacked-fractions]",
        "numeric-spacing-values": "[proportional-nums|tabular-nums]",
        nth: "<an-plus-b>|even|odd",
        "opacity()": "opacity( [<number-percentage>] )",
        "overflow-position": "unsafe|safe",
        "outline-radius": "<length>|<percentage>",
        "page-body": "<declaration>? [; <page-body>]?|<page-margin-box> <page-body>",
        "page-margin-box": "<page-margin-box-type> '{' <declaration-list> '}'",
        "page-margin-box-type": "@top-left-corner|@top-left|@top-center|@top-right|@top-right-corner|@bottom-left-corner|@bottom-left|@bottom-center|@bottom-right|@bottom-right-corner|@left-top|@left-middle|@left-bottom|@right-top|@right-middle|@right-bottom",
        "page-selector-list": "[<page-selector>#]?",
        "page-selector": "<pseudo-page>+|<ident> <pseudo-page>*",
        "perspective()": "perspective( <length> )",
        "polygon()": "polygon( <fill-rule>? , [<length-percentage> <length-percentage>]# )",
        position: "[[left|center|right]||[top|center|bottom]|[left|center|right|<length-percentage>] [top|center|bottom|<length-percentage>]?|[[left|right] <length-percentage>]&&[[top|bottom] <length-percentage>]]",
        "pseudo-class-selector": "':' <ident-token>|':' <function-token> <any-value> ')'",
        "pseudo-element-selector": "':' <pseudo-class-selector>",
        "pseudo-page": ": [left|right|first|blank]",
        quote: "open-quote|close-quote|no-open-quote|no-close-quote",
        "radial-gradient()": "radial-gradient( [<ending-shape>||<size>]? [at <position>]? , <color-stop-list> )",
        "relative-selector": "<combinator>? <complex-selector>",
        "relative-selector-list": "<relative-selector>#",
        "relative-size": "larger|smaller",
        "repeat-style": "repeat-x|repeat-y|[repeat|space|round|no-repeat]{1,2}",
        "repeating-linear-gradient()": "repeating-linear-gradient( [<angle>|to <side-or-corner>]? , <color-stop-list> )",
        "repeating-radial-gradient()": "repeating-radial-gradient( [<ending-shape>||<size>]? [at <position>]? , <color-stop-list> )",
        "rgb()": "rgb( <percentage>{3} [/ <alpha-value>]? )|rgb( <number>{3} [/ <alpha-value>]? )|rgb( <percentage>#{3} , <alpha-value>? )|rgb( <number>#{3} , <alpha-value>? )",
        "rgba()": "rgba( <percentage>{3} [/ <alpha-value>]? )|rgba( <number>{3} [/ <alpha-value>]? )|rgba( <percentage>#{3} , <alpha-value>? )|rgba( <number>#{3} , <alpha-value>? )",
        "rotate()": "rotate( [<angle>|<zero>] )",
        "rotate3d()": "rotate3d( <number> , <number> , <number> , [<angle>|<zero>] )",
        "rotateX()": "rotateX( [<angle>|<zero>] )",
        "rotateY()": "rotateY( [<angle>|<zero>] )",
        "rotateZ()": "rotateZ( [<angle>|<zero>] )",
        "saturate()": "saturate( <number-percentage> )",
        "scale()": "scale( <number> , <number>? )",
        "scale3d()": "scale3d( <number> , <number> , <number> )",
        "scaleX()": "scaleX( <number> )",
        "scaleY()": "scaleY( <number> )",
        "scaleZ()": "scaleZ( <number> )",
        "self-position": "center|start|end|self-start|self-end|flex-start|flex-end",
        "shape-radius": "<length-percentage>|closest-side|farthest-side",
        "skew()": "skew( [<angle>|<zero>] , [<angle>|<zero>]? )",
        "skewX()": "skewX( [<angle>|<zero>] )",
        "skewY()": "skewY( [<angle>|<zero>] )",
        "sepia()": "sepia( <number-percentage> )",
        shadow: "inset?&&<length>{2,4}&&<color>?",
        "shadow-t": "[<length>{2,3}&&<color>?]",
        shape: "rect( <top> , <right> , <bottom> , <left> )|rect( <top> <right> <bottom> <left> )",
        "shape-box": "<box>|margin-box",
        "side-or-corner": "[left|right]||[top|bottom]",
        "single-animation": "<time>||<timing-function>||<time>||<single-animation-iteration-count>||<single-animation-direction>||<single-animation-fill-mode>||<single-animation-play-state>||[none|<keyframes-name>]",
        "single-animation-direction": "normal|reverse|alternate|alternate-reverse",
        "single-animation-fill-mode": "none|forwards|backwards|both",
        "single-animation-iteration-count": "infinite|<number>",
        "single-animation-play-state": "running|paused",
        "single-transition": "[none|<single-transition-property>]||<time>||<timing-function>||<time>",
        "single-transition-property": "all|<custom-ident>",
        size: "closest-side|farthest-side|closest-corner|farthest-corner|<length>|<length-percentage>{2}",
        "step-position": "jump-start|jump-end|jump-none|jump-both|start|end",
        "step-timing-function": "step-start|step-end|steps( <integer> [, <step-position>]? )",
        "subclass-selector": "<id-selector>|<class-selector>|<attribute-selector>|<pseudo-class-selector>",
        "supports-condition": "not <supports-in-parens>|<supports-in-parens> [and <supports-in-parens>]*|<supports-in-parens> [or <supports-in-parens>]*",
        "supports-in-parens": "( <supports-condition> )|<supports-feature>|<general-enclosed>",
        "supports-feature": "<supports-decl>|<supports-selector-fn>",
        "supports-decl": "( <declaration> )",
        "supports-selector-fn": "selector( <complex-selector> )",
        symbol: "<string>|<image>|<custom-ident>",
        target: "<target-counter()>|<target-counters()>|<target-text()>",
        "target-counter()": "target-counter( [<string>|<url>] , <custom-ident> , <counter-style>? )",
        "target-counters()": "target-counters( [<string>|<url>] , <custom-ident> , <string> , <counter-style>? )",
        "target-text()": "target-text( [<string>|<url>] , [content|before|after|first-letter]? )",
        "time-percentage": "<time>|<percentage>",
        "timing-function": "linear|<cubic-bezier-timing-function>|<step-timing-function>",
        "track-breadth": "<length-percentage>|<flex>|min-content|max-content|auto",
        "track-list": "[<line-names>? [<track-size>|<track-repeat>]]+ <line-names>?",
        "track-repeat": "repeat( [<positive-integer>] , [<line-names>? <track-size>]+ <line-names>? )",
        "track-size": "<track-breadth>|minmax( <inflexible-breadth> , <track-breadth> )|fit-content( [<length>|<percentage>] )",
        "transform-function": "<matrix()>|<translate()>|<translateX()>|<translateY()>|<scale()>|<scaleX()>|<scaleY()>|<rotate()>|<skew()>|<skewX()>|<skewY()>|<matrix3d()>|<translate3d()>|<translateZ()>|<scale3d()>|<scaleZ()>|<rotate3d()>|<rotateX()>|<rotateY()>|<rotateZ()>|<perspective()>",
        "transform-list": "<transform-function>+",
        "translate()": "translate( <length-percentage> , <length-percentage>? )",
        "translate3d()": "translate3d( <length-percentage> , <length-percentage> , <length> )",
        "translateX()": "translateX( <length-percentage> )",
        "translateY()": "translateY( <length-percentage> )",
        "translateZ()": "translateZ( <length> )",
        "type-or-unit": "string|color|url|integer|number|length|angle|time|frequency|cap|ch|em|ex|ic|lh|rlh|rem|vb|vi|vw|vh|vmin|vmax|mm|Q|cm|in|pt|pc|px|deg|grad|rad|turn|ms|s|Hz|kHz|%",
        "type-selector": "<wq-name>|<ns-prefix>? '*'",
        "var()": "var( <custom-property-name> , <declaration-value>? )",
        "viewport-length": "auto|<length-percentage>",
        "wq-name": "<ns-prefix>? <ident-token>",
        "-legacy-gradient": "<-webkit-gradient()>|<-legacy-linear-gradient>|<-legacy-repeating-linear-gradient>|<-legacy-radial-gradient>|<-legacy-repeating-radial-gradient>",
        "-legacy-linear-gradient": "-moz-linear-gradient( <-legacy-linear-gradient-arguments> )|-webkit-linear-gradient( <-legacy-linear-gradient-arguments> )|-o-linear-gradient( <-legacy-linear-gradient-arguments> )",
        "-legacy-repeating-linear-gradient": "-moz-repeating-linear-gradient( <-legacy-linear-gradient-arguments> )|-webkit-repeating-linear-gradient( <-legacy-linear-gradient-arguments> )|-o-repeating-linear-gradient( <-legacy-linear-gradient-arguments> )",
        "-legacy-linear-gradient-arguments": "[<angle>|<side-or-corner>]? , <color-stop-list>",
        "-legacy-radial-gradient": "-moz-radial-gradient( <-legacy-radial-gradient-arguments> )|-webkit-radial-gradient( <-legacy-radial-gradient-arguments> )|-o-radial-gradient( <-legacy-radial-gradient-arguments> )",
        "-legacy-repeating-radial-gradient": "-moz-repeating-radial-gradient( <-legacy-radial-gradient-arguments> )|-webkit-repeating-radial-gradient( <-legacy-radial-gradient-arguments> )|-o-repeating-radial-gradient( <-legacy-radial-gradient-arguments> )",
        "-legacy-radial-gradient-arguments": "[<position> ,]? [[[<-legacy-radial-gradient-shape>||<-legacy-radial-gradient-size>]|[<length>|<percentage>]{2}] ,]? <color-stop-list>",
        "-legacy-radial-gradient-size": "closest-side|closest-corner|farthest-side|farthest-corner|contain|cover",
        "-legacy-radial-gradient-shape": "circle|ellipse",
        "-non-standard-font": "-apple-system-body|-apple-system-headline|-apple-system-subheadline|-apple-system-caption1|-apple-system-caption2|-apple-system-footnote|-apple-system-short-body|-apple-system-short-headline|-apple-system-short-subheadline|-apple-system-short-caption1|-apple-system-short-footnote|-apple-system-tall-body",
        "-non-standard-color": "-moz-ButtonDefault|-moz-ButtonHoverFace|-moz-ButtonHoverText|-moz-CellHighlight|-moz-CellHighlightText|-moz-Combobox|-moz-ComboboxText|-moz-Dialog|-moz-DialogText|-moz-dragtargetzone|-moz-EvenTreeRow|-moz-Field|-moz-FieldText|-moz-html-CellHighlight|-moz-html-CellHighlightText|-moz-mac-accentdarkestshadow|-moz-mac-accentdarkshadow|-moz-mac-accentface|-moz-mac-accentlightesthighlight|-moz-mac-accentlightshadow|-moz-mac-accentregularhighlight|-moz-mac-accentregularshadow|-moz-mac-chrome-active|-moz-mac-chrome-inactive|-moz-mac-focusring|-moz-mac-menuselect|-moz-mac-menushadow|-moz-mac-menutextselect|-moz-MenuHover|-moz-MenuHoverText|-moz-MenuBarText|-moz-MenuBarHoverText|-moz-nativehyperlinktext|-moz-OddTreeRow|-moz-win-communicationstext|-moz-win-mediatext|-moz-activehyperlinktext|-moz-default-background-color|-moz-default-color|-moz-hyperlinktext|-moz-visitedhyperlinktext|-webkit-activelink|-webkit-focus-ring-color|-webkit-link|-webkit-text",
        "-non-standard-image-rendering": "optimize-contrast|-moz-crisp-edges|-o-crisp-edges|-webkit-optimize-contrast",
        "-non-standard-overflow": "-moz-scrollbars-none|-moz-scrollbars-horizontal|-moz-scrollbars-vertical|-moz-hidden-unscrollable",
        "-non-standard-width": "min-intrinsic|intrinsic|-moz-min-content|-moz-max-content|-webkit-min-content|-webkit-max-content",
        "-webkit-gradient()": "-webkit-gradient( <-webkit-gradient-type> , <-webkit-gradient-point> [, <-webkit-gradient-point>|, <-webkit-gradient-radius> , <-webkit-gradient-point>] [, <-webkit-gradient-radius>]? [, <-webkit-gradient-color-stop>]* )",
        "-webkit-gradient-color-stop": "from( <color> )|color-stop( [<number-zero-one>|<percentage>] , <color> )|to( <color> )",
        "-webkit-gradient-point": "[left|center|right|<length-percentage>] [top|center|bottom|<length-percentage>]",
        "-webkit-gradient-radius": "<length>|<percentage>",
        "-webkit-gradient-type": "linear|radial",
        "-webkit-mask-box-repeat": "repeat|stretch|round",
        "-webkit-mask-clip-style": "border|border-box|padding|padding-box|content|content-box|text",
        "-ms-filter-function-list": "<-ms-filter-function>+",
        "-ms-filter-function": "<-ms-filter-function-progid>|<-ms-filter-function-legacy>",
        "-ms-filter-function-progid": "'progid:' [<ident-token> '.']* [<ident-token>|<function-token> <any-value>? )]",
        "-ms-filter-function-legacy": "<ident-token>|<function-token> <any-value>? )",
        "-ms-filter": "<string>",
        age: "child|young|old",
        "attr-name": "<wq-name>",
        "attr-fallback": "<any-value>",
        "border-radius": "<length-percentage>{1,2}",
        bottom: "<length>|auto",
        "generic-voice": "[<age>? <gender> <integer>?]",
        gender: "male|female|neutral",
        left: "<length>|auto",
        "mask-image": "<mask-reference>#",
        "name-repeat": "repeat( [<positive-integer>|auto-fill] , <line-names>+ )",
        paint: "none|<color>|<url> [none|<color>]?|context-fill|context-stroke",
        "path()": "path( <string> )",
        ratio: "<integer> / <integer>",
        right: "<length>|auto",
        "svg-length": "<percentage>|<length>|<number>",
        "svg-writing-mode": "lr-tb|rl-tb|tb-rl|lr|rl|tb",
        top: "<length>|auto",
        "track-group": "'(' [<string>* <track-minmax> <string>*]+ ')' ['[' <positive-integer> ']']?|<track-minmax>",
        "track-list-v0": "[<string>* <track-group> <string>*]+|none",
        "track-minmax": "minmax( <track-breadth> , <track-breadth> )|auto|<track-breadth>|fit-content",
        x: "<number>",
        y: "<number>",
        declaration: "<ident-token> : <declaration-value>? ['!' important]?",
        "declaration-list": "[<declaration>? ';']* <declaration>?",
        url: "url( <string> <url-modifier>* )|<url-token>",
        "url-modifier": "<ident>|<function-token> <any-value> )",
        "number-zero-one": "<number [0,1]>",
        "number-one-or-greater": "<number [1,∞]>",
        "positive-integer": "<integer [0,∞]>"
    };
    var properties$1 = {
        "--*": "<declaration-value>",
        "-ms-accelerator": "false|true",
        "-ms-block-progression": "tb|rl|bt|lr",
        "-ms-content-zoom-chaining": "none|chained",
        "-ms-content-zooming": "none|zoom",
        "-ms-content-zoom-limit": "<'-ms-content-zoom-limit-min'> <'-ms-content-zoom-limit-max'>",
        "-ms-content-zoom-limit-max": "<percentage>",
        "-ms-content-zoom-limit-min": "<percentage>",
        "-ms-content-zoom-snap": "<'-ms-content-zoom-snap-type'>||<'-ms-content-zoom-snap-points'>",
        "-ms-content-zoom-snap-points": "snapInterval( <percentage> , <percentage> )|snapList( <percentage># )",
        "-ms-content-zoom-snap-type": "none|proximity|mandatory",
        "-ms-filter": "<string>",
        "-ms-flow-from": "[none|<custom-ident>]#",
        "-ms-flow-into": "[none|<custom-ident>]#",
        "-ms-high-contrast-adjust": "auto|none",
        "-ms-hyphenate-limit-chars": "auto|<integer>{1,3}",
        "-ms-hyphenate-limit-lines": "no-limit|<integer>",
        "-ms-hyphenate-limit-zone": "<percentage>|<length>",
        "-ms-ime-align": "auto|after",
        "-ms-overflow-style": "auto|none|scrollbar|-ms-autohiding-scrollbar",
        "-ms-scrollbar-3dlight-color": "<color>",
        "-ms-scrollbar-arrow-color": "<color>",
        "-ms-scrollbar-base-color": "<color>",
        "-ms-scrollbar-darkshadow-color": "<color>",
        "-ms-scrollbar-face-color": "<color>",
        "-ms-scrollbar-highlight-color": "<color>",
        "-ms-scrollbar-shadow-color": "<color>",
        "-ms-scrollbar-track-color": "<color>",
        "-ms-scroll-chaining": "chained|none",
        "-ms-scroll-limit": "<'-ms-scroll-limit-x-min'> <'-ms-scroll-limit-y-min'> <'-ms-scroll-limit-x-max'> <'-ms-scroll-limit-y-max'>",
        "-ms-scroll-limit-x-max": "auto|<length>",
        "-ms-scroll-limit-x-min": "<length>",
        "-ms-scroll-limit-y-max": "auto|<length>",
        "-ms-scroll-limit-y-min": "<length>",
        "-ms-scroll-rails": "none|railed",
        "-ms-scroll-snap-points-x": "snapInterval( <length-percentage> , <length-percentage> )|snapList( <length-percentage># )",
        "-ms-scroll-snap-points-y": "snapInterval( <length-percentage> , <length-percentage> )|snapList( <length-percentage># )",
        "-ms-scroll-snap-type": "none|proximity|mandatory",
        "-ms-scroll-snap-x": "<'-ms-scroll-snap-type'> <'-ms-scroll-snap-points-x'>",
        "-ms-scroll-snap-y": "<'-ms-scroll-snap-type'> <'-ms-scroll-snap-points-y'>",
        "-ms-scroll-translation": "none|vertical-to-horizontal",
        "-ms-text-autospace": "none|ideograph-alpha|ideograph-numeric|ideograph-parenthesis|ideograph-space",
        "-ms-touch-select": "grippers|none",
        "-ms-user-select": "none|element|text",
        "-ms-wrap-flow": "auto|both|start|end|maximum|clear",
        "-ms-wrap-margin": "<length>",
        "-ms-wrap-through": "wrap|none",
        "-moz-appearance": "none|button|button-arrow-down|button-arrow-next|button-arrow-previous|button-arrow-up|button-bevel|button-focus|caret|checkbox|checkbox-container|checkbox-label|checkmenuitem|dualbutton|groupbox|listbox|listitem|menuarrow|menubar|menucheckbox|menuimage|menuitem|menuitemtext|menulist|menulist-button|menulist-text|menulist-textfield|menupopup|menuradio|menuseparator|meterbar|meterchunk|progressbar|progressbar-vertical|progresschunk|progresschunk-vertical|radio|radio-container|radio-label|radiomenuitem|range|range-thumb|resizer|resizerpanel|scale-horizontal|scalethumbend|scalethumb-horizontal|scalethumbstart|scalethumbtick|scalethumb-vertical|scale-vertical|scrollbarbutton-down|scrollbarbutton-left|scrollbarbutton-right|scrollbarbutton-up|scrollbarthumb-horizontal|scrollbarthumb-vertical|scrollbartrack-horizontal|scrollbartrack-vertical|searchfield|separator|sheet|spinner|spinner-downbutton|spinner-textfield|spinner-upbutton|splitter|statusbar|statusbarpanel|tab|tabpanel|tabpanels|tab-scroll-arrow-back|tab-scroll-arrow-forward|textfield|textfield-multiline|toolbar|toolbarbutton|toolbarbutton-dropdown|toolbargripper|toolbox|tooltip|treeheader|treeheadercell|treeheadersortarrow|treeitem|treeline|treetwisty|treetwistyopen|treeview|-moz-mac-unified-toolbar|-moz-win-borderless-glass|-moz-win-browsertabbar-toolbox|-moz-win-communicationstext|-moz-win-communications-toolbox|-moz-win-exclude-glass|-moz-win-glass|-moz-win-mediatext|-moz-win-media-toolbox|-moz-window-button-box|-moz-window-button-box-maximized|-moz-window-button-close|-moz-window-button-maximize|-moz-window-button-minimize|-moz-window-button-restore|-moz-window-frame-bottom|-moz-window-frame-left|-moz-window-frame-right|-moz-window-titlebar|-moz-window-titlebar-maximized",
        "-moz-binding": "<url>|none",
        "-moz-border-bottom-colors": "<color>+|none",
        "-moz-border-left-colors": "<color>+|none",
        "-moz-border-right-colors": "<color>+|none",
        "-moz-border-top-colors": "<color>+|none",
        "-moz-context-properties": "none|[fill|fill-opacity|stroke|stroke-opacity]#",
        "-moz-float-edge": "border-box|content-box|margin-box|padding-box",
        "-moz-force-broken-image-icon": "<integer>",
        "-moz-image-region": "<shape>|auto",
        "-moz-orient": "inline|block|horizontal|vertical",
        "-moz-outline-radius": "<outline-radius>{1,4} [/ <outline-radius>{1,4}]?",
        "-moz-outline-radius-bottomleft": "<outline-radius>",
        "-moz-outline-radius-bottomright": "<outline-radius>",
        "-moz-outline-radius-topleft": "<outline-radius>",
        "-moz-outline-radius-topright": "<outline-radius>",
        "-moz-stack-sizing": "ignore|stretch-to-fit",
        "-moz-text-blink": "none|blink",
        "-moz-user-focus": "ignore|normal|select-after|select-before|select-menu|select-same|select-all|none",
        "-moz-user-input": "auto|none|enabled|disabled",
        "-moz-user-modify": "read-only|read-write|write-only",
        "-moz-window-dragging": "drag|no-drag",
        "-moz-window-shadow": "default|menu|tooltip|sheet|none",
        "-webkit-appearance": "none|button|button-bevel|caps-lock-indicator|caret|checkbox|default-button|listbox|listitem|media-fullscreen-button|media-mute-button|media-play-button|media-seek-back-button|media-seek-forward-button|media-slider|media-sliderthumb|menulist|menulist-button|menulist-text|menulist-textfield|push-button|radio|scrollbarbutton-down|scrollbarbutton-left|scrollbarbutton-right|scrollbarbutton-up|scrollbargripper-horizontal|scrollbargripper-vertical|scrollbarthumb-horizontal|scrollbarthumb-vertical|scrollbartrack-horizontal|scrollbartrack-vertical|searchfield|searchfield-cancel-button|searchfield-decoration|searchfield-results-button|searchfield-results-decoration|slider-horizontal|slider-vertical|sliderthumb-horizontal|sliderthumb-vertical|square-button|textarea|textfield",
        "-webkit-border-before": "<'border-width'>||<'border-style'>||<'color'>",
        "-webkit-border-before-color": "<'color'>",
        "-webkit-border-before-style": "<'border-style'>",
        "-webkit-border-before-width": "<'border-width'>",
        "-webkit-box-reflect": "[above|below|right|left]? <length>? <image>?",
        "-webkit-line-clamp": "none|<integer>",
        "-webkit-mask": "[<mask-reference>||<position> [/ <bg-size>]?||<repeat-style>||[<box>|border|padding|content|text]||[<box>|border|padding|content]]#",
        "-webkit-mask-attachment": "<attachment>#",
        "-webkit-mask-clip": "[<box>|border|padding|content|text]#",
        "-webkit-mask-composite": "<composite-style>#",
        "-webkit-mask-image": "<mask-reference>#",
        "-webkit-mask-origin": "[<box>|border|padding|content]#",
        "-webkit-mask-position": "<position>#",
        "-webkit-mask-position-x": "[<length-percentage>|left|center|right]#",
        "-webkit-mask-position-y": "[<length-percentage>|top|center|bottom]#",
        "-webkit-mask-repeat": "<repeat-style>#",
        "-webkit-mask-repeat-x": "repeat|no-repeat|space|round",
        "-webkit-mask-repeat-y": "repeat|no-repeat|space|round",
        "-webkit-mask-size": "<bg-size>#",
        "-webkit-overflow-scrolling": "auto|touch",
        "-webkit-tap-highlight-color": "<color>",
        "-webkit-text-fill-color": "<color>",
        "-webkit-text-stroke": "<length>||<color>",
        "-webkit-text-stroke-color": "<color>",
        "-webkit-text-stroke-width": "<length>",
        "-webkit-touch-callout": "default|none",
        "-webkit-user-modify": "read-only|read-write|read-write-plaintext-only",
        "align-content": "normal|<baseline-position>|<content-distribution>|<overflow-position>? <content-position>",
        "align-items": "normal|stretch|<baseline-position>|[<overflow-position>? <self-position>]",
        "align-self": "auto|normal|stretch|<baseline-position>|<overflow-position>? <self-position>",
        all: "initial|inherit|unset|revert",
        animation: "<single-animation>#",
        "animation-delay": "<time>#",
        "animation-direction": "<single-animation-direction>#",
        "animation-duration": "<time>#",
        "animation-fill-mode": "<single-animation-fill-mode>#",
        "animation-iteration-count": "<single-animation-iteration-count>#",
        "animation-name": "[none|<keyframes-name>]#",
        "animation-play-state": "<single-animation-play-state>#",
        "animation-timing-function": "<timing-function>#",
        appearance: "none|auto|button|textfield|<compat>",
        azimuth: "<angle>|[[left-side|far-left|left|center-left|center|center-right|right|far-right|right-side]||behind]|leftwards|rightwards",
        "backdrop-filter": "none|<filter-function-list>",
        "backface-visibility": "visible|hidden",
        background: "[<bg-layer> ,]* <final-bg-layer>",
        "background-attachment": "<attachment>#",
        "background-blend-mode": "<blend-mode>#",
        "background-clip": "<box>#",
        "background-color": "<color>",
        "background-image": "<bg-image>#",
        "background-origin": "<box>#",
        "background-position": "<bg-position>#",
        "background-position-x": "[center|[left|right|x-start|x-end]? <length-percentage>?]#",
        "background-position-y": "[center|[top|bottom|y-start|y-end]? <length-percentage>?]#",
        "background-repeat": "<repeat-style>#",
        "background-size": "<bg-size>#",
        "block-overflow": "clip|ellipsis|<string>",
        "block-size": "<'width'>",
        border: "<line-width>||<line-style>||<color>",
        "border-block": "<'border-top-width'>||<'border-top-style'>||<'color'>",
        "border-block-color": "<'border-top-color'>{1,2}",
        "border-block-style": "<'border-top-style'>",
        "border-block-width": "<'border-top-width'>",
        "border-block-end": "<'border-top-width'>||<'border-top-style'>||<'color'>",
        "border-block-end-color": "<'border-top-color'>",
        "border-block-end-style": "<'border-top-style'>",
        "border-block-end-width": "<'border-top-width'>",
        "border-block-start": "<'border-top-width'>||<'border-top-style'>||<'color'>",
        "border-block-start-color": "<'border-top-color'>",
        "border-block-start-style": "<'border-top-style'>",
        "border-block-start-width": "<'border-top-width'>",
        "border-bottom": "<line-width>||<line-style>||<color>",
        "border-bottom-color": "<'border-top-color'>",
        "border-bottom-left-radius": "<length-percentage>{1,2}",
        "border-bottom-right-radius": "<length-percentage>{1,2}",
        "border-bottom-style": "<line-style>",
        "border-bottom-width": "<line-width>",
        "border-collapse": "collapse|separate",
        "border-color": "<color>{1,4}",
        "border-end-end-radius": "<length-percentage>{1,2}",
        "border-end-start-radius": "<length-percentage>{1,2}",
        "border-image": "<'border-image-source'>||<'border-image-slice'> [/ <'border-image-width'>|/ <'border-image-width'>? / <'border-image-outset'>]?||<'border-image-repeat'>",
        "border-image-outset": "[<length>|<number>]{1,4}",
        "border-image-repeat": "[stretch|repeat|round|space]{1,2}",
        "border-image-slice": "<number-percentage>{1,4}&&fill?",
        "border-image-source": "none|<image>",
        "border-image-width": "[<length-percentage>|<number>|auto]{1,4}",
        "border-inline": "<'border-top-width'>||<'border-top-style'>||<'color'>",
        "border-inline-end": "<'border-top-width'>||<'border-top-style'>||<'color'>",
        "border-inline-color": "<'border-top-color'>{1,2}",
        "border-inline-style": "<'border-top-style'>",
        "border-inline-width": "<'border-top-width'>",
        "border-inline-end-color": "<'border-top-color'>",
        "border-inline-end-style": "<'border-top-style'>",
        "border-inline-end-width": "<'border-top-width'>",
        "border-inline-start": "<'border-top-width'>||<'border-top-style'>||<'color'>",
        "border-inline-start-color": "<'border-top-color'>",
        "border-inline-start-style": "<'border-top-style'>",
        "border-inline-start-width": "<'border-top-width'>",
        "border-left": "<line-width>||<line-style>||<color>",
        "border-left-color": "<color>",
        "border-left-style": "<line-style>",
        "border-left-width": "<line-width>",
        "border-radius": "<length-percentage>{1,4} [/ <length-percentage>{1,4}]?",
        "border-right": "<line-width>||<line-style>||<color>",
        "border-right-color": "<color>",
        "border-right-style": "<line-style>",
        "border-right-width": "<line-width>",
        "border-spacing": "<length> <length>?",
        "border-start-end-radius": "<length-percentage>{1,2}",
        "border-start-start-radius": "<length-percentage>{1,2}",
        "border-style": "<line-style>{1,4}",
        "border-top": "<line-width>||<line-style>||<color>",
        "border-top-color": "<color>",
        "border-top-left-radius": "<length-percentage>{1,2}",
        "border-top-right-radius": "<length-percentage>{1,2}",
        "border-top-style": "<line-style>",
        "border-top-width": "<line-width>",
        "border-width": "<line-width>{1,4}",
        bottom: "<length>|<percentage>|auto",
        "box-align": "start|center|end|baseline|stretch",
        "box-decoration-break": "slice|clone",
        "box-direction": "normal|reverse|inherit",
        "box-flex": "<number>",
        "box-flex-group": "<integer>",
        "box-lines": "single|multiple",
        "box-ordinal-group": "<integer>",
        "box-orient": "horizontal|vertical|inline-axis|block-axis|inherit",
        "box-pack": "start|center|end|justify",
        "box-shadow": "none|<shadow>#",
        "box-sizing": "content-box|border-box",
        "break-after": "auto|avoid|always|all|avoid-page|page|left|right|recto|verso|avoid-column|column|avoid-region|region",
        "break-before": "auto|avoid|always|all|avoid-page|page|left|right|recto|verso|avoid-column|column|avoid-region|region",
        "break-inside": "auto|avoid|avoid-page|avoid-column|avoid-region",
        "caption-side": "top|bottom|block-start|block-end|inline-start|inline-end",
        "caret-color": "auto|<color>",
        clear: "none|left|right|both|inline-start|inline-end",
        clip: "<shape>|auto",
        "clip-path": "<clip-source>|[<basic-shape>||<geometry-box>]|none",
        color: "<color>",
        "color-adjust": "economy|exact",
        "column-count": "<integer>|auto",
        "column-fill": "auto|balance|balance-all",
        "column-gap": "normal|<length-percentage>",
        "column-rule": "<'column-rule-width'>||<'column-rule-style'>||<'column-rule-color'>",
        "column-rule-color": "<color>",
        "column-rule-style": "<'border-style'>",
        "column-rule-width": "<'border-width'>",
        "column-span": "none|all",
        "column-width": "<length>|auto",
        columns: "<'column-width'>||<'column-count'>",
        contain: "none|strict|content|[size||layout||style||paint]",
        content: "normal|none|[<content-replacement>|<content-list>] [/ <string>]?",
        "counter-increment": "[<custom-ident> <integer>?]+|none",
        "counter-reset": "[<custom-ident> <integer>?]+|none",
        "counter-set": "[<custom-ident> <integer>?]+|none",
        cursor: "[[<url> [<x> <y>]? ,]* [auto|default|none|context-menu|help|pointer|progress|wait|cell|crosshair|text|vertical-text|alias|copy|move|no-drop|not-allowed|e-resize|n-resize|ne-resize|nw-resize|s-resize|se-resize|sw-resize|w-resize|ew-resize|ns-resize|nesw-resize|nwse-resize|col-resize|row-resize|all-scroll|zoom-in|zoom-out|grab|grabbing|hand|-webkit-grab|-webkit-grabbing|-webkit-zoom-in|-webkit-zoom-out|-moz-grab|-moz-grabbing|-moz-zoom-in|-moz-zoom-out]]",
        direction: "ltr|rtl",
        display: "block|contents|flex|flow|flow-root|grid|inline|inline-block|inline-flex|inline-grid|inline-list-item|inline-table|list-item|none|ruby|ruby-base|ruby-base-container|ruby-text|ruby-text-container|run-in|table|table-caption|table-cell|table-column|table-column-group|table-footer-group|table-header-group|table-row|table-row-group|-ms-flexbox|-ms-inline-flexbox|-ms-grid|-ms-inline-grid|-webkit-flex|-webkit-inline-flex|-webkit-box|-webkit-inline-box|-moz-inline-stack|-moz-box|-moz-inline-box",
        "empty-cells": "show|hide",
        filter: "none|<filter-function-list>|<-ms-filter-function-list>",
        flex: "none|[<'flex-grow'> <'flex-shrink'>?||<'flex-basis'>]",
        "flex-basis": "content|<'width'>",
        "flex-direction": "row|row-reverse|column|column-reverse",
        "flex-flow": "<'flex-direction'>||<'flex-wrap'>",
        "flex-grow": "<number>",
        "flex-shrink": "<number>",
        "flex-wrap": "nowrap|wrap|wrap-reverse",
        float: "left|right|none|inline-start|inline-end",
        font: "[[<'font-style'>||<font-variant-css21>||<'font-weight'>||<'font-stretch'>]? <'font-size'> [/ <'line-height'>]? <'font-family'>]|caption|icon|menu|message-box|small-caption|status-bar",
        "font-family": "[<family-name>|<generic-family>]#",
        "font-feature-settings": "normal|<feature-tag-value>#",
        "font-kerning": "auto|normal|none",
        "font-language-override": "normal|<string>",
        "font-optical-sizing": "auto|none",
        "font-variation-settings": "normal|[<string> <number>]#",
        "font-size": "<absolute-size>|<relative-size>|<length-percentage>",
        "font-size-adjust": "none|<number>",
        "font-stretch": "<font-stretch-absolute>",
        "font-style": "normal|italic|oblique <angle>?",
        "font-synthesis": "none|[weight||style]",
        "font-variant": "normal|none|[<common-lig-values>||<discretionary-lig-values>||<historical-lig-values>||<contextual-alt-values>||stylistic( <feature-value-name> )||historical-forms||styleset( <feature-value-name># )||character-variant( <feature-value-name># )||swash( <feature-value-name> )||ornaments( <feature-value-name> )||annotation( <feature-value-name> )||[small-caps|all-small-caps|petite-caps|all-petite-caps|unicase|titling-caps]||<numeric-figure-values>||<numeric-spacing-values>||<numeric-fraction-values>||ordinal||slashed-zero||<east-asian-variant-values>||<east-asian-width-values>||ruby]",
        "font-variant-alternates": "normal|[stylistic( <feature-value-name> )||historical-forms||styleset( <feature-value-name># )||character-variant( <feature-value-name># )||swash( <feature-value-name> )||ornaments( <feature-value-name> )||annotation( <feature-value-name> )]",
        "font-variant-caps": "normal|small-caps|all-small-caps|petite-caps|all-petite-caps|unicase|titling-caps",
        "font-variant-east-asian": "normal|[<east-asian-variant-values>||<east-asian-width-values>||ruby]",
        "font-variant-ligatures": "normal|none|[<common-lig-values>||<discretionary-lig-values>||<historical-lig-values>||<contextual-alt-values>]",
        "font-variant-numeric": "normal|[<numeric-figure-values>||<numeric-spacing-values>||<numeric-fraction-values>||ordinal||slashed-zero]",
        "font-variant-position": "normal|sub|super",
        "font-weight": "<font-weight-absolute>|bolder|lighter",
        gap: "<'row-gap'> <'column-gap'>?",
        grid: "<'grid-template'>|<'grid-template-rows'> / [auto-flow&&dense?] <'grid-auto-columns'>?|[auto-flow&&dense?] <'grid-auto-rows'>? / <'grid-template-columns'>",
        "grid-area": "<grid-line> [/ <grid-line>]{0,3}",
        "grid-auto-columns": "<track-size>+",
        "grid-auto-flow": "[row|column]||dense",
        "grid-auto-rows": "<track-size>+",
        "grid-column": "<grid-line> [/ <grid-line>]?",
        "grid-column-end": "<grid-line>",
        "grid-column-gap": "<length-percentage>",
        "grid-column-start": "<grid-line>",
        "grid-gap": "<'grid-row-gap'> <'grid-column-gap'>?",
        "grid-row": "<grid-line> [/ <grid-line>]?",
        "grid-row-end": "<grid-line>",
        "grid-row-gap": "<length-percentage>",
        "grid-row-start": "<grid-line>",
        "grid-template": "none|[<'grid-template-rows'> / <'grid-template-columns'>]|[<line-names>? <string> <track-size>? <line-names>?]+ [/ <explicit-track-list>]?",
        "grid-template-areas": "none|<string>+",
        "grid-template-columns": "none|<track-list>|<auto-track-list>",
        "grid-template-rows": "none|<track-list>|<auto-track-list>",
        "hanging-punctuation": "none|[first||[force-end|allow-end]||last]",
        height: "[<length>|<percentage>]&&[border-box|content-box]?|available|min-content|max-content|fit-content|auto",
        hyphens: "none|manual|auto",
        "image-orientation": "from-image|<angle>|[<angle>? flip]",
        "image-rendering": "auto|crisp-edges|pixelated|optimizeSpeed|optimizeQuality|<-non-standard-image-rendering>",
        "image-resolution": "[from-image||<resolution>]&&snap?",
        "ime-mode": "auto|normal|active|inactive|disabled",
        "initial-letter": "normal|[<number> <integer>?]",
        "initial-letter-align": "[auto|alphabetic|hanging|ideographic]",
        "inline-size": "<'width'>",
        inset: "<'top'>{1,4}",
        "inset-block": "<'top'>{1,2}",
        "inset-block-end": "<'top'>",
        "inset-block-start": "<'top'>",
        "inset-inline": "<'top'>{1,2}",
        "inset-inline-end": "<'top'>",
        "inset-inline-start": "<'top'>",
        isolation: "auto|isolate",
        "justify-content": "normal|<content-distribution>|<overflow-position>? [<content-position>|left|right]",
        "justify-items": "normal|stretch|<baseline-position>|<overflow-position>? [<self-position>|left|right]|legacy|legacy&&[left|right|center]",
        "justify-self": "auto|normal|stretch|<baseline-position>|<overflow-position>? [<self-position>|left|right]",
        left: "<length>|<percentage>|auto",
        "letter-spacing": "normal|<length-percentage>",
        "line-break": "auto|loose|normal|strict",
        "line-clamp": "none|<integer>",
        "line-height": "normal|<number>|<length>|<percentage>",
        "line-height-step": "<length>",
        "list-style": "<'list-style-type'>||<'list-style-position'>||<'list-style-image'>",
        "list-style-image": "<url>|none",
        "list-style-position": "inside|outside",
        "list-style-type": "<counter-style>|<string>|none",
        margin: "[<length>|<percentage>|auto]{1,4}",
        "margin-block": "<'margin-left'>{1,2}",
        "margin-block-end": "<'margin-left'>",
        "margin-block-start": "<'margin-left'>",
        "margin-bottom": "<length>|<percentage>|auto",
        "margin-inline": "<'margin-left'>{1,2}",
        "margin-inline-end": "<'margin-left'>",
        "margin-inline-start": "<'margin-left'>",
        "margin-left": "<length>|<percentage>|auto",
        "margin-right": "<length>|<percentage>|auto",
        "margin-top": "<length>|<percentage>|auto",
        mask: "<mask-layer>#",
        "mask-border": "<'mask-border-source'>||<'mask-border-slice'> [/ <'mask-border-width'>? [/ <'mask-border-outset'>]?]?||<'mask-border-repeat'>||<'mask-border-mode'>",
        "mask-border-mode": "luminance|alpha",
        "mask-border-outset": "[<length>|<number>]{1,4}",
        "mask-border-repeat": "[stretch|repeat|round|space]{1,2}",
        "mask-border-slice": "<number-percentage>{1,4} fill?",
        "mask-border-source": "none|<image>",
        "mask-border-width": "[<length-percentage>|<number>|auto]{1,4}",
        "mask-clip": "[<geometry-box>|no-clip]#",
        "mask-composite": "<compositing-operator>#",
        "mask-image": "<mask-reference>#",
        "mask-mode": "<masking-mode>#",
        "mask-origin": "<geometry-box>#",
        "mask-position": "<position>#",
        "mask-repeat": "<repeat-style>#",
        "mask-size": "<bg-size>#",
        "mask-type": "luminance|alpha",
        "max-block-size": "<'max-width'>",
        "max-height": "<length>|<percentage>|none|max-content|min-content|fit-content|fill-available",
        "max-inline-size": "<'max-width'>",
        "max-lines": "none|<integer>",
        "max-width": "<length>|<percentage>|none|max-content|min-content|fit-content|fill-available|<-non-standard-width>",
        "min-block-size": "<'min-width'>",
        "min-height": "<length>|<percentage>|auto|max-content|min-content|fit-content|fill-available",
        "min-inline-size": "<'min-width'>",
        "min-width": "<length>|<percentage>|auto|max-content|min-content|fit-content|fill-available|<-non-standard-width>",
        "mix-blend-mode": "<blend-mode>",
        "object-fit": "fill|contain|cover|none|scale-down",
        "object-position": "<position>",
        offset: "[<'offset-position'>? [<'offset-path'> [<'offset-distance'>||<'offset-rotate'>]?]?]! [/ <'offset-anchor'>]?",
        "offset-anchor": "auto|<position>",
        "offset-distance": "<length-percentage>",
        "offset-path": "none|ray( [<angle>&&<size>?&&contain?] )|<path()>|<url>|[<basic-shape>||<geometry-box>]",
        "offset-position": "auto|<position>",
        "offset-rotate": "[auto|reverse]||<angle>",
        opacity: "<number-zero-one>",
        order: "<integer>",
        orphans: "<integer>",
        outline: "[<'outline-color'>||<'outline-style'>||<'outline-width'>]",
        "outline-color": "<color>|invert",
        "outline-offset": "<length>",
        "outline-style": "auto|<'border-style'>",
        "outline-width": "<line-width>",
        overflow: "[visible|hidden|clip|scroll|auto]{1,2}|<-non-standard-overflow>",
        "overflow-anchor": "auto|none",
        "overflow-block": "visible|hidden|clip|scroll|auto",
        "overflow-clip-box": "padding-box|content-box",
        "overflow-inline": "visible|hidden|clip|scroll|auto",
        "overflow-wrap": "normal|break-word|anywhere",
        "overflow-x": "visible|hidden|clip|scroll|auto",
        "overflow-y": "visible|hidden|clip|scroll|auto",
        "overscroll-behavior": "[contain|none|auto]{1,2}",
        "overscroll-behavior-x": "contain|none|auto",
        "overscroll-behavior-y": "contain|none|auto",
        padding: "[<length>|<percentage>]{1,4}",
        "padding-block": "<'padding-left'>{1,2}",
        "padding-block-end": "<'padding-left'>",
        "padding-block-start": "<'padding-left'>",
        "padding-bottom": "<length>|<percentage>",
        "padding-inline": "<'padding-left'>{1,2}",
        "padding-inline-end": "<'padding-left'>",
        "padding-inline-start": "<'padding-left'>",
        "padding-left": "<length>|<percentage>",
        "padding-right": "<length>|<percentage>",
        "padding-top": "<length>|<percentage>",
        "page-break-after": "auto|always|avoid|left|right|recto|verso",
        "page-break-before": "auto|always|avoid|left|right|recto|verso",
        "page-break-inside": "auto|avoid",
        "paint-order": "normal|[fill||stroke||markers]",
        perspective: "none|<length>",
        "perspective-origin": "<position>",
        "place-content": "<'align-content'> <'justify-content'>?",
        "place-items": "<'align-items'> <'justify-items'>?",
        "place-self": "<'align-self'> <'justify-self'>?",
        "pointer-events": "auto|none|visiblePainted|visibleFill|visibleStroke|visible|painted|fill|stroke|all|inherit",
        position: "static|relative|absolute|sticky|fixed|-webkit-sticky",
        quotes: "none|[<string> <string>]+",
        resize: "none|both|horizontal|vertical|block|inline",
        right: "<length>|<percentage>|auto",
        rotate: "none|<angle>|[x|y|z|<number>{3}]&&<angle>",
        "row-gap": "normal|<length-percentage>",
        "ruby-align": "start|center|space-between|space-around",
        "ruby-merge": "separate|collapse|auto",
        "ruby-position": "over|under|inter-character",
        scale: "none|<number>{1,3}",
        "scrollbar-color": "auto|dark|light|<color>{2}",
        "scrollbar-width": "auto|thin|none",
        "scroll-behavior": "auto|smooth",
        "scroll-margin": "<length>{1,4}",
        "scroll-margin-block": "<length>{1,2}",
        "scroll-margin-block-start": "<length>",
        "scroll-margin-block-end": "<length>",
        "scroll-margin-bottom": "<length>",
        "scroll-margin-inline": "<length>{1,2}",
        "scroll-margin-inline-start": "<length>",
        "scroll-margin-inline-end": "<length>",
        "scroll-margin-left": "<length>",
        "scroll-margin-right": "<length>",
        "scroll-margin-top": "<length>",
        "scroll-padding": "[auto|<length-percentage>]{1,4}",
        "scroll-padding-block": "[auto|<length-percentage>]{1,2}",
        "scroll-padding-block-start": "auto|<length-percentage>",
        "scroll-padding-block-end": "auto|<length-percentage>",
        "scroll-padding-bottom": "auto|<length-percentage>",
        "scroll-padding-inline": "[auto|<length-percentage>]{1,2}",
        "scroll-padding-inline-start": "auto|<length-percentage>",
        "scroll-padding-inline-end": "auto|<length-percentage>",
        "scroll-padding-left": "auto|<length-percentage>",
        "scroll-padding-right": "auto|<length-percentage>",
        "scroll-padding-top": "auto|<length-percentage>",
        "scroll-snap-align": "[none|start|end|center]{1,2}",
        "scroll-snap-coordinate": "none|<position>#",
        "scroll-snap-destination": "<position>",
        "scroll-snap-points-x": "none|repeat( <length-percentage> )",
        "scroll-snap-points-y": "none|repeat( <length-percentage> )",
        "scroll-snap-stop": "normal|always",
        "scroll-snap-type": "none|[x|y|block|inline|both] [mandatory|proximity]?",
        "scroll-snap-type-x": "none|mandatory|proximity",
        "scroll-snap-type-y": "none|mandatory|proximity",
        "shape-image-threshold": "<number>",
        "shape-margin": "<length-percentage>",
        "shape-outside": "none|<shape-box>||<basic-shape>|<image>",
        "tab-size": "<integer>|<length>",
        "table-layout": "auto|fixed",
        "text-align": "start|end|left|right|center|justify|match-parent",
        "text-align-last": "auto|start|end|left|right|center|justify",
        "text-combine-upright": "none|all|[digits <integer>?]",
        "text-decoration": "<'text-decoration-line'>||<'text-decoration-style'>||<'text-decoration-color'>",
        "text-decoration-color": "<color>",
        "text-decoration-line": "none|[underline||overline||line-through||blink]",
        "text-decoration-skip": "none|[objects||[spaces|[leading-spaces||trailing-spaces]]||edges||box-decoration]",
        "text-decoration-skip-ink": "auto|none",
        "text-decoration-style": "solid|double|dotted|dashed|wavy",
        "text-emphasis": "<'text-emphasis-style'>||<'text-emphasis-color'>",
        "text-emphasis-color": "<color>",
        "text-emphasis-position": "[over|under]&&[right|left]",
        "text-emphasis-style": "none|[[filled|open]||[dot|circle|double-circle|triangle|sesame]]|<string>",
        "text-indent": "<length-percentage>&&hanging?&&each-line?",
        "text-justify": "auto|inter-character|inter-word|none",
        "text-orientation": "mixed|upright|sideways",
        "text-overflow": "[clip|ellipsis|<string>]{1,2}",
        "text-rendering": "auto|optimizeSpeed|optimizeLegibility|geometricPrecision",
        "text-shadow": "none|<shadow-t>#",
        "text-size-adjust": "none|auto|<percentage>",
        "text-transform": "none|capitalize|uppercase|lowercase|full-width|full-size-kana",
        "text-underline-position": "auto|[under||[left|right]]",
        top: "<length>|<percentage>|auto",
        "touch-action": "auto|none|[[pan-x|pan-left|pan-right]||[pan-y|pan-up|pan-down]||pinch-zoom]|manipulation",
        transform: "none|<transform-list>",
        "transform-box": "border-box|fill-box|view-box",
        "transform-origin": "[<length-percentage>|left|center|right|top|bottom]|[[<length-percentage>|left|center|right]&&[<length-percentage>|top|center|bottom]] <length>?",
        "transform-style": "flat|preserve-3d",
        transition: "<single-transition>#",
        "transition-delay": "<time>#",
        "transition-duration": "<time>#",
        "transition-property": "none|<single-transition-property>#",
        "transition-timing-function": "<timing-function>#",
        translate: "none|<length-percentage> [<length-percentage> <length>?]?",
        "unicode-bidi": "normal|embed|isolate|bidi-override|isolate-override|plaintext|-moz-isolate|-moz-isolate-override|-moz-plaintext|-webkit-isolate",
        "user-select": "auto|text|none|contain|all",
        "vertical-align": "baseline|sub|super|text-top|text-bottom|middle|top|bottom|<percentage>|<length>",
        visibility: "visible|hidden|collapse",
        "white-space": "normal|pre|nowrap|pre-wrap|pre-line",
        widows: "<integer>",
        width: "[<length>|<percentage>]&&[border-box|content-box]?|available|min-content|max-content|fit-content|auto",
        "will-change": "auto|<animateable-feature>#",
        "word-break": "normal|break-all|keep-all|break-word",
        "word-spacing": "normal|<length-percentage>",
        "word-wrap": "normal|break-word",
        "writing-mode": "horizontal-tb|vertical-rl|vertical-lr|sideways-rl|sideways-lr|<svg-writing-mode>",
        "z-index": "auto|<integer>",
        zoom: "normal|reset|<number>|<percentage>",
        "-moz-background-clip": "padding|border",
        "-moz-border-radius-bottomleft": "<'border-bottom-left-radius'>",
        "-moz-border-radius-bottomright": "<'border-bottom-right-radius'>",
        "-moz-border-radius-topleft": "<'border-top-left-radius'>",
        "-moz-border-radius-topright": "<'border-bottom-right-radius'>",
        "-moz-control-character-visibility": "visible|hidden",
        "-moz-osx-font-smoothing": "auto|grayscale",
        "-moz-user-select": "none|text|all|-moz-none",
        "-ms-flex-align": "start|end|center|baseline|stretch",
        "-ms-flex-item-align": "auto|start|end|center|baseline|stretch",
        "-ms-flex-line-pack": "start|end|center|justify|distribute|stretch",
        "-ms-flex-negative": "<'flex-shrink'>",
        "-ms-flex-pack": "start|end|center|justify|distribute",
        "-ms-flex-order": "<integer>",
        "-ms-flex-positive": "<'flex-grow'>",
        "-ms-flex-preferred-size": "<'flex-basis'>",
        "-ms-interpolation-mode": "nearest-neighbor|bicubic",
        "-ms-grid-column-align": "start|end|center|stretch",
        "-ms-grid-columns": "<track-list-v0>",
        "-ms-grid-row-align": "start|end|center|stretch",
        "-ms-grid-rows": "<track-list-v0>",
        "-ms-hyphenate-limit-last": "none|always|column|page|spread",
        "-webkit-background-clip": "[<box>|border|padding|content|text]#",
        "-webkit-column-break-after": "always|auto|avoid",
        "-webkit-column-break-before": "always|auto|avoid",
        "-webkit-column-break-inside": "always|auto|avoid",
        "-webkit-font-smoothing": "auto|none|antialiased|subpixel-antialiased",
        "-webkit-mask-box-image": "[<url>|<gradient>|none] [<length-percentage>{4} <-webkit-mask-box-repeat>{2}]?",
        "-webkit-print-color-adjust": "economy|exact",
        "-webkit-text-security": "none|circle|disc|square",
        "-webkit-user-drag": "none|element|auto",
        "-webkit-user-select": "auto|none|text|all",
        "alignment-baseline": "auto|baseline|before-edge|text-before-edge|middle|central|after-edge|text-after-edge|ideographic|alphabetic|hanging|mathematical",
        "baseline-shift": "baseline|sub|super|<svg-length>",
        behavior: "<url>+",
        "clip-rule": "nonzero|evenodd",
        cue: "<'cue-before'> <'cue-after'>?",
        "cue-after": "<url> <decibel>?|none",
        "cue-before": "<url> <decibel>?|none",
        "dominant-baseline": "auto|use-script|no-change|reset-size|ideographic|alphabetic|hanging|mathematical|central|middle|text-after-edge|text-before-edge",
        fill: "<paint>",
        "fill-opacity": "<number-zero-one>",
        "fill-rule": "nonzero|evenodd",
        "glyph-orientation-horizontal": "<angle>",
        "glyph-orientation-vertical": "<angle>",
        kerning: "auto|<svg-length>",
        marker: "none|<url>",
        "marker-end": "none|<url>",
        "marker-mid": "none|<url>",
        "marker-start": "none|<url>",
        pause: "<'pause-before'> <'pause-after'>?",
        "pause-after": "<time>|none|x-weak|weak|medium|strong|x-strong",
        "pause-before": "<time>|none|x-weak|weak|medium|strong|x-strong",
        rest: "<'rest-before'> <'rest-after'>?",
        "rest-after": "<time>|none|x-weak|weak|medium|strong|x-strong",
        "rest-before": "<time>|none|x-weak|weak|medium|strong|x-strong",
        "shape-rendering": "auto|optimizeSpeed|crispEdges|geometricPrecision",
        src: "[<url> [format( <string># )]?|local( <family-name> )]#",
        speak: "auto|none|normal",
        "speak-as": "normal|spell-out||digits||[literal-punctuation|no-punctuation]",
        stroke: "<paint>",
        "stroke-dasharray": "none|[<svg-length>+]#",
        "stroke-dashoffset": "<svg-length>",
        "stroke-linecap": "butt|round|square",
        "stroke-linejoin": "miter|round|bevel",
        "stroke-miterlimit": "<number-one-or-greater>",
        "stroke-opacity": "<number-zero-one>",
        "stroke-width": "<svg-length>",
        "text-anchor": "start|middle|end",
        "unicode-range": "<urange>#",
        "voice-balance": "<number>|left|center|right|leftwards|rightwards",
        "voice-duration": "auto|<time>",
        "voice-family": "[[<family-name>|<generic-voice>] ,]* [<family-name>|<generic-voice>]|preserve",
        "voice-pitch": "<frequency>&&absolute|[[x-low|low|medium|high|x-high]||[<frequency>|<semitones>|<percentage>]]",
        "voice-range": "<frequency>&&absolute|[[x-low|low|medium|high|x-high]||[<frequency>|<semitones>|<percentage>]]",
        "voice-rate": "[normal|x-slow|slow|medium|fast|x-fast]||<percentage>",
        "voice-stress": "normal|strong|moderate|none|reduced",
        "voice-volume": "silent|[[x-soft|soft|medium|loud|x-loud]||<decibel>]"
    };
    var defaultSyntax = {
        generic: generic$1,
        types: types,
        properties: properties$1
    };

    var defaultSyntax$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        generic: generic$1,
        types: types,
        properties: properties$1,
        'default': defaultSyntax
    });

    var cmpChar$3 = tokenizer.cmpChar;
    var isDigit$4 = tokenizer.isDigit;
    var TYPE$9 = tokenizer.TYPE;

    var WHITESPACE$4 = TYPE$9.WhiteSpace;
    var COMMENT$3 = TYPE$9.Comment;
    var IDENT$3 = TYPE$9.Ident;
    var NUMBER$3 = TYPE$9.Number;
    var DIMENSION$2 = TYPE$9.Dimension;
    var PLUSSIGN$3 = 0x002B;    // U+002B PLUS SIGN (+)
    var HYPHENMINUS$3 = 0x002D; // U+002D HYPHEN-MINUS (-)
    var N$4 = 0x006E;           // U+006E LATIN SMALL LETTER N (n)
    var DISALLOW_SIGN$1 = true;
    var ALLOW_SIGN$1 = false;

    function checkInteger$1(offset, disallowSign) {
        var pos = this.scanner.tokenStart + offset;
        var code = this.scanner.source.charCodeAt(pos);

        if (code === PLUSSIGN$3 || code === HYPHENMINUS$3) {
            if (disallowSign) {
                this.error('Number sign is not allowed');
            }
            pos++;
        }

        for (; pos < this.scanner.tokenEnd; pos++) {
            if (!isDigit$4(this.scanner.source.charCodeAt(pos))) {
                this.error('Integer is expected', pos);
            }
        }
    }

    function checkTokenIsInteger(disallowSign) {
        return checkInteger$1.call(this, 0, disallowSign);
    }

    function expectCharCode(offset, code) {
        if (!cmpChar$3(this.scanner.source, this.scanner.tokenStart + offset, code)) {
            var msg = '';

            switch (code) {
                case N$4:
                    msg = 'N is expected';
                    break;
                case HYPHENMINUS$3:
                    msg = 'HyphenMinus is expected';
                    break;
            }

            this.error(msg, this.scanner.tokenStart + offset);
        }
    }

    // ... <signed-integer>
    // ... ['+' | '-'] <signless-integer>
    function consumeB$1() {
        var offset = 0;
        var sign = 0;
        var type = this.scanner.tokenType;

        while (type === WHITESPACE$4 || type === COMMENT$3) {
            type = this.scanner.lookupType(++offset);
        }

        if (type !== NUMBER$3) {
            if (this.scanner.isDelim(PLUSSIGN$3, offset) ||
                this.scanner.isDelim(HYPHENMINUS$3, offset)) {
                sign = this.scanner.isDelim(PLUSSIGN$3, offset) ? PLUSSIGN$3 : HYPHENMINUS$3;

                do {
                    type = this.scanner.lookupType(++offset);
                } while (type === WHITESPACE$4 || type === COMMENT$3);

                if (type !== NUMBER$3) {
                    this.scanner.skip(offset);
                    checkTokenIsInteger.call(this, DISALLOW_SIGN$1);
                }
            } else {
                return null;
            }
        }

        if (offset > 0) {
            this.scanner.skip(offset);
        }

        if (sign === 0) {
            type = this.scanner.source.charCodeAt(this.scanner.tokenStart);
            if (type !== PLUSSIGN$3 && type !== HYPHENMINUS$3) {
                this.error('Number sign is expected');
            }
        }

        checkTokenIsInteger.call(this, sign !== 0);
        return sign === HYPHENMINUS$3 ? '-' + this.consume(NUMBER$3) : this.consume(NUMBER$3);
    }

    // An+B microsyntax https://www.w3.org/TR/css-syntax-3/#anb
    var AnPlusB = {
        name: 'AnPlusB',
        structure: {
            a: [String, null],
            b: [String, null]
        },
        parse: function() {
            /* eslint-disable brace-style*/
            var start = this.scanner.tokenStart;
            var a = null;
            var b = null;

            // <integer>
            if (this.scanner.tokenType === NUMBER$3) {
                checkTokenIsInteger.call(this, ALLOW_SIGN$1);
                b = this.consume(NUMBER$3);
            }

                // -n
                // -n <signed-integer>
                // -n ['+' | '-'] <signless-integer>
                // -n- <signless-integer>
            // <dashndashdigit-ident>
            else if (this.scanner.tokenType === IDENT$3 && cmpChar$3(this.scanner.source, this.scanner.tokenStart, HYPHENMINUS$3)) {
                a = '-1';

                expectCharCode.call(this, 1, N$4);

                switch (this.scanner.getTokenLength()) {
                    // -n
                    // -n <signed-integer>
                    // -n ['+' | '-'] <signless-integer>
                    case 2:
                        this.scanner.next();
                        b = consumeB$1.call(this);
                        break;

                    // -n- <signless-integer>
                    case 3:
                        expectCharCode.call(this, 2, HYPHENMINUS$3);

                        this.scanner.next();
                        this.scanner.skipSC();

                        checkTokenIsInteger.call(this, DISALLOW_SIGN$1);

                        b = '-' + this.consume(NUMBER$3);
                        break;

                    // <dashndashdigit-ident>
                    default:
                        expectCharCode.call(this, 2, HYPHENMINUS$3);
                        checkInteger$1.call(this, 3, DISALLOW_SIGN$1);
                        this.scanner.next();

                        b = this.scanner.substrToCursor(start + 2);
                }
            }

                // '+'? n
                // '+'? n <signed-integer>
                // '+'? n ['+' | '-'] <signless-integer>
                // '+'? n- <signless-integer>
            // '+'? <ndashdigit-ident>
            else if (this.scanner.tokenType === IDENT$3 || (this.scanner.isDelim(PLUSSIGN$3) && this.scanner.lookupType(1) === IDENT$3)) {
                var sign = 0;
                a = '1';

                // just ignore a plus
                if (this.scanner.isDelim(PLUSSIGN$3)) {
                    sign = 1;
                    this.scanner.next();
                }

                expectCharCode.call(this, 0, N$4);

                switch (this.scanner.getTokenLength()) {
                    // '+'? n
                    // '+'? n <signed-integer>
                    // '+'? n ['+' | '-'] <signless-integer>
                    case 1:
                        this.scanner.next();
                        b = consumeB$1.call(this);
                        break;

                    // '+'? n- <signless-integer>
                    case 2:
                        expectCharCode.call(this, 1, HYPHENMINUS$3);

                        this.scanner.next();
                        this.scanner.skipSC();

                        checkTokenIsInteger.call(this, DISALLOW_SIGN$1);

                        b = '-' + this.consume(NUMBER$3);
                        break;

                    // '+'? <ndashdigit-ident>
                    default:
                        expectCharCode.call(this, 1, HYPHENMINUS$3);
                        checkInteger$1.call(this, 2, DISALLOW_SIGN$1);
                        this.scanner.next();

                        b = this.scanner.substrToCursor(start + sign + 1);
                }
            }

                // <ndashdigit-dimension>
                // <ndash-dimension> <signless-integer>
                // <n-dimension>
                // <n-dimension> <signed-integer>
            // <n-dimension> ['+' | '-'] <signless-integer>
            else if (this.scanner.tokenType === DIMENSION$2) {
                var code = this.scanner.source.charCodeAt(this.scanner.tokenStart);
                var sign = code === PLUSSIGN$3 || code === HYPHENMINUS$3;

                for (var i = this.scanner.tokenStart + sign; i < this.scanner.tokenEnd; i++) {
                    if (!isDigit$4(this.scanner.source.charCodeAt(i))) {
                        break;
                    }
                }

                if (i === this.scanner.tokenStart + sign) {
                    this.error('Integer is expected', this.scanner.tokenStart + sign);
                }

                expectCharCode.call(this, i - this.scanner.tokenStart, N$4);
                a = this.scanner.source.substring(start, i);

                // <n-dimension>
                // <n-dimension> <signed-integer>
                // <n-dimension> ['+' | '-'] <signless-integer>
                if (i + 1 === this.scanner.tokenEnd) {
                    this.scanner.next();
                    b = consumeB$1.call(this);
                } else {
                    expectCharCode.call(this, i - this.scanner.tokenStart + 1, HYPHENMINUS$3);

                    // <ndash-dimension> <signless-integer>
                    if (i + 2 === this.scanner.tokenEnd) {
                        this.scanner.next();
                        this.scanner.skipSC();
                        checkTokenIsInteger.call(this, DISALLOW_SIGN$1);
                        b = '-' + this.consume(NUMBER$3);
                    }
                    // <ndashdigit-dimension>
                    else {
                        checkInteger$1.call(this, i - this.scanner.tokenStart + 2, DISALLOW_SIGN$1);
                        this.scanner.next();
                        b = this.scanner.substrToCursor(i + 1);
                    }
                }
            } else {
                this.error();
            }

            if (a !== null && a.charCodeAt(0) === PLUSSIGN$3) {
                a = a.substr(1);
            }

            if (b !== null && b.charCodeAt(0) === PLUSSIGN$3) {
                b = b.substr(1);
            }

            return {
                type: 'AnPlusB',
                loc: this.getLocation(start, this.scanner.tokenStart),
                a: a,
                b: b
            };
        },
        generate: function(node) {
            var a = node.a !== null && node.a !== undefined;
            var b = node.b !== null && node.b !== undefined;

            if (a) {
                this.chunk(
                    node.a === '+1' ? '+n' : // eslint-disable-line operator-linebreak, indent
                        node.a ===  '1' ?  'n' : // eslint-disable-line operator-linebreak, indent
                            node.a === '-1' ? '-n' : // eslint-disable-line operator-linebreak, indent
                                node.a + 'n'             // eslint-disable-line operator-linebreak, indent
                );

                if (b) {
                    b = String(node.b);
                    if (b.charAt(0) === '-' || b.charAt(0) === '+') {
                        this.chunk(b.charAt(0));
                        this.chunk(b.substr(1));
                    } else {
                        this.chunk('+');
                        this.chunk(b);
                    }
                }
            } else {
                this.chunk(String(node.b));
            }
        }
    };

    var TYPE$a = tokenizer.TYPE;

    var WhiteSpace = TYPE$a.WhiteSpace;
    var Semicolon = TYPE$a.Semicolon;
    var LeftCurlyBracket = TYPE$a.LeftCurlyBracket;
    var Delim = TYPE$a.Delim;
    var EXCLAMATIONMARK$1 = 0x0021; // U+0021 EXCLAMATION MARK (!)

    function getOffsetExcludeWS() {
        if (this.scanner.tokenIndex > 0) {
            if (this.scanner.lookupType(-1) === WhiteSpace) {
                return this.scanner.tokenIndex > 1
                    ? this.scanner.getTokenStart(this.scanner.tokenIndex - 1)
                    : this.scanner.firstCharOffset;
            }
        }

        return this.scanner.tokenStart;
    }

    // 0, 0, false
    function balanceEnd() {
        return 0;
    }

    // LEFTCURLYBRACKET, 0, false
    function leftCurlyBracket(tokenType) {
        return tokenType === LeftCurlyBracket ? 1 : 0;
    }

    // LEFTCURLYBRACKET, SEMICOLON, false
    function leftCurlyBracketOrSemicolon(tokenType) {
        return tokenType === LeftCurlyBracket || tokenType === Semicolon ? 1 : 0;
    }

    // EXCLAMATIONMARK, SEMICOLON, false
    function exclamationMarkOrSemicolon(tokenType, source, offset) {
        if (tokenType === Delim && source.charCodeAt(offset) === EXCLAMATIONMARK$1) {
            return 1;
        }

        return tokenType === Semicolon ? 1 : 0;
    }

    // 0, SEMICOLON, true
    function semicolonIncluded(tokenType) {
        return tokenType === Semicolon ? 2 : 0;
    }

    var Raw = {
        name: 'Raw',
        structure: {
            value: String
        },
        parse: function(startToken, mode, excludeWhiteSpace) {
            var startOffset = this.scanner.getTokenStart(startToken);
            var endOffset;

            this.scanner.skip(
                this.scanner.getRawLength(startToken, mode || balanceEnd)
            );

            if (excludeWhiteSpace && this.scanner.tokenStart > startOffset) {
                endOffset = getOffsetExcludeWS.call(this);
            } else {
                endOffset = this.scanner.tokenStart;
            }

            return {
                type: 'Raw',
                loc: this.getLocation(startOffset, endOffset),
                value: this.scanner.source.substring(startOffset, endOffset)
            };
        },
        generate: function(node) {
            this.chunk(node.value);
        },

        mode: {
            default: balanceEnd,
            leftCurlyBracket: leftCurlyBracket,
            leftCurlyBracketOrSemicolon: leftCurlyBracketOrSemicolon,
            exclamationMarkOrSemicolon: exclamationMarkOrSemicolon,
            semicolonIncluded: semicolonIncluded
        }
    };

    var TYPE$b = tokenizer.TYPE;
    var rawMode = Raw.mode;

    var ATKEYWORD = TYPE$b.AtKeyword;
    var SEMICOLON = TYPE$b.Semicolon;
    var LEFTCURLYBRACKET$1 = TYPE$b.LeftCurlyBracket;
    var RIGHTCURLYBRACKET$1 = TYPE$b.RightCurlyBracket;

    function consumeRaw(startToken) {
        return this.Raw(startToken, rawMode.leftCurlyBracketOrSemicolon, true);
    }

    function isDeclarationBlockAtrule() {
        for (var offset = 1, type; type = this.scanner.lookupType(offset); offset++) {
            if (type === RIGHTCURLYBRACKET$1) {
                return true;
            }

            if (type === LEFTCURLYBRACKET$1 ||
                type === ATKEYWORD) {
                return false;
            }
        }

        return false;
    }

    var Atrule = {
        name: 'Atrule',
        structure: {
            name: String,
            prelude: ['AtrulePrelude', 'Raw', null],
            block: ['Block', null]
        },
        parse: function() {
            var start = this.scanner.tokenStart;
            var name;
            var nameLowerCase;
            var prelude = null;
            var block = null;

            this.eat(ATKEYWORD);

            name = this.scanner.substrToCursor(start + 1);
            nameLowerCase = name.toLowerCase();
            this.scanner.skipSC();

            // parse prelude
            if (this.scanner.eof === false &&
                this.scanner.tokenType !== LEFTCURLYBRACKET$1 &&
                this.scanner.tokenType !== SEMICOLON) {
                if (this.parseAtrulePrelude) {
                    prelude = this.parseWithFallback(this.AtrulePrelude.bind(this, name), consumeRaw);

                    // turn empty AtrulePrelude into null
                    if (prelude.type === 'AtrulePrelude' && prelude.children.head === null) {
                        prelude = null;
                    }
                } else {
                    prelude = consumeRaw.call(this, this.scanner.tokenIndex);
                }

                this.scanner.skipSC();
            }

            switch (this.scanner.tokenType) {
                case SEMICOLON:
                    this.scanner.next();
                    break;

                case LEFTCURLYBRACKET$1:
                    if (this.atrule.hasOwnProperty(nameLowerCase) &&
                        typeof this.atrule[nameLowerCase].block === 'function') {
                        block = this.atrule[nameLowerCase].block.call(this);
                    } else {
                        // TODO: should consume block content as Raw?
                        block = this.Block(isDeclarationBlockAtrule.call(this));
                    }

                    break;
            }

            return {
                type: 'Atrule',
                loc: this.getLocation(start, this.scanner.tokenStart),
                name: name,
                prelude: prelude,
                block: block
            };
        },
        generate: function(node) {
            this.chunk('@');
            this.chunk(node.name);

            if (node.prelude !== null) {
                this.chunk(' ');
                this.node(node.prelude);
            }

            if (node.block) {
                this.node(node.block);
            } else {
                this.chunk(';');
            }
        },
        walkContext: 'atrule'
    };

    var TYPE$c = tokenizer.TYPE;

    var SEMICOLON$1 = TYPE$c.Semicolon;
    var LEFTCURLYBRACKET$2 = TYPE$c.LeftCurlyBracket;

    var AtrulePrelude = {
        name: 'AtrulePrelude',
        structure: {
            children: [[]]
        },
        parse: function(name) {
            var children = null;

            if (name !== null) {
                name = name.toLowerCase();
            }

            this.scanner.skipSC();

            if (this.atrule.hasOwnProperty(name) &&
                typeof this.atrule[name].prelude === 'function') {
                // custom consumer
                children = this.atrule[name].prelude.call(this);
            } else {
                // default consumer
                children = this.readSequence(this.scope.AtrulePrelude);
            }

            this.scanner.skipSC();

            if (this.scanner.eof !== true &&
                this.scanner.tokenType !== LEFTCURLYBRACKET$2 &&
                this.scanner.tokenType !== SEMICOLON$1) {
                this.error('Semicolon or block is expected');
            }

            if (children === null) {
                children = this.createList();
            }

            return {
                type: 'AtrulePrelude',
                loc: this.getLocationFromList(children),
                children: children
            };
        },
        generate: function(node) {
            this.children(node);
        },
        walkContext: 'atrulePrelude'
    };

    var TYPE$d = tokenizer.TYPE;

    var IDENT$4 = TYPE$d.Ident;
    var STRING = TYPE$d.String;
    var COLON = TYPE$d.Colon;
    var LEFTSQUAREBRACKET$1 = TYPE$d.LeftSquareBracket;
    var RIGHTSQUAREBRACKET$1 = TYPE$d.RightSquareBracket;
    var DOLLARSIGN = 0x0024;       // U+0024 DOLLAR SIGN ($)
    var ASTERISK$1 = 0x002A;         // U+002A ASTERISK (*)
    var EQUALSSIGN = 0x003D;       // U+003D EQUALS SIGN (=)
    var CIRCUMFLEXACCENT = 0x005E; // U+005E (^)
    var VERTICALLINE$1 = 0x007C;     // U+007C VERTICAL LINE (|)
    var TILDE = 0x007E;            // U+007E TILDE (~)

    function getAttributeName() {
        if (this.scanner.eof) {
            this.error('Unexpected end of input');
        }

        var start = this.scanner.tokenStart;
        var expectIdent = false;
        var checkColon = true;

        if (this.scanner.isDelim(ASTERISK$1)) {
            expectIdent = true;
            checkColon = false;
            this.scanner.next();
        } else if (!this.scanner.isDelim(VERTICALLINE$1)) {
            this.eat(IDENT$4);
        }

        if (this.scanner.isDelim(VERTICALLINE$1)) {
            if (this.scanner.source.charCodeAt(this.scanner.tokenStart + 1) !== EQUALSSIGN) {
                this.scanner.next();
                this.eat(IDENT$4);
            } else if (expectIdent) {
                this.error('Identifier is expected', this.scanner.tokenEnd);
            }
        } else if (expectIdent) {
            this.error('Vertical line is expected');
        }

        if (checkColon && this.scanner.tokenType === COLON) {
            this.scanner.next();
            this.eat(IDENT$4);
        }

        return {
            type: 'Identifier',
            loc: this.getLocation(start, this.scanner.tokenStart),
            name: this.scanner.substrToCursor(start)
        };
    }

    function getOperator() {
        var start = this.scanner.tokenStart;
        var code = this.scanner.source.charCodeAt(start);

        if (code !== EQUALSSIGN &&        // =
            code !== TILDE &&             // ~=
            code !== CIRCUMFLEXACCENT &&  // ^=
            code !== DOLLARSIGN &&        // $=
            code !== ASTERISK$1 &&          // *=
            code !== VERTICALLINE$1         // |=
        ) {
            this.error('Attribute selector (=, ~=, ^=, $=, *=, |=) is expected');
        }

        this.scanner.next();

        if (code !== EQUALSSIGN) {
            if (!this.scanner.isDelim(EQUALSSIGN)) {
                this.error('Equal sign is expected');
            }

            this.scanner.next();
        }

        return this.scanner.substrToCursor(start);
    }

    // '[' <wq-name> ']'
    // '[' <wq-name> <attr-matcher> [ <string-token> | <ident-token> ] <attr-modifier>? ']'
    var AttributeSelector = {
        name: 'AttributeSelector',
        structure: {
            name: 'Identifier',
            matcher: [String, null],
            value: ['String', 'Identifier', null],
            flags: [String, null]
        },
        parse: function() {
            var start = this.scanner.tokenStart;
            var name;
            var matcher = null;
            var value = null;
            var flags = null;

            this.eat(LEFTSQUAREBRACKET$1);
            this.scanner.skipSC();

            name = getAttributeName.call(this);
            this.scanner.skipSC();

            if (this.scanner.tokenType !== RIGHTSQUAREBRACKET$1) {
                // avoid case `[name i]`
                if (this.scanner.tokenType !== IDENT$4) {
                    matcher = getOperator.call(this);

                    this.scanner.skipSC();

                    value = this.scanner.tokenType === STRING
                        ? this.String()
                        : this.Identifier();

                    this.scanner.skipSC();
                }

                // attribute flags
                if (this.scanner.tokenType === IDENT$4) {
                    flags = this.scanner.getTokenValue();
                    this.scanner.next();

                    this.scanner.skipSC();
                }
            }

            this.eat(RIGHTSQUAREBRACKET$1);

            return {
                type: 'AttributeSelector',
                loc: this.getLocation(start, this.scanner.tokenStart),
                name: name,
                matcher: matcher,
                value: value,
                flags: flags
            };
        },
        generate: function(node) {
            var flagsPrefix = ' ';

            this.chunk('[');
            this.node(node.name);

            if (node.matcher !== null) {
                this.chunk(node.matcher);

                if (node.value !== null) {
                    this.node(node.value);

                    // space between string and flags is not required
                    if (node.value.type === 'String') {
                        flagsPrefix = '';
                    }
                }
            }

            if (node.flags !== null) {
                this.chunk(flagsPrefix);
                this.chunk(node.flags);
            }

            this.chunk(']');
        }
    };

    var TYPE$e = tokenizer.TYPE;
    var rawMode$1 = Raw.mode;

    var WHITESPACE$5 = TYPE$e.WhiteSpace;
    var COMMENT$4 = TYPE$e.Comment;
    var SEMICOLON$2 = TYPE$e.Semicolon;
    var ATKEYWORD$1 = TYPE$e.AtKeyword;
    var LEFTCURLYBRACKET$3 = TYPE$e.LeftCurlyBracket;
    var RIGHTCURLYBRACKET$2 = TYPE$e.RightCurlyBracket;

    function consumeRaw$1(startToken) {
        return this.Raw(startToken, null, true);
    }
    function consumeRule() {
        return this.parseWithFallback(this.Rule, consumeRaw$1);
    }
    function consumeRawDeclaration(startToken) {
        return this.Raw(startToken, rawMode$1.semicolonIncluded, true);
    }
    function consumeDeclaration() {
        if (this.scanner.tokenType === SEMICOLON$2) {
            return consumeRawDeclaration.call(this, this.scanner.tokenIndex);
        }

        var node = this.parseWithFallback(this.Declaration, consumeRawDeclaration);

        if (this.scanner.tokenType === SEMICOLON$2) {
            this.scanner.next();
        }

        return node;
    }

    var Block = {
        name: 'Block',
        structure: {
            children: [[
                'Atrule',
                'Rule',
                'Declaration'
            ]]
        },
        parse: function(isDeclaration) {
            var consumer = isDeclaration ? consumeDeclaration : consumeRule;

            var start = this.scanner.tokenStart;
            var children = this.createList();

            this.eat(LEFTCURLYBRACKET$3);

            scan:
                while (!this.scanner.eof) {
                    switch (this.scanner.tokenType) {
                        case RIGHTCURLYBRACKET$2:
                            break scan;

                        case WHITESPACE$5:
                        case COMMENT$4:
                            this.scanner.next();
                            break;

                        case ATKEYWORD$1:
                            children.push(this.parseWithFallback(this.Atrule, consumeRaw$1));
                            break;

                        default:
                            children.push(consumer.call(this));
                    }
                }

            if (!this.scanner.eof) {
                this.eat(RIGHTCURLYBRACKET$2);
            }

            return {
                type: 'Block',
                loc: this.getLocation(start, this.scanner.tokenStart),
                children: children
            };
        },
        generate: function(node) {
            this.chunk('{');
            this.children(node, function(prev) {
                if (prev.type === 'Declaration') {
                    this.chunk(';');
                }
            });
            this.chunk('}');
        },
        walkContext: 'block'
    };

    var TYPE$f = tokenizer.TYPE;

    var LEFTSQUAREBRACKET$2 = TYPE$f.LeftSquareBracket;
    var RIGHTSQUAREBRACKET$2 = TYPE$f.RightSquareBracket;

    var Brackets = {
        name: 'Brackets',
        structure: {
            children: [[]]
        },
        parse: function(readSequence, recognizer) {
            var start = this.scanner.tokenStart;
            var children = null;

            this.eat(LEFTSQUAREBRACKET$2);

            children = readSequence.call(this, recognizer);

            if (!this.scanner.eof) {
                this.eat(RIGHTSQUAREBRACKET$2);
            }

            return {
                type: 'Brackets',
                loc: this.getLocation(start, this.scanner.tokenStart),
                children: children
            };
        },
        generate: function(node) {
            this.chunk('[');
            this.children(node);
            this.chunk(']');
        }
    };

    var CDC = tokenizer.TYPE.CDC;

    var CDC_1 = {
        name: 'CDC',
        structure: [],
        parse: function() {
            var start = this.scanner.tokenStart;

            this.eat(CDC); // -->

            return {
                type: 'CDC',
                loc: this.getLocation(start, this.scanner.tokenStart)
            };
        },
        generate: function() {
            this.chunk('-->');
        }
    };

    var CDO = tokenizer.TYPE.CDO;

    var CDO_1 = {
        name: 'CDO',
        structure: [],
        parse: function() {
            var start = this.scanner.tokenStart;

            this.eat(CDO); // <!--

            return {
                type: 'CDO',
                loc: this.getLocation(start, this.scanner.tokenStart)
            };
        },
        generate: function() {
            this.chunk('<!--');
        }
    };

    var TYPE$g = tokenizer.TYPE;

    var IDENT$5 = TYPE$g.Ident;
    var FULLSTOP = 0x002E; // U+002E FULL STOP (.)

    // '.' ident
    var ClassSelector = {
        name: 'ClassSelector',
        structure: {
            name: String
        },
        parse: function() {
            if (!this.scanner.isDelim(FULLSTOP)) {
                this.error('Full stop is expected');
            }

            this.scanner.next();

            return {
                type: 'ClassSelector',
                loc: this.getLocation(this.scanner.tokenStart - 1, this.scanner.tokenEnd),
                name: this.consume(IDENT$5)
            };
        },
        generate: function(node) {
            this.chunk('.');
            this.chunk(node.name);
        }
    };

    var TYPE$h = tokenizer.TYPE;

    var IDENT$6 = TYPE$h.Ident;
    var PLUSSIGN$4 = 0x002B;        // U+002B PLUS SIGN (+)
    var SOLIDUS = 0x002F;         // U+002F SOLIDUS (/)
    var GREATERTHANSIGN$1 = 0x003E; // U+003E GREATER-THAN SIGN (>)
    var TILDE$1 = 0x007E;           // U+007E TILDE (~)

    // + | > | ~ | /deep/
    var Combinator = {
        name: 'Combinator',
        structure: {
            name: String
        },
        parse: function() {
            var start = this.scanner.tokenStart;
            var code = this.scanner.source.charCodeAt(this.scanner.tokenStart);

            switch (code) {
                case GREATERTHANSIGN$1:
                case PLUSSIGN$4:
                case TILDE$1:
                    this.scanner.next();
                    break;

                case SOLIDUS:
                    this.scanner.next();

                    if (this.scanner.tokenType !== IDENT$6 || this.scanner.lookupValue(0, 'deep') === false) {
                        this.error('Identifier `deep` is expected');
                    }

                    this.scanner.next();

                    if (!this.scanner.isDelim(SOLIDUS)) {
                        this.error('Solidus is expected');
                    }

                    this.scanner.next();
                    break;

                default:
                    this.error('Combinator is expected');
            }

            return {
                type: 'Combinator',
                loc: this.getLocation(start, this.scanner.tokenStart),
                name: this.scanner.substrToCursor(start)
            };
        },
        generate: function(node) {
            this.chunk(node.name);
        }
    };

    var TYPE$i = tokenizer.TYPE;

    var COMMENT$5 = TYPE$i.Comment;
    var ASTERISK$2 = 0x002A;        // U+002A ASTERISK (*)
    var SOLIDUS$1 = 0x002F;         // U+002F SOLIDUS (/)

    // '/*' .* '*/'
    var Comment = {
        name: 'Comment',
        structure: {
            value: String
        },
        parse: function() {
            var start = this.scanner.tokenStart;
            var end = this.scanner.tokenEnd;

            this.eat(COMMENT$5);

            if ((end - start + 2) >= 2 &&
                this.scanner.source.charCodeAt(end - 2) === ASTERISK$2 &&
                this.scanner.source.charCodeAt(end - 1) === SOLIDUS$1) {
                end -= 2;
            }

            return {
                type: 'Comment',
                loc: this.getLocation(start, this.scanner.tokenStart),
                value: this.scanner.source.substring(start + 2, end)
            };
        },
        generate: function(node) {
            this.chunk('/*');
            this.chunk(node.value);
            this.chunk('*/');
        }
    };

    var isCustomProperty$1 = names.isCustomProperty;
    var TYPE$j = tokenizer.TYPE;
    var rawMode$2 = Raw.mode;

    var IDENT$7 = TYPE$j.Ident;
    var HASH$1 = TYPE$j.Hash;
    var COLON$1 = TYPE$j.Colon;
    var SEMICOLON$3 = TYPE$j.Semicolon;
    var DELIM$2 = TYPE$j.Delim;
    var EXCLAMATIONMARK$2 = 0x0021; // U+0021 EXCLAMATION MARK (!)
    var NUMBERSIGN$2 = 0x0023;      // U+0023 NUMBER SIGN (#)
    var DOLLARSIGN$1 = 0x0024;      // U+0024 DOLLAR SIGN ($)
    var AMPERSAND$1 = 0x0026;       // U+0026 ANPERSAND (&)
    var ASTERISK$3 = 0x002A;        // U+002A ASTERISK (*)
    var PLUSSIGN$5 = 0x002B;        // U+002B PLUS SIGN (+)
    var SOLIDUS$2 = 0x002F;         // U+002F SOLIDUS (/)

    function consumeValueRaw(startToken) {
        return this.Raw(startToken, rawMode$2.exclamationMarkOrSemicolon, true);
    }

    function consumeCustomPropertyRaw(startToken) {
        return this.Raw(startToken, rawMode$2.exclamationMarkOrSemicolon, false);
    }

    function consumeValue() {
        var startValueToken = this.scanner.tokenIndex;
        var value = this.Value();

        if (value.type !== 'Raw' &&
            this.scanner.eof === false &&
            this.scanner.tokenType !== SEMICOLON$3 &&
            this.scanner.isDelim(EXCLAMATIONMARK$2) === false &&
            this.scanner.isBalanceEdge(startValueToken) === false) {
            this.error();
        }

        return value;
    }

    var Declaration = {
        name: 'Declaration',
        structure: {
            important: [Boolean, String],
            property: String,
            value: ['Value', 'Raw']
        },
        parse: function() {
            var start = this.scanner.tokenStart;
            var startToken = this.scanner.tokenIndex;
            var property = readProperty$1.call(this);
            var customProperty = isCustomProperty$1(property);
            var parseValue = customProperty ? this.parseCustomProperty : this.parseValue;
            var consumeRaw = customProperty ? consumeCustomPropertyRaw : consumeValueRaw;
            var important = false;
            var value;

            this.scanner.skipSC();
            this.eat(COLON$1);

            if (!customProperty) {
                this.scanner.skipSC();
            }

            if (parseValue) {
                value = this.parseWithFallback(consumeValue, consumeRaw);
            } else {
                value = consumeRaw.call(this, this.scanner.tokenIndex);
            }

            if (this.scanner.isDelim(EXCLAMATIONMARK$2)) {
                important = getImportant.call(this);
                this.scanner.skipSC();
            }

            // Do not include semicolon to range per spec
            // https://drafts.csswg.org/css-syntax/#declaration-diagram

            if (this.scanner.eof === false &&
                this.scanner.tokenType !== SEMICOLON$3 &&
                this.scanner.isBalanceEdge(startToken) === false) {
                this.error();
            }

            return {
                type: 'Declaration',
                loc: this.getLocation(start, this.scanner.tokenStart),
                important: important,
                property: property,
                value: value
            };
        },
        generate: function(node) {
            this.chunk(node.property);
            this.chunk(':');
            this.node(node.value);

            if (node.important) {
                this.chunk(node.important === true ? '!important' : '!' + node.important);
            }
        },
        walkContext: 'declaration'
    };

    function readProperty$1() {
        var start = this.scanner.tokenStart;

        // hacks
        if (this.scanner.tokenType === DELIM$2) {
            switch (this.scanner.source.charCodeAt(this.scanner.tokenStart)) {
                case ASTERISK$3:
                case DOLLARSIGN$1:
                case PLUSSIGN$5:
                case NUMBERSIGN$2:
                case AMPERSAND$1:
                    this.scanner.next();
                    break;

                // TODO: not sure we should support this hack
                case SOLIDUS$2:
                    this.scanner.next();
                    if (this.scanner.isDelim(SOLIDUS$2)) {
                        this.scanner.next();
                    }
                    break;
            }
        }

        if (this.scanner.tokenType === HASH$1) {
            this.eat(HASH$1);
        } else {
            this.eat(IDENT$7);
        }

        return this.scanner.substrToCursor(start);
    }

    // ! ws* important
    function getImportant() {
        this.eat(DELIM$2);
        this.scanner.skipSC();

        var important = this.consume(IDENT$7);

        // store original value in case it differ from `important`
        // for better original source restoring and hacks like `!ie` support
        return important === 'important' ? true : important;
    }

    var TYPE$k = tokenizer.TYPE;
    var rawMode$3 = Raw.mode;

    var WHITESPACE$6 = TYPE$k.WhiteSpace;
    var COMMENT$6 = TYPE$k.Comment;
    var SEMICOLON$4 = TYPE$k.Semicolon;

    function consumeRaw$2(startToken) {
        return this.Raw(startToken, rawMode$3.semicolonIncluded, true);
    }

    var DeclarationList = {
        name: 'DeclarationList',
        structure: {
            children: [[
                'Declaration'
            ]]
        },
        parse: function() {
            var children = this.createList();


            while (!this.scanner.eof) {
                switch (this.scanner.tokenType) {
                    case WHITESPACE$6:
                    case COMMENT$6:
                    case SEMICOLON$4:
                        this.scanner.next();
                        break;

                    default:
                        children.push(this.parseWithFallback(this.Declaration, consumeRaw$2));
                }
            }

            return {
                type: 'DeclarationList',
                loc: this.getLocationFromList(children),
                children: children
            };
        },
        generate: function(node) {
            this.children(node, function(prev) {
                if (prev.type === 'Declaration') {
                    this.chunk(';');
                }
            });
        }
    };

    var consumeNumber$3 = utils.consumeNumber;
    var TYPE$l = tokenizer.TYPE;

    var DIMENSION$3 = TYPE$l.Dimension;

    var Dimension = {
        name: 'Dimension',
        structure: {
            value: String,
            unit: String
        },
        parse: function() {
            var start = this.scanner.tokenStart;
            var numberEnd = consumeNumber$3(this.scanner.source, start);

            this.eat(DIMENSION$3);

            return {
                type: 'Dimension',
                loc: this.getLocation(start, this.scanner.tokenStart),
                value: this.scanner.source.substring(start, numberEnd),
                unit: this.scanner.source.substring(numberEnd, this.scanner.tokenStart)
            };
        },
        generate: function(node) {
            this.chunk(node.value);
            this.chunk(node.unit);
        }
    };

    var TYPE$m = tokenizer.TYPE;

    var RIGHTPARENTHESIS$2 = TYPE$m.RightParenthesis;

    // <function-token> <sequence> )
    var _Function = {
        name: 'Function',
        structure: {
            name: String,
            children: [[]]
        },
        parse: function(readSequence, recognizer) {
            var start = this.scanner.tokenStart;
            var name = this.consumeFunctionName();
            var nameLowerCase = name.toLowerCase();
            var children;

            children = recognizer.hasOwnProperty(nameLowerCase)
                ? recognizer[nameLowerCase].call(this, recognizer)
                : readSequence.call(this, recognizer);

            if (!this.scanner.eof) {
                this.eat(RIGHTPARENTHESIS$2);
            }

            return {
                type: 'Function',
                loc: this.getLocation(start, this.scanner.tokenStart),
                name: name,
                children: children
            };
        },
        generate: function(node) {
            this.chunk(node.name);
            this.chunk('(');
            this.children(node);
            this.chunk(')');
        },
        walkContext: 'function'
    };

    var TYPE$n = tokenizer.TYPE;

    var HASH$2 = TYPE$n.Hash;

    // '#' ident
    var HexColor = {
        name: 'HexColor',
        structure: {
            value: String
        },
        parse: function() {
            var start = this.scanner.tokenStart;

            this.eat(HASH$2);

            return {
                type: 'HexColor',
                loc: this.getLocation(start, this.scanner.tokenStart),
                value: this.scanner.substrToCursor(start + 1)
            };
        },
        generate: function(node) {
            this.chunk('#');
            this.chunk(node.value);
        }
    };

    var TYPE$o = tokenizer.TYPE;

    var IDENT$8 = TYPE$o.Ident;

    var Identifier = {
        name: 'Identifier',
        structure: {
            name: String
        },
        parse: function() {
            return {
                type: 'Identifier',
                loc: this.getLocation(this.scanner.tokenStart, this.scanner.tokenEnd),
                name: this.consume(IDENT$8)
            };
        },
        generate: function(node) {
            this.chunk(node.name);
        }
    };

    var TYPE$p = tokenizer.TYPE;

    var HASH$3 = TYPE$p.Hash;

    // <hash-token>
    var IdSelector = {
        name: 'IdSelector',
        structure: {
            name: String
        },
        parse: function() {
            var start = this.scanner.tokenStart;

            // TODO: check value is an ident
            this.eat(HASH$3);

            return {
                type: 'IdSelector',
                loc: this.getLocation(start, this.scanner.tokenStart),
                name: this.scanner.substrToCursor(start + 1)
            };
        },
        generate: function(node) {
            this.chunk('#');
            this.chunk(node.name);
        }
    };

    var TYPE$q = tokenizer.TYPE;

    var IDENT$9 = TYPE$q.Ident;
    var NUMBER$4 = TYPE$q.Number;
    var DIMENSION$4 = TYPE$q.Dimension;
    var LEFTPARENTHESIS$2 = TYPE$q.LeftParenthesis;
    var RIGHTPARENTHESIS$3 = TYPE$q.RightParenthesis;
    var COLON$2 = TYPE$q.Colon;
    var DELIM$3 = TYPE$q.Delim;

    var MediaFeature = {
        name: 'MediaFeature',
        structure: {
            name: String,
            value: ['Identifier', 'Number', 'Dimension', 'Ratio', null]
        },
        parse: function() {
            var start = this.scanner.tokenStart;
            var name;
            var value = null;

            this.eat(LEFTPARENTHESIS$2);
            this.scanner.skipSC();

            name = this.consume(IDENT$9);
            this.scanner.skipSC();

            if (this.scanner.tokenType !== RIGHTPARENTHESIS$3) {
                this.eat(COLON$2);
                this.scanner.skipSC();

                switch (this.scanner.tokenType) {
                    case NUMBER$4:
                        if (this.lookupNonWSType(1) === DELIM$3) {
                            value = this.Ratio();
                        } else {
                            value = this.Number();
                        }

                        break;

                    case DIMENSION$4:
                        value = this.Dimension();
                        break;

                    case IDENT$9:
                        value = this.Identifier();

                        break;

                    default:
                        this.error('Number, dimension, ratio or identifier is expected');
                }

                this.scanner.skipSC();
            }

            this.eat(RIGHTPARENTHESIS$3);

            return {
                type: 'MediaFeature',
                loc: this.getLocation(start, this.scanner.tokenStart),
                name: name,
                value: value
            };
        },
        generate: function(node) {
            this.chunk('(');
            this.chunk(node.name);
            if (node.value !== null) {
                this.chunk(':');
                this.node(node.value);
            }
            this.chunk(')');
        }
    };

    var TYPE$r = tokenizer.TYPE;

    var WHITESPACE$7 = TYPE$r.WhiteSpace;
    var COMMENT$7 = TYPE$r.Comment;
    var IDENT$a = TYPE$r.Ident;
    var LEFTPARENTHESIS$3 = TYPE$r.LeftParenthesis;

    var MediaQuery = {
        name: 'MediaQuery',
        structure: {
            children: [[
                'Identifier',
                'MediaFeature',
                'WhiteSpace'
            ]]
        },
        parse: function() {
            this.scanner.skipSC();

            var children = this.createList();
            var child = null;
            var space = null;

            scan:
                while (!this.scanner.eof) {
                    switch (this.scanner.tokenType) {
                        case COMMENT$7:
                            this.scanner.next();
                            continue;

                        case WHITESPACE$7:
                            space = this.WhiteSpace();
                            continue;

                        case IDENT$a:
                            child = this.Identifier();
                            break;

                        case LEFTPARENTHESIS$3:
                            child = this.MediaFeature();
                            break;

                        default:
                            break scan;
                    }

                    if (space !== null) {
                        children.push(space);
                        space = null;
                    }

                    children.push(child);
                }

            if (child === null) {
                this.error('Identifier or parenthesis is expected');
            }

            return {
                type: 'MediaQuery',
                loc: this.getLocationFromList(children),
                children: children
            };
        },
        generate: function(node) {
            this.children(node);
        }
    };

    var COMMA$1 = tokenizer.TYPE.Comma;

    var MediaQueryList = {
        name: 'MediaQueryList',
        structure: {
            children: [[
                'MediaQuery'
            ]]
        },
        parse: function(relative) {
            var children = this.createList();

            this.scanner.skipSC();

            while (!this.scanner.eof) {
                children.push(this.MediaQuery(relative));

                if (this.scanner.tokenType !== COMMA$1) {
                    break;
                }

                this.scanner.next();
            }

            return {
                type: 'MediaQueryList',
                loc: this.getLocationFromList(children),
                children: children
            };
        },
        generate: function(node) {
            this.children(node, function() {
                this.chunk(',');
            });
        }
    };

    var Nth = {
        name: 'Nth',
        structure: {
            nth: ['AnPlusB', 'Identifier'],
            selector: ['SelectorList', null]
        },
        parse: function(allowOfClause) {
            this.scanner.skipSC();

            var start = this.scanner.tokenStart;
            var end = start;
            var selector = null;
            var query;

            if (this.scanner.lookupValue(0, 'odd') || this.scanner.lookupValue(0, 'even')) {
                query = this.Identifier();
            } else {
                query = this.AnPlusB();
            }

            this.scanner.skipSC();

            if (allowOfClause && this.scanner.lookupValue(0, 'of')) {
                this.scanner.next();

                selector = this.SelectorList();

                if (this.needPositions) {
                    end = this.getLastListNode(selector.children).loc.end.offset;
                }
            } else {
                if (this.needPositions) {
                    end = query.loc.end.offset;
                }
            }

            return {
                type: 'Nth',
                loc: this.getLocation(start, end),
                nth: query,
                selector: selector
            };
        },
        generate: function(node) {
            this.node(node.nth);
            if (node.selector !== null) {
                this.chunk(' of ');
                this.node(node.selector);
            }
        }
    };

    var NUMBER$5 = tokenizer.TYPE.Number;

    var _Number = {
        name: 'Number',
        structure: {
            value: String
        },
        parse: function() {
            return {
                type: 'Number',
                loc: this.getLocation(this.scanner.tokenStart, this.scanner.tokenEnd),
                value: this.consume(NUMBER$5)
            };
        },
        generate: function(node) {
            this.chunk(node.value);
        }
    };

    // '/' | '*' | ',' | ':' | '+' | '-'
    var Operator = {
        name: 'Operator',
        structure: {
            value: String
        },
        parse: function() {
            var start = this.scanner.tokenStart;

            this.scanner.next();

            return {
                type: 'Operator',
                loc: this.getLocation(start, this.scanner.tokenStart),
                value: this.scanner.substrToCursor(start)
            };
        },
        generate: function(node) {
            this.chunk(node.value);
        }
    };

    var TYPE$s = tokenizer.TYPE;

    var LEFTPARENTHESIS$4 = TYPE$s.LeftParenthesis;
    var RIGHTPARENTHESIS$4 = TYPE$s.RightParenthesis;

    var Parentheses = {
        name: 'Parentheses',
        structure: {
            children: [[]]
        },
        parse: function(readSequence, recognizer) {
            var start = this.scanner.tokenStart;
            var children = null;

            this.eat(LEFTPARENTHESIS$4);

            children = readSequence.call(this, recognizer);

            if (!this.scanner.eof) {
                this.eat(RIGHTPARENTHESIS$4);
            }

            return {
                type: 'Parentheses',
                loc: this.getLocation(start, this.scanner.tokenStart),
                children: children
            };
        },
        generate: function(node) {
            this.chunk('(');
            this.children(node);
            this.chunk(')');
        }
    };

    var consumeNumber$4 = utils.consumeNumber;
    var TYPE$t = tokenizer.TYPE;

    var PERCENTAGE$1 = TYPE$t.Percentage;

    var Percentage = {
        name: 'Percentage',
        structure: {
            value: String
        },
        parse: function() {
            var start = this.scanner.tokenStart;
            var numberEnd = consumeNumber$4(this.scanner.source, start);

            this.eat(PERCENTAGE$1);

            return {
                type: 'Percentage',
                loc: this.getLocation(start, this.scanner.tokenStart),
                value: this.scanner.source.substring(start, numberEnd)
            };
        },
        generate: function(node) {
            this.chunk(node.value);
            this.chunk('%');
        }
    };

    var TYPE$u = tokenizer.TYPE;

    var IDENT$b = TYPE$u.Ident;
    var FUNCTION$1 = TYPE$u.Function;
    var COLON$3 = TYPE$u.Colon;
    var RIGHTPARENTHESIS$5 = TYPE$u.RightParenthesis;

    // : [ <ident> | <function-token> <any-value>? ) ]
    var PseudoClassSelector = {
        name: 'PseudoClassSelector',
        structure: {
            name: String,
            children: [['Raw'], null]
        },
        parse: function() {
            var start = this.scanner.tokenStart;
            var children = null;
            var name;
            var nameLowerCase;

            this.eat(COLON$3);

            if (this.scanner.tokenType === FUNCTION$1) {
                name = this.consumeFunctionName();
                nameLowerCase = name.toLowerCase();

                if (this.pseudo.hasOwnProperty(nameLowerCase)) {
                    this.scanner.skipSC();
                    children = this.pseudo[nameLowerCase].call(this);
                    this.scanner.skipSC();
                } else {
                    children = this.createList();
                    children.push(
                        this.Raw(this.scanner.tokenIndex, null, false)
                    );
                }

                this.eat(RIGHTPARENTHESIS$5);
            } else {
                name = this.consume(IDENT$b);
            }

            return {
                type: 'PseudoClassSelector',
                loc: this.getLocation(start, this.scanner.tokenStart),
                name: name,
                children: children
            };
        },
        generate: function(node) {
            this.chunk(':');
            this.chunk(node.name);

            if (node.children !== null) {
                this.chunk('(');
                this.children(node);
                this.chunk(')');
            }
        },
        walkContext: 'function'
    };

    var TYPE$v = tokenizer.TYPE;

    var IDENT$c = TYPE$v.Ident;
    var FUNCTION$2 = TYPE$v.Function;
    var COLON$4 = TYPE$v.Colon;
    var RIGHTPARENTHESIS$6 = TYPE$v.RightParenthesis;

    // :: [ <ident> | <function-token> <any-value>? ) ]
    var PseudoElementSelector = {
        name: 'PseudoElementSelector',
        structure: {
            name: String,
            children: [['Raw'], null]
        },
        parse: function() {
            var start = this.scanner.tokenStart;
            var children = null;
            var name;
            var nameLowerCase;

            this.eat(COLON$4);
            this.eat(COLON$4);

            if (this.scanner.tokenType === FUNCTION$2) {
                name = this.consumeFunctionName();
                nameLowerCase = name.toLowerCase();

                if (this.pseudo.hasOwnProperty(nameLowerCase)) {
                    this.scanner.skipSC();
                    children = this.pseudo[nameLowerCase].call(this);
                    this.scanner.skipSC();
                } else {
                    children = this.createList();
                    children.push(
                        this.Raw(this.scanner.tokenIndex, null, false)
                    );
                }

                this.eat(RIGHTPARENTHESIS$6);
            } else {
                name = this.consume(IDENT$c);
            }

            return {
                type: 'PseudoElementSelector',
                loc: this.getLocation(start, this.scanner.tokenStart),
                name: name,
                children: children
            };
        },
        generate: function(node) {
            this.chunk('::');
            this.chunk(node.name);

            if (node.children !== null) {
                this.chunk('(');
                this.children(node);
                this.chunk(')');
            }
        },
        walkContext: 'function'
    };

    var isDigit$5 = tokenizer.isDigit;
    var TYPE$w = tokenizer.TYPE;

    var NUMBER$6 = TYPE$w.Number;
    var DELIM$4 = TYPE$w.Delim;
    var SOLIDUS$3 = 0x002F;  // U+002F SOLIDUS (/)
    var FULLSTOP$1 = 0x002E; // U+002E FULL STOP (.)

    // Terms of <ratio> should be a positive numbers (not zero or negative)
    // (see https://drafts.csswg.org/mediaqueries-3/#values)
    // However, -o-min-device-pixel-ratio takes fractional values as a ratio's term
    // and this is using by various sites. Therefore we relax checking on parse
    // to test a term is unsigned number without an exponent part.
    // Additional checking may be applied on lexer validation.
    function consumeNumber$5() {
        this.scanner.skipWS();

        var value = this.consume(NUMBER$6);

        for (var i = 0; i < value.length; i++) {
            var code = value.charCodeAt(i);
            if (!isDigit$5(code) && code !== FULLSTOP$1) {
                this.error('Unsigned number is expected', this.scanner.tokenStart - value.length + i);
            }
        }

        if (Number(value) === 0) {
            this.error('Zero number is not allowed', this.scanner.tokenStart - value.length);
        }

        return value;
    }

    // <positive-integer> S* '/' S* <positive-integer>
    var Ratio = {
        name: 'Ratio',
        structure: {
            left: String,
            right: String
        },
        parse: function() {
            var start = this.scanner.tokenStart;
            var left = consumeNumber$5.call(this);
            var right;

            this.scanner.skipWS();

            if (!this.scanner.isDelim(SOLIDUS$3)) {
                this.error('Solidus is expected');
            }
            this.eat(DELIM$4);
            right = consumeNumber$5.call(this);

            return {
                type: 'Ratio',
                loc: this.getLocation(start, this.scanner.tokenStart),
                left: left,
                right: right
            };
        },
        generate: function(node) {
            this.chunk(node.left);
            this.chunk('/');
            this.chunk(node.right);
        }
    };

    var TYPE$x = tokenizer.TYPE;
    var rawMode$4 = Raw.mode;

    var LEFTCURLYBRACKET$4 = TYPE$x.LeftCurlyBracket;

    function consumeRaw$3(startToken) {
        return this.Raw(startToken, rawMode$4.leftCurlyBracket, true);
    }

    function consumePrelude() {
        var prelude = this.SelectorList();

        if (prelude.type !== 'Raw' &&
            this.scanner.eof === false &&
            this.scanner.tokenType !== LEFTCURLYBRACKET$4) {
            this.error();
        }

        return prelude;
    }

    var Rule = {
        name: 'Rule',
        structure: {
            prelude: ['SelectorList', 'Raw'],
            block: ['Block']
        },
        parse: function() {
            var startToken = this.scanner.tokenIndex;
            var startOffset = this.scanner.tokenStart;
            var prelude;
            var block;

            if (this.parseRulePrelude) {
                prelude = this.parseWithFallback(consumePrelude, consumeRaw$3);
            } else {
                prelude = consumeRaw$3.call(this, startToken);
            }

            block = this.Block(true);

            return {
                type: 'Rule',
                loc: this.getLocation(startOffset, this.scanner.tokenStart),
                prelude: prelude,
                block: block
            };
        },
        generate: function(node) {
            this.node(node.prelude);
            this.node(node.block);
        },
        walkContext: 'rule'
    };

    var Selector = {
        name: 'Selector',
        structure: {
            children: [[
                'TypeSelector',
                'IdSelector',
                'ClassSelector',
                'AttributeSelector',
                'PseudoClassSelector',
                'PseudoElementSelector',
                'Combinator',
                'WhiteSpace'
            ]]
        },
        parse: function() {
            var children = this.readSequence(this.scope.Selector);

            // nothing were consumed
            if (this.getFirstListNode(children) === null) {
                this.error('Selector is expected');
            }

            return {
                type: 'Selector',
                loc: this.getLocationFromList(children),
                children: children
            };
        },
        generate: function(node) {
            this.children(node);
        }
    };

    var TYPE$y = tokenizer.TYPE;

    var COMMA$2 = TYPE$y.Comma;

    var SelectorList = {
        name: 'SelectorList',
        structure: {
            children: [[
                'Selector',
                'Raw'
            ]]
        },
        parse: function() {
            var children = this.createList();

            while (!this.scanner.eof) {
                children.push(this.Selector());

                if (this.scanner.tokenType === COMMA$2) {
                    this.scanner.next();
                    continue;
                }

                break;
            }

            return {
                type: 'SelectorList',
                loc: this.getLocationFromList(children),
                children: children
            };
        },
        generate: function(node) {
            this.children(node, function() {
                this.chunk(',');
            });
        },
        walkContext: 'selector'
    };

    var STRING$1 = tokenizer.TYPE.String;

    var _String = {
        name: 'String',
        structure: {
            value: String
        },
        parse: function() {
            return {
                type: 'String',
                loc: this.getLocation(this.scanner.tokenStart, this.scanner.tokenEnd),
                value: this.consume(STRING$1)
            };
        },
        generate: function(node) {
            this.chunk(node.value);
        }
    };

    var TYPE$z = tokenizer.TYPE;

    var WHITESPACE$8 = TYPE$z.WhiteSpace;
    var COMMENT$8 = TYPE$z.Comment;
    var ATKEYWORD$2 = TYPE$z.AtKeyword;
    var CDO$1 = TYPE$z.CDO;
    var CDC$1 = TYPE$z.CDC;
    var EXCLAMATIONMARK$3 = 0x0021; // U+0021 EXCLAMATION MARK (!)

    function consumeRaw$4(startToken) {
        return this.Raw(startToken, null, false);
    }

    var StyleSheet = {
        name: 'StyleSheet',
        structure: {
            children: [[
                'Comment',
                'CDO',
                'CDC',
                'Atrule',
                'Rule',
                'Raw'
            ]]
        },
        parse: function() {
            var start = this.scanner.tokenStart;
            var children = this.createList();
            var child;


            while (!this.scanner.eof) {
                switch (this.scanner.tokenType) {
                    case WHITESPACE$8:
                        this.scanner.next();
                        continue;

                    case COMMENT$8:
                        // ignore comments except exclamation comments (i.e. /*! .. */) on top level
                        if (this.scanner.source.charCodeAt(this.scanner.tokenStart + 2) !== EXCLAMATIONMARK$3) {
                            this.scanner.next();
                            continue;
                        }

                        child = this.Comment();
                        break;

                    case CDO$1: // <!--
                        child = this.CDO();
                        break;

                    case CDC$1: // -->
                        child = this.CDC();
                        break;

                    // CSS Syntax Module Level 3
                    // §2.2 Error handling
                    // At the "top level" of a stylesheet, an <at-keyword-token> starts an at-rule.
                    case ATKEYWORD$2:
                        child = this.parseWithFallback(this.Atrule, consumeRaw$4);
                        break;

                    // Anything else starts a qualified rule ...
                    default:
                        child = this.parseWithFallback(this.Rule, consumeRaw$4);
                }

                children.push(child);
            }

            return {
                type: 'StyleSheet',
                loc: this.getLocation(start, this.scanner.tokenStart),
                children: children
            };
        },
        generate: function(node) {
            this.children(node);
        },
        walkContext: 'stylesheet'
    };

    var TYPE$A = tokenizer.TYPE;

    var IDENT$d = TYPE$A.Ident;
    var ASTERISK$4 = 0x002A;     // U+002A ASTERISK (*)
    var VERTICALLINE$2 = 0x007C; // U+007C VERTICAL LINE (|)

    function eatIdentifierOrAsterisk() {
        if (this.scanner.tokenType !== IDENT$d &&
            this.scanner.isDelim(ASTERISK$4) === false) {
            this.error('Identifier or asterisk is expected');
        }

        this.scanner.next();
    }

    // ident
    // ident|ident
    // ident|*
    // *
    // *|ident
    // *|*
    // |ident
    // |*
    var TypeSelector = {
        name: 'TypeSelector',
        structure: {
            name: String
        },
        parse: function() {
            var start = this.scanner.tokenStart;

            if (this.scanner.isDelim(VERTICALLINE$2)) {
                this.scanner.next();
                eatIdentifierOrAsterisk.call(this);
            } else {
                eatIdentifierOrAsterisk.call(this);

                if (this.scanner.isDelim(VERTICALLINE$2)) {
                    this.scanner.next();
                    eatIdentifierOrAsterisk.call(this);
                }
            }

            return {
                type: 'TypeSelector',
                loc: this.getLocation(start, this.scanner.tokenStart),
                name: this.scanner.substrToCursor(start)
            };
        },
        generate: function(node) {
            this.chunk(node.name);
        }
    };

    var isHexDigit$4 = tokenizer.isHexDigit;
    var cmpChar$4 = tokenizer.cmpChar;
    var TYPE$B = tokenizer.TYPE;
    var NAME$3 = tokenizer.NAME;

    var IDENT$e = TYPE$B.Ident;
    var NUMBER$7 = TYPE$B.Number;
    var DIMENSION$5 = TYPE$B.Dimension;
    var PLUSSIGN$6 = 0x002B;     // U+002B PLUS SIGN (+)
    var HYPHENMINUS$4 = 0x002D;  // U+002D HYPHEN-MINUS (-)
    var QUESTIONMARK$2 = 0x003F; // U+003F QUESTION MARK (?)
    var U$1 = 0x0075;            // U+0075 LATIN SMALL LETTER U (u)

    function eatHexSequence(offset, allowDash) {
        for (var pos = this.scanner.tokenStart + offset, len = 0; pos < this.scanner.tokenEnd; pos++) {
            var code = this.scanner.source.charCodeAt(pos);

            if (code === HYPHENMINUS$4 && allowDash && len !== 0) {
                if (eatHexSequence.call(this, offset + len + 1, false) === 0) {
                    this.error();
                }

                return -1;
            }

            if (!isHexDigit$4(code)) {
                this.error(
                    allowDash && len !== 0
                        ? 'HyphenMinus' + (len < 6 ? ' or hex digit' : '') + ' is expected'
                        : (len < 6 ? 'Hex digit is expected' : 'Unexpected input'),
                    pos
                );
            }

            if (++len > 6) {
                this.error('Too many hex digits', pos);
            }    }

        this.scanner.next();
        return len;
    }

    function eatQuestionMarkSequence(max) {
        var count = 0;

        while (this.scanner.isDelim(QUESTIONMARK$2)) {
            if (++count > max) {
                this.error('Too many question marks');
            }

            this.scanner.next();
        }
    }

    function startsWith$1(code) {
        if (this.scanner.source.charCodeAt(this.scanner.tokenStart) !== code) {
            this.error(NAME$3[code] + ' is expected');
        }
    }

    // https://drafts.csswg.org/css-syntax/#urange
    // Informally, the <urange> production has three forms:
    // U+0001
    //      Defines a range consisting of a single code point, in this case the code point "1".
    // U+0001-00ff
    //      Defines a range of codepoints between the first and the second value, in this case
    //      the range between "1" and "ff" (255 in decimal) inclusive.
    // U+00??
    //      Defines a range of codepoints where the "?" characters range over all hex digits,
    //      in this case defining the same as the value U+0000-00ff.
    // In each form, a maximum of 6 digits is allowed for each hexadecimal number (if you treat "?" as a hexadecimal digit).
    //
    // <urange> =
    //   u '+' <ident-token> '?'* |
    //   u <dimension-token> '?'* |
    //   u <number-token> '?'* |
    //   u <number-token> <dimension-token> |
    //   u <number-token> <number-token> |
    //   u '+' '?'+
    function scanUnicodeRange() {
        var hexLength = 0;

        // u '+' <ident-token> '?'*
        // u '+' '?'+
        if (this.scanner.isDelim(PLUSSIGN$6)) {
            this.scanner.next();

            if (this.scanner.tokenType === IDENT$e) {
                hexLength = eatHexSequence.call(this, 0, true);
                if (hexLength > 0) {
                    eatQuestionMarkSequence.call(this, 6 - hexLength);
                }
                return;
            }

            if (this.scanner.isDelim(QUESTIONMARK$2)) {
                this.scanner.next();
                eatQuestionMarkSequence.call(this, 5);
                return;
            }

            this.error('Hex digit or question mark is expected');
            return;
        }

        // u <number-token> '?'*
        // u <number-token> <dimension-token>
        // u <number-token> <number-token>
        if (this.scanner.tokenType === NUMBER$7) {
            startsWith$1.call(this, PLUSSIGN$6);
            hexLength = eatHexSequence.call(this, 1, true);

            if (this.scanner.isDelim(QUESTIONMARK$2)) {
                eatQuestionMarkSequence.call(this, 6 - hexLength);
                return;
            }

            if (this.scanner.tokenType === DIMENSION$5 ||
                this.scanner.tokenType === NUMBER$7) {
                startsWith$1.call(this, HYPHENMINUS$4);
                eatHexSequence.call(this, 1, false);
                return;
            }

            return;
        }

        // u <dimension-token> '?'*
        if (this.scanner.tokenType === DIMENSION$5) {
            startsWith$1.call(this, PLUSSIGN$6);
            hexLength = eatHexSequence.call(this, 1, true);

            if (hexLength > 0) {
                eatQuestionMarkSequence.call(this, 6 - hexLength);
            }

            return;
        }

        this.error();
    }

    var UnicodeRange = {
        name: 'UnicodeRange',
        structure: {
            value: String
        },
        parse: function() {
            var start = this.scanner.tokenStart;

            // U or u
            if (!cmpChar$4(this.scanner.source, start, U$1)) {
                this.error('U is expected');
            }

            if (!cmpChar$4(this.scanner.source, start + 1, PLUSSIGN$6)) {
                this.error('Plus sign is expected');
            }

            this.scanner.next();
            scanUnicodeRange.call(this);

            return {
                type: 'UnicodeRange',
                loc: this.getLocation(start, this.scanner.tokenStart),
                value: this.scanner.substrToCursor(start)
            };
        },
        generate: function(node) {
            this.chunk(node.value);
        }
    };

    var isWhiteSpace$2 = tokenizer.isWhiteSpace;
    var cmpStr$4 = tokenizer.cmpStr;
    var TYPE$C = tokenizer.TYPE;

    var FUNCTION$3 = TYPE$C.Function;
    var URL$1 = TYPE$C.Url;
    var RIGHTPARENTHESIS$7 = TYPE$C.RightParenthesis;

    // <url-token> | <function-token> <string> )
    var Url = {
        name: 'Url',
        structure: {
            value: ['String', 'Raw']
        },
        parse: function() {
            var start = this.scanner.tokenStart;
            var value;

            switch (this.scanner.tokenType) {
                case URL$1:
                    var rawStart = start + 4;
                    var rawEnd = this.scanner.tokenEnd - 1;

                    while (rawStart < rawEnd && isWhiteSpace$2(this.scanner.source.charCodeAt(rawStart))) {
                        rawStart++;
                    }

                    while (rawStart < rawEnd && isWhiteSpace$2(this.scanner.source.charCodeAt(rawEnd - 1))) {
                        rawEnd--;
                    }

                    value = {
                        type: 'Raw',
                        loc: this.getLocation(rawStart, rawEnd),
                        value: this.scanner.source.substring(rawStart, rawEnd)
                    };

                    this.eat(URL$1);
                    break;

                case FUNCTION$3:
                    if (!cmpStr$4(this.scanner.source, this.scanner.tokenStart, this.scanner.tokenEnd, 'url(')) {
                        this.error('Function name must be `url`');
                    }

                    this.eat(FUNCTION$3);
                    this.scanner.skipSC();
                    value = this.String();
                    this.scanner.skipSC();
                    this.eat(RIGHTPARENTHESIS$7);
                    break;

                default:
                    this.error('Url or Function is expected');
            }

            return {
                type: 'Url',
                loc: this.getLocation(start, this.scanner.tokenStart),
                value: value
            };
        },
        generate: function(node) {
            this.chunk('url');
            this.chunk('(');
            this.node(node.value);
            this.chunk(')');
        }
    };

    var Value = {
        name: 'Value',
        structure: {
            children: [[]]
        },
        parse: function() {
            var start = this.scanner.tokenStart;
            var children = this.readSequence(this.scope.Value);

            return {
                type: 'Value',
                loc: this.getLocation(start, this.scanner.tokenStart),
                children: children
            };
        },
        generate: function(node) {
            this.children(node);
        }
    };

    var WHITESPACE$9 = tokenizer.TYPE.WhiteSpace;
    var SPACE$2 = Object.freeze({
        type: 'WhiteSpace',
        loc: null,
        value: ' '
    });

    var WhiteSpace$1 = {
        name: 'WhiteSpace',
        structure: {
            value: String
        },
        parse: function() {
            this.eat(WHITESPACE$9);
            return SPACE$2;

            // return {
            //     type: 'WhiteSpace',
            //     loc: this.getLocation(this.scanner.tokenStart, this.scanner.tokenEnd),
            //     value: this.consume(WHITESPACE)
            // };
        },
        generate: function(node) {
            this.chunk(node.value);
        }
    };

    var node = {
        AnPlusB: AnPlusB,
        Atrule: Atrule,
        AtrulePrelude: AtrulePrelude,
        AttributeSelector: AttributeSelector,
        Block: Block,
        Brackets: Brackets,
        CDC: CDC_1,
        CDO: CDO_1,
        ClassSelector: ClassSelector,
        Combinator: Combinator,
        Comment: Comment,
        Declaration: Declaration,
        DeclarationList: DeclarationList,
        Dimension: Dimension,
        Function: _Function,
        HexColor: HexColor,
        Identifier: Identifier,
        IdSelector: IdSelector,
        MediaFeature: MediaFeature,
        MediaQuery: MediaQuery,
        MediaQueryList: MediaQueryList,
        Nth: Nth,
        Number: _Number,
        Operator: Operator,
        Parentheses: Parentheses,
        Percentage: Percentage,
        PseudoClassSelector: PseudoClassSelector,
        PseudoElementSelector: PseudoElementSelector,
        Ratio: Ratio,
        Raw: Raw,
        Rule: Rule,
        Selector: Selector,
        SelectorList: SelectorList,
        String: _String,
        StyleSheet: StyleSheet,
        TypeSelector: TypeSelector,
        UnicodeRange: UnicodeRange,
        Url: Url,
        Value: Value,
        WhiteSpace: WhiteSpace$1
    };

    var data = getCjsExportFromNamespace(defaultSyntax$1);

    var lexer = {
        generic: true,
        types: data.types,
        atrules: data.atrules,
        properties: data.properties,
        node: node
    };

    var cmpChar$5 = tokenizer.cmpChar;
    var cmpStr$5 = tokenizer.cmpStr;
    var TYPE$D = tokenizer.TYPE;

    var IDENT$f = TYPE$D.Ident;
    var STRING$2 = TYPE$D.String;
    var NUMBER$8 = TYPE$D.Number;
    var FUNCTION$4 = TYPE$D.Function;
    var URL$2 = TYPE$D.Url;
    var HASH$4 = TYPE$D.Hash;
    var DIMENSION$6 = TYPE$D.Dimension;
    var PERCENTAGE$2 = TYPE$D.Percentage;
    var LEFTPARENTHESIS$5 = TYPE$D.LeftParenthesis;
    var LEFTSQUAREBRACKET$3 = TYPE$D.LeftSquareBracket;
    var COMMA$3 = TYPE$D.Comma;
    var DELIM$5 = TYPE$D.Delim;
    var NUMBERSIGN$3 = 0x0023;  // U+0023 NUMBER SIGN (#)
    var ASTERISK$5 = 0x002A;    // U+002A ASTERISK (*)
    var PLUSSIGN$7 = 0x002B;    // U+002B PLUS SIGN (+)
    var HYPHENMINUS$5 = 0x002D; // U+002D HYPHEN-MINUS (-)
    var SOLIDUS$4 = 0x002F;     // U+002F SOLIDUS (/)
    var U$2 = 0x0075;           // U+0075 LATIN SMALL LETTER U (u)

    var _default = function defaultRecognizer(context) {
        switch (this.scanner.tokenType) {
            case HASH$4:
                return this.HexColor();

            case COMMA$3:
                context.space = null;
                context.ignoreWSAfter = true;
                return this.Operator();

            case LEFTPARENTHESIS$5:
                return this.Parentheses(this.readSequence, context.recognizer);

            case LEFTSQUAREBRACKET$3:
                return this.Brackets(this.readSequence, context.recognizer);

            case STRING$2:
                return this.String();

            case DIMENSION$6:
                return this.Dimension();

            case PERCENTAGE$2:
                return this.Percentage();

            case NUMBER$8:
                return this.Number();

            case FUNCTION$4:
                return cmpStr$5(this.scanner.source, this.scanner.tokenStart, this.scanner.tokenEnd, 'url(')
                    ? this.Url()
                    : this.Function(this.readSequence, context.recognizer);

            case URL$2:
                return this.Url();

            case IDENT$f:
                // check for unicode range, it should start with u+ or U+
                if (cmpChar$5(this.scanner.source, this.scanner.tokenStart, U$2) &&
                    cmpChar$5(this.scanner.source, this.scanner.tokenStart + 1, PLUSSIGN$7)) {
                    return this.UnicodeRange();
                } else {
                    return this.Identifier();
                }

            case DELIM$5:
                var code = this.scanner.source.charCodeAt(this.scanner.tokenStart);

                if (code === SOLIDUS$4 ||
                    code === ASTERISK$5 ||
                    code === PLUSSIGN$7 ||
                    code === HYPHENMINUS$5) {
                    return this.Operator(); // TODO: replace with Delim
                }

                // TODO: produce a node with Delim node type

                if (code === NUMBERSIGN$3) {
                    this.error('Hex or identifier is expected', this.scanner.tokenStart + 1);
                }

                break;
        }
    };

    var atrulePrelude = {
        getNode: _default
    };

    var TYPE$E = tokenizer.TYPE;

    var DELIM$6 = TYPE$E.Delim;
    var IDENT$g = TYPE$E.Ident;
    var DIMENSION$7 = TYPE$E.Dimension;
    var PERCENTAGE$3 = TYPE$E.Percentage;
    var NUMBER$9 = TYPE$E.Number;
    var HASH$5 = TYPE$E.Hash;
    var COLON$5 = TYPE$E.Colon;
    var LEFTSQUAREBRACKET$4 = TYPE$E.LeftSquareBracket;
    var NUMBERSIGN$4 = 0x0023;      // U+0023 NUMBER SIGN (#)
    var ASTERISK$6 = 0x002A;        // U+002A ASTERISK (*)
    var PLUSSIGN$8 = 0x002B;        // U+002B PLUS SIGN (+)
    var SOLIDUS$5 = 0x002F;         // U+002F SOLIDUS (/)
    var FULLSTOP$2 = 0x002E;        // U+002E FULL STOP (.)
    var GREATERTHANSIGN$2 = 0x003E; // U+003E GREATER-THAN SIGN (>)
    var VERTICALLINE$3 = 0x007C;    // U+007C VERTICAL LINE (|)
    var TILDE$2 = 0x007E;           // U+007E TILDE (~)

    function getNode(context) {
        switch (this.scanner.tokenType) {
            case LEFTSQUAREBRACKET$4:
                return this.AttributeSelector();

            case HASH$5:
                return this.IdSelector();

            case COLON$5:
                if (this.scanner.lookupType(1) === COLON$5) {
                    return this.PseudoElementSelector();
                } else {
                    return this.PseudoClassSelector();
                }

            case IDENT$g:
                return this.TypeSelector();

            case NUMBER$9:
            case PERCENTAGE$3:
                return this.Percentage();

            case DIMENSION$7:
                // throws when .123ident
                if (this.scanner.source.charCodeAt(this.scanner.tokenStart) === FULLSTOP$2) {
                    this.error('Identifier is expected', this.scanner.tokenStart + 1);
                }
                break;

            case DELIM$6:
                var code = this.scanner.source.charCodeAt(this.scanner.tokenStart);

                switch (code) {
                    case PLUSSIGN$8:
                    case GREATERTHANSIGN$2:
                    case TILDE$2:
                        context.space = null;
                        context.ignoreWSAfter = true;
                        return this.Combinator();

                    case SOLIDUS$5:  // /deep/
                        return this.Combinator();

                    case FULLSTOP$2:
                        return this.ClassSelector();

                    case ASTERISK$6:
                    case VERTICALLINE$3:
                        return this.TypeSelector();

                    case NUMBERSIGN$4:
                        return this.IdSelector();
                }

                break;
        }
    }
    var selector = {
        getNode: getNode
    };

    // https://drafts.csswg.org/css-images-4/#element-notation
    // https://developer.mozilla.org/en-US/docs/Web/CSS/element
    var element = function() {
        this.scanner.skipSC();

        var children = this.createSingleNodeList(
            this.IdSelector()
        );

        this.scanner.skipSC();

        return children;
    };

    // legacy IE function
    // expression( <any-value> )
    var expression = function() {
        return this.createSingleNodeList(
            this.Raw(this.scanner.tokenIndex, null, false)
        );
    };

    var TYPE$F = tokenizer.TYPE;
    var rawMode$5 = Raw.mode;

    var COMMA$4 = TYPE$F.Comma;

    // var( <ident> , <value>? )
    var _var = function() {
        var children = this.createList();

        this.scanner.skipSC();

        // NOTE: Don't check more than a first argument is an ident, rest checks are for lexer
        children.push(this.Identifier());

        this.scanner.skipSC();

        if (this.scanner.tokenType === COMMA$4) {
            children.push(this.Operator());
            children.push(this.parseCustomProperty
                ? this.Value(null)
                : this.Raw(this.scanner.tokenIndex, rawMode$5.exclamationMarkOrSemicolon, false)
            );
        }

        return children;
    };

    var value = {
        getNode: _default,
        '-moz-element': element,
        'element': element,
        'expression': expression,
        'var': _var
    };

    var scope = {
        AtrulePrelude: atrulePrelude,
        Selector: selector,
        Value: value
    };

    var fontFace = {
        parse: {
            prelude: null,
            block: function() {
                return this.Block(true);
            }
        }
    };

    var TYPE$G = tokenizer.TYPE;

    var STRING$3 = TYPE$G.String;
    var IDENT$h = TYPE$G.Ident;
    var URL$3 = TYPE$G.Url;
    var FUNCTION$5 = TYPE$G.Function;
    var LEFTPARENTHESIS$6 = TYPE$G.LeftParenthesis;

    var _import = {
        parse: {
            prelude: function() {
                var children = this.createList();

                this.scanner.skipSC();

                switch (this.scanner.tokenType) {
                    case STRING$3:
                        children.push(this.String());
                        break;

                    case URL$3:
                    case FUNCTION$5:
                        children.push(this.Url());
                        break;

                    default:
                        this.error('String or url() is expected');
                }

                if (this.lookupNonWSType(0) === IDENT$h ||
                    this.lookupNonWSType(0) === LEFTPARENTHESIS$6) {
                    children.push(this.WhiteSpace());
                    children.push(this.MediaQueryList());
                }

                return children;
            },
            block: null
        }
    };

    var media = {
        parse: {
            prelude: function() {
                return this.createSingleNodeList(
                    this.MediaQueryList()
                );
            },
            block: function() {
                return this.Block(false);
            }
        }
    };

    var page = {
        parse: {
            prelude: function() {
                return this.createSingleNodeList(
                    this.SelectorList()
                );
            },
            block: function() {
                return this.Block(true);
            }
        }
    };

    var TYPE$H = tokenizer.TYPE;

    var WHITESPACE$a = TYPE$H.WhiteSpace;
    var COMMENT$9 = TYPE$H.Comment;
    var IDENT$i = TYPE$H.Ident;
    var FUNCTION$6 = TYPE$H.Function;
    var COLON$6 = TYPE$H.Colon;
    var LEFTPARENTHESIS$7 = TYPE$H.LeftParenthesis;

    function consumeRaw$5() {
        return this.createSingleNodeList(
            this.Raw(this.scanner.tokenIndex, null, false)
        );
    }

    function parentheses() {
        this.scanner.skipSC();

        if (this.scanner.tokenType === IDENT$i &&
            this.lookupNonWSType(1) === COLON$6) {
            return this.createSingleNodeList(
                this.Declaration()
            );
        }

        return readSequence.call(this);
    }

    function readSequence() {
        var children = this.createList();
        var space = null;
        var child;

        this.scanner.skipSC();

        scan:
            while (!this.scanner.eof) {
                switch (this.scanner.tokenType) {
                    case WHITESPACE$a:
                        space = this.WhiteSpace();
                        continue;

                    case COMMENT$9:
                        this.scanner.next();
                        continue;

                    case FUNCTION$6:
                        child = this.Function(consumeRaw$5, this.scope.AtrulePrelude);
                        break;

                    case IDENT$i:
                        child = this.Identifier();
                        break;

                    case LEFTPARENTHESIS$7:
                        child = this.Parentheses(parentheses, this.scope.AtrulePrelude);
                        break;

                    default:
                        break scan;
                }

                if (space !== null) {
                    children.push(space);
                    space = null;
                }

                children.push(child);
            }

        return children;
    }

    var supports = {
        parse: {
            prelude: function() {
                var children = readSequence.call(this);

                if (this.getFirstListNode(children) === null) {
                    this.error('Condition is expected');
                }

                return children;
            },
            block: function() {
                return this.Block(false);
            }
        }
    };

    var atrule = {
        'font-face': fontFace,
        'import': _import,
        'media': media,
        'page': page,
        'supports': supports
    };

    var dir = {
        parse: function() {
            return this.createSingleNodeList(
                this.Identifier()
            );
        }
    };

    var has$1 = {
        parse: function() {
            return this.createSingleNodeList(
                this.SelectorList()
            );
        }
    };

    var lang = {
        parse: function() {
            return this.createSingleNodeList(
                this.Identifier()
            );
        }
    };

    var selectorList = {
        parse: function selectorList() {
            return this.createSingleNodeList(
                this.SelectorList()
            );
        }
    };

    var matches = selectorList;

    var not = selectorList;

    var ALLOW_OF_CLAUSE = true;

    var nthWithOfClause = {
        parse: function nthWithOfClause() {
            return this.createSingleNodeList(
                this.Nth(ALLOW_OF_CLAUSE)
            );
        }
    };

    var nthChild = nthWithOfClause;

    var nthLastChild = nthWithOfClause;

    var DISALLOW_OF_CLAUSE = false;

    var nth = {
        parse: function nth() {
            return this.createSingleNodeList(
                this.Nth(DISALLOW_OF_CLAUSE)
            );
        }
    };

    var nthLastOfType = nth;

    var nthOfType = nth;

    var slotted = {
        parse: function compoundSelector() {
            return this.createSingleNodeList(
                this.Selector()
            );
        }
    };

    var pseudo = {
        'dir': dir,
        'has': has$1,
        'lang': lang,
        'matches': matches,
        'not': not,
        'nth-child': nthChild,
        'nth-last-child': nthLastChild,
        'nth-last-of-type': nthLastOfType,
        'nth-of-type': nthOfType,
        'slotted': slotted
    };

    var parser = {
        parseContext: {
            default: 'StyleSheet',
            stylesheet: 'StyleSheet',
            atrule: 'Atrule',
            atrulePrelude: function(options) {
                return this.AtrulePrelude(options.atrule ? String(options.atrule) : null);
            },
            mediaQueryList: 'MediaQueryList',
            mediaQuery: 'MediaQuery',
            rule: 'Rule',
            selectorList: 'SelectorList',
            selector: 'Selector',
            block: function() {
                return this.Block(true);
            },
            declarationList: 'DeclarationList',
            declaration: 'Declaration',
            value: 'Value'
        },
        scope: scope,
        atrule: atrule,
        pseudo: pseudo,
        node: node
    };

    var walker = {
        node: node
    };

    function merge() {
        var dest = {};

        for (var i = 0; i < arguments.length; i++) {
            var src = arguments[i];
            for (var key in src) {
                dest[key] = src[key];
            }
        }

        return dest;
    }

    var syntax = create$4.create(
        merge(
            lexer,
            parser,
            walker
        )
    );

    var lib = syntax;

    var hasOwnProperty$6 = Object.prototype.hasOwnProperty;

    function buildMap(list, caseInsensitive) {
        var map = Object.create(null);

        if (!Array.isArray(list)) {
            return null;
        }

        for (var i = 0; i < list.length; i++) {
            var name = list[i];

            if (caseInsensitive) {
                name = name.toLowerCase();
            }

            map[name] = true;
        }

        return map;
    }

    function buildList(data) {
        if (!data) {
            return null;
        }

        var tags = buildMap(data.tags, true);
        var ids = buildMap(data.ids);
        var classes = buildMap(data.classes);

        if (tags === null &&
            ids === null &&
            classes === null) {
            return null;
        }

        return {
            tags: tags,
            ids: ids,
            classes: classes
        };
    }

    function buildIndex(data) {
        var scopes = false;

        if (data.scopes && Array.isArray(data.scopes)) {
            scopes = Object.create(null);

            for (var i = 0; i < data.scopes.length; i++) {
                var list = data.scopes[i];

                if (!list || !Array.isArray(list)) {
                    throw new Error('Wrong usage format');
                }

                for (var j = 0; j < list.length; j++) {
                    var name = list[j];

                    if (hasOwnProperty$6.call(scopes, name)) {
                        throw new Error('Class can\'t be used for several scopes: ' + name);
                    }

                    scopes[name] = i + 1;
                }
            }
        }

        return {
            whitelist: buildList(data),
            blacklist: buildList(data.blacklist),
            scopes: scopes
        };
    }

    var usage = {
        buildIndex: buildIndex
    };

    var utils$1 = {
        hasNoChildren: function(node) {
            return !node || !node.children || node.children.isEmpty();
        },
        isNodeChildrenList: function(node, list) {
            return node !== null && node.children === list;
        }
    };

    var resolveKeyword = lib.keyword;
    var { hasNoChildren } = utils$1;

    var Atrule$1 = function cleanAtrule(node, item, list) {
        if (node.block) {
            // otherwise removed at-rule don't prevent @import for removal
            if (this.stylesheet !== null) {
                this.stylesheet.firstAtrulesAllowed = false;
            }

            if (hasNoChildren(node.block)) {
                list.remove(item);
                return;
            }
        }

        switch (node.name) {
            case 'charset':
                if (hasNoChildren(node.prelude)) {
                    list.remove(item);
                    return;
                }

                // if there is any rule before @charset -> remove it
                if (item.prev) {
                    list.remove(item);
                    return;
                }

                break;

            case 'import':
                if (this.stylesheet === null || !this.stylesheet.firstAtrulesAllowed) {
                    list.remove(item);
                    return;
                }

                // if there are some rules that not an @import or @charset before @import
                // remove it
                list.prevUntil(item.prev, function(rule) {
                    if (rule.type === 'Atrule') {
                        if (rule.name === 'import' || rule.name === 'charset') {
                            return;
                        }
                    }

                    this.root.firstAtrulesAllowed = false;
                    list.remove(item);
                    return true;
                }, this);

                break;

            default:
                var name = resolveKeyword(node.name).basename;
                if (name === 'keyframes' ||
                    name === 'media' ||
                    name === 'supports') {

                    // drop at-rule with no prelude
                    if (hasNoChildren(node.prelude) || hasNoChildren(node.block)) {
                        list.remove(item);
                    }
                }
        }
    };

    var Comment$1 = function cleanComment(data, item, list) {
        list.remove(item);
    };

    var Declaration$1 = function cleanDeclartion(node, item, list) {
        if (node.value.children && node.value.children.isEmpty()) {
            list.remove(item);
        }
    };

    var { isNodeChildrenList } = utils$1;

    var Raw$1 = function cleanRaw(node, item, list) {
        // raw in stylesheet or block children
        if (isNodeChildrenList(this.stylesheet, list) ||
            isNodeChildrenList(this.block, list)) {
            list.remove(item);
        }
    };

    var hasOwnProperty$7 = Object.prototype.hasOwnProperty;
    var walk$1 = lib.walk;
    var { hasNoChildren: hasNoChildren$1 } = utils$1;

    function cleanUnused(selectorList, usageData) {
        selectorList.children.each(function(selector, item, list) {
            var shouldRemove = false;

            walk$1(selector, function(node) {
                // ignore nodes in nested selectors
                if (this.selector === null || this.selector === selectorList) {
                    switch (node.type) {
                        case 'SelectorList':
                            // TODO: remove toLowerCase when pseudo selectors will be normalized
                            // ignore selectors inside :not()
                            if (this.function === null || this.function.name.toLowerCase() !== 'not') {
                                if (cleanUnused(node, usageData)) {
                                    shouldRemove = true;
                                }
                            }
                            break;

                        case 'ClassSelector':
                            if (usageData.whitelist !== null &&
                                usageData.whitelist.classes !== null &&
                                !hasOwnProperty$7.call(usageData.whitelist.classes, node.name)) {
                                shouldRemove = true;
                            }
                            if (usageData.blacklist !== null &&
                                usageData.blacklist.classes !== null &&
                                hasOwnProperty$7.call(usageData.blacklist.classes, node.name)) {
                                shouldRemove = true;
                            }
                            break;

                        case 'IdSelector':
                            if (usageData.whitelist !== null &&
                                usageData.whitelist.ids !== null &&
                                !hasOwnProperty$7.call(usageData.whitelist.ids, node.name)) {
                                shouldRemove = true;
                            }
                            if (usageData.blacklist !== null &&
                                usageData.blacklist.ids !== null &&
                                hasOwnProperty$7.call(usageData.blacklist.ids, node.name)) {
                                shouldRemove = true;
                            }
                            break;

                        case 'TypeSelector':
                            // TODO: remove toLowerCase when type selectors will be normalized
                            // ignore universal selectors
                            if (node.name.charAt(node.name.length - 1) !== '*') {
                                if (usageData.whitelist !== null &&
                                    usageData.whitelist.tags !== null &&
                                    !hasOwnProperty$7.call(usageData.whitelist.tags, node.name.toLowerCase())) {
                                    shouldRemove = true;
                                }
                                if (usageData.blacklist !== null &&
                                    usageData.blacklist.tags !== null &&
                                    hasOwnProperty$7.call(usageData.blacklist.tags, node.name.toLowerCase())) {
                                    shouldRemove = true;
                                }
                            }
                            break;
                    }
                }
            });

            if (shouldRemove) {
                list.remove(item);
            }
        });

        return selectorList.children.isEmpty();
    }

    var Rule$1 = function cleanRule(node, item, list, options) {
        if (hasNoChildren$1(node.prelude) || hasNoChildren$1(node.block)) {
            list.remove(item);
            return;
        }

        var usageData = options.usage;

        if (usageData && (usageData.whitelist !== null || usageData.blacklist !== null)) {
            cleanUnused(node.prelude, usageData);

            if (hasNoChildren$1(node.prelude)) {
                list.remove(item);
                return;
            }
        }
    };

    // remove useless universal selector
    var TypeSelector$1 = function cleanTypeSelector(node, item, list) {
        var name = item.data.name;

        // check it's a non-namespaced universal selector
        if (name !== '*') {
            return;
        }

        // remove when universal selector before other selectors
        var nextType = item.next && item.next.data.type;
        if (nextType === 'IdSelector' ||
            nextType === 'ClassSelector' ||
            nextType === 'AttributeSelector' ||
            nextType === 'PseudoClassSelector' ||
            nextType === 'PseudoElementSelector') {
            list.remove(item);
        }
    };

    var { isNodeChildrenList: isNodeChildrenList$1 } = utils$1;

    function isSafeOperator(node) {
        return node.type === 'Operator' && node.value !== '+' && node.value !== '-';
    }

    var WhiteSpace$2 = function cleanWhitespace(node, item, list) {
        // remove when first or last item in sequence
        if (item.next === null || item.prev === null) {
            list.remove(item);
            return;
        }

        // white space in stylesheet or block children
        if (isNodeChildrenList$1(this.stylesheet, list) ||
            isNodeChildrenList$1(this.block, list)) {
            list.remove(item);
            return;
        }

        if (item.next.data.type === 'WhiteSpace') {
            list.remove(item);
            return;
        }

        if (isSafeOperator(item.prev.data) || isSafeOperator(item.next.data)) {
            list.remove(item);
            return;
        }
    };

    var walk$2 = lib.walk;
    var handlers = {
        Atrule: Atrule$1,
        Comment: Comment$1,
        Declaration: Declaration$1,
        Raw: Raw$1,
        Rule: Rule$1,
        TypeSelector: TypeSelector$1,
        WhiteSpace: WhiteSpace$2
    };

    var clean = function(ast, options) {
        walk$2(ast, {
            leave: function(node, item, list) {
                if (handlers.hasOwnProperty(node.type)) {
                    handlers[node.type].call(this, node, item, list, options);
                }
            }
        });
    };

    var keyframes = function(node) {
        node.block.children.each(function(rule) {
            rule.prelude.children.each(function(simpleselector) {
                simpleselector.children.each(function(data, item) {
                    if (data.type === 'Percentage' && data.value === '100') {
                        item.data = {
                            type: 'TypeSelector',
                            loc: data.loc,
                            name: 'to'
                        };
                    } else if (data.type === 'TypeSelector' && data.name === 'from') {
                        item.data = {
                            type: 'Percentage',
                            loc: data.loc,
                            value: '0'
                        };
                    }
                });
            });
        });
    };

    var resolveKeyword$1 = lib.keyword;


    var Atrule$2 = function(node) {
        // compress @keyframe selectors
        if (resolveKeyword$1(node.name).basename === 'keyframes') {
            keyframes(node);
        }
    };

    // Can unquote attribute detection
    // Adopted implementation of Mathias Bynens
    // https://github.com/mathiasbynens/mothereff.in/blob/master/unquoted-attributes/eff.js
    var escapesRx = /\\([0-9A-Fa-f]{1,6})(\r\n|[ \t\n\f\r])?|\\./g;
    var blockUnquoteRx = /^(-?\d|--)|[\u0000-\u002c\u002e\u002f\u003A-\u0040\u005B-\u005E\u0060\u007B-\u009f]/;

    function canUnquote(value) {
        if (value === '' || value === '-') {
            return;
        }

        // Escapes are valid, so replace them with a valid non-empty string
        value = value.replace(escapesRx, 'a');

        return !blockUnquoteRx.test(value);
    }

    var AttributeSelector$1 = function(node) {
        var attrValue = node.value;

        if (!attrValue || attrValue.type !== 'String') {
            return;
        }

        var unquotedValue = attrValue.value.replace(/^(.)(.*)\1$/, '$2');
        if (canUnquote(unquotedValue)) {
            node.value = {
                type: 'Identifier',
                loc: attrValue.loc,
                name: unquotedValue
            };
        }
    };

    var font = function compressFont(node) {
        var list = node.children;

        list.eachRight(function(node, item) {
            if (node.type === 'Identifier') {
                if (node.name === 'bold') {
                    item.data = {
                        type: 'Number',
                        loc: node.loc,
                        value: '700'
                    };
                } else if (node.name === 'normal') {
                    var prev = item.prev;

                    if (prev && prev.data.type === 'Operator' && prev.data.value === '/') {
                        this.remove(prev);
                    }

                    this.remove(item);
                } else if (node.name === 'medium') {
                    var next = item.next;

                    if (!next || next.data.type !== 'Operator') {
                        this.remove(item);
                    }
                }
            }
        });

        // remove redundant spaces
        list.each(function(node, item) {
            if (node.type === 'WhiteSpace') {
                if (!item.prev || !item.next || item.next.data.type === 'WhiteSpace') {
                    this.remove(item);
                }
            }
        });

        if (list.isEmpty()) {
            list.insert(list.createItem({
                type: 'Identifier',
                name: 'normal'
            }));
        }
    };

    var fontWeight = function compressFontWeight(node) {
        var value = node.children.head.data;

        if (value.type === 'Identifier') {
            switch (value.name) {
                case 'normal':
                    node.children.head.data = {
                        type: 'Number',
                        loc: value.loc,
                        value: '400'
                    };
                    break;
                case 'bold':
                    node.children.head.data = {
                        type: 'Number',
                        loc: value.loc,
                        value: '700'
                    };
                    break;
            }
        }
    };

    var List$1 = lib.List;

    var background = function compressBackground(node) {
        function lastType() {
            if (buffer.length) {
                return buffer[buffer.length - 1].type;
            }
        }

        function flush() {
            if (lastType() === 'WhiteSpace') {
                buffer.pop();
            }

            if (!buffer.length) {
                buffer.unshift(
                    {
                        type: 'Number',
                        loc: null,
                        value: '0'
                    },
                    {
                        type: 'WhiteSpace',
                        value: ' '
                    },
                    {
                        type: 'Number',
                        loc: null,
                        value: '0'
                    }
                );
            }

            newValue.push.apply(newValue, buffer);

            buffer = [];
        }

        var newValue = [];
        var buffer = [];

        node.children.each(function(node) {
            if (node.type === 'Operator' && node.value === ',') {
                flush();
                newValue.push(node);
                return;
            }

            // remove defaults
            if (node.type === 'Identifier') {
                if (node.name === 'transparent' ||
                    node.name === 'none' ||
                    node.name === 'repeat' ||
                    node.name === 'scroll') {
                    return;
                }
            }

            // don't add redundant spaces
            if (node.type === 'WhiteSpace' && (!buffer.length || lastType() === 'WhiteSpace')) {
                return;
            }

            buffer.push(node);
        });

        flush();
        node.children = new List$1().fromArray(newValue);
    };

    function removeItemAndRedundantWhiteSpace(list, item) {
        var prev = item.prev;
        var next = item.next;

        if (next !== null) {
            if (next.data.type === 'WhiteSpace' && (prev === null || prev.data.type === 'WhiteSpace')) {
                list.remove(next);
            }
        } else if (prev !== null && prev.data.type === 'WhiteSpace') {
            list.remove(prev);
        }

        list.remove(item);
    }

    var border = function compressBorder(node) {
        node.children.each(function(node, item, list) {
            if (node.type === 'Identifier' && node.name.toLowerCase() === 'none') {
                if (list.head === list.tail) {
                    // replace `none` for zero when `none` is a single term
                    item.data = {
                        type: 'Number',
                        loc: node.loc,
                        value: '0'
                    };
                } else {
                    removeItemAndRedundantWhiteSpace(list, item);
                }
            }
        });
    };

    var resolveName = lib.property;
    var handlers$1 = {
        'font': font,
        'font-weight': fontWeight,
        'background': background,
        'border': border,
        'outline': border
    };

    var Value$1 = function compressValue(node) {
        if (!this.declaration) {
            return;
        }

        var property = resolveName(this.declaration.property);

        if (handlers$1.hasOwnProperty(property.basename)) {
            handlers$1[property.basename](node);
        }
    };

    var OMIT_PLUSSIGN = /^(?:\+|(-))?0*(\d*)(?:\.0*|(\.\d*?)0*)?$/;
    var KEEP_PLUSSIGN = /^([\+\-])?0*(\d*)(?:\.0*|(\.\d*?)0*)?$/;
    var unsafeToRemovePlusSignAfter = {
        Dimension: true,
        HexColor: true,
        Identifier: true,
        Number: true,
        Raw: true,
        UnicodeRange: true
    };

    function packNumber(value, item) {
        // omit plus sign only if no prev or prev is safe type
        var regexp = item && item.prev !== null && unsafeToRemovePlusSignAfter.hasOwnProperty(item.prev.data.type)
            ? KEEP_PLUSSIGN
            : OMIT_PLUSSIGN;

        // 100 -> '100'
        // 00100 -> '100'
        // +100 -> '100' (only when safe, e.g. omitting plus sign for 1px+1px leads to single dimension instead of two)
        // -100 -> '-100'
        // 0.123 -> '.123'
        // 0.12300 -> '.123'
        // 0.0 -> ''
        // 0 -> ''
        // -0 -> '-'
        value = String(value).replace(regexp, '$1$2$3');

        if (value === '' || value === '-') {
            value = '0';
        }

        return value;
    }

    var _Number$1 = function(node, item) {
        node.value = packNumber(node.value, item);
    };
    var pack = packNumber;
    _Number$1.pack = pack;

    var packNumber$1 = _Number$1.pack;
    var LENGTH_UNIT = {
        // absolute length units
        'px': true,
        'mm': true,
        'cm': true,
        'in': true,
        'pt': true,
        'pc': true,

        // relative length units
        'em': true,
        'ex': true,
        'ch': true,
        'rem': true,

        // viewport-percentage lengths
        'vh': true,
        'vw': true,
        'vmin': true,
        'vmax': true,
        'vm': true
    };

    var Dimension$1 = function compressDimension(node, item) {
        var value = packNumber$1(node.value, item);

        node.value = value;

        if (value === '0' && this.declaration !== null && this.atrulePrelude === null) {
            var unit = node.unit.toLowerCase();

            // only length values can be compressed
            if (!LENGTH_UNIT.hasOwnProperty(unit)) {
                return;
            }

            // issue #362: shouldn't remove unit in -ms-flex since it breaks flex in IE10/11
            // issue #200: shouldn't remove unit in flex since it breaks flex in IE10/11
            if (this.declaration.property === '-ms-flex' ||
                this.declaration.property === 'flex') {
                return;
            }

            // issue #222: don't remove units inside calc
            if (this.function && this.function.name === 'calc') {
                return;
            }

            item.data = {
                type: 'Number',
                loc: node.loc,
                value: value
            };
        }
    };

    var lexer$1 = lib.lexer;
    var packNumber$2 = _Number$1.pack;
    var blacklist = new Set([
        // see https://github.com/jakubpawlowicz/clean-css/issues/957
        'width',
        'min-width',
        'max-width',
        'height',
        'min-height',
        'max-height',

        // issue #410: Don’t remove units in flex-basis value for (-ms-)flex shorthand
        // issue #362: shouldn't remove unit in -ms-flex since it breaks flex in IE10/11
        // issue #200: shouldn't remove unit in flex since it breaks flex in IE10/11
        'flex',
        '-ms-flex'
    ]);

    var Percentage$1 = function compressPercentage(node, item) {
        node.value = packNumber$2(node.value, item);

        if (node.value === '0' && this.declaration && !blacklist.has(this.declaration.property)) {
            // try to convert a number
            item.data = {
                type: 'Number',
                loc: node.loc,
                value: node.value
            };

            // that's ok only when new value matches on length
            if (!lexer$1.matchDeclaration(this.declaration).isType(item.data, 'length')) {
                // otherwise rollback changes
                item.data = node;
            }
        }
    };

    var _String$1 = function(node) {
        var value = node.value;

        // remove escaped newlines, i.e.
        // .a { content: "foo\
        // bar"}
        // ->
        // .a { content: "foobar" }
        value = value.replace(/\\(\r\n|\r|\n|\f)/g, '');

        node.value = value;
    };

    var UNICODE = '\\\\[0-9a-f]{1,6}(\\r\\n|[ \\n\\r\\t\\f])?';
    var ESCAPE = '(' + UNICODE + '|\\\\[^\\n\\r\\f0-9a-fA-F])';
    var NONPRINTABLE = '\u0000\u0008\u000b\u000e-\u001f\u007f';
    var SAFE_URL = new RegExp('^(' + ESCAPE + '|[^\"\'\\(\\)\\\\\\s' + NONPRINTABLE + '])*$', 'i');

    var Url$1 = function(node) {
        var value = node.value;

        if (value.type !== 'String') {
            return;
        }

        var quote = value.value[0];
        var url = value.value.substr(1, value.value.length - 2);

        // convert `\\` to `/`
        url = url.replace(/\\\\/g, '/');

        // remove quotes when safe
        // https://www.w3.org/TR/css-syntax-3/#url-unquoted-diagram
        if (SAFE_URL.test(url)) {
            node.value = {
                type: 'Raw',
                loc: node.value.loc,
                value: url
            };
        } else {
            // use double quotes if string has no double quotes
            // otherwise use original quotes
            // TODO: make better quote type selection
            node.value.value = url.indexOf('"') === -1 ? '"' + url + '"' : quote + url + quote;
        }
    };

    var lexer$2 = lib.lexer;
    var packNumber$3 = _Number$1.pack;

    // http://www.w3.org/TR/css3-color/#svg-color
    var NAME_TO_HEX = {
        'aliceblue': 'f0f8ff',
        'antiquewhite': 'faebd7',
        'aqua': '0ff',
        'aquamarine': '7fffd4',
        'azure': 'f0ffff',
        'beige': 'f5f5dc',
        'bisque': 'ffe4c4',
        'black': '000',
        'blanchedalmond': 'ffebcd',
        'blue': '00f',
        'blueviolet': '8a2be2',
        'brown': 'a52a2a',
        'burlywood': 'deb887',
        'cadetblue': '5f9ea0',
        'chartreuse': '7fff00',
        'chocolate': 'd2691e',
        'coral': 'ff7f50',
        'cornflowerblue': '6495ed',
        'cornsilk': 'fff8dc',
        'crimson': 'dc143c',
        'cyan': '0ff',
        'darkblue': '00008b',
        'darkcyan': '008b8b',
        'darkgoldenrod': 'b8860b',
        'darkgray': 'a9a9a9',
        'darkgrey': 'a9a9a9',
        'darkgreen': '006400',
        'darkkhaki': 'bdb76b',
        'darkmagenta': '8b008b',
        'darkolivegreen': '556b2f',
        'darkorange': 'ff8c00',
        'darkorchid': '9932cc',
        'darkred': '8b0000',
        'darksalmon': 'e9967a',
        'darkseagreen': '8fbc8f',
        'darkslateblue': '483d8b',
        'darkslategray': '2f4f4f',
        'darkslategrey': '2f4f4f',
        'darkturquoise': '00ced1',
        'darkviolet': '9400d3',
        'deeppink': 'ff1493',
        'deepskyblue': '00bfff',
        'dimgray': '696969',
        'dimgrey': '696969',
        'dodgerblue': '1e90ff',
        'firebrick': 'b22222',
        'floralwhite': 'fffaf0',
        'forestgreen': '228b22',
        'fuchsia': 'f0f',
        'gainsboro': 'dcdcdc',
        'ghostwhite': 'f8f8ff',
        'gold': 'ffd700',
        'goldenrod': 'daa520',
        'gray': '808080',
        'grey': '808080',
        'green': '008000',
        'greenyellow': 'adff2f',
        'honeydew': 'f0fff0',
        'hotpink': 'ff69b4',
        'indianred': 'cd5c5c',
        'indigo': '4b0082',
        'ivory': 'fffff0',
        'khaki': 'f0e68c',
        'lavender': 'e6e6fa',
        'lavenderblush': 'fff0f5',
        'lawngreen': '7cfc00',
        'lemonchiffon': 'fffacd',
        'lightblue': 'add8e6',
        'lightcoral': 'f08080',
        'lightcyan': 'e0ffff',
        'lightgoldenrodyellow': 'fafad2',
        'lightgray': 'd3d3d3',
        'lightgrey': 'd3d3d3',
        'lightgreen': '90ee90',
        'lightpink': 'ffb6c1',
        'lightsalmon': 'ffa07a',
        'lightseagreen': '20b2aa',
        'lightskyblue': '87cefa',
        'lightslategray': '789',
        'lightslategrey': '789',
        'lightsteelblue': 'b0c4de',
        'lightyellow': 'ffffe0',
        'lime': '0f0',
        'limegreen': '32cd32',
        'linen': 'faf0e6',
        'magenta': 'f0f',
        'maroon': '800000',
        'mediumaquamarine': '66cdaa',
        'mediumblue': '0000cd',
        'mediumorchid': 'ba55d3',
        'mediumpurple': '9370db',
        'mediumseagreen': '3cb371',
        'mediumslateblue': '7b68ee',
        'mediumspringgreen': '00fa9a',
        'mediumturquoise': '48d1cc',
        'mediumvioletred': 'c71585',
        'midnightblue': '191970',
        'mintcream': 'f5fffa',
        'mistyrose': 'ffe4e1',
        'moccasin': 'ffe4b5',
        'navajowhite': 'ffdead',
        'navy': '000080',
        'oldlace': 'fdf5e6',
        'olive': '808000',
        'olivedrab': '6b8e23',
        'orange': 'ffa500',
        'orangered': 'ff4500',
        'orchid': 'da70d6',
        'palegoldenrod': 'eee8aa',
        'palegreen': '98fb98',
        'paleturquoise': 'afeeee',
        'palevioletred': 'db7093',
        'papayawhip': 'ffefd5',
        'peachpuff': 'ffdab9',
        'peru': 'cd853f',
        'pink': 'ffc0cb',
        'plum': 'dda0dd',
        'powderblue': 'b0e0e6',
        'purple': '800080',
        'rebeccapurple': '639',
        'red': 'f00',
        'rosybrown': 'bc8f8f',
        'royalblue': '4169e1',
        'saddlebrown': '8b4513',
        'salmon': 'fa8072',
        'sandybrown': 'f4a460',
        'seagreen': '2e8b57',
        'seashell': 'fff5ee',
        'sienna': 'a0522d',
        'silver': 'c0c0c0',
        'skyblue': '87ceeb',
        'slateblue': '6a5acd',
        'slategray': '708090',
        'slategrey': '708090',
        'snow': 'fffafa',
        'springgreen': '00ff7f',
        'steelblue': '4682b4',
        'tan': 'd2b48c',
        'teal': '008080',
        'thistle': 'd8bfd8',
        'tomato': 'ff6347',
        'turquoise': '40e0d0',
        'violet': 'ee82ee',
        'wheat': 'f5deb3',
        'white': 'fff',
        'whitesmoke': 'f5f5f5',
        'yellow': 'ff0',
        'yellowgreen': '9acd32'
    };

    var HEX_TO_NAME = {
        '800000': 'maroon',
        '800080': 'purple',
        '808000': 'olive',
        '808080': 'gray',
        '00ffff': 'cyan',
        'f0ffff': 'azure',
        'f5f5dc': 'beige',
        'ffe4c4': 'bisque',
        '000000': 'black',
        '0000ff': 'blue',
        'a52a2a': 'brown',
        'ff7f50': 'coral',
        'ffd700': 'gold',
        '008000': 'green',
        '4b0082': 'indigo',
        'fffff0': 'ivory',
        'f0e68c': 'khaki',
        '00ff00': 'lime',
        'faf0e6': 'linen',
        '000080': 'navy',
        'ffa500': 'orange',
        'da70d6': 'orchid',
        'cd853f': 'peru',
        'ffc0cb': 'pink',
        'dda0dd': 'plum',
        'f00': 'red',
        'ff0000': 'red',
        'fa8072': 'salmon',
        'a0522d': 'sienna',
        'c0c0c0': 'silver',
        'fffafa': 'snow',
        'd2b48c': 'tan',
        '008080': 'teal',
        'ff6347': 'tomato',
        'ee82ee': 'violet',
        'f5deb3': 'wheat',
        'ffffff': 'white',
        'ffff00': 'yellow'
    };

    function hueToRgb(p, q, t) {
        if (t < 0) {
            t += 1;
        }
        if (t > 1) {
            t -= 1;
        }
        if (t < 1 / 6) {
            return p + (q - p) * 6 * t;
        }
        if (t < 1 / 2) {
            return q;
        }
        if (t < 2 / 3) {
            return p + (q - p) * (2 / 3 - t) * 6;
        }
        return p;
    }

    function hslToRgb(h, s, l, a) {
        var r;
        var g;
        var b;

        if (s === 0) {
            r = g = b = l; // achromatic
        } else {
            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;

            r = hueToRgb(p, q, h + 1 / 3);
            g = hueToRgb(p, q, h);
            b = hueToRgb(p, q, h - 1 / 3);
        }

        return [
            Math.round(r * 255),
            Math.round(g * 255),
            Math.round(b * 255),
            a
        ];
    }

    function toHex(value) {
        value = value.toString(16);
        return value.length === 1 ? '0' + value : value;
    }

    function parseFunctionArgs(functionArgs, count, rgb) {
        var cursor = functionArgs.head;
        var args = [];
        var wasValue = false;

        while (cursor !== null) {
            var node = cursor.data;
            var type = node.type;

            switch (type) {
                case 'Number':
                case 'Percentage':
                    if (wasValue) {
                        return;
                    }

                    wasValue = true;
                    args.push({
                        type: type,
                        value: Number(node.value)
                    });
                    break;

                case 'Operator':
                    if (node.value === ',') {
                        if (!wasValue) {
                            return;
                        }
                        wasValue = false;
                    } else if (wasValue || node.value !== '+') {
                        return;
                    }
                    break;

                default:
                    // something we couldn't understand
                    return;
            }

            cursor = cursor.next;
        }

        if (args.length !== count) {
            // invalid arguments count
            // TODO: remove those tokens
            return;
        }

        if (args.length === 4) {
            if (args[3].type !== 'Number') {
                // 4th argument should be a number
                // TODO: remove those tokens
                return;
            }

            args[3].type = 'Alpha';
        }

        if (rgb) {
            if (args[0].type !== args[1].type || args[0].type !== args[2].type) {
                // invalid color, numbers and percentage shouldn't be mixed
                // TODO: remove those tokens
                return;
            }
        } else {
            if (args[0].type !== 'Number' ||
                args[1].type !== 'Percentage' ||
                args[2].type !== 'Percentage') {
                // invalid color, for hsl values should be: number, percentage, percentage
                // TODO: remove those tokens
                return;
            }

            args[0].type = 'Angle';
        }

        return args.map(function(arg) {
            var value = Math.max(0, arg.value);

            switch (arg.type) {
                case 'Number':
                    // fit value to [0..255] range
                    value = Math.min(value, 255);
                    break;

                case 'Percentage':
                    // convert 0..100% to value in [0..255] range
                    value = Math.min(value, 100) / 100;

                    if (!rgb) {
                        return value;
                    }

                    value = 255 * value;
                    break;

                case 'Angle':
                    // fit value to (-360..360) range
                    return (((value % 360) + 360) % 360) / 360;

                case 'Alpha':
                    // fit value to [0..1] range
                    return Math.min(value, 1);
            }

            return Math.round(value);
        });
    }

    function compressFunction(node, item, list) {
        var functionName = node.name;
        var args;

        if (functionName === 'rgba' || functionName === 'hsla') {
            args = parseFunctionArgs(node.children, 4, functionName === 'rgba');

            if (!args) {
                // something went wrong
                return;
            }

            if (functionName === 'hsla') {
                args = hslToRgb.apply(null, args);
                node.name = 'rgba';
            }

            if (args[3] === 0) {
                // try to replace `rgba(x, x, x, 0)` to `transparent`
                // always replace `rgba(0, 0, 0, 0)` to `transparent`
                // otherwise avoid replacement in gradients since it may break color transition
                // http://stackoverflow.com/questions/11829410/css3-gradient-rendering-issues-from-transparent-to-white
                var scopeFunctionName = this.function && this.function.name;
                if ((args[0] === 0 && args[1] === 0 && args[2] === 0) ||
                    !/^(?:to|from|color-stop)$|gradient$/i.test(scopeFunctionName)) {

                    item.data = {
                        type: 'Identifier',
                        loc: node.loc,
                        name: 'transparent'
                    };

                    return;
                }
            }

            if (args[3] !== 1) {
                // replace argument values for normalized/interpolated
                node.children.each(function(node, item, list) {
                    if (node.type === 'Operator') {
                        if (node.value !== ',') {
                            list.remove(item);
                        }
                        return;
                    }

                    item.data = {
                        type: 'Number',
                        loc: node.loc,
                        value: packNumber$3(args.shift(), null)
                    };
                });

                return;
            }

            // otherwise convert to rgb, i.e. rgba(255, 0, 0, 1) -> rgb(255, 0, 0)
            functionName = 'rgb';
        }

        if (functionName === 'hsl') {
            args = args || parseFunctionArgs(node.children, 3, false);

            if (!args) {
                // something went wrong
                return;
            }

            // convert to rgb
            args = hslToRgb.apply(null, args);
            functionName = 'rgb';
        }

        if (functionName === 'rgb') {
            args = args || parseFunctionArgs(node.children, 3, true);

            if (!args) {
                // something went wrong
                return;
            }

            // check if color is not at the end and not followed by space
            var next = item.next;
            if (next && next.data.type !== 'WhiteSpace') {
                list.insert(list.createItem({
                    type: 'WhiteSpace',
                    value: ' '
                }), next);
            }

            item.data = {
                type: 'HexColor',
                loc: node.loc,
                value: toHex(args[0]) + toHex(args[1]) + toHex(args[2])
            };

            compressHex(item.data, item);
        }
    }

    function compressIdent(node, item) {
        if (this.declaration === null) {
            return;
        }

        var color = node.name.toLowerCase();

        if (NAME_TO_HEX.hasOwnProperty(color) &&
            lexer$2.matchDeclaration(this.declaration).isType(node, 'color')) {
            var hex = NAME_TO_HEX[color];

            if (hex.length + 1 <= color.length) {
                // replace for shorter hex value
                item.data = {
                    type: 'HexColor',
                    loc: node.loc,
                    value: hex
                };
            } else {
                // special case for consistent colors
                if (color === 'grey') {
                    color = 'gray';
                }

                // just replace value for lower cased name
                node.name = color;
            }
        }
    }

    function compressHex(node, item) {
        var color = node.value.toLowerCase();

        // #112233 -> #123
        if (color.length === 6 &&
            color[0] === color[1] &&
            color[2] === color[3] &&
            color[4] === color[5]) {
            color = color[0] + color[2] + color[4];
        }

        if (HEX_TO_NAME[color]) {
            item.data = {
                type: 'Identifier',
                loc: node.loc,
                name: HEX_TO_NAME[color]
            };
        } else {
            node.value = color;
        }
    }

    var color = {
        compressFunction: compressFunction,
        compressIdent: compressIdent,
        compressHex: compressHex
    };

    var walk$3 = lib.walk;
    var handlers$2 = {
        Atrule: Atrule$2,
        AttributeSelector: AttributeSelector$1,
        Value: Value$1,
        Dimension: Dimension$1,
        Percentage: Percentage$1,
        Number: _Number$1,
        String: _String$1,
        Url: Url$1,
        HexColor: color.compressHex,
        Identifier: color.compressIdent,
        Function: color.compressFunction
    };

    var replace = function(ast) {
        walk$3(ast, {
            leave: function(node, item, list) {
                if (handlers$2.hasOwnProperty(node.type)) {
                    handlers$2[node.type].call(this, node, item, list);
                }
            }
        });
    };

    var generate$1 = lib.generate;

    function Index() {
        this.seed = 0;
        this.map = Object.create(null);
    }

    Index.prototype.resolve = function(str) {
        var index = this.map[str];

        if (!index) {
            index = ++this.seed;
            this.map[str] = index;
        }

        return index;
    };

    var createDeclarationIndexer = function createDeclarationIndexer() {
        var ids = new Index();

        return function markDeclaration(node) {
            var id = generate$1(node);

            node.id = ids.resolve(id);
            node.length = id.length;
            node.fingerprint = null;

            return node;
        };
    };

    var specificity = function specificity(simpleSelector) {
        var A = 0;
        var B = 0;
        var C = 0;

        simpleSelector.children.each(function walk(node) {
            switch (node.type) {
                case 'SelectorList':
                case 'Selector':
                    node.children.each(walk);
                    break;

                case 'IdSelector':
                    A++;
                    break;

                case 'ClassSelector':
                case 'AttributeSelector':
                    B++;
                    break;

                case 'PseudoClassSelector':
                    switch (node.name.toLowerCase()) {
                        case 'not':
                            node.children.each(walk);
                            break;

                        case 'before':
                        case 'after':
                        case 'first-line':
                        case 'first-letter':
                            C++;
                            break;

                        // TODO: support for :nth-*(.. of <SelectorList>), :matches(), :has()
                        default:
                            B++;
                    }
                    break;

                case 'PseudoElementSelector':
                    C++;
                    break;

                case 'TypeSelector':
                    // ignore universal selector
                    if (node.name.charAt(node.name.length - 1) !== '*') {
                        C++;
                    }
                    break;

            }
        });

        return [A, B, C];
    };

    var generate$2 = lib.generate;


    var nonFreezePseudoElements = {
        'first-letter': true,
        'first-line': true,
        'after': true,
        'before': true
    };
    var nonFreezePseudoClasses = {
        'link': true,
        'visited': true,
        'hover': true,
        'active': true,
        'first-letter': true,
        'first-line': true,
        'after': true,
        'before': true
    };

    var processSelector = function freeze(node, usageData) {
        var pseudos = Object.create(null);
        var hasPseudo = false;

        node.prelude.children.each(function(simpleSelector) {
            var tagName = '*';
            var scope = 0;

            simpleSelector.children.each(function(node) {
                switch (node.type) {
                    case 'ClassSelector':
                        if (usageData && usageData.scopes) {
                            var classScope = usageData.scopes[node.name] || 0;

                            if (scope !== 0 && classScope !== scope) {
                                throw new Error('Selector can\'t has classes from different scopes: ' + generate$2(simpleSelector));
                            }

                            scope = classScope;
                        }
                        break;

                    case 'PseudoClassSelector':
                        var name = node.name.toLowerCase();

                        if (!nonFreezePseudoClasses.hasOwnProperty(name)) {
                            pseudos[name] = true;
                            hasPseudo = true;
                        }
                        break;

                    case 'PseudoElementSelector':
                        var name = node.name.toLowerCase();

                        if (!nonFreezePseudoElements.hasOwnProperty(name)) {
                            pseudos[name] = true;
                            hasPseudo = true;
                        }
                        break;

                    case 'TypeSelector':
                        tagName = node.name.toLowerCase();
                        break;

                    case 'AttributeSelector':
                        if (node.flags) {
                            pseudos['[' + node.flags.toLowerCase() + ']'] = true;
                            hasPseudo = true;
                        }
                        break;

                    case 'WhiteSpace':
                    case 'Combinator':
                        tagName = '*';
                        break;
                }
            });

            simpleSelector.compareMarker = specificity(simpleSelector).toString();
            simpleSelector.id = null; // pre-init property to avoid multiple hidden class
            simpleSelector.id = generate$2(simpleSelector);

            if (scope) {
                simpleSelector.compareMarker += ':' + scope;
            }

            if (tagName !== '*') {
                simpleSelector.compareMarker += ',' + tagName;
            }
        });

        // add property to all rule nodes to avoid multiple hidden class
        node.pseudoSignature = hasPseudo && Object.keys(pseudos).sort().join(',');
    };

    var resolveKeyword$2 = lib.keyword;
    var walk$4 = lib.walk;
    var generate$3 = lib.generate;



    var prepare = function prepare(ast, options) {
        var markDeclaration = createDeclarationIndexer();

        walk$4(ast, {
            visit: 'Rule',
            enter: function processRule(node) {
                node.block.children.each(markDeclaration);
                processSelector(node, options.usage);
            }
        });

        walk$4(ast, {
            visit: 'Atrule',
            enter: function(node) {
                if (node.prelude) {
                    node.prelude.id = null; // pre-init property to avoid multiple hidden class for generate
                    node.prelude.id = generate$3(node.prelude);
                }

                // compare keyframe selectors by its values
                // NOTE: still no clarification about problems with keyframes selector grouping (issue #197)
                if (resolveKeyword$2(node.name).basename === 'keyframes') {
                    node.block.avoidRulesMerge = true;  /* probably we don't need to prevent those merges for @keyframes
                                                           TODO: need to be checked */
                    node.block.children.each(function(rule) {
                        rule.prelude.children.each(function(simpleselector) {
                            simpleselector.compareMarker = simpleselector.id;
                        });
                    });
                }
            }
        });

        return {
            declaration: markDeclaration
        };
    };

    var List$2 = lib.List;
    var resolveKeyword$3 = lib.keyword;
    var hasOwnProperty$8 = Object.prototype.hasOwnProperty;
    var walk$5 = lib.walk;

    function addRuleToMap(map, item, list, single) {
        var node = item.data;
        var name = resolveKeyword$3(node.name).basename;
        var id = node.name.toLowerCase() + '/' + (node.prelude ? node.prelude.id : null);

        if (!hasOwnProperty$8.call(map, name)) {
            map[name] = Object.create(null);
        }

        if (single) {
            delete map[name][id];
        }

        if (!hasOwnProperty$8.call(map[name], id)) {
            map[name][id] = new List$2();
        }

        map[name][id].append(list.remove(item));
    }

    function relocateAtrules(ast, options) {
        var collected = Object.create(null);
        var topInjectPoint = null;

        ast.children.each(function(node, item, list) {
            if (node.type === 'Atrule') {
                var name = resolveKeyword$3(node.name).basename;

                switch (name) {
                    case 'keyframes':
                        addRuleToMap(collected, item, list, true);
                        return;

                    case 'media':
                        if (options.forceMediaMerge) {
                            addRuleToMap(collected, item, list, false);
                            return;
                        }
                        break;
                }

                if (topInjectPoint === null &&
                    name !== 'charset' &&
                    name !== 'import') {
                    topInjectPoint = item;
                }
            } else {
                if (topInjectPoint === null) {
                    topInjectPoint = item;
                }
            }
        });

        for (var atrule in collected) {
            for (var id in collected[atrule]) {
                ast.children.insertList(
                    collected[atrule][id],
                    atrule === 'media' ? null : topInjectPoint
                );
            }
        }
    }
    function isMediaRule(node) {
        return node.type === 'Atrule' && node.name === 'media';
    }

    function processAtrule(node, item, list) {
        if (!isMediaRule(node)) {
            return;
        }

        var prev = item.prev && item.prev.data;

        if (!prev || !isMediaRule(prev)) {
            return;
        }

        // merge @media with same query
        if (node.prelude &&
            prev.prelude &&
            node.prelude.id === prev.prelude.id) {
            prev.block.children.appendList(node.block.children);
            list.remove(item);

            // TODO: use it when we can refer to several points in source
            // prev.loc = {
            //     primary: prev.loc,
            //     merged: node.loc
            // };
        }
    }

    var _1MergeAtrule = function rejoinAtrule(ast, options) {
        relocateAtrules(ast, options);

        walk$5(ast, {
            visit: 'Atrule',
            reverse: true,
            enter: processAtrule
        });
    };

    var hasOwnProperty$9 = Object.prototype.hasOwnProperty;

    function isEqualSelectors(a, b) {
        var cursor1 = a.head;
        var cursor2 = b.head;

        while (cursor1 !== null && cursor2 !== null && cursor1.data.id === cursor2.data.id) {
            cursor1 = cursor1.next;
            cursor2 = cursor2.next;
        }

        return cursor1 === null && cursor2 === null;
    }

    function isEqualDeclarations(a, b) {
        var cursor1 = a.head;
        var cursor2 = b.head;

        while (cursor1 !== null && cursor2 !== null && cursor1.data.id === cursor2.data.id) {
            cursor1 = cursor1.next;
            cursor2 = cursor2.next;
        }

        return cursor1 === null && cursor2 === null;
    }

    function compareDeclarations(declarations1, declarations2) {
        var result = {
            eq: [],
            ne1: [],
            ne2: [],
            ne2overrided: []
        };

        var fingerprints = Object.create(null);
        var declarations2hash = Object.create(null);

        for (var cursor = declarations2.head; cursor; cursor = cursor.next)  {
            declarations2hash[cursor.data.id] = true;
        }

        for (var cursor = declarations1.head; cursor; cursor = cursor.next)  {
            var data = cursor.data;

            if (data.fingerprint) {
                fingerprints[data.fingerprint] = data.important;
            }

            if (declarations2hash[data.id]) {
                declarations2hash[data.id] = false;
                result.eq.push(data);
            } else {
                result.ne1.push(data);
            }
        }

        for (var cursor = declarations2.head; cursor; cursor = cursor.next)  {
            var data = cursor.data;

            if (declarations2hash[data.id]) {
                // when declarations1 has an overriding declaration, this is not a difference
                // unless no !important is used on prev and !important is used on the following
                if (!hasOwnProperty$9.call(fingerprints, data.fingerprint) ||
                    (!fingerprints[data.fingerprint] && data.important)) {
                    result.ne2.push(data);
                }

                result.ne2overrided.push(data);
            }
        }

        return result;
    }

    function addSelectors(dest, source) {
        source.each(function(sourceData) {
            var newStr = sourceData.id;
            var cursor = dest.head;

            while (cursor) {
                var nextStr = cursor.data.id;

                if (nextStr === newStr) {
                    return;
                }

                if (nextStr > newStr) {
                    break;
                }

                cursor = cursor.next;
            }

            dest.insert(dest.createItem(sourceData), cursor);
        });

        return dest;
    }

    // check if simpleselectors has no equal specificity and element selector
    function hasSimilarSelectors(selectors1, selectors2) {
        var cursor1 = selectors1.head;

        while (cursor1 !== null) {
            var cursor2 = selectors2.head;

            while (cursor2 !== null) {
                if (cursor1.data.compareMarker === cursor2.data.compareMarker) {
                    return true;
                }

                cursor2 = cursor2.next;
            }

            cursor1 = cursor1.next;
        }

        return false;
    }

    // test node can't to be skipped
    function unsafeToSkipNode(node) {
        switch (node.type) {
            case 'Rule':
                // unsafe skip ruleset with selector similarities
                return hasSimilarSelectors(node.prelude.children, this);

            case 'Atrule':
                // can skip at-rules with blocks
                if (node.block) {
                    // unsafe skip at-rule if block contains something unsafe to skip
                    return node.block.children.some(unsafeToSkipNode, this);
                }
                break;

            case 'Declaration':
                return false;
        }

        // unsafe by default
        return true;
    }

    var utils$2 = {
        isEqualSelectors: isEqualSelectors,
        isEqualDeclarations: isEqualDeclarations,
        compareDeclarations: compareDeclarations,
        addSelectors: addSelectors,
        hasSimilarSelectors: hasSimilarSelectors,
        unsafeToSkipNode: unsafeToSkipNode
    };

    var walk$6 = lib.walk;


    function processRule(node, item, list) {
        var selectors = node.prelude.children;
        var declarations = node.block.children;

        list.prevUntil(item.prev, function(prev) {
            // skip non-ruleset node if safe
            if (prev.type !== 'Rule') {
                return utils$2.unsafeToSkipNode.call(selectors, prev);
            }

            var prevSelectors = prev.prelude.children;
            var prevDeclarations = prev.block.children;

            // try to join rulesets with equal pseudo signature
            if (node.pseudoSignature === prev.pseudoSignature) {
                // try to join by selectors
                if (utils$2.isEqualSelectors(prevSelectors, selectors)) {
                    prevDeclarations.appendList(declarations);
                    list.remove(item);
                    return true;
                }

                // try to join by declarations
                if (utils$2.isEqualDeclarations(declarations, prevDeclarations)) {
                    utils$2.addSelectors(prevSelectors, selectors);
                    list.remove(item);
                    return true;
                }
            }

            // go to prev ruleset if has no selector similarities
            return utils$2.hasSimilarSelectors(selectors, prevSelectors);
        });
    }

    // NOTE: direction should be left to right, since rulesets merge to left
    // ruleset. When direction right to left unmerged rulesets may prevent lookup
    // TODO: remove initial merge
    var _2InitialMergeRuleset = function initialMergeRule(ast) {
        walk$6(ast, {
            visit: 'Rule',
            enter: processRule
        });
    };

    var List$3 = lib.List;
    var walk$7 = lib.walk;

    function processRule$1(node, item, list) {
        var selectors = node.prelude.children;

        // generate new rule sets:
        // .a, .b { color: red; }
        // ->
        // .a { color: red; }
        // .b { color: red; }

        // while there are more than 1 simple selector split for rulesets
        while (selectors.head !== selectors.tail) {
            var newSelectors = new List$3();
            newSelectors.insert(selectors.remove(selectors.head));

            list.insert(list.createItem({
                type: 'Rule',
                loc: node.loc,
                prelude: {
                    type: 'SelectorList',
                    loc: node.prelude.loc,
                    children: newSelectors
                },
                block: {
                    type: 'Block',
                    loc: node.block.loc,
                    children: node.block.children.copy()
                },
                pseudoSignature: node.pseudoSignature
            }), item);
        }
    }

    var _3DisjoinRuleset = function disjoinRule(ast) {
        walk$7(ast, {
            visit: 'Rule',
            reverse: true,
            enter: processRule$1
        });
    };

    var List$4 = lib.List;
    var generate$4 = lib.generate;
    var walk$8 = lib.walk;

    var REPLACE = 1;
    var REMOVE = 2;
    var TOP = 0;
    var RIGHT = 1;
    var BOTTOM = 2;
    var LEFT = 3;
    var SIDES = ['top', 'right', 'bottom', 'left'];
    var SIDE = {
        'margin-top': 'top',
        'margin-right': 'right',
        'margin-bottom': 'bottom',
        'margin-left': 'left',

        'padding-top': 'top',
        'padding-right': 'right',
        'padding-bottom': 'bottom',
        'padding-left': 'left',

        'border-top-color': 'top',
        'border-right-color': 'right',
        'border-bottom-color': 'bottom',
        'border-left-color': 'left',
        'border-top-width': 'top',
        'border-right-width': 'right',
        'border-bottom-width': 'bottom',
        'border-left-width': 'left',
        'border-top-style': 'top',
        'border-right-style': 'right',
        'border-bottom-style': 'bottom',
        'border-left-style': 'left'
    };
    var MAIN_PROPERTY = {
        'margin': 'margin',
        'margin-top': 'margin',
        'margin-right': 'margin',
        'margin-bottom': 'margin',
        'margin-left': 'margin',

        'padding': 'padding',
        'padding-top': 'padding',
        'padding-right': 'padding',
        'padding-bottom': 'padding',
        'padding-left': 'padding',

        'border-color': 'border-color',
        'border-top-color': 'border-color',
        'border-right-color': 'border-color',
        'border-bottom-color': 'border-color',
        'border-left-color': 'border-color',
        'border-width': 'border-width',
        'border-top-width': 'border-width',
        'border-right-width': 'border-width',
        'border-bottom-width': 'border-width',
        'border-left-width': 'border-width',
        'border-style': 'border-style',
        'border-top-style': 'border-style',
        'border-right-style': 'border-style',
        'border-bottom-style': 'border-style',
        'border-left-style': 'border-style'
    };

    function TRBL(name) {
        this.name = name;
        this.loc = null;
        this.iehack = undefined;
        this.sides = {
            'top': null,
            'right': null,
            'bottom': null,
            'left': null
        };
    }

    TRBL.prototype.getValueSequence = function(declaration, count) {
        var values = [];
        var iehack = '';
        var hasBadValues = declaration.value.children.some(function(child) {
            var special = false;

            switch (child.type) {
                case 'Identifier':
                    switch (child.name) {
                        case '\\0':
                        case '\\9':
                            iehack = child.name;
                            return;

                        case 'inherit':
                        case 'initial':
                        case 'unset':
                        case 'revert':
                            special = child.name;
                            break;
                    }
                    break;

                case 'Dimension':
                    switch (child.unit) {
                        // is not supported until IE11
                        case 'rem':

                        // v* units is too buggy across browsers and better
                        // don't merge values with those units
                        case 'vw':
                        case 'vh':
                        case 'vmin':
                        case 'vmax':
                        case 'vm': // IE9 supporting "vm" instead of "vmin".
                            special = child.unit;
                            break;
                    }
                    break;

                case 'HexColor': // color
                case 'Number':
                case 'Percentage':
                    break;

                case 'Function':
                    special = child.name;
                    break;

                case 'WhiteSpace':
                    return false; // ignore space

                default:
                    return true;  // bad value
            }

            values.push({
                node: child,
                special: special,
                important: declaration.important
            });
        });

        if (hasBadValues || values.length > count) {
            return false;
        }

        if (typeof this.iehack === 'string' && this.iehack !== iehack) {
            return false;
        }

        this.iehack = iehack; // move outside

        return values;
    };

    TRBL.prototype.canOverride = function(side, value) {
        var currentValue = this.sides[side];

        return !currentValue || (value.important && !currentValue.important);
    };

    TRBL.prototype.add = function(name, declaration) {
        function attemptToAdd() {
            var sides = this.sides;
            var side = SIDE[name];

            if (side) {
                if (side in sides === false) {
                    return false;
                }

                var values = this.getValueSequence(declaration, 1);

                if (!values || !values.length) {
                    return false;
                }

                // can mix only if specials are equal
                for (var key in sides) {
                    if (sides[key] !== null && sides[key].special !== values[0].special) {
                        return false;
                    }
                }

                if (!this.canOverride(side, values[0])) {
                    return true;
                }

                sides[side] = values[0];
                return true;
            } else if (name === this.name) {
                var values = this.getValueSequence(declaration, 4);

                if (!values || !values.length) {
                    return false;
                }

                switch (values.length) {
                    case 1:
                        values[RIGHT] = values[TOP];
                        values[BOTTOM] = values[TOP];
                        values[LEFT] = values[TOP];
                        break;

                    case 2:
                        values[BOTTOM] = values[TOP];
                        values[LEFT] = values[RIGHT];
                        break;

                    case 3:
                        values[LEFT] = values[RIGHT];
                        break;
                }

                // can mix only if specials are equal
                for (var i = 0; i < 4; i++) {
                    for (var key in sides) {
                        if (sides[key] !== null && sides[key].special !== values[i].special) {
                            return false;
                        }
                    }
                }

                for (var i = 0; i < 4; i++) {
                    if (this.canOverride(SIDES[i], values[i])) {
                        sides[SIDES[i]] = values[i];
                    }
                }

                return true;
            }
        }

        if (!attemptToAdd.call(this)) {
            return false;
        }

        // TODO: use it when we can refer to several points in source
        // if (this.loc) {
        //     this.loc = {
        //         primary: this.loc,
        //         merged: declaration.loc
        //     };
        // } else {
        //     this.loc = declaration.loc;
        // }
        if (!this.loc) {
            this.loc = declaration.loc;
        }

        return true;
    };

    TRBL.prototype.isOkToMinimize = function() {
        var top = this.sides.top;
        var right = this.sides.right;
        var bottom = this.sides.bottom;
        var left = this.sides.left;

        if (top && right && bottom && left) {
            var important =
                top.important +
                right.important +
                bottom.important +
                left.important;

            return important === 0 || important === 4;
        }

        return false;
    };

    TRBL.prototype.getValue = function() {
        var result = new List$4();
        var sides = this.sides;
        var values = [
            sides.top,
            sides.right,
            sides.bottom,
            sides.left
        ];
        var stringValues = [
            generate$4(sides.top.node),
            generate$4(sides.right.node),
            generate$4(sides.bottom.node),
            generate$4(sides.left.node)
        ];

        if (stringValues[LEFT] === stringValues[RIGHT]) {
            values.pop();
            if (stringValues[BOTTOM] === stringValues[TOP]) {
                values.pop();
                if (stringValues[RIGHT] === stringValues[TOP]) {
                    values.pop();
                }
            }
        }

        for (var i = 0; i < values.length; i++) {
            if (i) {
                result.appendData({ type: 'WhiteSpace', value: ' ' });
            }

            result.appendData(values[i].node);
        }

        if (this.iehack) {
            result.appendData({ type: 'WhiteSpace', value: ' ' });
            result.appendData({
                type: 'Identifier',
                loc: null,
                name: this.iehack
            });
        }

        return {
            type: 'Value',
            loc: null,
            children: result
        };
    };

    TRBL.prototype.getDeclaration = function() {
        return {
            type: 'Declaration',
            loc: this.loc,
            important: this.sides.top.important,
            property: this.name,
            value: this.getValue()
        };
    };

    function processRule$2(rule, shorts, shortDeclarations, lastShortSelector) {
        var declarations = rule.block.children;
        var selector = rule.prelude.children.first().id;

        rule.block.children.eachRight(function(declaration, item) {
            var property = declaration.property;

            if (!MAIN_PROPERTY.hasOwnProperty(property)) {
                return;
            }

            var key = MAIN_PROPERTY[property];
            var shorthand;
            var operation;

            if (!lastShortSelector || selector === lastShortSelector) {
                if (key in shorts) {
                    operation = REMOVE;
                    shorthand = shorts[key];
                }
            }

            if (!shorthand || !shorthand.add(property, declaration)) {
                operation = REPLACE;
                shorthand = new TRBL(key);

                // if can't parse value ignore it and break shorthand children
                if (!shorthand.add(property, declaration)) {
                    lastShortSelector = null;
                    return;
                }
            }

            shorts[key] = shorthand;
            shortDeclarations.push({
                operation: operation,
                block: declarations,
                item: item,
                shorthand: shorthand
            });

            lastShortSelector = selector;
        });

        return lastShortSelector;
    }

    function processShorthands(shortDeclarations, markDeclaration) {
        shortDeclarations.forEach(function(item) {
            var shorthand = item.shorthand;

            if (!shorthand.isOkToMinimize()) {
                return;
            }

            if (item.operation === REPLACE) {
                item.item.data = markDeclaration(shorthand.getDeclaration());
            } else {
                item.block.remove(item.item);
            }
        });
    }

    var _4RestructShorthand = function restructBlock(ast, indexer) {
        var stylesheetMap = {};
        var shortDeclarations = [];

        walk$8(ast, {
            visit: 'Rule',
            reverse: true,
            enter: function(node) {
                var stylesheet = this.block || this.stylesheet;
                var ruleId = (node.pseudoSignature || '') + '|' + node.prelude.children.first().id;
                var ruleMap;
                var shorts;

                if (!stylesheetMap.hasOwnProperty(stylesheet.id)) {
                    ruleMap = {
                        lastShortSelector: null
                    };
                    stylesheetMap[stylesheet.id] = ruleMap;
                } else {
                    ruleMap = stylesheetMap[stylesheet.id];
                }

                if (ruleMap.hasOwnProperty(ruleId)) {
                    shorts = ruleMap[ruleId];
                } else {
                    shorts = {};
                    ruleMap[ruleId] = shorts;
                }

                ruleMap.lastShortSelector = processRule$2.call(this, node, shorts, shortDeclarations, ruleMap.lastShortSelector);
            }
        });

        processShorthands(shortDeclarations, indexer.declaration);
    };

    var resolveProperty = lib.property;
    var resolveKeyword$4 = lib.keyword;
    var walk$9 = lib.walk;
    var generate$5 = lib.generate;
    var fingerprintId = 1;
    var dontRestructure = {
        'src': 1 // https://github.com/afelix/csso/issues/50
    };

    var DONT_MIX_VALUE = {
        // https://developer.mozilla.org/en-US/docs/Web/CSS/display#Browser_compatibility
        'display': /table|ruby|flex|-(flex)?box$|grid|contents|run-in/i,
        // https://developer.mozilla.org/en/docs/Web/CSS/text-align
        'text-align': /^(start|end|match-parent|justify-all)$/i
    };

    var CURSOR_SAFE_VALUE = [
        'auto', 'crosshair', 'default', 'move', 'text', 'wait', 'help',
        'n-resize', 'e-resize', 's-resize', 'w-resize',
        'ne-resize', 'nw-resize', 'se-resize', 'sw-resize',
        'pointer', 'progress', 'not-allowed', 'no-drop', 'vertical-text', 'all-scroll',
        'col-resize', 'row-resize'
    ];

    var POSITION_SAFE_VALUE = [
        'static', 'relative', 'absolute', 'fixed'
    ];

    var NEEDLESS_TABLE = {
        'border-width': ['border'],
        'border-style': ['border'],
        'border-color': ['border'],
        'border-top': ['border'],
        'border-right': ['border'],
        'border-bottom': ['border'],
        'border-left': ['border'],
        'border-top-width': ['border-top', 'border-width', 'border'],
        'border-right-width': ['border-right', 'border-width', 'border'],
        'border-bottom-width': ['border-bottom', 'border-width', 'border'],
        'border-left-width': ['border-left', 'border-width', 'border'],
        'border-top-style': ['border-top', 'border-style', 'border'],
        'border-right-style': ['border-right', 'border-style', 'border'],
        'border-bottom-style': ['border-bottom', 'border-style', 'border'],
        'border-left-style': ['border-left', 'border-style', 'border'],
        'border-top-color': ['border-top', 'border-color', 'border'],
        'border-right-color': ['border-right', 'border-color', 'border'],
        'border-bottom-color': ['border-bottom', 'border-color', 'border'],
        'border-left-color': ['border-left', 'border-color', 'border'],
        'margin-top': ['margin'],
        'margin-right': ['margin'],
        'margin-bottom': ['margin'],
        'margin-left': ['margin'],
        'padding-top': ['padding'],
        'padding-right': ['padding'],
        'padding-bottom': ['padding'],
        'padding-left': ['padding'],
        'font-style': ['font'],
        'font-variant': ['font'],
        'font-weight': ['font'],
        'font-size': ['font'],
        'font-family': ['font'],
        'list-style-type': ['list-style'],
        'list-style-position': ['list-style'],
        'list-style-image': ['list-style']
    };

    function getPropertyFingerprint(propertyName, declaration, fingerprints) {
        var realName = resolveProperty(propertyName).basename;

        if (realName === 'background') {
            return propertyName + ':' + generate$5(declaration.value);
        }

        var declarationId = declaration.id;
        var fingerprint = fingerprints[declarationId];

        if (!fingerprint) {
            switch (declaration.value.type) {
                case 'Value':
                    var vendorId = '';
                    var iehack = '';
                    var special = {};
                    var raw = false;

                    declaration.value.children.each(function walk(node) {
                        switch (node.type) {
                            case 'Value':
                            case 'Brackets':
                            case 'Parentheses':
                                node.children.each(walk);
                                break;

                            case 'Raw':
                                raw = true;
                                break;

                            case 'Identifier':
                                var name = node.name;

                                if (!vendorId) {
                                    vendorId = resolveKeyword$4(name).vendor;
                                }

                                if (/\\[09]/.test(name)) {
                                    iehack = RegExp.lastMatch;
                                }

                                if (realName === 'cursor') {
                                    if (CURSOR_SAFE_VALUE.indexOf(name) === -1) {
                                        special[name] = true;
                                    }
                                } else if (realName === 'position') {
                                    if (POSITION_SAFE_VALUE.indexOf(name) === -1) {
                                        special[name] = true;
                                    }
                                } else if (DONT_MIX_VALUE.hasOwnProperty(realName)) {
                                    if (DONT_MIX_VALUE[realName].test(name)) {
                                        special[name] = true;
                                    }
                                }

                                break;

                            case 'Function':
                                var name = node.name;

                                if (!vendorId) {
                                    vendorId = resolveKeyword$4(name).vendor;
                                }

                                if (name === 'rect') {
                                    // there are 2 forms of rect:
                                    //   rect(<top>, <right>, <bottom>, <left>) - standart
                                    //   rect(<top> <right> <bottom> <left>) – backwards compatible syntax
                                    // only the same form values can be merged
                                    var hasComma = node.children.some(function(node) {
                                        return node.type === 'Operator' && node.value === ',';
                                    });
                                    if (!hasComma) {
                                        name = 'rect-backward';
                                    }
                                }

                                special[name + '()'] = true;

                                // check nested tokens too
                                node.children.each(walk);

                                break;

                            case 'Dimension':
                                var unit = node.unit;

                                if (/\\[09]/.test(unit)) {
                                    iehack = RegExp.lastMatch;
                                }

                                switch (unit) {
                                    // is not supported until IE11
                                    case 'rem':

                                    // v* units is too buggy across browsers and better
                                    // don't merge values with those units
                                    case 'vw':
                                    case 'vh':
                                    case 'vmin':
                                    case 'vmax':
                                    case 'vm': // IE9 supporting "vm" instead of "vmin".
                                        special[unit] = true;
                                        break;
                                }
                                break;
                        }
                    });

                    fingerprint = raw
                        ? '!' + fingerprintId++
                        : '!' + Object.keys(special).sort() + '|' + iehack + vendorId;
                    break;

                case 'Raw':
                    fingerprint = '!' + declaration.value.value;
                    break;

                default:
                    fingerprint = generate$5(declaration.value);
            }

            fingerprints[declarationId] = fingerprint;
        }

        return propertyName + fingerprint;
    }

    function needless(props, declaration, fingerprints) {
        var property = resolveProperty(declaration.property);

        if (NEEDLESS_TABLE.hasOwnProperty(property.basename)) {
            var table = NEEDLESS_TABLE[property.basename];

            for (var i = 0; i < table.length; i++) {
                var ppre = getPropertyFingerprint(property.prefix + table[i], declaration, fingerprints);
                var prev = props.hasOwnProperty(ppre) ? props[ppre] : null;

                if (prev && (!declaration.important || prev.item.data.important)) {
                    return prev;
                }
            }
        }
    }

    function processRule$3(rule, item, list, props, fingerprints) {
        var declarations = rule.block.children;

        declarations.eachRight(function(declaration, declarationItem) {
            var property = declaration.property;
            var fingerprint = getPropertyFingerprint(property, declaration, fingerprints);
            var prev = props[fingerprint];

            if (prev && !dontRestructure.hasOwnProperty(property)) {
                if (declaration.important && !prev.item.data.important) {
                    props[fingerprint] = {
                        block: declarations,
                        item: declarationItem
                    };

                    prev.block.remove(prev.item);

                    // TODO: use it when we can refer to several points in source
                    // declaration.loc = {
                    //     primary: declaration.loc,
                    //     merged: prev.item.data.loc
                    // };
                } else {
                    declarations.remove(declarationItem);

                    // TODO: use it when we can refer to several points in source
                    // prev.item.data.loc = {
                    //     primary: prev.item.data.loc,
                    //     merged: declaration.loc
                    // };
                }
            } else {
                var prev = needless(props, declaration, fingerprints);

                if (prev) {
                    declarations.remove(declarationItem);

                    // TODO: use it when we can refer to several points in source
                    // prev.item.data.loc = {
                    //     primary: prev.item.data.loc,
                    //     merged: declaration.loc
                    // };
                } else {
                    declaration.fingerprint = fingerprint;

                    props[fingerprint] = {
                        block: declarations,
                        item: declarationItem
                    };
                }
            }
        });

        if (declarations.isEmpty()) {
            list.remove(item);
        }
    }

    var _6RestructBlock = function restructBlock(ast) {
        var stylesheetMap = {};
        var fingerprints = Object.create(null);

        walk$9(ast, {
            visit: 'Rule',
            reverse: true,
            enter: function(node, item, list) {
                var stylesheet = this.block || this.stylesheet;
                var ruleId = (node.pseudoSignature || '') + '|' + node.prelude.children.first().id;
                var ruleMap;
                var props;

                if (!stylesheetMap.hasOwnProperty(stylesheet.id)) {
                    ruleMap = {};
                    stylesheetMap[stylesheet.id] = ruleMap;
                } else {
                    ruleMap = stylesheetMap[stylesheet.id];
                }

                if (ruleMap.hasOwnProperty(ruleId)) {
                    props = ruleMap[ruleId];
                } else {
                    props = {};
                    ruleMap[ruleId] = props;
                }

                processRule$3.call(this, node, item, list, props, fingerprints);
            }
        });
    };

    var walk$a = lib.walk;


    /*
        At this step all rules has single simple selector. We try to join by equal
        declaration blocks to first rule, e.g.

        .a { color: red }
        b { ... }
        .b { color: red }
        ->
        .a, .b { color: red }
        b { ... }
    */

    function processRule$4(node, item, list) {
        var selectors = node.prelude.children;
        var declarations = node.block.children;
        var nodeCompareMarker = selectors.first().compareMarker;
        var skippedCompareMarkers = {};

        list.nextUntil(item.next, function(next, nextItem) {
            // skip non-ruleset node if safe
            if (next.type !== 'Rule') {
                return utils$2.unsafeToSkipNode.call(selectors, next);
            }

            if (node.pseudoSignature !== next.pseudoSignature) {
                return true;
            }

            var nextFirstSelector = next.prelude.children.head;
            var nextDeclarations = next.block.children;
            var nextCompareMarker = nextFirstSelector.data.compareMarker;

            // if next ruleset has same marked as one of skipped then stop joining
            if (nextCompareMarker in skippedCompareMarkers) {
                return true;
            }

            // try to join by selectors
            if (selectors.head === selectors.tail) {
                if (selectors.first().id === nextFirstSelector.data.id) {
                    declarations.appendList(nextDeclarations);
                    list.remove(nextItem);
                    return;
                }
            }

            // try to join by properties
            if (utils$2.isEqualDeclarations(declarations, nextDeclarations)) {
                var nextStr = nextFirstSelector.data.id;

                selectors.some(function(data, item) {
                    var curStr = data.id;

                    if (nextStr < curStr) {
                        selectors.insert(nextFirstSelector, item);
                        return true;
                    }

                    if (!item.next) {
                        selectors.insert(nextFirstSelector);
                        return true;
                    }
                });

                list.remove(nextItem);
                return;
            }

            // go to next ruleset if current one can be skipped (has no equal specificity nor element selector)
            if (nextCompareMarker === nodeCompareMarker) {
                return true;
            }

            skippedCompareMarkers[nextCompareMarker] = true;
        });
    }

    var _7MergeRuleset = function mergeRule(ast) {
        walk$a(ast, {
            visit: 'Rule',
            enter: processRule$4
        });
    };

    var List$5 = lib.List;
    var walk$b = lib.walk;


    function calcSelectorLength(list) {
        var length = 0;

        list.each(function(data) {
            length += data.id.length + 1;
        });

        return length - 1;
    }

    function calcDeclarationsLength(tokens) {
        var length = 0;

        for (var i = 0; i < tokens.length; i++) {
            length += tokens[i].length;
        }

        return (
            length +          // declarations
            tokens.length - 1 // delimeters
        );
    }

    function processRule$5(node, item, list) {
        var avoidRulesMerge = this.block !== null ? this.block.avoidRulesMerge : false;
        var selectors = node.prelude.children;
        var block = node.block;
        var disallowDownMarkers = Object.create(null);
        var allowMergeUp = true;
        var allowMergeDown = true;

        list.prevUntil(item.prev, function(prev, prevItem) {
            var prevBlock = prev.block;
            var prevType = prev.type;

            if (prevType !== 'Rule') {
                var unsafe = utils$2.unsafeToSkipNode.call(selectors, prev);

                if (!unsafe && prevType === 'Atrule' && prevBlock) {
                    walk$b(prevBlock, {
                        visit: 'Rule',
                        enter: function(node) {
                            node.prelude.children.each(function(data) {
                                disallowDownMarkers[data.compareMarker] = true;
                            });
                        }
                    });
                }

                return unsafe;
            }

            var prevSelectors = prev.prelude.children;

            if (node.pseudoSignature !== prev.pseudoSignature) {
                return true;
            }

            allowMergeDown = !prevSelectors.some(function(selector) {
                return selector.compareMarker in disallowDownMarkers;
            });

            // try prev ruleset if simpleselectors has no equal specifity and element selector
            if (!allowMergeDown && !allowMergeUp) {
                return true;
            }

            // try to join by selectors
            if (allowMergeUp && utils$2.isEqualSelectors(prevSelectors, selectors)) {
                prevBlock.children.appendList(block.children);
                list.remove(item);
                return true;
            }

            // try to join by properties
            var diff = utils$2.compareDeclarations(block.children, prevBlock.children);

            // console.log(diff.eq, diff.ne1, diff.ne2);

            if (diff.eq.length) {
                if (!diff.ne1.length && !diff.ne2.length) {
                    // equal blocks
                    if (allowMergeDown) {
                        utils$2.addSelectors(selectors, prevSelectors);
                        list.remove(prevItem);
                    }

                    return true;
                } else if (!avoidRulesMerge) { /* probably we don't need to prevent those merges for @keyframes
                                                  TODO: need to be checked */

                    if (diff.ne1.length && !diff.ne2.length) {
                        // prevBlock is subset block
                        var selectorLength = calcSelectorLength(selectors);
                        var blockLength = calcDeclarationsLength(diff.eq); // declarations length

                        if (allowMergeUp && selectorLength < blockLength) {
                            utils$2.addSelectors(prevSelectors, selectors);
                            block.children = new List$5().fromArray(diff.ne1);
                        }
                    } else if (!diff.ne1.length && diff.ne2.length) {
                        // node is subset of prevBlock
                        var selectorLength = calcSelectorLength(prevSelectors);
                        var blockLength = calcDeclarationsLength(diff.eq); // declarations length

                        if (allowMergeDown && selectorLength < blockLength) {
                            utils$2.addSelectors(selectors, prevSelectors);
                            prevBlock.children = new List$5().fromArray(diff.ne2);
                        }
                    } else {
                        // diff.ne1.length && diff.ne2.length
                        // extract equal block
                        var newSelector = {
                            type: 'SelectorList',
                            loc: null,
                            children: utils$2.addSelectors(prevSelectors.copy(), selectors)
                        };
                        var newBlockLength = calcSelectorLength(newSelector.children) + 2; // selectors length + curly braces length
                        var blockLength = calcDeclarationsLength(diff.eq); // declarations length

                        // create new ruleset if declarations length greater than
                        // ruleset description overhead
                        if (blockLength >= newBlockLength) {
                            var newItem = list.createItem({
                                type: 'Rule',
                                loc: null,
                                prelude: newSelector,
                                block: {
                                    type: 'Block',
                                    loc: null,
                                    children: new List$5().fromArray(diff.eq)
                                },
                                pseudoSignature: node.pseudoSignature
                            });

                            block.children = new List$5().fromArray(diff.ne1);
                            prevBlock.children = new List$5().fromArray(diff.ne2overrided);

                            if (allowMergeUp) {
                                list.insert(newItem, prevItem);
                            } else {
                                list.insert(newItem, item);
                            }

                            return true;
                        }
                    }
                }
            }

            if (allowMergeUp) {
                // TODO: disallow up merge only if any property interception only (i.e. diff.ne2overrided.length > 0);
                // await property families to find property interception correctly
                allowMergeUp = !prevSelectors.some(function(prevSelector) {
                    return selectors.some(function(selector) {
                        return selector.compareMarker === prevSelector.compareMarker;
                    });
                });
            }

            prevSelectors.each(function(data) {
                disallowDownMarkers[data.compareMarker] = true;
            });
        });
    }

    var _8RestructRuleset = function restructRule(ast) {
        walk$b(ast, {
            visit: 'Rule',
            reverse: true,
            enter: processRule$5
        });
    };

    var restructure = function(ast, options) {
        // prepare ast for restructing
        var indexer = prepare(ast, options);
        options.logger('prepare', ast);

        _1MergeAtrule(ast, options);
        options.logger('mergeAtrule', ast);

        _2InitialMergeRuleset(ast);
        options.logger('initialMergeRuleset', ast);

        _3DisjoinRuleset(ast);
        options.logger('disjoinRuleset', ast);

        _4RestructShorthand(ast, indexer);
        options.logger('restructShorthand', ast);

        _6RestructBlock(ast);
        options.logger('restructBlock', ast);

        _7MergeRuleset(ast);
        options.logger('mergeRuleset', ast);

        _8RestructRuleset(ast);
        options.logger('restructRuleset', ast);
    };

    var List$6 = lib.List;
    var clone$1 = lib.clone;




    var walk$c = lib.walk;

    function readChunk(children, specialComments) {
        var buffer = new List$6();
        var nonSpaceTokenInBuffer = false;
        var protectedComment;

        children.nextUntil(children.head, function(node, item, list) {
            if (node.type === 'Comment') {
                if (!specialComments || node.value.charAt(0) !== '!') {
                    list.remove(item);
                    return;
                }

                if (nonSpaceTokenInBuffer || protectedComment) {
                    return true;
                }

                list.remove(item);
                protectedComment = node;
                return;
            }

            if (node.type !== 'WhiteSpace') {
                nonSpaceTokenInBuffer = true;
            }

            buffer.insert(list.remove(item));
        });

        return {
            comment: protectedComment,
            stylesheet: {
                type: 'StyleSheet',
                loc: null,
                children: buffer
            }
        };
    }

    function compressChunk(ast, firstAtrulesAllowed, num, options) {
        options.logger('Compress block #' + num, null, true);

        var seed = 1;

        if (ast.type === 'StyleSheet') {
            ast.firstAtrulesAllowed = firstAtrulesAllowed;
            ast.id = seed++;
        }

        walk$c(ast, {
            visit: 'Atrule',
            enter: function markScopes(node) {
                if (node.block !== null) {
                    node.block.id = seed++;
                }
            }
        });
        options.logger('init', ast);

        // remove redundant
        clean(ast, options);
        options.logger('clean', ast);

        // replace nodes for shortened forms
        replace(ast);
        options.logger('replace', ast);

        // structure optimisations
        if (options.restructuring) {
            restructure(ast, options);
        }

        return ast;
    }

    function getCommentsOption(options) {
        var comments = 'comments' in options ? options.comments : 'exclamation';

        if (typeof comments === 'boolean') {
            comments = comments ? 'exclamation' : false;
        } else if (comments !== 'exclamation' && comments !== 'first-exclamation') {
            comments = false;
        }

        return comments;
    }

    function getRestructureOption(options) {
        if ('restructure' in options) {
            return options.restructure;
        }

        return 'restructuring' in options ? options.restructuring : true;
    }

    function wrapBlock(block) {
        return new List$6().appendData({
            type: 'Rule',
            loc: null,
            prelude: {
                type: 'SelectorList',
                loc: null,
                children: new List$6().appendData({
                    type: 'Selector',
                    loc: null,
                    children: new List$6().appendData({
                        type: 'TypeSelector',
                        loc: null,
                        name: 'x'
                    })
                })
            },
            block: block
        });
    }

    var compress = function compress(ast, options) {
        ast = ast || { type: 'StyleSheet', loc: null, children: new List$6() };
        options = options || {};

        var compressOptions = {
            logger: typeof options.logger === 'function' ? options.logger : function() {},
            restructuring: getRestructureOption(options),
            forceMediaMerge: Boolean(options.forceMediaMerge),
            usage: options.usage ? usage.buildIndex(options.usage) : false
        };
        var specialComments = getCommentsOption(options);
        var firstAtrulesAllowed = true;
        var input;
        var output = new List$6();
        var chunk;
        var chunkNum = 1;
        var chunkChildren;

        if (options.clone) {
            ast = clone$1(ast);
        }

        if (ast.type === 'StyleSheet') {
            input = ast.children;
            ast.children = output;
        } else {
            input = wrapBlock(ast);
        }

        do {
            chunk = readChunk(input, Boolean(specialComments));
            compressChunk(chunk.stylesheet, firstAtrulesAllowed, chunkNum++, compressOptions);
            chunkChildren = chunk.stylesheet.children;

            if (chunk.comment) {
                // add \n before comment if there is another content in output
                if (!output.isEmpty()) {
                    output.insert(List$6.createItem({
                        type: 'Raw',
                        value: '\n'
                    }));
                }

                output.insert(List$6.createItem(chunk.comment));

                // add \n after comment if chunk is not empty
                if (!chunkChildren.isEmpty()) {
                    output.insert(List$6.createItem({
                        type: 'Raw',
                        value: '\n'
                    }));
                }
            }

            if (firstAtrulesAllowed && !chunkChildren.isEmpty()) {
                var lastRule = chunkChildren.last();

                if (lastRule.type !== 'Atrule' ||
                    (lastRule.name !== 'import' && lastRule.name !== 'charset')) {
                    firstAtrulesAllowed = false;
                }
            }

            if (specialComments !== 'exclamation') {
                specialComments = false;
            }

            output.appendList(chunkChildren);
        } while (!input.isEmpty());

        return {
            ast: ast
        };
    };

    var version = "4.0.3";
    var _package = {
        version: version
    };

    var _package$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        version: version,
        'default': _package
    });

    var require$$0 = getCjsExportFromNamespace(_package$1);

    var parse$1 = lib.parse;

    var generate$6 = lib.generate;

    function debugOutput(name, options, startTime, data) {
        if (options.debug) {
            console.error('## ' + name + ' done in %d ms\n', Date.now() - startTime);
        }

        return data;
    }

    function createDefaultLogger(level) {
        var lastDebug;

        return function logger(title, ast) {
            var line = title;

            if (ast) {
                line = '[' + ((Date.now() - lastDebug) / 1000).toFixed(3) + 's] ' + line;
            }

            if (level > 1 && ast) {
                var css = generate$6(ast);

                // when level 2, limit css to 256 symbols
                if (level === 2 && css.length > 256) {
                    css = css.substr(0, 256) + '...';
                }

                line += '\n  ' + css + '\n';
            }

            console.error(line);
            lastDebug = Date.now();
        };
    }

    function copy$1(obj) {
        var result = {};

        for (var key in obj) {
            result[key] = obj[key];
        }

        return result;
    }

    function buildCompressOptions(options) {
        options = copy$1(options);

        if (typeof options.logger !== 'function' && options.debug) {
            options.logger = createDefaultLogger(options.debug);
        }

        return options;
    }

    function runHandler(ast, options, handlers) {
        if (!Array.isArray(handlers)) {
            handlers = [handlers];
        }

        handlers.forEach(function(fn) {
            fn(ast, options);
        });
    }

    function minify(context, source, options) {
        options = options || {};

        var filename = options.filename || '<unknown>';
        var result;

        // parse
        var ast = debugOutput('parsing', options, Date.now(),
            parse$1(source, {
                context: context,
                filename: filename,
                positions: Boolean(options.sourceMap)
            })
        );

        // before compress handlers
        if (options.beforeCompress) {
            debugOutput('beforeCompress', options, Date.now(),
                runHandler(ast, options, options.beforeCompress)
            );
        }

        // compress
        var compressResult = debugOutput('compress', options, Date.now(),
            compress(ast, buildCompressOptions(options))
        );

        // after compress handlers
        if (options.afterCompress) {
            debugOutput('afterCompress', options, Date.now(),
                runHandler(compressResult, options, options.afterCompress)
            );
        }

        // generate
        if (options.sourceMap) {
            result = debugOutput('generate(sourceMap: true)', options, Date.now(), (function() {
                var tmp = generate$6(compressResult.ast, { sourceMap: true });
                tmp.map._file = filename; // since other tools can relay on file in source map transform chain
                tmp.map.setSourceContent(filename, source);
                return tmp;
            }()));
        } else {
            result = debugOutput('generate', options, Date.now(), {
                css: generate$6(compressResult.ast),
                map: null
            });
        }

        return result;
    }

    function minifyStylesheet(source, options) {
        return minify('stylesheet', source, options);
    }

    function minifyBlock(source, options) {
        return minify('declarationList', source, options);
    }

    var lib$1 = {
        version: require$$0.version,

        // main methods
        minify: minifyStylesheet,
        minifyBlock: minifyBlock,

        // css syntax parser/walkers/generator/etc
        syntax: Object.assign({
            compress: compress
        }, lib)
    };
    var lib_1 = lib$1.version;
    var lib_2 = lib$1.minify;
    var lib_3 = lib$1.minifyBlock;
    var lib_4 = lib$1.syntax;

    exports.default = lib$1;
    exports.minify = lib_2;
    exports.minifyBlock = lib_3;
    exports.syntax = lib_4;
    exports.version = lib_1;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
