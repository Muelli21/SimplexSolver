/**
 * Central container object of the algorithm. It is used to pass on information among different simplex algorithms and branch and bound procedures
 * 
 * @class 
 * @param {Map<string, Variable>} decisionVariables Map of the decision variables from variable names as keys to variables as values
 * @param {Array<TableauVariableType>} tableauVariableTypes Array of the types of the variables that are used in the tableau
 * @param {*} matrix The matrix that stores the coefficients of the variables
 * @param {Array<number>} basis Array of indices of the basis variables. The indices indicate the variable's positions in the tableauVariableTypes-array
 */
class Tableau {
    constructor(decisionVariables, tableauVariableTypes, matrix, basis) {

        console.log(tableauVariableTypes);

        this.decisionVariables = decisionVariables; //Type: Map - key: variablename, value: variable
        this.tableauVariableTypes = tableauVariableTypes; //Type: Array - array of simplex variable type enums
        this.tableauStates = new Set([]); //Type: Set - states: feasible, infeasible, dual-feasible, bigM-feasible, optimal, primal degenerated, dual degenerated, unbound

        this.initialMatrix = matrix; //Type: Matrix
        this.matrix = matrix; //Type: Matrix
        this.bigMMatrix = null; //Type: Matrix
        this.basis = basis; //Consists of variable indices

        this.previousBases = []; //Type: Array - array of arrays
        this.previousMatrices = []; //Type: Array - array of matrices
        this.previousBigMMatrices = []; //Type: Array - array of matrices
    }

    /**
     * Adds another tableau state to the tableaus state set
     * @param {TableauState} tableauState The tableau state that shall be added
     */
    addTableauState(tableauState) {
        this.tableauStates.add(tableauState);
    }

    /**
     * Removes a given tableau state fromt the teableau's state set
     * @param {TableauState} tableauState The tableau state that should be removed
     */
    removeTableauState(tableauState) {
        this.tableauStates.delete(tableauState);
    }

    /**
     * @returns {Set<TableauState>} A set of tableau states that characterize the current tableau 
     */
    getTableauStates() {
        return this.tableauStates;
    }

    /**
     * @returns {Map<string, Variable} A map containing variable names as keys and variables as values
     */
    getDecisionVariables() {
        return this.decisionVariables;
    }

    /**
     * @returns {*} A matrix containing all the coefficients that belong to the single constraints and variables
     */
    getMatrix() {
        return this.matrix;
    }

    /**
     * @returns {*} A matrix containing all coefficients that belong to the single constraints and variables. This matrix was processed using the simplex algorithm. 
     */
    getInitialMatrix() {
        return this.initialMatrix;
    }

    /**
     * Updates the tableau's updated matrix
     * @param {*} updatedMatrix The matrix that should replace the tableau's current updated matrix
     */
    updateMatrix(updatedMatrix) {
        this.matrix = updatedMatrix;
    }

    /**
     * @returns {*} A matrix only containing the row of the coefficient matrix in which the objective function right hand side and coefficients are stored
     */
    getObjectiveFunctionRow() {
        return math.row(this.matrix, this.matrix.size()[0] - 1);
    }

    /**
     * @returns {*} A matrix only containing the row of the initial coefficient matrix in which the objective function right hand side and coefficients are stored
     */
     getInitialObjectiveFunctionRow() {
        return math.row(this.initialMatrix, this.initialMatrix.size()[0] - 1);
    }

    /**
     * @returns {*} A matrix only containing the row of the bigM-coefficient matrix in which the objective function right hand side and coefficients are stored
     */
     getObjectiveFunctionBigMRow() {
        return math.row(this.bigMMatrix, this.bigMMatrix.size()[0] - 1);
    }

    /**
     * @returns {*} A matrix only containing the objective function coefficients of the objective function row
     */
    getObjectiveFunctionCoefficients() {
        return math.subset(this.matrix, math.index(this.matrix.size()[0] - 1, math.range(1, this.matrix.size()[1])))
    }

    /**
     * @returns {*} A matrix only containing the objective function bigM-coefficients of the objective function row
     */
     getObjectiveFunctionBigMCoefficients() {
        return math.subset(this.bigMMatrix, math.index(this.bigMMatrix.size()[0] - 1, math.range(1, this.bigMMatrix.size()[1])))
    }

