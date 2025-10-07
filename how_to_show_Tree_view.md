# Traceability Tree View 구조 분석

## 개요
`org/[orgId]/traceability` 페이지의 Tree View 탭은 requirements 간의 계층 구조를 시각화합니다.

## 데이터베이스 테이블

### 1. `requirements_closure` 테이블
계층 구조를 저장하는 Closure Table입니다.

**컬럼:**
- `ancestor_id` (UUID): 부모(조상) requirement의 ID
- `descendant_id` (UUID): 자식(후손) requirement의 ID
- `depth` (INTEGER): 계층 깊이 (1 = 직접 부모-자식, 2+ = 조상-후손)
- `path` (TEXT): 경로 정보
- `created_at`, `updated_at`: 메타데이터
- `created_by`, `updated_by`: 사용자 추적

**역할:**
- 부모-자식 관계를 저장 (depth = 1)
- 모든 조상-후손 관계를 자동으로 저장 (depth >= 1)
- 계층 구조의 완전한 트리를 재구성할 수 있게 함

### 2. `requirements` 테이블
실제 requirement 정보를 저장합니다.

**주요 컬럼:**
- `id` (UUID): 기본 키
- `external_id` (TEXT): 외부 시스템 ID (예: REQ-001)
- `name` (TEXT): Requirement 이름
- `description` (TEXT): 설명
- `document_id` (UUID): 소속 문서 ID
- `is_deleted` (BOOLEAN): 삭제 여부

## 데이터베이스 함수

### `get_requirement_tree(p_project_id UUID)`
Tree View의 핵심 데이터를 제공하는 PostgreSQL 함수입니다.

**위치:** `DB_Analyze/update_tree_function.sql`

**동작 방식:**

1. **Root 노드 선택 (depth = 0)**
   ```sql
   SELECT r.id, COALESCE(r.external_id, r.name) as title, NULL as parent_id, 0 as depth
   FROM requirements r
   WHERE NOT EXISTS (
       SELECT 1 FROM requirements_closure rc
       WHERE rc.descendant_id = r.id AND rc.depth = 1
   )
   ```
   - `requirements_closure`에서 descendant로 나타나지 않는 requirement = Root 노드
   - 즉, 부모가 없는 최상위 노드들

2. **재귀적으로 자식 노드 탐색**
   ```sql
   UNION ALL
   SELECT r.id, COALESCE(r.external_id, r.name), rc.ancestor_id as parent_id, t.depth + 1
   FROM tree t
   JOIN requirements_closure rc ON rc.ancestor_id = t.requirement_id AND rc.depth = 1
   JOIN requirements r ON r.id = rc.descendant_id
   ```
   - `rc.depth = 1`로 필터링하여 직접적인 부모-자식 관계만 조회
   - 각 레벨마다 depth를 1씩 증가

**반환 값:**
- `requirement_id`: Requirement UUID
- `title`: external_id 또는 name
- `parent_id`: 부모 노드의 UUID (root는 NULL)
- `depth`: 0 (root), 1, 2, ... (계층 레벨)
- `path`: 계층 경로 문자열 (예: "REQ-001 > REQ-002 > REQ-003")
- `has_children`: 자식 노드 존재 여부

## API 엔드포인트

### `GET /api/requirements/relationships?type=tree&projectId={id}`

**위치:** `src/app/(protected)/api/requirements/relationships/route.ts:238-241`

```typescript
case 'tree':
    ({ data, error } = await supabase.rpc('get_requirement_tree', {
        p_project_id: projectId || null,
    }));
```

**응답 형식:**
```json
{
  "data": [
    {
      "requirement_id": "uuid",
      "title": "REQ-001",
      "parent_id": null,
      "depth": 0,
      "path": "REQ-001",
      "has_children": true
    },
    {
      "requirement_id": "uuid",
      "title": "REQ-002",
      "parent_id": "parent-uuid",
      "depth": 1,
      "path": "REQ-001 > REQ-002",
      "has_children": false
    }
  ]
}
```

## React Query Hook

### `useRequirementTree(projectId)`

**위치:** `src/hooks/queries/useRequirementRelationships.ts:210-218`

```typescript
export function useRequirementTree(projectId?: string) {
    return useQuery({
        queryKey: queryKeys.requirements.tree(projectId),
        queryFn: () => getRequirementTree(projectId),
        enabled: !!projectId,
        staleTime: 5 * 60 * 1000,  // 5분 캐싱
        gcTime: 10 * 60 * 1000,
    });
}
```

**특징:**
- projectId가 있을 때만 실행
- 5분간 데이터를 fresh하게 유지
- 10분간 캐시에 보관

## UI 렌더링

### `TraceabilityPageClient` 컴포넌트

