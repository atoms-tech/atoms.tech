interface SelectedFilesMap {
    [key: string]: { file?: File };
}

export async function handleAnalyzeAPI({
    reqText,
    selectedFiles,
    setAnalysisData,
    setIsAnalysing,
    apiUrl,
    maxRetries = 2,
    retryDelayMs = 3000,
}: {
    reqText: string;
    selectedFiles: SelectedFilesMap;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setAnalysisData: (data: any) => void;
    setIsAnalysing: (value: boolean) => void;
    apiUrl: string;
    maxRetries?: number;
    retryDelayMs?: number;
}) {
    setIsAnalysing(true);
    setAnalysisData(null);
    try {
        // Open right agent panel
        try {
            const { setIsOpen } = (
                await import('@/components/custom/AgentChat/hooks/useAgentStore')
            ).useAgentStore.getState();
            setIsOpen(true);
        } catch {}
        // Ensure a pinned org exists for demo/sandbox so threads/messages can be stored
        try {
            const { currentPinnedOrganizationId, setUserContext, currentOrgId } = (
                await import('@/components/custom/AgentChat/hooks/useAgentStore')
            ).useAgentStore.getState();
            if (!currentPinnedOrganizationId) {
                const sandboxId = currentOrgId || 'sandbox-org';
                setUserContext({ orgId: sandboxId, pinnedOrganizationId: sandboxId, username: 'Guest' });
            }
        } catch {}
        let attempt = 0;
        while (attempt <= maxRetries) {
            try {
                const formData = new FormData();
                formData.append('user_input', reqText);
                const firstFile = Object.values(selectedFiles)[0]?.file;
                if (firstFile) formData.append('file', firstFile);
                const fullUrl = apiUrl.startsWith('/') ? apiUrl : `/${apiUrl}`;
                console.log(
                    `[handleAnalyzeAPI] POSTing to:`,
                    fullUrl,
                    `(attempt ${attempt + 1})`,
                );
                const res = await fetch(fullUrl, { method: 'POST', body: formData });
                const contentType = res.headers.get('content-type') || '';
                if (!res.ok) {
                    const bodyText = await res.text();
                    console.error(
                        `[handleAnalyzeAPI] Error (${res.status}):`,
                        bodyText.slice(0, 200),
                    );
                    // Retry on 503/model overloaded
                    if (res.status === 503 || bodyText.includes('model is overloaded')) {
                        attempt++;
                        if (attempt > maxRetries)
                            throw new Error(
                                `Failed after ${maxRetries + 1} attempts: ${res.status} ${bodyText.slice(0, 200)}`,
                            );
                        console.warn(
                            `[handleAnalyzeAPI] Retrying in ${retryDelayMs}ms...`,
                        );
                        await new Promise((r) => setTimeout(r, retryDelayMs));
                        continue;
                    }
                    throw new Error(
                        `Failed to analyze requirement: ${res.status} ${bodyText.slice(0, 200)}`,
                    );
                }
                let data;
                if (contentType.includes('application/json')) {
                    try {
                        data = await res.json();
                    } catch {
                        const bodyText = await res.text();
                        console.error(
                            '[handleAnalyzeAPI] JSON parse error. Response:',
                            bodyText.slice(0, 200),
                        );
                        throw new Error(
                            'Response was not valid JSON. See console for details.',
                        );
                    }
                } else {
                    const bodyText = await res.text();
                    console.error(
                        '[handleAnalyzeAPI] Non-JSON response:',
                        bodyText.slice(0, 200),
                    );
                    throw new Error(
                        'Server did not return JSON. See console for details.',
                    );
                }
                // Debug
                console.log('[handleAnalyzeAPI] Raw backend response:', data);
                // Update analysis panel data
                // Normalize to the AnalysisData shape used by demo/requirement pages
                const normalized = {
                    reqId: 'Local Analysis',
                    originalRequirement: reqText,
                    // EARS-related
                    earsRequirement: data.analysis?.ears ?? 'N/A',
                    earsPattern: undefined as unknown as string, // optional/unavailable in this flow
                    earsTemplate: undefined as unknown as string, // optional/unavailable in this flow
                    // INCOSE-related
                    incoseFormat: data.analysis?.incose ?? 'N/A',
                    incoseFeedback: data.analysis?.incose ?? 'N/A', // reuse as feedback summary
                    // Compliance
                    complianceFeedback: data.analysis?.compliance ?? 'N/A',
                    relevantRegulations: undefined as unknown as string, // optional/unavailable in this flow
                    // Enhanced
                    enhancedReqEars: data.analysis?.enhanced_ears ?? 'N/A',
                    enhancedReqIncose: data.analysis?.enhanced_incose ?? 'N/A',
                    enhancedGeneralFeedback: data.analysis?.general_feedback ?? 'N/A',
                };
                setAnalysisData(normalized);

                // Display a summary message into the agent panel as a new chat thread
                try {
                    const {
                        addMessage,
                        newThread,
                        setActiveThread,
                        getActiveThreadId,
                        getMessagesForCurrentOrg,
                        organizationThreads,
                        renameThread,
                        currentPinnedOrganizationId,
                        setUserContext,
                        currentOrgId,
                    } = (
                        await import(
                            '@/components/custom/AgentChat/hooks/useAgentStore'
                        )
                    ).useAgentStore.getState();
                    // Ensure pinned org (again) in case it wasn't set yet when panel opened
                    if (!currentPinnedOrganizationId) {
                        const sandboxId = currentOrgId || 'sandbox-org';
                        setUserContext({ orgId: sandboxId, pinnedOrganizationId: sandboxId, username: 'Guest' });
                    }
                    // Snapshot/label the current active thread if it has no meaningful title
                    try {
                        const currentId = getActiveThreadId?.();
                        if (currentId) {
                            const orgId = currentPinnedOrganizationId || '';
                            const meta = organizationThreads?.[orgId]?.[currentId];
                            const hasGenericTitle = !meta || !meta.title || /^\s*$/.test(meta.title) || meta.title === 'New chat';
                            if (hasGenericTitle) {
                                const msgs = getMessagesForCurrentOrg?.() || [];
                                const lastUser = [...msgs].reverse().find((m) => m.role === 'user' && m.threadId === currentId);
                                if (lastUser?.content) {
                                    const clean = lastUser.content.replace(/\s+/g, ' ').trim();
                                    const newTitle = clean.length > 40 ? clean.slice(0, 40) + '…' : clean;
                                    if (newTitle) renameThread?.(currentId, newTitle);
                                }
                            }
                        }
                    } catch {}
                    // Create a new chat thread for this analysis
                    const titleBase = (reqText || 'Analysis').trim().replace(/\s+/g, ' ');
                    const title =
                        titleBase.length > 40
                            ? `Analysis: ${titleBase.slice(0, 40)}…`
                            : `Analysis: ${titleBase}`;
                    const threadId = newThread(title) || undefined;
                    if (threadId) setActiveThread(threadId);
                    const md =
                        `**Analysis Result**\n\n` +
                        `- Original: ${normalized.originalRequirement || 'N/A'}\n` +
                        `- EARS: ${normalized.earsRequirement || 'N/A'}\n` +
                        `- INCOSE: ${normalized.incoseFormat || 'N/A'}\n` +
                        `- Compliance: ${normalized.complianceFeedback || 'N/A'}\n` +
                        `- Enhanced (EARS): ${normalized.enhancedReqEars || 'N/A'}\n` +
                        `- Enhanced (INCOSE): ${normalized.enhancedReqIncose || 'N/A'}\n` +
                        `- Notes: ${normalized.enhancedGeneralFeedback || 'N/A'}`;
                    addMessage({
                        id: String(Date.now()),
                        content: md,
                        role: 'assistant',
                        timestamp: new Date(),
                        category: 'chat',
                        threadId,
                    });
                    // Nudge selection in case UI hasn't updated selection yet
                    if (threadId) {
                        try {
                            setTimeout(() => setActiveThread(threadId), 30);
                        } catch {}
                    }
                } catch {}
                // success
                break;
            } catch (error) {
                attempt++;
                if (attempt > maxRetries) {
                    console.error('handleAnalyzeAPI error:', error);
                    break;
                }
                // Wait before retrying
                await new Promise((r) => setTimeout(r, retryDelayMs));
            }
        }
    } catch (error) {
        console.error('handleAnalyzeAPI top-level error:', error);
    } finally {
        setIsAnalysing(false);
    }
}
