/**
 * Object that handles the whole algorithm and all its computations. At start a linear program is provided which is then solved using the simplex algorithm. 
 * 
 * @class 
 * @param {ObjectiveFunction} objectiveFunction The objective function of the linear program
 * @param {Map<string, Variable>} decisionVariables A map containing decision variable names as keys and the actual variables as values
 * @param {Array<Constraints>} constraints An array of constraints that constraint the linea program
 */

class Simplex {
    constructor(objectiveFunction, decisionVariables, constraints) {
        this.objectiveFunction = objectiveFunction;
        this.decisionVariables = decisionVariables;
        this.decisionVariablesArray = null;
        this.constraints = [constraints];
        this.maxObjectiveFunction = null;
    }

    /**
     * Selects and applies a suitable algorithm to solve the provided linear program
     * @returns {Tableau} A simplex tableau to which the simplex algorithm was applied
     * @TODO Implement the actual primal simplex algorithm as well as the one for bigM problems
     */
    apply() {
        
        let simplexType = determineBestSimplexType(this);
        let tableau;

        switch (simplexType) {
            case SimplexType.PRIMAL:
                this.constraints.push(simplifySimplexConstraints(this.getConstraints()));
                tableau = buildSimplexTableau(this);
                tableau.addTableauState(TableauState.FEASIBLE);
                new PrimalSimplex(tableau).solve();
                break;
            case SimplexType.DUAL:
                this.constraints.push(simplifySimplexConstraints(this.getConstraints()));
                tableau = buildSimplexTableau(this);
                tableau.addTableauState(TableauState.DUAL_FEASIBLE);
                new DualSimplex(tableau).solve();
                break;
            case SimplexType.BIG_M:
                this.constraints.push(simplifyBigMConstraints(this.getConstraints()));
                tableau = buildBigMTableau(this);
                new BigM(tableau).solve();
                break;
        }

        //Implements integer feasibility by implementing branch and bound method
        if (this.hasToBeIntegerFeasible() && tableau.getTableauStates().has(TableauState.FEASIBLE)) {
            console.log("Entering Branch and Bound");
            tableau = new BranchAndBound(this, tableau).calculateIntegerSolution();
        }

        return tableau;
    }

    /**
     * Adds an additional constraint to a simplex tableau that already is optimal
     * @param {Tableau} tableau The simplex tableau to which the constraint shall be added
     * @param {Constraint} constraint The additional constraint that shall be added to the tableau
     */
    addConstraint(tableau, constraint) {

        let simplifiedConstraints = simplifySimplexConstraints([constraint]);

        if (!tableau.getTableauStates().has(TableauState.OPTIMAL)) {
            console.log("The given simplex tableau is not optimal, therefore not dual-feasible")
            return;
        }

        for (let index = 0; index < simplifiedConstraints.length; index++) {
            let simplifiedConstraint = simplifiedConstraints[index];

            if (tableau.getTableauStates().has(TableauState.OPTIMAL)) {
                let dualSimplex = new DualSimplex(tableau);
                tableau = dualSimplex.integrateAdditionalConstraint(this, simplifiedConstraint);
                // Why exactly is the simplex tableau not returned but nevertheless the variable is overwritten? This does not have any effect?!
            } else {
                console.log("It was not possible to fully implement the given constraint!");
                tableau.addTableauState(TableauState.INFEASIBLE);
                return;
            }
        }
    }

    /**
     * Evaluates if the linear program has to fulfill integer feasibility for certain variables. 
     * 
     * NOTE: Is only called if the this.apply() method is performed -> the perfomance of this methode does not really matter
     * @returns {Boolean} A boolean indicating whether the linear program is an integer or mixed integer linear program
     */
    hasToBeIntegerFeasible() {
        for (let variable of this.getDecisionVariablesArray()) {
            if (variable.getVariableTypes().has(VariableType.INTEGER)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Computes an array containing all values (variables) of the decision variables map if it was not created before.
     * 
     * NOTE: Because there is no way to update the decision variables map, the array does not have to be altered, after it has been established once
     * @returns 
     */
    getDecisionVariablesArray() {
        if (this.decisionVariablesArray == null) {
            this.decisionVariablesArray = [...this.decisionVariables.values()];
        }

        return this.decisionVariablesArray;
    }

    /**
     * @returns {ObjectiveFunction} An objective function that is guaranteed to be an objective function that has to be maximized
     */
    getMaxObjectiveFunction() {
        if (this.maxObjectiveFunction == null) {
            this.maxObjectiveFunction = transformToMaxObjectiveFunction(this.objectiveFunction);
        }

        return this.maxObjectiveFunction;
    }

    /**
     * @returns {ObjectiveFunction} The objective function of the simplex instance
     */
    getObjectiveFunction() {
        return this.objectiveFunction;
    }

    /**
     * @returns {Array<Constraint>} The most recent array of constraints of the simplex instance
     */
    getConstraints() {
        return this.constraints[this.constraints.length - 1];
    }

    /**
     * @returns {Map<string, Variable>} A map consisting of variable names as keys and the corresponding variables as values
     */
    getDecisionVariables() {
        return this.decisionVariables;
    }
}

/**
 * Determines the best simplex type to solve a given linear program
 * @param {Simplex} simplex A simplex instance whose constraints and objective function should be examined regarding their feasibility for concrete implementations of the simplex algorithm
 * @returns {SimplexType} The simplex type that is best suited to solve the given linear program
 */
function determineBestSimplexType(simplex) {

    let maxObjectiveFunction = simplex.getMaxObjectiveFunction();
    let constraints = simplex.getConstraints();

    if (checkPrimalFeasibility(constraints)) {
        return SimplexType.PRIMAL;
    }

    else if (checkDualFeasibility(maxObjectiveFunction)) {
        return SimplexType.DUAL;
    }

    return SimplexType.BIG_M;
}

/**
 * Examines whether a provided array of constraints is primal feasible or not
 * @param {ObjectiveFunction} objectiveFunction The objective function whose dual feasibility shall be examined
 * @returns {Boolean} A boolean value indicating whether the objective function is dual feasible or not
 */
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

/**
 * Examines whether a provided objective function is dual feasible or not 
 * @param {ObjectiveFunction} objectiveFunction The objective function whose dual feasibility shall be examined
 * @returns {Boolean} A boolean value indicating whether the objective function is dual feasible or not
 */
function checkDualFeasibility(objectiveFunction) {
    let dualFeasible = true;

    objectiveFunction.getTerms().forEach((coefficient, variable) => {
        if (coefficient > 0) {
            dualFeasible = false;
        }
    });

    return dualFeasible;
}