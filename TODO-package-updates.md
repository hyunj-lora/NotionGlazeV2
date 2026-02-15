# 📦 Package Update TODO

> 생성일: 2026-02-05  
> 최종 업데이트: 2026-02-05

## ✅ 완료된 업데이트

- [x] **Astro**: `5.16.13` → `5.17.1` (2026-02-05)
- [x] **Wrangler**: `4.61.1` → `4.62.0` (2026-02-05)

---

## ⏳ 보류 중인 업데이트

### 1. Tailwind CSS v4 마이그레이션 ⚠️ **높은 우선순위**

**현재 버전**: `3.4.19`  
**최신 버전**: `4.1.18`  
**위험도**: 매우 높음 (메이저 업데이트)

#### 주요 Breaking Changes
- **설정 방식 완전 변경**: `tailwind.config.js` (JavaScript) → CSS `@theme` 블록
- **Import 문법 변경**: 
  ```css
  /* Before (v3) */
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  
  /* After (v4) */
  @import "tailwindcss";
  ```
- **그라디언트 클래스명 변경**: `bg-gradient-to-r` → `bg-linear-to-r`
- **색상 시스템 변경**: RGB → Oklch (P3 색상 공간)
- **Container Query 내장**: `@tailwindcss/container-queries` 플러그인 불필요
- **Sass/Preprocessor 의존성 제거**: 독립적으로 작동

#### 마이그레이션 단계
1. **자동 업그레이드 도구 실행** (Node.js 20+ 필요)
   ```bash
   npx @tailwindcss/upgrade@latest
   ```

2. **수동 검토 항목**
   - [ ] `tailwind.config.js` → CSS `@theme` 블록 전환 확인
   - [ ] 모든 `@tailwind` 디렉티브 → `@import "tailwindcss"` 변경 확인
   - [ ] 그라디언트 클래스 사용 부분 검토 및 수정
   - [ ] 커스텀 색상 팔레트 Oklch 전환 검토
   - [ ] 전체 UI 컴포넌트 시각적 테스트

3. **테스트 계획**
   - [ ] 로컬 개발 환경에서 빌드 성공 확인
   - [ ] 모든 페이지 스타일 정상 렌더링 확인
   - [ ] 다크모드 정상 작동 확인
   - [ ] 반응형 레이아웃 정상 작동 확인
   - [ ] 프로덕션 빌드 및 배포 테스트

