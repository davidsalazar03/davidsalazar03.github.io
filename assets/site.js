(function () {
  "use strict";

  const items = Array.from(document.querySelectorAll("details.item"));

  /* ---------- media viewer inside each project ---------- */
  function show(viewer, btn) {
    const stage = viewer.querySelector(".stage");
    const cap = viewer.querySelector("figcaption");
    const { src, type, poster, alt } = btn.dataset;
    stage.querySelectorAll("video").forEach((v) => v.pause());
    stage.replaceChildren();
    let el;
    if (type === "video") {
      el = document.createElement("video");
      el.src = src;
      if (poster) el.poster = poster;
      el.muted = true; el.loop = true; el.playsInline = true; el.controls = true;
      el.setAttribute("aria-label", alt || "");
      el.preload = "metadata";
      el.play().catch(() => {});
    } else {
      el = document.createElement("img");
      el.src = src; el.alt = alt || ""; el.decoding = "async";
    }
    stage.append(el);
    cap.textContent = alt || "";
    viewer.querySelectorAll(".strip button").forEach((b) => b.setAttribute("aria-current", b === btn ? "true" : "false"));
  }

  document.querySelectorAll(".viewer").forEach((viewer) => {
    viewer.addEventListener("click", (ev) => {
      const btn = ev.target.closest(".strip button");
      if (btn) show(viewer, btn);
    });
  });

  /* ---------- open / close ---------- */
  items.forEach((d) => {
    d.addEventListener("toggle", () => {
      const viewer = d.querySelector(".viewer");
      if (d.open) {
        if (viewer && !viewer.querySelector(".stage").children.length) {
          show(viewer, viewer.querySelector(".strip button"));
        } else if (viewer) {
          viewer.querySelectorAll("video").forEach((v) => v.play().catch(() => {}));
        }
        history.replaceState(null, "", "#" + d.id);
      } else {
        d.querySelectorAll("video").forEach((v) => v.pause());
        if (location.hash === "#" + d.id) history.replaceState(null, "", location.pathname + location.search);
      }
    });
  });

  // older browsers ignore <details name>; keep only one open there too
  items.forEach((d) => d.addEventListener("toggle", () => {
    if (d.open) items.forEach((o) => { if (o !== d && o.open) o.open = false; });
  }));

  function openFromHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    const d = id && document.getElementById(id);
    if (d && d.matches("details.item")) {
      d.open = true;
      requestAnimationFrame(() => d.scrollIntoView({ block: "start" }));
    }
  }
  window.addEventListener("hashchange", openFromHash);
  openFromHash();

  // "Read the full write-up" on the featured project toggles its panel
  document.querySelectorAll("[data-open]").forEach((b) => {
    const d = document.getElementById(b.dataset.open);
    const label = b.textContent;
    b.addEventListener("click", () => { d.open = !d.open; });
    d.addEventListener("toggle", () => {
      b.setAttribute("aria-expanded", String(d.open));
      b.textContent = d.open ? "Hide the write-up" : label;
    });
  });

  // the cover video loops on its own, except for people who asked for less motion
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.querySelectorAll("video.cover").forEach((v) => { v.removeAttribute("autoplay"); v.pause(); v.controls = true; });
  }

  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
