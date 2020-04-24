//Returns the index of a decision variable given its decision variable name
function getDecisionVariableIndex(simplex, variableName) {

    let decisionVariablesMap = simplex.getDecisionVariables();
    let decisionVariablesArray = simplex.getDecisionVariablesArray();
    let decisionVariable = decisionVariablesMap.get(variableName);
    let index = decisionVariablesArray.indexOf(decisionVariable);
    return index;
}

//Adds objective function constant and coefficients to the simplex tableau
function implementObjectiveFunction(objectiveFunction, coefficientMatrixObject, simplex) {
    let coefficientMatrix = coefficientMatrixObject.getMatrix();
    let terms = objectiveFunction.getTerms();
    let numberOfRows = coefficientMatrixObject.getRows();
    coefficientMatrix[numberOfRows - 1][0] = objectiveFunction.getConstant();

    terms.forEach((coefficient, objectiveFunctionDecisionVariableName) => {
        let decisionVariableIndex = 1 + getDecisionVariableIndex(simplex, objectiveFunctionDecisionVariableName);
        coefficientMatrix[numberOfRows - 1][decisionVariableIndex] = coefficient;
    });
}

//Creates a vector containing the variable type for every variable used in the simplex tableau
function createVariableTypeVector(numberOfDecisionVariables, numberOfSlackVariables, numberOfArtificialVariables) {
    let variableTypeVector = [
        SimplexVariableType.VALUE,
        ...Array.from({ length: numberOfDecisionVariables }, i => SimplexVariableType.DECISION_VARIABLE),
        ...Array.from({ length: numberOfSlackVariables }, i => SimplexVariableType.SLACK_VARIABLE),
        ...Array.from({ length: numberOfArtificialVariables }, i => SimplexVariableType.ARTIFICIAL_VARIABLE)
    ];
    return variableTypeVector;
}

//Splits equal-constraints into a smaller- and bigger-than-constraint
function splitEqualConstraint(constraint) {
    let constraintType = constraint.getConstraintType();
    if (constraintType != ConstraintType.EQUAL) {
        console.log("This constraint is not an equal-constraint and cannot be split!");
        return [];
    }

    let biggerThanConstraint = constraint.clone();
    let smallerThanConstraint = constraint.clone();
    biggerThanConstraint.multiply(-1);

    return [biggerThanConstraint, smallerThanConstraint];
}

//Simplifies constraints by 
//- splitting equal constraints
//- transforming bigger-than to smaller-than-constraints
function simplifySimplexConstraints(constraints) {
    let simplifiedConstraints = [];

    for (let constraint of constraints) {
        let constraintType = constraint.getConstraintType();
        let clonedConstraint;

        switch (constraintType) {
            case ConstraintType.EQUAL:
                simplifiedConstraints.push(...splitEqualConstraint(constraint));
                break;
            case ConstraintType.BIGGER_THAN:
                clonedConstraint = constraint.clone();
                clonedConstraint.multiply(-1);
                simplifiedConstraints.push(clonedConstraint);
                break;
            case ConstraintType.SMALLER_THAN:
                clonedConstraint = constraint.clone();
                simplifiedConstraints.push(clonedConstraint);
                break;
        }
    }

    return simplifiedConstraints;
}

//Simplifies constraints by 
//- making the rhs-value of constraints positive
function simplifyBigMConstraints(constraints) {
    let simplifiedConstraints = [];

    for (let constraint of constraints) {
        let rhs = constraint.getRightHandSideValue();
        let clonedConstraint = constraint.clone();
        if (rhs < 0) clonedConstraint.multiply(-1);
        simplifiedConstraints.push(clonedConstraint);
    }

    return simplifiedConstraints;
}