import typing from '../modules/typing.js'
import jsext from '../modules/jsext.js'

export class Sudoku {
    // static functions and constants to overwrite for non-standard sudoku classes extending this one
    // functions are not true private (#-prefix) but only protected (_-prefix) to enable inheritance
    static _createCell(cellid, value) {
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
        allow_options: true,
        allow_long_running_steps: true,
        allow_brute_force: false,
        brute_force_recursion_limit: 3
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
        s.config.allow_options = true;
        s.config.allow_long_running_steps = false;
        s.config.allow_brute_force = true;
        s.config.brute_force_recursion_limit = 0;
        await s.solve(); // CAVE! sometime runs into error
        for(let cell of s.cells.filter(cell => Math.random()<=difficulty)) {
            cell.value = null;
        }
        // CAVE! This does not ensure constant difficulty nor unique solutions!
        return s.toString();
    }
    

    // non-static implementation is generic
    cells = []; // Array of Objects returned by _createCell
    dimcells = {}; // cross-reference to cells by dimension and dimid
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
        if (preset instanceof Sudoku) {
            this.config = structuredClone(preset.config);
            this.config.brute_force_recursion_limit -= 1;
            if (this.config.brute_force_recursion_limit < 0) {
                this.config.allow_brute_force = false;
            }
        }
        else {
            this.config = structuredClone(this.constructor.config);
        }

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
    _initBoard(preset) {
        if (preset instanceof Sudoku) preset = preset.toString();
        if (typeof preset === 'function') preset = preset();
        if ((typeof preset === 'string') && preset.includes("\n")) preset = preset.split("\n");
        if (Array.isArray(preset)) preset = preset.map(line => line.padEnd(this.constructor.setup.size, '_')).join('');
        if (typeof preset !== 'string') throw new Error(`preset should be string now, but is ${typeof(preset)}`);
        if (preset.length!=this.constructor.setup.size**2) throw new Error(`Number of elements is not size squared: ${preset.length} != ${this.size}²`);
        // preset is string of length size²

        this.cells = [];
        this.dimcells = Object.fromEntries(
            this.constructor.setup.dimensions.map(dim => 
                [dim,Array.from({ length: this.constructor.setup.size }, _ => [])]));
        this.options_ready = false;

        for (let cellid=0; cellid<preset.length; cellid+=1) {
            const value = this.constructor.setup.digits.indexOf(preset[cellid]);
            const cell = this.constructor._createCell(cellid, value==-1?null:value);

            this.cells.push(cell);

            for(let [dim,dimid] of Object.entries(cell.dimensions)) {
                this.dimcells[dim][dimid].push(cell);
            }
        }

        if (this.config.autoinit_options) this._initOptions();
        return this;
    }

