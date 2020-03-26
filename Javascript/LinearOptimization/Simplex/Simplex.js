class Simplex {
    constructor(objectiveFunction, decisionVariables, constraints) {
        this.objectiveFunction = objectiveFunction;
        this.decisionVariablesMap = decisionVariables;
        this.decisionVariablesArray = null;
        this.constraints = [];
        this.constraints.push(constraints);
        this.maxObjectiveFunction = null;
    }

    apply() {
        let simplifiedConstraints = simplifyRhsEqualsZeroConstraints(this.getConstraints());
        this.constraints.push(simplifiedConstraints);
        let simplexType = determineBestSimplexType(this);
        let simplexTableau;

        switch (simplexType) {
            case SimplexType.PRIMAL:
                simplexTableau = buildPrimalSimplexTableau(this);
                let primalSimplex = new PrimalSimplex(simplexTableau);
                primalSimplex.solve();
                break;
            case SimplexType.DUAL:
                simplexTableau = buildDualSimplexTableau(this);
                let dualSimplex = new DualSimplex(simplexTableau);
                dualSimplex.solve();
                break;
            case SimplexType.BIG_M:
                simplexTableau = buildBigMTableau(this);
                let bigM = new BigM(simplexTableau);
                bigM.solve();
                break;
        }
        return simplexTableau;
    }

    addConstraint(simplexTableau, constraint) {
        let simplexTableauStates = simplexTableau.getSimplexTableauStates();
        if (simplexTableauStates.has(SimplexTableauState.OPTIMAL)) {
            let dualSimplex = new DualSimplex(simplexTableau);
            dualSimplex.integrateAdditionalConstraint(constraint);
        } else {
            console.log("The given simplex tableau is not optimal, therefore not dual-feasible")
        }
    }

    getObjectiveFunction() {
        return this.objectiveFunction;
    }

    getMaxObjectiveFunction() {
        if (this.maxObjectiveFunction == null) {
            this.maxObjectiveFunction = transformToMaxObjectiveFunction(this.objectiveFunction);
        }

        return this.maxObjectiveFunction;
    }

    getConstraints() {
        return this.constraints[this.constraints.length - 1];
    }

    getDecisionVariables() {
        return this.decisionVariablesMap;
    }

    getDecisionVariablesArray() {
        if (this.decisionVariablesArray == null) {
            this.decisionVariablesArray = [...this.decisionVariablesMap.values()];
        } else if (this.decisionVariablesMap.size != this.decisionVariablesArray.length) {
            this.decisionVariablesArray = [...this.decisionVariablesMap.values()];
        }
        return this.decisionVariablesArray;
    }
}

function getDecisionVariableIndex(simplex, variableName) {
    let decisionVariablesMap = simplex.getDecisionVariables();
    let decisionVariablesArray = simplex.getDecisionVariablesArray();
    let decisionVariable = decisionVariablesMap.get(variableName);
    let index = decisionVariablesArray.indexOf(decisionVariable);
    return index;
}

