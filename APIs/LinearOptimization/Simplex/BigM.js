/**
 * Concrete implementation of the bigM simplex algorithm
 * 
 * @class
 * @param {Tableau} tableau The simplex tableau that will be used in the procedures of the bigM simplex algorithm until it is primal feasible
 */

 class BigM extends AbstractSimplex {
    constructor(tableau) {
        super(tableau);
        console.log("BigM");
    }

    //Here it makes sense to work with a second auxiliary coefficient matrix storing the bigM values. 
    //The bigM-Code and the primal simplex code could be merged, since they share huge parts of matching code. 
    //Yet, performance-wise it is probably more efficient to seperate both. 

    /**
     * Applies the bigM simplex algorithm to the given simplex tableau
     * @returns {Tableau} A simplex tableau to which the bigM-simplex algorithm was applied. This tableau is solved to optimality using the primal simplex, if it is feasible.
     */
    solve() {

        while (this.tableau.getTableauStates().has(TableauState.BIG_M_FEASIBLE)) {

            let pivotIndices = this.findPivotElement();
            let pivotRow = pivotIndices[0];
            let pivotColumn = pivotIndices[1];

            if (pivotRow == -1 || pivotColumn == - 1) { break; }

            this.applyPivotStep(pivotRow, pivotColumn);
            this.simplify();
            this.checkFeasibility();
            this.checkPrimalDegeneracy();
            this.checkCycling();
            this.tableau.archiveCurrentInformation();

            if (this.tableau.getTableauStates().has(TableauState.FEASIBLE)) {
                this.tableau.removeTableauState(TableauState.BIG_M_FEASIBLE);
                return new PrimalSimplex(this.tableau).solve();
            }
        }

        return this.tableau;
    }

    /**
      * @returns {Array<number>} An array containing the row and column index of the pivot element. In case it does not exist, [-1, -1] will be returned. 
      */
    findPivotElement() {

        let matrix = this.tableau.getMatrix();
        let bigMMatrix = this.tableau.getBigMMatrix();

        //1. Find the column with the highest objective function coeffcient
        let columnIndex = -1;
        let highestNumber = 0;

        //It Iterates through the objective function coefficients in the bigM-coefficientmatrix. When there are several coefficients of the same size, the first one that occurs is chosen. Alternatively it would be possible to compare the bigM- as well as normal-coefficientmatrix entries of the respective entries. However, the effect on performance should not be significant, which is why I chose the simpler approach
        for (let index = 1; index < bigMMatrix.size()[1]; index++) {
            let objectiveFunctionCoefficient = bigMMatrix.subset(math.index(bigMMatrix.size()[0] - 1, index));
            if (objectiveFunctionCoefficient > highestNumber) {
                highestNumber = objectiveFunctionCoefficient;
                columnIndex = index;
            }
        }

        if (highestNumber == 0) {
            for (let index = 1; index < matrix.size()[1]; index++) {
                let objectiveFunctionCoefficient = matrix.subset(math.index(matrix.size()[0] - 1, index));
                if (objectiveFunctionCoefficient > highestNumber) {
                    highestNumber = objectiveFunctionCoefficient;
                    columnIndex = index;
                }
            }
        }

        //All coefficients in the objective function are negative -> no improvement possible -> optimality is reached
        if (columnIndex == -1) {
            this.checkOptimality();
            return [-1, -1];
        }

        //2. Find row in which the variable that enters the basis is restricted most
        let smallestFraction = -1;
        let rowIndex = -1;

        for (let currentRowIndex = 0; currentRowIndex < matrix.size()[0] - 1; currentRowIndex++) {
            let coefficient = matrix.subset(math.index(currentRowIndex, columnIndex));

            if (coefficient <= 0) { continue; }

            let basisVariable = matrix.subset(math.index(currentRowIndex, 0));
            let fraction = basisVariable / coefficient;

            if (fraction >= 0 && (smallestFraction == -1 || fraction < smallestFraction)) {
                smallestFraction = fraction;
                rowIndex = currentRowIndex;
            }
        }

        //All coefficients in the pivot column are smaller equal zero -> unbound problem
        if (smallestFraction == -1) {
            this.tableau.addTableauState(TableauState.UNBOUND);
            return [-1, -1];
        }

        return [rowIndex, columnIndex];
    }

    /**
     * Performs a swap of the basis variable
     * @param {number} rowIndex The row index that indicates the place of the leaving basis variable in the basis
     * @param {number} columnIndex The column index that is the index that enters the basis
     */
    applyPivotStep(rowIndex, columnIndex) {

        let matrix = this.tableau.getMatrix();
        let bigMMatrix = this.tableau.getBigMMatrix();
        let pivotElement = matrix.subset(math.index(rowIndex, columnIndex));
        let rows = matrix.size()[0];
        let basis = this.tableau.getBasis();

        for (let currentRowIndex = 0; currentRowIndex < matrix.size()[0]; currentRowIndex++) {
            if (currentRowIndex == rowIndex) { continue; }

            let otherCoefficient = matrix.subset(math.index(currentRowIndex, columnIndex));
            let otherBigMCoefficient = bigMMatrix.subset(math.index(currentRowIndex, columnIndex));
            let factor = -1 * otherCoefficient / pivotElement;
            let bigMFactor = -1 * otherBigMCoefficient / pivotElement;

            rowAddition(matrix, rowIndex, currentRowIndex, factor);

            if (currentRowIndex == bigMMatrix.size()[0] - 1) {
                rowAdditionAmongMatrices(matrix, bigMMatrix, rowIndex, currentRowIndex, bigMFactor);
            }
        }

        multiplyRow(matrix, rowIndex, 1 / pivotElement);

        this.tableau.getBasis()[rowIndex] = columnIndex;

        //Ensures that the basis columns have proper form
        math.subset(matrix, math.index(math.range(0, rows), basis), math.zeros(rows, basis.length));

        for (let index = 0; index < basis.length; index++) {
            let variableIndex = basis[index];
            math.subset(matrix, math.index(index, variableIndex), 1);
        }

        math.subset(bigMMatrix, math.index(bigMMatrix.size()[0] - 1, basis), math.zeros(1, basis.length));
    }

    /**
     * Simplifies the bigM-coefficient matrix by removing 
     */
    simplify() {
        //Either remove full columns or set their values to 0
        //What is more efficient?
        //I have chosen to splice the matrices apart

        let variableTypes = this.tableau.getTableauVariableTypes();
        let basis = this.tableau.getBasis();

        for (let index = 1; index < variableTypes.length; index++) {

            let objectiveFunctionBigMCoefficients = math.flatten(this.tableau.getObjectiveFunctionBigMCoefficients()).toArray();
            let objectiveFunctionCoefficients = math.flatten(this.tableau.getObjectiveFunctionCoefficients()).toArray();

            let variableType = variableTypes[index];

            let bigMObjectiveFunctionCoefficient = objectiveFunctionBigMCoefficients[index - 1];
            let objectiveFunctionCoefficient = objectiveFunctionCoefficients[index - 1];
            let negativeCoefficient = (bigMObjectiveFunctionCoefficient < 0) || (bigMObjectiveFunctionCoefficient == 0 && objectiveFunctionCoefficient < 0);

            // if (variableType == TableauVariableType.ARTIFICIAL_VARIABLE && !basis.includes(index) && negativeCoefficient) {
            //     //simplify, since the column won't be chosen anyways
            //     //variableTypes.splice(index, 1);

            //     console.log("Change!");

            //     removeColumnFromMatrix(this.tableau.getMatrix(), index);
            //     removeColumnFromMatrix(this.tableau.getBigMMatrix(), index);
            // }
        }

        let bigMMatrix = this.tableau.getBigMMatrix();

        for (let columnIndex = 0; columnIndex < variableTypes.length; columnIndex++) {
            let entry = bigMMatrix.subset(math.index(bigMMatrix.size()[0] - 1, columnIndex));
            if (Math.abs(entry) < Number.EPSILON * 1000) {
                bigMMatrix._data[bigMMatrix.size()[0] - 1][columnIndex] = 0;
            }
        }
    }

    /**
     * Examines whether the provided tableau is primal feasible
     */
    checkFeasibility() {
        // All bigM-objective function coefficients have to be zero

        console.log("BigM progress: " + math.sum(math.flatten(this.tableau.getObjectiveFunctionBigMCoefficients()).toArray().filter(number => number > 0)));

        let coefficients = math.flatten(this.tableau.getObjectiveFunctionBigMCoefficients()).toArray();
        let feasible = true;

        for (let coefficient of coefficients) {
            if (coefficient > 0) {
                feasible = false;
                break;
            }
        }

        if (feasible) {
            this.tableau.addTableauState(TableauState.FEASIBLE);
            this.tableau.resetBigMMatrix();
        }
    }

    /**
     * Examines whether the provided tableau is optimal. Updates the tableau state accordingly.
     */
    checkOptimality() {

        let optimal = true;

        for (let index of this.tableau.getBasis()) {
            let variableType = this.tableau.getTableauVariableTypes()[index];
            if (variableType == VariableType.ARTIFICIAL_VARIABLE) {
                optimal = false;
                break;
            }
        }

        if (optimal) {
            this.tableau.addTableauState(TableauState.OPTIMAL);
        } else {
            this.tableau.addTableauState(TableauState.INFEASIBLE);
            this.tableau.removeTableauState(SimplexTableauState.BIG_M_FEASIBLE);
        }
    }
}

/**
 * Adds a row at a given index to the provided matrix
 * @param {*} matrix Matrix to which a row should be added at row with the index "rowIndex"
 */
function removeRowFromMatrix(matrix, rowIndex) {

    if (matrix.type != "DenseMatrix") {
        console.log("Rows can only be added to dense matrices using this function! Type of the current matrix: " + matrix.type);
        return;
    }

    matrix._data.splice(rowIndex, 1);
    matrix._size[0]--; //Decreases the matrix' row-size explicitly
}

/**
 * Adds a column at a given index to the provided matrix
 * @param {*} matrix Matrix to which a column should be added at the column with the index "columnIndex"
 */
function removeColumnFromMatrix(matrix, columnIndex) {

    if (matrix.type != "DenseMatrix") {
        console.log("Rows can only be added to dense matrices using this function! Type of the current matrix: " + matrix.type);
        return;
    }

    for (let row of matrix._data) { row.splice(columnIndex, 1); }
    matrix._size[1]--; //Decreases the matrix' row-size explicitly
}
