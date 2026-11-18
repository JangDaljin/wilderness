/* Daljin's Home 터미널 시안 공용 실행 코드. 시안 증명용이며 구현물이 아니다.
   화면 프레임([data-term])에서는 실제로 명령을 칠 수 있고, 컴포넌트 명세([data-render])는 정해진 상태 하나를 그린다.
   색, 간격, 모션 값은 terminal.css 의 토큰 변수에서 읽는다. */
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

  /* ---------- 아이콘: 16x16 칸에 픽셀을 한 칸씩 직접 찍는다. 글자 하나가 색 하나 ---------- */
  var INK = { w: "light", g: "mid", d: "dark", t: "accent", h: "accent-light", s: "accent-dark" };
  var BLOCK = ["hhht", "htts", "htts", "tsss"];
  function blocks(cells) {
    var m = [];
    for (var y = 0; y < 16; y++) m.push("................".split(""));
    cells.forEach(function (c) {
      for (var dy = 0; dy < 4; dy++) for (var dx = 0; dx < 4; dx++) m[c[1] * 4 + dy][c[0] * 4 + dx] = BLOCK[dy][dx];
    });
    return m.map(function (r) { return r.join(""); });
  }
  var SPRITES = {
    /* 이력서: 귀퉁이를 접은 종이와 글줄. 종이 light, 접힌 면 mid, 글줄 dark */
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
    /* 깃허브: 갈라졌다 다시 만나는 가지. 로고를 따라 그리지 않는다. 마디 accent, 선 mid */
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
    /* Daltris: 빈칸으로 떨어지는 블록. 블록 하나는 4x4 칸, 밝은 테두리와 그림자 테두리 */
    blocks: blocks([[2, 0], [2, 1], [0, 2], [3, 2], [0, 3], [1, 3], [3, 3]]),
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
  Object.keys(SPRITES).forEach(function (k) {
    var s = SPRITES[k], inks = {};
    if (s.length !== 16) throw new Error(k + " 는 16줄이어야 해요");
    s.forEach(function (row, i) {
      if (row.length !== 16) throw new Error(k + " " + i + "번째 줄은 16칸이어야 해요");
      row.replace(/[^.]/g, function (c) { inks[c] = 1; return c; });
    });
    if (Object.keys(inks).length > 3) throw new Error(k + " 는 색을 세 개까지만 써요");
  });

  var SVGNS = "http://www.w3.org/2000/svg";
  function icon(shape, cls) {
    var rows = SPRITES[shape] || SPRITES.window;
    var svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("viewBox", "0 0 16 16");
    svg.setAttribute("class", "icon " + (cls || "icon-list"));
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

  /* ---------- 데이터 ---------- */
  var DEMO = [
    { id: "resume", name: "이력서", shape: "note", url: "https://resume.daljin.cloud", summary: "해 온 일과 경력을 정리한 이력서예요." },
    { id: "github", name: "깃허브", shape: "branch", url: "https://github.com/JangDaljin", summary: "이 사이트를 비롯해 만든 것들의 코드가 있어요." },
    { id: "daltris", name: "Daltris", shape: "blocks", status: "new", summary: "떨어지는 블록을 쌓아 가로줄을 채우면 지워지는 게임이에요.", note: "지금 만드는 중이에요. 다 만들면 이 창에서 바로 할 수 있어요." }
  ];
  var WORST = DEMO.concat([
    { id: "seoul-subway-arrival-board", name: "서울 지하철 도착 정보와 출퇴근길 환승 알림을 한 화면에 모은 보드", status: "beta",
      summary: "역 이름을 넣으면 다음 열차 두 대의 도착 시간과 칸별 혼잡도, 환승역까지 걸리는 시간을 한 번에 보여 주고, 출근 시간 15분 전에는 알림도 보내요.",
      note: "베타라서 2호선과 9호선만 돼요. 다른 노선은 순서대로 붙이고 있어요." },
    { id: "x", name: "x", shape: "", summary: "" },
    { id: "dice", name: "🎲 주사위", summary: "주사위를 굴려요. 🎲🎲 두 개까지 같이 굴릴 수 있어요." },
    { id: "weather", name: "날씨", status: "error", url: "https://weather.example-forecast-service-for-korea.example.com/seoul/gangnam-gu/yeoksam-dong?unit=celsius",
      summary: "동네 날씨를 시간마다 보여 줘요." },
    { id: "memo", name: "메모", summary: "브라우저에 짧은 메모를 남겨요." },
    { id: "timer", name: "타이머", summary: "뽀모도로 25분과 쉬는 시간 5분을 번갈아 재요." },
    { id: "colors", name: "색 고르기", summary: "광야 팔레트에서 색을 골라 복사해요." },
    { id: "budget", name: "가계부", summary: "이번 달 쓴 돈을 분류별로 모아 봐요." },
    { id: "habit", name: "습관 기록", summary: "매일 한 칸씩 채우는 습관 달력이에요." },
    { id: "quotes", name: "오늘의 문장", summary: "읽은 책에서 고른 문장을 하루에 하나씩 보여 줘요." },
    { id: "recipes", name: "레시피", summary: "자주 해 먹는 요리 순서를 모았어요." },
    { id: "unit-convert", name: "단위 바꾸기", summary: "평과 제곱미터, 근과 그램을 바꿔요." },
    { id: "lotto", name: "번호 뽑기", summary: "1부터 45까지 숫자 여섯 개를 뽑아요." },
    { id: "bookmarks", name: "북마크", summary: "자주 가는 사이트를 모아 둔 목록이에요." },
    { id: "stars", name: "별자리", summary: "오늘 밤 서울 하늘에 뜨는 별자리를 보여 줘요." },
    { id: "qr", name: "QR 만들기", summary: "주소를 넣으면 QR 코드를 만들어요." },
    { id: "typing", name: "타자 연습", summary: "한글과 영어 타자 속도를 재요." }
  ]);
  var DATA = { demo: DEMO, worst: WORST, empty: [] };

  function norm(a) {
    var url = a.url || "games/" + a.id + "/";
    var external = /^https?:/.test(url);
    var host = "";
    if (external) { try { host = new URL(url).host; } catch (e) { host = url; } }
    return { id: a.id.toLowerCase(), name: a.name || a.id, shape: a.shape || "", status: a.status || "", url: url, external: external, host: host, summary: a.summary || "", note: a.note || "" };
  }
  function findApp(id) {
    var all = WORST.map(norm);
    for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
    return norm(DEMO[0]);
  }

  /* 받침이 있으면 을, 없으면 를. 한글이 아닌 이름은 끝소리를 대충 본다 */
  function eul(name) {
    var c = name.charCodeAt(name.length - 1);
    if (c >= 0xAC00 && c <= 0xD7A3) return (c - 0xAC00) % 28 ? "을" : "를";
    return /[lmnkptbdg]$/i.test(name) ? "을" : "를";
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
    var b = el("span", "badge px" + (s.cls ? " " + s.cls : ""));
    if (s.glyph) { var g = el("span", "", s.glyph); g.setAttribute("aria-hidden", "true"); b.appendChild(g); }
    b.appendChild(txt(s.label));
    return b;
  }
  function echoNode(text) {
    var d = el("p", "echo");
    var p = el("span", "prompt", PROMPT);
    d.appendChild(p); d.appendChild(txt(" ")); d.appendChild(el("span", "cmd-text", text));
    return d;
  }
  function outLine(text, cls) { return el("p", "out" + (cls ? " " + cls : ""), text); }
  function lsRow(a, onOpen) {
    var b = el("button", "ls-row px");
    b.type = "button";
    b.appendChild(icon(a.shape, "icon-list"));
    var t = el("span", "ls-text");
    var head = el("span", "ls-head");
    head.appendChild(el("span", "ls-id", a.id));
    if (a.name.toLowerCase() !== a.id) head.appendChild(el("span", "ls-name", a.name));
    if (a.status) head.appendChild(badge(a.status));
    if (a.external) head.appendChild(badge("tab"));
    t.appendChild(head);
    if (a.summary) t.appendChild(el("span", "ls-summary muted", a.summary));
    b.appendChild(t);
    if (onOpen) b.addEventListener("click", function () { onOpen(a); });
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
      if (onPick) b.addEventListener("click", function () { onPick(h[0]); });
      d.appendChild(b);
      d.appendChild(el("span", "help-desc muted", h[1]));
    });
    return d;
  }
  function chipNode(label, onClick) {
    var c = el("button", "chip px", label);
    c.type = "button";
    if (onClick) c.addEventListener("click", function () { onClick(label); });
    return c;
  }
  function windowNode(a, onClose) {
    var n = el("div", "window px");
    var id = "win-title-" + (++uid);
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
    if (onClose) x.addEventListener("click", onClose);
    bar.appendChild(x);
    /* 시안에서는 앱 자리를 안내 글로 채운다. 실제 사이트에서는 iframe(games/<이름>/)이 이 자리를 채운다 */
    var body = el("div", "win-body");
    var stub = el("div", "win-stub");
    if (a.summary) stub.appendChild(el("p", "", a.summary));
    if (a.note) stub.appendChild(el("p", "win-note", a.note));
    stub.appendChild(el("p", "muted", "시안이라 앱 화면 대신 이 글을 보여 줘요."));
    body.appendChild(stub);
    n.appendChild(bar); n.appendChild(body);
    return { node: n, close: x, title: t };
  }
  function inputLine() {
    var node = el("div", "input-line");
    var p = el("span", "prompt", PROMPT);
    p.setAttribute("aria-hidden", "true");
    var box = el("span", "cmdline");
    var mirror = el("span", "cmd-mirror");
    mirror.setAttribute("aria-hidden", "true");
    var input = el("input", "cmd-input");
    input.type = "text";
    input.id = "cmd-" + (++uid);
    input.setAttribute("aria-label", "명령 입력");
    input.setAttribute("autocomplete", "off");
    input.setAttribute("autocapitalize", "none");
    input.setAttribute("autocorrect", "off");
    input.setAttribute("spellcheck", "false");
    input.setAttribute("enterkeyhint", "go");
    box.appendChild(mirror); box.appendChild(input);
    node.appendChild(p); node.appendChild(box);

    function paint() {
      var v = input.value, a = input.selectionStart, b = input.selectionEnd;
      if (a == null) a = b = v.length;
      mirror.textContent = "";
      var mark;
      if (a !== b) {
        mirror.appendChild(txt(v.slice(0, a)));
        mark = el("span", "sel", v.slice(a, b));
        mirror.appendChild(mark);
        mirror.appendChild(txt(v.slice(b)));
      } else {
        var cp = v.codePointAt(a);
        var ch = cp == null ? " " : String.fromCodePoint(cp);
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
    return { node: node, input: input, box: box, paint: paint, set: set };
  }

  /* 새 탭으로 연다. window.open 에 noopener 같은 창 옵션을 넘기면 크롬이 탭 대신 팝업 창으로 열어서,
     링크를 누른 것과 똑같이 연다 */
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

  /* ---------- 터미널 하나 ---------- */
  function mount(root, o) {
    var apps = o.apps.map(norm), byId = {}, ids = [];
    apps.forEach(function (a) { byId[a.id] = a; ids.push(a.id); });
    var touch = !!o.touch, demo = !!o.demo;
    var hist = [], hIdx = 0, draft = "", win = null;

    root.textContent = "";
    root.classList.add("term-app");
    root.classList.toggle("is-touch", touch);
    var gnb = el("header", "gnb");
    var h1 = el("h1", "brand", "Daljin's Home");
    h1.lang = "en";
    gnb.appendChild(h1);
    var term = el("div", "term");
    var log = el("div", "term-log");
    log.setAttribute("role", "log");
    log.setAttribute("aria-label", "터미널 출력");
    var line = inputLine(), input = line.input;
    term.appendChild(log); term.appendChild(line.node);
    root.appendChild(gnb); root.appendChild(term);
    var chips = null;
    if (touch) {
      chips = el("div", "chips");
      chips.setAttribute("role", "group");
      chips.setAttribute("aria-label", "자주 쓰는 명령");
      ["help", "ls"].concat(ids, ["clear"]).forEach(function (c) { chips.appendChild(chipNode(c, function () { run(c); })); });
      root.appendChild(chips);
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
    function run(raw, quiet) {
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
        if (!arg) e.appendChild(outLine("열 앱 이름을 같이 써 주세요. 예: open daltris", "is-error"));
        else openApp(arg, e, quiet);
      } else if (byId[head] && !arg) {
        openApp(head, e, quiet);
      } else {
        e.appendChild(outLine("'" + parts[0] + "' 명령을 찾지 못했어요. help 를 입력하면 쓸 수 있는 명령이 나와요.", "is-error"));
      }
      scroll();
    }
    function openApp(id, e, quiet) {
      var a = byId[id];
      if (!a) { e.appendChild(outLine("'" + id + "' 라는 앱은 없어요. ls 를 입력하면 앱 목록이 나와요.", "is-error")); return; }
      if (a.external) {
        if (demo) e.appendChild(outLine(a.name + eul(a.name) + " 새 탭에서 열었어요. 시안이라 실제로는 열지 않았어요."));
        else { openTab(a.url); e.appendChild(outLine(a.name + eul(a.name) + " 새 탭에서 열었어요.")); }
        var p = outLine("", "muted");
        p.appendChild(txt("안 열렸으면 주소를 눌러요: "));
        var link = el("a", "", a.host);
        link.href = a.url; link.target = "_blank"; link.rel = "noopener";
        p.appendChild(link);
        e.appendChild(p);
        return;
      }
      openWindow(a, quiet);
      e.appendChild(outLine(a.name + " 창을 열었어요. Esc 나 닫기 버튼으로 닫아요."));
    }

    function setInert(on) {
      [gnb, term, chips].forEach(function (n) { if (n) n.inert = on; });
    }
    function openWindow(a, quiet) {
      if (win) closeWindow(true);
      var scrim = el("div", "scrim");
      var w = windowNode(a, function () { closeWindow(); });
      scrim.addEventListener("click", function () { closeWindow(); });
      root.appendChild(scrim); root.appendChild(w.node);
      setInert(true);
      win = { node: w.node, scrim: scrim, opener: document.activeElement };
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { scrim.classList.add("is-in"); w.node.classList.add("is-in"); });
      });
      if (!quiet) w.close.focus({ preventScroll: true });
    }
    function closeWindow(instant) {
      if (!win) return;
      var w = win;
      win = null;
      setInert(false);
      function remove() { w.node.remove(); w.scrim.remove(); }
      if (instant) remove();
      else {
        w.node.classList.add("is-out");
        w.node.classList.remove("is-in");
        w.scrim.classList.remove("is-in");
        setTimeout(remove, 200);
      }
      /* 마우스 기기는 입력칸으로, 터치 기기는 키보드를 올리지 않도록 창을 연 버튼으로 돌아간다 */
      if (instant) return;
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

    /* 처음 들어왔을 때: 환영 문구, 그다음 ls 한 번 */
    var hello = el("div", "entry");
    hello.appendChild(outLine("달진이네 놀이터예요. 만든 앱을 명령으로 열 수 있어요."));
    hello.appendChild(outLine(touch ? "help 를 입력하거나 아래 버튼을 눌러 보세요." : "help 를 입력하면 쓸 수 있는 명령이 나와요.", "muted"));
    log.appendChild(hello);
    run("ls", true);
    (o.script || []).forEach(function (c) { run(c, true); });
    if (o.open) run("open " + o.open, true);
    line.paint();
    if (o.autofocus && !touch) input.focus({ preventScroll: true });
    return { run: run };
  }

  /* ---------- 컴포넌트 명세 ---------- */
  function flagify(n, flags) {
    ["hover", "pressed", "focus"].forEach(function (f) { if (flags.indexOf(f) >= 0) n.classList.add("is-" + f); });
  }
  function sample(cls) { return el("div", "sample" + (cls ? " " + cls : "")); }
  var LONG_URL = "https://resume.daljin.cloud/?utm_source=github&utm_medium=profile&utm_campaign=2026-winter-portfolio-refresh";
  function lineSample(kind) {
    var f = document.createDocumentFragment();
    var resume = norm(DEMO[0]);
    switch (kind) {
      case "welcome":
        f.appendChild(outLine("달진이네 놀이터예요. 만든 앱을 명령으로 열 수 있어요."));
        f.appendChild(outLine("help 를 입력하면 쓸 수 있는 명령이 나와요.", "muted"));
        break;
      case "echo": f.appendChild(echoNode("open daltris")); break;
      case "out": f.appendChild(outLine("Daltris 창을 열었어요. Esc 나 닫기 버튼으로 닫아요.")); break;
      case "error":
        f.appendChild(echoNode("hello"));
        f.appendChild(outLine("'hello' 명령을 찾지 못했어요. help 를 입력하면 쓸 수 있는 명령이 나와요.", "is-error"));
        break;
      case "external":
        f.appendChild(echoNode("resume"));
        f.appendChild(outLine("이력서를 새 탭에서 열었어요."));
        var p = outLine("", "muted");
        p.appendChild(txt("안 열렸으면 주소를 눌러요: "));
        var a = el("a", "", resume.host); a.href = resume.url; a.target = "_blank"; a.rel = "noopener";
        p.appendChild(a); f.appendChild(p);
        break;
      case "candidates":
        f.appendChild(echoNode("d"));
        f.appendChild(outLine("daltris   dice", "muted"));
        break;
      case "ctrlc":
        var e = echoNode("open dal"); e.appendChild(txt("^C")); f.appendChild(e);
        break;
      case "long":
        f.appendChild(echoNode(LONG_URL));
        f.appendChild(outLine("'" + LONG_URL + "' 명령을 찾지 못했어요. help 를 입력하면 쓸 수 있는 명령이 나와요.", "is-error"));
        break;
      case "korean":
        f.appendChild(echoNode("안녕하세요"));
        f.appendChild(outLine("'안녕하세요' 명령을 찾지 못했어요. help 를 입력하면 쓸 수 있는 명령이 나와요.", "is-error"));
        break;
      case "empty":
        f.appendChild(echoNode("ls"));
        f.appendChild(outLine("아직 올린 앱이 없어요. 앱을 올리면 여기에 나와요.", "muted"));
        break;
    }
    return f;
  }
  var INPUTS = {
    focus: { v: "", focus: true }, typing: { v: "open dal", focus: true }, middle: { v: "open daltris", at: 5, focus: true },
    select: { v: "open daltris", at: 5, to: 12, focus: true }, blur: { v: "ls", focus: false },
    korean: { v: "안녕하세요", focus: true }, long: { v: LONG_URL, focus: true }
  };
  function renderSpec(n) {
    var ds = n.dataset, flags = (ds.flags || "").split(" "), box, after;
    switch (ds.render) {
      case "line": box = sample(); box.appendChild(lineSample(ds.kind)); break;
      case "input":
        box = sample();
        var s = INPUTS[ds.state], li = inputLine();
        li.input.value = s.v;
        var at = s.at == null ? s.v.length : s.at;
        li.input.setSelectionRange(at, s.to == null ? at : s.to);
        if (s.focus) li.box.classList.add("is-focus");
        box.appendChild(li.node);
        after = li.paint;
        break;
      case "lsrow": box = sample(); var r = lsRow(findApp(ds.app)); flagify(r, flags); box.appendChild(r); break;
      case "ls": box = sample(); box.appendChild(lsNode(DATA[ds.dataset].map(norm))); break;
      case "help": box = sample(); box.appendChild(helpNode()); break;
      case "chip": box = sample("sample-bar"); var c = chipNode(ds.label); flagify(c, flags); box.appendChild(c); break;
      case "icon": box = icon(ds.shape, ds.size); break;
      case "window":
        var w = windowNode(findApp(ds.app));
        w.node.classList.add("is-static");
        flagify(w.close, flags);
        box = w.node;
        break;
    }
    if (box) n.appendChild(box);
    if (after) requestAnimationFrame(after);
  }

  function boot() {
    document.querySelectorAll("[data-term]").forEach(function (n) {
      var ds = n.dataset;
      mount(n, { apps: DATA[ds.dataset || "demo"], touch: "touch" in ds, demo: true, script: ds.script ? JSON.parse(ds.script) : [], open: ds.open || "" });
    });
    document.querySelectorAll("[data-render]").forEach(renderSpec);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
