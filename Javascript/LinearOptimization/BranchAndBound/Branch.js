class Branch {
    constructor(branchAndBound, parent, additionalConstraints) {
        this.branchAndBound = branchAndBound;
        this.additionalConstraints = additionalConstraints;
        this.simplexTableau = null;

        this.parent = parent;
        this.leftChild;
        this.rightChild;

        this.feasible = false;
        this.integerFeasible = false;
    }

    solve() {
        let simplex = this.branchAndBound.getSimplex();
        let constraint = this.additionalConstraints[this.additionalConstraints.length - 1];

        if (this.simplexTableau == null) {
            this.simplexTableau = this.parent.getSimplexTableau().copy();
        }

        this.simplexTableau.addSimplexTableauState(SimplexTableauState.OPTIMAL);
        simplex.addConstraint(this.simplexTableau, constraint);
    }

    evaluate() {
        if (this.simplexTableau == null) {
            console.log("This branch could not be evaluated, because it has not been solved yet.");
            return;
        }

        if (this.isFeasible()) {
            this.checkIntegerFeasibility();
        }
    }

    //Either the variable names or the variables have to be put into the map -> decide for one!
    split(decisionVariable, rightHandSideValue) {

        let leftConstraint = new Constraint(ConstraintType.SMALLER_THAN, Math.floor(rightHandSideValue));
        leftConstraint.addTerm(decisionVariable.getName(), 1);
        this.leftChild = new Branch(this.branchAndBound, this, [...this.additionalConstraints, leftConstraint]);

        let rightConstraint = new Constraint(ConstraintType.BIGGER_THAN, Math.ceil(rightHandSideValue));
        rightConstraint.addTerm(decisionVariable.getName(), 1);
        this.rightChild = new Branch(this.branchAndBound, this, [...this.additionalConstraints, rightConstraint]);

        this.branchAndBound.addToCandidateList(this.leftChild, this.rightChild);
    }

    checkIntegerFeasibility() {
        let simplexTableau = this.simplexTableau;
        let coefficientMatrix = simplexTableau.getCoefficientMatrix().getMatrix();
        let decisionVariablesMap = simplexTableau.getDecisionVariables();
        let decisionVariablesArray = [...decisionVariablesMap.values()];
        let basis = simplexTableau.getBasis();
        let variableTypeVector = simplexTableau.getVariableTypeVector();

        for (let index = 0; index < basis.length; index++) {
            let basisVariableIndex = basis[index];
            let variableType = variableTypeVector[basisVariableIndex];

            if (variableType != SimplexVariableType.DECISION_VARIABLE) {
                continue;
            } 

            let decisionVariable = decisionVariablesArray[basisVariableIndex - 1];
            let variableTypes = decisionVariable.getVariableTypes();
            let rightHandSideValue = coefficientMatrix[index][0]
            let isIntegerVariable = variableTypes.has(VariableType.INTEGER);

            //Could be problematic, because JS is using floats -> weird fix using toFixed() method
            let isIntegerFeasible = Number.isInteger(Number(rightHandSideValue.toFixed(5)));

            if (isIntegerVariable && !isIntegerFeasible) {
                this.split(decisionVariable, rightHandSideValue);
                return;
            }
        }

        this.integerFeasible = true;
        this.branchAndBound.addIntegerBranch(this);
    }

    getObjectiveFunctionValue() {
        if (this.simplexTableau == null) {
            this.solve();
        }

        if (this.isFeasible()) {
            let coefficientMatrixObject = this.simplexTableau.getCoefficientMatrix();
            let coefficientMatrix = coefficientMatrixObject.getMatrix();
            return coefficientMatrix[coefficientMatrixObject.getRows() - 1][0];
        }

        return null;
    }

    isFeasible() {
        if (this.simplexTableau != null) {
            return !this.simplexTableau.getSimplexTableauStates().has(SimplexTableauState.INFEASIBLE);
        }

        return false;
    }

    setSimplexTableau(simplexTableau) {
        this.simplexTableau = simplexTableau;
    }

    getSimplexTableau() {
        return this.simplexTableau;
    }

    getAdditionalConstraints() {
        return this.additionalConstraints;
    }
}