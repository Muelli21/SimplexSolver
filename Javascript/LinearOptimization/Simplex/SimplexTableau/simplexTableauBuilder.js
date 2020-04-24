function buildSimplexTableau(simplex) {
    //Add coefficients and slack variables
    //-> per constraint one slack variable

    let constraints = simplex.getConstraints();
    let decisionVariables = simplex.getDecisionVariables();

    let numberOfRows = constraints.length + 1;
    // +1 because of the objective function
    let numberOfColumns = 1 + decisionVariables.size + constraints.length;
    // +1 because of the rhs-values; constraints.length = number of slack-variables

    let coefficientMatrixObject = new Matrix(numberOfRows, numberOfColumns);
    let coefficientMatrix = coefficientMatrixObject.getMatrix();
    let basis = [];

    //Adds rhs-Values, coefficients and slack-variables 
    for (let index = 0; index < constraints.length; index++) {
        let constraint = constraints[index];

        //Adds slack-variables and the rhs-value to coefficient-matrix
        let slackVariableIndex = 1 + decisionVariables.size + index;
        coefficientMatrix[index][slackVariableIndex] = 1;
        coefficientMatrix[index][0] = constraint.getRightHandSideValue();

        //Adds basic-variable-index to basis
        basis.push(slackVariableIndex);

        //Adds constraint-coefficients to coefficient-matrix
        let terms = constraint.getTerms();
        terms.forEach((coefficient, constraintDecisionVariableName) => {
            let decisionVariableIndex = 1 + getDecisionVariableIndex(simplex, constraintDecisionVariableName);
            coefficientMatrix[index][decisionVariableIndex] = coefficient;
        });
    }

    //Adds objective function constant and coefficients
    let objectiveFunction = simplex.getMaxObjectiveFunction();
    implementObjectiveFunction(objectiveFunction, coefficientMatrixObject, simplex);

    //Creates array with variable types
    let variableTypeVector = createVariableTypeVector(decisionVariables.size, constraints.length, 0);

    let simplexTableau = new SimplexTableau(decisionVariables, variableTypeVector, coefficientMatrixObject, basis);
    console.log(simplexTableau);
    return simplexTableau;
}