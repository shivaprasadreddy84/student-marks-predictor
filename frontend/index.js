document.addEventListener("DOMContentLoaded", function () {
    // Smooth scrolling for links to sections on this page
    const sectionLinks = document.querySelectorAll('a[href^="#"]');

    sectionLinks.forEach(function (link) {
        link.addEventListener("click", function (event) {
            const targetId = this.getAttribute("href");

            if (!targetId || targetId === "#") {
                return;
            }

            const target = document.querySelector(targetId);

            if (target) {
                event.preventDefault();

                target.scrollIntoView({
                    behavior: window.matchMedia(
                        "(prefers-reduced-motion: reduce)"
                    ).matches ? "auto" : "smooth",
                    block: "start"
                });
            }
        });
    });

    // Update the footer year automatically
    const copyright = document.querySelector(".copyright");

    if (copyright) {
        copyright.textContent =
            "\u00A9 " + new Date().getFullYear() + " MarkSense";
    }
});
