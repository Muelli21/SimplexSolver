/**
 * Object that is used as an Enum value that defines the constraint's type. 
 * @name ConstraintType
 * @readonly
 * @enum {string} SMALLER_THAN, BIGGER_THAN, EQUAL
 */

const ConstraintType = {

    SMALLER_THAN: "smaller than",
    BIGGER_THAN: "bigger than", 
    EQUAL: "equal",

    properties: {
        "smaller than": {
            name: "smaller than",
            expression: "<="
        },
        "bigger than": {
            name: "bigger than",
            expression: ">="
        },
        "equal": {
            name: "equal",
            expression: "="
        }
    }
}

/**
 * Array that can be used to iterate over the Enum values
 * @readonly
 * @type {ConstraintType}
 */

const constraintTypes = [
    ConstraintType.SMALLER_THAN,
    ConstraintType.BIGGER_THAN,
    ConstraintType.EQUAL
];