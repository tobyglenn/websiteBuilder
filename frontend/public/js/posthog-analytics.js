(function () {
  const config = window.__TOFT_POSTHOG_CONFIG__;
  if (!config || !config.key || window.__TOFT_POSTHOG_READY__) return;
  window.__TOFT_POSTHOG_READY__ = true;

  !(function (documentRef, posthogRef) {
    let methodNames;
    let index;
    let script;
    let firstScript;
    if (posthogRef.__SV) return;
    window.posthog = posthogRef;
    posthogRef._i = [];
    posthogRef.init = function (key, options, name) {
      function stub(target, methodName) {
        const parts = methodName.split(".");
        if (parts.length === 2) {
          target = target[parts[0]];
          methodName = parts[1];
        }
        target[methodName] = function () {
          target.push([methodName].concat(Array.prototype.slice.call(arguments, 0)));
        };
      }

      script = documentRef.createElement("script");
      script.type = "text/javascript";
      script.crossOrigin = "anonymous";
      script.async = true;
      script.src = options.api_host.replace(".i.posthog.com", "-assets.i.posthog.com") + "/static/array.js";
      firstScript = documentRef.getElementsByTagName("script")[0];
      firstScript.parentNode.insertBefore(script, firstScript);

      let instance = posthogRef;
      if (name !== undefined) {
        instance = posthogRef[name] = [];
      } else {
        name = "posthog";
      }
      instance.people = instance.people || [];
      instance.toString = function (includePeople) {
        let label = "posthog";
        if (name !== "posthog") label += "." + name;
        if (!includePeople) label += " (stub)";
        return label;
      };
      instance.people.toString = function () {
        return instance.toString(1) + ".people (stub)";
      };
      methodNames =
        "capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group identifyGroup get_group_property captureException startSessionRecording stopSessionRecording".split(
          " ",
        );
      for (index = 0; index < methodNames.length; index += 1) stub(instance, methodNames[index]);
      posthogRef._i.push([key, options, name]);
    };
    posthogRef.__SV = 1;
  })(document, window.posthog || []);

  const cleanText = (value) => String(value || "").replace(/\s+/g, " ").trim().slice(0, 120);
  const pageProps = () => ({
    page_path: window.location.pathname,
    page_title: document.title,
    language: document.documentElement.lang || "en",
  });
  const toUrl = (url) => {
    try {
      return new URL(url || "/", window.location.href);
    } catch {
      return null;
    }
  };
  const destinationType = (url) => {
    if (!url) return "unknown";
    if (url.startsWith("mailto:")) return "email";
    if (url.startsWith("tel:")) return "phone";
    const parsed = toUrl(url);
    if (!parsed) return "unknown";
    if (parsed.hostname.includes("spotify")) return "spotify";
    if (parsed.hostname.includes("podcasts.apple")) return "apple_podcasts";
    if (parsed.hostname.includes("iheart")) return "iheart";
    if (parsed.hostname.includes("music.amazon")) return "amazon_music";
    if (parsed.hostname.includes("youtube")) return "youtube";
    if (parsed.hostname.includes("overcast")) return "overcast";
    if (parsed.hostname.includes("pocketcasts")) return "pocket_casts";
    if (parsed.pathname.endsWith(".xml") || parsed.pathname.includes("/feed")) return "rss";
    if (parsed.hostname !== window.location.hostname) return "external";
    return "internal";
  };

  posthog.init(config.key, {
    api_host: config.host || "https://us.i.posthog.com",
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: true,
    disable_session_recording: true,
    persistence: "localStorage+cookie",
    mask_all_text: true,
    mask_all_element_attributes: true,
    loaded: function (posthog) {
      posthog.register({ site: "tobyonfitnesstech" });
    },
  });

  window.toftAnalytics = {
    capture: function (eventName, properties) {
      if (!window.posthog || !eventName) return;
      window.posthog.capture(eventName, {
        ...pageProps(),
        ...(properties || {}),
      });
    },
  };

  let lastPageviewKey = "";
  const capturePageview = () => {
    const pageviewKey = `${window.location.pathname}${window.location.search}`;
    if (pageviewKey === lastPageviewKey) return;
    lastPageviewKey = pageviewKey;
    window.toftAnalytics.capture("$pageview", {
      referrer_path: document.referrer || "",
    });
  };

  const captureClick = (target) => {
    const href = target.getAttribute("href") || "";
    const label = cleanText(target.getAttribute("aria-label") || target.textContent);
    const destination = destinationType(href);
    const parsedUrl = toUrl(href);
    const destinationUrl = parsedUrl && href ? parsedUrl.href : "";
    const properties = {
      cta_label: label,
      destination,
      destination_url: destinationUrl,
    };

    if (href.startsWith("mailto:") || href.includes("/contact/") || /contact|email|collab/i.test(label)) {
      window.toftAnalytics.capture("contact_intent", properties);
      return;
    }

    if (["spotify", "apple_podcasts", "iheart", "amazon_music", "overcast", "pocket_casts", "rss"].includes(destination)) {
      window.toftAnalytics.capture("podcast_subscribe_click", properties);
      return;
    }

    if (destination === "external") {
      const isAffiliate = /amazon|speediance|tonal|whoop|garmin|affiliate|partner/i.test(href + " " + label);
      window.toftAnalytics.capture(isAffiliate ? "affiliate_click" : "outbound_click", properties);
      return;
    }

    if (parsedUrl && /^\/(?:video|blog|podcasts|gear|calculators)\//.test(parsedUrl.pathname)) {
      window.toftAnalytics.capture("content_card_click", {
        ...properties,
        content_slug: parsedUrl.pathname,
      });
      return;
    }

    if (/start here|watch|subscribe|listen|show notes|transcript|calculate|open feed/i.test(label)) {
      window.toftAnalytics.capture("cta_click", properties);
    }
  };

  capturePageview();
  document.addEventListener("astro:page-load", capturePageview);
  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const target = event.target.closest("a, button");
    if (!target) return;
    captureClick(target);
  });
})();
