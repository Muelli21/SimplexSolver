var ConstraintType = {

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

const constraintTypes = [
    ConstraintType.SMALLER_THAN,
    ConstraintType.BIGGER_THAN,
    ConstraintType.EQUAL
];