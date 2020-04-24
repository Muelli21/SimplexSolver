class Constraint {
    constructor(constraintType, rightHandSideValue) {
        this.constraintType = constraintType;
        this.rightHandSideValue = rightHandSideValue;
        this.terms = new Map();
    }

    getConstraintType() {
        return this.constraintType;
    }

    getRightHandSideValue() {
        return this.rightHandSideValue;
    }

    getTerms() {
        return this.terms;
    }

    setTerms(terms) {
        this.terms = terms;
    }

    addTerm(variable, coefficient) {
        this.terms.set(variable, coefficient);
    }

    multiply(factor) {
        this.rightHandSideValue = this.rightHandSideValue * factor;
        this.terms.forEach((coefficient, variable) => {
            this.terms.set(variable, coefficient*factor);
        });

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
    }

    clone() {
        let copy = new Constraint(this.constraintType, this.rightHandSideValue);
        this.terms.forEach((coefficient, variable) => {
            copy.addTerm(variable, coefficient);
        });
        return copy;
    }
}