/**
 * Object that is used as an Enum value that defines the branching rule used in the branch and bound procedure. 
 * @name BranchingRule
 * @readonly
 * @enum {string} MUB, LIFO, FIFO
 */

const BranchingRule = {
    MUB: "maxmimumUpperBound",
    LIFO: "lastInFirstOut",
    FIFO: "firstInFirstOut",

    properties: {
        "maxmimumUpperBound": {
            name: "maximumUpperBound",
            description: "breadth first search"
        },
        "lastInFirstOut": {
            name: "lastInFirstOut",
            description: "depth first search"
        },
        "firstInFirstOut": {
            name: "firstInFirstOut",
            description: "breadth first search"
        }
    }
}