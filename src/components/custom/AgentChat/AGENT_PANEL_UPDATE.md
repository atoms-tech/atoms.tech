# AgentPanel.tsx 수정 가이드

atoms.tech의 AgentChatPanel이 사용자 context(organization_id, project_id 등)를 atom-agent-api로 전달하도록 수정합니다.

## 📍 수정할 파일

`src/components/custom/AgentChat/AgentPanel.tsx`

## 🔧 수정 내용

### Line 377-384 교체

**기존 코드** (Line 377-384):

```typescript
const atomsAiResponse = await fetch(`${atomsAiUrl}/api/chat/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        message: msg,
        conversation_history: llmFriendlyHistory,
    }),
});
```

**새 코드** (메타데이터 포함):

```typescript
const atomsAiResponse = await fetch(`${atomsAiUrl}/api/chat/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        message: msg,
        conversation_history: llmFriendlyHistory,
        // User context for Supabase queries
        user_id: currentUserId,
        organization_id: currentOrgId,
        pinned_organization_id: currentPinnedOrganizationId,
        project_id: currentProjectId,
        document_id: currentDocumentId,
    }),
});
```

## ✅ 변경 사항 설명

### Before (기존)

- `message`와 `conversation_history`만 전송
- atom-agent-api가 기본 organization_id 사용
- 모든 사용자가 같은 데이터 조회

### After (수정 후)

- **user_id**: 현재 로그인한 사용자 ID
- **organization_id**: 현재 조직 ID
- **pinned_organization_id**: 고정된 조직 ID (우선순위 높음)
- **project_id**: 현재 프로젝트 ID
- **document_id**: 현재 문서 ID

→ atom-agent-api가 사용자별/조직별/프로젝트별 Supabase 데이터를 조회!

## 📊 데이터 흐름

```
atoms.tech (AgentPanel)
   ↓
   전송: message + user_id + organization_id + project_id + document_id
   ↓
atom-agent-api (/api/chat/)
   ↓
   1. pinned_organization_id 또는 organization_id 사용
   2. Supabase에서 해당 조직/프로젝트 데이터 조회
   3. user_preferences, project_files, requirements 등
   ↓
   Claude AI (context와 함께)
   ↓
   응답 리턴
   ↓
atoms.tech (AgentPanel)
```

## 🧪 테스트 방법

### 1. atom-agent-api 실행 확인

```bash
cd atom-agent-api
./run_gen_ai.sh

# 로그에서 확인:
# INFO: Application startup complete.
```

### 2. atoms.tech 실행

```bash
cd atoms.tech
npm run dev
```

### 3. AgentPanel에서 테스트

#### 테스트 1: 일반 채팅

```
메시지: "Hello, what can you help me with?"

→ atom-agent-api가 사용자의 organization_id로 데이터 조회
→ user_preferences 등을 context로 사용
```

#### 테스트 2: 프로젝트 관련 질문

```
메시지: "What are the requirements for this project?"

→ atom-agent-api가 project_id로 requirements 조회
→ 해당 프로젝트의 requirements를 context로 제공
```

#### 테스트 3: 조직 전환

```
1. atoms.tech에서 organization 변경
2. AgentPanel에서 메시지 전송
3. 로그 확인: 새로운 organization_id로 쿼리
```

## 🐛 디버깅

### 브라우저 개발자 도구 (F12)

**Network 탭**:

```
POST http://localhost:8000/api/chat/

Request Payload:
{
  "message": "...",
  "conversation_history": [...],
  "user_id": "9a2f7466-ebb0-44aa-8328-f7a46a654322",
  "organization_id": "b5d4ea64-ccf1-4cb6-9236-6e8b239d9097",
  "pinned_organization_id": "b5d4ea64-ccf1-4cb6-9236-6e8b239d9097",
  "project_id": "abc123...",
  "document_id": "xyz789..."
}

Response:
{
  "response": "...",
  "context_used": {
    "user_id": "...",
    "organization_id": "...",
    "data": { "user_preferences": {...} }
  },
  "model": "claude-sonnet-4-20250514",
  "usage": {...}
}
```

### atom-agent-api 로그

```bash
# AgentPanel.tsx 377줄에서 전송한 데이터 확인
# context_provider.py에서 조직별 데이터 조회 확인
```

### Console 로그 확인

AgentPanel.tsx는 이미 로그를 출력:

```typescript
console.log('AgentPanel - Pinned organization changed to:', currentPinnedOrganizationId);
```

## 🔍 검증 포인트

### ✅ 올바른 organization_id 사용

**확인 방법**:

1. atoms.tech에서 조직 A 선택
2. AgentPanel에서 메시지 전송
3. atom-agent-api 로그에서 organization_id 확인
4. 조직 B로 변경
5. 다시 메시지 전송
6. 다른 organization_id로 조회되는지 확인

### ✅ Supabase 데이터 조회

**확인 방법**:

```bash
# atom-agent-api 로그에서
GET context for organization: b5d4ea64-ccf1-4cb6-9236-6e8b239d9097
Fetching user_preferences for user: 9a2f7466-ebb0-44aa-8328-f7a46a654322
```

### ✅ Context가 AI 응답에 반영

**테스트 쿼리**:

```
"What are my preferences?"
→ Supabase의 user_preferences를 조회하여 응답

"What projects do I have?"
→ organization_id로 projects 조회하여 응답
```

## 📝 추가 개선 (선택사항)

### Option 1: Pipeline 자동 감지

특정 키워드 발견 시 자동으로 pipeline 호출:

```typescript
const pipelineKeywords = ['requirements', 'all projects', 'overview', 'documents'];
const shouldUsePipeline = pipelineKeywords.some((kw) => msg.toLowerCase().includes(kw));

const endpoint = shouldUsePipeline ? '/api/pipelines/project-overview' : '/api/chat/';

const response = await fetch(`${atomsAiUrl}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(
        shouldUsePipeline
            ? {
                  query: msg,
                  organization_id: currentPinnedOrganizationId || currentOrgId,
                  user_id: currentUserId,
              }
            : {
                  message: msg,
                  conversation_history: llmFriendlyHistory,
                  user_id: currentUserId,
                  organization_id: currentOrgId,
                  pinned_organization_id: currentPinnedOrganizationId,
                  project_id: currentProjectId,
                  document_id: currentDocumentId,
              },
    ),
});
```

### Option 2: Loading 상태 개선

```typescript
// 메타데이터 전송 중임을 사용자에게 표시
<p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
  {isLoading
    ? 'Analyzing your project context...'
    : 'Type a message...'}
</p>
```

## 🚀 배포 체크리스트

- [ ] AgentPanel.tsx Line 377-384 수정
- [ ] atom-agent-api `.env.simple`에 `ANTHROPIC_API_KEY` 입력
- [ ] atom-agent-api 실행 (`./run_gen_ai.sh`)
- [ ] atoms.tech 실행 (`npm run dev`)
- [ ] AgentPanel에서 메시지 테스트
- [ ] 브라우저 Network 탭에서 request payload 확인
- [ ] 조직 변경 후 다른 organization_id로 쿼리되는지 확인

---

**완료 후**: atoms.tech의 AgentChatPanel이 사용자별/조직별/프로젝트별 context를 자동으로 전달하여, atom-agent-api가 관련 Supabase 데이터를 조회하고 AI 응답에 반영합니다! 🎉
