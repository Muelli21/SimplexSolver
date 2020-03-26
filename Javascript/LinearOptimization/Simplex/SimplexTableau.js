class SimplexTableau {
    constructor(decisionVariables, simplexVariableTypeVector, coefficientMatrix, basis) {

        this.decisionVariables = decisionVariables;
        this.simplexVariableTypeVector = simplexVariableTypeVector;
        this.simplexTableauStates = new Set([]);

        this.coefficientMatrix = coefficientMatrix;
        this.bigMCoefficientMatrix = null;
        this.basis = basis;

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

    archiveCurrentInformation() {
        this.previousCoefficientMatrices.push(this.coefficientMatrix.copy());
        this.previousBases.push(this.basis.clone());

        if (this.bigMCoefficientMatrix != null) {
            this.previousBigMCoefficientMatrices.push(this.bigMCoefficientMatrix.copy());
        }
    }
}
