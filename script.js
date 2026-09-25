"use strict";
// Core content never depends on a reveal animation, a timeout or a page-load class.
document.documentElement.classList.add("js");
const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
const networkCanvas = document.querySelector(".site-network");
const menuButton = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
menuButton.hidden = false;
const closeMenu = () => { navLinks.classList.remove("is-open"); menuButton.setAttribute("aria-expanded", "false"); };
menuButton.addEventListener("click", () => {
 const open = navLinks.classList.toggle("is-open"); menuButton.setAttribute("aria-expanded", String(open));
});
document.addEventListener("keydown", event => { if (event.key === "Escape" && navLinks.classList.contains("is-open")) { closeMenu(); menuButton.focus(); } });
window.addEventListener("pageshow", closeMenu);
const dialog = document.querySelector(".media-dialog");
const mediaBody = dialog.querySelector(".media-body");
let mediaOpener = null;
document.querySelectorAll("[data-video], [data-image]").forEach(link => {
 link.addEventListener("click", event => {
  if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || !dialog.showModal) return;
  event.preventDefault();
  mediaOpener = link;
  const isVideo = link.hasAttribute("data-video");
  const media = document.createElement(isVideo ? "video" : "img");
  document.getElementById("media-title").textContent = link.dataset.title || "Forhåndsvisning";
  if (isVideo) { media.controls = true; media.playsInline = true; media.preload = "metadata"; }
  else media.alt = link.dataset.title || "Sertifikat";
  media.addEventListener("error", () => {
   const message = document.createElement("p"); message.className = "media-error";
   message.append("Kunne ikke vise filen. ");
   const fallback = document.createElement("a"); fallback.href = link.href; fallback.textContent = "Åpne filen direkte";
   message.append(fallback); mediaBody.append(message);
  }, { once: true });
  media.src = isVideo ? link.dataset.video : link.dataset.image;
  mediaBody.replaceChildren(media);
  dialog.showModal(); document.body.classList.add("modal-open");
  if (isVideo) media.play().catch(() => { /* Native play control remains available. */ });
 });
});
dialog.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", event => {
 const rect = dialog.getBoundingClientRect();
 if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
});
dialog.addEventListener("close", () => {
 const video = mediaBody.querySelector("video");
 if (video) { video.pause(); video.removeAttribute("src"); video.load(); }
 mediaBody.replaceChildren(); document.body.classList.remove("modal-open");
 mediaOpener?.focus();
});

function createSeededRandom(seedText) {
    let seed = 2166136261;

    for (const character of seedText) {
        seed ^= character.charCodeAt(0);
        seed = Math.imul(seed, 16777619);
    }

    return () => {
        seed += 0x6D2B79F5;
        let value = seed;
        value = Math.imul(value ^ (value >>> 15), value | 1);
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
}

function initSiteNetwork(canvas) {
    if (!canvas) return;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const random = createSeededRandom(`portfolio-${window.location.pathname}`);
    let width = 1;
    let height = 1;
    let dpr = 1;
    let nodes = [];
    let animationFrame = 0;
    let lastTime = 0;
    let pointerX = 0;
    let pointerY = 0;
    let pointerActive = false;

    const makeNodes = () => {
        // More moving points create more connected shapes.
        const count = 100;

        nodes = Array.from({ length: count }, (_, index) => {
            const x = random() * width;
            const y = random() * height;

            return {
                x,
                y,
                baseX: x,
                baseY: y,
                vx: (random() - .5) * .036,
                vy: (random() - .5) * .032,
                phase: random() * Math.PI * 2,
                drift: 5 + random() * 15,
                size: .55 + random() * 1.15,
                signal: index % 11 === 0
            };
        });
    };

    const resize = () => {
        width = Math.max(1, window.innerWidth);
        height = Math.max(1, window.innerHeight);
        dpr = Math.min(window.devicePixelRatio || 1, 1.65);

        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        context.setTransform(dpr, 0, 0, dpr, 0, 0);

        makeNodes();
        draw(performance.now(), true);
    };

    const updateNode = (node, time, delta) => {
        node.baseX += node.vx * delta;
        node.baseY += node.vy * delta;

        if (node.baseX > width + 24) node.baseX = -20;
        if (node.baseX < -24) node.baseX = width + 20;
        if (node.baseY > height + 24) node.baseY = -20;
        if (node.baseY < -24) node.baseY = height + 20;

        node.x = node.baseX + Math.sin(time * .00017 + node.phase) * node.drift;
        node.y = node.baseY + Math.cos(time * .00013 + node.phase * 1.25) * node.drift * .52;

        if (!pointerActive) return;

        const dx = node.x - pointerX;
        const dy = node.y - pointerY;
        const distanceSquared = dx * dx + dy * dy;
        const radius = 155;

        if (distanceSquared >= radius * radius || distanceSquared < .01) return;

        const distance = Math.sqrt(distanceSquared);
        const strength = (1 - distance / radius) * 7;
        node.x += (dx / distance) * strength;
        node.y += (dy / distance) * strength;
    };

    const draw = (time, staticFrame = false) => {
        const delta = lastTime ? Math.min(34, time - lastTime) : 16;
        lastTime = time;
        context.clearRect(0, 0, width, height);

        if (!staticFrame) {
            nodes.forEach((node) => updateNode(node, time, delta));
        }

        const maxDistance = Math.max(135, Math.min(195, width * .115));

        context.lineWidth = .72;
        for (let i = 0; i < nodes.length; i += 1) {
            for (let j = i + 1; j < nodes.length; j += 1) {
                const first = nodes[i];
                const second = nodes[j];
                const dx = first.x - second.x;
                const dy = first.y - second.y;
                const distance = Math.hypot(dx, dy);

                if (distance >= maxDistance) continue;

                const alpha = (1 - distance / maxDistance) * .12;
                context.strokeStyle = `rgba(205, 214, 235, ${alpha})`;
                context.beginPath();
                context.moveTo(first.x, first.y);
                context.lineTo(second.x, second.y);
                context.stroke();
            }
        }

        nodes.forEach((node) => {
            context.beginPath();
            context.fillStyle = node.signal
                ? "rgba(241, 245, 255, .66)"
                : "rgba(205, 214, 232, .33)";
            context.arc(node.x, node.y, node.signal ? node.size * 1.55 : node.size, 0, Math.PI * 2);
            context.fill();

            if (node.signal) {
                context.beginPath();
                context.strokeStyle = "rgba(225, 233, 255, .09)";
                context.lineWidth = 1;
                context.arc(node.x, node.y, 6 + node.size * 2.2, 0, Math.PI * 2);
                context.stroke();
            }
        });

        if (!reduceMotionQuery.matches && !staticFrame) {
            animationFrame = requestAnimationFrame(draw);
        }
    };

    const start = () => {
        if (reduceMotionQuery.matches || animationFrame) return;
        lastTime = 0;
        animationFrame = requestAnimationFrame(draw);
    };

    const stop = () => {
        if (!animationFrame) return;
        cancelAnimationFrame(animationFrame);
        animationFrame = 0;
    };

    if (finePointerQuery.matches) {
        window.addEventListener("pointermove", (event) => {
            pointerX = event.clientX;
            pointerY = event.clientY;
            pointerActive = true;
        }, { passive: true });

        document.documentElement.addEventListener("mouseleave", () => {
            pointerActive = false;
        });
    }

    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) stop();
        else start();
    });

    reduceMotionQuery.addEventListener("change", () => { stop(); resize(); if (!reduceMotionQuery.matches) start(); });
    resize();

    if (reduceMotionQuery.matches) draw(performance.now(), true);
    else start();
}

