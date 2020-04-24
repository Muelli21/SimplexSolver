Array.prototype.clear = function() {
    this.length = 0;
}

Array.prototype.clone = function() {
    let clone = [].concat(this);
    return clone;
}

Array.prototype.remove = function(element) {
    for (let i = this.length; i--;) {
        if (this[i] === element) {
            this.splice(i, 1);
        }
    }
}

Array.prototype.insert = function(index, item) {
    this.splice(index, 0, item);
}

Array.prototype.isEmpty = function() {
    return this.length === 0;
}

String.prototype.numberOfMatches = function(regExpression) {
    let count = (this.match(regExpression) || []).length;
    return count;
}

String.prototype.reverse = function () {
    return [...this].reverse().join('');
}

function isUndefined(variable) {
    let undefined = void(0);
    return variable === undefined;
}

