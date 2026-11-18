# AGENTS.md

이 저장소는 GitHub Pages로 공개하는 정적 사이트다. 공개(PUBLIC) 저장소이므로 커밋한 파일은 누구나 볼 수 있다.

- 사이트 제목: Daljin's Home. 저장소 이름(wilderness)과 디자인 컨셉 이름(광야)은 화면에 쓰지 않는다.
- 사이트 주소: https://jangdaljin.github.io/wilderness/
- 이 파일은 모든 에이전트가 따르는 공통 지침이다.

## 구조

- `static/`: 사이트 파일. 이 폴더만 배포된다.
- `static/index.html`: 첫 화면(터미널). 앱 목록은 이 파일의 `[data-apps]` 링크 목록 하나에만 둔다.
- `static/css/site.css`, `static/js/site.js`: 사이트 공용 스타일과 터미널 스크립트.
- `static/apps/<이름>/`: 사이트 안에서 여는 앱. 첫 화면에서는 창(iframe)으로 열린다. 앱마다 폴더 하나.
- `static/fonts/`: 사이트 글꼴과 그 라이선스 파일.
- `design/<컨셉>/`: 디자인 토큰(`tokens.json`)과 승인된 시안 HTML, 시안용 CSS와 JS. 배포되지 않는다.
- `.github/workflows/pages.yml`: `main`에 `static/` 변경이 push되면 GitHub Actions로 배포한다.
- 그 밖의 루트 파일: 에이전트 지침, 저장소 설정, 문서. 배포되지 않는다.

## 규칙

- 사이트에 보여야 하는 파일은 모두 `static/` 안에 둔다. 루트에 HTML, CSS, JS를 두지 않는다.
- 디자인 결과물은 `design/`에만 두고 `static/`에 넣지 않는다. 사이트 코드는 `design/` 파일을 불러오지 않는다. 구현할 때는 `design/<컨셉>/tokens.json`의 값을 `static/` 코드로 옮겨 쓴다.
- 글꼴처럼 라이선스가 있는 외부 리소스를 `static/`에 넣을 때는 원본 라이선스 파일을 옆에 함께 둔다(예: `static/fonts/OFL.txt`).
- 빌드 도구 없이 브라우저가 바로 읽는 HTML, CSS, JS만 쓴다. 빌드 도구나 패키지 매니저를 들이려면 먼저 사용자에게 묻는다.
- `static/` 안의 링크와 리소스 경로는 상대 경로로 쓴다. 사이트가 `/wilderness/` 하위 경로에서 열리므로 `/`로 시작하는 절대 경로는 깨진다.
- `static/` 안의 점(`.`)으로 시작하는 파일과 폴더는 배포되지 않는다.
- 공통 지침은 이 파일에만 쓴다. `CLAUDE.md` 같은 에이전트별 파일에는 이 파일을 불러오는 내용만 두고 지침을 복제하지 않는다.
- 토큰, API 키, 개인 정보, 회사 내부 정보를 커밋하지 않는다.

## 로컬 확인

```bash
python3 -m http.server 8000 --directory static
```

http://localhost:8000 을 연다.
