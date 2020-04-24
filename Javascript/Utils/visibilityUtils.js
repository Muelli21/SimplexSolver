function toggleSection(element) {
    let visible = true;
    if (element.style.height == "0px" || element.style.height == 0) {
        visible = false;
    }
    toggleVisibilityUsingHeight(element, !visible);
}

function toggleVisibilityUsingHeight(element, boolean) {
    if (boolean) {
        let combinedHeight = 50;
        for (let childElement of element.childNodes) {
            let height = childElement.offsetHeight;

            if (!isNaN(height)) {
                combinedHeight = combinedHeight + height;
            }
        }
        element.style.height = combinedHeight + "px";
    } else {
        element.style.height = 0;
    }
}

function toggleVisibility(element, boolean) {
    if (boolean) {
        element.style.visibility = "visible";
    } else {
        element.style.visibility = "hidden";
    }
}

function toggleDisplayVisibility(element, boolean) {
    if (boolean) {
        element.style.display = "block";
    } else {
        element.style.display = "none";
    }
}