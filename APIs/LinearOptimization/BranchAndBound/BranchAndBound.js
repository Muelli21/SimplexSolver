LOW_MEMORY_USAGE = false;

/**
 * Object whose instances can handle whole branch and bound procedures
 * 
 * The branch and bound algorithm takes an optimal simplex tableau as its input. This simplex tableau is then used as the relaxation
 * 
 * @class 
 * @param {Simplex} simplex The simplex instance that is used in this specific branch and bound procedure
 * @param {SimplexTableau} tableau The simplex tableau of the relaxed linear program
 */

class BranchAndBound {

    constructor(simplex, tableau) {
        this.tableau = tableau;
        this.rule = BranchingRule.LIFO;
        this.simplex = simplex;

        this.headBranch; //Initialized in calculateIntegerSolution()
        this.integerBranches = []; //Type: array - stores all integer branches, even the bad ones
        this.valueOfBestIntegerBranch; // Type: number - objective function value of the best integer branch

        this.candidateList = []; //Type: array
        this.numberOfSubbranches = 0; //Counts how many sub branches are created during branch and bound procedure
    }


    /**
     * Starts the branch and bound procedure and iteratively adds constraints to compute an integer solution
     * @returns {Tableau} A simplex tableau that is integer feasible for all variables that have to be integer-valued
     */
    calculateIntegerSolution() {

        this.headBranch = new Branch(this, null, []);
        this.headBranch.setSimplexTableau(this.tableau);
        this.candidateList.push(this.headBranch);

        if (this.rule == BranchingRule.LIFO || this.rule == BranchingRule.FIFO) {
            while (!this.candidateList.isEmpty()) {

                console.debug(this.candidateList.clone())

                let currentBranch = BranchingRule.FIFO ? this.candidateList.shift() : this.candidateList.pop();
                if (currentBranch != this.headBranch) { currentBranch.solve(); }
                currentBranch.evaluate();
            }
        }

        else {
            while (!this.candidateList.isEmpty()) {
                //Iterates through branches and continues with the most promising one
                //Sorts candidate List by objective function value
                //Efficiency when sorting could be improved by inserting each branch into its right slot
                //Here, a heap structure could be used to improve performance
                this.candidateList.sort((a, b) => a.getObjectiveFunctionValue() - b.getObjectiveFunctionValue()); // Is not accessed durig first iteration
                let mostPromisingBranch = this.candidateList[0];
                mostPromisingBranch.evaluate();
                this.candidateList.shift();
            }
        }

        this.integerBranches.sort((a, b) => a.getObjectiveFunctionValue() - b.getObjectiveFunctionValue());

        //Return simplexTableau and not the branch
        let bestIntegerBranch = this.integerBranches[0];
        let simplexTableau = bestIntegerBranch.getSimplexTableau();
        return simplexTableau;
    }

    /**
     * Adds a given branch to the list of integer feasible branches of the branch and bound procedure. 
     * @param {Branch} branch Branch that is added to the list of integer feasible branches
     */
    addIntegerBranch(branch) {

        let objectiveFunctionValue = branch.getObjectiveFunctionValue();

        if (LOW_MEMORY_USAGE) {
            if (this.integerBranches.isEmpty()) {
                this.integerBranches.push(branch);

            } else if (objectiveFunctionValue < this.integerBranches[0].getObjectiveFunctionValue()) { // < since they are negative numbers
                console.log(objectiveFunctionValue + " : " + this.integerBranches[0].getObjectiveFunctionValue());
                this.integerBranches[0] = branch;
            }
        } else {

            this.integerBranches.push(branch);
        }

        if (this.valueOfBestIntegerBranch == null || objectiveFunctionValue > this.valueOfBestIntegerBranch) {
            this.valueOfBestIntegerBranch = objectiveFunctionValue;
        }
    }

    /**
     * Adds the left and the righ child branches to the candidate list. 
     * 
     * The exact behavior depends on the branching rule that is used. In case of MUB the branches are solved before they are inserted into the candidate list. 
     * In this case branches whose objective function values are worse than the current best integer solution can pruned.
     * @param {Branch} leftBranch The left child of the current branch
     * @param {Branch} rightBranch The right child of the current branch
     */
    addToCandidateList(leftBranch, rightBranch) {
        this.numberOfSubbranches = this.numberOfSubbranches + 2;
        if (this.rule == BranchingRule.MUB) {
            leftBranch.solve();
            rightBranch.solve();

            if (this.valueOfBestIntegerBranch != null) {
                if (leftBranch.isFeasible() && leftBranch.getObjectiveFunctionValue() > this.valueOfBestIntegerBranch) {
                    this.candidateList.push(leftBranch);
                }

                if (rightBranch.isFeasible() && rightBranch.getObjectiveFunctionValue() > this.valueOfBestIntegerBranch) {
                    this.candidateList.push(rightBranch);
                }
            } else {
                if (leftBranch.isFeasible()) { this.candidateList.push(leftBranch); }
                if (rightBranch.isFeasible()) { this.candidateList.push(rightBranch); }
            }
        } else {
            this.candidateList.push(leftBranch, rightBranch);
        }
    }

    /**
     * @returns {Simplex} The simplex instance that is used in this branch and bound procedure
     */
    getSimplex() {
        return this.simplex;
    }
}