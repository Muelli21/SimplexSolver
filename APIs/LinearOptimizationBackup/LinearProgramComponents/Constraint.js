/**
 * Object representation of a constraint that is primarily used to store an abstract representation of the problem internally.
 * Except for transforming equal and bigger than constraints to smaller than constraints, there are no calculations performed directly on this object.
 * 
 * REMARK: When the solver is used as a library, this object should be used together with @Variable and @ObjectiveFunction as long as it cannot be made sure that simplex tableaus can be created flawlessly
 * 
 * @class 
 * @param {ConstraintType} ConstraintType The constraint's type
 * @param {number} number The right hand side constant of the constraint
 */

class Constraint {
    constructor(constraintType, rightHandSideValue) {
        this.rightHandSideValue = rightHandSideValue; //Type: number
        this.constraintType = constraintType; //Type: ConstraintType
        this.terms = new Map(); //Type: Map - containing variables as keys and coefficients as values
    }

    /**
     * @returns {ConstraintType} The constraint's type
     */
    getConstraintType() {
        return this.constraintType;
    }

    /**
     * @returns {number} The constraint's right hand side constant
     */
    getRightHandSideValue() {
        return this.rightHandSideValue;
    }

    /**
     * @returns {Map<Variable, number} The constraint's terms, i.e. the single variables with their corresponding coefficients
     */
    getTerms() {
        return this.terms;
    }

    /**
     * Sets the provided map as the constraint's terms
     * @param {Map<Variable, number>} terms A map of variables as keys and coefficients as values
     */
    setTerms(terms) {
        this.terms = terms;
    }

    /**
     * Adds another term to the constraint
     * @param {Variable} variable Variable that is used as the terms key
     * @param {number} coefficient Coefficient that is used as the terms value
     */
    addTerm(variable, coefficient) {
        this.terms.set(variable, coefficient);
    }

    /**
     * Creates a deep copy of the constraint and returns it
     * @returns {Constraint} A copy of the current @Constraint
     */
    clone() {
        let copy = new Constraint(this.constraintType, this.rightHandSideValue);
        this.terms.forEach((coefficient, variable) => copy.addTerm(variable, coefficient));
        return copy;
    }

    /**
     * @returns {string} A string representation of the constraint
     */
    toString() {
        let output = "";
        this.terms.forEach((value, key) => output = output + " + " + value + key);
        return output + ConstraintType.properties[this.constraintType].expression + this.rightHandSideValue;
    }

    /**
     * Multiplies all coefficients of the constraint with a factor. It handles constraint type changes that emerge due to multiplication with a negative number
     * @param {number} factor A factor the constraint's coefficients and its right hand side value are multiplied by
     */
    multiply(factor) {

        this.rightHandSideValue = this.rightHandSideValue * factor;
        this.terms.forEach((coefficient, variable) => this.terms.set(variable, coefficient * factor));

        if (factor < 0) {
            switch (this.constraintType) {
                case ConstraintType.SMALLER_THAN:
                    this.constraintType = ConstraintType.BIGGER_THAN;
                    break;

                case ConstraintType.BIGGER_THAN:
                    this.constraintType = ConstraintType.SMALLER_THAN;
                    break;
            }
        }

        return this;
    }
}