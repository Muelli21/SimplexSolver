/**
 * Object that is used as an Enum value that defines whether a problem is a maximisation or minimisation problem.
 * @readonly
 * @enum {string} MAX, MIN
 */

const ProblemType = {
    
    MAX: "maximize",
    MIN: "minimize",

    properties: {
        "maximize": {
            name: "maximize",
            expressions: ["maximize", "max"]
        },
        "minimize": {
            name: "minimize", 
            expressions: ["minimize", "min"]
        }
    }
}

/**
 * Array that can be used to iterate over the Enum values
 * @readonly
 * @type {ProblemType}
 */

const problemTypes = [
    ProblemType.MAX,
    ProblemType.MIN
];