# NotionGlaze Master Admin Guide (마스터 가이드)

이 문서는 NotionGlaze 프로젝트의 관리자를 위한 운영 및 시스템 관리 가이드입니다. 프로젝트 구조부터 관리자 페이지 활용법, 시스템 핵심 로직에 대해 설명합니다.

---

## 1. 프로젝트 개요 및 아키텍처

NotionGlaze는 노션(Notion) 데이터를 기반으로 블로그나 웹사이트를 자동으로 생성해주는 SaaS 서비스입니다. 모든 인프라는 Cloudflare의 Edge Computing 기술을 기반으로 설계되어 있습니다.

### 기술 스택 (Tech Stack)
- **Framework**: [Astro](https://astro.build/) (v4+, SSR Mode)
- **Runtime**: [Cloudflare Workers / Pages](https://workers.cloudflare.com/)
- **Database**: [Cloudflare D1](https://developers.cloudflare.com/d1/) (Edge SQL)
- **Storage**: [Cloudflare R2](https://developers.cloudflare.com/r2/) (Image Proxy & Assets)
- **Architecture**: Turborepo 기반의 Monorepo

### 폴더 구조 (Project Structure)
- **`apps/web`**: 메인 웹 애플리케이션 (Dashbaord, Admin, Blog Renderer)
    - `src/lib/services`: 비즈니스 로직 및 DB 쿼리 분리
    - `src/components/admin`: 관리자 대시보드 컴포넌트 모듈화
- **`apps/sync-worker`**: 노션 동기화 엔진 (Worker)
- **`apps/proxy`**: 커스텀 도메인 라우팅 (Worker)
- **`packages/core`**: 공용 유틸리티 및 타입 정의
- **`packages/ui`**: 공용 UI 컴포넌트 (Design System)
- **`packages/themes`**: 테마 정의 및 디자인 리소스
    - `design/*.pen`: Penpot 디자인 토큰 원본 관리

---

## 2. 시스템 아키텍처 (System Architecture)

### 2.1 요청 흐름 (Request Flow)
1.  **Browser**: 사용자가 `subdomain.notionglaze.cc` 또는 `customdomain.com` 접속.
2.  **Proxy Worker (`apps/proxy`)**: 
    - 요청을 가로채어 원본 호스트를 `X-NotionGlaze-Host` 헤더에 담아 메인 Pages 서버로 전달.
3.  **Middleware (`apps/web`)**: 
    - 호스트 정보를 분석하여 **테넌트(유저) 식별**.
    - 보안 루프 방지 로직 적용 후 내부 경로를 `/blog`로 Rewrite하여 렌더링.
4.  **Sync Engine (`apps/sync-worker`)**: 
    - 노션 API에서 정보를 긁어와 D1 DB 및 R2 저장소에 영구 저장.

### 2.2 보안 및 네트워크 설정
- **CSRF 보호**: 프록시 환경에서의 원활한 데이터 전송을 위해 `security.checkOrigin` 설정을 `false`로 관리합니다.
- **무한 루프 방지**: 리라이트(Rewrite) 시 이미 `/blog` 경로로 진입했는지 확인하여 `508 Loop Detected` 에러를 차단합니다.

---

## 3. 동기화 시스템 (Magic Sync Engine)

사용자의 노션 데이터를 사이트로 변환하는 핵심 엔진입니다.

### 3.1 스마트 증분 동기화 (Heist Optimization 2.0)
- **개요**: 워커의 서브리퀘스트와 리소스를 최소화하기 위해 설계된 정밀 탐지 엔진입니다.
- **Pre-flight 체크**: 노션 데이터베이스의 `last_edited_time` 1건만 조회하여 우리 DB의 최신 값과 비교합니다. 변화가 없다면 다른 요청을 보내지 않고 즉시 작업을 종료합니다. (리소스 90% 절감)
- **페이지별 정밀 스킵**: 노션에서 수정된 페이지 목록을 주더라도, 페이지별 `last_edited_time`이 1ms 단위까지 일치하면 블록/이미지 처리를 건너뜁니다.
- **동적 워터마크**: 성공적으로 저장된 포스트의 수정 시각을 기준으로 다음 동기화 시점을 정밀하게 계산하여 데이터 유실을 방지합니다.

### 3.2 멀티 소스 통합 (Multi-Source Aggregator)
- **구역 확장**: 하나의 테넌트(블로그)가 여러 개의 노션 데이터베이스를 소스로 가질 수 있습니다.
- **자동 태깅 (Auto-tag)**: 특정 데이터베이스에서 오는 모든 글에 특정 태그(예: #Project, #News)를 자동으로 부여하여 사이트 내에서 카테고리별 필터링이 가능하게 합니다.
- **병합 동기화**: 여러 소스에서 수집된 데이터는 하나의 통합 타임라인으로 병합되어 사용자에게 제공됩니다.

### 3.3 서브리퀘스트 한도 및 안정성 (Hardening)
- **분산 처리 (Chunk Dispatch)**: 페이지가 많을 경우 데이터를 청크(Chunk) 단위로 나누어 서비스 바인딩(Service Binding)을 통해 여러 워커 인스턴스로 분산 처리합니다. 이를 통해 각 요청마다 신선한 50회 제한을 확보합니다.
- **부분 동기화 (Partial Sync)**: 글 내용이 너무 방대하여 제한에 가까워지면 에러를 내는 대신, 처리된 곳까지만 안전하게 저장하고 작업을 마칩니다. 
- **재귀 깊이 제한**: 무한 루프 방지를 위해 노션 블록 탐색 깊이를 최대 3단계로 제한합니다.

### 3.4 실시간 진행률 (Real-time Progress)
- 대시보드에서 `/api/v1/tenant/status` 엔드포인트를 통해 2.5초 간격으로 진행 상황을 확인합니다.
- **Signature Color**가 적용된 다이내믹 프로그레스 바를 통해 사용자에게 실시간 피드백을 제공합니다.

---

## 4. 커스텀 브랜딩 (Signature Colors)

사용자가 설정한 브랜드 색상은 시스템 전체에 유기적으로 적용됩니다.

- **CSS Variables**: `--primary`, `--accent`, `--primary-rgb` 변수를 통해 타이틀 그라데이션, 버튼, 대시보드 하이라이트 색상을 일괄 제어합니다.
- **Layout Sync**: `Layout.astro`에서 인라인 스타일 주입 방식을 사용하여 대시보드와 블로그 페이지 모두에서 사용자 고유의 색상이 즉시 반영되도록 구현되어 있습니다.

---

## 5. 관리자 대시보드 가이드 (`/dash-admin`)

NotionGlaze 마스터 관리자만 접근할 수 있는 페이지입니다.
**Update (v2.1)**: 유지보수성을 위해 비즈니스 로직은 `services/admin.ts`로, UI는 `components/admin/` 하위 컴포넌트로 분리되었습니다.

- **인증 방식**: `?key=notionglaze-master-key` 파라미터를 통해 최초 인증. 성공 시 보안 쿠키 발급.
- **주요 기능**:
    - **통합 메트릭**: 전체 테넌트 수, 총 포스트 수, 연결된 소스(Source) 수, 현재 동기화 중인 부하량(Infrastructure Load) 모니터링.
    - **플랫폼 상태**: D1, R2, Sync Worker의 가동 상태(Operational/Degraded)를 실시간 체크.
    - **글로벌 오퍼레이션**: 
        - **🔄 Global Sync**: 모든 Pro 플랜 유저의 동기화를 일괄 시작.
        - **🧹 Reset Errors**: 시스템 전체의 에러/실패 상태를 수동으로 안전하게 초기화.
    - **테넌트 상제 관리**: 유저별 서브도메인, 발행된 포스트 수, 연결된 소스 수, 마지막 활동 시각 등을 정밀하게 관리.
    - **💎 플랜 관리**: 수동으로 유저의 플랜(Trial/Pro)을 변경.
    - **피드백 수집**: 사용자가 남긴 Pain Points 및 기술 지원 요청 확인.

---

## 6. 문제 해결 (Troubleshooting)

### Q1. "Too many subrequests" 에러가 발생합니다.
- **원인**: 노션 페이지의 구조가 너무 복잡하여 통신 횟수 제한을 초과했습니다.
- **해결**: 시스템이 부분 동기화로 전환되었습니다. 다시 한번 **Magic Sync**를 누르면 나머지 내용을 이어서 가져옵니다.

### Q2. Signature Color를 바꿨는데 대시보드 일부가 안 변해요.
- **해결**: 브라우저 캐시를 삭제하거나, `DashboardLayout.astro`에 `siteConfig`가 정상적으로 전달되고 있는지 확인하십시오.

### Q3. 새로운 노션 계징 연결 시 "Cross-site POST..." 에러가 뜹니다.
- **해결**: `astro.config.mjs`의 `checkOrigin: false` 설정이 라이브에 배포되었는지 확인하십시오. (프록시 환경 필수 설정)

---

*본 문서는 프로젝트 관리 전용 가이드입니다. 보안을 위해 외부 유출에 주의해 주세요.*
