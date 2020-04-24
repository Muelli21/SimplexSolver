function simplifyRhsEqualsZeroConstraints(constraints) {
    let simplifiedConstraints = [];

    for (let constraint of constraints) {

        let constraintType = constraint.getConstraintType();
        let rhs = constraint.getRightHandSideValue();

        if (rhs == 0) {
            switch (constraintType) {
                case ConstraintType.EQUAL:
                    let biggerThanConstraint = new Constraint(ConstraintType.BIGGER_THAN);
                    let smallerThanConstraint = new Constraint(ConstraintType.SMALLER_THAN);
                    biggerThanConstraint.setTerms(constraint.getTerms());
                    biggerThanConstraint.multiply(-1);
                    smallerThanConstraint.setTerms(constraint.getTerms());
                    simplifiedConstraints.push(biggerThanConstraint);
                    simplifiedConstraints.push(smallerThanConstraint);
                    continue;
            
                case ConstraintType.BIGGER_THAN:
                    constraint.multiply(-1);
                    break;
            }
        }
        
        simplifiedConstraints.push(constraint);
    }

    return simplifiedConstraints;
}

function extractArguments(input) {
    input = simplifyExpression(input);
    input = input.replace(/ /g, '');
    console.log(input);

    let regExpression = /\+|\-/g;
    let arguments = [];

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

        let argumentString = input.slice(lastSlice, index);
        arguments.push(parseToArgument(argumentString));
        lastSlice = index;
    }

    let argumentString = input.slice(lastSlice, input.length);
    arguments.push(parseToArgument(argumentString));
    return arguments;
}

function parseToArgument(argumentString) {
    let variableIndex = argumentString.search(/[a-z]+/gi);
    let variable = argumentString.slice(variableIndex, argumentString.length);
    let coefficient = isNaN(+argumentString.slice(0, variableIndex)) ? (argumentString.search("-") != -1 ? -1 : 1) : +argumentString.slice(0, variableIndex);
    return new Argument(coefficient, variable);
}

function simplifyExpression(input) {
    let expression = new algebra.parse(input);
    expression.simplify();
    return expression.toString();
}