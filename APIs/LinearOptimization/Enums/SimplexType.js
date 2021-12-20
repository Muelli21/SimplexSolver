/**
 * Object that is used as an Enum value that defines whether a problem is a primal, dual or big-M problem
 * @readonly
 * @enum {string} PRIMAL, DUAL, BIG_M
 */

const SimplexType = {
    
    PRIMAL: "primal",
    DUAL: "dual",
    BIG_M: "big-M",

    properties: {
        "primal": {
            name: "primal",
        },
        "dual": {
            name: "dual",
        },
        "big-M": {
            name: "big-M"
        }
    }
}