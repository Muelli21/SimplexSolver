/**
 * Concrete implementation of the dual simplex algorithm that uses the AbstractSimplex class as its underlying
 * 
 * @class
 * @param {Tableau} tableau The simplex tableau that will be used in the procedures of the primal simplex algorithm
 */

class DualSimplex extends AbstractSimplex {
    constructor(tableau) {
        super(tableau);
        console.log("Dual");
    }

    /**
     * Applies the dual simplex algorithm to the given simplex tableau. The tableau is handed over to an instance of the primal simplex as soon as a a basic feasible solution is reached. 
     * @returns {Tableau} A simplex tableau to which the dual simplex algorithm was applied. This tableau is either infeasible or a basic feasible solution
     */
    solve() {

        let tableauStates = this.tableau.getTableauStates();

        while (tableauStates.has(TableauState.DUAL_FEASIBLE)) {

            let pivotIndices = this.findPivotElement();
            let pivotRow = pivotIndices[0];
            let pivotColumn = pivotIndices[1];

            if (pivotRow == -1 || pivotColumn == - 1) { break; }

            // this.tableau.getBasis()[pivotRow] = pivotColumn; // pivotRow = basisIndexOfLeavingVariable; pivotColumn = variableTypeVectorIndexOfEnteringVariable
            // this.updateTableau(this.tableau.getBasis());

            this.applyPivotStep(pivotRow, pivotColumn);
            this.checkPrimalDegeneracy();
            this.checkFeasibility();
            this.checkCycling();
            this.tableau.archiveCurrentInformation();

            if (tableauStates.has(TableauState.FEASIBLE)) {
                this.tableau.removeTableauState(TableauState.DUAL_FEASIBLE);
                return new PrimalSimplex(this.tableau).solve();
            }
        }

        //Is actually not necessary
        this.checkDualDegeneracy(this.tableau);
        return this.tableau;
    }

    /**
     * @returns {Array<number>} An array containing the row and column index of the pivot element. In case it does not exist, [-1, -1] will be returned. 
     */
    findPivotElement() {

        let matrix = this.tableau.getMatrix();
        let rightHandSideValues = this.tableau.getRightHandSideValues();

        //1. Find the row with the highest negative right hand side value
        let lowestRHSValue = math.min(rightHandSideValues);

        //No rhs-values are negative and no objective function coefficients are positive 
        //-> no improvement in the dual problem possible -> primal optimality
        let objectiveFunctionRow = this.tableau.getObjectiveFunctionRow();
        let objectiveFunctionCoefficients = math.flatten(objectiveFunctionRow).toArray().slice(1);

        if (lowestRHSValue >= 0 && math.min(objectiveFunctionCoefficients) <= 0) {
            this.tableau.addTableauState(TableauState.OPTIMAL);
            return [-1, -1];
        }

        let rowIndex = math.flatten(rightHandSideValues).toArray().indexOf(lowestRHSValue);

        //2. Find column in which the variable is restricted most

        // Not possible, because fractions might be zero while the coefficient is positive
        // let currentRow = math.row(this.tableau.getMatrix(), rowIndex);
        // let fractions = math.dotDivide(objectiveFunctionRow, currentRow);
        // let fractionsArray = math.flatten(fractions).toArray().slice(1);
        // let filteredFractionsArray = fractionsArray.filter(number => number >= 0);
        // let smallestFraction = math.min(filteredFractionsArray);
        // let columnIndex = fractionsArray.indexOf(smallestFraction) + 1; // + 1, because the first entry of the fractions array was sliced away

        let smallestFraction = -1;
        let columnIndex = -1;

        for (let index = 1; index < objectiveFunctionCoefficients.length + 1; index++) {
            let coefficient = matrix.subset(math.index(rowIndex, index));

            if (coefficient >= 0) { continue; }

            let objectiveFunctionCoefficient = objectiveFunctionCoefficients[index - 1];
            let fraction = objectiveFunctionCoefficient / coefficient;

            if (fraction >= 0 && (smallestFraction == -1 || fraction < smallestFraction)) {
                smallestFraction = fraction;
                columnIndex = index;
            }
        }

        //All fractions in the pivot column are smaller equal zero -> unbound problem
        if (columnIndex == -1) {
            this.tableau.addTableauState(TableauState.INFEASIBLE);
            this.tableau.addTableauState(TableauState.UNBOUND);
            this.tableau.addTableauState(TableauState.DUAL_FEASIBLE);
            console.log("The problem is unbound using the dual simplex -> it is primal infeasible!");
            return [-1, -1];
        }

        return [rowIndex, columnIndex];
    }

    /**
     * Adds an additional constraint to the simplex tableau and solves it
     * @param {Simplex} simplex The simplex instance into whose simplex tableau the additional constraint should be integrated
     * @param {Constraint} constraint The constraint that should be integrated
     * @returns {Tableau} A simplex tableau that was solved using the primal and dual simplex algorithm
     */
    integrateAdditionalConstraint(simplex, constraint) {

        let matrix = this.tableau.getMatrix();
        let columnIndex = matrix.size()[1];

        matrix = math.addRow(math.addColumn(matrix));

        //Adds an additional row and column, a slack variable and the rhs-value

        matrix.subset(math.index(0, columnIndex), 1);
        matrix.subset(math.index(0, 0), constraint.getRightHandSideValue());

        this.tableau.getTableauVariableTypes().push(TableauVariableType.SLACK_VARIABLE);

        //Adds constraint-coefficients to coefficient-matrix
        let terms = constraint.getTerms();
        terms.forEach((coefficient, constraintDecisionVariableName) => {
            let decisionVariableIndex = 1 + getDecisionVariableIndex(simplex, constraintDecisionVariableName);
            matrix.subset(math.index(0, decisionVariableIndex), coefficient);
        });

        //NOTE: THIS IS PRETTY EXPERIMENTAL 
        let targetBasis = this.tableau.getBasis();
        targetBasis.push(columnIndex);

        this.tableau.updateMatrices(matrix);
        this.updateTableau(targetBasis); //This is meant to integrate the new constraint

        this.tableau.removeTableauState(TableauState.OPTIMAL);
        this.tableau.addTableauState(TableauState.DUAL_FEASIBLE);

        return this.solve();
    }

    /**
     * Checks whether the problem is primal feasible and adds TableauState.FEASIBLE to the tableau
     */
    checkFeasibility() {
        // If all right hand side values are positive or zero, the problem is primal feasible
        if (math.flatten(this.tableau.getRightHandSideValues()).toArray().filter(number => number < 0).isEmpty()) {
            this.tableau.addTableauState(TableauState.FEASIBLE);
        }
    }
}