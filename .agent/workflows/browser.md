---
description: 시놀로지 환경에서 Docker 컨테이너를 사용하여 브라우저를 작동시키는 방법
---

이 환경은 호스트 라이브러리 제한으로 인해 직접적인 브라우저 실행이 불가능합니다. 
브라우저 관련 작업(스크린샷, 웹 스크래핑 등)이 필요할 경우 반드시 아래 절차를 따르십시오.

1. **스크립트 작성**: `playwright`를 사용하여 Node.js 스크립트를 작성합니다.
2. **컨테이너 복사**: `docker cp [파일명] nas-browser-agent:/tmp/[파일명]` 명령으로 복사합니다.
3. **실행**: `docker exec -u root -w /tmp nas-browser-agent node [파일명]` 명령으로 실행합니다.
4. **결과 수집**: 스크린샷 등이 생성되었다면 `docker cp nas-browser-agent:/tmp/[결과물] ./` 명령으로 가져옵니다.

// turbo
// 예시 실행 명령어 (구글 접속 테스트)
docker exec -u root -w /tmp nas-browser-agent node -e "const { chromium } = require('playwright'); (async () => { const b = await chromium.launch(); const p = await b.newPage(); await p.goto('https://google.com'); console.log(await p.title()); await b.close(); })();"
