# 🎨 Traceability Delete UX Improvements

## 현재 문제점

- 삭제 버튼이 노드 카드에 있어서 "노드 삭제"로 오해
- 실제로는 "관계 삭제"인데 UX가 명확하지 않음

## 개선 방안

### 방안 1: 연결선 위 삭제 버튼 (추천)

```jsx
// 현재 구조를 최소 변경하면서 UX 개선

// 1. 연결 표시기 추가
<div className="flex items-center gap-2 ml-4">
    {node.parentId && (
        <div className="flex items-center gap-1 text-gray-400">
            <ArrowRight className="h-3 w-3" />
            <button
                onClick={() => handleDeleteRelationship(node)}
                className="p-1 rounded hover:bg-red-500/20 text-red-400 hover:text-red-300"
                title="끊기: 상위 연결"
            >
                <LinkBreak className="h-3 w-3" />
            </button>
        </div>
    )}
    <span>{node.title}</span>
</div>
```

### 방안 2: 아이콘 변경

```jsx
// Trash2 대신 연결 끊기 아이콘 사용
import { Unlink } from 'lucide-react';

<button>
    <Unlink className="h-4 w-4" /> // 🔗💥 연결 끊기
</button>;
```

### 방안 3: 툴팁 개선

```jsx
// 더 명확한 툴팁
title={`연결 끊기: "${node.title}"을(를) 상위에서 분리`}
```

### 방안 4: 확인 메시지 개선

```jsx
const confirmDelete = confirm(
    `"${node.title}"을(를) 계층에서 분리하시겠습니까?\n\n` +
        `⚠️  이 작업은 상위 연결을 끊어 독립 노드로 만듭니다.\n` +
        `📍 노드 자체는 삭제되지 않습니다.`,
);
```

## 구현 우선순위

1. 🥇 아이콘 변경 (Trash2 → Unlink) - 즉시 개선
2. 🥈 툴팁 텍스트 개선 - 5분 작업
3. 🥉 확인 메시지 개선 - 10분 작업
4. 🏆 연결선 위 버튼 배치 - 30분 작업

## 예상 효과

- ✅ 사용자 혼란 50% 감소
- ✅ 직관적인 "연결 끊기" 개념
- ✅ 실수로 인한 잘못된 삭제 방지
