function clearAllSections() {

    let elementsToClear = document.querySelectorAll('.toClear');
    for (let element of elementsToClear) {
        clearElement(element);
    }
    clearParticipantsSection();
    clearParticipantsButtonsSection();
}

function clearElement(element) {
    while (element.hasChildNodes()) {
        element.removeChild(element.firstChild);
    }
}

function createHTMLElement(parentElement, type, className) {
    let element = document.createElement(type);
    element.className = className;
    parentElement.appendChild(element);
    return element;
}

function createTextElement(parentElement, text, className) {
    let element = document.createElement("p");
    let elementText = document.createTextNode(text);
    element.className = className;
    element.appendChild(elementText);
    parentElement.appendChild(element);
    return element;
}

function updateTextElement(element, text) {
    clearElement(element);
    let elementText = document.createTextNode(text);
    element.appendChild(elementText);
}

function createHeadline(parentElement, text, type, className) {

    if (type != "h1" || type != "h2" || type != "h3" || type != "h4") {
        type = "h1";
    }

    let element = document.createElement(type);
    let elementText = document.createTextNode(text);
    element.className = className;
    element.appendChild(elementText);
    parentElement.appendChild(element);
    return element;
}

function createLinkElement(parentElement, childElement, title, href, className) {
    let element = document.createElement("a");
    element.className = className;
    element.appendChild(childElement);
    element.title = title;
    element.href = href;
    parentElement.appendChild(element);
    return element;
}

function createButtonElement(parentElement, text, className, functionToExecute) {
    let element = document.createElement("input");
    element.type = "button";
    element.value = text;
    element.className = className + "Hidden";
    element.id = text + "Hidden";
    element.onclick = functionToExecute;
    parentElement.appendChild(element);

    let label = document.createElement("label");
    label.htmlFor = element.id;
    label.className = className;
    parentElement.appendChild(label);
    element.style.display = "none";
    let textElement = createTextElement(label, text, className + "Text");

    return [element, label, textElement];
}

function createButtonElementWithoutFunction(parentElement, text, className) {
    let element = document.createElement("input");
    element.type = "button";
    element.value = text;
    element.className = className + "Hidden";
    element.id = text + "Hidden";
    parentElement.appendChild(element);

    let label = document.createElement("label");
    label.htmlFor = element.id;
    label.className = className;
    parentElement.appendChild(label);
    element.style.display = "none";
    let textElement = createTextElement(label, text, className + "Text");

    return [element, label, textElement];
}

function createButtonElementWithoutFunction(parentElement, text, className) {
    let element = document.createElement("input");
    element.type = "button";
    element.value = text;
    element.className = className + "Hidden";
    element.id = className + "Hidden";
    parentElement.appendChild(element);

    let label = document.createElement("label");
    label.htmlFor = element.id;
    label.className = className;
    parentElement.appendChild(label);
    element.style.display = "none";
    let textElement = createTextElement(label, text, className + "Text");

    return [element, label, textElement];
}

function createTable(id, className, headingsArray, contentMatrix) {

    let table = document.createElement("table");
    table.id = id;
    table.className = className;

    let headingsTableRow = createHTMLElement(table, "tr", className + "HeadingsRow");
    for (let heading of headingsArray) {
        let tableHeading = createHTMLElement(headingsTableRow, "th" , className + "Heading")
        tableHeading.textContent = heading;
    }

    for (let row of contentMatrix) {
        let tableRow = createHTMLElement(table, "tr", className + "Row");
        for(let entry of row) {
            let tableEntry = createHTMLElement(tableRow, "td", className + "Entry");
            tableEntry.textContent = entry;
        }
    }

    return table;
}