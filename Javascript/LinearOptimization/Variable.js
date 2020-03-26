class Variable {
    constructor(name) {
        this.name = name;
        this.variableTypes = new Set([VariableType.NON_NEGATIVE]);
    }

    getName() {
        return this.name;
    }

    addVariableType(variableType) {
        this.variableTypes.add(variableType);
    }
}

