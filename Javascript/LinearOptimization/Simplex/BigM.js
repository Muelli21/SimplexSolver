class BigM {
    constructor(simplexTableau) {
        this.simplexTableau = simplexTableau;
    }

    //Here it probably makes sense to work with a second auxiliary coefficient matrix depicting the bigM values. 
    //The bigM-Code and the primal simplex code could be merged, since they share huge parts of similar code. 
    //Yet performance-wise it is probably more efficient to seperate both codes. 

    //Applies the primal simplex algorithm to the given simplex tableau
    solve() {
        let simplexTableau = this.simplexTableau;
        let simplexTableauStates = simplexTableau.getSimplexTableauStates();
        simplexTableau.archiveCurrentInformation();

        while (simplexTableauStates.has(SimplexTableauState.BIG_M_FEASIBLE)) {
            let pivotIndices = this.findPivotElement();
            let pivotRow = pivotIndices[0];
            let pivotColumn = pivotIndices[1];

            this.applyPivotStep(pivotRow, pivotColumn);
            this.simplify();
            this.checkFeasibility();

            if (simplexTableauStates.has(SimplexTableauState.FEASIBLE)) {
                simplexTableau.removeSimplexTableauState(SimplexTableauState.BIG_M_FEASIBLE);
                let primalSimplex = new PrimalSimplex(simplexTableau);
                return primalSimplex.solve();
            }
        }

        return simplexTableau;
    }

    //Determines the indices of the pivot element
    findPivotElement() {
        let simplexTableau = this.simplexTableau;
        let coefficientMatrixObject = simplexTableau.getCoefficientMatrix();
        let coefficientMatrix = coefficientMatrixObject.getMatrix();

        let bigMCoefficientMatrixObject = simplexTableau.getBigMCoefficientMatrix();
        let bigMCoefficientMatrix = bigMCoefficientMatrixObject.getMatrix();

        //Find the column with the highest objective function coeffcient
        let columnIndex = -1;
        let highestNumber = 0;

        //It Iterates through the objective function coefficients in the bigM-coefficientmatrix.
        //When there are several coefficients of the same size, the first one that occurs is chosen. 
        //Alternatively it would be possible to compare the bigM- as well as normal-coefficientmatrix entries of the respective entries. 
        //However, the effect on performance should not be significant, which is why I choose the simpler approach
        for (let index = 1; index < bigMCoefficientMatrixObject.getColumns(); index++) {
            let objectiveFunctionCoefficient = bigMCoefficientMatrix[bigMCoefficientMatrix.length - 1][index];
            if (objectiveFunctionCoefficient > highestNumber) {
                highestNumber = objectiveFunctionCoefficient;
                columnIndex = index;
            }
        }

        if (highestNumber == 0) {
            for (let index = 1; index < coefficientMatrixObject.getColumns(); index++) {
                let objectiveFunctionCoefficient = coefficientMatrix[coefficientMatrix.length - 1][index];
                if (objectiveFunctionCoefficient > highestNumber) {
                    highestNumber = objectiveFunctionCoefficient;
                    columnIndex = index;
                }
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

        let bigMCoefficientMatrixObject = simplexTableau.getBigMCoefficientMatrix();
        let bigMCoefficientMatrix = bigMCoefficientMatrixObject.getMatrix();

        let pivotElement = coefficientMatrix[rowIndex][columnIndex];

        for (let currentRowIndex = 0; currentRowIndex < coefficientMatrixObject.getRows(); currentRowIndex++) {
            let row = coefficientMatrix[currentRowIndex];
            if (currentRowIndex == rowIndex) {
                continue;
            }

            let otherCoefficient = row[columnIndex];
            let otherBigMCoefficient = bigMCoefficientMatrix[currentRowIndex][columnIndex];
            let factor = -1 * otherCoefficient / pivotElement;
            let bigMFactor = -1 * otherBigMCoefficient / pivotElement;

            rowAddition(coefficientMatrixObject, rowIndex, currentRowIndex, factor);
            if (currentRowIndex == bigMCoefficientMatrixObject.getRows() - 1) {
                rowAdditionAmongMatrices(coefficientMatrixObject, bigMCoefficientMatrixObject, rowIndex, currentRowIndex, bigMFactor);
            }
        }

        multiplyRow(coefficientMatrixObject, rowIndex, 1 / pivotElement);

        let basis = simplexTableau.getBasis();
        let basisIndexOfLeavingVariable = rowIndex;
        let indexOfEnteringVariable = columnIndex;
        basis[basisIndexOfLeavingVariable] = indexOfEnteringVariable;

        simplexTableau.archiveCurrentInformation();
    }

    simplify() {
        //Either remove full columns or set their values to 0
        //What is more efficient?
        //I have chosen to splice the matrices apart

        let simplexTableau = this.simplexTableau;

        let coefficientMatrixObject = simplexTableau.getCoefficientMatrix();
        let coefficientMatrix = coefficientMatrixObject.getMatrix();
        let bigMCoefficientMatrixObject = simplexTableau.getBigMCoefficientMatrix();
        let bigMCoefficientMatrix = bigMCoefficientMatrixObject.getMatrix();

        let variableTypeVector = simplexTableau.getVariableTypeVector();
        let basis = simplexTableau.getBasis();

        for (let index = 1; index < variableTypeVector.length; index++) {
            let objectiveFunctionVector = coefficientMatrix[coefficientMatrix.length - 1];
            let bigMObjectiveFunctionVector = bigMCoefficientMatrix[bigMCoefficientMatrix.length - 1];

            let variableType = variableTypeVector[index];

            let bigMObjectiveFunctionCoefficient = bigMObjectiveFunctionVector[index];
            let objectiveFunctionCoefficient = objectiveFunctionVector[index];
            let negativeCoefficient = (bigMObjectiveFunctionCoefficient < 0) || (bigMObjectiveFunctionCoefficient == 0 && objectiveFunctionCoefficient < 0);

            if (variableType == SimplexVariableType.ARTIFICIAL_VARIABLE && !basis.includes(index) && negativeCoefficient) {
                //simplify, since the column won't be chosen anyways
                variableTypeVector.splice(index, 1);
                coefficientMatrixObject.removeColumn(index);
                bigMCoefficientMatrixObject.removeColumn(index);
            }
        }
    }

    checkFeasibility() {
        let simplexTableau = this.simplexTableau;
        let bigMCoefficientMatrixObject = simplexTableau.getBigMCoefficientMatrix();
        let bigMCoefficientMatrix = bigMCoefficientMatrixObject.getMatrix();

        let objectiveFunctionVector = bigMCoefficientMatrix[bigMCoefficientMatrix.length - 1];

        let feasible = true;
        for (let objectiveFunctionCoefficient of objectiveFunctionVector) {
            if (objectiveFunctionCoefficient != 0) {
                feasible = false;
                break;
            }
        }

        if (feasible) {
            simplexTableau.addSimplexTableauState(SimplexTableauState.FEASIBLE);
        }
    }
}
