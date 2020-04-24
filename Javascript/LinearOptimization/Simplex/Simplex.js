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
        let simplexType = determineBestSimplexType(this);
        let simplexTableau;

        switch (simplexType) {
            case SimplexType.PRIMAL:
                this.constraints.push(simplifySimplexConstraints(this.getConstraints()));
                simplexTableau = buildSimplexTableau(this);
                simplexTableau.addSimplexTableauState(SimplexTableauState.FEASIBLE);
                let primalSimplex = new PrimalSimplex(simplexTableau);
                primalSimplex.solve();
                break;
            case SimplexType.DUAL:
                this.constraints.push(simplifySimplexConstraints(this.getConstraints()));
                simplexTableau = buildSimplexTableau(this);
                simplexTableau.addSimplexTableauState(SimplexTableauState.DUAL_FEASIBLE);
                let dualSimplex = new DualSimplex(simplexTableau);
                dualSimplex.solve();
                break;
            case SimplexType.BIG_M:
                this.constraints.push(simplifyBigMConstraints(this.getConstraints()));
                simplexTableau = buildBigMTableau(this);
                let bigM = new BigM(simplexTableau);
                bigM.solve();
                break;
        }

        //Implements integer feasibility
        if (this.hasToBeIntegerFeasible()) {
            let branchAndBound = new BranchAndBound(this, simplexTableau);
            simplexTableau = branchAndBound.calculateIntegerSolution();
        }

        return simplexTableau;
    }

    addConstraint(simplexTableau, constraint) {
        let simplifiedConstraints = simplifySimplexConstraints([constraint]);

        if (!simplexTableau.getSimplexTableauStates().has(SimplexTableauState.OPTIMAL)) {
            console.log("The given simplex tableau is not optimal, therefore not dual-feasible")
            return;
        }

        for (let index = 0; index < simplifiedConstraints.length; index++) {
            let simplifiedConstraint = simplifiedConstraints[index];
            let simplexTableauStates = simplexTableau.getSimplexTableauStates();

            if (simplexTableauStates.has(SimplexTableauState.OPTIMAL)) {
                let dualSimplex = new DualSimplex(simplexTableau);
                simplexTableau = dualSimplex.integrateAdditionalConstraint(this, simplifiedConstraint);

            } else {
                console.log("It was not possible to fully implement the given constraint!");
                simplexTableau.addSimplexTableauState(SimplexTableauState.INFEASIBLE);
                return;
            }
        }
    }

    //Is only called if the this.apply() method is performed -> the perfomance of this methode does not really matter
    hasToBeIntegerFeasible() {
        let decisionVariablesArray = this.getDecisionVariablesArray();
        for(let decisionVariable of decisionVariablesArray) {
            let variableTypes = decisionVariable.getVariableTypes();
            
            if(variableTypes.has(VariableType.INTEGER)) {
                return true;
            }
        }

        return false;
    }

    //Because there is no way to update the decision variables map,
    //the array does not have to be altered, after it has been established once
    getDecisionVariablesArray() {
        if (this.decisionVariablesArray == null) { 
            this.decisionVariablesArray = [...this.decisionVariablesMap.values()];
        }

        return this.decisionVariablesArray;
    }

    getMaxObjectiveFunction() {
        if (this.maxObjectiveFunction == null) {
            this.maxObjectiveFunction = transformToMaxObjectiveFunction(this.objectiveFunction);
        }

        return this.maxObjectiveFunction;
    }

    getObjectiveFunction() {
        return this.objectiveFunction;
    }

    getConstraints() {
        return this.constraints[this.constraints.length - 1];
    }

    getDecisionVariables() {
        return this.decisionVariablesMap;
    }
}

//Determines optimal simplex type
function determineBestSimplexType(simplex) {
    let maxObjectiveFunction = simplex.getMaxObjectiveFunction();
    let constraints = simplex.getConstraints();

    let primalFeasible = checkPrimalFeasibility(constraints);
    let dualFeasible = checkDualFeasibility(maxObjectiveFunction);

    if (primalFeasible) {
        return SimplexType.PRIMAL;
    }

    else if (dualFeasible) {
        return SimplexType.DUAL;
    }

    else {
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