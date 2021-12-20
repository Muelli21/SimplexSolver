/**
 * Object for an internal representation of the objective function
 * REMARK: When the solver is used as a library, this object should be used together with @Constraint and @Variable as long as it cannot be made sure that the simplex tableau can be created flawlessly
 * 
 * @class 
 * @param {ProblemType} problemType - The problem type indicating whether the objective function is to be minimised or maximised
 * @param {string} name - The objective function's name
 * @param {number} constant - The constant of the objective function
 */

class ObjectiveFunction {
    constructor(problemType, name, constant) {
        this.problemType = problemType; //Type: ProblemType
        this.name = name; //Type: string
        this.constant = constant; //already adjusted for the use in the tableau i.e. 
        this.terms = new Map(); //Type: Map - maps variables to coefficients
    }

    /**
     * @returns {ProblemType} The objective function's problem type
     */
    getProblemType() {
        return this.problemType;
    }

    /**
     * @returns {string} The objective function's name
     */
    getName() {
        return this.name;
    }

    /**
     * Sets the constant of the objective function
     * @param {number} constant The objective function's constant
     */
    setConstant(constant) {
        this.constant = constant;
    }

    /**
     * @returns {number} The objective function's constant
     */
    getConstant() {
        return this.constant;
    }

    /**
     * Adds another term to the objective function
     * @param {Variable} variable The variable to be used as the term's key
     * @param {number} coefficient The number to be used as the term's value
     */
    addTerm(variable, coefficient) {
        this.terms.set(variable, coefficient);
    }

    /**
     * @returns {Map<Variable, number>} A map of objective function terms
     */
    getTerms() {
        return this.terms;
    }
}

//Transforms minimisation objective functions to maximisation objective functions by multiplying coefficients and the constant, and altering the problem type
//Returns a new instance

/**
 * Ensures that a given objective function is transformed to an objective function belonging to an equivalent maximisation problem.
 * This is achieved by multiplying coefficients and constants by -1 and altering the problem's type
 * @param {ObjectiveFunction} objectiveFunction A new instance of the objective function that was transformed to an objective function belonging to an equivalent maximisation problem
 * @returns 
 */

function transformToMaxObjectiveFunction(objectiveFunction) {

    let problemType = objectiveFunction.getProblemType();
    let name = objectiveFunction.getName();
    let constant = objectiveFunction.getConstant();
    let terms = objectiveFunction.getTerms();

    let transformedObjectiveFunction = new ObjectiveFunction(ProblemType.MAX, name, constant);

    switch (problemType) {
        case ProblemType.MAX:
            terms.forEach((coefficient, variable) => transformedObjectiveFunction.addTerm(variable, coefficient));
            break;

        case ProblemType.MIN:
            transformedObjectiveFunction.setConstant(-1 * transformedObjectiveFunction.getConstant());
            terms.forEach((coefficient, variable) => transformedObjectiveFunction.addTerm(variable, -1 * coefficient));
            break;
    }

    return transformedObjectiveFunction;
}