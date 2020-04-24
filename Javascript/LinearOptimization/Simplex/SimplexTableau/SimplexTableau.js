class SimplexTableau {
    constructor(decisionVariables, simplexVariableTypeVector, coefficientMatrix, basis) {

        this.decisionVariables = decisionVariables;
        this.simplexVariableTypeVector = simplexVariableTypeVector;
        this.simplexTableauStates = new Set([]);

        this.coefficientMatrix = coefficientMatrix;
        this.bigMCoefficientMatrix = null;
        this.basis = basis; //Consists of variable indices

        this.previousBases = [];
        this.previousCoefficientMatrices = [];
        this.previousBigMCoefficientMatrices = [];
    }

    addSimplexTableauState(simplexTableauState) {
        this.simplexTableauStates.add(simplexTableauState);
    }

    removeSimplexTableauState(simplexTableauState) {
        this.simplexTableauStates.delete(simplexTableauState);
    }

    getSimplexTableauStates() {
        return this.simplexTableauStates;
    }

    getDecisionVariables() {
        return this.decisionVariables;
    }

    getCoefficientMatrix() {
        return this.coefficientMatrix;
    }

    getBigMCoefficientMatrix() {
        return this.bigMCoefficientMatrix;
    }

    setBigMCoefficientMatrix(bigMCoefficientMatrix) {
        this.bigMCoefficientMatrix = bigMCoefficientMatrix;
    }

    getBasis() {
        return this.basis;
    }

    getArchivedInformation() {
        return [this.previousBases, this.previousCoefficientMatrices, this.previousBigMCoefficientMatrices];
    }

    getVariableTypeVector() {
        return this.simplexVariableTypeVector;
    }

    getNumberOfArchivedEntries() {
        return this.previousBases.length;
    }

    //The tableau states and previous information is not copied along. 
    copy() {
        let copy = new SimplexTableau(new Map(this.decisionVariables), [...this.simplexVariableTypeVector], this.coefficientMatrix.copy(),[...this.basis]);
        
        if (this.bigMCoefficientMatrix != null) {
            copy.setBigMCoefficientMatrix(this.bigMCoefficientMatrix.copy());
        }
        
        return copy;
    }

    archiveCurrentInformation() {
        this.previousCoefficientMatrices.push(this.coefficientMatrix.copy());
        this.previousBases.push(this.basis.clone());

        if (this.bigMCoefficientMatrix != null) {
            this.previousBigMCoefficientMatrices.push(this.bigMCoefficientMatrix.copy());
        }
    }

    removeFromArchive(index, numberOfEntries) {
        if (index < 0 || index > this.previousBases.length - 1) {
            console.log("The index " + index + " does not belong to archived information!");
            return;
        }

        this.previousBases.splice(index, numberOfEntries);
        this.previousCoefficientMatrices.splice(index, 1);
        this.previousBigMCoefficientMatrices.splice(index, 1);
    }
}
