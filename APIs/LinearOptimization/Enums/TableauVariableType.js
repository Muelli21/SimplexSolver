/**
 * Object that is used as an Enum value that defines whether a variable in the @SimplexTableau is of type value, decision variable, slack variable or artificial variable.
 * @readonly
 * @enum {string} VALUE, DECISION_VARIABLE, ARTIFICIAL_VARIABLE
 */

const TableauVariableType = {

    VALUE: "value",
    DECISION_VARIABLE: "decision variable",
    SLACK_VARIABLE: "slack variable",
    ARTIFICIAL_VARIABLE: "artificial variable",

    properties: {
        "value": {
            name: "value"
        },
        "decision variable": {
            name: "decision variable"
        },
        "slack variable": {
            name: "slack variable"
        },
        "artificial variable": {
            name: "artificial variable"
        }
    }
}