/**
 * Object that is used as an Enum value that defines the states a @SimplexTableau can be in.
 * @readonly
 * @enum {string} FEASIBLE, DUAL_FEASIBLE, BIG_M_FEASIBLE, OPTIMAL, INFEASIBLE, PRIMAL_DEGENERATED, BIGM_DEGENERATED, DUAL_DEGENERATED, UNBOUND
 */

const TableauState = { 

    FEASIBLE: "feasible", //If the problem is primal feasible
    DUAL_FEASIBLE: "dual-feasible",//If the problem is dual feasible
    BIG_M_FEASIBLE: "bigM-feasible",//If the problem is big-M feasible
    OPTIMAL: "optimal",//If the problem is optimal
    INFEASIBLE: "infeasible",//If the problem is primal infeasible, dual infeasible and big-M infeasible
    PRIMAL_DEGENERATED: "primal degenerated",//If the problem is primal degenerated, i.e. has an overdefined edge
    BIGM_DEGENERATED: "bigM degenerated",//If the problem is bigM degenerated, i.e. has an overdefined edge
    DUAL_DEGENERATED: "dual degenerated",//If the problem is dual degenerated, i.e. has multiple optimal solutions due to an objective function vector perpendicular to a constraint
    UNBOUND: "unbound",//If the problem is unbound, i.e. the objective function value can be increased (max) or decreased (min) infinitely
    CYCLING: "cycling",//If the algorithm is cycling and reaching tableau states that were reached before

    properties: {
        "feasible": {
            name: "feasible",
            log: "the simplex tableau is feasible"
        },
        "dual-feasible": {
            name: "dual-feasible",
            log: "the simplex tableau is dual feasible"
        },
        "bigM-feasible": {
            name: "bigM-feasible",
            log: "the simplex tableau can be solved using the bigM-method"
        },
        "optimal": {
            name: "optimal",
            log: "the simplex algorithm terminated with an optimal solution"
        },
        "infeasible": {
            name: "infeasible",
            log: "the given linear program is infeasible"
        },
        "primal degenerated": {
            name: "primal degenerated",
            log: "the simplex algorithm has an overdefined edge"
        },
        "dual degenerated": {
            name: "dual degenerated",
            log: "the simplex algorithm has several optimal solutions"
        },
        "unbound": {
            name: "unbound",
            log: "the simplex algorithm has terminated without a specific optimal solution; the problem is unbound. Hence, it exists an infinite amount of optimal solutions"
        },
        "cycling": {
            name: "cycling",
            log: "the simplex algorithm is cycling"
        }
    }
}