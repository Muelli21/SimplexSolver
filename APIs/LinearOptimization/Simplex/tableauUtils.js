/**
 * Computes the index of a decision variable given its decision variable name
 * @param {Simplex} simplex A simplex tableau whose decision variables are used 
 * @param {string} variableName The name of the variable whose index shall be returned
 * @returns {number} The index that corresponds to the given variable name
 */
function getDecisionVariableIndex(simplex, variableName) {

    let decisionVariablesMap = simplex.getDecisionVariables();
    let decisionVariable = decisionVariablesMap.get(variableName);
    let index = [...decisionVariablesMap.values()].indexOf(decisionVariable);
    return index;
}

/**
 * Adds the objective function's constant and coefficients to the coefficient matrix
 * @param {ObjectiveFunction} objectiveFunction The objective function that should be implemented into the coefficient matrix
 * @param {*} matrix A coefficient matrix 
 * @param {Simplex} simplex The simplex algorithm the coefficient matrix belongs to
 */
function implementObjectiveFunction(objectiveFunction, matrix, simplex) {
    
    let terms = objectiveFunction.getTerms();
    let numberOfRows = matrix.size()[0];
    matrix.subset(math.index(numberOfRows - 1, 0), objectiveFunction.getConstant());

    terms.forEach((coefficient, objectiveFunctionDecisionVariableName) => {
        let decisionVariableIndex = 1 + getDecisionVariableIndex(simplex, objectiveFunctionDecisionVariableName);
        matrix.subset(math.index(numberOfRows - 1, decisionVariableIndex), coefficient);
    });
}

 /**
  * Creates an array containing the tableau variable types for every variable that is used in the simplex tableau
  * @param {number} numberOfDecisionVariables Number of decision variables
  * @param {number} numberOfSlackVariables Number of slack variables
  * @param {number} numberOfArtificialVariables Number of artificial variables
  * @returns {Array<TableauVariableType>} An array of tableau variable types
  */
function createVariableTypeArray(numberOfDecisionVariables, numberOfSlackVariables, numberOfArtificialVariables) {
    return [
        TableauVariableType.VALUE,
        ...Array.from({ length: numberOfDecisionVariables }, i => TableauVariableType.DECISION_VARIABLE),
        ...Array.from({ length: numberOfSlackVariables }, i => TableauVariableType.SLACK_VARIABLE),
        ...Array.from({ length: numberOfArtificialVariables }, i => TableauVariableType.ARTIFICIAL_VARIABLE)
    ];
}

/**
 * Splits an EQUAL constraint into a BIGGER_THAN and SMALLER_THAN constraint and returns those in an array
 * @param {Constraint} constraint An EQUAL constraint that should be split into a BIGGER_THAN and a SMALLER_THAN constraint
 * @returns {Array<Constraint>} An array of constraints
 */
function splitEqualConstraint(constraint) {
        
    if (constraint.getConstraintType() != ConstraintType.EQUAL) {
        console.log("This constraint is not an equal-constraint and cannot be split!");
        return [];
    }

    let biggerThanConstraint = constraint.clone().multiply(-1);
    let smallerThanConstraint = constraint.clone();

    return [biggerThanConstraint, smallerThanConstraint];
}

/**
 * Simplifies constraints by
 * 1. splitting EQUAL-constraints
 * 2. transforming BIGGER_THAN to SMALLER_THAN constraints
 * @param {Array<Constraint>} constraints An array of constraints that should be simplified
 * @returns {Array<Constraint>} An array of simplified constraints
 */
function simplifySimplexConstraints(constraints) {
    let simplifiedConstraints = [];
    let clonedConstraint;

    for (let constraint of constraints) {
        switch (constraint.getConstraintType()) {
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

/**
 * Simplifies bigM constraints by ensuring that a positive right hand side value
 * @param {Array<Constraint>} constraints An array of constraints
 * @returns {Array<Constraints>} An array of constraints whose right hand side values are all positive
 */
function simplifyBigMConstraints(constraints) {
    return constraints.map((constraint) => constraint.getRightHandSideValue() < 0 ? constraint.clone().multiply(-1) : constraint.clone());
}

/**
 * Adds a row at a given index to the provided matrix
 * @param {*} matrix Matrix to which a row should be added at row with the index "rowIndex"
 */
 function addRowToMatrix(matrix, rowIndex) {

    console.log("Row addition")

    if (matrix.type != "DenseMatrix") {
        console.log("Rows can only be added to dense matrices using this function! Type of the current matrix: " + matrix.type);
        return;
    }

    let columns = matrix.size()[1];
    matrix._data.splice(rowIndex, 0, Array(columns).fill(0));
    matrix._size[0]++; //Increases the matrix' row-size explicitly
}

/**
 * Adds a column at a given index to the provided matrix
 * @param {*} matrix Matrix to which a column should be added at the column with the index "columnIndex"
 */
function addColumnToMatrix(matrix, columnIndex) {

    console.log("Column addition")


    if (matrix.type != "DenseMatrix") {
        console.log("Rows can only be added to dense matrices using this function! Type of the current matrix: " + matrix.type);
        return;
    }

    for (let row of matrix._data) {
        row.splice(columnIndex, 0, 0); //adds 0 as value of newly created matrix-entry
    }

    matrix._size[1]++; //Increases the matrix' row-size explicitly
}

math.addRow = function(matrix) {
    return math.concat([Array(matrix.size()[1]).fill(0)], matrix, 0);
}

math.addColumn = function(matrix) {
    return math.concat(matrix, Array(matrix.size()[0]).fill([0]), 1); 
}

/**
 * Adds a row at a given index to the provided matrix
 * @param {*} matrix Matrix to which a row should be added at row with the index "rowIndex"
 */
 function removeRowFromMatrix(matrix, rowIndex) {

    console.log("Row removal")


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

    console.log("Column removal")


    if (matrix.type != "DenseMatrix") {
        console.log("Rows can only be added to dense matrices using this function! Type of the current matrix: " + matrix.type);
        return;
    }

    for (let row of matrix._data) { row.splice(columnIndex, 1); }
    matrix._size[1]--; //Decreases the matrix' column-size explicitly
}