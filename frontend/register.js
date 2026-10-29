
document.addEventListener("DOMContentLoaded", function () {
    const $ = id => document.getElementById(id);

    const registerForm = $("registerForm");
    const passwordInput = $("password");
    const confirmPasswordInput = $("confirm_password");
    const formMessage = $("formMessage");
    const registerSubmit = $("registerSubmit");
    const roleSelect = $("role");
    const adminCodeGroup = $("adminCodeGroup");
    const adminCodeInput = $("admin_code");

    function setupPasswordToggle(inputId, buttonId) {
        const input = $(inputId);
        const button = $(buttonId);

        button.addEventListener("click", function () {
            const show = input.type === "password";
            input.type = show ? "text" : "password";
            button.textContent = show ? "Hide" : "Show";
            button.setAttribute(
                "aria-label",
                show ? "Hide password" : "Show password"
            );
        });
    }

    setupPasswordToggle("password", "togglePassword");
    setupPasswordToggle("confirm_password", "toggleConfirmPassword");

    function updateRoleFields() {
        const isAdmin = roleSelect.value === "admin";
        adminCodeGroup.hidden = !isAdmin;
        adminCodeInput.required = isAdmin;

        if (!isAdmin) {
            adminCodeInput.value = "";
        }
    }

    roleSelect.addEventListener("change", updateRoleFields);
    updateRoleFields();

    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const fullName = $("full_name").value.trim();
        const email = $("email").value.trim().toLowerCase();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        const role = roleSelect.value;
        const adminCode = adminCodeInput.value;

        formMessage.style.color = "#fca5a5";
        formMessage.textContent = "";

        if (!fullName || !email || !password || !confirmPassword) {
            formMessage.textContent = "Please fill in all required fields.";
            return;
        }

        if (password.length < 8) {
            formMessage.textContent =
                "Password must contain at least 8 characters.";
            return;
        }

        if (password !== confirmPassword) {
            formMessage.textContent = "Passwords do not match.";
            return;
        }

        if (role === "admin" && !adminCode.trim()) {
            formMessage.textContent =
                "Please enter the admin authorization code.";
            return;
        }

        registerSubmit.disabled = true;
        registerSubmit.textContent = "Creating account...";

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    full_name: fullName,
                    email: email,
                    password: password,
                    role: role,
                    admin_code: adminCode
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Registration failed. Please try again."
                );
            }

            formMessage.style.color = "#6ee7b7";
            formMessage.textContent =
                "Account created successfully! Account ID: " +
                result.account_id +
                ". Redirecting to login...";

            registerSubmit.textContent = "Account Created";

            window.setTimeout(function () {
                window.location.href = "login.html";
            }, 2500);

        } catch (error) {
            formMessage.style.color = "#fca5a5";
            formMessage.textContent =
                error instanceof TypeError
                    ? "Cannot connect to MarkSense. Check that the backend is running."
                    : error.message;

            registerSubmit.disabled = false;
            registerSubmit.innerHTML = 'Create Account <span>→</span>';
        }
    });
});
