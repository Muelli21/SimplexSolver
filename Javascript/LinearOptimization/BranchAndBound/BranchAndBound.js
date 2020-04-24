class BranchAndBound  {
    constructor (simplex, relaxationTableau) {
        this.relaxationTableau = relaxationTableau;
        this.rule = BranchingRule.MUB;
        this.simplex = simplex;

        this.headBranch;
        this.integerBranches = [];

        this.candidateList = [];
        this.numberOfSubbranches = 0;
    }

    calculateIntegerSolution() {
        
        this.headBranch = new Branch(this, null, []);
        this.headBranch.setSimplexTableau(this.relaxationTableau);
        this.candidateList.push(this.headBranch);

        if (this.rule == BranchingRule.LIFO || this.rule == BranchingRule.FIFO) {
            while(!this.candidateList.isEmpty()) {
                let currentBranch = BranchingRule.FIFO ? this.candidateList[0] : this.candidateList[this.candidateList.length - 1];
                currentBranch.solve();
                currentBranch.evaluate();
                BranchingRule.FIFO ? this.candidateList.shift() : this.candidateList.pop();
            }
        }

        else {
            while(!this.candidateList.isEmpty()) {
                //Iterate through branches and continue with the most promising one
                //Sort candidate List by objective function value
                //Efficiency for sorting could be improved by inserting each branch into its right slot
                this.candidateList.sort((a,b) => a.getObjectiveFunctionValue() - b.getObjectiveFunctionValue());
                let mostPromisingBranch = this.candidateList[0];
                mostPromisingBranch.evaluate();
                this.candidateList.shift();
            }
        }

        this.integerBranches.sort((a,b) => a.getObjectiveFunctionValue() - b.getObjectiveFunctionValue());
        //Return simplexTableau and not the branch
        let bestIntegerBranch = this.integerBranches[0];
        let simplexTableau = bestIntegerBranch.getSimplexTableau();
        return simplexTableau;
    }

    addIntegerBranch(branch) {
        this.integerBranches.push(branch);
    }

    addToCandidateList(leftBranch, rightBranch) {
        this.numberOfSubbranches = this.numberOfSubbranches + 2; 
        if (this.rule == BranchingRule.MUB) {
            leftBranch.solve();
            rightBranch.solve();

            if (leftBranch.isFeasible()) {this.candidateList.push(leftBranch);}
            if (rightBranch.isFeasible()) {this.candidateList.push(rightBranch);}

        } else {
            this.candidateList.push(leftBranch, rightBranch);
        }
    }

    getSimplex() {
        return this.simplex;
    }
}