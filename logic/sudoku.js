export {Sudoku};

function gcd(a,b) {
    // Greates Common Divisor
    // regards to algorithms-and-technologies.com
    if (b == 0) return a;
    return gcd(b, a % b);
}

class Sudoku {
    #digits;
    #blockrows; #blockcols;
    #logElement;
    #values;
    #options;
    #draws;

    constructor(digits, logElement) {
        // sudoku must be square or else number of digits does not fit to rows AND cols
        // blocksize must be as square as possible 9->3x3, 6->3x2
        this.#digits = digits;
        this.#logElement = logElement

        var lowerDiv = Math.floor(Math.sqrt(digits));
        while ((lowerDiv > 0) && ((digits % lowerDiv) > 0)) {lowerDiv--}
        var upperDiv = digits / lowerDiv;

        this.#blockrows = lowerDiv;
        this.#blockcols = upperDiv;
        this.#draws = [];

        this.log(`Initializing ${digits}x${digits} sudoku with ${lowerDiv}x${upperDiv} blocks.`)

        this.clear();
    }

    // logging into pre tagged element on screen

    log(text) {
        if (this.#logElement == undefined) {
            console.log(text);
        }
        else {
            this.#logElement.textContent += text+`\n`;
        }
        return this;
    }
    logValues() {
        this.log("|"+"---+".repeat(this.#digits-1)+"---|");
        for(let row=1; row<=this.#digits; row++) {
            this.log(this.#values[row].reduce((r,e) => `${r} ${e||" "} |`, "|"));
            this.log("|"+"---+".repeat(this.#digits-1)+"---|");
        }
        return this;
    }
    logOptions() {
        this.log("");
        for(let row=1; row<=this.#digits; row++) {
            for(let optrow=1; optrow<=this.#digits; optrow+=this.#blockcols) {
                var logtext = "";
                for(let col=1; col<=this.#digits; col++) {
                    for(let option=optrow; option<optrow+this.#blockcols; option++) {
                        logtext += `${this.#options[row][col][option]||"-"} `;
                    }
                    logtext += "\t";
                }
                this.log(logtext);
            }
            this.log("");
        }
        return this;
    }

    // setting values functionality with update of options - doesn't check allowed

    getValue(row, col) {
        return this.#values[row][col];
    }
    setValue(row, col, value) {
        const d = new Draw(row, col, value, true);
        this.#draws.push(d);
        this.log(d);
        this.#values[row][col] = value;

        // clear all options for cell
        for(let option=1; option<=this.#digits; option++) {
            this.clearOption(row, col, option, true);
        }

        // clear this option for row
        for(let col=1; col<=this.#digits; col++) {
            this.clearOption(row, col, value, true);
        }

        // clear this option for col
        for(let row=1; row<=this.#digits; row++) {
            this.clearOption(row, col, value, true);
        }

        // clear this option for block
        const lowerRow = Math.floor((row-1) / this.#blockrows) * this.#blockrows + 1;
        const lowerCol = Math.floor((col-1) / this.#blockcols) * this.#blockcols + 1;

        for(let row=lowerRow; row<lowerRow+this.#blockrows; row++) {
            for(let col=lowerCol; col<lowerCol+this.#blockcols; col++) {
                this.clearOption(row, col, value, true);
            }
        }

        return this;
    }
    clearOption(row, col, value, dependent=false) {
        const d = new Draw(row, col, value, false, dependent);
        this.#draws.push(d);
        if (!dependent) this.log(d);
        this.#options[row][col][value] = null;
    }
    undo() {
        d = this.#draws.pop();
        if (d.setvalue) {
            this.#values[d.row][d.col] = null;
        }
        else {
            this.#options[d.row][d.col][d.value] = d.value;
        }
        if (d.dependent) this.undo()
        return this;
    }

    eliminateOptionsRow(row, option) {
        for(let col=1; col<=this.#digits; col++) {
            this.#options[row][col][option] = null
        }
        return this;
    }
    eliminateOptionsCol(col, option) {
        for(let row=1; row<=this.#digits; row++) {
            this.#options[row][col][option] = null
        }
        return this;
    }
    eliminateOptionsBlock(row, col, option) {
        const lowerRow = Math.floor((row-1) / this.#blockrows) * this.#blockrows + 1;
        const lowerCol = Math.floor((col-1) / this.#blockcols) * this.#blockcols + 1;

        for(let row=lowerRow; row<lowerRow+this.#blockrows; row++) {
            for(let col=lowerCol; col<lowerCol+this.#blockcols; col++) {
                this.#options[row][col][option] = null
            }
        }
        return this;
    }

    // check whether row, col, value can be set (allowed not necessarily correct)
    isAllowed(row, col, value) {
        if ((row < 1) || (row > this.#digits)) return false;
        if ((col < 1) || (col > this.#digits)) return false;
        if ((value < 1) || (value > this.#digits)) return false;
        if (this.#values[row][col] != null) return false;
        if (this.#options[row][col][value] != value) return false;
        return true;
    }

    // intialize field to n random numbers, preset values and options
    clear() {
        // preset values and options for empty sudoku
        this.#values = []
        this.#options = []
        for(let row=1; row<=this.#digits; row++) {
            this.#values[row] = []
            this.#options[row] = []
            for(let col=1; col<=this.#digits; col++) {
                this.#values[row][col] = null;
                this.#options[row][col] = [];
                for(let option=1; option<=this.#digits; option++) {
                    this.#options[row][col][option] = option;
                }
            }
        }
        return this;
    }

    preset(numberofcells) {
        this.log(`Presetting ${numberofcells} cells.`)
        if ((numberofcells < 1) || (numberofcells > this.#digits*this.#digits/2)) {throw Error("out of bounds (max 50%)")}
        var cellsset = 0;
        while (cellsset < numberofcells) {
            var row = Math.floor(Math.random() * this.#digits) + 1;
            var col = Math.floor(Math.random() * this.#digits) + 1;
            var value = Math.floor(Math.random() * this.#digits) + 1;
            if (this.isAllowed(row,col,value)) {
                this.setValue(row,col,value);
                cellsset++;
            }
        }
        return this;
    }

    // check whether sudoku is solved
    rowIsFinal(row) {
        var check = [];
        for(let col=1; col<=this.#digits; col++) {
            check[col] = (this.#values[row][col] != null)
        }
        return check.reduce((r,e) => r && e,true)
    }
    colIsFinal(col) {
        var check = [];
        for(let row=1; row<=this.#digits; row++) {
            check[row] = (this.#values[row][col] != null)
        }
        return check.reduce((r,e) => r && e,true)
    }
    blockIsFinal(block) {
        const blocksPerRow = this.#digits / this.#blockcols;
        const rowLower = Math.floor((block-1)/blocksPerRow)*this.#blockrows+1;
        const colLower = (block-1)%blocksPerRow+1;
        var check = [];
        for(let row=rowLower; row<rowLower+this.#blockrows; row++) {
            for(let col=colLower; col<colLower+this.#blockcols; row++) {
                check.push((this.#values[row][col] != null))
            }
        }
        return check.reduce((r,e) => r && e,true)
    }
    sudokuIsFinal() {
        for(let i=1; i<=this.#digits; i++) {
            if ((!this.rowIsFinal(i)) || (!this.colIsFinal(i)) || (!this.blockIsFinal(i))) return false
        }
        return true
    }

    // start solving sudokus
    hint() {
        var result = null;
        if (this.sudokuIsFinal()) return this

        
        if (result == null) result = this.hintOnlyOneOption();
        if (result == null) result = this.hintRandom();

        if (result == null) {
            this.log("no hint possible");
        }
        else {
            result.hints.forEach(r => {
                if (r.setvalue) {
                    this.setValue(r.row,r.col,r.value);
                }
                else {
                    this.clearOption(r.row,r.col,r.value);
                }
            });
            this.log(result);
        }
        return this;
    }

    hintRandom() {
        for(let i=1; i<=100; i++) {
            var row = Math.floor(Math.random() * this.#digits) + 1;
            var col = Math.floor(Math.random() * this.#digits) + 1;
            var value = Math.floor(Math.random() * this.#digits) + 1;
            if (this.isAllowed(row,col,value)) {
                return new Hint(row,col,value,true,"random guess");
            }
        }
    }

    hintOnlyOneOption() {
        for(let row=1; row<=this.#digits; row++) {
            for(let col=1; col<=this.#digits; col++) {
                var numberoptions = 0;
                var lastoption = 0;
                for(let option=1; option<=this.#digits; option++) {
                    if (this.#options[row][col][option] != null) {
                        numberoptions++;
                        lastoption = option;
                    }
                }
                if (numberoptions == 1) {
                    return new Hint(row, col, lastoption, true, "only available option");
                }
            }
        }
    }
}

class Hint {
    constructor(row, col, value, setvalue, title, text="") {
        this.hints = [new Draw(row, col, value, setvalue)];
        this.title = title;
        this.text = text;
    }
    add(row, col, value, setvalue) {
        this.hints.push(new Draw(row, col, value, setvalue));
        return this;
    }

    toString() {
        return this.title + "\n"
        + this.hints.join("\n")
        +(this.text!=""?`\n${this.text}`:"")
    }
}

class Draw {
    constructor(row, col, value, setvalue, dependent=false) {
        this.row = row;
        this.col = col;
        this.value = value;
        this.setvalue = setvalue;
        this.dependent = dependent;
    }
    toString() {
        return `(${this.row},${this.col}) ${this.setvalue?"":"!"}= ${this.value}`
    }
}