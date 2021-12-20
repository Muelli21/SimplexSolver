/**
 * Concrete implementation of the primal simplex algorithm that uses the AbstractSimplex class as its underlying
 * 
 * @class
 * @param {Tableau} tableau The simplex tableau that will be used in the procedures of the primal simplex algorithm
 */

class PrimalSimplex extends AbstractSimplex {
    constructor(tableau) {
        super(tableau);

        console.log("Primal");
        console.log(tableau);
        debugger;
    }

    /**
     * Applies the primal simplex algorithm to the given simplex tableau
     * @returns {Tableau} A simplex tableau to which the simplex algorithm was applied. This tableau is solved to optimality, if it is feasible.
     */
    solve() {
        while (this.tableau.getTableauStates().has(TableauState.FEASIBLE)) {

            let pivotIndices = this.findPivotElement();
            let pivotRow = pivotIndices[0];
            let pivotColumn = pivotIndices[1];

            if (pivotRow == -1 && pivotColumn == - 1) { break; }

            // this.tableau.getBasis()[pivotRow] = pivotColumn; // pivotRow = basisIndexOfLeavingVariable; pivotColumn = variableTypeVectorIndexOfEnteringVariable
            // this.updateTableau(this.tableau.getBasis());

            this.applyPivotStep(pivotRow, pivotColumn);
            this.checkPrimalDegeneracy();
            this.checkCycling();
            this.tableau.archiveCurrentInformation();
        }

        this.checkDualDegeneracy();
        return this.tableau;
    }

    /**
     * @returns {Array<number>} An array containing the row and column index of the pivot element. In case it does not exist, [-1, -1] will be returned. 
     */
    findPivotElement() {

        let matrix = this.tableau.getMatrix();
        let objectiveFunctionCoefficients = math.flatten(this.tableau.getObjectiveFunctionRow()).toArray().slice(1);

        //1. Find the column with the highest objective function coeffcient
        let highestNumber = math.max(objectiveFunctionCoefficients);

        //All objective function coefficients are negative -> optimality
        if (highestNumber <= 0) {
            this.tableau.addTableauState(TableauState.OPTIMAL);
            return [-1, -1];
        }

        let columnIndex = objectiveFunctionCoefficients.indexOf(highestNumber) + 1; // + 1, because the rhs value was sliced away

        //2. Find the row with the smallest ratio of right hand side value and coefficient
        // ASSUMPTION: The right hand side values are all positive? 
        // let rightHandSideColumn = this.tableau.getRightHandSideColumn();
        // let currentColumn = math.column(matrix, columnIndex);

        // let fractions = math.dotDivide(rightHandSideColumn, currentColumn);
        // let fractionsArray = math.flatten(fractions).toArray().slice(0, matrix.size()[0] - 1); //Necessary to slice away the objective function's fraction of coefficient and rhs
        // let filteredFractionsArray = fractionsArray.filter(number => number >= 0);

        // //All coefficients in the pivot column are smaller equal zero -> unbound problem
        // if (filteredFractionsArray.isEmpty()) {
        //     tableau.setTableauState(TableauState.UNBOUND);
        //     return [-1, -1];
        // }

        // let smallestFraction = math.min(filteredFractionsArray);
        // let rowIndex = fractionsArray.indexOf(smallestFraction);

        let smallestFraction = -1;
        let rowIndex = -1;

        for (let currentRowIndex = 0; currentRowIndex < matrix.size()[0] - 1; currentRowIndex++) {

            let coefficient = matrix.subset(math.index(currentRowIndex, columnIndex));

            if (coefficient <= 0) { continue; }

            let basisVariable = matrix.subset(math.index(currentRowIndex, 0));
            let fraction = basisVariable / coefficient;

            if (fraction >= 0 && (smallestFraction == -1 || fraction < smallestFraction)) {
                smallestFraction = fraction;
                rowIndex = currentRowIndex;
            }
        }

        //All coefficients in the pivot column are smaller equal zero -> unbound problem
        if (smallestFraction == -1) {
            this.tableau.setTableauState(TableauState.UNBOUND);
            return [-1, -1];
        }

        return [rowIndex, columnIndex];
    }
}