function buildBigMTableau(simplex) {
    //Standardize all constraints by adding a slack-variable (<=), a slack- and an artificial-variable (>=) or an artificial-variable (=)
    //-> Either
    //-> one slack-variable
    //-> one artificial-variable
    //-> a slack- and an artificial-variable

    console.log("bigM");

    let constraints = simplex.getConstraints();
    let decisionVariables = simplex.getDecisionVariables();

    let numberOfSlackVariables = 0;
    let numberOfArtificialVariables = 0;

    //Could be replaced by using the matrix.addColumn method to simplify this code
    for (let index = 0; index < constraints.length; index++) {
        let constraint = constraints[index];
        let constraintType = constraint.getConstraintType();
        switch (constraintType) {
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

    let numberOfRows = constraints.length + 1; // +1 because of the objective function
    let numberOfColumns = 1 + decisionVariables.size + numberOfSlackVariables + numberOfArtificialVariables; // +1 because of the rhs-values

    let coefficientMatrixObject = new Matrix(numberOfRows, numberOfColumns);
    let coefficientMatrix = coefficientMatrixObject.getMatrix();
    let bigMCoefficientMatrixObject = new Matrix(numberOfRows, numberOfColumns);
    let bigMCoefficientMatrix = bigMCoefficientMatrixObject.getMatrix();
    let basis = [];

    //Adds rhs-Values, coefficients, slack- and artificial-variables
    let artificialVariableRowIndices = [];
    let slackVariableCount = 0;
    for (let index = 0; index < constraints.length; index++) {
        let constraint = constraints[index];
        let constraintType = constraint.getConstraintType();

        //Adds rhs-value to coefficient-matrix
        coefficientMatrix[index][0] = constraint.getRightHandSideValue();

        //Adds slack- and artificial variables to coefficient-matrix
        let artificialVariableIndex;
        switch (constraintType) {
            case ConstraintType.EQUAL:
                artificialVariableIndex = 1 + decisionVariables.size + numberOfSlackVariables + artificialVariableRowIndices.length;
                coefficientMatrix[index][artificialVariableIndex] = 1;
                bigMCoefficientMatrix[coefficientMatrixObject.getRows() - 1][1 + decisionVariables.size + numberOfSlackVariables + artificialVariableRowIndices.length] = -1;
                artificialVariableRowIndices.push(index);
                basis.push(artificialVariableIndex);
                break;
            case ConstraintType.SMALLER_THAN:
                coefficientMatrix[index][1 + decisionVariables.size + slackVariableCount] = 1;
                basis.push(1 + decisionVariables.size + slackVariableCount);
                slackVariableCount++;
                break;
            case ConstraintType.BIGGER_THAN:
                artificialVariableIndex = 1 + decisionVariables.size + numberOfSlackVariables + artificialVariableRowIndices.length;
                coefficientMatrix[index][1 + decisionVariables.size + slackVariableCount] = -1;
                coefficientMatrix[index][artificialVariableIndex] = 1;
                bigMCoefficientMatrix[coefficientMatrixObject.getRows() - 1][1 + decisionVariables.size + numberOfSlackVariables + artificialVariableRowIndices.length] = -1;
                artificialVariableRowIndices.push(index);
                basis.push(artificialVariableIndex);
                slackVariableCount++;
                break;
        }

        //Adds constraint-coefficients to coefficient-matrix
        let terms = constraint.getTerms();
        terms.forEach((coefficient, constraintDecisionVariableName) => {
            let decisionVariableIndex = 1 + getDecisionVariableIndex(simplex, constraintDecisionVariableName);
            coefficientMatrix[index][decisionVariableIndex] = coefficient;
        });
    }

    //Removes bigM-coefficients from objective function by using row-addition
    for (let artificialVariableRowIndex of artificialVariableRowIndices) {
        let objectiveFunctionRowIndex = coefficientMatrixObject.getRows() - 1;
        rowAdditionAmongMatrices(coefficientMatrixObject, bigMCoefficientMatrixObject, artificialVariableRowIndex, objectiveFunctionRowIndex, 1);
    }

    //Adds objective function constant and coefficients
    let objectiveFunction = simplex.getMaxObjectiveFunction();
    implementObjectiveFunction(objectiveFunction, coefficientMatrixObject, simplex);

    //Creates array with variable types
    let variableTypeVector = createVariableTypeVector(decisionVariables.size, numberOfSlackVariables, numberOfArtificialVariables);

    let simplexTableau = new SimplexTableau(decisionVariables, variableTypeVector, coefficientMatrixObject, basis);
    simplexTableau.setBigMCoefficientMatrix(bigMCoefficientMatrixObject);
    simplexTableau.addSimplexTableauState(SimplexTableauState.BIG_M_FEASIBLE);
    console.log(simplexTableau);
    return simplexTableau;
}