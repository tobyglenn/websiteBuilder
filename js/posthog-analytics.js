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

  const queuedEvents = window.__TOFT_ANALYTICS_QUEUE__ || [];
  window.__TOFT_ANALYTICS_QUEUE__ = [];
  queuedEvents.forEach(([eventName, properties]) => {
    window.toftAnalytics.capture(eventName, properties);
  });

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
        content_position: target.getAttribute("data-analytics-position") || "",
        destination,
        destination_url: destinationUrl,
      });
      return;
    }

    const currentContentType = contentTypeFromPath(window.location.pathname);
    const isPodcastAudio = currentContentType === "podcast"
      && parsedUrl
      && /\.(?:mp3|m4a|wav)(?:$|\?)/i.test(`${parsedUrl.pathname}${parsedUrl.search}`);
    if (isPodcastAudio) {
      window.toftAnalytics.capture("podcast_audio_click", {
        cta_label: label,
        content_type: "podcast",
        content_slug: normalizedPath(window.location.pathname),
        destination: "podcast_audio",
        audio_host: parsedUrl.hostname,
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

  let homepageSectionObserver = null;
  let homepageSectionStates = new Map();
  let homepageSectionStartedAt = Date.now();
  let homepageSectionSummaryTimer = null;
  let homepageSectionSummarySignature = "";

  const homepageSectionProperties = (section) => ({
    homepage_section_id: section.dataset.homepageSection || "",
    homepage_section_title: cleanText(section.dataset.homepageTitle || "", 100),
    homepage_section_purpose: section.dataset.homepagePurpose || "",
    homepage_section_position: Number(section.dataset.homepagePosition || 0),
    homepage_total_sections: document.querySelectorAll("[data-homepage-section]").length,
  });

  const clearHomepageSectionTimers = (state) => {
    window.clearTimeout(state.viewTimer);
    window.clearTimeout(state.engagementTimer);
    state.viewTimer = null;
    state.engagementTimer = null;
  };

  const captureHomepageSectionEngagement = (section, state) => {
    if (state.engaged || !state.viewed) return;
    const currentVisibleMs = state.visibleSince ? performance.now() - state.visibleSince : 0;
    const visibleMs = state.visibleMs + currentVisibleMs;
    if (visibleMs < 5000) return;
    state.engaged = true;
    window.toftAnalytics.capture("homepage_section_engaged", {
      ...homepageSectionProperties(section),
      visible_seconds: Math.round(visibleMs / 1000),
      time_to_engagement_ms: Date.now() - homepageSectionStartedAt,
    });
    scheduleHomepageSectionSummary("section_engaged");
  };

  const setupHomepageSectionTracking = () => {
    if (homepageSectionObserver) homepageSectionObserver.disconnect();
    homepageSectionStates.forEach(clearHomepageSectionTimers);
    homepageSectionStates = new Map();
    homepageSectionStartedAt = Date.now();
    window.clearTimeout(homepageSectionSummaryTimer);
    homepageSectionSummaryTimer = null;
    homepageSectionSummarySignature = "";

    if (window.location.pathname !== "/" || !("IntersectionObserver" in window)) return;

    const sections = [...document.querySelectorAll("[data-homepage-section]")];
    sections.forEach((section, index) => {
      section.dataset.homepagePosition = String(index + 1);
      homepageSectionStates.set(section, {
        viewed: false,
        engaged: false,
        visibleSince: 0,
        visibleMs: 0,
        viewTimer: null,
        engagementTimer: null,
      });
    });

    homepageSectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const section = entry.target;
        const state = homepageSectionStates.get(section);
        if (!state) return;

        if (entry.isIntersecting) {
          if (!state.visibleSince) state.visibleSince = performance.now();
          if (!state.viewed && !state.viewTimer) {
            state.viewTimer = window.setTimeout(() => {
              state.viewTimer = null;
              if (!state.visibleSince || state.viewed) return;
              state.viewed = true;
              window.toftAnalytics.capture("homepage_section_viewed", {
                ...homepageSectionProperties(section),
                time_to_view_ms: Date.now() - homepageSectionStartedAt,
                scroll_percent_at_view: maximumScrollPercent,
              });
              scheduleHomepageSectionSummary("section_viewed");
            }, 800);
          }
          if (!state.engaged && !state.engagementTimer) {
            state.engagementTimer = window.setTimeout(() => {
              state.engagementTimer = null;
              captureHomepageSectionEngagement(section, state);
            }, Math.max(0, 5000 - state.visibleMs));
          }
          return;
        }

        if (state.visibleSince) {
          state.visibleMs += performance.now() - state.visibleSince;
          state.visibleSince = 0;
        }
        clearHomepageSectionTimers(state);
        captureHomepageSectionEngagement(section, state);
      });
    }, { rootMargin: "-15% 0px -15% 0px", threshold: 0.01 });

    sections.forEach((section) => homepageSectionObserver.observe(section));
  };

  const captureHomepageSectionClick = (target) => {
    if (window.location.pathname !== "/") return;
    const section = target.closest("[data-homepage-section]");
    if (!section) return;
    const interactiveElements = [...section.querySelectorAll("a, button")];
    const href = target.getAttribute("href") || "";
    const parsedUrl = toUrl(href);
    window.toftAnalytics.capture("homepage_section_click", {
      ...homepageSectionProperties(section),
      element_label: cleanText(target.getAttribute("aria-label") || target.textContent, 100),
      element_position: Math.max(1, interactiveElements.indexOf(target) + 1),
      destination: destinationType(href),
      destination_url: parsedUrl && href ? parsedUrl.href : "",
      time_to_click_ms: Date.now() - homepageSectionStartedAt,
    });
    scheduleHomepageSectionSummary("section_click");
  };

  const captureHomepageSectionSummary = (reason = "checkpoint") => {
    if (window.location.pathname !== "/" || homepageSectionStates.size === 0) return;
    const viewedSections = [...homepageSectionStates.entries()]
      .filter(([, state]) => state.viewed)
      .map(([section]) => homepageSectionProperties(section));
    const deepestSection = viewedSections.reduce((deepest, section) => (
      section.homepage_section_position > (deepest?.homepage_section_position || 0) ? section : deepest
    ), null);
    const engagedSections = [...homepageSectionStates.values()].filter((state) => state.engaged).length;
    const signature = [
      viewedSections.length,
      deepestSection?.homepage_section_position || 0,
      engagedSections,
      Math.floor(maximumScrollPercent / 10),
      Math.floor(activeSeconds / 10),
    ].join(":");
    if (signature === homepageSectionSummarySignature) return;
    homepageSectionSummarySignature = signature;
    window.toftAnalytics.capture("homepage_sections_summary", {
      homepage_sections_viewed: viewedSections.length,
      homepage_total_sections: homepageSectionStates.size,
      homepage_deepest_section_id: deepestSection?.homepage_section_id || "",
      homepage_deepest_section_position: deepestSection?.homepage_section_position || 0,
      homepage_engaged_sections: engagedSections,
      maximum_scroll_percent: maximumScrollPercent,
      active_seconds: activeSeconds,
      summary_reason: reason,
    });
  };

  const scheduleHomepageSectionSummary = (reason) => {
    window.clearTimeout(homepageSectionSummaryTimer);
    homepageSectionSummaryTimer = window.setTimeout(() => {
      homepageSectionSummaryTimer = null;
      captureHomepageSectionSummary(reason);
    }, 250);
  };

  capturePageview();
  document.addEventListener("astro:page-load", capturePageview);
  setupHomepageSectionTracking();
  document.addEventListener("astro:page-load", setupHomepageSectionTracking);
  document.addEventListener("astro:before-swap", captureHomepageSectionSummary);
  window.addEventListener("pagehide", captureHomepageSectionSummary);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") captureHomepageSectionSummary();
  });
  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const target = event.target.closest("a, button");
    if (!target) return;
    captureHomepageSectionClick(target);
    const href = target.getAttribute("href") || "";
    if (target instanceof HTMLAnchorElement && href && !href.startsWith("#")) {
      captureHomepageSectionSummary();
    }
    captureClick(target);
  });

  let contentNextStepObserver = null;
  const contentNextStepViewed = new WeakSet();
  const contentNextStepTimers = new WeakMap();
  const setupContentNextStepTracking = () => {
    if (contentNextStepObserver) contentNextStepObserver.disconnect();
    document.querySelectorAll("[data-content-next-step]").forEach((element) => {
      window.clearTimeout(contentNextStepTimers.get(element));
    });
    if (!("IntersectionObserver" in window)) return;

    contentNextStepObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const element = entry.target;
        if (contentNextStepViewed.has(element)) return;
        if (!entry.isIntersecting || entry.intersectionRatio < 0.25) {
          window.clearTimeout(contentNextStepTimers.get(element));
          contentNextStepTimers.delete(element);
          return;
        }
        if (contentNextStepTimers.has(element)) return;
        const timer = window.setTimeout(() => {
          contentNextStepTimers.delete(element);
          if (contentNextStepViewed.has(element)) return;
          contentNextStepViewed.add(element);
          window.toftAnalytics.capture("content_next_step_viewed", {
            content_type: element.getAttribute("data-analytics-content-type") || "",
            content_slug: element.getAttribute("data-analytics-content-slug") || normalizedPath(window.location.pathname),
            content_title: cleanText(element.getAttribute("data-analytics-content-title") || "", 100),
            content_position: element.getAttribute("data-analytics-position") || "",
          });
        }, 800);
        contentNextStepTimers.set(element, timer);
      });
    }, { threshold: [0.25] });

    document.querySelectorAll("[data-content-next-step]").forEach((element) => contentNextStepObserver.observe(element));
  };

  setupContentNextStepTracking();
  document.addEventListener("astro:page-load", setupContentNextStepTracking);

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
  const initializeYoutubePlayer = (iframe) => {
    if (!(iframe instanceof HTMLIFrameElement) || youtubePlayers.has(iframe)) return;
    const captureEmbedLoaded = () => {
      if (iframe.dataset.analyticsEmbedLoaded) return;
      iframe.dataset.analyticsEmbedLoaded = "true";
      captureVideoEvent("video_embed_loaded", iframe);
    };
    iframe.addEventListener("load", captureEmbedLoaded, { once: true });
    if (!addYoutubeApiParams(iframe)) return;
    youtubePlayers.set(iframe, true);

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

  const youtubeObservedIframes = new WeakSet();
  const youtubeViewTimers = new WeakMap();
  const youtubeInitObserver = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          initializeYoutubePlayer(entry.target);
          youtubeInitObserver.unobserve(entry.target);
        });
      }, { rootMargin: "400px 0px", threshold: 0.01 })
    : null;
  const youtubeViewObserver = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const iframe = entry.target;
          if (iframe.dataset.analyticsEmbedViewed) return;
          if (!entry.isIntersecting || entry.intersectionRatio < 0.5) {
            window.clearTimeout(youtubeViewTimers.get(iframe));
            youtubeViewTimers.delete(iframe);
            return;
          }
          if (youtubeViewTimers.has(iframe)) return;
          const timer = window.setTimeout(() => {
            youtubeViewTimers.delete(iframe);
            if (iframe.dataset.analyticsEmbedViewed) return;
            iframe.dataset.analyticsEmbedViewed = "true";
            captureVideoEvent("video_embed_viewed", iframe);
            youtubeViewObserver.unobserve(iframe);
          }, 1000);
          youtubeViewTimers.set(iframe, timer);
        });
      }, { threshold: [0.5] })
    : null;

  const setupYoutubeIframe = (iframe) => {
    if (!(iframe instanceof HTMLIFrameElement) || youtubeObservedIframes.has(iframe)) return;
    if (!youtubeIdFromSrc(iframe.src)) return;
    youtubeObservedIframes.add(iframe);
    if (!youtubeInitObserver || !youtubeViewObserver) {
      initializeYoutubePlayer(iframe);
      return;
    }
    youtubeInitObserver.observe(iframe);
    youtubeViewObserver.observe(iframe);
  };
  const setupYoutubeIframes = () => {
    document.querySelectorAll('iframe[src*="youtube.com/embed/"]').forEach(setupYoutubeIframe);
  };

  setupYoutubeIframes();
  document.addEventListener("astro:page-load", setupYoutubeIframes);
  new MutationObserver(setupYoutubeIframes).observe(document.documentElement, { childList: true, subtree: true });

  const podcastAudioElements = new WeakSet();
  const podcastAudioMilestones = new WeakMap();
  const capturePodcastAudioEvent = (eventName, audio, extra = {}) => {
    const parsed = toUrl(audio.currentSrc || audio.src);
    window.toftAnalytics.capture(eventName, {
      content_type: "podcast",
      content_slug: normalizedPath(window.location.pathname),
      audio_host: parsed ? parsed.hostname : "",
      ...extra,
    });
  };
  const setupPodcastAudio = (audio) => {
    if (!(audio instanceof HTMLAudioElement) || podcastAudioElements.has(audio)) return;
    if (contentTypeFromPath(window.location.pathname) !== "podcast") return;
    podcastAudioElements.add(audio);
    podcastAudioMilestones.set(audio, new Set());

    audio.addEventListener("play", () => {
      const eventName = audio.dataset.analyticsPlayed ? "podcast_audio_resume" : "podcast_audio_play";
      audio.dataset.analyticsPlayed = "true";
      capturePodcastAudioEvent(eventName, audio);
    });
    audio.addEventListener("pause", () => {
      if (!audio.ended && audio.currentTime > 0) {
        capturePodcastAudioEvent("podcast_audio_pause", audio, {
          progress_percent: audio.duration ? Math.round((audio.currentTime / audio.duration) * 100) : 0,
        });
      }
    });
    audio.addEventListener("timeupdate", () => {
      if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
      const progress = (audio.currentTime / audio.duration) * 100;
      const seen = podcastAudioMilestones.get(audio) || new Set();
      [25, 50, 75].forEach((milestone) => {
        if (progress >= milestone && !seen.has(milestone)) {
          seen.add(milestone);
          capturePodcastAudioEvent("podcast_audio_progress", audio, { progress_percent: milestone });
        }
      });
      podcastAudioMilestones.set(audio, seen);
    });
    audio.addEventListener("ended", () => {
      capturePodcastAudioEvent("podcast_audio_complete", audio, { progress_percent: 100 });
    });
    audio.addEventListener("error", () => capturePodcastAudioEvent("podcast_audio_error", audio));
  };
  const setupPodcastAudioElements = () => {
    document.querySelectorAll("audio").forEach(setupPodcastAudio);
  };

  setupPodcastAudioElements();
  document.addEventListener("astro:page-load", setupPodcastAudioElements);
  new MutationObserver(setupPodcastAudioElements).observe(document.documentElement, { childList: true, subtree: true });
})();
