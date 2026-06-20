import typing from '../modules/typing.js'

export class Sudoku {
    // static functions and constants to overwrite for non-standard sudoku classes extending this one
    static #createCell(cellid, value) {
        return {
            cellid: cellid,
            value: value,
            options: null,
            dimensions: {
                row: Math.floor(cellid/9),
                col: (cellid%9),
                block: Math.floor(Math.floor(cellid / 9) / 3) * 3 + Math.floor((cellid % 9) / 3)
            }
        }
    }
    static setup = Object.freeze({
        digits: "123456789",
        size: 9,
        dimensions: ["row", "col", "block"]
    })
    // config and callback may be preset differently on extend
    // but may be changed during runtime therefore they are copied into this on init
    static config = {
        autoinit_options: false,
        allow_brute_force: false,
        dont_cache_dimensions: false
    }
    static callback = {
        step_performed: [] // Parameter is this, last step is this.log.at(-1)
    }

    /**
     * Static function to generate a random preset
     * 
     * @param {number} difficulty - value defining how empty the board is (0..1)
     * @returns {string} To be used as preset for initBoard
     */
    static async randomPreset(difficulty) {
        // start empty and generate a random solution using brute force
        // this is the class (not an instance) in a static method
        const s = new this("_".repeat(this.setup.size**2));
        s.config.allow_brute_force = true;
        await s.solve();
        for(let cell of s.cells.filter(cell => Math.random()<=difficulty)) {
            cell.value = null;
        }
        // CAVE! This does not ensure constant difficulty nor unique solutions!
        return s.toString();
    }
    

    // non-static implementation is generic
    cells = []; // internal Array of Objects returned by #createCell
    #dimcells_cache = null; // internal cross-reference to cells by dimension
    log = []; // log of transformation steps already performed, see logStep
    options_ready = false;

    /**
     * Creates a new Sudoku board
     *
     * @param {any} preset - List of digits and blanks to initalize (optional)
     * @returns {Sudoku} The newly created board (default)
     * @throws {Error} if preset is wrong type or not matching size squared
     */
    constructor(preset) {
        this.config = structuredClone(this.constructor.config);

        this.callback = Object.fromEntries(
        Object.entries(this.constructor.callback).map(([key, arr]) => [
            key,
            [...arr] // clone array, keep same function refs
        ])
        );

        if (preset) this.performStep('init', [preset]);
    }

    /**
     * Converts board into standard string
     *
     * @returns {string} Size² length string of defined digits and underscores for blank
     */
    toString() {
        return this.cells.map(cell => this.constructor.setup.digits[cell.value] ?? "_").join("");
    }

    /**
     * Initializes board with a preset (internal, no log)
     * Does not initialize log; to initalize log use a new instance
     *
     * @param {string|Array|Function|Sudoku} preset - List of digits and blanks to initalize
     * @returns {Sudoku} this for chaining.
     * @throws {Error} if preset is wrong type or not matching size squared
     */
    #initBoard(preset) {
        this.cells = [];
        this.#dimcells_cache = null;
        this.options_ready = false;

        if (preset instanceof Sudoku) preset = preset.toString();
        if (typeof preset === 'function') preset = preset();
        if ((typeof preset === 'string') && preset.includes("\n")) preset = preset.split("\n");
        if (Array.isArray(preset)) preset = preset.map(line => line.padEnd(this.constructor.setup.size, '_')).join('');
        if (typeof preset !== 'string') throw new Error(`preset should be string now, but is ${typeof(preset)}`);
        if (preset.length!=this.constructor.setup.size**2) throw new Error(`Number of elements is not size squared: ${preset.length} != ${this.size}²`);
        // preset is string of length size²

        for (let cellid=0; cellid<preset.length; cellid+=1) {
            const value = this.constructor.setup.digits.indexOf(preset[cellid]);
            this.cells.push(this.constructor.#createCell(cellid, value==-1?null:value));
        }

        if (this.config.autoinit_options) this.#initOptions();
        return this;
    }

    /**
     * Initializes all options (internal, no log)
     * @returns (Sudoku) this for chaining
     */
    #initOptions() {
        this.cells.forEach(cell => cell.options = this.#calcOptions(cell.cellid));
        this.options_ready = true;
        return this;
    }

    /**
     * Sets a value to a cell removing related options (internal, no log)
     *
     * @param {number} cellid - Number of cell to update
     * @param {number} value - Number of option to set as value
     * @returns {Sudoku} this for chaining
     */
    #setValue(cellid, value) {
        const cell = this.cells[cellid];
        if (cell.value != null) this.#removeValue(cellid);
        cell.value = value;
        cell.options = null;
        if (!this.options_ready) return this;

        // remove option from all neighbors in all dimensions
        for(let dim in cell.dimensions) {
            this.cells
            .filter(neighbor => 
                neighbor.dimensions[dim] == cell.dimensions[dim] && 
                neighbor.cellid != cellid && 
                neighbor.value == null)
            .forEach(neighbor => 
                this.#removeOption(neighbor.cellid, value));
        }
        return this;
    }

    /**
     * Removes a value from a cell re-adding related options (internal, no log)
     *
     * @param {number} cellid - Number of cell to update
     * @returns {Sudoku} this for chaining
     */
    #removeValue(cellid) {
        const cell = cells[cellid];
        if (cell.value == null) return this;
        cell.value = null;
        if (!this.options_ready) return this;

        // re-add option to all neighbors in all dimensions
        for(const dim in cell.dimensions) {
            this.cells
            .filter(neighbor => 
                neighbor.dimensions[dim] == cell.dimensions[dim] && 
                neighbor.cellid != cellid && 
                neighbor.options != null)
            .forEach(neighbor => 
                this.#addOption(neighbor.cellid, value));
        }
        cell.options = this.#calcOptions(cellid);
        return this;
    }

    /**
     * Re-calculates the options for a cell according to standard rules
     * (options are value not set in neighboring cells of any dimension; internal)
     *
     * @param {number} cellid - Number of cell to update
     * @returns {Array} options allowed
     */
    #calcOptions(cellid) {
        const cell = this.cells[cellid];
        if (cell.value != null) return null;

        let options = Array.from({ length: this.constructor.setup.size }, (_, i) => i)
        for(const dim in cell.dimensions) {
            const neighborValues = this.cells
                .filter(neighbor => 
                    neighbor.dimensions[dim] == cell.dimensions[dim] && 
                    neighbor.cellid != cellid && 
                    neighbor.value != null)
                .map(neighbor => neighbor.value)
            options = options.filter(option => !neighborValues.includes(option))
        }
        return options;
    }

    /**
     * Removes an option from a cell (internal, no log)
     *
     * @param {number} cellid - Number of cell to update
     * @param {number} option - Number of option to remove
     * @returns {Sudoku} this for chaining
     * @throws {Error} if board is contradictory
     */
    #removeOption(cellid, option) {
        const cell = this.cells[cellid];
        if (cell.options == null) return this;
        const index = cell.options.indexOf(option);
        if (index != -1) cell.options.splice(index, 1);

        if (cell.options.length==0) throw new Error(`Board is contradictory`);

        return this;
    }

    /**
     * Adds an option to a cell (internal, no log)
     *
     * @param {number} cellid - Number of cell to update
     * @param {number} option - Number of option to add
     * @returns {Sudoku} this for chaining
     */
    #addOption(cellid, option) {
        const cell = this.cells[cellid];
        if (cell.options == null) return this;
        const index = cell.options.indexOf(option);
        if (index == -1) cell.options.push(option);
        return this;
    }

    /**
     * Logs a transformation step (internal)
     *
     * @param {string} type - Type of transformation: init, set, remove
     * @param {number} cellids - Array of Number of cell to update
     * @param {number} option - Number of option to remove or value to set
     * @param {string} reason - Reason why this is correct
     * @param {string} relatedDimension - Related dimension for reason (or "cell")
     * @param {number} relatedId - Related id of dimension or cell for reason
     * @returns {Sudoku} this for chaining
     */
    #logStep(type, cellids, option, reason, relatedDimension, relatedIds) {
        this.log.push({
            type, cellids, option, reason, relatedDimension, relatedIds,
            resultingCells: structuredClone(this.cells)
        })
        return this;
    }

    /**
     * Perform a transformation step
     *
     * @param {string} type - Type of transformation: init, options, set, remove
     * @param {Array|number} cellids - Array of Number of cell to update
     * @param {number} option - Number of option to remove or value to set
     * @param {string} reason - Reason why this is correct
     * @param {string} relatedDimension - Related dimension for reason (or "cell")
     * @param {Array|number} relatedIds - Related ids of dimension or cell for reason.
     * @returns {Sudoku} this for chaining
     * @throws {Error} if type is unknown
     */
    performStep(type, cellids, option, reason, relatedDimension, relatedIds) {
        const typecalls = {
            init: (preset) => this.#initBoard(preset),
            options: () => this.#initOptions(),
            set: (cellid, value) => this.#setValue(cellid, value),
            remove: (cellid, option) => this.#removeOption(cellid, option)
        }
        if (!(type in typecalls)) throw new Error(`unknown type '${type}'`);
        if (cellids && !Array.isArray(cellids)) cellids = [cellids]
        if (relatedIds && !Array.isArray(relatedIds)) relatedIds = [relatedIds]

        if (cellids) cellids.forEach(cellid => typecalls[type](cellid, option));
        if (!cellids) typecalls[type](option);
        this.#logStep(type, cellids, option, reason, relatedDimension, relatedIds);
        this.callback.step_performed.forEach(f => f(this))
        return this;
    }

    /**
     * Returns a dimension e.g. a row of cells
     *
     * @param {string} dimension - Queried dimension (or "cell")
     * @param {Array|number} dimid - Queried ids of dimension or cell
     * @returns {Array} array of cell references
     * @throws {Error} if type is unknown
     */
    get_dimension(dimension, dimid) {
        if (dimension == 'cell') return [this.cells[dimid]]; // for completeness
        if (this.config.dont_cache_dimensions) {
            return this.cells.filter(cell =>
                        cell.dimensions[dimension] == dimid
                    );
                }

        // prepare cache
        if (!this.#dimcells_cache) {
            this.#dimcells_cache = {};
            for(let cell of this.cells) {
                for(let dim in cell.dimensions) {
                    if (!this.#dimcells_cache[dim]) this.#dimcells_cache[dim] = [];
                    if (!this.#dimcells_cache[dim][cell.dimensions[dim]]) this.#dimcells_cache[dim][cell.dimensions[dim]] = [];
                    this.#dimcells_cache[dim][cell.dimensions[dim]].push(cell);
                }
            }
        }

        return this.#dimcells_cache[dimension][dimid];
    }

    /**
     * Calculates the next transformation step
     *
     * @returns {Object|null} for calling performStep or null for not found
     */
    async nextStep() {
        const nextStepFunctions = [
            () => this.#nextStepCellWithOneOption(),
            () => this.#nextStepConfirmOptionsReady(),
            () => this.#nextStepDimensionWithOneOption(),
            () => this.#nextStepWithBruteForce()
        ]
        let result = null;
        for (let f of nextStepFunctions) {
            await null;
            result = await f();
            if (!!result) break;
        }
        return result;
    }

    /**
     * Confirm that options are ready
     *
     * @returns {Object|null} for calling performStep or null for not found
     */
    #nextStepConfirmOptionsReady() {
        if (this.options_ready) return null;
        return {
            type: 'options'
        };
    }

    /**
     * Retrieves next cell with only one option
     *
     * @returns {Object|null} for calling performStep or null for not found
     */
    #nextStepCellWithOneOption() {
        let foundCell = null;
        let option = null;
        if (this.options_ready) {
            foundCell = this.cells.find(cell => 
                cell.options != null && 
                cell.options.length==1);
            option = foundCell?.options[0];
        }
        else {
            for(let cellid=0; cellid<this.cells.length; cellid+=1) {
                let options = this.#calcOptions(cellid);
                if (options != null && options.length == 1) {
                    foundCell = this.cells[cellid];
                    option = options[0];
                    break;
                }
            }
        }

        if (!foundCell) return null;
        return {
            type: 'set',
            cellids: [foundCell.cellid],
            option: option,
            reason: 'Cell has only one option left'
        };
    }

    /**
     * Retrieves next dimension with only one cell for an option
     *
     * @returns {Object|null} for calling performStep or null for not found
     */
    #nextStepDimensionWithOneOption() {
        if (!this.options_ready) this.#initOptions();
        for(let dimension of this.constructor.setup.dimensions) {
            for(let dimid=0; dimid<this.constructor.setup.size; dimid+=1) {
                let dimcells = this.get_dimension(dimension, dimid);
                for(let option=0; option<this.constructor.setup.size; option+=1) {
                    if (dimcells.some(cell => cell.value == option)) continue;
                    let foundCells = dimcells.filter(cell => cell.options != null && cell.options.includes(option));
                    if (foundCells.length != 1) continue;
                    
                    return {
                        type: 'set',
                        cellids: [foundCells[0].cellid],
                        option: option,
                        reason: 'Dimension contains only one cell for this option',
                        relatedDimension: dimension,
                        relatedIds: [dimid]
                    };
                }
            }
        }
        return null;
    }
    
    /**
     * Retrieves next cell with brute force
     *
     * @returns {Object|null} for calling performStep or null for not found
     */
    async #nextStepWithBruteForce() {
        if (!this.config.allow_brute_force) return null;
        if (!this.options_ready) this.#initOptions();

        const cells_by_options_length = this.cells
        .filter(a => a.options?.length)
        .toSorted((a,b) => a.options.length-b.options.length || Math.random()-.5);
        if (cells_by_options_length.length == 0) return null;

        const try_cell = cells_by_options_length[0];
        const try_option = try_cell.options.toSorted((a,b) => Math.random()-.5)[0];

        try {
            await new Sudoku(this)
                .performStep('set', [try_cell.cellid], try_option, 'try')
                .solve();
            
            return {
                type: 'set',
                cellids: [try_cell.cellid],
                option: try_option,
                reason: 'Tried with brute force'
            };
        }
        catch (e) {
            return {
                type: 'remove',
                cellids: [try_cell.cellid],
                option: try_option,
                reason: `Tried with brute force: ${e.message}`
            };
        }
    }

    /**
     * Solve the Sudoku by finding next steps until all values set
     *
     * @returns {Sudoku} this for chaining
     * @throws {Error} if contradictory
     */
    async solve() {
        while (this.cells.some(cell => cell.value == null)) {
            await null;
            let nextStep = await this.nextStep();
            if (!nextStep) throw new Error(`no solution found`);
            this.performStep(...Object.values(nextStep));
        }
        this.#logStep("solution");
        return this;
    }
}