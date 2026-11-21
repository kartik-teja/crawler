/* HK Tax LLC — interactions. No dependencies. */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Sticky header shadow ---- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-stuck", window.scrollY > 8);
      var sticky = document.querySelector(".sticky-cta");
      if (sticky) sticky.classList.toggle("show", window.scrollY > 700);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---- Header search ----
     The index is built from the links already on the page (nav, menus, footer),
     so new pages appear in search the moment they're linked. */
  var searchBtn = document.querySelector(".nav__search");
  if (searchBtn) {
    var index = [];
    var seen = {};
    document.querySelectorAll('.nav__links a[href], .dropdown a[href], .footer-col a[href]').forEach(function (a) {
      var href = a.getAttribute("href");
      var label = (a.querySelector(".ddi__label") || a).textContent.replace(/\s+/g, " ").trim();
      if (!href || href.charAt(0) === "#" || !label || seen[href]) return;
      seen[href] = 1;
      index.push({ label: label, href: href });
    });

    var box = document.createElement("div");
    box.className = "site-search";
    box.hidden = true;
    box.innerHTML =
      '<div class="site-search__panel" role="dialog" aria-modal="true" aria-label="Search this site">' +
      '<input class="site-search__input" type="search" placeholder="Search services and pages…" aria-label="Search" />' +
      '<ul class="site-search__results"></ul></div>';
    document.body.appendChild(box);

    var input = box.querySelector(".site-search__input");
    var list = box.querySelector(".site-search__results");

    var render = function () {
      var q = input.value.trim().toLowerCase();
      var hits = (q ? index.filter(function (it) { return it.label.toLowerCase().indexOf(q) > -1; }) : index).slice(0, 8);
      list.innerHTML = hits.length
        ? hits.map(function (it) { return '<li><a href="' + it.href + '">' + it.label + "</a></li>"; }).join("")
        : '<li class="site-search__empty">No matching page</li>';
    };
    var close = function () {
      box.hidden = true;
      searchBtn.setAttribute("aria-expanded", "false");
    };
    searchBtn.addEventListener("click", function () {
      box.hidden = !box.hidden;
      searchBtn.setAttribute("aria-expanded", box.hidden ? "false" : "true");
      if (!box.hidden) { render(); input.focus(); }
    });
    input.addEventListener("input", render);
    box.addEventListener("click", function (e) { if (e.target === box) close(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !box.hidden) close(); });
  }

  /* ---- Mobile nav ---- */
  var toggle = document.querySelector(".nav__toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    });
    // close on link click inside drawer
    document.querySelectorAll(".nav__panel a:not(.has-menu > a)").forEach(function (a) {
      a.addEventListener("click", function () {
        document.body.classList.remove("nav-open");
        document.body.style.overflow = "";
        toggle.setAttribute("aria-expanded", "false");
      });
    });
    // toggle sub-menu inside mobile drawer
    document.querySelectorAll(".nav__panel .has-menu > a").forEach(function (a) {
      a.addEventListener("click", function (e) {
        if (window.innerWidth <= 960) {
          e.preventDefault();
          a.parentElement.classList.toggle("is-expanded");
        }
      });
    });
    window.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.body.classList.contains("nav-open")) toggle.click();
    });
  }

  /* ---- Scroll reveal ---- */
  var reveals = document.querySelectorAll("[data-reveal]");
  if (reveals.length) {
    if (reduce || !("IntersectionObserver" in window)) {
      reveals.forEach(function (el) { el.classList.add("in"); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
      reveals.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---- Animated counters ---- */
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length) {
    // Thousands separators, so 15000 reads as 15,000.
    var fmt = function (n, d) {
      return n.toFixed(d).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };
    var run = function (el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var dur = 1600, start = null;
      var decimals = (target % 1 !== 0) ? 1 : 0;
      var step = function (ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(target * eased, decimals);
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = fmt(target, decimals);
      };
      requestAnimationFrame(step);
    };
    if (reduce || !("IntersectionObserver" in window)) {
      counters.forEach(function (el) {
        var v = parseFloat(el.getAttribute("data-count"));
        el.textContent = fmt(v, v % 1 !== 0 ? 1 : 0);
      });
    } else {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { run(en.target); cio.unobserve(en.target); }
        });
      }, { threshold: 0.5 });
      counters.forEach(function (el) { cio.observe(el); });
    }
  }

  /* ---- Accordion ---- */
  document.querySelectorAll(".acc-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var item = btn.closest(".acc-item");
      var open = item.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });

  /* ---- Form validation + fake success ---- */
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  document.querySelectorAll("form[data-validate]").forEach(function (form) {
    var setError = function (field, msg) {
      field.classList.toggle("has-error", !!msg);
      var e = field.querySelector(".field__error");
      if (e && msg) e.textContent = msg;
    };
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true, firstBad = null;
      form.querySelectorAll(".field").forEach(function (field) {
        var input = field.querySelector("input, select, textarea");
        if (!input || !input.hasAttribute("required")) { setError(field, ""); return; }
        var val = (input.value || "").trim();
        var msg = "";
        if (!val) msg = "This field is required.";
        else if (input.type === "email" && !emailRe.test(val)) msg = "Enter a valid email address.";
        else if (input.type === "tel" && val.replace(/\D/g, "").length < 7) msg = "Enter a valid phone number.";
        setError(field, msg);
        if (msg) { ok = false; if (!firstBad) firstBad = input; }
      });
      if (!ok) { if (firstBad) firstBad.focus(); return; }

      var success = form.querySelector(".form-success");
      var btn = form.querySelector("[type=submit]");
      var endpoint = form.getAttribute("action") || "api/contact.php";
      if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }

      var showError = function (msg) {
        var box = form.querySelector(".form-error");
        if (!box) {
          box = document.createElement("div");
          box.className = "form-error";
          box.setAttribute("role", "alert");
          form.insertBefore(box, form.firstChild);
        }
        box.textContent = msg || "Something went wrong. Please try again or call us.";
        box.style.display = "block";
        box.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      };
      var restore = function () {
        if (btn) { btn.disabled = false; btn.textContent = btn.getAttribute("data-label") || "Submit"; }
      };

      fetch(endpoint, { method: "POST", body: new FormData(form), headers: { "X-Requested-With": "fetch" } })
        .then(function (res) { return res.json().then(function (j) { return { status: res.status, j: j }; }); })
        .then(function (r) {
          if (r.status === 200 && r.j && r.j.ok) {
            var errBox = form.querySelector(".form-error"); if (errBox) errBox.style.display = "none";
            if (success) {
              success.classList.add("show");
              success.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
              form.reset();
              restore();
            } else {
              // newsletter (no success box) — replace with a confirmation line
              form.innerHTML = '<p style="margin:0;color:var(--gold);font-weight:600">✓ You’re subscribed. Thank you!</p>';
            }
          } else if (r.status === 422 && r.j && r.j.errors) {
            Object.keys(r.j.errors).forEach(function (name) {
              var input = form.querySelector('[name="' + name + '"]');
              if (input) {
                var f = input.closest(".field");
                if (f) { f.classList.add("has-error"); var e = f.querySelector(".field__error"); if (e) e.textContent = r.j.errors[name]; }
              }
            });
            var bad = form.querySelector(".field.has-error input, .field.has-error select, .field.has-error textarea");
            if (bad) bad.focus();
            restore();
          } else {
            showError(r.j && r.j.error); restore();
          }
        })
        .catch(function () { showError(); restore(); });
    });
    // clear error on input
    form.querySelectorAll("input, select, textarea").forEach(function (input) {
      input.addEventListener("input", function () {
        var f = input.closest(".field");
        if (f) f.classList.remove("has-error");
      });
    });
  });

  /* ---- Footer year ---- */
  var yr = document.getElementById("year");
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---- API base (pages under /services/ need ../api/, root pages need api/) ---- */
  var apiBase = /\/services\//.test(location.pathname) ? "../api/" : "api/";

  /* ---- Live site settings (admin-managed phone/email/address) ----
     Baked-in HTML stays as the fallback (SEO + "DB unreachable" case); this only
     overwrites it once fresh data arrives, matched by icon rather than by adding
     data-attributes to every page. */
  fetch(apiBase + "settings.php")
    .then(function (r) { return r.json(); })
    .then(function (j) {
      if (!j || !j.ok || !j.settings) return;
      var s = j.settings;

      var byIcon = function (id) {
        return Array.prototype.filter.call(document.querySelectorAll(".contact-item"), function (el) {
          var use = el.querySelector(".contact-item__ic use");
          return use && use.getAttribute("href") === "#" + id;
        });
      };
      var setText = function (el, text) { if (el && text) el.textContent = text; };

      // The floating WhatsApp button has its own number, set in Admin →
      // Settings → Contact info. Falls back to the main phone number when the
      // admin hasn't set a separate one.
      var waNumber = (s.whatsapp_number || s.phone || "").replace(/\D/g, "");
      if (waNumber) {
        var wa = document.createElement("a");
        wa.className = "fab-whatsapp";
        wa.href = "https://wa.me/" + waNumber;
        wa.target = "_blank";
        wa.rel = "noopener";
        wa.setAttribute("aria-label", "Chat with us on WhatsApp");
        wa.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
        document.body.appendChild(wa);

        byIcon("phone").forEach(function (el) {
          var strong = el.querySelector("strong");
          var link = strong ? strong.querySelector("a") : null;
          if (link) { link.href = "tel:" + s.phone.replace(/[^+\d]/g, ""); setText(link, s.phone); }
          else setText(strong, s.phone);
        });
        document.querySelectorAll('a[href^="tel:"]').forEach(function (a) {
          a.href = "tel:" + s.phone.replace(/[^+\d]/g, "");
          if (/^\+?[\d\s-]+$/.test(a.textContent.trim())) a.textContent = s.phone;
        });
      }
      if (s.email) {
        byIcon("mail").forEach(function (el) {
          var strong = el.querySelector("strong");
          var link = strong ? strong.querySelector("a") : null;
          if (link) { link.href = "mailto:" + s.email; setText(link, s.email); }
          else setText(strong, s.email);
        });
        document.querySelectorAll('a[href^="mailto:"]').forEach(function (a) {
          a.href = "mailto:" + s.email;
          if (a.textContent.indexOf("@") > -1) a.textContent = s.email;
        });
      }
      if (s.address_line1) {
        byIcon("map-pin").forEach(function (el) {
          setText(el.querySelector("strong"), s.address_line1);
          setText(el.querySelector("p"), s.address_line2 || "");
        });
      }

      // Admin-uploaded logo/favicon (uploads/brand/...) replace the baked-in ones.
      var brandPfx = /\/services\//.test(location.pathname) ? "../" : "";
      if (s.logo_url) {
        // Only touch the src when it actually differs. The baked-in logo.png is
        // kept in sync with the uploaded logo, so in the normal case we skip the
        // assignment entirely and the header never re-paints.
        var wantLogo = brandPfx + s.logo_url;
        document.querySelectorAll("img.brand__logo").forEach(function (im) {
          if (im.getAttribute("src") !== wantLogo) im.src = wantLogo;
        });
      }
      if (s.logo_height) {
        document.documentElement.style.setProperty("--logo-h", parseInt(s.logo_height, 10) + "px");
      }
      if (s.favicon_url) {
        document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]').forEach(function (l) {
          l.href = brandPfx + s.favicon_url;
          l.removeAttribute("type");
        });
      }

      var socialMap = { linkedin: s.social_linkedin, twitter: s.social_twitter, facebook: s.social_facebook, instagram: s.social_instagram };
      Object.keys(socialMap).forEach(function (name) {
        var url = socialMap[name];
        if (!url) return;
        document.querySelectorAll(".socials use[href='#" + name + "']").forEach(function (use) {
          var link = use.closest("a");
          if (link) link.href = url;
        });
      });
    })
    .catch(function () { /* keep baked-in fallback */ });

  /* ---- Admin page-content overrides (site editor) ----
     Baked-in HTML is the fallback; anything the admin edited in the Pages
     section is applied here by CSS selector. */
  var inServices = /\/services\//.test(location.pathname);
  var pageKey = currentPageKey();
  fetch(apiBase + "content.php?page=" + encodeURIComponent(pageKey))
    .then(function (r) { return r.json(); })
    .then(function (j) {
      if (!j || !j.ok || !j.content) return;
      j.content.forEach(function (c) {
        var m = c.selector.match(/^(.*)::text\((\d+)\)$/);
        var el = document.querySelector(m ? m[1] : c.selector);
        if (!el) return;
        if (c.kind === "image") {
          var src = c.value;
          if (!/^(https?:|data:|\.\.\/|\/)/.test(src) && inServices) src = "../" + src;
          el.src = src;
          el.removeAttribute("srcset");
        } else if (m) {
          var node = el.childNodes[+m[2]];
          if (node && node.nodeType === 3) node.nodeValue = c.value;
        } else {
          el.textContent = c.value;
          // keep email/phone links working when their visible text is edited
          if (el.tagName === "A") {
            var href = el.getAttribute("href") || "";
            if (href.indexOf("mailto:") === 0) el.href = "mailto:" + c.value.trim();
            else if (href.indexOf("tel:") === 0) el.href = "tel:" + c.value.replace(/[^+\d]/g, "");
          }
        }
      });
    })
    .catch(function () { /* keep baked-in fallback */ });

  /* ---- Homepage banner slider (admin-managed; replaces the hero) ---- */
  var bslider = document.querySelector("[data-banner-slider]");
  if (bslider) {
    fetch(apiBase + "banners.php")
      .then(function (r) { return r.json(); })
      .then(function (j) {
        // The hero ships hidden so it never flashes before the banners load.
        // With no banners it is the fallback, so swap the placeholder for it.
        var hero = document.querySelector("[data-hero]");
        if (!j || !j.ok || !j.banners || !j.banners.length) {
          bslider.classList.remove("is-loading");
          bslider.hidden = true;
          if (hero) hero.hidden = false;
          return;
        }
        var banners = j.banners, speed = Math.max(2, j.speed || 5) * 1000, idx = 0, dots = [], timer = null;

        var n = banners.length;
        // index.html already contains the first banner (written there by the
        // admin on save) so it paints immediately. Reuse that element rather
        // than replacing it, otherwise the browser re-renders and it blinks.
        var track = bslider.querySelector(".bslider__track");
        var preRendered = track ? track.querySelector(".bslider__slide") : null;
        if (!track) {
          // Nothing baked into the HTML yet (banner added but index.html not
          // written) — show the quiet placeholder while we build it.
          bslider.classList.add("is-loading");
          track = document.createElement("div");
          track.className = "bslider__track";
        }

        function makeSlide(b, eager) {
          var slide = document.createElement("div");
          slide.className = "bslider__slide";
          var img = document.createElement("img");
          img.src = b.image_path; img.alt = "";
          // The first banner is above the fold — lazy-loading it would delay
          // the hero paint.
          img.loading = eager ? "eager" : "lazy";
          if (b.link_url) {
            var a = document.createElement("a");
            a.href = b.link_url;
            a.appendChild(img);
            slide.appendChild(a);
          } else { slide.appendChild(img); }
          return slide;
        }
        banners.forEach(function (b, k) {
          // Slide 0 is already in the HTML — leave it alone.
          if (k === 0 && preRendered) return;
          track.appendChild(makeSlide(b, k === 0));
        });

        // Size the stage to the first banner's own proportions, so it fills the
        // area exactly — no cropping and no blank bars — whatever size the admin
        // uploads. Falls back to the 1280x500 default in CSS.
        (function () {
          var first = track.querySelector("img");
          if (!first) return;
          var applyRatio = function () {
            if (first.naturalWidth && first.naturalHeight) {
              bslider.style.setProperty("--bslider-ratio", first.naturalWidth + " / " + first.naturalHeight);
            }
            // Drop the placeholder only once there is a real image to show, so
            // the area never flashes empty white in between.
            bslider.classList.remove("is-loading");
          };
          if (first.complete) applyRatio();
          first.addEventListener("load", applyRatio);
          // Safety net: never leave the shimmer running if the image errors.
          first.addEventListener("error", function () { bslider.classList.remove("is-loading"); });
        })();
        // A clone of the first banner sits after the last one, so advancing past
        // the end keeps moving forwards instead of rewinding through every slide.
        // Eager: its bytes are already cached from slide 0, so it costs nothing,
        // and a lazy clone shows blank on the wrap-around.
        if (n > 1) track.appendChild(makeSlide(banners[0], true));
        if (!track.parentNode) bslider.appendChild(track);

        // Warm the later banners once the page has finished loading. They are
        // lazy so they don't compete with the hero paint, but a lazy image that
        // is still off-screen has not started downloading — sliding to a heavy
        // one then showed an empty stage until it arrived.
        window.addEventListener("load", function () {
          banners.forEach(function (b, k) { if (k > 0) { new Image().src = b.image_path; } });
        });

        // pos runs 0..n, where n is the clone of slide 0.
        function place(animate) {
          track.classList.toggle("is-instant", !animate);
          track.style.transform = "translateX(-" + (idx * 100) + "%)";
          if (!animate) void track.offsetWidth; // flush, so the next move animates
          var active = idx % n;
          dots.forEach(function (d, k) { d.classList.toggle("is-active", k === active); });
        }
        // Once the move onto the clone finishes, jump back to the real first
        // slide with no transition — invisible, because they are identical.
        track.addEventListener("transitionend", function (e) {
          if (e.target === track && e.propertyName === "transform" && idx >= n) {
            idx = 0;
            place(false);
          }
        });

        function go(i) { idx = Math.max(0, Math.min(n, i)); place(true); }
        function nextSlide() {
          if (n < 2) return;
          // Self-correcting: if we are parked on the clone (or somehow past it,
          // because a transitionend was missed while the tab was backgrounded or
          // the arrow was clicked mid-animation), snap to the real first slide
          // before advancing. Without this idx kept climbing past the last slide
          // and the stage went permanently blank.
          if (idx >= n) { idx = 0; place(false); }
          idx++;
          place(true);
        }
        function prevSlide() {
          if (n < 2) return;
          if (idx > n) { idx = n; place(false); }
          if (idx === 0) { idx = n; place(false); } // hop to the clone, then walk back
          idx--;
          place(true);
        }
        function start() { if (n > 1 && !reduce) timer = setInterval(nextSlide, speed); }
        function reset() { clearInterval(timer); start(); }
        function arrow(dir, path) {
          var b = document.createElement("button");
          b.className = "bslider__arrow bslider__arrow--" + dir;
          b.setAttribute("aria-label", dir === "prev" ? "Previous banner" : "Next banner");
          b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="' + path + '"/></svg>';
          return b;
        }

        if (banners.length > 1) {
          var dotsWrap = document.createElement("div");
          dotsWrap.className = "bslider__dots";
          banners.forEach(function (_, k) {
            var d = document.createElement("button");
            d.className = "bslider__dot";
            d.setAttribute("aria-label", "Go to slide " + (k + 1));
            d.addEventListener("click", function () { go(k); reset(); });
            dots.push(d); dotsWrap.appendChild(d);
          });
          bslider.appendChild(dotsWrap);
          var prev = arrow("prev", "m15 18-6-6 6-6"), next = arrow("next", "m9 18 6-6-6-6");
          prev.addEventListener("click", function () { prevSlide(); reset(); });
          next.addEventListener("click", function () { nextSlide(); reset(); });
          bslider.appendChild(prev); bslider.appendChild(next);
        }

        // Swipe on touch devices — the arrows are small targets on a phone.
        if (n > 1) {
          var tx = 0, ty = 0, swiping = false;
          bslider.addEventListener("touchstart", function (e) {
            var t = e.changedTouches[0];
            tx = t.clientX; ty = t.clientY; swiping = true;
            clearInterval(timer);
          }, { passive: true });
          bslider.addEventListener("touchend", function (e) {
            if (!swiping) return;
            swiping = false;
            var t = e.changedTouches[0];
            var dx = t.clientX - tx, dy = t.clientY - ty;
            // Ignore mostly-vertical moves so page scrolling still works.
            if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
              if (dx < 0) nextSlide(); else prevSlide();
            }
            start();
          }, { passive: true });
        }

        bslider.hidden = false;
        go(0);
        bslider.addEventListener("mouseenter", function () { clearInterval(timer); });
        bslider.addEventListener("mouseleave", start);
        start();
      })
      .catch(function () {
        // API unreachable — drop the placeholder and fall back to the hero.
        bslider.classList.remove("is-loading");
        bslider.hidden = true;
        var hero = document.querySelector("[data-hero]");
        if (hero) hero.hidden = false;
      });
  }

  /* ---- Trusted-by logo marquee (admin-managed) ---- */
  var logoWrap = document.querySelector("[data-logo-marquee]");
  if (logoWrap) {
    fetch(apiBase + "logos.php")
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || !j.ok || !j.logos || !j.logos.length) return; // section stays hidden
        var pfx = /\/services\//.test(location.pathname) ? "../" : "";
        var items = j.logos.map(function (l) {
          var img = '<img src="' + esc(pfx + l.image_path) + '" alt="" loading="lazy" />';
          var inner = l.link_url ? '<a href="' + esc(l.link_url) + '" target="_blank" rel="noopener">' + img + "</a>" : img;
          return '<div class="logo-item">' + inner + "</div>";
        }).join("");
        // Repeat the set so one loop "unit" spans the screen (no blank gaps with
        // few logos), then duplicate that unit so the -50% scroll loops seamlessly.
        var reps = Math.max(2, Math.ceil(12 / j.logos.length));
        var unit = "";
        for (var r = 0; r < reps; r++) unit += items;
        logoWrap.innerHTML = '<div class="logo-track">' + unit + unit + "</div>";
        if (!reduce) {
          logoWrap.querySelector(".logo-track").style.animationDuration = (reps * j.logos.length * 5) + "s";
        }
        var sec = document.querySelector("[data-logo-section]");
        if (sec) sec.hidden = false;
      })
      .catch(function () { /* section stays hidden */ });
  }

  /* ---- Live testimonials (admin-managed) ---- */
  var tstGrid = document.querySelector("[data-testimonials]");
  if (tstGrid) {
    fetch(apiBase + "testimonials.php")
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || !j.ok || !j.testimonials || !j.testimonials.length) return;
        var starIcon = '<svg aria-hidden="true"><use href="#star"/></svg>';
        var html = j.testimonials.map(function (t) {
          return '<article class="card tst-card in">' +
            '<span class="stars" aria-label="' + t.rating + ' out of 5 stars">' + starIcon.repeat(t.rating) + "</span>" +
            "<blockquote>“" + esc(t.quote) + "”</blockquote>" +
            '<div class="tst-author"><div><strong>' + esc(t.author_name) + "</strong><span>" + esc(t.author_role || "") + "</span></div></div>" +
            "</article>";
        }).join("");
        // Right-to-left marquee. Duplicate the set so the loop is seamless;
        // duration scales with how many reviews there are.
        tstGrid.className = "tst-marquee";
        tstGrid.innerHTML = '<div class="tst-track">' + html + html + "</div>";
        if (!reduce) {
          tstGrid.querySelector(".tst-track").style.animationDuration = (j.testimonials.length * 6) + "s";
        }
      })
      .catch(function () { /* keep baked-in fallback */ });
  }

  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* Page identifier the APIs expect (always with .html), even though the site
     serves clean URLs like /about and /services/itin-assistance. */
  function currentPageKey() {
    var path = location.pathname;
    var last = path.split("/").pop() || "";
    if (last === "" || last === "index") last = "index.html";
    else if (!/\.html$/i.test(last)) last += ".html";
    return /\/services\//.test(path) ? "services/" + last : last;
  }

  /* ---- Promo popups (admin-managed; per-popup delay + optional repeat) ---- */
  (function () {
    var pk = currentPageKey();
    var sub = /\/services\//.test(location.pathname);
    fetch(apiBase + "popups.php?page=" + encodeURIComponent(pk))
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var list = (j && j.popups) || (j && j.popup ? [j.popup] : []);
        list.forEach(function (p) { schedulePopup(p, sub); });
      })
      .catch(function () {});
  })();

  function schedulePopup(p, sub) {
    var key = "providence_popup_" + p.id;
    var delay = Math.max(0, (+p.delay_seconds || 0)) * 1000;
    var repeat = Math.max(0, (+p.repeat_minutes || 0)) * 60000;

    if (!repeat) {
      // Show once per browser session.
      try { if (sessionStorage.getItem(key)) return; } catch (e) {}
      setTimeout(function () {
        try { sessionStorage.setItem(key, "1"); } catch (e) {}
        showPopup(p, sub);
      }, delay);
      return;
    }
    // Repeating: first show after the delay, then every `repeat` ms. Never stack
    // over another open popup — skip this tick if one is already showing.
    setTimeout(function () {
      showPopup(p, sub);
      setInterval(function () {
        if (!document.querySelector(".cx-pop-overlay")) showPopup(p, sub);
      }, repeat);
    }, delay);
  }

  function showPopup(p, sub) {
    if (document.querySelector(".cx-pop-overlay")) return;   // one at a time
    // Relative links/images are stored root-relative (e.g. portal/register.php),
    // so pages under /services/ need to hop up one level.
    var rel = function (u) {
      return /^(https?:|mailto:|tel:|\/|#)/i.test(u) ? u : (sub ? "../" : "") + u;
    };
    var inner;
    if (p.image_path) {
      var img = '<img class="cx-pop__img" src="' + esc(rel(p.image_path)) + '" alt="" />';
      inner = p.link_url ? '<a href="' + esc(rel(p.link_url)) + '">' + img + "</a>" : img;
    } else {
      inner = '<div class="cx-pop__body">' +
        (p.title ? "<h3>" + esc(p.title) + "</h3>" : "") +
        (p.body ? "<p>" + esc(p.body).replace(/\n/g, "<br>") + "</p>" : "") +
        (p.link_url ? '<a class="btn btn--gold btn--lg" href="' + esc(rel(p.link_url)) + '">' + esc(p.link_text || "Learn more") + "</a>" : "") +
        "</div>";
    }
    var ov = document.createElement("div");
    ov.className = "cx-pop-overlay";
    ov.innerHTML = '<div class="cx-pop"><button class="cx-pop__close" aria-label="Close">&times;</button>' + inner + "</div>";
    document.body.appendChild(ov);
    requestAnimationFrame(function () { ov.classList.add("show"); });
    function dismiss() { ov.classList.remove("show"); setTimeout(function () { ov.remove(); }, 260); }
    ov.querySelector(".cx-pop__close").addEventListener("click", dismiss);
    ov.addEventListener("click", function (e) { if (e.target === ov) dismiss(); });
    document.addEventListener("keydown", function onEsc(e) { if (e.key === "Escape") { dismiss(); document.removeEventListener("keydown", onEsc); } });
  }

  /* ---- Chat assistant (answers from our own site info) ---- */
  (function () {
    var sub = /\/services\//.test(location.pathname);
    var rel = function (u) { return /^(https?:|mailto:|tel:|\/|#)/i.test(u) ? u : (sub ? "../" : "") + u; };

    var fab = document.createElement("button");
    fab.className = "cx-bot-fab";
    fab.setAttribute("aria-label", "Chat with us");
    fab.innerHTML =
      '<svg class="cx-bot-fab__chat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.6-.8L3 21l1.9-5.7A8.38 8.38 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z"/><line x1="8.5" y1="10.5" x2="15.5" y2="10.5"/><line x1="8.5" y1="13.5" x2="13.5" y2="13.5"/></svg>' +
      '<svg class="cx-bot-fab__x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
    document.body.appendChild(fab);

    var panel = document.createElement("div");
    panel.className = "cx-bot";
    panel.innerHTML =
      '<div class="cx-bot__head"><span class="cx-bot__dot"></span><div class="cx-bot__title"><strong>HK Tax Assistant</strong><small>Typically replies instantly</small></div>' +
      '<button class="cx-bot__live" type="button" title="Talk to a person"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/></svg><span>Live chat</span></button>' +
      '<button class="cx-bot__live cx-bot__toassist" type="button" title="Back to the assistant" style="display:none"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.6-.8L3 21l1.9-5.7A8.38 8.38 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z"/></svg><span>Assistant</span></button>' +
      '<button class="cx-bot__end" type="button" title="End live chat" style="display:none"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg><span>End</span></button></div>' +
      '<div class="cx-bot__msgs" role="log" aria-live="polite"></div>' +
      '<form class="cx-bot__form"><input type="text" class="cx-bot__input" placeholder="Ask a question…" autocomplete="off" maxlength="2000" /><button type="submit" class="cx-bot__send" aria-label="Send"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button></form>';
    document.body.appendChild(panel);

    var msgs = panel.querySelector(".cx-bot__msgs");
    var form = panel.querySelector(".cx-bot__form");
    var input = panel.querySelector(".cx-bot__input");
    var liveBtn = panel.querySelector(".cx-bot__live");
    var assistBtn = panel.querySelector(".cx-bot__toassist");
    var endBtn = panel.querySelector(".cx-bot__end");
    var titleEl = panel.querySelector(".cx-bot__title");
    var botHeaderHTML = titleEl.innerHTML;
    var started = false;

    /* ---- live chat mode (visitor <-> admin, short polling) ---- */
    var mode = "bot";
    var liveToken = null, liveLastId = 0, livePoll = null;

    function setLiveHeader(text) { titleEl.innerHTML = "<strong>Live chat</strong><small>" + esc(text) + "</small>"; }

    // Show the header buttons for the current mode.
    function showLiveControls(on) {
      liveBtn.style.display = on ? "none" : "";
      assistBtn.style.display = on ? "" : "none";
      endBtn.style.display = on ? "" : "none";
    }

    // Leave live mode and go back to the bot. `forget` also drops the saved
    // conversation (used when the chat has actually ended).
    function backToBot(note, forget) {
      stopLive();
      if (forget) {
        liveToken = null;
        try { localStorage.removeItem("providence_chat_token"); } catch (e) {}
      }
      showLiveControls(false);
      titleEl.innerHTML = botHeaderHTML;
      input.placeholder = "Ask a question…";
      if (note) bubble(note, "sys");
    }

    function pollLive() {
      if (!liveToken) return;
      fetch(apiBase + "livechat.php?action=poll&token=" + liveToken + "&after=" + liveLastId)
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (!j || !j.ok) return;
          (j.messages || []).forEach(function (m) {
            liveLastId = Math.max(liveLastId, m.id);
            if (m.sender === "agent") bubble(m.body, "bot");
            else if (m.sender === "system") { var s = bubble(m.body, "sys"); }
          });
          if (j.status === "live") setLiveHeader("Connected with our team");
          if (j.status === "closed") backToBot("Live chat ended. You're back with the assistant.", true);
        })
        .catch(function () {});
    }
    function stopLive() { if (livePoll) { clearInterval(livePoll); livePoll = null; } mode = "bot"; }

    function startLive() {
      if (mode === "live") return;
      mode = "live";
      showLiveControls(true);
      input.placeholder = "Type your message…";
      setLiveHeader("Connecting…");
      bubble("Connecting you to our team… you can start typing your message.", "sys");
      var fd = new FormData();
      fd.append("action", "start");
      fd.append("uid", localStorage.getItem("providence_vid") || "");
      fd.append("page", location.pathname);
      if (liveToken) fd.append("token", liveToken);
      fetch(apiBase + "livechat.php", { method: "POST", body: fd })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (j && j.ok) {
            liveToken = j.token;
            try { localStorage.setItem("providence_chat_token", liveToken); } catch (e) {}
            setLiveHeader(j.status === "live" ? "Connected with our team" : "Waiting for an agent…");
            if (livePoll) clearInterval(livePoll);
            livePoll = setInterval(pollLive, 3000);
            pollLive();
          } else { bubble("Sorry, live chat isn't available right now. Please try WhatsApp or the contact page.", "bot", { url: "contact.html", text: "Contact us" }); backToBot("", false); }
        }).catch(function () { bubble("Couldn't start live chat. Please try again.", "bot"); backToBot("", false); });
    }
    liveBtn.addEventListener("click", startLive);

    // Switch back to the assistant without ending the live chat — polling stays
    // on, so an agent reply still comes through.
    assistBtn.addEventListener("click", function () {
      mode = "bot";
      showLiveControls(false);
      titleEl.innerHTML = botHeaderHTML;
      input.placeholder = "Ask a question…";
      bubble("You're back with the assistant. Your live chat is still open — tap Live chat to return to it.", "sys");
    });

    // End the live chat: it closes and disappears from the admin panel.
    endBtn.addEventListener("click", function () {
      var fd = new FormData();
      fd.append("action", "close");
      fd.append("token", liveToken || "");
      fetch(apiBase + "livechat.php", { method: "POST", body: fd }).catch(function () {});
      backToBot("Live chat ended. You're back with the HK Tax Assistant.", true);
    });

    function bubble(text, who, link) {
      var b = document.createElement("div");
      b.className = "cx-bot__msg cx-bot__msg--" + who;
      b.innerHTML = esc(text).replace(/\n/g, "<br>");
      if (link && link.url) {
        b.innerHTML += '<a class="cx-bot__link" href="' + esc(rel(link.url)) + '">' + esc(link.text || "Learn more") + " →</a>";
      }
      msgs.appendChild(b);
      msgs.scrollTop = msgs.scrollHeight;
      return b;
    }

    function toggle() {
      var open = panel.classList.toggle("show");
      fab.classList.toggle("open", open);
      if (open) {
        hideTeaser(true);
        if (!started) {
          started = true;
          bubble("Hi! 👋 I'm the HK Tax assistant. Ask me about our tax services, pricing, booking a consultation, or your client portal.", "bot");
        }
        setTimeout(function () { input.focus(); }, 120);
      }
    }
    fab.addEventListener("click", toggle);

    /* ---- attention teaser, so visitors notice the chat is there ---- */
    var teaser = document.createElement("div");
    teaser.className = "cx-bot-teaser";
    teaser.innerHTML =
      '<button class="cx-bot-teaser__x" type="button" aria-label="Dismiss">&times;</button>' +
      "<strong>Need help? 👋</strong>" +
      "<span>Chat with our assistant, or talk to a real person on live chat.</span>";
    document.body.appendChild(teaser);

    function hideTeaser(remember) {
      teaser.classList.remove("show");
      if (remember) { try { sessionStorage.setItem("providence_bot_teaser", "1"); } catch (e) {} }
    }
    var teaserSeen = false;
    try { teaserSeen = !!sessionStorage.getItem("providence_bot_teaser"); } catch (e) {}
    if (!teaserSeen) {
      setTimeout(function () {
        if (!panel.classList.contains("show")) teaser.classList.add("show");
      }, 4000);
    }
    teaser.addEventListener("click", function (e) {
      var dismiss = e.target.closest && e.target.closest(".cx-bot-teaser__x");
      hideTeaser(true);
      if (!dismiss) toggle();
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var q = input.value.trim();
      if (!q) return;
      bubble(q, "user");
      input.value = "";

      // Live mode: send to the agent, let polling surface the reply.
      if (mode === "live") {
        var fd = new FormData();
        fd.append("action", "send"); fd.append("token", liveToken || ""); fd.append("body", q);
        fetch(apiBase + "livechat.php", { method: "POST", body: fd })
          .then(function (r) { return r.json(); })
          .then(function (j) { if (j && j.error === "closed") backToBot("This chat has ended. Ask the assistant or start a new live chat.", true); })
          .catch(function () {});
        return;
      }

      // Bot mode: answer after a ~1s "thinking" pause.
      var typing = bubble("", "bot");
      typing.classList.add("cx-bot__msg--typing");
      typing.innerHTML = '<span class="cx-bot__dots"><i></i><i></i><i></i></span>';
      var sentAt = Date.now();
      var MIN_DELAY = 1000;
      function reply(text, link) {
        var wait = Math.max(0, MIN_DELAY - (Date.now() - sentAt));
        setTimeout(function () { typing.remove(); bubble(text, "bot", link); }, wait);
      }
      fetch(apiBase + "chatbot.php?q=" + encodeURIComponent(q))
        .then(function (r) { return r.json(); })
        .then(function (j) {
          reply((j && j.reply) || "Sorry, something went wrong. Please try our contact page.", j && j.link);
        })
        .catch(function () {
          reply("I couldn't reach the server. Please call us or use the contact page.", { url: "contact.html", text: "Contact us" });
        });
    });

    // Resume an existing live chat on load (if not closed).
    (function () {
      var saved = null;
      try { saved = localStorage.getItem("providence_chat_token"); } catch (e) {}
      if (!saved) return;
      fetch(apiBase + "livechat.php?action=poll&token=" + saved + "&after=0")
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (j && j.ok && j.status !== "closed") { liveToken = saved; startLive(); }
          else { try { localStorage.removeItem("providence_chat_token"); } catch (e) {} }
        }).catch(function () {});
    })();
  })();

  /* ---- Team members (About page; admin-managed, static cards are fallback) ---- */
  (function () {
    var grid = document.querySelector("[data-team]");
    if (!grid) return;
    fetch(apiBase + "team.php")
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || !j.ok || !j.team || !j.team.length) return;   // keep baked-in cards
        grid.innerHTML = "";
        j.team.forEach(function (m, i) {
          var a = document.createElement("article");
          a.className = "card";
          a.setAttribute("data-reveal", i % 2 ? "right" : "left");
          if (i % 4) a.setAttribute("data-delay", String(i % 4));
          a.style.cssText = "text-align:center;padding:26px";
          var html = "";
          if (m.photo_path) {
            var src = /^https?:/.test(m.photo_path) ? m.photo_path : m.photo_path;
            html += '<img src="' + esc(src) + '" width="120" height="120" loading="lazy" alt="Portrait of ' +
                    esc(m.name) + '" style="width:120px;height:120px;border-radius:50%;object-fit:cover;margin:0 auto 16px" />';
          }
          html += '<h3 style="font-size:1.15rem;margin-bottom:2px">' + esc(m.name) + "</h3>";
          if (m.role) html += '<p style="color:var(--blue);font-weight:600;font-size:0.9rem;margin-bottom:8px">' + esc(m.role) + "</p>";
          if (m.bio)  html += '<p style="font-size:0.9rem;margin-bottom:0">' + esc(m.bio) + "</p>";
          a.innerHTML = html;
          grid.appendChild(a);
        });
        // the reveal observer already ran, so show these straight away
        grid.querySelectorAll("[data-reveal]").forEach(function (el) { el.classList.add("in"); });
      })
      .catch(function () { /* keep the baked-in cards */ });
  })();

  /* ---- Visitor tracking (feeds the live Visitors admin page) ---- */
  var trackId = (function () {
    var k = "providence_vid";
    var id = localStorage.getItem(k);
    if (!id) {
      id = window.crypto && crypto.randomUUID ? crypto.randomUUID() :
        "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
          var r = (Math.random() * 16) | 0, v = c === "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });
      localStorage.setItem(k, id);
    }
    return id;
  })();

  function track(type, extra) {
    var body = Object.assign({ uuid: trackId, type: type, url: location.pathname }, extra || {});
    var payload = JSON.stringify(body);
    var url = apiBase + "track.php";
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([payload], { type: "application/json" }));
    } else {
      fetch(url, { method: "POST", body: payload, keepalive: true });
    }
  }

  // Label a clicked element for the admin feed: prefer the nearest link/button.
  function clickLabel(el) {
    var target = el.closest("a, button, [role=button], input[type=submit]") || el;
    var text = (target.getAttribute("aria-label") || target.textContent || target.value || "").trim().replace(/\s+/g, " ");
    return (target.tagName + (text ? ": " + text.slice(0, 60) : "")).slice(0, 255);
  }

  track("pageview", { title: document.title, referrer: document.referrer });

  document.addEventListener("click", function (e) {
    track("click", {
      label: clickLabel(e.target),
      x: Math.round((e.clientX / window.innerWidth) * 100),
      y: Math.round((e.clientY / window.innerHeight) * 100),
    });
  });

  setInterval(function () {
    if (document.visibilityState === "visible") track("ping");
  }, 20000);
})();