function buildPrimalSimplexTableau(simplex) {
    //Simplify constraints containing a rhs <= 0 and calculate the number of slack-variables needed
    //-> per constraint one slack variable

    console.log("primal");

    let constraints = simplex.getConstraints();
    let decisionVariables = simplex.getDecisionVariables();

    let numberOfRows = constraints.length + 1;
    // +1 because of the objective function
    let numberOfColumns = 1 + decisionVariables.size + constraints.length;
    // +1 because of the rhs-values; constraints.length = number of slack-variables

    let coefficientMatrixObject = new Matrix(numberOfRows, numberOfColumns);
    let coefficientMatrix = coefficientMatrixObject.getMatrix();
    let basis = [];

    //Transforms bigger-than to smaller-than-constraints, adds rhs-Values, coefficients and slack-variables 
    for (let index = 0; index < constraints.length; index++) {
        let constraint = constraints[index];

        //Transforms constraint
        let constraintType = constraint.getConstraintType();
        if (constraintType == ConstraintType.BIGGER_THAN) {
            let clonedConstraint = constraint.clone();
            clonedConstraint.multiply(-1);
            constraints.splice(index, 1, clonedConstraint);
            constraint = clonedConstraint;
        }

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
    simplexTableau.addSimplexTableauState(SimplexTableauState.FEASIBLE);
    console.log(simplexTableau);
    return simplexTableau;
}

function buildDualSimplexTableau(simplex) {
    //Transform all constraints to smaller-than constraints and add slack-variables
    //Equals-constraints have to be split up
    //-> per constraint one slack variable

    console.log("dual");

    //Transforms bigger-than- and equal-constraints to smaller-than-constraints
    let constraints = [];
    for (let constraint of simplex.getConstraints()) {

        //Transforms constraint
        let constraintType = constraint.getConstraintType();
        let clonedConstraint;

        switch (constraintType) {
            case ConstraintType.SMALLER_THAN:
                clonedConstraint = constraint.clone();
                constraints.push(clonedConstraint);
                break;
            case ConstraintType.BIGGER_THAN:
                clonedConstraint = constraint.clone();
                clonedConstraint.multiply(-1);
                constraints.push(clonedConstraint);
                break;
            case ConstraintType.EQUAL:
                constraints.push(...splitEqualConstraint(constraint));
                break;
        }
    }

    let decisionVariables = simplex.getDecisionVariables();

    let numberOfRows = constraints.length + 1; // +1 because of the objective function
    let numberOfColumns = 1 + decisionVariables.size + constraints.length; // +1 because of the rhs-values; constraints.length = number of slack-variables

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
    simplexTableau.addSimplexTableauState(SimplexTableauState.DUAL_FEASIBLE);
    console.log(simplexTableau);
    return simplexTableau;
}

function buildBigMTableau(simplex) {
    //standardize all constraints by adding a slack-variable (<=), a slack- and an artificial-variable (>=) or an artificial-variable (=)
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

        let rhsValue = constraint.getRightHandSideValue();
        if (rhsValue < 0) {
            let clonedConstraint = constraint.clone();
            clonedConstraint.multiply(-1);
            constraints.splice(index, 1, clonedConstraint);
            constraint = clonedConstraint;
        }

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

    //Transforms bigger-than to smaller-than-constraints, adds rhs-Values, coefficients and slack-variables
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

function implementObjectiveFunction(objectiveFunction, coefficientMatrixObject, simplex) {
    //Adds objective function constant and coefficients
    let coefficientMatrix = coefficientMatrixObject.getMatrix();
    let terms = objectiveFunction.getTerms();
    let numberOfRows = coefficientMatrixObject.getRows();
    coefficientMatrix[numberOfRows - 1][0] = objectiveFunction.getConstant();

    terms.forEach((coefficient, objectiveFunctionDecisionVariableName) => {
        let decisionVariableIndex = 1 + getDecisionVariableIndex(simplex, objectiveFunctionDecisionVariableName);
        coefficientMatrix[numberOfRows - 1][decisionVariableIndex] = coefficient;
    });
}

function createVariableTypeVector(numberOfDecisionVariables, numberOfSlackVariables, numberOfArtificialVariables) {
    let variableTypeVector = [
        SimplexVariableType.VALUE,
        ...Array.from({ length: numberOfDecisionVariables }, i => SimplexVariableType.DECISION_VARIABLE),
        ...Array.from({ length: numberOfSlackVariables }, i => SimplexVariableType.SLACK_VARIABLE),
        ...Array.from({ length: numberOfArtificialVariables }, i => SimplexVariableType.ARTIFICIAL_VARIABLE)
    ];
    return variableTypeVector;
}

function determineBestSimplexType(simplex) {
    let maxObjectiveFunction = simplex.getMaxObjectiveFunction();
    let constraints = simplex.getConstraints();

    //Determine simplex type. Look at the constraints and objective function coefficients
    let primalFeasible = checkPrimalFeasibility(constraints);
    let dualFeasible = checkDualFeasibility(maxObjectiveFunction);

    if (primalFeasible) {
        //Transform all constraints with a non-positive rhs-value into smaller-than constraints and apply primal simplex
        return SimplexType.PRIMAL;
    }

    else if (dualFeasible) {
        //Transform all constraints into smaller-than-constraints and apply dual simplex
        return SimplexType.DUAL;
    }

    else {
        //Add artificial variables to constraints, where necessary, and apply the big-M-method
        return SimplexType.BIG_M;
    }
}

function checkPrimalFeasibility(constraints) {
    for (let constraint of constraints) {
        let constraintType = constraint.getConstraintType();
        let rhsValue = constraint.getRightHandSideValue();

        let biggerThanWithPositiveRhs = (constraintType == ConstraintType.BIGGER_THAN) && rhsValue > 0;
        let smallerThanWithNegativeRhs = (constraintType == ConstraintType.SMALLER_THAN) && rhsValue < 0;
        let equalWithNonZeroRhs = (constraintType == ConstraintType.EQUAL) && rhsValue != 0;

        if (biggerThanWithPositiveRhs || smallerThanWithNegativeRhs || equalWithNonZeroRhs) {
            return false;
        }
    }

    return true;
}

function checkDualFeasibility(objectiveFunction) {
    let dualFeasible = true;
    let terms = objectiveFunction.getTerms();
    terms.forEach((coefficient, variable) => {
        if (coefficient > 0) {
            dualFeasible = false;
        }
    });

    return dualFeasible;
}

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

function simplifyRhsEqualsZeroConstraints(constraints) {
    let simplifiedConstraints = [];

    for (let constraint of constraints) {

        let constraintType = constraint.getConstraintType();
        let rhs = constraint.getRightHandSideValue();

        if (rhs == 0) {
            switch (constraintType) {
                case ConstraintType.EQUAL:
                    simplifiedConstraints.push(...splitEqualConstraint(constraint));
                    continue;

                case ConstraintType.BIGGER_THAN:
                    let clonedConstraint = constraint.clone();
                    clonedConstraint.multiply(-1);
                    simplifiedConstraints.push(clonedConstraint);
                    continue;
            }
        }
        simplifiedConstraints.push(constraint);
    }

    return simplifiedConstraints;
}