#### 참고 자료
- [Tailwind CSS v4 공식 마이그레이션 가이드](https://tailwindcss.com/docs/upgrade-guide)
- [Tailwind CSS v4 릴리즈 노트](https://tailwindcss.com/blog/tailwindcss-v4)

---

### 2. @notionhq/client v5 마이그레이션 ⚠️ **중간 우선순위**

**현재 버전**: `2.3.0`  
**최신 버전**: `5.9.0`  
**위험도**: 높음 (메이저 업데이트, API 구조 변경)

#### 주요 Breaking Changes
- **Notion API 버전 필수 업데이트**: `2025-09-03` 버전 사용 필수
- **데이터베이스 API 구조 대변경**: 
  - `database` 개념 → `database` (컨테이너) + `data_source` (개별 테이블)
  - 많은 API 작업에 `data_source_id` 필요
- **제거된 메서드**: `notion.databases.list()` (2022년부터 deprecated)
- **Search API 변경**: 필터 값 `"database"` → `"data_source"`
- **런타임 요구사항**: Node.js >= 18, TypeScript >= 5.9

#### 영향받는 코드
```typescript
// packages/core/src/notion.ts
- this.client.databases.query() // ⚠️ data_source_id 필요 여부 확인
- this.client.blocks.children.list() // ✅ 변경 없음
- this.client.pages.retrieve() // ✅ 변경 없음

// apps/sync-worker/src/core/notion.ts
- this.client.databases.query() // ⚠️ data_source_id 필요 여부 확인
```

#### 마이그레이션 단계
1. **사전 조사**
   - [ ] 현재 사용 중인 Notion API 엔드포인트 전체 목록 작성
   - [ ] 각 엔드포인트의 v5 변경사항 확인
   - [ ] `database_id` vs `data_source_id` 사용 패턴 분석

2. **코드 수정**
   - [ ] `Client` 초기화 시 API 버전 명시
     ```typescript
     new Client({ 
       auth: accessToken,
       notionVersion: '2025-09-03'
     })
     ```
   - [ ] `databases.query()` 호출 부분에 `data_source_id` 추가 (필요 시)
   - [ ] Discovery 단계 구현 (data_source_id 조회 및 저장)
   - [ ] Search API 필터 값 업데이트

3. **테스트 계획**
   - [ ] Notion 데이터베이스 쿼리 정상 작동 확인
   - [ ] 페이지 및 블록 조회 정상 작동 확인
   - [ ] Sync Worker 전체 동기화 프로세스 테스트
   - [ ] 에러 핸들링 검증

#### 참고 자료
- [Notion API 2025-09-03 마이그레이션 가이드](https://developers.notion.com/reference/versioning)
- [@notionhq/client v5 릴리즈 노트](https://github.com/makenotion/notion-sdk-js/releases)

---

### 3. tailwind-merge v3 업데이트 ⏸️ **낮은 우선순위**

**현재 버전**: `2.6.1`  
**최신 버전**: `3.4.0`  
**위험도**: 중간  
**선행 조건**: ⚠️ Tailwind CSS v4 업데이트 완료 필수

#### 주요 Breaking Changes
- **Tailwind CSS v4 전용**: v3 지원 중단
- **Validator 변경**: `isLength` 제거 → `isNumber` + `isFraction`로 분리
- **Prefix 설정 변경**: 하이픈(`-`) 포함하지 않음
- **Custom separator 지원 중단**
- **`createTailwindMerge` 사용 시**: `orderSensitiveModifiers` 속성 필수

#### 마이그레이션 단계
1. **Tailwind CSS v4 업데이트 완료 대기**
2. **의존성 업데이트**
   ```bash
   npm install tailwind-merge@latest --workspace=@notionglaze/ui
   ```
3. **커스텀 설정 검토** (사용 중인 경우)
   - [ ] `createTailwindMerge` 사용 여부 확인
   - [ ] Validator 커스터마이징 여부 확인
   - [ ] Prefix 설정 확인

#### 참고 자료
- [tailwind-merge v3 릴리즈 노트](https://github.com/dcastil/tailwind-merge/releases)

---

## 📊 업데이트 우선순위 요약

| 패키지 | 현재 버전 | 최신 버전 | 위험도 | 우선순위 | 상태 |
|--------|----------|----------|--------|---------|------|
| Astro | 5.16.13 | 5.17.1 | 낮음 | - | ✅ 완료 |
| Wrangler | 4.61.1 | 4.62.0 | 낮음 | - | ✅ 완료 |
| Tailwind CSS | 3.4.19 | 4.1.18 | 매우 높음 | 1순위 | ⏳ 보류 |
| @notionhq/client | 2.3.0 | 5.9.0 | 높음 | 2순위 | ⏳ 보류 |
| tailwind-merge | 2.6.1 | 3.4.0 | 중간 | 3순위 | ⏳ 보류 |

---

## 🎯 권장 마이그레이션 로드맵

### Phase 1: Tailwind CSS v4 (예상 소요: 2-3일)
1. 개발 브랜치 생성
2. 자동 업그레이드 도구 실행
3. 수동 검토 및 수정
4. 전체 UI 테스트
5. 프로덕션 배포

### Phase 2: @notionhq/client v5 (예상 소요: 1-2일)
1. API 사용 패턴 분석
2. 코드 수정 및 테스트
3. Sync Worker 검증
4. 프로덕션 배포

### Phase 3: tailwind-merge v3 (예상 소요: 0.5일)
1. 의존성 업데이트
2. 빌드 및 테스트
3. 프로덕션 배포

---

## 📝 참고사항

- 각 업데이트는 별도의 브랜치에서 진행하고 충분한 테스트 후 병합
- 프로덕션 배포 전 스테이징 환경에서 검증 필수
- 롤백 계획 수립 (이전 버전으로 복구 가능하도록)
- 업데이트 후 성능 모니터링 (빌드 시간, 번들 크기, 런타임 성능)