    /**
     * Initializes all options (internal, no log)
     * @returns (Sudoku) this for chaining
     */
    _initOptions() {
        this.cells.forEach(cell => cell.options = this._calcOptions(cell.cellid));
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
    _setValue(cellid, value) {
        const cell = this.cells[cellid];
        if (cell.value != null) this._removeValue(cellid);
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
                this._removeOption(neighbor.cellid, value));
        }
        return this;
    }

    /**
     * Removes a value from a cell re-adding related options (internal, no log)
     *
     * @param {number} cellid - Number of cell to update
     * @returns {Sudoku} this for chaining
     */
    _removeValue(cellid) {
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
                this._addOption(neighbor.cellid, value));
        }
        cell.options = this._calcOptions(cellid);
        return this;
    }

    /**
     * Re-calculates the options for a cell according to standard rules
     * (options are value not set in neighboring cells of any dimension; internal)
     *
     * @param {number} cellid - Number of cell to update
     * @returns {Array} options allowed
     */
    _calcOptions(cellid) {
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
     * @param {number|Array} options - Number of option to remove
     * @returns {Sudoku} this for chaining
     * @throws {Error} if board is contradictory
     */
    _removeOption(cellid, options) {
        const cell = this.cells[cellid];
        if (cell.options == null) return this;
        if (!Array.isArray(options)) options = [options];

        for (let option of options) {
            const index = cell.options.indexOf(option);
            if (index != -1) cell.options.splice(index, 1);
        }
        
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
    _addOption(cellid, option) {
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
    _logStep(type, cellids, option, reason, relatedDimension, relatedIds) {
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
     * @param {number|Array} option - Number of option to remove or value to set
     * @param {string} reason - Reason why this is correct
     * @param {string} relatedDimension - Related dimension for reason (or "cell")
     * @param {Array|number} relatedIds - Related ids of dimension or cell for reason.
     * @returns {Sudoku} this for chaining
     * @throws {Error} if type is unknown
     */
    performStep(type, cellids, option, reason, relatedDimension, relatedIds) {
        const typecalls = {
            init: (preset) => this._initBoard(preset),
            options: () => this._initOptions(),
            set: (cellid, value) => this._setValue(cellid, value),
            remove: (cellid, option) => this._removeOption(cellid, option)
        }
        if (!(type in typecalls)) throw new Error(`unknown type '${type}'`);
        if (cellids && !Array.isArray(cellids)) cellids = [cellids]
        if (relatedIds && !Array.isArray(relatedIds)) relatedIds = [relatedIds]

        if (cellids) cellids.forEach(cellid => typecalls[type](cellid, option));
        if (!cellids) typecalls[type](option);
        this._logStep(type, cellids, option, reason, relatedDimension, relatedIds);
        this.callback.step_performed.forEach(f => f(this))
        return this;
    }

    /**
     * Calculates the next transformation step
     *
     * @returns {Object|null} for calling performStep or null for not found
     */
    async nextStep() {
        const nextStepFunctions = [
            () => this._nextStepSingleEmptyCellInDimension(),
            () => this._nextStepCellWithOneOptionBeforeOptions(),
            () => this._nextStepConfirmOptionsReady(),
            () => this._nextStepCellWithOneOption(),
            () => this._nextStepDimensionWithOneOption(),
            () => this._nextStepRemoveOptionsForPairOfPairs(),
            () => this._nextStepWithBruteForce()
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
     * Retrieves next dimension with only one cell for an option
     * before calculation of options
     *
     * @returns {Object|null} for calling performStep or null for not found
     */
    _nextStepSingleEmptyCellInDimension() {
        if (this.options_ready) return null;

        for(let dimension in this.dimcells) {
            for(let dimid=0; dimid<this.constructor.setup.size; dimid+=1) {
                const dimcells = this.dimcells[dimension][dimid];
                const emptycells = dimcells.filter(cell => cell.value == null);
                if (emptycells.length != 1) continue;
                const values = dimcells.map(cell => cell.value);
                for(let option=0; option<this.constructor.setup.size; option+=1) {
                    if (!values.includes(option)) {
                        return {
                            type: 'set',
                            cellids: [emptycells[0].cellid],
                            option: option,
                            reason: 'Single empty cell in dimension',
                            relatedDimension: dimension,
                            relatedIds: [dimid]
                        };
                    }
                }
            }
        }

        return null;
    }

    /**
     * Retrieves next cell with only one option before calculation of options
     *
     * @returns {Object|null} for calling performStep or null for not found
     */
    _nextStepCellWithOneOptionBeforeOptions() {
        if (this.options_ready) return null;

        let foundCell = null;
        let option = null;

        for(let cellid=0; cellid<this.cells.length; cellid+=1) {
            let options = this._calcOptions(cellid);
            if (options != null && options.length == 1) {
                foundCell = this.cells[cellid];
                option = options[0];
                break;
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
     * Confirm that options are ready
     *
     * @returns {Object|null} for calling performStep or null for not found
     */
    _nextStepConfirmOptionsReady() {
        if (this.options_ready) return null;
        if (!this.config.allow_options) return null;
        return {
            type: 'options'
        };
    }

    /**
     * Retrieves next cell with only one option
     *
     * @returns {Object|null} for calling performStep or null for not found
     */
    _nextStepCellWithOneOption() {
        if (!this.options_ready) return null;
        let foundCell = null;
        let option = null;

        foundCell = this.cells.find(cell => 
            cell.options != null && 
            cell.options.length==1);
        option = foundCell?.options[0];

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
    _nextStepDimensionWithOneOption() {
        if (!this.options_ready) return null;
        for(let dimension of this.constructor.setup.dimensions) {
            for(let dimid=0; dimid<this.constructor.setup.size; dimid+=1) {
                const dimcells = this.dimcells[dimension][dimid];
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
     * Removes options if a pair of options exists identically twice in a dimension
     * Also: Triplet of triplets etc
     *
     * @returns {Object|null} for calling performStep or null for not found
     */
    _nextStepRemoveOptionsForPairOfPairs() {
        if (!this.options_ready) return null;
        if (!this.config.allow_long_running_steps) return null;

        for(let dimension of this.constructor.setup.dimensions) {
            for(let dimid=0; dimid<this.constructor.setup.size; dimid+=1) {
                const dimcells = this.dimcells[dimension][dimid];
                const subsets = jsext.getSubsets(
                    dimcells.filter(cell => cell.options != null)
                );

                for(let subset of subsets) {
                    const options = [...new Set(subset.reduce((p,c) => p.includes(c)?p:p.concat(c.options), []))];
                    if (options.length != subset.length) continue;
                    const cellids = subset.map(cell => cell.cellid);

                    const othercells = dimcells.filter(cell => 
                        !cellids.includes(cell.cellid) &&
                        cell.options != null &&
                        cell.options.some(option => options.includes(option)))

                    if (othercells.length == 0) continue

                    return {
                        type: 'remove',
                        cellids: othercells.map(cell => cell.cellid),
                        option: options.toSorted((a,b) => a-b),
                        reason: 'Remove options for a pair of pairs',
                        relatedDimension: dimension,
                        relatedIds: [dimid]
                    };
                }
            }
        }

        return null;
    }
        
    /**
     * Retrieves next cell with brute force, partly random to vary alternatives
     *
     * @returns {Object|null} for calling performStep or null for not found
     */
    async _nextStepWithBruteForce() {
        if (!this.config.allow_brute_force) return null;
        if (!this.options_ready) this._initOptions();

        const cells_by_options_length = this.cells
        .filter(a => a.options?.length)
        .toSorted((a,b) => a.options.length-b.options.length || Math.random()-.5);
        if (cells_by_options_length.length == 0) return null;

        const try_cell = cells_by_options_length[0];
        const try_option = try_cell.options.toSorted((a,b) => Math.random()-.5)[0];

        try {
            await new this.constructor(this)
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
        this._logStep("solution");
        return this;
    }
}

export class LetterSudoku extends Sudoku {
    static setup = Object.freeze({
        digits: "ABCDEFGHI",
        size: 9,
        dimensions: ["row", "col", "block"]
    })

}