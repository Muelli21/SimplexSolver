/**
 * Object that is used as an Enum value that defines whether a variable's coefficient in a @Constraint , @ObjectiveFunction is non-negative, integer-valuedd or a real value.
 * @readonly
 * @enum {string} NON_NEGATIVE, INTEGER, REAL
 */

const VariableType = {
    
    NON_NEGATIVE: "non-negative",
    INTEGER: "integer",
    REAL: "real",

    properties: {
        "non-negative": {
            name: "non-negative",
            expression: "non-negative"
        },
        "integer": {
            name: "positive integer",
            expression: "element of I"
        },
        "real": {
            name: "real",
            expression: "element of R"
        }
    }
}

/**
 * Array that can be used to iterate over the Enum values
 * @readonly
 * @type {ProblemType}
 */

const variableTypes = [
    VariableType.NON_NEGATIVE,
    VariableType.INTEGER,
    VariableType.REAL
];