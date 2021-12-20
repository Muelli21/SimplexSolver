/**
 * Function used to build simplex tableaus. Proper functioning can only be ensured if the linear program can actually be solved by the revised simplex algorithm
 * @param {Simplex} simplex The simplex instance for which the tableau will be built
 * @returns {Tableau} The simplex tableau that was generated
 */
function buildSimplexTableau(simplex) {

    //Adds coefficients and slack variables
    //-> one slack variable per constraint 

    let constraints = simplex.getConstraints();
    let decisionVariables = simplex.getDecisionVariables();

    console.log(decisionVariables);

    let numberOfRows = constraints.length + 1; // +1 because of the objective function
    let numberOfColumns = 1 + decisionVariables.size + constraints.length; // +1 because of the rhs-values; constraints.length = number of slack-variables

    let matrix = math.zeros(numberOfRows, numberOfColumns);
    let basis = [];

    //Adds rhs-Values, coefficients and slack-variables 
    for (let index = 0; index < constraints.length; index++) {
        let constraint = constraints[index];

        //Adds slack-variables and the rhs-value to coefficient-matrix
        let slackVariableIndex = 1 + decisionVariables.size + index;

        matrix.subset(math.index(index, slackVariableIndex), 1);
        matrix.subset(math.index(index, 0), constraint.getRightHandSideValue());

        //Adds basic-variable-index to basis
        basis.push(slackVariableIndex);

        //Adds constraint-coefficients to coefficient-matrix
        let terms = constraint.getTerms();

        terms.forEach((coefficient, constraintDecisionVariableName) => {
            let decisionVariableIndex = 1 + getDecisionVariableIndex(simplex, constraintDecisionVariableName);
            matrix.subset(math.index(index, decisionVariableIndex), coefficient);
        });
    }

    //Adds objective function constant and coefficients
    let objectiveFunction = simplex.getMaxObjectiveFunction();
    implementObjectiveFunction(objectiveFunction, matrix, simplex);

    //Creates array with variable types
    let variableTypeArray = createVariableTypeArray(decisionVariables.size, constraints.length, 0);

    let tableau = new Tableau(decisionVariables, variableTypeArray, matrix, basis);
    tableau.archiveCurrentInformation();
    return tableau;
}