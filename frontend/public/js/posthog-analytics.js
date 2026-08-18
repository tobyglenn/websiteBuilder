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
  const journeyAttributionKeys = {
    homepage: "toft_homepage_attribution",
    navigation: "toft_navigation_attribution",
  };
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
  const createAnalyticsId = () => (
    window.crypto?.randomUUID?.()
    || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  );
  const storeJourneyAttribution = (kind, parsedUrl, properties) => {
    const storageKey = journeyAttributionKeys[kind];
    if (!storageKey || !parsedUrl || parsedUrl.origin !== window.location.origin) return;
    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify({
        ...properties,
        destination_path: parsedUrl.pathname,
        clicked_at_ms: Date.now(),
      }));
    } catch {
      // Session storage can be unavailable in strict privacy modes.
    }
  };
  const capturePendingJourneyAttributions = () => {
    Object.entries(journeyAttributionKeys).forEach(([kind, storageKey]) => {
      try {
        const raw = window.sessionStorage.getItem(storageKey);
        if (!raw) return;
        const attribution = JSON.parse(raw);
        const ageMs = Date.now() - Number(attribution.clicked_at_ms || 0);
        const reachedDestination = normalizedPath(attribution.destination_path)
          === normalizedPath(window.location.pathname);
        if (ageMs < 0 || ageMs > 300000 || !reachedDestination) {
          if (ageMs > 300000) window.sessionStorage.removeItem(storageKey);
          return;
        }
        window.sessionStorage.removeItem(storageKey);
        window.toftAnalytics.capture(`${kind}_destination_reached`, {
          ...attribution,
          reach_time_ms: ageMs,
        });
      } catch {
        try {
          window.sessionStorage.removeItem(storageKey);
        } catch {
          // Ignore storage errors in strict privacy modes.
        }
      }
    });
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
    if (/^\/(?:projects|games)(?:\/|$)/.test(path)) return "project";
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
    capturePendingJourneyAttributions();
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
      const explicitProperties = {
        cta_label: label,
        content_type: target.getAttribute("data-analytics-content-type") || "",
        content_slug: target.getAttribute("data-analytics-content-slug") || (parsedUrl ? normalizedPath(parsedUrl.pathname) : ""),
        content_title: cleanText(target.getAttribute("data-analytics-content-title") || "", 100),
        content_position: target.getAttribute("data-analytics-position") || "",
        next_step_topic: target.getAttribute("data-analytics-topic") || "",
        next_step_item_position: Number(target.getAttribute("data-analytics-item-position") || 0),
        destination,
        destination_url: destinationUrl,
        navigation_surface: target.getAttribute("data-navigation-surface") || "",
        navigation_group: target.getAttribute("data-navigation-group") || "",
        navigation_item_label: cleanText(target.getAttribute("data-navigation-label") || label, 100),
        navigation_item_position: Number(target.getAttribute("data-navigation-position") || 0),
        navigation_is_current: target.getAttribute("data-navigation-current") === "true",
        navigation_schema_version: target.getAttribute("data-navigation-version") || "",
        navigation_test_id: target.getAttribute("data-navigation-test-id") || "",
        navigation_test_variant: target.getAttribute("data-navigation-test-variant") || "",
      };
      window.toftAnalytics.capture(explicitEvent, explicitProperties);
      if (explicitEvent === "navigation_click") {
        storeJourneyAttribution("navigation", parsedUrl, {
          source_path: window.location.pathname,
          ...explicitProperties,
        });
      }
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
  let homepageItemObserver = null;
  let homepageItemViewed = new WeakSet();
  let homepageItemVisible = new WeakSet();
  let homepageItemTimers = new Map();
  let homepageVisitId = "";
  let homepageLayoutVersion = "unversioned";

  const homepageSectionProperties = (section) => ({
    homepage_section_id: section.dataset.homepageSection || "",
    homepage_section_title: cleanText(section.dataset.homepageTitle || "", 100),
    homepage_section_purpose: section.dataset.homepagePurpose || "",
    homepage_section_position: Number(section.dataset.homepagePosition || 0),
    homepage_total_sections: document.querySelectorAll("[data-homepage-section]").length,
    homepage_layout_version: homepageLayoutVersion,
    homepage_test_id: section.dataset.homepageTestId || "",
    homepage_test_variant: section.dataset.homepageTestVariant || "",
    homepage_visit_id: homepageVisitId,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
  });

  const homepageElementProperties = (section, target) => {
    const interactiveElements = [...section.querySelectorAll("a, button")];
    const href = target.getAttribute("href") || "";
    const parsedUrl = toUrl(href);
    const elementLabel = cleanText(target.getAttribute("aria-label") || target.textContent, 100);
    return {
      ...homepageSectionProperties(section),
      element_label: elementLabel,
      element_position: Math.max(1, interactiveElements.indexOf(target) + 1),
      content_item_position: Number(target.getAttribute("data-analytics-item-position") || 0),
      element_type: target.tagName.toLowerCase(),
      content_type: target.getAttribute("data-analytics-content-type")
        || (parsedUrl ? contentTypeFromPath(parsedUrl.pathname) : ""),
      content_slug: target.getAttribute("data-analytics-content-slug")
        || (parsedUrl ? normalizedPath(parsedUrl.pathname) : ""),
      content_title: cleanText(target.getAttribute("data-analytics-content-title") || elementLabel, 100),
      destination: destinationType(href),
      destination_url: parsedUrl && href ? parsedUrl.href : "",
    };
  };

  const homepageVisibleMs = (state) => (
    state.visibleMs + (state.visibleSince ? performance.now() - state.visibleSince : 0)
  );

  const clearHomepageSectionTimers = (state) => {
    window.clearTimeout(state.viewTimer);
    window.clearTimeout(state.engagementTimer);
    state.viewTimer = null;
    state.engagementTimer = null;
  };

  const captureHomepageSectionEngagement = (section, state) => {
    if (state.engaged || !state.viewed) return;
    const visibleMs = homepageVisibleMs(state);
    if (visibleMs < 5000) return;
    state.engaged = true;
    window.toftAnalytics.capture("homepage_section_engaged", {
      ...homepageSectionProperties(section),
      visible_seconds: Math.round(visibleMs / 1000),
      time_to_engagement_ms: Date.now() - homepageSectionStartedAt,
    });
    scheduleHomepageSectionSummary("section_engaged");
  };

  const resumeHomepageSectionVisibility = (section, state) => {
    if (document.visibilityState !== "visible" || !state.isIntersecting) return;
    if (!state.visibleSince) state.visibleSince = performance.now();
    if (!state.viewed && !state.viewTimer) {
      state.viewTimer = window.setTimeout(() => {
        state.viewTimer = null;
        if (!state.visibleSince || state.viewed || document.visibilityState !== "visible") return;
        state.viewed = true;
        state.firstViewMs = Date.now() - homepageSectionStartedAt;
        window.toftAnalytics.capture("homepage_section_viewed", {
          ...homepageSectionProperties(section),
          time_to_view_ms: state.firstViewMs,
          scroll_percent_at_view: maximumScrollPercent,
          maximum_intersection_ratio: Number(state.maxIntersectionRatio.toFixed(2)),
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
  };

  const pauseHomepageSectionVisibility = () => {
    const pausedAt = performance.now();
    homepageSectionStates.forEach((state, section) => {
      if (state.visibleSince) {
        state.visibleMs += pausedAt - state.visibleSince;
        state.visibleSince = 0;
      }
      clearHomepageSectionTimers(state);
      captureHomepageSectionEngagement(section, state);
    });
  };

  const setupHomepageItemTracking = (sections) => {
    if (homepageItemObserver) homepageItemObserver.disconnect();
    homepageItemTimers.forEach((timer) => window.clearTimeout(timer));
    homepageItemViewed = new WeakSet();
    homepageItemVisible = new WeakSet();
    homepageItemTimers = new Map();
    if (!("IntersectionObserver" in window)) return;

    homepageItemObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const element = entry.target;
        const section = element.closest("[data-homepage-section]");
        if (!section || homepageItemViewed.has(element)) return;
        if (!entry.isIntersecting || entry.intersectionRatio < 0.5) {
          homepageItemVisible.delete(element);
          window.clearTimeout(homepageItemTimers.get(element));
          homepageItemTimers.delete(element);
          return;
        }

        homepageItemVisible.add(element);
        if (homepageItemTimers.has(element)) return;
        const timer = window.setTimeout(() => {
          homepageItemTimers.delete(element);
          if (!homepageItemVisible.has(element) || homepageItemViewed.has(element)) return;
          homepageItemViewed.add(element);
          window.toftAnalytics.capture("homepage_item_viewed", {
            ...homepageElementProperties(section, element),
            minimum_intersection_ratio: 0.5,
            exposure_ms: 800,
          });
        }, 800);
        homepageItemTimers.set(element, timer);
      });
    }, { threshold: [0.5] });

    sections.forEach((section) => {
      section.querySelectorAll("a, button").forEach((element) => homepageItemObserver.observe(element));
    });
  };

  const setupHomepageSectionTracking = () => {
    if (homepageSectionObserver) homepageSectionObserver.disconnect();
    homepageSectionStates.forEach(clearHomepageSectionTimers);
    homepageSectionStates = new Map();
    homepageSectionStartedAt = Date.now();
    window.clearTimeout(homepageSectionSummaryTimer);
    homepageSectionSummaryTimer = null;
    homepageSectionSummarySignature = "";
    homepageVisitId = createAnalyticsId();
    homepageLayoutVersion = document.querySelector("[data-homepage-layout-version]")
      ?.getAttribute("data-homepage-layout-version") || "unversioned";

    if (window.location.pathname !== "/" || !("IntersectionObserver" in window)) return;

    const sections = [...document.querySelectorAll("[data-homepage-section]")];
    sections.forEach((section, index) => {
      section.dataset.homepagePosition = String(index + 1);
      homepageSectionStates.set(section, {
        viewed: false,
        engaged: false,
        isIntersecting: false,
        visibleSince: 0,
        visibleMs: 0,
        clicks: 0,
        firstViewMs: 0,
        maxIntersectionRatio: 0,
        summarySignature: "",
        viewTimer: null,
        engagementTimer: null,
      });
    });

    homepageSectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const section = entry.target;
        const state = homepageSectionStates.get(section);
        if (!state) return;
        state.isIntersecting = entry.isIntersecting;
        state.maxIntersectionRatio = Math.max(state.maxIntersectionRatio, entry.intersectionRatio);

        if (entry.isIntersecting) {
          resumeHomepageSectionVisibility(section, state);
          return;
        }

        if (state.visibleSince) {
          state.visibleMs += performance.now() - state.visibleSince;
          state.visibleSince = 0;
        }
        clearHomepageSectionTimers(state);
        captureHomepageSectionEngagement(section, state);
      });
    }, { rootMargin: "-15% 0px -15% 0px", threshold: [0.01, 0.25, 0.5, 0.75, 1] });

    sections.forEach((section) => homepageSectionObserver.observe(section));
    setupHomepageItemTracking(sections);
  };

  const captureHomepageSectionClick = (target) => {
    if (window.location.pathname !== "/") return;
    const section = target.closest("[data-homepage-section]");
    if (!section) return;
    const href = target.getAttribute("href") || "";
    const parsedUrl = toUrl(href);
    const state = homepageSectionStates.get(section);
    if (state) state.clicks += 1;
    const clickProperties = {
      ...homepageElementProperties(section, target),
      time_to_click_ms: Date.now() - homepageSectionStartedAt,
      section_visible_seconds_at_click: state ? Number((homepageVisibleMs(state) / 1000).toFixed(1)) : 0,
    };
    window.toftAnalytics.capture("homepage_section_click", clickProperties);
    storeJourneyAttribution("homepage", parsedUrl, {
      source_path: window.location.pathname,
      ...clickProperties,
    });
    scheduleHomepageSectionSummary("section_click");
  };

  const captureHomepagePerSectionSummaries = (reason) => {
    homepageSectionStates.forEach((state, section) => {
      if (!state.viewed) return;
      const visibleSeconds = Number((homepageVisibleMs(state) / 1000).toFixed(1));
      const maximumIntersectionRatio = Number(state.maxIntersectionRatio.toFixed(2));
      const signature = [
        Math.floor(visibleSeconds),
        state.engaged ? 1 : 0,
        state.clicks,
        Math.floor(maximumIntersectionRatio * 10),
      ].join(":");
      if (signature === state.summarySignature) return;
      state.summarySignature = signature;
      window.toftAnalytics.capture("homepage_section_summary", {
        ...homepageSectionProperties(section),
        homepage_section_viewed: state.viewed,
        homepage_section_engaged: state.engaged,
        homepage_section_clicks: state.clicks,
        visible_seconds: visibleSeconds,
        maximum_intersection_ratio: maximumIntersectionRatio,
        time_to_first_view_ms: state.firstViewMs,
        summary_reason: reason,
      });
    });
  };

  const captureHomepageSectionSummary = (reason = "checkpoint") => {
    if (window.location.pathname !== "/" || homepageSectionStates.size === 0) return;
    const summaryReason = typeof reason === "string" ? reason : "checkpoint";
    captureHomepagePerSectionSummaries(summaryReason);
    const viewedSections = [...homepageSectionStates.entries()]
      .filter(([, state]) => state.viewed)
      .map(([section]) => homepageSectionProperties(section));
    const deepestSection = viewedSections.reduce((deepest, section) => (
      section.homepage_section_position > (deepest?.homepage_section_position || 0) ? section : deepest
    ), null);
    const engagedSections = [...homepageSectionStates.values()].filter((state) => state.engaged).length;
    const totalSectionClicks = [...homepageSectionStates.values()]
      .reduce((total, state) => total + state.clicks, 0);
    const signature = [
      viewedSections.length,
      deepestSection?.homepage_section_position || 0,
      engagedSections,
      totalSectionClicks,
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
      homepage_total_section_clicks: totalSectionClicks,
      homepage_layout_version: homepageLayoutVersion,
      homepage_visit_id: homepageVisitId,
      maximum_scroll_percent: maximumScrollPercent,
      active_seconds: activeSeconds,
      summary_reason: summaryReason,
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
  document.addEventListener("astro:before-swap", () => {
    pauseHomepageSectionVisibility();
    captureHomepageSectionSummary("before_swap");
  });
  window.addEventListener("pagehide", () => {
    pauseHomepageSectionVisibility();
    captureHomepageSectionSummary("pagehide");
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      pauseHomepageSectionVisibility();
      captureHomepageSectionSummary("visibility_hidden");
      return;
    }
    homepageSectionStates.forEach((state, section) => {
      resumeHomepageSectionVisibility(section, state);
    });
  });
  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const target = event.target.closest("a, button");
    if (!target) return;
    captureHomepageSectionClick(target);
    const href = target.getAttribute("href") || "";
    if (target instanceof HTMLAnchorElement && href && !href.startsWith("#")) {
      captureHomepageSectionSummary("navigation");
    }
    captureClick(target);
  });

  let navigationItemObserver = null;
  let navigationMutationObserver = null;
  let navigationItemsObserved = new WeakSet();
  let navigationItemsViewed = new WeakSet();
  let navigationItemsVisible = new WeakSet();
  let navigationItemTimers = new Map();

  const navigationElementProperties = (element) => {
    const href = element.getAttribute("href") || "";
    const parsedUrl = toUrl(href);
    return {
      navigation_surface: element.getAttribute("data-navigation-surface") || "",
      navigation_group: element.getAttribute("data-navigation-group") || "",
      navigation_item_label: cleanText(
        element.getAttribute("data-navigation-label") || element.getAttribute("aria-label") || element.textContent,
        100,
      ),
      navigation_item_position: Number(element.getAttribute("data-navigation-position") || 0),
      navigation_is_current: element.getAttribute("data-navigation-current") === "true",
      navigation_schema_version: element.getAttribute("data-navigation-version") || "",
      navigation_test_id: element.getAttribute("data-navigation-test-id") || "",
      navigation_test_variant: element.getAttribute("data-navigation-test-variant") || "",
      destination: destinationType(href),
      destination_url: parsedUrl && href ? parsedUrl.href : "",
    };
  };

  const observeNavigationItems = () => {
    if (!navigationItemObserver) return;
    document.querySelectorAll("[data-navigation-item]").forEach((element) => {
      if (navigationItemsObserved.has(element)) return;
      navigationItemsObserved.add(element);
      navigationItemObserver.observe(element);
    });
  };

  const setupNavigationItemTracking = () => {
    if (!("IntersectionObserver" in window)) return;
    if (navigationItemObserver) navigationItemObserver.disconnect();
    navigationItemTimers.forEach((timer) => window.clearTimeout(timer));
    navigationItemsObserved = new WeakSet();
    navigationItemsViewed = new WeakSet();
    navigationItemsVisible = new WeakSet();
    navigationItemTimers = new Map();

    navigationItemObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const element = entry.target;
        if (navigationItemsViewed.has(element)) return;
        if (!entry.isIntersecting || entry.intersectionRatio < 0.5) {
          navigationItemsVisible.delete(element);
          window.clearTimeout(navigationItemTimers.get(element));
          navigationItemTimers.delete(element);
          return;
        }

        navigationItemsVisible.add(element);
        if (navigationItemTimers.has(element)) return;
        const timer = window.setTimeout(() => {
          navigationItemTimers.delete(element);
          if (!navigationItemsVisible.has(element) || navigationItemsViewed.has(element)) return;
          navigationItemsViewed.add(element);
          window.toftAnalytics.capture("navigation_item_viewed", {
            ...navigationElementProperties(element),
            minimum_intersection_ratio: 0.5,
            exposure_ms: 500,
          });
        }, 500);
        navigationItemTimers.set(element, timer);
      });
    }, { threshold: [0.5] });

    observeNavigationItems();
    if (!navigationMutationObserver) {
      navigationMutationObserver = new MutationObserver(observeNavigationItems);
      navigationMutationObserver.observe(document.body, { childList: true, subtree: true });
    }
  };

  setupNavigationItemTracking();
  document.addEventListener("astro:page-load", setupNavigationItemTracking);

  let contentNextStepObserver = null;
  const contentNextStepViewed = new WeakSet();
  const contentNextStepTimers = new WeakMap();
  const contentNextStepSelector = "[data-content-next-step], [data-content-next-step-item]";
  const setupContentNextStepTracking = () => {
    if (contentNextStepObserver) contentNextStepObserver.disconnect();
    document.querySelectorAll(contentNextStepSelector).forEach((element) => {
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
          if (element.matches("[data-content-next-step-item]")) {
            const href = element.getAttribute("href") || "";
            const parsedUrl = toUrl(href);
            window.toftAnalytics.capture("content_next_step_item_viewed", {
              cta_label: cleanText(element.getAttribute("aria-label") || element.textContent),
              content_type: element.getAttribute("data-analytics-content-type") || "",
              content_slug: element.getAttribute("data-analytics-content-slug") || normalizedPath(window.location.pathname),
              content_title: cleanText(element.getAttribute("data-analytics-content-title") || "", 100),
              content_position: element.getAttribute("data-analytics-position") || "",
              next_step_topic: element.getAttribute("data-analytics-topic") || "",
              next_step_item_position: Number(element.getAttribute("data-analytics-item-position") || 0),
              destination: destinationType(href),
              destination_url: parsedUrl && href ? parsedUrl.href : "",
            });
            return;
          }
          window.toftAnalytics.capture("content_next_step_viewed", {
            content_type: element.getAttribute("data-analytics-content-type") || "",
            content_slug: element.getAttribute("data-analytics-content-slug") || normalizedPath(window.location.pathname),
            content_title: cleanText(element.getAttribute("data-analytics-content-title") || "", 100),
            content_position: element.getAttribute("data-analytics-position") || "",
            next_step_topic: element.getAttribute("data-analytics-topic") || "",
            next_step_item_count: Number(element.getAttribute("data-analytics-item-count") || 0),
          });
        }, 800);
        contentNextStepTimers.set(element, timer);
      });
    }, { threshold: [0.25] });

    document.querySelectorAll(contentNextStepSelector).forEach((element) => contentNextStepObserver.observe(element));
  };

  setupContentNextStepTracking();
  document.addEventListener("astro:page-load", setupContentNextStepTracking);

  let projectCardObserver = null;
  const projectCardsViewed = new WeakSet();
  const projectCardTimers = new WeakMap();
  const setupProjectCardTracking = () => {
    if (projectCardObserver) projectCardObserver.disconnect();
    document.querySelectorAll("[data-project-card]").forEach((element) => {
      window.clearTimeout(projectCardTimers.get(element));
    });
    if (!("IntersectionObserver" in window)) return;

    projectCardObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const element = entry.target;
        if (projectCardsViewed.has(element)) return;
        if (!entry.isIntersecting || entry.intersectionRatio < 0.35) {
          window.clearTimeout(projectCardTimers.get(element));
          projectCardTimers.delete(element);
          return;
        }
        if (projectCardTimers.has(element)) return;
        const timer = window.setTimeout(() => {
          projectCardTimers.delete(element);
          if (projectCardsViewed.has(element)) return;
          projectCardsViewed.add(element);
          window.toftAnalytics.capture("project_card_viewed", {
            content_type: "project",
            content_slug: element.getAttribute("data-project-card") || "",
            content_title: cleanText(element.getAttribute("data-analytics-content-title") || "", 100),
            content_position: element.getAttribute("data-analytics-position") || "",
          });
        }, 800);
        projectCardTimers.set(element, timer);
      });
    }, { threshold: [0.35] });

    document.querySelectorAll("[data-project-card]").forEach((element) => projectCardObserver.observe(element));
  };

  setupProjectCardTracking();
  document.addEventListener("astro:page-load", setupProjectCardTracking);

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
