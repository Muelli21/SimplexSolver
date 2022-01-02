/**
 * Object meant as container for information gathered during branch and bound procedure. One such object is created in every branching step.
 * 
 * @class 
 * @param {BranchAndBound} branchAndBound The governing branch and bound instance 
 * @param {Branch} parent The current branch's parent branch
 * @param {Array<Branch>} additionalConstraints An array of constraints that will be integrated into the current branch
 */

class Branch {
    constructor(branchAndBound, parent, additionalConstraints) {
        this.branchAndBound = branchAndBound;
        this.additionalConstraints = additionalConstraints; //Type: Array - is initialized as an empty array
        this.simplexTableau = null; //Is set when branch and bound is initialized

        this.parent = parent; //parent Type: Branch
        this.leftChild; //Type: Branch
        this.rightChild; //Type: Branch

        this.feasible = false; //Indicates whether the branch is feasible after integrating the additional constraints
        this.integerFeasible = false; //Indicates whether the branch is integer feasible
    }

    /**
     * Applies the simplex algorithm to the current branch including its additional constraints by adding them to the former simplex tableau
     * 
     * REMARK: The "solve" and "evaluate" method have been put into two single methods, because we only have to evaluate a branch's feasibility 
     * when it actually has to be evaluted. On the other hand, the objective function value is used to choose the sequence in which the branches are evaluted. 
     */
    solve() {
        let simplex = this.branchAndBound.getSimplex();
        let constraint = this.additionalConstraints[this.additionalConstraints.length - 1];

        if (this.simplexTableau == null) {
            this.simplexTableau = this.parent.getSimplexTableau().copy();
        }

        this.simplexTableau.addTableauState(TableauState.OPTIMAL); //To integrate further constraints, the simplex tableau has to be optimal
        simplex.addConstraint(this.simplexTableau, constraint);
    }

    /**
     * Evaluates whether the simplex tableau is integer feasible or not
     */
    evaluate() {
        if (this.simplexTableau == null) {
            console.log("This branch could not be evaluated, because it has not been solved yet.");
            return;
        }

        if (this.isFeasible()) {
            this.checkIntegerFeasibility();
        }
    }

    /**
     * Splits the current branch into to child branches, which each integrate an additional constraint with an integer-valued right hand side value
     * @param {Variable} decisionVariable The decision variable that will be used in branching, i.e. that will be split
     * @param {number} rightHandSideValue The current right hand side value which will be floored and ceiled to create the new constraints
     */
    split(decisionVariable, rightHandSideValue) {

        let leftConstraint = new Constraint(ConstraintType.SMALLER_THAN, Math.floor(rightHandSideValue));
        leftConstraint.addTerm(decisionVariable.getName(), 1);
        let leftChild = new Branch(this.branchAndBound, this, [...this.additionalConstraints, leftConstraint]);

        let rightConstraint = new Constraint(ConstraintType.BIGGER_THAN, Math.ceil(rightHandSideValue));
        rightConstraint.addTerm(decisionVariable.getName(), 1);
        let rightChild = new Branch(this.branchAndBound, this, [...this.additionalConstraints, rightConstraint]);

        this.branchAndBound.addToCandidateList(leftChild, rightChild);
    }

    /**
     * Evaluates whether each decision variable of type integer already is integer-valued
     * 
     * REMARK: Because there are not native integer values in javascript, but only floats, rounding errors make this task problematic. However, the problem can be bypassed by fixing the number.
     */
    checkIntegerFeasibility() {

        let simplexTableau = this.simplexTableau;

        let matrix = simplexTableau.getMatrix();
        let decisionVariablesMap = simplexTableau.getDecisionVariables();
        let decisionVariablesArray = [...decisionVariablesMap.values()];
        let basis = simplexTableau.getBasis();
        let variableTypeVector = simplexTableau.getTableauVariableTypes();

        for (let index = 0; index < basis.length; index++) {

            let basisVariableIndex = basis[index];
            let variableType = variableTypeVector[basisVariableIndex];

            if (variableType != TableauVariableType.DECISION_VARIABLE) { continue; }

            let decisionVariable = decisionVariablesArray[basisVariableIndex - 1];
            let variableTypes = decisionVariable.getVariableTypes();
            let rightHandSideValue = matrix.subset(math.index(index, 0));
            let isIntegerVariable = variableTypes.has(VariableType.INTEGER);

            //Could be problematic, because JS uses floats -> weird fix using toFixed() method
            let isIntegerFeasible = Number.isInteger(Number(rightHandSideValue.toFixed(5)));

            if (isIntegerVariable && !isIntegerFeasible) {
                this.split(decisionVariable, rightHandSideValue);
                return;
            }
        }

        this.integerFeasible = true;
        this.branchAndBound.addIntegerBranch(this);
    }

    /**
     * Returns and if necessary computes the branch's objective function value 
     * @returns {number} The objective function value of the solved branch
     */
    getObjectiveFunctionValue() {
        if (this.simplexTableau == null) {
            this.solve();
        }

        if (this.isFeasible()) {
            let matrix = this.simplexTableau.getMatrix();
            return matrix.subset(math.index(matrix.size()[0] - 1, 0))
        }

        console.log("It was not possible to return the branch's objective function value!");
        return null;
    }

    /**
     * @returns {Boolean} Indicating whether the branch is feasible without the criterium of integer feasibility
     */
    isFeasible() {
        return this.simplexTableau == null ? false : !this.simplexTableau.getTableauStates().has(TableauState.INFEASIBLE);
    }

    /**
     * Updates the branch's simplex tableau to the provided one. 
     * @param {Tableau} simplexTableau The simplex tableau that shall be set as the branch's new tableau
     */
    setSimplexTableau(simplexTableau) {
        this.simplexTableau = simplexTableau;
    }

    /**
     * @returns {Tableau} The branch's simplex tableau
     */
    getSimplexTableau() {
        return this.simplexTableau;
    }

    /**
     * @returns {Array<Constraint>} An array of constraints that is integrated into the current branch in addition to the constraints of the relaxed problem
     */
    getAdditionalConstraints() {
        return this.additionalConstraints;
    }
}