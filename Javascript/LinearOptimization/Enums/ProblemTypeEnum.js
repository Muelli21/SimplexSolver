var ProblemType = {
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

const problemTypes = [
    ProblemType.MAX,
    ProblemType.MIN
];