initSiteNetwork(networkCanvas);

/* =========================
   AI PORTFOLIO ASSISTANT
========================= */

const aiTrigger = document.getElementById("aiTrigger");
const aiPanel = document.getElementById("aiPanel");
const aiClose = document.getElementById("aiClose");

const aiInput = document.getElementById("aiInput");
const aiSend = document.getElementById("aiSend");

const aiMessage = document.querySelector(".ai-message");
const aiQuickButtons = document.querySelectorAll(".ai-quick-btn");


/* =========================
   ÅPNE / LUKKE AI
========================= */

aiTrigger.addEventListener("click", () => {

    const isOpen = aiPanel.classList.toggle("open");

    aiTrigger.classList.toggle("active", isOpen);

    aiTrigger.setAttribute(
        "aria-expanded",
        isOpen ? "true" : "false"
    );

    if (isOpen) {
        setTimeout(() => {
            aiInput.focus();
        }, 300);
    }
});


/* X-knappen */

aiClose.addEventListener("click", () => {

    aiPanel.classList.remove("open");
    aiTrigger.classList.remove("active");

    aiTrigger.setAttribute(
        "aria-expanded",
        "false"
    );
});


/* =========================
   SEND SPØRSMÅL TIL AI
========================= */

async function sendQuestion(question) {

    question = question.trim();

    if (!question) {
        return;
    }


    /* Loading */

    aiMessage.textContent = "Tenker...";

    aiSend.disabled = true;
    aiSend.textContent = "...";


    try {

        const response = await fetch(
            "/.netlify/functions/ai",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    question: question
                })
            }
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.error || "Kunne ikke hente svar."
            );

        }


        /* Vis AI-svaret */

        aiMessage.textContent = data.answer;


        /* Tøm input */

        aiInput.value = "";

    }

    catch (error) {

        console.error(
            "AI error:",
            error
        );


        aiMessage.textContent =
            "Beklager, jeg klarte ikke å svare akkurat nå. Prøv igjen.";

    }

    finally {

        aiSend.disabled = false;
        aiSend.textContent = "Send";

        aiInput.focus();

    }
}


/* =========================
   SEND-KNAPP
========================= */

aiSend.addEventListener("click", () => {

    sendQuestion(
        aiInput.value
    );

});


/* =========================
   ENTER
========================= */

aiInput.addEventListener("keydown", (event) => {

    if (event.key === "Enter") {

        event.preventDefault();

        sendQuestion(
            aiInput.value
        );

    }

});


/* =========================
   HURTIGKNAPPER
========================= */

aiQuickButtons.forEach((button) => {

    button.addEventListener("click", () => {

        const question =
            button.dataset.question;

        aiInput.value = question;

        sendQuestion(question);

    });

});


/* =========================
   ESC LUKKER AI
========================= */

document.addEventListener("keydown", (event) => {

    if (event.key === "Escape") {

        aiPanel.classList.remove("open");

        aiTrigger.classList.remove("active");

        aiTrigger.setAttribute(
            "aria-expanded",
            "false"
        );

    }

});