class ObjectiveFunction {
    constructor(problemType, objectiveFunctionVariableName, constant) {
        this.problemType = problemType;
        this.objectiveFunctionVariableName = objectiveFunctionVariableName;
        this.constant = constant; //already adjusted for the use in the tableau
        this.terms = new Map();
    }

    getProblemType() {
        return this.problemType;
    }

    getObjectiveFunctionVariableName() {
        return this.objectiveFunctionVariableName;
    }

    setConstant(constant) {
        this.constant = constant;
    }

    getConstant() {
        return this.constant;
    }

    addTerm(variable, coefficient) {
        this.terms.set(variable, coefficient);
    }

    getTerms() {
        return this.terms;
    }
}

function transformToMaxObjectiveFunction(objectiveFunction) {
    let problemType = objectiveFunction.getProblemType();
    let objectiveFunctionVariableName = objectiveFunction.getObjectiveFunctionVariableName();
    let constant = objectiveFunction.getConstant();


    let terms = objectiveFunction.getTerms();
    let transformedObjectiveFunction = new ObjectiveFunction(ProblemType.MAX, objectiveFunctionVariableName, constant);

    switch (problemType) {
        case ProblemType.MAX:
            terms.forEach((coefficient, variable) => {
                transformedObjectiveFunction.addTerm(variable, coefficient);
            });
            break;
        
        case ProblemType.MIN:
            transformedObjectiveFunction.setConstant(-1*transformedObjectiveFunction.getConstant());
            terms.forEach((coefficient, variable) => {
                transformedObjectiveFunction.addTerm(variable, -1*coefficient);
            });
            break;
    }

    return transformedObjectiveFunction;
}