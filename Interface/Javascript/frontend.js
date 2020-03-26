function toggleAboutSection() {
    let section = document.getElementById("about");
    toggleSection(section);
}

function errorAlert(message) {
    let errorDiv = document.getElementById("errorDiv");
    let errorAlert = document.getElementById("errorAlert");

    resetErrorAlert();

    let error = document.createTextNode("ERROR: " + message);
    errorAlert.appendChild(error);
    toggleSection(errorDiv);
    errorAlert.style.opacity = 1;
}

function resetErrorAlert() {
    let errorDiv = document.getElementById("errorDiv");
    let errorAlert = document.getElementById("errorAlert");
    errorDiv.style.height = 0;
    errorAlert.style.opacity = 0;
    clearElement(errorAlert);
}