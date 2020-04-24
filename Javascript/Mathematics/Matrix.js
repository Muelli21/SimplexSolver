class Matrix {
    constructor(rows, columns) {
        this.rows = rows;
        this.columns = columns;
        this.matrix = Array(rows).fill(null).map(() => Array(columns).fill(0));
    }

    fillRandomly() {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.columns; j++) {
                this.matrix[i][j] = Math.random();
            }
        }
    }

    fill(arraysInArray) {
        if (arraysInArray.length != rows || arraysInArray[0].length != columns) {
            console.log("The matrix cannot be filled with these values!");
            return;
        }
        this.matrix = arraysInArray;
    }

    getMatrix() {
        return this.matrix;
    }

    setRows(numberOfRows) {
        this.rows = numberOfRows;
    }

    getRows() {
        return this.rows;
    }

    setColumns(numberOfColumns) {
        this.columns = numberOfColumns;
    }

    getColumns() {
        return this.columns;
    }

    addRow(rowIndex) {
        if (rowIndex > this.rows) {
            console.log("The given row-index is out of bound!");
            return;
        }
        this.rows++;
        this.matrix.splice(rowIndex, 0, Array(this.columns).fill(0));
    }

    addColumn(columnIndex) {
        if (columnIndex > this.columns) {
            console.log("The given column-index is out of bound!");
            return;
        }

        this.columns++;
        for (let row of this.matrix) {
            row.splice(columnIndex, 0, 0);
        }
    }

    removeRow(rowIndex) {

        if (rowIndex > this.rows) {
            console.log("The given row-index is out of bound!");
            return;
        }

        this.matrix.splice(rowIndex, 1);
        this.rows = this.rows - 1;
    }

    removeColumn(columnIndex) {

        if (columnIndex > this.columns) {
            console.log("The given column-index is out of bound!");
            return;
        }

        this.columns = this.columns - 1;
        for (let row of this.matrix) {
            row.splice(columnIndex, 1);
        }
    }

    //This is not a deep-copy if the matrix is filled with non-primitive objects
    copy() {
        let copy = new Matrix(this.rows, this.columns);
        let copyMatrix = copy.getMatrix();
        for (let rowIndex = 0; rowIndex < this.rows; rowIndex++) {
            for (let columnIndex = 0; columnIndex < this.columns; columnIndex++) {
                copyMatrix[rowIndex][columnIndex] = this.matrix[rowIndex][columnIndex];
            }
        }
        return copy;
    }
}

function multiplyMatrices(matrixObjectA, matrixObjectB) {

    let matrixA = matrixObjectA.getMatrix();
    let rowsA = matrixObjectA.getRows();
    let columnsA = matrixObjectA.getColumns();

    let matrixB = matrixObjectB.getMatrix();
    let rowsB = matrixObjectB.getRows();
    let columnsB = matrixObjectB.getColumns();

    if (columnsA != rowsB) {
        console.log("These matrices cannot be multiplied!");
        return undefined;
    }

    let matrixObject = new Matrix(rowsA, columnsB);
    let matrix = matrixObject.getMatrix();
    let rowsC = matrixObject.getRows();
    let columnsC = matrixObject.getColumns();

    //rowsA == rowsC 
    //columnsB == columnsC

    for (let i = 0; i < rowsC; i++) {
        for (let j = 0; j < columnsC; j++) {
            for (let k = 0; k < columnsA; k++) {
                matrix[i][j] += matrixA[i][k] * matrixB[k][j];
            }
        }
    }

    return matrixObject;
}

// multiplies row A with a factor
function multiplyRow(matrixObject, rowIndex, factor) {
    let matrix = matrixObject.getMatrix();
    let row = matrix[rowIndex];

    let columnIndex = 0;
    for (let entry of row) {
        matrix[rowIndex][columnIndex] = entry * factor;
        columnIndex++;
    }
}

// USING Big.js FOR HIGHER PRECISION 
// multiplies row A with a factor
function multiplyRowBig(matrixObject, rowIndex, factor) {
    let matrix = matrixObject.getMatrix();
    let row = matrix[rowIndex];
    let bigFactor = new Big(factor);

    let columnIndex = 0;
    for (let entry of row) {
        let bigEntry = new Big(entry);
        let number = Number(bigEntry.times(bigFactor).round(10));

        matrix[rowIndex][columnIndex] = number;
        columnIndex++;
    }
}

// adds row A multiplied by a factor to row B
function rowAddition(matrixObject, rowIndexA, rowIndexB, factor) {
    let matrix = matrixObject.getMatrix();
    let rowA = matrix[rowIndexA];
    let rowB = matrix[rowIndexB];

    let columnIndex = 0;
    for (let entryA of rowA) {
        let entryB = rowB[columnIndex];
        rowB[columnIndex] = entryB + factor * entryA;
        columnIndex++;
    }
}

// USING Big.js FOR HIGHER PRECISION 
// adds row A multiplied by a factor to row B
function rowAdditionBig(matrixObject, rowIndexA, rowIndexB, factor) {
    let matrix = matrixObject.getMatrix();
    let rowA = matrix[rowIndexA];
    let rowB = matrix[rowIndexB];
    let bigFactor = new Big(factor);

    let columnIndex = 0;
    for (let entryA of rowA) {
        let entryB = rowB[columnIndex];

        let bigEntryA = new Big(entryA);
        let bigEntryB = new Big(entryB);
        let number = Number(bigEntryB.plus(bigEntryA.times(bigFactor)).round(10));

        rowB[columnIndex] = number;
        columnIndex++;
    }
}

// adds row A of matrix A multiplied by a factor to row B of matrix B
function rowAdditionAmongMatrices(matrixObjectA, matrixObjectB, rowIndexA, rowIndexB, factor) {
    let matrixA = matrixObjectA.getMatrix();
    let matrixB = matrixObjectB.getMatrix();

    let rowA = matrixA[rowIndexA];
    let rowB = matrixB[rowIndexB];

    let columnIndex = 0;
    for (let entryA of rowA) {
        let entryB = rowB[columnIndex];
        rowB[columnIndex] = entryB + factor * entryA;
        columnIndex++;
    }
}

function addMatrices(matrixObjectA, matrixObjectB) {

    let matrixA = matrixObjectA.getMatrix();
    let rowsA = matrixObjectA.getRows();
    let columnsA = matrixObjectA.getColumns();

    let matrixB = matrixObjectB.getMatrix();
    let rowsB = matrixObjectB.getRows();
    let columnsB = matrixObjectB.getColumns();

    if (rowsA != rowsB || columnsA != columnsB) {
        console.log("These matrices cannot be added!");
        return undefined;
    }

    for (let i = 0; i < rowsA; i++) {
        for (let j = 0; j < columnsA; j++) {
            matrixA[i][j] += matrixB[i][j];
        }
    }

    return matrixObjectA;
}

function multiplyMatrixByScalar(matrixObject, scalar) {

    let matrix = matrixObject.getMatrix();
    let rows = matrixObject.getRows();
    let columns = matrixObject.getColumns();

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < columns; j++) {
            matrix[i][j] = matrix[i][j] * scalar;
        }
    }

    return matrixObject;
}

function applyExponentToMatrixEntries(matrixObject, exponent) {

    let matrix = matrixObject.getMatrix();
    let rows = matrixObject.getRows();
    let columns = matrixObject.getColumns();

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < columns; j++) {
            matrix[i][j] = Math.pow(matrix[i][j], exponent);
        }
    }

    return matrixObject;
}