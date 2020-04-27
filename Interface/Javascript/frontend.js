var darkMode = false;
var currentSimplex;
var currentSimplexTableau;
var currentBranchAndBound;

function toggleAboutSection() {
    let section = document.getElementById("about");
    toggleSection(section);
}

function errorAlert(message) {
    let errorDiv = document.getElementById("errorDiv");
    let errorAlert = document.getElementById("error");

    resetErrorAlert();

    let error = document.createTextNode("ERROR: " + message);
    errorAlert.appendChild(error);
    toggleSection(errorDiv);
    errorAlert.style.opacity = 1;
}

function resetErrorAlert() {
    let errorDiv = document.getElementById("errorDiv");
    let errorAlert = document.getElementById("error");

    errorDiv.style.height = 0;
    errorAlert.style.opacity = 0;
    clearElement(errorAlert);
}

function displayResults(simplex, simplexTableau, branchAndBound) {

    currentSimplex = simplex;
    currentSimplexTableau = simplexTableau;
    currentBranchAndBound = branchAndBound;

    let results = document.getElementById("results");
    let tableContainer = document.getElementById("tableContainer");

    clearAllSections();
    toggleDisplayVisibility(results, true);

    let coefficientMatrix = simplexTableau.getCoefficientMatrix();
    let bigMCoefficientMatrix = simplexTableau.getBigMCoefficientMatrix();
    let basis = simplexTableau.getBasis();

    displaySimplexTableau(simplex, simplexTableau, coefficientMatrix, bigMCoefficientMatrix, basis, tableContainer, "solutionTable", "solutionTable");
}

function showHistory() {

    let container = document.getElementById("historyContainer");
    clearElement(container);

    let simplex = currentSimplex;
    let simplexTableau = currentSimplexTableau;

    let archivedInformation = simplexTableau.getArchivedInformation();
    let archivedBases = archivedInformation[0];
    let archivedCoefficientMatrices = archivedInformation[1];
    let archivedBigMCoefficientMatrices = archivedInformation[2];

    for (let index = 0; index < archivedBases.length; index++) {
        let basis = archivedBases[index];
        let coefficientMatrix = archivedCoefficientMatrices[index];
        let bigMCoefficientMatrix = null;

        if (index < archivedBigMCoefficientMatrices.length) {
            bigMCoefficientMatrix = archivedBigMCoefficientMatrices[index];
        }

        let tableUnit = createHTMLElement(container, "div", "tableUnit");
        createTextElement(tableUnit, "Simplex iteration: " + index, "iterationText");
        displaySimplexTableau(simplex, simplexTableau, coefficientMatrix, bigMCoefficientMatrix, basis, tableUnit, "historyTable" + index, "solutionTable");
    }
}

function displaySimplexTableau(simplex, simplexTableau, coefficientMatrixObject, bigMCoefficientMatrixObject, basis, tableContainer, tableId, tableClassName) {

    let objectiveFunction = simplex.getObjectiveFunction();
    let objectiveFunctionVariableName = objectiveFunction.getObjectiveFunctionVariableName();

    let decisionVariablesMap = simplexTableau.getDecisionVariables();
    let variableTypeVector = simplexTableau.getVariableTypeVector();

    let coefficientMatrix = coefficientMatrixObject.getMatrix();
    let bigMCoefficientMatrix = null;

    if (bigMCoefficientMatrixObject != null) {
        bigMCoefficientMatrix = bigMCoefficientMatrixObject.getMatrix();
    }

    let variableNames = [...decisionVariablesMap.keys()];

    let numberOfSlackVariables = 0;
    let numberOfArtificialVariables = 0;

    let numberOfDecisionVariables = decisionVariablesMap.size;

    for (let index = numberOfDecisionVariables + 1; index < variableTypeVector.length; index++) {
        let variableType = variableTypeVector[index];

        switch (variableType) {
            case SimplexVariableType.SLACK_VARIABLE:
                variableNames.push("slack" + (numberOfSlackVariables + 1));
                numberOfSlackVariables++;
                break;
            case SimplexVariableType.ARTIFICIAL_VARIABLE:
                variableNames.push("artificial" + (numberOfArtificialVariables + 1));
                numberOfArtificialVariables++;
                break;
        }
    }

    let headingsArray = ["Basis", "Values", ...variableNames];
    let contentMatrix = [];

    let numberOfRows = coefficientMatrixObject.getRows();
    let numberOfColumns = coefficientMatrixObject.getColumns();

    for (let rowIndex = 0; rowIndex < numberOfRows; rowIndex++) {
        let contentRow = [];

        let variableIndex = basis[rowIndex] - 1;
        let variableName = rowIndex == numberOfRows - 1 ?
            objectiveFunctionVariableName : variableNames[variableIndex];

        contentRow.push(variableName);

        for (let columnIndex = 0; columnIndex < numberOfColumns; columnIndex++) {
            let entry = coefficientMatrix[rowIndex][columnIndex];
            let tableEntry = "";

            if (bigMCoefficientMatrix != null) {
                let numberOfBigMRows = bigMCoefficientMatrixObject.getRows();
                let numberOfBigMColumns = bigMCoefficientMatrixObject.getColumns();

                if (rowIndex < numberOfBigMRows && columnIndex < numberOfBigMColumns) {
                    let bigMEntry = bigMCoefficientMatrix[rowIndex][columnIndex];

                    if (bigMEntry != 0) {
                        tableEntry = tableEntry + bigMEntry.toFixed(2);
                    }
                }
            }

            let roundedEntry = round(entry);
            tableEntry = tableEntry == "" ? roundedEntry : tableEntry + "+" + roundedEntry;
            contentRow.push(tableEntry);
        }

        contentMatrix.push(contentRow);
    }

    let solutionTable = createTable(tableId, tableClassName, headingsArray, contentMatrix);
    tableContainer.appendChild(solutionTable);
}

function round(number) {
    return Math.round((number + Number.EPSILON) * 100) / 100;
}

function toggleDarkMode() {
    let body = document.body;
    let viewMode = document.getElementById("viewMode");

    if (darkMode) {
        body.classList.add("light");
        body.classList.remove("dark");
        viewMode.textContent = "Darkmode";
    } else {
        body.classList.add("dark");
        body.classList.remove("light");
        viewMode.textContent = "Lightmode";
    }

    darkMode = !darkMode;
}