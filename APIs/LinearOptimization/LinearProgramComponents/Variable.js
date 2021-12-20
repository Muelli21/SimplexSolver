/**
 * Object meant to store information on variables that are used in a @Constraint and the @ObjectiveFunction
 * 
 * REMARK: When the solver is used as a library, this object should be used together with @Constraint and @ObjectiveFunction as long as it cannot be made sure that the simplex tableau can be created flawlessly
 * 
 * @class 
 * @param {string} name The variable's name
 */

class Variable {
    constructor(name) {
        this.name = name; // Type: string
        this.variableTypes = new Set([VariableType.NON_NEGATIVE]); //Type: VariableType - the default type is NON_NEGATIVE
    }

    /**
     * @returns {string} The variable's name
     */
    getName() {
        return this.name;
    }

    /**
     * Adds an additional variable type to the variable
     * @param {VariableType} variableType The variable type to be attached to this variable
     */
    addVariableType(variableType) {
        this.variableTypes.add(variableType);
    }

    /**
     * @returns {VariableType} Returns the variable's type
     */
    getVariableTypes() {
        return this.variableTypes;
    }
}

