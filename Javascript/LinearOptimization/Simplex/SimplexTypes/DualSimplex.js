class DualSimplex {
    constructor(simplexTableau) {
        this.simplexTableau = simplexTableau;
        console.log("dual");
    }

    //Applies the primal simplex algorithm to the given simplex tableau
    solve() {
        let simplexTableau = this.simplexTableau;
        let simplexTableauStates = simplexTableau.getSimplexTableauStates();
        simplexTableau.archiveCurrentInformation();

        while (simplexTableauStates.has(SimplexTableauState.DUAL_FEASIBLE)) {
            let pivotIndices = this.findPivotElement();
            let pivotRow = pivotIndices[0];
            let pivotColumn = pivotIndices[1];

            if (simplexTableauStates.has(SimplexTableauState.UNBOUND)) {
                break;
            }

            this.applyPivotStep(pivotRow, pivotColumn);
            this.checkPrimalDegeneracy();
            this.checkFeasibility();

            if (simplexTableauStates.has(SimplexTableauState.FEASIBLE)) {
                simplexTableau.removeSimplexTableauState(SimplexTableauState.DUAL_FEASIBLE);
                let primalSimplex = new PrimalSimplex(simplexTableau);
                return primalSimplex.solve();
            }
        }

        //Is actually not necessary
        this.checkDualDegeneracy(simplexTableau);
        return simplexTableau;
    }

    //Determines the indices of the pivot element
    findPivotElement() {
        let simplexTableau = this.simplexTableau;
        let coefficientMatrixObject = simplexTableau.getCoefficientMatrix();
        let coefficientMatrix = coefficientMatrixObject.getMatrix();

        //Find the row with the highest right hand side value
        let rowIndex = -1;
        let lowestNumber = 0;

        for (let index = 0; index < coefficientMatrixObject.getRows() - 1; index++) {
            let value = coefficientMatrix[index][0];

            if (value < lowestNumber) {
                lowestNumber = value;
                rowIndex = index;
            }
        }

        //All values are positive -> no improvement in the dual problem possible -> primal optimality
        if (rowIndex == -1) {
            simplexTableau.addSimplexTableauState(SimplexTableauState.OPTIMAL);
            return [-1, -1];
        }

        //Find column in which the variable is restricted most
        let smallestFraction = -1;
        let columnIndex = -1;

        for (let index = 1; index < coefficientMatrixObject.getColumns(); index++) {
            let coefficient = coefficientMatrix[rowIndex][index];

            if (coefficient >= 0) {
                continue;
            }

            let objectiveFunctionCoefficient = coefficientMatrix[coefficientMatrix.length - 1][index];
            let fraction = objectiveFunctionCoefficient / coefficient;

            if (fraction >= 0) {
                if (smallestFraction == -1 || fraction < smallestFraction) {
                    smallestFraction = fraction;
                    columnIndex = index;
                }
            }
        }


        //All coefficients in the pivot column are smaller equal zero -> unbound problem
        if (smallestFraction == -1) {
            simplexTableau.addSimplexTableauState(SimplexTableauState.INFEASIBLE);
            simplexTableau.addSimplexTableauState(SimplexTableauState.UNBOUND);
            simplexTableau.removeSimplexTableauState(SimplexTableauState.DUAL_FEASIBLE);
            console.log("The problem is unbound using the dual simplex -> it is primal infeasible!");
            return [-1, -1];
        }

        return [rowIndex, columnIndex];
    }

    //Similar to primal simplex code
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

    //Adds an additional constraint to the simplex tableau and solves it
    integrateAdditionalConstraint(simplex, constraint) {
        //Code has to be written
        let simplexTableau = this.simplexTableau;
        let coefficientMatrixObject = simplexTableau.getCoefficientMatrix();
        let coefficientMatrix = coefficientMatrixObject.getMatrix();

        let rowIndex = coefficientMatrixObject.getRows() - 1; //insert at the position of the objective function
        let columnIndex = coefficientMatrixObject.getColumns();

        //Adds an additional row and column, a slack variable and the rhs-value
        coefficientMatrixObject.addRow(rowIndex)
        coefficientMatrixObject.addColumn(columnIndex);
        coefficientMatrix[rowIndex][columnIndex] = 1;
        coefficientMatrix[rowIndex][0] = constraint.getRightHandSideValue();

        let variableTypeVector = simplexTableau.getVariableTypeVector();
        variableTypeVector.push(SimplexVariableType.SLACK_VARIABLE);

        //Adds constraint-coefficients to coefficient-matrix
        let terms = constraint.getTerms();
        terms.forEach((coefficient, constraintDecisionVariableName) => {
            let decisionVariableIndex = 1 + getDecisionVariableIndex(simplex, constraintDecisionVariableName);
            coefficientMatrix[rowIndex][decisionVariableIndex] = coefficient;
        });

        //Restores canonical form of coefficient matrix
        let basis = simplexTableau.getBasis();
        for (let index = 0; index < basis.length; index++) {
            let basisIndex = basis[index];
            let coefficient = coefficientMatrix[rowIndex][basisIndex];

            rowAddition(coefficientMatrixObject, index, rowIndex, -1 * coefficient);
        }

        basis.push(coefficientMatrixObject.getColumns() - 1);
        simplexTableau.removeSimplexTableauState(SimplexTableauState.OPTIMAL);
        simplexTableau.addSimplexTableauState(SimplexTableauState.DUAL_FEASIBLE);
        return this.solve();
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

    //Similar to primal simplex code
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

    //Similar to primal simplex code
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

    checkFeasibility() {
        let simplexTableau = this.simplexTableau;
        let coefficientMatrixObject = simplexTableau.getCoefficientMatrix();
        let coefficientMatrix = coefficientMatrixObject.getMatrix();

        let feasible = true;
        for (let index = 0; index < coefficientMatrix.length - 1; index++) {
            let value = coefficientMatrix[index][0];
            if (value < 0) {
                feasible = false;
                break;
            }
        }

        if (feasible) {
            simplexTableau.addSimplexTableauState(SimplexTableauState.FEASIBLE);
        }
    }
}