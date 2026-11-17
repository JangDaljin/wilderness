/* 광야 디자인 시안 공용 실행 코드. 시안 증명용이며 구현물이 아니다.
   색은 모두 CSS 변수(tokens.json 에서 생성)에서 읽는다. */
(function () {
  "use strict";
  var root = document.documentElement;
  var styles = getComputedStyle(root);
  function cssVar(name) { return styles.getPropertyValue(name).trim(); }
  function ms(name) { return parseFloat(cssVar(name)) || 0; }
  var reduceMotion = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  var canHover = window.matchMedia ? window.matchMedia("(hover: hover) and (pointer: fine)") : { matches: true };

  /* ---------- 앱 데이터 ---------- */
  var TONES = {
    aurora: ["--color-primary-400", "--color-primary-800", "--color-neutral-0", "--color-primary-100"],
    sky: ["--color-info-300", "--color-info-700", "--color-neutral-0", "--color-info-100"],
    ember: ["--color-warning-300", "--color-error-600", "--color-neutral-950", "--color-warning-100"],
    rose: ["--color-error-300", "--color-error-700", "--color-neutral-0", "--color-error-100"],
    leaf: ["--color-success-300", "--color-success-800", "--color-neutral-0", "--color-success-100"],
    night: ["--color-neutral-600", "--color-neutral-950", "--color-warning-300", "--color-neutral-200"],
    sand: ["--color-warning-100", "--color-warning-500", "--color-neutral-900", "--color-neutral-0"],
    deep: ["--color-info-600", "--color-neutral-950", "--color-primary-300", "--color-info-200"]
  };
  function app(id, name, shape, tone, kind, status, addedAt, summary, extra) {
    var a = { id: id, name: name, shape: shape, tone: tone, kind: kind, status: status, addedAt: addedAt, summary: summary };
    if (extra) for (var k in extra) a[k] = extra[k];
    return a;
  }
  var APPS = [
    app("dice", "주사위", "dice", "aurora", "internal", "new", "2026-11-16", "던질 때마다 1부터 6까지 숫자 하나를 골라 줘요."),
    app("pomodoro", "뽀모도로 타이머", "timer", "rose", "internal", "active", "2026-11-12", "25분 집중하고 5분 쉬는 시간을 재 줘요."),
    app("memo", "한 줄 메모", "note", "sand", "internal", "active", "2026-11-10", "떠오른 생각을 한 줄씩 적어 두는 메모장이에요."),
    app("colors", "색 뽑기", "palette", "deep", "internal", "beta", "2026-11-14", "사진에서 많이 쓰인 색 다섯 개를 뽑아 줘요."),
    app("weather", "오늘 날씨", "cloud", "sky", "internal", "error", "2026-11-03", "지금 있는 곳의 날씨를 보여 줘요.",
      { note: "날씨를 가끔 불러오지 못해요. 고치는 중이에요." }),
    app("github", "깃허브", "link", "night", "external", "active", "2026-10-30", "광야를 만드는 코드가 있는 저장소예요.",
      { url: "https://github.com" }),
    app("allowance", "용돈 기입장", "wallet", "leaf", "internal", "active", "2026-10-28", "들어온 돈과 나간 돈을 날짜별로 적어요."),
    app("words", "영단어 카드", "book", "aurora", "internal", "active", "2026-10-25", "카드를 뒤집으며 단어 뜻을 외워요."),
    app("pixelpad", "픽셀 그림판", "grid", "ember", "internal", "new", "2026-11-15", "16칸 격자에 점을 찍어 작은 그림을 그려요."),
    app("lunch", "점심 고르기", "bowl", "ember", "internal", "active", "2026-10-21", "고민될 때 오늘 점심 메뉴를 하나 골라 줘요."),
    app("reaction", "반응 속도 재기", "bolt", "sand", "internal", "active", "2026-10-19", "화면 색이 바뀌는 순간 눌러서 반응 속도를 재요."),
    app("mines", "지뢰 찾기", "mine", "night", "internal", "active", "2026-10-17", "숫자를 보고 지뢰가 없는 칸만 열어요."),
    app("stars", "별자리 지도", "star", "deep", "internal", "active", "2026-10-14", "오늘 밤 남쪽 하늘에 뜨는 별자리를 보여 줘요."),
    app("birthday", "생일 계산기", "cake", "rose", "internal", "active", "2026-10-11", "태어난 날부터 오늘까지 며칠이 지났는지 세요."),
    app("song", "오늘의 노래", "music", "aurora", "external", "active", "2026-10-09", "요즘 자주 듣는 노래 목록으로 가요.",
      { url: "https://music.youtube.com" }),
    app("moon", "달 모양", "moon", "night", "internal", "active", "2026-10-06", "오늘 밤 달이 얼마나 찼는지 보여 줘요."),
    app("vote", "한 번 투표", "chat", "sky", "internal", "beta", "2026-10-04", "링크를 나눠 주면 한 사람이 한 번씩 고를 수 있어요."),
    app("map", "자주 가는 곳", "pin", "leaf", "external", "active", "2026-10-02", "즐겨 찾는 장소를 모아 둔 지도로 가요.",
      { url: "https://www.openstreetmap.org" }),
    app("plants", "식물 물 주기", "leaf", "leaf", "internal", "error", "2026-09-28", "화분마다 물 줄 날을 알려 줘요.",
      { note: "알림 시간이 하루씩 밀려요. 고칠 때까지는 날짜를 한 번 더 확인해 주세요." }),
    app("blog", "개발 일기", "pen", "sand", "external", "active", "2026-09-25", "만들면서 배운 것을 적는 블로그로 가요.",
      { url: "https://velog.io" }),
    app("baseball", "숫자 야구", "target", "rose", "internal", "active", "2026-09-22", "세 자리 숫자를 스트라이크와 볼로 맞혀요."),
    app("typing", "타자 연습", "keyboard", "deep", "internal", "active", "2026-09-20", "짧은 문장을 따라 치며 속도와 정확도를 재요."),
    app("qr", "QR 만들기", "qr", "night", "internal", "active", "2026-09-18", "주소를 넣으면 QR 코드를 만들어 줘요."),
    app("exchange", "환율 계산", "coin", "sand", "internal", "active", "2026-09-15", "원화를 달러와 엔으로 바꾸면 얼마인지 보여 줘요."),
    app("dday", "디데이", "calendar", "aurora", "internal", "active", "2026-09-12", "기다리는 날까지 며칠 남았는지 세요."),
    app("stopwatch", "스톱워치", "clock", "sky", "internal", "active", "2026-09-10", "구간 기록을 남기며 시간을 재요."),
    app("teams", "팀 나누기", "people", "leaf", "internal", "active", "2026-09-08", "이름을 넣으면 공평하게 팀을 나눠 줘요."),
    app("emoji", "표정 모음", "smile", "ember", "internal", "active", "2026-09-05", "자주 쓰는 표정 문자를 눌러서 복사해요."),
    app("laptop", "노트북 사양 비교", "laptop", "night", "external", "active", "2026-09-03", "사양을 나란히 비교한 표로 가요.",
      { url: "https://docs.google.com" }),
    app("clack", "키보드 소리", "wave", "deep", "internal", "active", "2026-09-01", "자판을 누를 때마다 기계식 키보드 소리를 내요."),
    app("designnote", "디자인 노트", "book", "rose", "external", "active", "2026-08-29", "광야를 그린 디자인 파일로 가요.",
      { url: "https://www.figma.com" })
  ];
  var WORST = {
    long: app("worst-long", "주말마다 조금씩 고쳐 쓰는 아주 오래된 할 일 목록 정리 도구", "note", "sand", "internal", "beta", "2026-01-01",
      "처음에는 장보기 목록이었는데 기능을 하나씩 붙이다 보니 반복 일정, 미루기, 태그, 검색까지 들어간 할 일 도구가 됐어요. 화면이 좁아도 이 설명은 줄을 바꿔 끝까지 보여 줘요."),
    one: app("worst-one", "곰", "smile", "ember", "internal", "new", "2026-11-16", ""),
    emoji: app("worst-emoji", "🌵 사보텐 サボテン Кактус", "leaf", "leaf", "external", "active", "2026-11-16", "글자가 섞인 이름도 잘리지 않아요.",
      { url: "https://supercalifragilisticexpialidocious-experiments.northwind-industries-holdings.example.com/playground/apps/very-long-path" }),
    broken: app("worst-broken", "아이콘 없는 앱", "none", "night", "internal", "error", "2026-11-16", "아이콘 파일을 불러오지 못하면 이름의 첫 글자를 보여 줘요.",
      { iconError: true, note: "아이콘을 다시 올리는 중이에요." })
  };
  function findApp(id) {
    for (var i = 0; i < APPS.length; i++) if (APPS[i].id === id) return APPS[i];
    for (var k in WORST) if (WORST[k].id === id) return WORST[k];
    return null;
  }

  /* ---------- 글자, 숫자 ---------- */
  var nf = new Intl.NumberFormat("ko-KR");
  var df = new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric" });
  function firstGrapheme(s) {
    if (window.Intl && Intl.Segmenter) {
      var it = new Intl.Segmenter("ko", { granularity: "grapheme" }).segment(s)[Symbol.iterator]().next();
      return it.value ? it.value.segment : "?";
    }
    return Array.from(s)[0] || "?";
  }
  function hostOf(url) { try { return new URL(url).host; } catch (e) { return url; } }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* ---------- 아이콘 그리기(원본 이미지 역할) ---------- */
  var SRC = 256;
  var iconCache = {};
  function rr(c, x, y, w, h, r) {
    c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r); c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
  }
  function circle(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); }
  function poly(c, pts) { c.beginPath(); c.moveTo(pts[0], pts[1]); for (var i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.closePath(); }
  var SHAPES = {
    dice: function (c, f, a) { rr(c, .24, .24, .52, .52, .1); c.fillStyle = f; c.fill(); c.fillStyle = a;
      [[.38, .38], [.5, .5], [.62, .62]].forEach(function (p) { circle(c, p[0], p[1], .065); c.fill(); }); },
    timer: function (c, f, a) { circle(c, .5, .56, .26); c.fillStyle = f; c.fill(); c.fillStyle = a; poly(c, [.5, .3, .62, .22, .58, .34]); c.fill();
      c.strokeStyle = a; c.lineWidth = .04; c.beginPath(); c.moveTo(.5, .56); c.lineTo(.5, .42); c.moveTo(.5, .56); c.lineTo(.6, .6); c.stroke(); },
    note: function (c, f, a) { rr(c, .28, .2, .44, .6, .05); c.fillStyle = f; c.fill(); c.fillStyle = a;
      for (var i = 0; i < 4; i++) { c.fillRect(.34, .32 + i * .11, i === 3 ? .18 : .32, .04); } },
    palette: function (c, f, a) { circle(c, .5, .5, .28); c.fillStyle = f; c.fill();
      [["--color-error-400", .4, .4], ["--color-warning-300", .58, .36], ["--color-success-400", .66, .52], ["--color-info-400", .4, .6]].forEach(function (d) {
        circle(c, d[1], d[2], .06); c.fillStyle = cssVar(d[0]); c.fill(); }); circle(c, .55, .63, .06); c.fillStyle = a; c.fill(); },
    cloud: function (c, f, a) { c.fillStyle = f; [[.38, .56, .14], [.52, .48, .18], [.64, .58, .12]].forEach(function (d) { circle(c, d[0], d[1], d[2]); c.fill(); });
      c.fillRect(.3, .56, .4, .14); c.fillStyle = a; poly(c, [.5, .72, .44, .84, .5, .82, .46, .92, .58, .78, .52, .8]); c.fill(); },
    link: function (c, f, a) { c.lineWidth = .07; c.strokeStyle = f; rr(c, .2, .38, .34, .22, .11); c.stroke(); c.strokeStyle = a; rr(c, .46, .4, .34, .22, .11); c.stroke(); },
    wallet: function (c, f, a) { rr(c, .2, .32, .6, .4, .06); c.fillStyle = f; c.fill(); rr(c, .56, .46, .24, .12, .04); c.fillStyle = a; c.fill(); },
    book: function (c, f, a) { c.fillStyle = f; poly(c, [.2, .3, .48, .34, .48, .74, .2, .7]); c.fill(); poly(c, [.52, .34, .8, .3, .8, .7, .52, .74]); c.fill();
      c.fillStyle = a; c.fillRect(.48, .34, .04, .4); },
    grid: function (c, f, a) { for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) { c.fillStyle = (i + j) % 2 ? f : a; c.fillRect(.26 + i * .12, .26 + j * .12, .11, .11); } },
    bowl: function (c, f, a) { c.fillStyle = f; c.beginPath(); c.arc(.5, .52, .28, 0, Math.PI); c.closePath(); c.fill();
      c.strokeStyle = a; c.lineWidth = .04; [.4, .5, .6].forEach(function (x) { c.beginPath(); c.moveTo(x, .44); c.quadraticCurveTo(x + .05, .36, x, .28); c.stroke(); }); },
    bolt: function (c, f) { c.fillStyle = f; poly(c, [.56, .16, .3, .54, .48, .54, .42, .84, .7, .44, .52, .44]); c.fill(); },
    mine: function (c, f, a) { c.strokeStyle = f; c.lineWidth = .05; for (var i = 0; i < 4; i++) { var t = i * Math.PI / 4; c.beginPath();
      c.moveTo(.5 + Math.cos(t) * .32, .5 + Math.sin(t) * .32); c.lineTo(.5 - Math.cos(t) * .32, .5 - Math.sin(t) * .32); c.stroke(); }
      circle(c, .5, .5, .2); c.fillStyle = f; c.fill(); circle(c, .44, .44, .05); c.fillStyle = a; c.fill(); },
    star: function (c, f, a) { var p = []; for (var i = 0; i < 10; i++) { var r = i % 2 ? .13 : .3, t = -Math.PI / 2 + i * Math.PI / 5; p.push(.5 + Math.cos(t) * r, .52 + Math.sin(t) * r); }
      poly(c, p); c.fillStyle = f; c.fill(); circle(c, .78, .24, .03); c.fillStyle = a; c.fill(); circle(c, .22, .74, .02); c.fill(); },
    cake: function (c, f, a) { rr(c, .24, .48, .52, .28, .04); c.fillStyle = f; c.fill(); c.fillStyle = a; c.fillRect(.24, .56, .52, .05);
      c.fillRect(.48, .3, .04, .16); circle(c, .5, .26, .04); c.fillStyle = cssVar("--color-warning-300"); c.fill(); },
    music: function (c, f) { c.fillStyle = f; circle(c, .38, .68, .1); c.fill(); circle(c, .64, .62, .1); c.fill();
      c.fillRect(.44, .26, .05, .44); c.fillRect(.7, .22, .05, .42); poly(c, [.44, .26, .75, .2, .75, .3, .44, .36]); c.fill(); },
    moon: function (c, f) { c.fillStyle = f; c.beginPath(); c.arc(.5, .5, .28, Math.PI * .35, Math.PI * 1.65, false);
      c.arc(.62, .44, .22, Math.PI * 1.5, Math.PI * .62, true); c.closePath(); c.fill(); },
    chat: function (c, f, a) { rr(c, .2, .26, .6, .38, .1); c.fillStyle = f; c.fill(); poly(c, [.32, .62, .3, .78, .46, .64]); c.fill();
      c.fillStyle = a; [.36, .5, .64].forEach(function (x) { circle(c, x, .45, .04); c.fill(); }); },
    pin: function (c, f, a) { c.fillStyle = f; c.beginPath(); c.arc(.5, .42, .2, Math.PI, 0); c.lineTo(.5, .82); c.closePath(); c.fill();
      circle(c, .5, .42, .08); c.fillStyle = a; c.fill(); },
    leaf: function (c, f, a) { c.save(); c.translate(.5, .5); c.rotate(-Math.PI / 4); c.beginPath(); c.ellipse(0, 0, .3, .16, 0, 0, Math.PI * 2);
      c.fillStyle = f; c.fill(); c.strokeStyle = a; c.lineWidth = .03; c.beginPath(); c.moveTo(-.28, 0); c.lineTo(.28, 0); c.stroke(); c.restore(); },
    pen: function (c, f, a) { c.save(); c.translate(.5, .5); c.rotate(Math.PI / 4); c.fillStyle = f; c.fillRect(-.07, -.32, .14, .5);
      c.fillStyle = a; poly(c, [-.07, .18, .07, .18, 0, .32]); c.fill(); c.restore(); },
    target: function (c, f, a) { [.3, .2, .1].forEach(function (r, i) { circle(c, .5, .5, r); c.fillStyle = i % 2 ? a : f; c.fill(); }); },
    keyboard: function (c, f, a) { rr(c, .16, .32, .68, .36, .06); c.fillStyle = f; c.fill(); c.fillStyle = a;
      for (var i = 0; i < 5; i++) { c.fillRect(.22 + i * .12, .38, .08, .08); c.fillRect(.22 + i * .12, .5, .08, .08); } c.fillRect(.32, .6, .36, .04); },
    qr: function (c, f, a) { c.fillStyle = f; c.fillRect(.2, .2, .6, .6); c.fillStyle = a;
      [[.24, .24], [.56, .24], [.24, .56]].forEach(function (p) { c.fillRect(p[0], p[1], .2, .2); });
      c.fillStyle = f; [[.28, .28], [.6, .28], [.28, .6]].forEach(function (p) { c.fillRect(p[0], p[1], .12, .12); });
      c.fillStyle = a; [[.56, .56], [.68, .6], [.6, .7], [.72, .72]].forEach(function (p) { c.fillRect(p[0], p[1], .06, .06); }); },
    coin: function (c, f, a) { circle(c, .5, .5, .28); c.fillStyle = f; c.fill(); circle(c, .5, .5, .2); c.strokeStyle = a; c.lineWidth = .04; c.stroke();
      c.fillStyle = a; c.fillRect(.47, .38, .06, .24); },
    calendar: function (c, f, a) { rr(c, .22, .24, .56, .54, .06); c.fillStyle = f; c.fill(); c.fillStyle = a; c.fillRect(.22, .24, .56, .12);
      for (var i = 0; i < 3; i++) for (var j = 0; j < 2; j++) c.fillRect(.3 + i * .14, .46 + j * .14, .08, .08); },
    clock: function (c, f, a) { circle(c, .5, .5, .28); c.fillStyle = f; c.fill(); c.strokeStyle = a; c.lineWidth = .045;
      c.beginPath(); c.moveTo(.5, .5); c.lineTo(.5, .32); c.moveTo(.5, .5); c.lineTo(.64, .5); c.stroke(); c.fillStyle = a; c.fillRect(.46, .14, .08, .06); },
    people: function (c, f, a) { c.fillStyle = a; circle(c, .64, .4, .09); c.fill(); rr(c, .52, .52, .24, .22, .1); c.fill();
      c.fillStyle = f; circle(c, .4, .4, .1); c.fill(); rr(c, .26, .52, .28, .26, .12); c.fill(); },
    smile: function (c, f, a) { circle(c, .5, .5, .28); c.fillStyle = f; c.fill(); c.fillStyle = a; circle(c, .41, .44, .04); c.fill(); circle(c, .59, .44, .04); c.fill();
      c.strokeStyle = a; c.lineWidth = .04; c.beginPath(); c.arc(.5, .52, .14, Math.PI * .15, Math.PI * .85); c.stroke(); },
    laptop: function (c, f, a) { rr(c, .26, .26, .48, .34, .03); c.fillStyle = f; c.fill(); c.fillStyle = a; c.fillRect(.3, .3, .4, .26);
      c.fillStyle = f; poly(c, [.18, .66, .82, .66, .76, .74, .24, .74]); c.fill(); },
    wave: function (c, f) { c.fillStyle = f; [.3, .5, .7, .45, .25].forEach(function (h, i) { c.fillRect(.24 + i * .11, .5 - h / 2, .07, h); }); }
  };
  function iconSource(a) {
    if (iconCache[a.id]) return iconCache[a.id];
    var cv = document.createElement("canvas"); cv.width = cv.height = SRC;
    var c = cv.getContext("2d"); c.scale(SRC, SRC);
    var t = TONES[a.tone] || TONES.night;
    var g = c.createLinearGradient(0, 0, 1, 1); g.addColorStop(0, cssVar(t[0])); g.addColorStop(1, cssVar(t[1]));
    rr(c, .04, .04, .92, .92, .3); c.fillStyle = g; c.fill(); /* 16칸으로 줄였을 때 네 모서리가 한 칸씩 깎이는 둥글기 */
    (SHAPES[a.shape] || function () {})(c, cssVar(t[2]), cssVar(t[3]));
    iconCache[a.id] = cv;
    return cv;
  }

  /* ---------- 픽셀 필터: WebGL, 안 되면 Canvas 2D ----------
     아이콘마다 k-means 로 자기 색 COLORS 개를 뽑고, 16x16 칸마다 4x4 표본 중 가장 많이 나온 색 하나로 칠한다.
     중간색을 만들지 않고 디더링도 쓰지 않는다. */
  var GRID = parseFloat(cssVar("--pixel-grid")) || 16;
  var COLORS = Math.min(8, parseFloat(cssVar("--pixel-colors")) || 6);
  var SUB = 4;
  var palCache = {}, srcData = {};
  function lumOf(c) { return c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11; }
  function dist(a, b) { var r = a[0] - b[0], g = a[1] - b[1], bl = a[2] - b[2]; return r * r * 0.3 + g * g * 0.59 + bl * bl * 0.11; }
  function pixelsOf(src, n) {
    var c = document.createElement("canvas"); c.width = c.height = n;
    var x = c.getContext("2d", { willReadFrequently: true }); x.imageSmoothingEnabled = false;
    x.drawImage(src, 0, 0, n, n);
    return x.getImageData(0, 0, n, n).data;
  }
  function paletteOf(id, src) {
    if (palCache[id]) return palCache[id];
    var d = pixelsOf(src, 48), pts = [];
    for (var i = 0; i < d.length; i += 4) if (d[i + 3] >= 128) pts.push([d[i] / 255, d[i + 1] / 255, d[i + 2] / 255]);
    if (!pts.length) return (palCache[id] = [[0, 0, 0]]);
    pts.sort(function (a, b) { return lumOf(a) - lumOf(b); });
    var k = Math.min(COLORS, pts.length), cen = [];
    for (var q = 0; q < k; q++) cen.push(pts[Math.floor((q + 0.5) * pts.length / k)].slice());
    for (var it = 0; it < 12; it++) {
      var sum = cen.map(function () { return [0, 0, 0, 0]; });
      pts.forEach(function (p) {
        var bi = 0, be = 9;
        for (var m = 0; m < cen.length; m++) { var e = dist(p, cen[m]); if (e < be) { be = e; bi = m; } }
        sum[bi][0] += p[0]; sum[bi][1] += p[1]; sum[bi][2] += p[2]; sum[bi][3]++;
      });
      sum.forEach(function (s, m) { if (s[3]) cen[m] = [s[0] / s[3], s[1] / s[3], s[2] / s[3]]; });
    }
    var out = [];
    cen.forEach(function (c) { if (!out.some(function (o) { return dist(o, c) < 0.002; })) out.push(c); });
    return (palCache[id] = out);
  }
  /* 경계에 걸린 표본 위치를 왼쪽 절반은 내림, 오른쪽 절반은 올림-1 로 골라 거울처럼 맞춘다 */
  function pick(pos, n) { var k = pos < n / 2 ? Math.floor(pos) : Math.ceil(pos) - 1; return Math.max(0, Math.min(n - 1, k)); }
  function nearestIdx(c, pal) { var bi = 0, be = 9; for (var m = 0; m < pal.length; m++) { var e = dist(c, pal[m]); if (e < be) { be = e; bi = m; } } return bi; }
  var Pixel = (function () {
    var gl = null, tex = null, cv = null, loc = {}, ready = false, tried = false;
    var VS = "attribute vec2 p; varying vec2 uv; void main(){ uv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }";
    var FS = [
      "precision mediump float;",
      "varying vec2 uv; uniform sampler2D tex; uniform float grid; uniform float count; uniform vec3 pal[8];",
      "float nearest(vec3 c){ float best = 100.0; float bi = 0.0;",
      "  for (int m = 0; m < 8; m++) { if (float(m) >= count) break; vec3 d = c - pal[m]; float e = dot(d * d, vec3(0.3, 0.59, 0.11)); if (e < best) { best = e; bi = float(m); } }",
      "  return bi; }",
      "void main(){",
      "  vec2 cell = floor(uv * grid);",
      "  float votes[8]; for (int m = 0; m < 8; m++) { votes[m] = 0.0; }",
      "  float opaque = 0.0;",
      "  for (int i = 0; i < 4; i++) { for (int j = 0; j < 4; j++) {",
      "    vec4 t = texture2D(tex, (cell + (vec2(float(i), float(j)) + 0.5) / 4.0) / grid);",
      "    if (t.a < 0.5) continue;",
      "    opaque += 1.0;",
      "    float n = nearest(t.rgb / t.a);",
      "    for (int m = 0; m < 8; m++) { if (float(m) == n) { votes[m] += 1.0; } }",
      "  } }",
      "  if (opaque < 8.0) { gl_FragColor = vec4(0.0); return; }",
      "  float best = -1.0; vec3 pick = pal[0];",
      "  for (int m = 0; m < 8; m++) { if (float(m) >= count) break; if (votes[m] > best) { best = votes[m]; pick = pal[m]; } }",
      "  gl_FragColor = vec4(pick, 1.0);",
      "}"
    ].join("\n");
    function init() {
      tried = true;
      try {
        cv = document.createElement("canvas");
        gl = cv.getContext("webgl", { premultipliedAlpha: false, preserveDrawingBuffer: true });
        if (!gl) return;
        function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
          if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
        var prog = gl.createProgram();
        gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error("link");
        gl.useProgram(prog);
        var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        var p = gl.getAttribLocation(prog, "p"); gl.enableVertexAttribArray(p); gl.vertexAttribPointer(p, 2, gl.FLOAT, false, 0, 0);
        tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
        /* 표본 위치가 원본 픽셀 경계에 걸리므로 NEAREST 는 한쪽으로 치우친다. LINEAR 로 양쪽을 섞어 읽어 좌우, 상하를 맞춘다 */
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        loc.grid = gl.getUniformLocation(prog, "grid"); loc.count = gl.getUniformLocation(prog, "count"); loc.pal = gl.getUniformLocation(prog, "pal");
        cv.addEventListener("webglcontextlost", function (e) { e.preventDefault(); ready = false; });
        ready = true;
      } catch (e) { ready = false; }
    }
    function viaGL(src, out, grid, pal) {
      cv.width = cv.height = grid;
      gl.viewport(0, 0, grid, grid);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      var flat = new Float32Array(24); pal.forEach(function (c, m) { flat[m * 3] = c[0]; flat[m * 3 + 1] = c[1]; flat[m * 3 + 2] = c[2]; });
      gl.uniform3fv(loc.pal, flat); gl.uniform1f(loc.count, pal.length); gl.uniform1f(loc.grid, grid);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      var x = out.getContext("2d"); x.clearRect(0, 0, grid, grid); x.drawImage(cv, 0, 0);
    }
    function via2D(id, src, out, grid, pal) {
      var n = src.width, d = srcData[id] || (srcData[id] = pixelsOf(src, n));
      var x = out.getContext("2d"), img = x.createImageData(grid, grid), px = img.data;
      for (var cy = 0; cy < grid; cy++) for (var cx = 0; cx < grid; cx++) {
        var votes = pal.map(function () { return 0; }), opaque = 0;
        for (var i = 0; i < SUB; i++) for (var j = 0; j < SUB; j++) {
          var sx = pick((cx + (i + 0.5) / SUB) / grid * n, n), sy = pick((cy + (j + 0.5) / SUB) / grid * n, n), o = (sy * n + sx) * 4;
          if (d[o + 3] < 128) continue;
          opaque++; votes[nearestIdx([d[o] / 255, d[o + 1] / 255, d[o + 2] / 255], pal)]++;
        }
        var q = (cy * grid + cx) * 4;
        if (opaque < SUB * SUB / 2) { px[q + 3] = 0; continue; }
        var bi = 0; for (var m = 1; m < votes.length; m++) if (votes[m] > votes[bi]) bi = m;
        px[q] = pal[bi][0] * 255; px[q + 1] = pal[bi][1] * 255; px[q + 2] = pal[bi][2] * 255; px[q + 3] = 255;
      }
      x.putImageData(img, 0, 0);
    }
    return {
      render: function (src, out, grid, id) {
        if (!tried) init();
        var pal = paletteOf(id, src);
        out.width = out.height = grid;
        if (ready) { try { viaGL(src, out, grid, pal); return; } catch (e) { ready = false; } }
        via2D(id, src, out, grid, pal);
      },
      engine: function () { if (!tried) init(); return ready ? "WebGL" : "Canvas 2D"; }
    };
  })();

  /* ---------- 아이콘 칠하기: 늘 픽셀로 보여 준다 ---------- */
  function paintIcon(canvas) {
    var a = findApp(canvas.getAttribute("data-icon"));
    if (!a || a.iconError) return;
    Pixel.render(iconSource(a), canvas, GRID, a.id);
    canvas.classList.add("is-pixel");
  }
  function syncEngine() {
    document.querySelectorAll("[data-engine]").forEach(function (n) { n.textContent = Pixel.engine(); });
  }

  /* ---------- 조각 만들기 ---------- */
  var STATUS = {
    "new": { cls: "info", glyph: "+", label: "신규" },
    beta: { cls: "warning", glyph: "β", label: "베타" },
    error: { cls: "error", glyph: "!", label: "오류" }
  };
  function iconCanvas(a) {
    if (a.iconError) { var f = el("span", "icon icon-fallback", firstGrapheme(a.name)); f.setAttribute("aria-hidden", "true"); return f; }
    var cv = el("canvas", "icon"); cv.setAttribute("data-icon", a.id); cv.setAttribute("aria-hidden", "true");
    return cv;
  }
  function whereTo(a) { return a.kind === "external" ? hostOf(a.url) + ", 새 탭에서 열려요." : "광야 안에서 열려요."; }
  function actionLabel(a) { return a.kind === "external" ? "바로가기" : "사용하기"; }
  function badge(cls, glyph, text) {
    var s = el("span", "badge px " + cls);
    if (glyph) { var g = el("span", "badge-glyph", glyph); g.setAttribute("aria-hidden", "true"); s.appendChild(g); }
    s.appendChild(el("span", "", text));
    return s;
  }
  /* 키 한 칸: 본체(누르면 열기), 왼쪽 위 상태 표시, 오른쪽 위 설명 버튼 */
  function makeKey(a, flags) {
    flags = flags || {};
    var slot = el("div", "key-slot");
    var b = el("button", "key px"); b.type = "button"; slot.appendChild(b);
    if (!a) { b.className = "key key-empty px"; b.disabled = true; b.tabIndex = -1; slot.setAttribute("aria-hidden", "true"); return slot; }
    if (a === "loading") { b.className = "key key-loading px"; b.disabled = true; b.tabIndex = -1; b.appendChild(el("span", "key-dots", "…")); slot.setAttribute("aria-hidden", "true"); return slot; }
    var st = STATUS[a.status];
    b.setAttribute("data-id", a.id);
    b.setAttribute("aria-label", a.name + (st ? ", " + st.label : ""));
    b.setAttribute("aria-keyshortcuts", "i");
    b.appendChild(iconCanvas(a));
    ["hover", "pressed", "focus"].forEach(function (f) { if (flags[f]) slot.classList.add("is-" + f); });
    if (st) { var tg = el("span", "tag px " + st.cls, st.glyph); tg.setAttribute("aria-hidden", "true"); slot.appendChild(tg); }
    var info = el("button", "key-info px", "i"); info.type = "button"; info.tabIndex = -1;
    info.setAttribute("data-info", a.id); info.setAttribute("aria-label", a.name + " 설명 보기");
    info.setAttribute("aria-haspopup", "dialog"); info.setAttribute("aria-expanded", String(!!flags.infoOpen));
    if (flags.infoHover) info.classList.add("is-hover");
    if (flags.infoOpen) slot.classList.add("is-open");
    slot.appendChild(info);
    return slot;
  }
  /* 설명 말풍선: 꼬리는 말풍선 판 밖에 있어야 해서 감싸는 상자를 하나 더 둔다 */
  function makeBubble(a, opts) {
    opts = opts || {};
    var w = el("div", "bubble-wrap" + (opts.above ? " is-above" : ""));
    w.setAttribute("role", "dialog"); w.setAttribute("aria-label", a.name + " 설명");
    var tail = el("span", "bubble-tail"); tail.setAttribute("aria-hidden", "true");
    var p = el("div", "bubble px");
    var head = el("div", "b-head"); head.appendChild(el("p", "b-name", a.name));
    var st = STATUS[a.status]; if (st) head.appendChild(badge(st.cls, st.glyph, st.label));
    p.appendChild(head);
    if (a.summary) p.appendChild(el("p", "b-summary", a.summary));
    if (a.note) p.appendChild(el("p", "b-note " + (a.status === "error" ? "is-error" : "is-warning"), a.note));
    p.appendChild(el("p", "b-where muted", whereTo(a)));
    p.appendChild(el("p", "b-date muted", "올린 날 " + df.format(new Date(a.addedAt + "T00:00:00"))));
    var btn = el("button", "btn-primary px", actionLabel(a)); btn.type = "button";
    ["hover", "pressed", "focus"].forEach(function (f) { if (opts[f]) btn.classList.add("is-" + f); });
    if (opts.onAct) btn.addEventListener("click", function () { opts.onAct(a); });
    p.appendChild(btn);
    w.appendChild(tail); w.appendChild(p);
    return w;
  }

  /* ---------- 런처 화면 ---------- */
  function gridFor(width) {
    return width >= parseFloat(cssVar("--breakpoint-tablet")) ? [5, 5] : [3, 3];
  }
  function mountApp(host) {
    var st = {
      page: 0,
      state: host.getAttribute("data-state") || "ready",
      apps: APPS,
      refocus: null,
      cleanup: null,
      openId: host.getAttribute("data-open") || null
    };
    if (host.getAttribute("data-dataset") === "many") {
      st.apps = []; for (var i = 0; i < 1284; i++) st.apps.push(APPS[i % APPS.length]);
    }
    /* 다시 그리는 것은 view 뿐이다. 알림 영역과 이름표는 처음 한 번만 만든다 */
    var view = el("div", "app-view"); host.appendChild(view);
    var live = el("p", "sr-only"); live.setAttribute("aria-live", "polite"); host.appendChild(live);
    var tip = el("div", "tip px"); tip.setAttribute("role", "tooltip"); tip.hidden = true; host.appendChild(tip);
    var tipTimer = 0, tipHiddenAt = -1e9, pop = null, popKey = null;

    function say(text) { live.textContent = ""; setTimeout(function () { live.textContent = text; }, 50); }
    function layout() {
      var w = host.getBoundingClientRect().width || host.offsetWidth, g = gridFor(w), per = g[0] * g[1];
      return { cols: g[0], per: per, pages: Math.max(1, Math.ceil(st.apps.length / per)) };
    }
    function fillPage(pg, p, per) {
      if (pg.childElementCount) return;
      var count = st.state === "ready" ? st.apps.length : 0;
      for (var k = 0; k < per; k++) {
        var idx = p * per + k;
        if (st.state === "loading") pg.appendChild(makeKey("loading"));
        else if (idx < count) pg.appendChild(makeKey(st.apps[idx]));
        else pg.appendChild(makeKey(null));
      }
    }
    function act(a) {
      closeBubble(false);
      var note = view.querySelector(".deck-note");
      var text = "시안이라 열지 않아요. 실제 화면에서는 " + (a.kind === "external" ? hostOf(a.url) + " 을 새 탭에서 열어요." : a.name + " 화면으로 가요.");
      if (note) note.textContent = text;
      say(text);
    }
    function render() {
      if (st.cleanup) { st.cleanup(); st.cleanup = null; }
      hideTip(true); closeBubble(false, true);
      var L = layout();
      st.page = Math.min(st.page, L.pages - 1);
      view.innerHTML = "";
      host.style.setProperty("--cols", L.cols);

      var gnb = el("header", "gnb");
      var brand = el("h1", "brand"); brand.appendChild(el("span", "brand-ko", "광야")); brand.appendChild(el("span", "brand-en muted", "wilderness"));
      gnb.appendChild(brand); view.appendChild(gnb);

      var main = el("div", "main");
      var deck = el("section", "deck"); deck.setAttribute("aria-label", "앱 목록"); deck.tabIndex = -1;
      var head = el("div", "deck-head");
      head.appendChild(el("h2", "deck-title", "광야에 세워 둔 앱"));
      head.appendChild(el("span", "deck-count muted", st.state === "loading" ? "불러오는 중…" : st.state === "ready" ? nf.format(st.apps.length) + "개" : "0개"));
      deck.appendChild(head);

      var chassis = el("div", "chassis px"), viewport = null, track = null;
      if (st.state === "error") {
        var er = el("div", "deck-msg");
        er.appendChild(el("p", "", "앱 목록을 불러오지 못했어요."));
        er.appendChild(el("p", "muted", "인터넷 연결을 확인하고 다시 불러와 주세요."));
        var rb = el("button", "btn-secondary px", "다시 불러오기"); rb.type = "button";
        rb.addEventListener("click", function () {
          st.state = "loading"; st.refocus = "deck"; render(); say("앱 목록을 다시 불러오는 중이에요.");
          setTimeout(function () { st.state = "ready"; st.refocus = "entry"; render(); say("앱 " + nf.format(st.apps.length) + "개를 불러왔어요."); }, 700);
        });
        er.appendChild(rb); chassis.appendChild(er);
      } else {
        viewport = el("div", "viewport"); track = el("div", "track");
        var pageCount = st.state === "ready" ? L.pages : 1;
        for (var p = 0; p < pageCount; p++) {
          var pg = el("div", "deck-page");
          pg.setAttribute("aria-hidden", String(p !== st.page));
          track.appendChild(pg);
          if (Math.abs(p - st.page) <= 1) fillPage(pg, p, L.per); /* 보이는 쪽과 양옆 쪽만 미리 그린다 */
        }
        track.style.transform = "translateX(" + (-st.page * 100) + "%)";
        viewport.appendChild(track); chassis.appendChild(viewport);
        if (st.state === "empty") {
          var em = el("div", "deck-msg deck-msg-over px");
          em.appendChild(el("p", "", "아직 세워 둔 앱이 없어요."));
          em.appendChild(el("p", "muted", "첫 앱이 올라오면 여기에 키가 생겨요."));
          chassis.appendChild(em);
        }
      }
      deck.appendChild(chassis);

      if (st.state === "ready" && L.pages > 1) {
        var pager = el("nav", "pager"); pager.setAttribute("aria-label", "쪽 넘기기");
        var prev = el("button", "btn-secondary px pager-btn", "이전"); prev.type = "button"; prev.disabled = st.page === 0; prev.setAttribute("data-role", "prev");
        var num = el("span", "page-num", nf.format(st.page + 1) + " / " + nf.format(L.pages));
        var next = el("button", "btn-secondary px pager-btn", "다음"); next.type = "button"; next.disabled = st.page >= L.pages - 1; next.setAttribute("data-role", "next");
        prev.addEventListener("click", function () { go(st.page - 1, "prev"); });
        next.addEventListener("click", function () { go(st.page + 1, "next"); });
        pager.appendChild(prev); pager.appendChild(num); pager.appendChild(next);
        deck.appendChild(pager);
      }
      if (st.state === "ready") deck.appendChild(el("p", "deck-note muted", "키를 누르면 앱이 열리고, 오른쪽 위 i 를 누르면 설명이 나와요."));
      main.appendChild(deck);
      view.appendChild(main);
      wire(viewport, track, L.pages);
      paintIn(view);
      restoreFocus();
      if (st.openId) { var id = st.openId; st.openId = null; openBubble(id, false); }
    }
    function restoreFocus() {
      var r = st.refocus; st.refocus = null;
      if (!r) return;
      var n = null, cur = view.querySelectorAll('.deck-page[aria-hidden="false"] .key[data-id]');
      if (r === "prev" || r === "next") {
        n = view.querySelector('[data-role="' + r + '"]');
        if (n && n.disabled) n = view.querySelector('[data-role="' + (r === "prev" ? "next" : "prev") + '"]');
      } else if (r === "deck") n = view.querySelector(".deck");
      else if (r === "entry") n = view.querySelector('.key[tabindex="0"]');
      else if (r === "first") n = cur[0];
      else if (r === "last") n = cur[cur.length - 1];
      if (n) n.focus({ preventScroll: true });
    }
    function go(p, refocus, settle) {
      var L = layout(), target = Math.max(0, Math.min(L.pages - 1, p));
      var track = view.querySelector(".track");
      closeBubble(false);
      if (target === st.page) { if (track) { track.classList.remove("is-dragging"); track.style.transform = "translateX(" + (-st.page * 100) + "%)"; } return; }
      st.page = target;
      if (refocus) st.refocus = refocus;
      if (st.cleanup) { st.cleanup(); st.cleanup = null; }
      function finish() { if (st.cleanup) { st.cleanup(); st.cleanup = null; } render(); say(nf.format(st.page + 1) + "쪽, 전체 " + nf.format(L.pages) + "쪽"); }
      if (!track || reduceMotion.matches) { finish(); return; }
      var pg = track.children[target];
      if (pg && !pg.childElementCount) { fillPage(pg, target, L.per); paintIn(pg); }
      track.classList.remove("is-dragging");
      track.classList.toggle("is-settling", !!settle);
      track.style.transform = "translateX(" + (-target * 100) + "%)";
      function onEnd(e) { if (e.target === track && e.propertyName === "transform") finish(); }
      var timer = setTimeout(finish, ms("--motion-duration-slow") + 100);
      track.addEventListener("transitionend", onEnd);
      st.cleanup = function () { clearTimeout(timer); track.removeEventListener("transitionend", onEnd); };
    }

    /* 이름표 */
    function placeTip(key, animate) {
      var a = findApp(key.getAttribute("data-id")); if (!a) return;
      tip.textContent = a.name; tip.hidden = false;
      var hr = host.getBoundingClientRect(), kr = key.getBoundingClientRect(), gap = parseFloat(cssVar("--space-2"));
      var tw = tip.offsetWidth, th = tip.offsetHeight;
      var left = Math.max(0, Math.min(hr.width - tw, kr.left - hr.left + kr.width / 2 - tw / 2));
      var top = kr.top - hr.top - th - gap;
      if (top < 0) top = kr.bottom - hr.top + gap;
      tip.style.left = left + "px"; tip.style.top = top + "px";
      if (animate) { tip.classList.remove("no-anim", "is-in"); void tip.offsetWidth; tip.classList.add("is-in"); }
      else { tip.classList.add("no-anim", "is-in"); }
    }
    function showTip(key, viaKeyboard) {
      if (pop && popKey === key) return;
      clearTimeout(tipTimer);
      var open = !tip.hidden || performance.now() - tipHiddenAt < ms("--motion-delay-tip-skip");
      if (viaKeyboard) { placeTip(key, !open); return; }
      if (open) { placeTip(key, false); return; }
      tipTimer = setTimeout(function () { placeTip(key, true); }, ms("--motion-delay-tip"));
    }
    function hideTip(silent) {
      clearTimeout(tipTimer);
      if (!tip.hidden && !silent) tipHiddenAt = performance.now();
      tip.hidden = true; tip.classList.remove("is-in");
    }

    /* 설명 말풍선 */
    function onOutside(e) { if (pop && !pop.contains(e.target) && !(e.target.closest && e.target.closest(".key-info"))) closeBubble(false); }
    function onEsc(e) { if (e.key === "Escape" && pop) { e.preventDefault(); closeBubble(true); } }
    function closeBubble(returnFocus, silent) {
      if (!pop) return;
      var key = popKey, slot = key && key.parentNode;
      if (slot) { slot.classList.remove("is-open"); var info = slot.querySelector(".key-info"); if (info) info.setAttribute("aria-expanded", "false"); }
      pop.remove(); pop = null; popKey = null;
      document.removeEventListener("pointerdown", onOutside, true);
      document.removeEventListener("keydown", onEsc, true);
      if (returnFocus && key && key.isConnected) key.focus({ preventScroll: true });
    }
    function openBubble(id, viaKeyboard) {
      var key = view.querySelector('.deck-page[aria-hidden="false"] .key[data-id="' + id + '"]');
      if (!key) return;
      if (pop && popKey === key) { closeBubble(viaKeyboard); return; }
      closeBubble(false); hideTip(true);
      var a = findApp(id), slot = key.parentNode, info = slot.querySelector(".key-info");
      pop = makeBubble(a, { onAct: act }); popKey = key;
      slot.classList.add("is-open"); info.setAttribute("aria-expanded", "true");
      host.appendChild(pop);
      var hr = host.getBoundingClientRect(), sr = slot.getBoundingClientRect(), ir = info.getBoundingClientRect();
      var gap = parseFloat(cssVar("--space-2")), edge = parseFloat(cssVar("--space-4"));
      var pw = pop.offsetWidth, ph = pop.offsetHeight, cx = ir.left - hr.left + ir.width / 2;
      var left = Math.max(edge, Math.min(hr.width - pw - edge, cx - pw / 2));
      var top = sr.bottom - hr.top + gap, above = false;
      if (top + ph > hr.height && sr.top - hr.top - gap - ph >= 0) { top = sr.top - hr.top - gap - ph; above = true; }
      pop.classList.toggle("is-above", above);
      pop.style.left = left + "px"; pop.style.top = top + "px";
      pop.style.setProperty("--tail-x", (cx - left) + "px");
      void pop.offsetWidth; pop.classList.add("is-in");
      document.addEventListener("pointerdown", onOutside, true);
      document.addEventListener("keydown", onEsc, true);
      if (viaKeyboard) pop.querySelector(".btn-primary").focus({ preventScroll: true });
      say(a.name + " 설명을 열었어요.");
    }

    function wire(viewport, track, pages) {
      /* roving tabindex: 지금 쪽의 키 중 하나만 Tab 으로 들어가고, 나머지는 방향키로 간다 */
      var cur = view.querySelectorAll('.deck-page[aria-hidden="false"] .key[data-id]');
      view.querySelectorAll(".key").forEach(function (k) { k.tabIndex = k === cur[0] ? 0 : -1; });
      view.querySelectorAll(".key-info[data-info]").forEach(function (b) {
        b.addEventListener("click", function () { openBubble(b.getAttribute("data-info"), false); });
      });
      view.querySelectorAll(".key[data-id]").forEach(function (k) {
        k.addEventListener("click", function () { var a = findApp(k.getAttribute("data-id")); if (a) act(a); });
        k.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse" && canHover.matches) showTip(k, false); });
        k.addEventListener("pointerleave", function () { hideTip(false); });
        k.addEventListener("focus", function () { if (k.matches(":focus-visible")) showTip(k, true); });
        k.addEventListener("blur", function () { hideTip(false); });
        k.addEventListener("keydown", function (e) {
          if (e.key === "i" || e.key === "I") { e.preventDefault(); openBubble(k.getAttribute("data-id"), true); return; }
          var cols = parseInt(host.style.getPropertyValue("--cols"), 10) || 3;
          var keys = Array.prototype.slice.call(view.querySelectorAll('.deck-page[aria-hidden="false"] .key[data-id]'));
          var i = keys.indexOf(k), j = -1;
          if (e.key === "ArrowRight") j = i + 1; else if (e.key === "ArrowLeft") j = i - 1;
          else if (e.key === "ArrowDown") j = i + cols; else if (e.key === "ArrowUp") j = i - cols; else return;
          e.preventDefault();
          if (j >= 0 && j < keys.length) { k.tabIndex = -1; keys[j].tabIndex = 0; keys[j].focus(); }
          else if (e.key === "ArrowRight" && st.page < pages - 1) go(st.page + 1, "first");
          else if (e.key === "ArrowLeft" && st.page > 0) go(st.page - 1, "last");
        });
      });
      if (!viewport || pages < 2) return;
      var x0 = null, dx = 0, pid = null;
      viewport.addEventListener("pointerdown", function (e) { if (e.pointerType === "mouse" || (e.target.closest && e.target.closest(".key-info"))) return; x0 = e.clientX; dx = 0; pid = e.pointerId; });
      viewport.addEventListener("pointermove", function (e) {
        if (x0 === null || e.pointerId !== pid) return;
        dx = e.clientX - x0;
        var atEdge = (st.page === 0 && dx > 0) || (st.page === pages - 1 && dx < 0);
        var shown = atEdge ? dx / 3 : dx; /* 양 끝에서는 손가락 이동의 1/3만 따라간다 */
        if (Math.abs(dx) > 6) { closeBubble(false); track.classList.add("is-dragging"); track.style.transform = "translateX(calc(" + (-st.page * 100) + "% + " + shown + "px))"; }
      });
      function end() {
        if (x0 === null) return;
        var wv = viewport.getBoundingClientRect().width;
        if (dx < -wv * 0.15 && st.page < pages - 1) go(st.page + 1, null, true);
        else if (dx > wv * 0.15 && st.page > 0) go(st.page - 1, null, true);
        else { track.classList.remove("is-dragging"); track.classList.add("is-settling"); track.style.transform = "translateX(" + (-st.page * 100) + "%)"; }
        x0 = null;
      }
      viewport.addEventListener("pointerup", end); viewport.addEventListener("pointercancel", end);
    }
    render();
    if (window.ResizeObserver) {
      var lastCols = layout().cols; /* 처음 한 번 부르는 콜백에서 다시 그리지 않게 한다 */
      new ResizeObserver(function () { var c = layout().cols; if (c !== lastCols) { lastCols = c; render(); } }).observe(host);
    }
  }
  function paintIn(scope) {
    scope.querySelectorAll("canvas[data-icon]").forEach(function (c) { paintIcon(c); });
    syncEngine();
  }

  /* ---------- 컴포넌트 명세 칸 ---------- */
  function mountSpec(n) {
    var kind = n.getAttribute("data-render"), a = findApp(n.getAttribute("data-app") || "dice");
    var flags = {}; (n.getAttribute("data-flags") || "").split(/\s+/).forEach(function (f) { if (f) flags[f] = true; });
    var node;
    if (kind === "key") {
      node = el("div", "spec-key");
      var key = flags.empty ? makeKey(null) : flags.loading ? makeKey("loading") : makeKey(a, flags);
      if (flags.tip) node.appendChild(el("div", "tip tip-static px is-in", a.name));
      node.appendChild(key);
      if (flags.infoOpen) { var b = makeBubble(a, {}); b.classList.add("is-static", "is-in"); node.appendChild(b); node.classList.add("spec-key-open"); }
    } else if (kind === "bubble") {
      node = makeBubble(a, flags); node.classList.add("is-static", "is-in");
    } else if (kind === "pager") {
      node = el("nav", "pager");
      var total = +(n.getAttribute("data-total") || 4), cur = +(n.getAttribute("data-page") || 1);
      var pv = el("button", "btn-secondary px pager-btn", "이전"); pv.type = "button"; pv.disabled = cur <= 1;
      var nx = el("button", "btn-secondary px pager-btn", "다음"); nx.type = "button"; nx.disabled = cur >= total;
      if (flags.hover) nx.classList.add("is-hover"); if (flags.pressed) nx.classList.add("is-pressed"); if (flags.focus) nx.classList.add("is-focus");
      node.appendChild(pv); node.appendChild(el("span", "page-num", nf.format(cur) + " / " + nf.format(total))); node.appendChild(nx);
    } else if (kind === "button") {
      node = el("button", "btn-" + (n.getAttribute("data-variant") || "primary") + " px", n.getAttribute("data-label") || "사용하기");
      node.type = "button";
      ["hover", "pressed", "focus"].forEach(function (f) { if (flags[f]) node.classList.add("is-" + f); });
      if (flags.disabled) node.disabled = true;
    } else if (kind === "badge") {
      var s = STATUS[n.getAttribute("data-status")];
      node = s ? badge(s.cls, s.glyph, s.label) : badge("kind", "", n.getAttribute("data-label") || "");
    }
    if (node) { n.innerHTML = ""; n.appendChild(node); paintIn(n); }
  }

  /* ---------- 시작 ---------- */
  function start() {
    document.querySelectorAll("[data-app-frame]").forEach(mountApp);
    document.querySelectorAll("[data-render]").forEach(mountSpec);
    paintIn(document);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start, start); else start();
})();
