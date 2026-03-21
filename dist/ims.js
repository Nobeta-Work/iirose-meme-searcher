/* IMS v0.1.0 build */
(() => {
  // src/config.js
  var DEFAULT_CONFIG = Object.freeze({
    triggerPrefix: "/m",
    searchApiUrl: "",
    keywordPrefixes: ["duitang.com", "表情包", "白圣女"],
    maxCandidates: 8,
    debug: false
  });
  var CONFIG_RANGE = Object.freeze({
    minCandidates: 1,
    maxCandidates: 20
  });
  function normalizeConfig(raw = {}) {
    const next = {
      triggerPrefix: normalizePrefix(raw.triggerPrefix),
      searchApiUrl: normalizeSearchApiUrl(raw.searchApiUrl),
      keywordPrefixes: normalizeKeywordPrefixes(raw.keywordPrefixes),
      maxCandidates: normalizeCandidateCount(raw.maxCandidates),
      debug: Boolean(raw.debug)
    };
    return next;
  }
  function normalizePrefix(value) {
    if (typeof value !== "string") return DEFAULT_CONFIG.triggerPrefix;
    const trimmed = value.trim();
    return trimmed || DEFAULT_CONFIG.triggerPrefix;
  }
  function normalizeSearchApiUrl(value) {
    if (typeof value !== "string") return DEFAULT_CONFIG.searchApiUrl;
    return value.trim();
  }
  function normalizeKeywordPrefixes(value) {
    if (Array.isArray(value)) return dedupeTokens(value);
    if (typeof value === "string") return dedupeTokens(splitKeywordPrefixes(value));
    return [...DEFAULT_CONFIG.keywordPrefixes];
  }
  function normalizeCandidateCount(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return DEFAULT_CONFIG.maxCandidates;
    return Math.min(CONFIG_RANGE.maxCandidates, Math.max(CONFIG_RANGE.minCandidates, Math.round(num)));
  }
  function buildSearchQuery(keyword, keywordPrefixes = []) {
    const normalizedKeyword = typeof keyword === "string" ? keyword.trim() : "";
    const normalizedPrefixes = normalizeKeywordPrefixes(keywordPrefixes);
    return [...normalizedPrefixes, normalizedKeyword].filter(Boolean).join(" ");
  }
  function formatKeywordPrefixes(keywordPrefixes = []) {
    return normalizeKeywordPrefixes(keywordPrefixes).join("\n");
  }
  function resolveSearchApiUrl(config = {}, fallback = "") {
    const value = normalizeSearchApiUrl(config.searchApiUrl);
    return value || normalizeSearchApiUrl(fallback);
  }
  function splitKeywordPrefixes(value) {
    return String(value).split(/[\r\n,，、]+/g).map((item) => item.trim()).filter(Boolean);
  }
  function dedupeTokens(items) {
    const seen = /* @__PURE__ */ new Set();
    const out = [];
    for (const item of items) {
      const trimmed = String(item).trim();
      if (!trimmed || seen.has(trimmed)) continue;
      seen.add(trimmed);
      out.push(trimmed);
    }
    return out;
  }

  // src/logger.js
  function createLogger(scope, debug = false) {
    const prefix = `[IMS:${scope}]`;
    return {
      debug(...args) {
        if (debug) console.debug(prefix, ...args);
      },
      info(...args) {
        console.info(prefix, ...args);
      },
      warn(...args) {
        console.warn(prefix, ...args);
      },
      error(...args) {
        console.error(prefix, ...args);
      }
    };
  }

  // src/utils.js
  function debounce(fn, delay) {
    let timer = null;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }
  function randomId(length = 12) {
    const alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
    let out = "";
    for (let index = 0; index < length; index += 1) {
      out += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return out;
  }
  function isVisibleElement(node) {
    if (!(node instanceof Element)) return false;
    const rect = node.getBoundingClientRect();
    const style = window.getComputedStyle(node);
    return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
  }
  function escapeHtml(value) {
    return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
  }

  // src/runtime.js
  function createRuntime(hostWindow, logger) {
    const state = {
      activeInput: null
    };
    function isTextEntryCandidate(node) {
      if (!(node instanceof hostWindow.HTMLElement)) return false;
      if (!isVisibleElement(node)) return false;
      if (node instanceof hostWindow.HTMLTextAreaElement) return true;
      if (node instanceof hostWindow.HTMLInputElement) {
        const allowed = ["text", "search", "url", "email"];
        return allowed.includes((node.type || "text").toLowerCase());
      }
      return node.isContentEditable;
    }
    function bindInputTracking(onChange) {
      const handleFocus = (event) => {
        if (isTextEntryCandidate(event.target)) {
          state.activeInput = event.target;
          logger.debug("Focused input candidate", describeNode(event.target));
        }
      };
      const handleInput = (event) => {
        if (!isTextEntryCandidate(event.target)) return;
        state.activeInput = event.target;
        onChange(event.target, readText(event.target));
      };
      hostWindow.document.addEventListener("focusin", handleFocus, true);
      hostWindow.document.addEventListener("input", handleInput, true);
      return () => {
        hostWindow.document.removeEventListener("focusin", handleFocus, true);
        hostWindow.document.removeEventListener("input", handleInput, true);
      };
    }
    function getActiveInput() {
      if (isTextEntryCandidate(state.activeInput)) return state.activeInput;
      const active = hostWindow.document.activeElement;
      return isTextEntryCandidate(active) ? active : null;
    }
    return {
      bindInputTracking,
      getActiveInput,
      readText,
      writeText,
      clearText,
      isTextEntryCandidate
    };
    function readText(node) {
      if (!node) return "";
      if (node instanceof hostWindow.HTMLInputElement || node instanceof hostWindow.HTMLTextAreaElement) {
        return node.value ?? "";
      }
      if (node.isContentEditable) return node.textContent ?? "";
      return "";
    }
    function writeText(node, value) {
      if (!node) return;
      if (node instanceof hostWindow.HTMLInputElement || node instanceof hostWindow.HTMLTextAreaElement) {
        const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(node), "value");
        if (descriptor?.set) {
          descriptor.set.call(node, value);
        } else {
          node.value = value;
        }
        node.dispatchEvent(new hostWindow.Event("input", { bubbles: true }));
        node.dispatchEvent(new hostWindow.Event("change", { bubbles: true }));
        return;
      }
      if (node.isContentEditable) {
        node.textContent = value;
        node.dispatchEvent(new hostWindow.InputEvent("input", { bubbles: true, data: value, inputType: "insertText" }));
      }
    }
    function clearText(node) {
      writeText(node, "");
    }
    function describeNode(node) {
      if (!(node instanceof hostWindow.HTMLElement)) return "<unknown>";
      const parts = [node.tagName.toLowerCase()];
      if (node.id) parts.push(`#${node.id}`);
      if (node.className && typeof node.className === "string") {
        const first = node.className.trim().split(/\s+/).slice(0, 2).join(".");
        if (first) parts.push(`.${first}`);
      }
      return parts.join("");
    }
  }

  // src/storage.js
  var STORAGE_KEY = "ims:v0.1.0:config";
  function loadConfig(hostWindow) {
    try {
      const raw = hostWindow.localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_CONFIG };
      return normalizeConfig(JSON.parse(raw));
    } catch {
      return { ...DEFAULT_CONFIG };
    }
  }
  function saveConfig(hostWindow, config) {
    const normalized = normalizeConfig(config);
    hostWindow.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  }

  // src/ui/candidate-bar.js
  var STYLE_ID = "ims-v0.1.0-candidate-style";
  function createCandidateBar(hostWindow, logger) {
    injectStyles(hostWindow);
    const root = hostWindow.document.createElement("div");
    root.className = "ims-candidate-bar";
    root.hidden = true;
    root.innerHTML = `
    <div class="ims-candidate-track"></div>
  `;
    hostWindow.document.body.appendChild(root);
    const track = root.querySelector(".ims-candidate-track");
    let currentAnchor = null;
    const api = {
      renderLoading(anchor) {
        currentAnchor = anchor;
        track.innerHTML = '<div class="ims-candidate-state">搜索中...</div>';
        show(anchor);
      },
      renderEmpty(anchor, message = "输入关键词开始搜索") {
        currentAnchor = anchor;
        track.innerHTML = `<div class="ims-candidate-state">${escapeHtml(message)}</div>`;
        show(anchor);
      },
      renderError(anchor, message = "搜索失败，请稍后重试") {
        currentAnchor = anchor;
        track.innerHTML = `<div class="ims-candidate-state ims-candidate-state-error">${escapeHtml(message)}</div>`;
        show(anchor);
      },
      renderResults(anchor, items, onPick) {
        currentAnchor = anchor;
        track.innerHTML = items.map((item) => `
        <button class="ims-candidate-item" type="button" data-ims-id="${escapeHtml(item.id)}" title="${escapeHtml(item.name)}">
          <img class="ims-candidate-image" src="${escapeHtml(item.url)}" alt="${escapeHtml(item.name)}" loading="lazy" />
          <span class="ims-candidate-label">${escapeHtml(item.name)}</span>
        </button>
      `).join("");
        track.querySelectorAll(".ims-candidate-item").forEach((button, index) => {
          button.addEventListener("click", () => onPick(items[index]));
        });
        show(anchor);
      },
      hide() {
        root.hidden = true;
      },
      reposition(anchor = currentAnchor) {
        if (!anchor || root.hidden) return;
        position(anchor);
      },
      destroy() {
        root.remove();
      }
    };
    hostWindow.addEventListener("resize", () => api.reposition());
    hostWindow.addEventListener("scroll", () => api.reposition(), true);
    return api;
    function show(anchor) {
      root.hidden = false;
      position(anchor);
    }
    function position(anchor) {
      const rect = anchor.getBoundingClientRect();
      const maxWidth = Math.min(hostWindow.innerWidth - 24, Math.max(360, rect.width));
      root.style.width = `${maxWidth}px`;
      root.style.left = `${Math.max(12, Math.min(rect.left, hostWindow.innerWidth - maxWidth - 12))}px`;
      root.style.top = `${Math.max(12, rect.top - root.offsetHeight - 10)}px`;
      logger.debug("Candidate bar positioned", { left: root.style.left, top: root.style.top });
    }
  }
  function injectStyles(hostWindow) {
    if (hostWindow.document.getElementById(STYLE_ID)) return;
    const style = hostWindow.document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
    .ims-candidate-bar {
      position: fixed;
      z-index: 2147483000;
      max-width: calc(100vw - 24px);
      border-radius: 14px;
      background: rgba(18, 20, 28, 0.96);
      border: 1px solid rgba(255, 255, 255, 0.12);
      box-shadow: 0 18px 48px rgba(0, 0, 0, 0.35);
      backdrop-filter: blur(12px);
      padding: 10px;
    }

    .ims-candidate-track {
      display: flex;
      gap: 10px;
      overflow-x: auto;
      scrollbar-width: thin;
    }

    .ims-candidate-state {
      color: #f2f4f8;
      font-size: 13px;
      line-height: 1.4;
      padding: 10px 12px;
      white-space: nowrap;
    }

    .ims-candidate-state-error {
      color: #ffb0aa;
    }

    .ims-candidate-item {
      flex: 0 0 112px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      border: 0;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.05);
      padding: 8px;
      cursor: pointer;
      color: #f2f4f8;
    }

    .ims-candidate-item:hover {
      background: rgba(255, 255, 255, 0.11);
    }

    .ims-candidate-image {
      width: 96px;
      height: 72px;
      object-fit: cover;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.06);
    }

    .ims-candidate-label {
      display: block;
      font-size: 12px;
      line-height: 1.3;
      text-align: left;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `;
    hostWindow.document.head.appendChild(style);
  }

  // src/ui/settings-panel.js
  var STYLE_ID2 = "ims-v0.1.0-settings-style";
  function createSettingsPanel(hostWindow, logger, initialConfig, onSave) {
    injectStyles2(hostWindow);
    let currentConfig = { ...initialConfig };
    const button = hostWindow.document.createElement("button");
    button.type = "button";
    button.className = "ims-settings-toggle";
    button.textContent = "IMS";
    const panel = hostWindow.document.createElement("div");
    panel.className = "ims-settings-panel";
    panel.hidden = true;
    panel.innerHTML = `
    <div class="ims-settings-header">IMS v0.1.0</div>
    <label class="ims-settings-field">
      <span>前缀</span>
      <input data-field="triggerPrefix" type="text" maxlength="12" />
    </label>
    <label class="ims-settings-field">
      <span>搜索接口地址</span>
      <input data-field="searchApiUrl" type="url" placeholder="https://your-search-service/search" />
    </label>
    <label class="ims-settings-field">
      <span>检索前缀词（每行或逗号分隔一个）</span>
      <textarea data-field="keywordPrefixes" rows="4" placeholder="duitang.com&#10;表情包&#10;白圣女"></textarea>
    </label>
    <label class="ims-settings-field">
      <span>候选数量 (${CONFIG_RANGE.minCandidates}-${CONFIG_RANGE.maxCandidates})</span>
      <input data-field="maxCandidates" type="number" min="${CONFIG_RANGE.minCandidates}" max="${CONFIG_RANGE.maxCandidates}" />
    </label>
    <div class="ims-settings-actions">
      <button type="button" data-action="cancel">取消</button>
      <button type="button" data-action="save">保存</button>
    </div>
  `;
    hostWindow.document.body.append(button, panel);
    const prefixInput = panel.querySelector('[data-field="triggerPrefix"]');
    const searchApiUrlInput = panel.querySelector('[data-field="searchApiUrl"]');
    const keywordPrefixesInput = panel.querySelector('[data-field="keywordPrefixes"]');
    const countInput = panel.querySelector('[data-field="maxCandidates"]');
    sync(currentConfig);
    button.addEventListener("click", () => {
      panel.hidden = !panel.hidden;
      if (!panel.hidden) sync(currentConfig);
    });
    panel.querySelector('[data-action="cancel"]').addEventListener("click", () => {
      panel.hidden = true;
      sync(currentConfig);
    });
    panel.querySelector('[data-action="save"]').addEventListener("click", () => {
      const nextConfig = {
        ...currentConfig,
        triggerPrefix: prefixInput.value,
        searchApiUrl: searchApiUrlInput.value,
        keywordPrefixes: keywordPrefixesInput.value,
        maxCandidates: Number(countInput.value)
      };
      logger.info("Saving config", nextConfig);
      onSave(nextConfig);
      panel.hidden = true;
    });
    return {
      sync,
      destroy() {
        button.remove();
        panel.remove();
      }
    };
    function sync(config) {
      currentConfig = { ...config };
      prefixInput.value = config.triggerPrefix;
      searchApiUrlInput.value = config.searchApiUrl || "";
      keywordPrefixesInput.value = formatKeywordPrefixes(config.keywordPrefixes);
      countInput.value = String(config.maxCandidates);
    }
  }
  function injectStyles2(hostWindow) {
    if (hostWindow.document.getElementById(STYLE_ID2)) return;
    const style = hostWindow.document.createElement("style");
    style.id = STYLE_ID2;
    style.textContent = `
    .ims-settings-toggle {
      position: fixed;
      right: 18px;
      bottom: 18px;
      z-index: 2147483001;
      border: 0;
      border-radius: 999px;
      background: #d6e26f;
      color: #11141a;
      font-weight: 700;
      padding: 10px 14px;
      cursor: pointer;
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.24);
    }

    .ims-settings-panel {
      position: fixed;
      right: 18px;
      bottom: 68px;
      z-index: 2147483001;
      width: 280px;
      padding: 14px;
      border-radius: 16px;
      background: rgba(18, 20, 28, 0.98);
      color: #f2f4f8;
      border: 1px solid rgba(255, 255, 255, 0.12);
      box-shadow: 0 18px 48px rgba(0, 0, 0, 0.35);
      backdrop-filter: blur(12px);
    }

    .ims-settings-header {
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 12px;
    }

    .ims-settings-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 12px;
      font-size: 12px;
    }

    .ims-settings-field input,
    .ims-settings-field textarea,
    .ims-settings-field select {
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.06);
      color: #f2f4f8;
      padding: 8px 10px;
    }

    .ims-settings-field textarea {
      resize: vertical;
      min-height: 84px;
      font-family: inherit;
      line-height: 1.4;
    }

    .ims-settings-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }

    .ims-settings-actions button {
      border: 0;
      border-radius: 10px;
      padding: 8px 12px;
      cursor: pointer;
      background: rgba(255, 255, 255, 0.1);
      color: #f2f4f8;
    }
  `;
    hostWindow.document.head.appendChild(style);
  }

  // src/ui/toast.js
  var STYLE_ID3 = "ims-v0.1.0-toast-style";
  function createToastManager(hostWindow) {
    injectStyles3(hostWindow);
    const root = hostWindow.document.createElement("div");
    root.className = "ims-toast-root";
    hostWindow.document.body.appendChild(root);
    let timer = null;
    return {
      show(message, type = "info") {
        clearTimeout(timer);
        root.textContent = message;
        root.dataset.type = type;
        root.hidden = false;
        timer = setTimeout(() => {
          root.hidden = true;
        }, 1800);
      },
      destroy() {
        clearTimeout(timer);
        root.remove();
      }
    };
  }
  function injectStyles3(hostWindow) {
    if (hostWindow.document.getElementById(STYLE_ID3)) return;
    const style = hostWindow.document.createElement("style");
    style.id = STYLE_ID3;
    style.textContent = `
    .ims-toast-root {
      position: fixed;
      left: 50%;
      bottom: 110px;
      transform: translateX(-50%);
      z-index: 2147483002;
      padding: 10px 14px;
      border-radius: 999px;
      background: rgba(18, 20, 28, 0.95);
      color: #f2f4f8;
      font-size: 13px;
      box-shadow: 0 14px 36px rgba(0, 0, 0, 0.28);
      pointer-events: none;
    }

    .ims-toast-root[data-type="success"] {
      background: rgba(30, 62, 45, 0.95);
    }

    .ims-toast-root[data-type="error"] {
      background: rgba(98, 39, 39, 0.95);
    }
  `;
    hostWindow.document.head.appendChild(style);
  }

  // src/search/api.js
  async function searchImages(query, config, logger, options = {}) {
    const trimmed = query.trim();
    if (!trimmed) return [];
    const apiUrl = options.searchApiUrl?.trim();
    if (!apiUrl) {
      throw new Error("请先在配置面板填写搜索接口地址。");
    }
    const endpoint = new URL(apiUrl, options.baseUrl || "http://localhost");
    endpoint.searchParams.set("q", trimmed);
    endpoint.searchParams.set("limit", String(config.maxCandidates));
    logger.debug("Requesting search API", endpoint.toString());
    const response = await fetch(endpoint.toString(), {
      method: "GET",
      mode: "cors",
      credentials: "omit"
    });
    if (!response.ok) {
      throw new Error(`搜索接口请求失败：${response.status}`);
    }
    const data = await response.json();
    if (!Array.isArray(data.items)) return [];
    return data.items.map(normalizeItem).filter(Boolean).slice(0, config.maxCandidates);
  }
  function normalizeItem(item) {
    if (!item || typeof item !== "object") return null;
    if (item.enabled === false) return null;
    if (typeof item.url !== "string" || !/^https?:\/\//i.test(item.url)) return null;
    const name = typeof item.name === "string" && item.name.trim() ? item.name.trim() : "搜索结果";
    return {
      id: typeof item.id === "string" && item.id.trim() ? item.id.trim() : randomId(),
      name,
      keywords: Array.isArray(item.keywords) ? item.keywords.map((value) => String(value).trim()).filter(Boolean) : [name],
      url: item.url,
      enabled: true
    };
  }

  // src/trigger.js
  function parseTriggerState(text, prefix) {
    if (typeof text !== "string" || typeof prefix !== "string" || !prefix) {
      return { active: false, keyword: "", rawKeyword: "" };
    }
    if (!text.startsWith(prefix)) {
      return { active: false, keyword: "", rawKeyword: "" };
    }
    const rawKeyword = text.slice(prefix.length);
    const keyword = rawKeyword.trimStart();
    return {
      active: true,
      keyword,
      rawKeyword
    };
  }

  // src/send.js
  async function sendCandidateUrl(hostWindow, runtime, item, logger) {
    const input = runtime.getActiveInput();
    if (!input) {
      throw new Error("未找到可用输入框，无法发送。");
    }
    const originalText = runtime.readText(input);
    const sent = sendThroughNativeEntry(hostWindow, runtime, input, item.url, logger);
    if (!sent) {
      runtime.writeText(input, item.url);
      input.focus();
      dispatchEnter(hostWindow, input);
    }
    await wait(150);
    const currentText = runtime.readText(input);
    if (currentText && currentText === item.url) {
      logger.warn("Enter dispatch did not clear input, keeping optimistic failure state.");
      runtime.writeText(input, originalText);
      throw new Error("发送动作未确认成功，请检查输入框或发送逻辑。");
    }
  }
  function dispatchEnter(hostWindow, node) {
    const events = [
      new hostWindow.KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Enter", code: "Enter" }),
      new hostWindow.KeyboardEvent("keypress", { bubbles: true, cancelable: true, key: "Enter", code: "Enter" }),
      new hostWindow.KeyboardEvent("keyup", { bubbles: true, cancelable: true, key: "Enter", code: "Enter" })
    ];
    events.forEach((event) => node.dispatchEvent(event));
  }
  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  function sendThroughNativeEntry(hostWindow, runtime, input, url, logger) {
    if (input?.id !== "moveinput") return false;
    const moveinput = hostWindow.moveinput;
    if (!moveinput || typeof moveinput.keydown !== "function") return false;
    try {
      if (typeof moveinput.val === "function") {
        moveinput.val(url);
      } else {
        runtime.writeText(input, url);
      }
      moveinput.keydown();
      logger.debug("Sent through native moveinput.keydown() entry");
      return true;
    } catch (error) {
      logger.warn("Native send entry failed, falling back to keyboard dispatch", error);
      return false;
    }
  }

  // src/plugin.js
  var GLOBAL_KEY = "__IMS_V010__";
  function bootstrapPlugin(hostWindow = window) {
    if (hostWindow[GLOBAL_KEY]) {
      hostWindow[GLOBAL_KEY].logger.info("IMS already initialized.");
      return hostWindow[GLOBAL_KEY];
    }
    const state = {
      config: normalizeConfig(loadConfig(hostWindow)),
      currentInput: null,
      queryVersion: 0
    };
    state.config.searchApiUrl = resolveSearchApiUrl(state.config, getDefaultSearchApiUrl(hostWindow));
    const logger = createLogger("core", state.config.debug);
    const runtime = createRuntime(hostWindow, logger);
    const candidateBar = createCandidateBar(hostWindow, logger);
    const toast = createToastManager(hostWindow);
    const settingsPanel = createSettingsPanel(hostWindow, logger, state.config, handleConfigSave);
    let roomSignature = getRoomSignature(hostWindow);
    const roomMonitor = hostWindow.setInterval(() => {
      const nextSignature = getRoomSignature(hostWindow);
      if (nextSignature !== roomSignature) {
        roomSignature = nextSignature;
        candidateBar.hide();
        logger.debug("Room signature changed, candidate bar hidden", roomSignature);
      }
    }, 1e3);
    const app = {
      logger,
      destroy,
      getConfig: () => ({ ...state.config })
    };
    hostWindow[GLOBAL_KEY] = app;
    logger.info("IMS initializing", state.config);
    const unsubscribe = runtime.bindInputTracking((input, text) => {
      state.currentInput = input;
      handleInputChange(input, text);
    });
    const debouncedSearch = debounce(async (input, keyword, queryVersion) => {
      candidateBar.renderLoading(input);
      try {
        const query = buildSearchQuery(keyword, state.config.keywordPrefixes);
        logger.debug("Search query built", query);
        const searchApiUrl = resolveSearchApiUrl(state.config, getDefaultSearchApiUrl(hostWindow));
        const items = await searchImages(query, state.config, logger, {
          searchApiUrl,
          baseUrl: hostWindow.location.href
        });
        if (queryVersion !== state.queryVersion) return;
        if (!items.length) {
          candidateBar.renderEmpty(input, "没有找到相关图片");
          return;
        }
        candidateBar.renderResults(input, items, async (item) => {
          try {
            await sendCandidateUrl(hostWindow, runtime, item, logger);
            candidateBar.hide();
            runtime.clearText(input);
            toast.show("已发送", "success");
          } catch (error) {
            candidateBar.renderError(input, error.message);
            toast.show(error.message || "发送失败", "error");
          }
        });
      } catch (error) {
        if (queryVersion !== state.queryVersion) return;
        candidateBar.renderError(input, error.message || "搜索失败，请稍后重试");
      }
    }, 350);
    hostWindow.addEventListener("beforeunload", destroy, { once: true });
    hostWindow.addEventListener("hashchange", () => {
      candidateBar.hide();
    });
    return app;
    function handleInputChange(input, text) {
      const triggerState = parseTriggerState(text, state.config.triggerPrefix);
      logger.debug("Input change", triggerState);
      if (!triggerState.active) {
        state.queryVersion += 1;
        candidateBar.hide();
        return;
      }
      if (!triggerState.keyword.trim()) {
        state.queryVersion += 1;
        candidateBar.renderEmpty(input, "输入关键词开始搜索");
        return;
      }
      state.queryVersion += 1;
      debouncedSearch(input, triggerState.keyword, state.queryVersion);
    }
    function handleConfigSave(nextConfig) {
      state.config = saveConfig(hostWindow, nextConfig);
      state.config.searchApiUrl = resolveSearchApiUrl(state.config, getDefaultSearchApiUrl(hostWindow));
      settingsPanel.sync(state.config);
      logger.info("Config updated", state.config);
      toast.show("配置已保存", "success");
      if (state.currentInput) {
        handleInputChange(state.currentInput, runtime.readText(state.currentInput));
      }
    }
    function destroy() {
      if (!hostWindow[GLOBAL_KEY]) return;
      unsubscribe();
      hostWindow.clearInterval(roomMonitor);
      candidateBar.destroy();
      toast.destroy();
      settingsPanel.destroy();
      delete hostWindow[GLOBAL_KEY];
      logger.info("IMS destroyed");
    }
  }
  function getRoomSignature(hostWindow) {
    return [
      hostWindow.location.href,
      String(hostWindow.roomn ?? ""),
      String(hostWindow.roomnFull ?? ""),
      String(hostWindow.roomColor ?? "")
    ].join("|");
  }
  function getDefaultSearchApiUrl(hostWindow) {
    if (typeof hostWindow.__IMS_V010_SEARCH_API_URL__ === "string" && hostWindow.__IMS_V010_SEARCH_API_URL__.trim()) {
      return hostWindow.__IMS_V010_SEARCH_API_URL__.trim();
    }
    if (typeof hostWindow.__IMS_V010_BING_RELAY__ === "string" && hostWindow.__IMS_V010_BING_RELAY__.trim()) {
      return hostWindow.__IMS_V010_BING_RELAY__.trim();
    }
    return "";
  }

  // src/index.js
  try {
    bootstrapPlugin(window);
  } catch (error) {
    console.error("[IMS:bootstrap] Failed to initialize", error);
  }
})();
//# sourceMappingURL=ims.js.map
