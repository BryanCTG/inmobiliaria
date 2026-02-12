document.addEventListener("DOMContentLoaded", function () {

    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");

    if (error === "true") {
        const errorDiv = document.getElementById("error-message");
        if (errorDiv) {
            errorDiv.style.display = "block";
        }
    }

});
