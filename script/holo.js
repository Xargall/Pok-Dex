// ============================================
// HOLO – Karten-Holo-Effekt
// Abhängigkeiten: keine
// ============================================

function initHoloEffect() {
    const content = document.getElementById("content");
    let rafId = null;

    content.addEventListener("mousemove", (e) => {
        const card = e.target.closest(".card_section");
        if (!card) return;

        if (rafId) cancelAnimationFrame(rafId);

        rafId = requestAnimationFrame(() => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;

            card.style.setProperty("--rx", `${(x - 0.5) * 12}deg`);
            card.style.setProperty("--ry", `${-(y - 0.5) * 8}deg`);
            card.style.setProperty("--mx", `${x * 100}%`);
            card.style.setProperty("--my", `${y * 100}%`);
            card.style.setProperty("--posx", `${x * 100}%`);
            card.style.setProperty("--posy", `${y * 100}%`);
            card.style.setProperty("--o", "1");
        });
    });

    content.addEventListener("mouseout", (e) => {
        const card = e.target.closest(".card_section");
        if (card && !card.contains(e.relatedTarget)) {
            if (rafId) cancelAnimationFrame(rafId);
            resetCard(card);
        }
    });
}

function resetCard(card) {
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
    card.style.setProperty("--mx", "50%");
    card.style.setProperty("--my", "50%");
    card.style.setProperty("--posx", "50%");
    card.style.setProperty("--posy", "50%");
    card.style.setProperty("--o", "0");
}

document.addEventListener("DOMContentLoaded", () => {
    const observer = new MutationObserver(() => {
        if (document.querySelector(".card_section")) {
            initHoloEffect();
            observer.disconnect();
        }
    });
    observer.observe(document.getElementById("content"), { childList: true });
});