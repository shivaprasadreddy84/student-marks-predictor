/* =========================================
   MARKSENSE LANDING PAGE JAVASCRIPT
   ========================================= */


// ================================
// GET BUTTONS
// ================================

const loginButton =
    document.getElementById("loginButton");

const signupButton =
    document.getElementById("signupButton");

const heroStartButton =
    document.getElementById("heroStartButton");

const learnMoreButton =
    document.getElementById("learnMoreButton");


// ================================
// LOGIN
// ================================

loginButton.addEventListener(
    "click",
    function () {

        window.location.href = "login.html";

    }
);


// ================================
// GET STARTED
// ================================

signupButton.addEventListener(
    "click",
    function () {

        window.location.href = "register.html";

    }
);


// ================================
// HERO START BUTTON
// ================================

heroStartButton.addEventListener(
    "click",
    function () {

        window.location.href = "register.html";

    }
);


// ================================
// EXPLORE PLATFORM
// ================================

learnMoreButton.addEventListener(
    "click",
    function () {

        document
            .getElementById("features")
            .scrollIntoView({
                behavior: "smooth"
            });

    }
);