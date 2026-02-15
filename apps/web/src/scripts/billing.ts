declare const Paddle: any;

export function initBilling(config: {
    token: string;
    environment: string;
    tenantId: string;
}) {
    if (typeof Paddle !== "undefined" && config.token) {
        Paddle.Initialize({
            token: config.token,
            environment: config.environment,
        });
    }

    const upgradeBtn = document.getElementById("upgrade-pro-btn");
    const toggle = document.getElementById("billing-period-toggle");
    const amountDisplay = document.getElementById("display-amount");
    const periodDisplay = document.getElementById("display-period");
    const hintDisplay = document.getElementById("yearly-hint-text");
    const labelMonthly = document.getElementById("label-monthly");
    const labelYearly = document.getElementById("label-yearly");
    const toggleKnob = document.getElementById("toggle-knob");

    let isAnnually = false;

    toggle?.addEventListener("click", () => {
        isAnnually = !isAnnually;

        if (toggleKnob) {
            toggleKnob.style.transform = isAnnually
                ? "translateX(24px)"
                : "translateX(0)";
        }

        labelMonthly?.classList.toggle("text-foreground", !isAnnually);
        labelMonthly?.classList.toggle("text-muted-foreground", isAnnually);
        labelYearly?.classList.toggle("text-foreground", isAnnually);
        labelYearly?.classList.toggle("text-muted-foreground", !isAnnually);

        if (amountDisplay && periodDisplay && hintDisplay) {
            if (isAnnually) {
                amountDisplay.textContent = "60";
                periodDisplay.textContent = "/year";
                hintDisplay.textContent = "Billed annually. Save $48 per year.";
            } else {
                amountDisplay.textContent = "9";
                periodDisplay.textContent = "/month";
                hintDisplay.textContent = "Billed monthly. Cancel anytime.";
            }
        }
    });

    upgradeBtn?.addEventListener("click", () => {
        const priceId = isAnnually
            ? upgradeBtn.getAttribute("data-annually-id")
            : upgradeBtn.getAttribute("data-monthly-id");

        if (!priceId || priceId === "...") {
            alert("Paddle Price ID is not configured globally.");
            return;
        }

        const isDark =
            document.documentElement.getAttribute("data-theme") === "dark" ||
            (document.documentElement.getAttribute("data-theme") === "system" &&
                window.matchMedia("(prefers-color-scheme: dark)").matches);

        Paddle.Checkout.open({
            items: [{ priceId: priceId, quantity: 1 }],
            customer: {
                email: config.tenantId.includes("@")
                    ? config.tenantId
                    : "user@example.com",
            },
            customData: {
                tenantId: config.tenantId,
            },
            settings: {
                displayMode: "overlay",
                theme: isDark ? "dark" : "light",
                locale: "en",
            },
        });
    });
}
