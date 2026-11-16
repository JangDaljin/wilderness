# AGENTS.md

이 저장소는 GitHub Pages로 공개하는 정적 사이트다. 공개(PUBLIC) 저장소이므로 커밋한 파일은 누구나 볼 수 있다.

- 사이트 주소: https://jangdaljin.github.io/wilderness/
- 이 파일은 모든 에이전트가 따르는 공통 지침이다.

## 구조

- `static/`: 사이트 파일. 이 폴더만 배포된다.
- `.github/workflows/pages.yml`: `main`에 `static/` 변경이 push되면 GitHub Actions로 배포한다.
- 그 밖의 루트 파일: 에이전트 지침, 저장소 설정, 문서. 배포되지 않는다.

## 규칙

- 사이트에 보여야 하는 파일은 모두 `static/` 안에 둔다. 루트에 HTML, CSS, JS를 두지 않는다.
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