**위치:** `src/app/(protected)/org/[orgId]/traceability/TraceabilityPageClient.tsx:698-948`

**렌더링 로직:**

1. **데이터 필터링 (라인 724-754)**
   ```typescript
   requirementTree
       .filter((node) => {
           // 계층 구조에 속한 노드만 표시:
           // 1. 자식이 있는 노드 (부모 노드)
           // 2. depth > 0인 노드 (자식 노드)
           return node.has_children || node.depth > 0;
       })
   ```
   - **중요:** 고아 노드(독립된 노드)는 표시하지 않음
   - `requirements_closure`에 관계가 기록된 노드만 표시

2. **정렬 (라인 755-761)**
   ```typescript
   .sort((a, b) => {
       return (a.path || '').localeCompare(b.path || '');
   })
   ```
   - `path` 컬럼으로 정렬하여 계층 구조 유지
   - 예: "A > B" < "A > C" < "A > C > D"

3. **시각적 표현 (라인 762-933)**

   **Depth 인디케이터 (라인 767-768)**
   ```typescript
   style={{ marginLeft: `${node.depth * 24}px` }}
   ```
   - 각 레벨마다 24px 들여쓰기

   **연결선 표시 (라인 772-784)**
   ```typescript
   {node.depth > 0 && (
       {Array.from({ length: node.depth }).map((_, i) => (
           <div className="w-6 h-0.5 bg-gradient-to-r from-blue-500 to-blue-300" />
       ))}
       <ArrowRight className="h-4 w-4 text-blue-400" />
   )}
   ```

   **Root/Parent 뱃지 (라인 788-796)**
   ```typescript
   {node.depth === 0 && node.has_children && (
       <span>ROOT</span>
   )}
   ```

   **아이콘 차별화 (라인 798-815)**
   - depth === 0: 녹색 Target 아이콘 (Root)
   - has_children: 파란색 GitBranch 아이콘 (중간 노드)
   - leaf node: 회색 원형 (말단 노드)

   **Requirement 정보 (라인 819-913)**
   - external_id 또는 requirement_id 표시
   - depth에 따른 색상 구분 (emerald, blue, purple)
   - 부모/자식 레벨 뱃지 표시

   **삭제 버튼 (라인 916-931)**
   ```typescript
   {node.depth > 0 && (
       <button onClick={() => handleDeleteRelationship(node)}>
           <Unlink className="h-4 w-4" />
       </button>
   )}
   ```
   - Root 노드(depth === 0)는 삭제 버튼 없음
   - 자식 노드만 연결 해제 가능

## 관계 생성/삭제

### 관계 생성
1. "Hierarchy" 탭에서 Parent 선택
2. Child 노드들 선택
3. "Create Relationships" 버튼 클릭
4. API 호출: `POST /api/requirements/relationships`
5. DB 함수: `create_requirement_relationship()`
6. `requirements_closure`에 레코드 생성:
   - depth=1 레코드 (직접 관계)
   - depth>1 레코드들 (조상-후손 관계)
7. React Query 캐시 무효화 → Tree View 자동 업데이트

### 관계 삭제
1. Tree View에서 자식 노드의 Unlink 버튼 클릭
2. API 호출: `DELETE /api/requirements/relationships`
3. DB 함수: `delete_requirement_relationship()`
4. 해당 관계 및 하위 모든 조상-후손 레코드 삭제
5. React Query 캐시 무효화 → Tree View 자동 업데이트

## 데이터 흐름 요약

```
[PostgreSQL]
requirements_closure 테이블 (closure table)
         ↓
get_requirement_tree() 함수 (recursive CTE)
         ↓
[API Route]
GET /api/requirements/relationships?type=tree
         ↓
[React Query]
useRequirementTree() hook
         ↓
[React Component]
TraceabilityPageClient
  ├─ Filter: has_children || depth > 0
  ├─ Sort: by path
  └─ Render: 계층 구조 시각화
```

## 핵심 포인트

1. **Closure Table 패턴**
   - `requirements_closure`가 모든 조상-후손 관계를 저장
   - 재귀 쿼리 없이도 전체 트리 구조 조회 가능

2. **Recursive CTE**
   - `get_requirement_tree()` 함수에서 WITH RECURSIVE 사용
   - Root 노드부터 시작해 레벨별로 자식 노드 탐색

3. **Depth 기반 필터링**
   - depth = 1: 직접적인 부모-자식 관계
   - depth > 1: 조상-후손 관계
   - Tree View는 모든 depth의 노드를 표시

4. **UI 필터링**
   - `has_children || depth > 0`: 계층에 속한 노드만 표시
   - 독립된 노드(고아 노드)는 숨김

5. **Path 기반 정렬**
   - 문자열 경로로 정렬하여 계층 구조 유지
   - 형제 노드는 알파벳 순서로 정렬