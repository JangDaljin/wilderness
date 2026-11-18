/* Daljin's Home 첫 화면 터미널.
   앱 목록은 index.html 의 [data-apps] 링크 목록에서 읽는다. 앱을 더하려면 그 목록에 <li> 하나를 넣는다.
   승인된 시안 design/home-terminal/terminal.js 에서 옮겼다. 색, 간격, 모션 값은 css/site.css 의 토큰 변수에 있다. */
(function () {
  "use strict";

  var PROMPT = "guest@daljin:~$";
  var COMMANDS = ["help", "ls", "open", "clear"];
  var uid = 0;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function txt(s) { return document.createTextNode(s); }

  /* ---------- 아이콘: 16x16 칸에 픽셀을 한 칸씩 직접 찍는다. 글자 하나가 색 하나, 아이콘 하나에 세 색까지 ---------- */
  var INK = { w: "light", g: "mid", d: "dark", t: "accent", h: "accent-light", s: "accent-dark" };
  var SPRITES = {
    /* 이력서: 귀퉁이를 접은 종이와 글줄 */
    note: [
      "................",
      "...wwwwwwwg.....",
      "...wwwwwwwgg....",
      "...wwwwwwwggg...",
      "...wwddddwwww...",
      "...wwwwwwwwww...",
      "...wwddddddww...",
      "...wwwwwwwwww...",
      "...wwddddddww...",
      "...wwwwwwwwww...",
      "...wwddddddww...",
      "...wwwwwwwwww...",
      "...wwddddwwww...",
      "...wwwwwwwwww...",
      "...wwwwwwwwww...",
      "................"
    ],
    /* 깃허브: 갈라졌다 다시 만나는 가지. 로고를 따라 그리지 않는다 */
    branch: [
      "................",
      "....tt..........",
      "...tttt.........",
      "...tttt...tt....",
      "....tt...tttt...",
      "....gg...tttt...",
      "....gg....tt....",
      "....gg....gg....",
      "....gg...gg.....",
      "....gg..gg......",
      "....gg.gg.......",
      "....ttgg........",
      "...tttt.........",
      "...tttt.........",
      "....tt..........",
      "................"
    ],
    /* 아이콘이 없는 앱: 빈 창 */
    window: [
      "................",
      "................",
      "..gggggggggggg..",
      "..gttttttttttg..",
      "..gggggggggggg..",
      "..g..........g..",
      "..g..........g..",
      "..g..........g..",
      "..g..........g..",
      "..g..........g..",
      "..g..........g..",
      "..g..........g..",
      "..gggggggggggg..",
      "................",
      "................",
      "................"
    ]
  };

  var SVGNS = "http://www.w3.org/2000/svg";
  function icon(shape, cls) {
    var rows = SPRITES[shape] || SPRITES.window;
    var svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("viewBox", "0 0 16 16");
    svg.setAttribute("class", "icon " + cls);
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.setAttribute("shape-rendering", "crispEdges");
    for (var y = 0; y < 16; y++) {
      var row = rows[y], x = 0;
      while (x < 16) {
        var ch = row.charAt(x);
        if (ch === ".") { x++; continue; }
        var start = x;
        while (x < 16 && row.charAt(x) === ch) x++;
        var r = document.createElementNS(SVGNS, "rect");
        r.setAttribute("x", start); r.setAttribute("y", y);
        r.setAttribute("width", x - start); r.setAttribute("height", 1);
        r.setAttribute("class", "ink-" + INK[ch]);
        svg.appendChild(r);
      }
    }
    return svg;
  }

  /* ---------- 앱 목록 ---------- */
  function readApps(list) {
    return [].map.call(list.querySelectorAll("a[href]"), function (a) {
      var url = new URL(a.getAttribute("href"), location.href), d = a.dataset, name = a.textContent.trim();
      return {
        id: (d.id || name).toLowerCase(), name: name, href: url.href,
        external: url.origin !== location.origin, host: url.host,
        shape: d.shape || "", status: d.status || "", summary: d.summary || "", note: d.note || ""
      };
    });
  }

  /* 받침이 있으면 을, 없으면 를. 한글이 아닌 이름은 끝소리를 대충 본다 */
  function eul(name) {
    var c = name.charCodeAt(name.length - 1);
    if (c >= 0xAC00 && c <= 0xD7A3) return (c - 0xAC00) % 28 ? "을" : "를";
    return /[lmnkptbdg]$/i.test(name) ? "을" : "를";
  }
  /* 새 탭으로 연다. window.open 에 noopener 같은 창 옵션을 넘기면 크롬이 탭 대신 팝업 창으로 열어서,
     링크를 누른 것과 똑같이 연다. 사용자가 누르거나 Enter 를 친 그 순간에 불러야 막히지 않는다 */
  function openTab(href) {
    var link = el("a");
    link.href = href; link.target = "_blank"; link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
  function commonPrefix(list) {
    var p = list[0];
    list.forEach(function (s) { while (s.indexOf(p) !== 0) p = p.slice(0, -1); });
    return p;
  }

  /* ---------- 조각 ---------- */
  var STATUS = {
    "new": { cls: "info", glyph: "+", label: "신규" },
    beta: { cls: "warning", glyph: "β", label: "베타" },
    error: { cls: "error", glyph: "!", label: "오류" },
    tab: { cls: "", glyph: "", label: "새 탭" }
  };
  function badge(k) {
    var s = STATUS[k];
    if (!s) return null;
    var b = el("span", "badge px" + (s.cls ? " " + s.cls : ""));
    if (s.glyph) { var g = el("span", "", s.glyph); g.setAttribute("aria-hidden", "true"); b.appendChild(g); }
    b.appendChild(txt(s.label));
    return b;
  }
  function echoNode(text) {
    var d = el("p", "echo");
    d.appendChild(el("span", "prompt", PROMPT));
    d.appendChild(txt(" "));
    d.appendChild(el("span", "cmd-text", text));
    return d;
  }
  function outLine(text, cls) { return el("p", "out" + (cls ? " " + cls : ""), text); }
  function lsRow(a, onOpen) {
    var b = el("button", "ls-row px");
    b.type = "button";
    b.appendChild(icon(a.shape, "icon-list"));
    var t = el("span", "ls-text"), head = el("span", "ls-head");
    head.appendChild(el("span", "ls-id", a.id));
    if (a.name.toLowerCase() !== a.id) head.appendChild(el("span", "ls-name", a.name));
    [a.status, a.external ? "tab" : ""].forEach(function (k) { var x = k && badge(k); if (x) head.appendChild(x); });
    t.appendChild(head);
    if (a.summary) t.appendChild(el("span", "ls-summary muted", a.summary));
    b.appendChild(t);
    b.addEventListener("click", function () { onOpen(a); });
    return b;
  }
  function lsNode(apps, onOpen) {
    if (!apps.length) return outLine("아직 올린 앱이 없어요. 앱을 올리면 여기에 나와요.", "muted");
    var w = el("div", "ls");
    apps.forEach(function (a) { w.appendChild(lsRow(a, onOpen)); });
    return w;
  }
  var HELP = [["help", "쓸 수 있는 명령을 보여 줘요"], ["ls", "앱 목록을 보여 줘요"], ["open <앱>", "앱을 열어요. 앱 이름만 써도 돼요"], ["clear", "화면을 지워요"]];
  function helpNode(onPick) {
    var d = el("div", "help");
    HELP.forEach(function (h) {
      var b = el("button", "help-cmd", h[0]);
      b.type = "button";
      b.addEventListener("click", function () { onPick(h[0]); });
      d.appendChild(b);
      d.appendChild(el("span", "help-desc muted", h[1]));
    });
    return d;
  }
  function chipNode(label, onClick) {
    var c = el("button", "chip px", label);
    c.type = "button";
    c.addEventListener("click", function () { onClick(label); });
    return c;
  }
  function windowNode(a, onClose) {
    var n = el("div", "window px"), id = "win-title-" + (++uid);
    n.setAttribute("role", "dialog");
    n.setAttribute("aria-modal", "true");
    n.setAttribute("aria-labelledby", id);
    var bar = el("div", "win-bar");
    bar.appendChild(icon(a.shape, "icon-title"));
    var t = el("h2", "win-title", a.name);
    t.id = id; t.title = a.name;
    bar.appendChild(t);
    var x = el("button", "win-close px", "x");
    x.type = "button";
    x.setAttribute("aria-label", "닫기");
    x.addEventListener("click", onClose);
    bar.appendChild(x);
    var body = el("div", "win-body");
    var frame = el("iframe", "win-frame");
    frame.title = a.name;
    frame.src = a.href;
    body.appendChild(frame);
    n.appendChild(bar); n.appendChild(body);
    return { node: n, close: x, frame: frame };
  }

  /* 입력 줄: 진짜 입력칸은 글자를 숨기고, 같은 자리의 거울 글자에 네모 커서를 그린다 */
  function inputLine() {
    var node = el("div", "input-line");
    var p = el("span", "prompt", PROMPT);
    p.setAttribute("aria-hidden", "true");
    var box = el("span", "cmdline");
    var mirror = el("span", "cmd-mirror");
    mirror.setAttribute("aria-hidden", "true");
    var input = el("input", "cmd-input");
    input.type = "text";
    input.id = "cmd";
    input.setAttribute("aria-label", "명령 입력");
    input.setAttribute("autocomplete", "off");
    input.setAttribute("autocapitalize", "none");
    input.setAttribute("autocorrect", "off");
    input.setAttribute("spellcheck", "false");
    input.setAttribute("enterkeyhint", "go");
    box.appendChild(mirror); box.appendChild(input);
    node.appendChild(p); node.appendChild(box);

    function paint() {
      var v = input.value, a = input.selectionStart, b = input.selectionEnd, mark;
      if (a == null) a = b = v.length;
      mirror.textContent = "";
      if (a !== b) {
        mirror.appendChild(txt(v.slice(0, a)));
        mark = el("span", "sel", v.slice(a, b));
        mirror.appendChild(mark);
        mirror.appendChild(txt(v.slice(b)));
      } else {
        var cp = v.codePointAt(a), ch = cp == null ? " " : String.fromCodePoint(cp);
        mirror.appendChild(txt(v.slice(0, a)));
        mark = el("span", "caret", ch);
        mirror.appendChild(mark);
        mirror.appendChild(txt(v.slice(a + (cp == null ? 0 : ch.length))));
      }
      var l = mark.offsetLeft, r = l + mark.offsetWidth;
      if (r > mirror.scrollLeft + mirror.clientWidth) mirror.scrollLeft = r - mirror.clientWidth;
      else if (l < mirror.scrollLeft) mirror.scrollLeft = l;
      input.scrollLeft = mirror.scrollLeft;
    }
    function later() { requestAnimationFrame(paint); }
    ["input", "keyup", "select", "click", "keydown"].forEach(function (e) { input.addEventListener(e, later); });
    input.addEventListener("focus", function () { box.classList.add("is-focus"); later(); });
    input.addEventListener("blur", function () { box.classList.remove("is-focus"); later(); });
    function set(v) { input.value = v; try { input.setSelectionRange(v.length, v.length); } catch (e) {} paint(); }
    return { node: node, input: input, paint: paint, set: set };
  }

  /* ---------- 터미널 ---------- */
  function mount(root, apps, touch) {
    var byId = {}, ids = [];
    apps.forEach(function (a) { byId[a.id] = a; ids.push(a.id); });
    var hist = [], hIdx = 0, draft = "", win = null;

    var gnb = root.querySelector(".gnb"), term = root.querySelector(".term");
    var log = el("div", "term-log");
    log.setAttribute("role", "log");
    log.setAttribute("aria-label", "터미널 출력");
    var line = inputLine(), input = line.input;
    var chips = null;
    if (touch) {
      chips = el("div", "chips");
      chips.setAttribute("role", "group");
      chips.setAttribute("aria-label", "자주 쓰는 명령");
      ["help", "ls"].concat(ids, ["clear"]).forEach(function (c) { chips.appendChild(chipNode(c, function () { run(c); })); });
    }

    function scroll() { term.scrollTop = term.scrollHeight; }
    function entry(raw) {
      var e = el("div", "entry");
      e.appendChild(echoNode(raw));
      log.appendChild(e);
      return e;
    }
    function pick(cmd) {
      if (cmd.indexOf(" ") > 0) { line.set("open "); if (!touch) input.focus({ preventScroll: true }); return; }
      run(cmd);
    }
    function run(raw) {
      var cmd = raw.trim(), e = entry(raw);
      if (cmd && hist[hist.length - 1] !== cmd) hist.push(cmd);
      hIdx = hist.length; draft = "";
      if (!cmd) { scroll(); return; }
      var parts = cmd.split(/\s+/), head = parts[0].toLowerCase(), arg = parts.slice(1).join(" ").toLowerCase();
      if (head === "help") {
        e.appendChild(helpNode(pick));
        if (!touch) e.appendChild(outLine("Tab 키로 명령과 앱 이름을 채우고, 위아래 화살표로 지난 명령을 다시 불러와요.", "muted"));
      } else if (head === "ls") {
        e.appendChild(lsNode(apps, function (a) { run("open " + a.id); }));
      } else if (head === "clear") {
        log.textContent = "";
      } else if (head === "open") {
        if (!arg) e.appendChild(outLine("열 앱 이름을 같이 써 주세요. 예: open " + (ids[0] || "resume"), "is-error"));
        else openApp(arg, e);
      } else if (byId[head] && !arg) {
        openApp(head, e);
      } else {
        e.appendChild(outLine("'" + parts[0] + "' 명령을 찾지 못했어요. help 를 입력하면 쓸 수 있는 명령이 나와요.", "is-error"));
      }
      scroll();
    }
    function openApp(id, e) {
      var a = byId[id];
      if (!a) { e.appendChild(outLine("'" + id + "' 라는 앱은 없어요. ls 를 입력하면 앱 목록이 나와요.", "is-error")); return; }
      if (a.external) {
        openTab(a.href);
        e.appendChild(outLine(a.name + eul(a.name) + " 새 탭에서 열었어요."));
        var p = outLine("", "muted");
        p.appendChild(txt("안 열렸으면 주소를 눌러요: "));
        var link = el("a", "", a.host);
        link.href = a.href; link.target = "_blank"; link.rel = "noopener";
        p.appendChild(link);
        e.appendChild(p);
        return;
      }
      openWindow(a);
      e.appendChild(outLine(a.name + " 창을 열었어요. Esc 나 닫기 버튼으로 닫아요."));
    }

    function setInert(on) { [gnb, term, chips].forEach(function (n) { if (n) n.inert = on; }); }
    function openWindow(a) {
      if (win) closeWindow(true);
      var scrim = el("div", "scrim");
      var w = windowNode(a, function () { closeWindow(); });
      scrim.addEventListener("click", function () { closeWindow(); });
      win = { node: w.node, scrim: scrim, opener: document.activeElement };
      var mine = win;
      root.appendChild(scrim); root.appendChild(w.node);
      setInert(true);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { scrim.classList.add("is-in"); w.node.classList.add("is-in"); });
      });
      w.close.focus({ preventScroll: true });
      /* 같은 사이트 앱이라 iframe 안의 Esc 도 창을 닫는다. 앱이 Esc 를 직접 쓰려면 preventDefault 하면 된다 */
      w.frame.addEventListener("load", function () {
        if (win !== mine) return;
        try {
          w.frame.contentWindow.addEventListener("keydown", function (ev) {
            if (ev.key === "Escape" && !ev.defaultPrevented) closeWindow();
          });
          w.frame.contentWindow.focus();
        } catch (err) { /* 다른 사이트 주소면 닫기 버튼과 막으로만 닫는다 */ }
      });
    }
    function closeWindow(instant) {
      if (!win) return;
      var w = win;
      win = null;
      setInert(false);
      function remove() { w.node.remove(); w.scrim.remove(); }
      if (instant) { remove(); return; }
      w.node.classList.add("is-out");
      w.node.classList.remove("is-in");
      w.scrim.classList.remove("is-in");
      setTimeout(remove, 200);
      /* 마우스 기기는 입력칸으로, 터치 기기는 키보드를 올리지 않도록 창을 연 버튼으로 돌아간다 */
      if (!touch) input.focus({ preventScroll: true });
      else if (w.opener && w.opener.isConnected && root.contains(w.opener)) w.opener.focus({ preventScroll: true });
    }

    function complete() {
      var v = input.value, m, pool, pre, word;
      if ((m = /^(\s*open\s+)(\S*)$/i.exec(v))) { pre = m[1]; word = m[2].toLowerCase(); pool = ids; }
      else if ((m = /^(\s*)(\S*)$/.exec(v))) { pre = m[1]; word = m[2].toLowerCase(); pool = COMMANDS.concat(ids); }
      else return;
      var hits = pool.filter(function (c) { return c.indexOf(word) === 0; });
      if (!hits.length) return;
      if (hits.length === 1) { line.set(pre + hits[0] + " "); return; }
      var common = commonPrefix(hits);
      if (common.length > word.length) { line.set(pre + common); return; }
      var e = el("div", "entry");
      e.appendChild(echoNode(v));
      e.appendChild(outLine(hits.join("   "), "muted"));
      log.appendChild(e);
      scroll();
    }

    input.addEventListener("keydown", function (e) {
      if (e.isComposing || e.keyCode === 229) return;
      if (e.key === "Enter") { e.preventDefault(); var v = input.value; line.set(""); run(v); return; }
      /* 입력칸이 비어 있으면 Tab 을 가로채지 않아 키보드 사용자가 갇히지 않는다 */
      if (e.key === "Tab" && !e.shiftKey && input.value.trim()) { e.preventDefault(); complete(); return; }
      if (e.key === "ArrowUp") {
        if (!hist.length || hIdx === 0) return;
        e.preventDefault();
        if (hIdx === hist.length) draft = input.value;
        hIdx--; line.set(hist[hIdx]); return;
      }
      if (e.key === "ArrowDown") {
        if (hIdx >= hist.length) return;
        e.preventDefault();
        hIdx++; line.set(hIdx === hist.length ? draft : hist[hIdx]); return;
      }
      if (e.ctrlKey && (e.key === "l" || e.key === "L")) { e.preventDefault(); log.textContent = ""; return; }
      if (e.ctrlKey && (e.key === "c" || e.key === "C") && input.selectionStart === input.selectionEnd) {
        e.preventDefault();
        var en = el("div", "entry"), ec = echoNode(input.value);
        ec.appendChild(txt("^C"));
        en.appendChild(ec); log.appendChild(en);
        line.set(""); scroll();
      }
    });
    root.addEventListener("keydown", function (e) {
      if (win && e.key === "Escape") { e.preventDefault(); closeWindow(); }
    });
    term.addEventListener("click", function (e) {
      if (touch || e.target.closest("button, a, input")) return;
      var sel = window.getSelection();
      if (sel && String(sel).length) return;
      input.focus({ preventScroll: true });
    });

    /* 다 만든 뒤에 링크 목록을 터미널로 바꾼다 */
    term.textContent = "";
    term.appendChild(log); term.appendChild(line.node);
    root.classList.toggle("is-touch", touch);
    if (chips) root.appendChild(chips);

    /* 처음 들어왔을 때: 환영 문구, 그다음 ls 한 번 */
    var hello = el("div", "entry");
    hello.appendChild(outLine("달진이네 놀이터예요. 만든 앱을 명령으로 열 수 있어요."));
    hello.appendChild(outLine(touch ? "help 를 입력하거나 아래 버튼을 눌러 보세요." : "help 를 입력하면 쓸 수 있는 명령이 나와요.", "muted"));
    log.appendChild(hello);
    run("ls");
    line.paint();
    if (!touch) input.focus({ preventScroll: true });
  }

  function start() {
    var root = document.querySelector("[data-term]");
    var term = root && root.querySelector(".term");
    var list = root && root.querySelector("[data-apps]");
    if (!term || !list) return;
    try {
      var touch = !!(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
      mount(root, readApps(list), touch);
    } catch (err) {
      /* 터미널을 못 그리면 링크 목록을 그대로 보여 준다 */
      term.textContent = "";
      term.appendChild(list);
      var chips = root.querySelector(".chips");
      if (chips) chips.remove();
      root.classList.remove("is-touch");
      document.documentElement.classList.remove("js");
      if (window.console) console.error(err);
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
