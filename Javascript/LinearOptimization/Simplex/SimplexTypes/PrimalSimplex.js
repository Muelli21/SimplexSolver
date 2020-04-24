class PrimalSimplex {
    constructor(simplexTableau) {
        this.simplexTableau = simplexTableau;
        console.log("primal");
    }

    //Applies the primal simplex algorithm to the given simplex tableau
    solve() {
        let simplexTableau = this.simplexTableau;
        let simplexTableauStates = simplexTableau.getSimplexTableauStates();
        simplexTableau.archiveCurrentInformation();

        while (simplexTableauStates.has(SimplexTableauState.FEASIBLE)) {
            let pivotIndices = this.findPivotElement();

            if (simplexTableauStates.has(SimplexTableauState.OPTIMAL)
                || simplexTableauStates.has(SimplexTableauState.UNBOUND)) {
                break;
            }

            let pivotRow = pivotIndices[0];
            let pivotColumn = pivotIndices[1];
            this.applyPivotStep(pivotRow, pivotColumn);
            this.checkPrimalDegeneracy();
        }

        this.checkDualDegeneracy();
        return simplexTableau;
    }

    //Determines the indices of the pivot element
    findPivotElement() {
        let simplexTableau = this.simplexTableau;
        let coefficientMatrixObject = simplexTableau.getCoefficientMatrix();
        let coefficientMatrix = coefficientMatrixObject.getMatrix();

        //Find the column with the highest objective function coeffcient
        let columnIndex = -1;
        let highestNumber = 0;

        for (let index = 1; index < coefficientMatrixObject.getColumns(); index++) {
            let objectiveFunctionCoefficient = coefficientMatrix[coefficientMatrix.length - 1][index];
            if (objectiveFunctionCoefficient > highestNumber) {
                highestNumber = objectiveFunctionCoefficient;
                columnIndex = index;
            }
        }

        //All coefficients in the objective Function are negative -> no improvement possible -> optimality is reached
        if (columnIndex == -1) {
            simplexTableau.addSimplexTableauState(SimplexTableauState.OPTIMAL);
            return [-1, -1];
        }

        //Find row in which the variable that enters the basis is restricted most
        let smallestFraction = -1;
        let rowIndex = -1;

        for (let currentRowIndex = 0; currentRowIndex < coefficientMatrixObject.getRows() - 1; currentRowIndex++) {
            let row = coefficientMatrix[currentRowIndex];
            let coefficient = row[columnIndex];

            if (coefficient <= 0) {
                continue;
            }

            let basisVariable = coefficientMatrix[currentRowIndex][0];
            let fraction = basisVariable / coefficient;

            if (fraction >= 0) {
                if (smallestFraction == -1 || fraction < smallestFraction) {
                    smallestFraction = fraction;
                    rowIndex = currentRowIndex;
                }
            }
        }

        //All coefficients in the pivot column are smaller equal zero -> unbound problem
        if (smallestFraction == -1) {
            simplexTableau.setSimplexTableauState(SimplexTableauState.UNBOUND);
            return [-1, -1];
        }

        return [rowIndex, columnIndex];
    }

    //Performs swap of basis variable
    applyPivotStep(rowIndex, columnIndex) {
        let simplexTableau = this.simplexTableau;
        let coefficientMatrixObject = simplexTableau.getCoefficientMatrix();
        let coefficientMatrix = coefficientMatrixObject.getMatrix();

        let pivotElement = coefficientMatrix[rowIndex][columnIndex];

        for (let currentRowIndex = 0; currentRowIndex < coefficientMatrixObject.getRows(); currentRowIndex++) {
            let row = coefficientMatrix[currentRowIndex];
            if (currentRowIndex == rowIndex) {
                continue;
            }

            let otherCoefficient = row[columnIndex];
            let factor = -1 * otherCoefficient / pivotElement;
            rowAddition(coefficientMatrixObject, rowIndex, currentRowIndex, factor);
        }

        multiplyRow(coefficientMatrixObject, rowIndex, 1 / pivotElement);

        let basis = simplexTableau.getBasis();
        let basisIndexOfLeavingVariable = rowIndex;
        let indexOfEnteringVariable = columnIndex;
        basis[basisIndexOfLeavingVariable] = indexOfEnteringVariable;

        simplexTableau.archiveCurrentInformation();
    }

    checkCycling() {
        let simplexTableau = this.simplexTableau;
        let currentCoefficientMatrixObject = simplexTableau.getCoefficientMatrix();
        let currentCoefficientMatrix = currentCoefficientMatrixObject.getMatrix();
        let previousCoefficientMatrices = simplexTableau.getArchivedInformation()[1];

        if (previousCoefficientMatrices.length != 0) {

            let equalEntries = true;
            let previousCoefficientMatrixObject = previousCoefficientMatrices[previousCoefficientMatrices.length - 1];
            let previousCoefficientMatrix = previousCoefficientMatrixObject.getMatrix();

            if ((previousCoefficientMatrixObject.getRows != currentCoefficientMatrixObject.getRows())
                || (previousCoefficientMatrixObject.getColumns() != currentCoefficientMatrixObject.getColumns()))

                for (let row of currentCoefficientMatrix) {
                    for (let column of row) {
                        let currentEntry = currentCoefficientMatrix[row][column];
                        let previousEntry = previousCoefficientMatrix[row][column];
                        if (currentEntry != previousEntry) {
                            equalEntries = false;
                        }
                    }
                }

            if (equalEntries == true) {
                simplexTableau.addSimplexTableauState(SimplexTableauState.CYCLING);
            }
        }
    }

    //Dual degeneracy
    checkDualDegeneracy() {

        let simplexTableau = this.simplexTableau;
        let simplexTableauState = simplexTableau.getSimplexTableauStates();

        if (simplexTableauState.has(SimplexTableauState.DUAL_DEGENERATED) || !simplexTableauState.has(SimplexTableauState.OPTIMAL)) {
            return;
        }

        let coefficientMatrix = simplexTableau.getCoefficientMatrix().getMatrix();
        let objectiveFunctionVector = coefficientMatrix[coefficientMatrix.length - 1];
        let basis = simplexTableau.getBasis();

        for (let columnIndex = 1; columnIndex < objectiveFunctionVector.length; columnIndex++) {
            let objectiveFunctionCoefficient = objectiveFunctionVector[columnIndex];
            if (objectiveFunctionCoefficient == 0 && !basis.includes(columnIndex)) {
                simplexTableau.addSimplexTableauState(SimplexTableauState.DUAL_DEGENERATED);
            }
        }
    }

    //Primal degeneracy
    checkPrimalDegeneracy() {

        let simplexTableau = this.simplexTableau;
        let simplexTableauState = simplexTableau.getSimplexTableauStates();
        if (simplexTableauState.has(SimplexTableauState.PRIMAL_DEGENERATED)) {
            return;
        }

        let coefficientMatrixObject = simplexTableau.getCoefficientMatrix();
        let coefficientMatrix = coefficientMatrixObject.getMatrix();

        for (let index = 0; index < coefficientMatrixObject.getRows() - 1; index++) {
            let rightHandSideValue = coefficientMatrix[index][0];

            if (rightHandSideValue == 0) {
                simplexTableau.addSimplexTableauState(SimplexTableauState.PRIMAL_DEGENERATED);
            }
        }
    }
}
