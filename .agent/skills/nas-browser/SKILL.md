# Skill: NAS Browser Handler

시놀로지 NAS Docker 환경에서 브라우저 자동화를 수행하는 특화 기술입니다.

## Context
시놀로지 DSM 호스트는 GUI 라이브러리 부재로 브라우저 실행이 불가능합니다. 이를 해결하기 위해 `nas-browser-agent`라는 Ubuntu Docker 컨테이너를 브라우저 런타임으로 사용합니다.

## Capabilities
- **Browser Execution**: `nas-browser-agent` 컨테이너 내에서 Playwright(Chromium) 실행.
- **Node.js Environment**: v22.22.x 최신 런타임 지원.
- **Data Transfer**: 호스트와 컨테이너 간의 파일 동기화 (`docker cp`).

## Usage Guidelines
- 모든 브라우저 조작은 `docker exec -u root`를 접두어로 사용해야 합니다.
- 스크립트 실행 전 `/tmp` 디렉토리에 필요한 라이브러리가 있는지 확인하십시오.
- `browser_subagent` 도구는 이 환경에서 작동하지 않으므로 사용을 지양하고 대신 이 Skill의 `run_command` 기반 방식을 사용하십시오.

## Troubleshooting
- 연결 오류 시: `docker restart nas-browser-agent`
- 의존성 누락 시: `docker exec -u root nas-browser-agent npx playwright install-deps`
