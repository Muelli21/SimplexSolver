var VariableType = {
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

const variableTypes = [
    VariableType.NON_NEGATIVE,
    VariableType.INTEGER,
    VariableType.REAL
];