    /**
     * @returns {*} A matrix only containing the right hand side column of the coefficient matrix
     */
    getRightHandSideColumn() {
        return math.column(this.matrix, 0);
    }

    /**
     * @returns {*} A matrix only containing the right hand side values of the coefficient matrix excluding the objective function value
     */
    getRightHandSideValues() {
        return math.subset(this.matrix, math.index(math.range(0, this.matrix.size()[0] - 1), 0));
    }

    /**
     * @returns {*} A matrix containing all the bigM-coefficients that belong to the single constraints and decision variables
     */
    getBigMMatrix() {
        return this.bigMMatrix;
    }

    /**
     * Sets a given matrix as the tableaus bigM coefficient matrix
     * @param {*} bigMMatrix 
     */
    setBigMMatrix(bigMMatrix) {
        this.bigMMatrix = bigMMatrix;
    }

    /**
     * @returns {Array<number>} An array of indices that indicate the position of the respective basis variable in the tableauVariableTypes-array. The order of the indices is similar to the order of the underlying constraints. 
     */
    getBasis() {
        return this.basis;
    }

    /**
     * @returns {Array<Array>} An array containing three arrays, namely, all previous bases, all previous coefficient matrices and all previous 
     */
    getArchivedInformation() {
        return [this.previousBases, this.previousMatrices, this.previousBigMMatrices];
    }

    /**
     * @returns {Array<TableauVariableType>} An array containing the tablea variable types of the variables that constitute the tableau
     */
    getTableauVariableTypes() {
        return this.tableauVariableTypes;
    }

    /**
     * @returns {number} The number of entries in the archive
     */
    getNumberOfArchivedEntries() {
        return this.previousBases.length;
    }

    /**
     * Copies the current tableau. Tableau states and previous information are not copied along. 
     * @returns A copy of the current tableau 
     */
    copy() {
        let copy = new Tableau(new Map(this.decisionVariables), [...this.tableauVariableTypes], math.clone(this.matrix), [...this.basis]);

        if (this.bigMMatrix != null) {
            copy.setBigMMatrix(math.clone(this.bigMMatrix));
        }

        return copy;
    }

    /**
     * Copies and archives the current coefficient matrix, bigM matrix, and basis
     */
    archiveCurrentInformation() {

        // if(LIMIT_ARCHIVE && this.previousBases.length > MAX_ARCHIVE_ENTRIES) {
        //     this.previousBases.pop();
        //     this.previousCoefficientMatrices.pop();
        //     this.previousBigMCoefficientMatrices.pop();
        // }

        this.previousMatrices.push(math.clone(this.matrix));
        this.previousBases.push(this.basis.clone());

        if (this.bigMMatrix != null) {
            this.previousBigMMatrices.push(math.clone(this.bigMMatrix));
        }
    }

    /**
     * Removes one or several entries from the archive
     * @param {number} index The index of the first archive entry that should be removed
     * @param {number} numberOfEntries The number of archive entries that should be removed including the first one. 
     */
    removeFromArchive(index, numberOfEntries) {
        if (index < 0 || index > this.previousBases.length - 1) {
            console.log("The index " + index + " does not belong to archived information!");
            return;
        }

        this.previousBases.splice(index, numberOfEntries);
        this.previousMatrices.splice(index, numberOfEntries); //Experimental change - before: numberOfEntries = 1
        this.previousBigMMatrices.splice(index, numberOfEntries);
    }
    
    /**
     *  Computes a map that contains all decision variables and their values
     * 
     * REMARK: Can only produce resonable and sensible output if the tableau has already been solved to optimality and is feasible
     * @returns {Map<Variable, number>} A map that contains decision variables as keys and their rigth hand side values as values. 
     * The map is empty if the tableau is not optimal.
     */
    getResult() {
        
        if (!this.tableauStates.has(TableauState.OPTIMAL)) {
            return new Map();
        }

        let basis = this.basis;
        let matrix = this.matrix;
        let resultMap = new Map();

        let index = 0;
        for (let decisionVariable of [...this.decisionVariables.values()]) {
            index++;

            if (basis.includes(index)) {
                let valueIndex = basis.indexOf(index);
                let value = matrix.subset(math.index(valueIndex, 0));
                resultMap.set(decisionVariable, value);
            } else {
                resultMap.set(decisionVariable, 0);
            }
        }

        return resultMap;
    }
}
