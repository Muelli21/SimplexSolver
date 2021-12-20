/**
 * Function to build big-M tableaus when given a linear program in a simplex instance
 * @param {Simplex} simplex The simplex instance whose underlying linear program should be used
 * @returns {Tableau} The bigM-simplex-tableau that was created
 */
function buildBigMTableau(simplex) {
    //Standardizes all constraints by adding a slack-variable (<=), a slack- and an artificial-variable (>=) or an artificial-variable (=)
    //-> Either:
    //-> one slack-variable
    //-> one artificial-variable
    //-> a slack- and an artificial-variable

    let constraints = simplex.getConstraints();
    let decisionVariables = simplex.getDecisionVariables();

    let numberOfSlackVariables = 0;
    let numberOfArtificialVariables = 0;

    //Could be replaced by using the matrix.addColumn method to simplify this code. But since this can be done beforehand, it is better to alter as few arrays as possible
    for (let constraint of constraints) {
        switch (constraint.getConstraintType()) {
            case ConstraintType.EQUAL:
                numberOfArtificialVariables++;
                break;
            case ConstraintType.SMALLER_THAN:
                numberOfSlackVariables++;
                break;
            case ConstraintType.BIGGER_THAN:
                numberOfSlackVariables++;
                numberOfArtificialVariables++;
                break;
        }
    }

    let numberOfRows = constraints.length + 1; // + 1 because of the objective function
    let numberOfColumns = 1 + decisionVariables.size + numberOfSlackVariables + numberOfArtificialVariables; // + 1 because of the rhs-values; size because "decisionVariables" is a map

    let matrix = math.zeros(numberOfRows, numberOfColumns);
    let bigMMatrix = math.zeros(numberOfRows, numberOfColumns);
    let basis = [];

    //Adds rhs-Values, coefficients, slack- and artificial-variables
    let artificialVariableRowIndices = [];
    let slackVariableCount = 0;

    for (let index = 0; index < constraints.length; index++) {

        let constraint = constraints[index];

        //Adds rhs-value to coefficient-matrix
        matrix.subset(math.index(index, 0), constraint.getRightHandSideValue());

        //Adds slack- and artificial variables to coefficient-matrix
        let artificialVariableIndex;

        switch (constraint.getConstraintType()) {
            case ConstraintType.EQUAL:
                artificialVariableIndex = 1 + decisionVariables.size + numberOfSlackVariables + artificialVariableRowIndices.length;

                matrix.subset(math.index(index, artificialVariableIndex), 1);
                bigMMatrix.subset(math.index(matrix.size()[0] - 1, 1 + decisionVariables.size + numberOfSlackVariables + artificialVariableRowIndices.length), -1);

                artificialVariableRowIndices.push(index);
                basis.push(artificialVariableIndex);
                break;
            case ConstraintType.SMALLER_THAN:
                matrix.subset(math.index(index, 1 + decisionVariables.size + slackVariableCount), 1);

                basis.push(1 + decisionVariables.size + slackVariableCount);
                slackVariableCount++;
                break;
            case ConstraintType.BIGGER_THAN:
                artificialVariableIndex = 1 + decisionVariables.size + numberOfSlackVariables + artificialVariableRowIndices.length;

                matrix.subset(math.index(index, 1 + decisionVariables.size + slackVariableCount), -1);
                matrix.subset(math.index(index, artificialVariableIndex), 1);
                bigMMatrix.subset(math.index(matrix.size()[0] - 1, 1 + decisionVariables.size + numberOfSlackVariables + artificialVariableRowIndices.length), -1);

                artificialVariableRowIndices.push(index);
                basis.push(artificialVariableIndex);
                slackVariableCount++;
                break;
        }

        //Adds constraint-coefficients to coefficient-matrix
        constraint.getTerms().forEach((coefficient, constraintDecisionVariableName) => {
            let decisionVariableIndex = 1 + getDecisionVariableIndex(simplex, constraintDecisionVariableName);
            matrix.subset(math.index(index, decisionVariableIndex), coefficient);
        });
    }

    console.log("Coefficient matrix:");
    console.log(math.clone(matrix));

    console.log("BigM matrix:");
    console.log(math.clone(bigMMatrix));

    //Removes bigM-coefficients from objective function by using row-addition
    for (let artificialVariableRowIndex of artificialVariableRowIndices) {
        let objectiveFunctionRowIndex = matrix.size()[0] - 1;
        rowAdditionAmongMatrices(matrix, bigMMatrix, artificialVariableRowIndex, objectiveFunctionRowIndex, 1);
    }

    console.log("Coefficient matrix 2:");
    console.log(math.clone(matrix));

    console.log("BigM matrix 2:");
    console.log(math.clone(bigMMatrix));

    //Adds objective function constant and coefficients
    let objectiveFunction = simplex.getMaxObjectiveFunction();
    implementObjectiveFunction(objectiveFunction, matrix, simplex);

    //Creates array with variable types
    let variableTypes = createVariableTypeArray(decisionVariables.size, numberOfSlackVariables, numberOfArtificialVariables);

    let tableau = new Tableau(decisionVariables, variableTypes, matrix, basis);
    tableau.setBigMMatrix(bigMMatrix);

    tableau.addTableauState(TableauState.BIG_M_FEASIBLE);
    tableau.archiveCurrentInformation();
    console.log(tableau);
    return tableau;
}

/**
 * Adds the row with the index "rowIndex" of matrixB to the row with same index of matrixA. Before, the row of matrixB is multiplied by the "factor".
 * @param {*} matrixA The matrix whose row will be altered eventually
 * @param {*} matrixB The matrix whose row will be added to matrixA
 * @param {number} rowIndex The index of the row that should be added among the matrices
 * @param {number} factor The factor by which the row of matrixB will be multiplied before adding it to matrixA
 */
function rowAdditionAmongMatrices(matrixA, matrixB, rowIndexA, rowIndexB, factor) {

    if (matrixA.type != "DenseMatrix" || matrixB.type != "DenseMatrix") {
        console.log("Addition of rows among matrices can only be performed to dense matrices using this function! Type of the current matrixA: " + matrixA.type + " Type of the current matrixB: " + matrixB.type);
        return;
    }

    let rowB = matrixB._data[rowIndexB];
    let rowA = math.multiply(matrixA._data[rowIndexA], factor);
    let newRow = math.flatten(math.add(rowB, rowA));
    matrixB._data[rowIndexB] = newRow;
}

function rowAddition(matrix, rowIndexA, rowIndexB, factor) {

    if (matrix.type != "DenseMatrix") {
        console.log("Addition of rows can only be performed on dense matrices using this function! Type of the current matrix: " + matrix.type);
        return;
    }

    let rowA = matrix._data[rowIndexA];
    let rowB = matrix._data[rowIndexB];
    let newRow = math.flatten(math.add(rowB, math.multiply(rowA, factor)));
    matrix._data[rowIndexB] = newRow;
}

function multiplyRow(matrix, rowIndex, factor) {

    if (matrix.type != "DenseMatrix") {
        console.log("Addition of rows can only be performed on dense matrices using this function! Type of the current matrix: " + matrix.type);
        return;
    }

    let row = matrix._data[rowIndex];
    let newRow = math.flatten(math.multiply(row, factor));
    matrix._data[rowIndex] = newRow;
}