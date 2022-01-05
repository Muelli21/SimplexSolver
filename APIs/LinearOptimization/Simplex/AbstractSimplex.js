/**
 * Abstract class which bundles methods that are used in several concrete implementations of different simplex algorithms. 
 * 
 * @class
 * @abstract
 * @param {Tableau} tableau The simplex tableau that will be used in any non-abstract algorithm that is built on top of this abstract class
 */

class AbstractSimplex {
    constructor(tableau) {
        this.tableau = tableau;
    }

    /**
     * Updates the tableau according to a target basis that determines the matrices' structures
     * @param {Array<number>} targetBasis An array of indices of variables in the variableTypesVector that should be in the basis after the method was performed
     */
    updateTableau(targetBasis) {

        // See Revised Simplex Method for information on the notation
        // basisColumns = B
        // inversedBasisColumns = B^-1
        // coefficients = C_B
        // dualVariables = y^T = ((C_B)^T)*B^-1
        // pivotMatrix = P

        let matrix = this.tableau.getInitialMatrix();
        let rows = matrix.size()[0];
        let objectiveFunctionRow = this.tableau.getInitialObjectiveFunctionRow();

        let basisColumns = math.subset(matrix, math.index(math.range(0, rows - 1), targetBasis));
        let inversedBasisColumns = math.inv(basisColumns);

        let coefficients = math.subset(objectiveFunctionRow, math.index(0, targetBasis));
        let dualVariables = math.multiply(coefficients, inversedBasisColumns);

        let pivotMatrix = math.zeros(rows, rows);
        math.subset(pivotMatrix, math.index(math.range(0, rows - 1), math.range(0, rows - 1)), inversedBasisColumns);
        math.subset(pivotMatrix, math.index(rows - 1, rows - 1), 1);
        math.subset(pivotMatrix, math.index(rows - 1, math.range(0, rows - 1)), math.multiply(dualVariables, -1)); // Multiplication by -1 to change the sign of the entire objective function row

        let startTime = performance.now();

        let updatedMatrix = math.multiply(pivotMatrix, matrix);

        math.subset(updatedMatrix, math.index(math.range(0, rows), targetBasis), math.zeros(rows, targetBasis.length));

        for (let index = 0; index < targetBasis.length; index++) {
            let variableIndex = targetBasis[index];
            math.subset(updatedMatrix, math.index(index, variableIndex), 1);
        }

        let endTime = performance.now();
        let executionTime = (endTime - startTime) / 1000;
        console.log("Execution time: " + executionTime);

        this.tableau.updateMatrix(updatedMatrix);

        // DEBUGGING: 
        // console.log("Basis columns:");
        // console.log(basisColumns);
        // console.log("Inversed basis columns:");
        // console.log(inversedBasisColumns);
        // console.log("Pivotmatrix:");
        // console.log(pivotMatrix);
        // console.log("Updated matrix:");
        // console.log(updatedMatrix);
    }

    //Performs swap of basis variable
    applyPivotStep(rowIndex, columnIndex) {

        let matrix = this.tableau.getMatrix();
        let pivotElement = matrix.subset(math.index(rowIndex, columnIndex));
        let rows = matrix.size()[0];

        for (let currentRowIndex = 0; currentRowIndex < rows; currentRowIndex++) {
            if (currentRowIndex == rowIndex) { continue; }

            let otherCoefficient = matrix.subset(math.index(currentRowIndex, columnIndex));
            let factor = -1 * otherCoefficient / pivotElement;
            rowAddition(matrix, rowIndex, currentRowIndex, factor);
        }

        multiplyRow(matrix, rowIndex, 1 / pivotElement);

        let basis = this.tableau.getBasis();
        let basisIndexOfLeavingVariable = rowIndex;
        let indexOfEnteringVariable = columnIndex;
        basis[basisIndexOfLeavingVariable] = indexOfEnteringVariable;

        //Ensures that the basis columns have proper form
        math.subset(matrix, math.index(math.range(0, rows), basis), math.zeros(rows, basis.length));

        for (let index = 0; index < basis.length; index++) {
            let variableIndex = basis[index];
            math.subset(matrix, math.index(index, variableIndex), 1);
        }
    }

    /**
     * Examines whether the tableau is cycling in case of primal degeneracy
     */
    checkCycling() {

        if (!(this.tableau.getTableauStates().has(TableauState.PRIMAL_DEGENERATED) || this.tableau.getTableauStates().has(TableauState.BIGM_DEGENERATED))) { return; }

        let previousBases = this.tableau.getArchivedInformation()[0];
        let basis = new Set(this.tableau.getBasis());

        for (let previousBasis of previousBases) {
            if (areEqualSets(basis, new Set(previousBasis))) {
                this.tableau.addTableauState(TableauState.CYCLING);
                return;
            }
        }
    }

    /**
     * Examines, whether the problem is primal degenerated and updates the tableau states in case it is
     */
    checkPrimalDegeneracy() {

        let tableauStates = this.tableau.getTableauStates();

        if (tableauStates.has(TableauState.PRIMAL_DEGENERATED)) { return; }

        let rhsValues =  this.tableau.getRightHandSideValues();

        if(typeof rhsValues == 'number'){ 
            if (rhsValues == 0) {
                this.tableau.addTableauState(TableauState.PRIMAL_DEGENERATED);
                return;
            } 
        } else {
            this.tableau.getRightHandSideValues().forEach((rightHandSideValue, index, matrix) => {
                if (rightHandSideValue == 0) {
                    this.tableau.addTableauState(TableauState.PRIMAL_DEGENERATED);
                    return;
                }
            });
        }        
    }

    /**
     * Examines, whether the problem is dual degenerated and updates the tableau states in case it is
     */
    checkDualDegeneracy() {

        let tableauStates = this.tableau.getTableauStates();
        let basis = this.tableau.getBasis();

        if (tableauStates.has(TableauState.DUAL_DEGENERATED) || !tableauStates.has(TableauState.OPTIMAL)) { return; }

        this.tableau.getObjectiveFunctionRow().forEach((coefficient, index, matrix) => {
            let columnIndex = index[1];

            // The basis will never include the number 0, therefore, dual degeneracy is independent of the objective function constant
            if (coefficient == 0 && !basis.includes(columnIndex)) {
                this.tableau.addTableauState(TableauState.DUAL_DEGENERATED);
                return;
            }
        });
    }
}

areEqualSets = (a, b) => a.size === b.size && [...a].every(value => b.has(value));
