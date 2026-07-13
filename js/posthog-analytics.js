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

  const cleanText = (value, maxLength = 120) => String(value || "").replace(/\s+/g, " ").trim().slice(0, maxLength);
  const supportedLocales = new Set(["de", "es", "hi", "pt"]);
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
  const normalizedPath = (pathname) => {
    const parts = String(pathname || "/").split("/").filter(Boolean);
    if (parts.length > 0 && supportedLocales.has(parts[0])) {
      return `/${parts.slice(1).join("/")}${pathname.endsWith("/") ? "/" : ""}` || "/";
    }
    return pathname || "/";
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
    if (parsed.hostname.includes("music.amazon") || parsed.hostname.includes("music.amazon.")) return "amazon_music";
    if (parsed.hostname.includes("youtube")) return "youtube";
    if (parsed.hostname.includes("overcast")) return "overcast";
    if (parsed.hostname.includes("pocketcasts")) return "pocket_casts";
    if (parsed.hostname.includes("jiosaavn")) return "jiosaavn";
    if (parsed.pathname.endsWith(".xml") || parsed.pathname.includes("/feed")) return "rss";
    if (parsed.hostname !== window.location.hostname) return "external";
    return "internal";
  };
  const contentTypeFromPath = (pathname) => {
    const path = normalizedPath(pathname);
    if (/^\/video\//.test(path)) return "video";
    if (/^\/blog(?:\/|$)/.test(path)) return "blog";
    if (/^\/podcasts(?:\/|$)/.test(path)) return "podcast";
    if (/^\/gear(?:\/|$)/.test(path)) return "gear";
    if (/^\/calculators(?:\/|$)/.test(path)) return "calculator";
    return "";
  };
  const youtubeIdFromSrc = (src) => {
    const parsed = toUrl(src);
    if (!parsed || !parsed.hostname.includes("youtube")) return "";
    const embedMatch = parsed.pathname.match(/\/embed\/([^/?#]+)/);
    if (embedMatch) return embedMatch[1];
    return parsed.searchParams.get("v") || "";
  };

  posthog.init(config.key, {
    api_host: config.host || "https://us.i.posthog.com",
    autocapture: true,
    capture_pageview: false,
    capture_pageleave: true,
    capture_exceptions: true,
    capture_performance: true,
    disable_session_recording: false,
    person_profiles: "identified_only",
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

  let activeSeconds = 0;
  let maximumScrollPercent = 0;
  let qualifiedEngagementCaptured = false;
  let scrollMilestonesCaptured = new Set();
  let currentEngagementPath = window.location.pathname;

  const resetEngagementState = () => {
    activeSeconds = 0;
    maximumScrollPercent = 0;
    qualifiedEngagementCaptured = false;
    scrollMilestonesCaptured = new Set();
    currentEngagementPath = window.location.pathname;
  };

  const updateScrollDepth = () => {
    if (currentEngagementPath !== window.location.pathname) resetEngagementState();
    const scrollableHeight = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const percent = Math.min(100, Math.round((window.scrollY / scrollableHeight) * 100));
    maximumScrollPercent = Math.max(maximumScrollPercent, percent);

    [25, 50, 75, 90].forEach((milestone) => {
      if (maximumScrollPercent >= milestone && !scrollMilestonesCaptured.has(milestone)) {
        scrollMilestonesCaptured.add(milestone);
        window.toftAnalytics.capture("content_scroll_depth", {
          scroll_percent: milestone,
          active_seconds: activeSeconds,
          content_type: contentTypeFromPath(window.location.pathname) || "page",
        });
      }
    });
  };

  const evaluateQualifiedEngagement = () => {
    if (qualifiedEngagementCaptured || activeSeconds < 30 || maximumScrollPercent < 50) return;
    qualifiedEngagementCaptured = true;
    window.toftAnalytics.capture("qualified_engagement", {
      active_seconds: activeSeconds,
      maximum_scroll_percent: maximumScrollPercent,
      content_type: contentTypeFromPath(window.location.pathname) || "page",
    });
  };

  window.addEventListener("scroll", updateScrollDepth, { passive: true });
  window.addEventListener("resize", updateScrollDepth, { passive: true });
  document.addEventListener("astro:page-load", () => {
    resetEngagementState();
    updateScrollDepth();
  });
  updateScrollDepth();
  window.setInterval(() => {
    if (document.visibilityState !== "visible") return;
    activeSeconds += 1;
    evaluateQualifiedEngagement();
  }, 1000);

  const failedResources = new Set();
  window.addEventListener("error", (event) => {
    const resource = event.target;
    if (!(resource instanceof HTMLImageElement || resource instanceof HTMLScriptElement || resource instanceof HTMLLinkElement)) return;
    const resourceUrl = resource.currentSrc || resource.src || resource.href || "";
    if (!resourceUrl || failedResources.has(resourceUrl)) return;
    failedResources.add(resourceUrl);
    window.toftAnalytics.capture("frontend_resource_error", {
      resource_type: resource.tagName.toLowerCase(),
      resource_url: resourceUrl,
    });
  }, true);

  if ("PerformanceObserver" in window) {
    try {
      let longTaskCaptured = false;
      const observer = new PerformanceObserver((list) => {
        if (longTaskCaptured) return;
        const longestTask = list.getEntries().reduce((longest, entry) => Math.max(longest, entry.duration), 0);
        if (longestTask < 100) return;
        longTaskCaptured = true;
        window.toftAnalytics.capture("frontend_long_task", {
          duration_ms: Math.round(longestTask),
        });
      });
      observer.observe({ type: "longtask", buffered: true });
    } catch {
      // Long-task observation is not supported in every browser.
    }
  }

  const captureClick = (target) => {
    const href = target.getAttribute("href") || "";
    const label = cleanText(target.getAttribute("aria-label") || target.textContent);
    const destination = destinationType(href);
    const parsedUrl = toUrl(href);
    const destinationUrl = parsedUrl && href ? parsedUrl.href : "";
    const explicitEvent = target.getAttribute("data-analytics-event");
    if (explicitEvent) {
      window.toftAnalytics.capture(explicitEvent, {
        cta_label: label,
        content_type: target.getAttribute("data-analytics-content-type") || "",
        content_slug: target.getAttribute("data-analytics-content-slug") || (parsedUrl ? normalizedPath(parsedUrl.pathname) : ""),
        content_title: cleanText(target.getAttribute("data-analytics-content-title") || "", 100),
        destination,
        destination_url: destinationUrl,
      });
      return;
    }

    const properties = {
      cta_label: label,
      destination,
      destination_url: destinationUrl,
    };

    if (href.startsWith("mailto:") || href.includes("/contact/") || /contact|email|collab/i.test(label)) {
      window.toftAnalytics.capture("contact_intent", properties);
      return;
    }

    if (["spotify", "apple_podcasts", "iheart", "amazon_music", "overcast", "pocket_casts", "jiosaavn", "rss"].includes(destination)) {
      window.toftAnalytics.capture("podcast_subscribe_click", properties);
      return;
    }

    if (destination === "external") {
      const isAffiliate = /amazon|speediance|tonal|whoop|garmin|affiliate|partner/i.test(href + " " + label);
      window.toftAnalytics.capture(isAffiliate ? "affiliate_click" : "outbound_click", properties);
      return;
    }

    const contentType = parsedUrl ? contentTypeFromPath(parsedUrl.pathname) : "";
    if (parsedUrl && contentType) {
      window.toftAnalytics.capture("content_card_click", {
        ...properties,
        content_type: contentType,
        content_slug: normalizedPath(parsedUrl.pathname),
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

  let youtubeApiPromise = null;
  const youtubePlayers = new WeakMap();
  const youtubeMilestones = new WeakMap();
  const ensureYoutubeApi = () => {
    if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
    if (youtubeApiPromise) return youtubeApiPromise;

    youtubeApiPromise = new Promise((resolve) => {
      const previousReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () {
        if (typeof previousReady === "function") previousReady();
        resolve(window.YT);
      };
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      document.head.appendChild(script);
    });

    return youtubeApiPromise;
  };
  const captureVideoEvent = (eventName, iframe, extra = {}) => {
    const videoId = iframe.getAttribute("data-analytics-video-id") || youtubeIdFromSrc(iframe.src);
    if (!videoId) return;
    window.toftAnalytics.capture(eventName, {
      video_id: videoId,
      video_title: cleanText(iframe.getAttribute("title") || "", 100),
      player_location: iframe.closest("[data-video-location]")?.getAttribute("data-video-location") || "embedded",
      ...extra,
    });
  };
  const addYoutubeApiParams = (iframe) => {
    const parsed = toUrl(iframe.src);
    if (!parsed || !parsed.hostname.includes("youtube")) return false;
    let changed = false;
    if (parsed.searchParams.get("enablejsapi") !== "1") {
      parsed.searchParams.set("enablejsapi", "1");
      changed = true;
    }
    if (!parsed.searchParams.get("origin")) {
      parsed.searchParams.set("origin", window.location.origin);
      changed = true;
    }
    if (changed) iframe.src = parsed.href;
    return true;
  };
  const trackYoutubeProgress = (player, iframe) => {
    const duration = Number(player.getDuration && player.getDuration());
    const currentTime = Number(player.getCurrentTime && player.getCurrentTime());
    if (!Number.isFinite(duration) || duration <= 0 || !Number.isFinite(currentTime)) return;

    const seen = youtubeMilestones.get(iframe) || new Set();
    [25, 50, 75].forEach((milestone) => {
      if (!seen.has(milestone) && currentTime / duration >= milestone / 100) {
        seen.add(milestone);
        captureVideoEvent("video_progress", iframe, { progress_percent: milestone });
      }
    });
    youtubeMilestones.set(iframe, seen);
  };
  const setupYoutubeIframe = (iframe) => {
    if (!(iframe instanceof HTMLIFrameElement) || youtubePlayers.has(iframe)) return;
    if (!addYoutubeApiParams(iframe)) return;
    youtubePlayers.set(iframe, true);
    const captureEmbedLoaded = () => {
      if (iframe.dataset.analyticsEmbedLoaded) return;
      iframe.dataset.analyticsEmbedLoaded = "true";
      captureVideoEvent("video_embed_loaded", iframe);
    };
    captureEmbedLoaded();
    iframe.addEventListener("load", captureEmbedLoaded, { once: true });

    ensureYoutubeApi().then((YT) => {
      let progressTimer = null;
      const player = new YT.Player(iframe, {
        events: {
          onStateChange: function (event) {
            if (event.data === YT.PlayerState.PLAYING) {
              captureVideoEvent(iframe.dataset.analyticsPlayed ? "video_resume" : "video_play", iframe);
              iframe.dataset.analyticsPlayed = "true";
              clearInterval(progressTimer);
              progressTimer = setInterval(() => trackYoutubeProgress(player, iframe), 5000);
            }
            if (event.data === YT.PlayerState.PAUSED) {
              clearInterval(progressTimer);
              trackYoutubeProgress(player, iframe);
              captureVideoEvent("video_pause", iframe);
            }
            if (event.data === YT.PlayerState.ENDED) {
              clearInterval(progressTimer);
              captureVideoEvent("video_complete", iframe, { progress_percent: 100 });
            }
          },
        },
      });
    });
  };
  const setupYoutubeIframes = () => {
    document.querySelectorAll('iframe[src*="youtube.com/embed/"]').forEach(setupYoutubeIframe);
  };

  setupYoutubeIframes();
  document.addEventListener("astro:page-load", setupYoutubeIframes);
  new MutationObserver(setupYoutubeIframes).observe(document.documentElement, { childList: true, subtree: true });
})();
