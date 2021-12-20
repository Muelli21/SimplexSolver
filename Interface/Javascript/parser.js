var establishedVariables = [];

function parseUserInputToSimplex() {

    resetErrorAlert();

    let objectiveFunctionTextarea = document.getElementById("objective");
    let variablesTextarea = document.getElementById("variables");
    let constraintsTextarea = document.getElementById("constraints");

    let objectiveFunctionInput = objectiveFunctionTextarea.value;
    let variablesInput = variablesTextarea.value;
    let constraintsInput = constraintsTextarea.value;

    let decisionVariables = parseDecisionVariables(variablesInput);
    let objectiveFunction = parseObjectiveFunction(objectiveFunctionInput);
    let constraints = parseConstraints(constraintsInput);

    if (objectiveFunction == null) {
        errorAlert("The given objective function is not defined properly!");
        return;
    }

    if (constraints == null) {
        return; 
    }

    let simplex = new Simplex(objectiveFunction, decisionVariables, constraints);
    let simplexTableau = simplex.apply();
    
    console.log([simplex, simplexTableau]);
    displayResults(simplex, simplexTableau, null);
}

function parseObjectiveFunction(input) {
    let semicolon = /\;/g;
    input.replace(semicolon, "");

    let regExpression = /\=/g;

    if (input.numberOfMatches(regExpression) != 1) {
        console.log("The given objective function cannot be processed properly!")
        return null;
    }

    let index = input.search(regExpression);
    let parts = []
    parts.push(input.slice(0, index), input.slice(index + 1, input.length));

    let type = -1;
    let partIndex = -1;

    for (let currentPartIndex = 0; currentPartIndex < parts.length; currentPartIndex++) {
        let part = parts[currentPartIndex];

        for (let problemType of problemTypes) {
            for (let expression of ProblemType.properties[problemType].expressions) {
                let index = part.search(expression + " ");
                if (index != -1) {
                    type = problemType;
                    partIndex = currentPartIndex;
                    parts[currentPartIndex] = part.replace(expression, "");
                    continue;
                }
            }
        }
    }

    if (type == -1) {
        console.log("The problem type is not defined. It has to be either a minimisation or a maximisation problem");
        return null;
    }

    let problemType = type;
    let objectiveFunctionVariableName = parts[partIndex].trim();
    let rhs = algebra.parse(parts[Math.abs(partIndex - 1)]).simplify();

    let constant = rhs.constants.length == 0 ? 0 : -1 * (rhs.constants[0].numer / rhs.constants[0].denom);
    rhs.constants.length = 0;
    let objectiveFunction = new ObjectiveFunction(problemType, objectiveFunctionVariableName, constant);
    translateAndValidateTerms(rhs, objectiveFunction);
    console.log(objectiveFunction);
    return objectiveFunction;
}

function parseDecisionVariables(input) {
    let lines = splitLines(input);
    let variablesMap = new Map();
    let variablesArray = [];

    for (let line of lines) {
        let index = line.search(/\:/);
        let variableName = line.slice(0, index).trim();
        let variable = new Variable(variableName);
        let variableTypeString = line.slice(index, line.length);
        variablesMap.set(variableName, variable);
        variablesArray.push(variable);

        for (let variableType of variableTypes) {
            let expression = VariableType.properties[variableType].expression;
            if (variableTypeString.includes(expression)) {
                variable.addVariableType(variableType);
            }
        }
    }

    establishedVariables = variablesArray;
    return variablesMap;
}

function parseConstraints(input) {
    let lines = splitLines(input);
    let constraints = [];

    for (let line of lines) {
        let constraintInformation = determineConstraintInformation(line);
        let constraintType = constraintInformation[0];
        let index = constraintInformation[1];

        if (constraintType == null || index == null) {
            console.log("It was impossible to process the following constraint: " + line);
            continue;
        }

        let lhsString = line.slice(0, index).trim();
        let rhsString = line.slice(index + ConstraintType.properties[constraintType].expression.length, line.length).trim();

        let equation = simplifyEquation(lhsString, rhsString);
        if (equation[0] == null) {
            errorAlert("Constraint: " + line + "\n" + equation[1]);
            return null;
        }

        let lhs = equation[0];
        let rhsValue = equation[1];

        let constraint = new Constraint(constraintType, rhsValue);
        translateAndValidateTerms(lhs, constraint);
        constraints.push(constraint);
    }

    return constraints;
}

function variableExists(variableName) {
    let exists = false;
    for (let variable of establishedVariables) {
        let name = variable.getName();
        if (name == variableName) {
            exists = true;
        }
    }

    return exists;
}

function translateAndValidateTerms(expression, objectToAddTo) {
    for (let term of expression.terms) {
        let coefficient = term.coefficients[0].numer / term.coefficients[0].denom;
        let variable = "";

        for (let index = 0; index < term.variables.length; index++) {
            let variableSection = term.variables[index];
            let name = variableSection.variable;
            variable = (index == term.variables.length - 1) ? variable + name : variable + name + " ";
        }

        if (variableExists(variable)) {
            objectToAddTo.addTerm(variable, coefficient);
        } else {
            console.log("The variable " + variable + " has not been defined!");
        }
    }
}

function determineConstraintInformation(line) {
    for (let constraintType of constraintTypes) {
        let expression = ConstraintType.properties[constraintType].expression
        let index = line.search(expression);
        if (index != -1) {
            return [constraintType, index];
        }
    }
    console.log("It was not possible to determine the constraint's type!: " + line);
    return [null, null];
}

function simplifyEquation(lhsString, rhsString) {

    let lhs;
    let rhs;

    try {
        lhs = new algebra.parse(lhsString);
        rhs = new algebra.parse(rhsString);
    } catch (error) {
        return [null, error];
    }

    lhs = lhs.subtract(rhs).simplify();
    let rhsValue = lhs.constants.length == 0 ? 0 : -1 * (lhs.constants[0].numer / lhs.constants[0].denom);
    lhs.constants.length = 0;
    return [lhs, rhsValue];
}

function splitLines(input) {
    let lines = [];
    let regExpression = /\;/g;

    let matches = [];
    let match;
    while ((match = regExpression.exec(input)) != null) {
        let lastIndex = regExpression.lastIndex;
        let index = match.index;
        let result = [lastIndex, index];
        matches.push(result);
    }

    let lastSlice = 0;
    for (let match of matches) {
        let index = match[1];

        if (index == null) {
            continue;
        }

        let lineString = input.slice(lastSlice, index);
        lines.push(lineString);
        lastSlice = index + 1;
    }

    return lines;
}
