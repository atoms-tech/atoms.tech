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
        // Ensure a pinned org for sandbox so threads/messages can persist
        try {
            const { currentPinnedOrganizationId, currentOrgId, setUserContext } = (
                await import('@/components/custom/AgentChat/hooks/useAgentStore')
            ).useAgentStore.getState();
            if (!currentPinnedOrganizationId) {
                const sandboxId = currentOrgId || 'sandbox-org';
                setUserContext({ orgId: sandboxId, pinnedOrganizationId: sandboxId, username: 'Guest' });
            }
        } catch {}
        let attempt = 0;
        while (attempt <= 0) {
            try {
                // /////****///// MODIFIED: Added JWT token retrieval from Supabase
                // // Get JWT token from Supabase
                // let jwtToken: string | null = null;
                // try {
                //     const { supabase } = await import('@/lib/supabase/supabaseBrowser');
                //     const { data } = await supabase.auth.getSession();
                //     jwtToken = data.session?.access_token ?? null;
                //     console.log('[handleAnalyzeAPI] JWT token retrieved:', !!jwtToken);
                // } catch (tokenErr) {
                //     console.warn('[handleAnalyzeAPI] Failed to retrieve JWT token:', tokenErr);
                // }
                // /////****///// END MODIFIED

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
                
                /////****///// MODIFIED: Added JWT in Authorization header
                // Build fetch options with JWT in Authorization header
                const fetchOptions: RequestInit = {
                    method: 'POST',
                    body: formData,
                };
                // if (jwtToken) {
                //     fetchOptions.headers = {
                //         'Authorization': `Bearer ${jwtToken}`,
                //     };
                // }
                
                const res = await fetch(fullUrl, fetchOptions);
                /////****///// END MODIFIED
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

                // Create a new chat thread and display messages into the agent panel
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
                    // Ensure pinned org again in case it wasn't set yet when panel opened
                    if (!currentPinnedOrganizationId) {
                        const sandboxId = currentOrgId || 'sandbox-org';
                        setUserContext({ orgId: sandboxId, pinnedOrganizationId: sandboxId, username: 'Guest' });
                    }
                    // Optionally title the current thread if generic
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
                    const base = (reqText || 'Analysis').trim().replace(/\s+/g, ' ');
                    const max = 60;
                    const title = base.length > max ? `Analysis: ${base.slice(0, max)}…` : `Analysis: ${base}`;
                    const threadId = newThread(title, 'analysis') || undefined;
                    if (threadId) setActiveThread(threadId);
                    // Post individual section messages
                    const mk = (s: string) => (s && s.trim().length > 0 ? s : 'N/A');
                    const now = Date.now();
                    const messages = [
                        { content: `**Analysis Result**` },
                        { content: `### Original Requirement\n\n${mk(normalized.originalRequirement)}` },
                        { content: `### EARS\n\n${mk(normalized.earsRequirement)}` },
                        { content: `### INCOSE\n\n${mk(normalized.incoseFormat)}` },
                        { content: `### INCOSE Feedback\n\n${mk(normalized.incoseFeedback)}` },
                        { content: `### Compliance\n\n${mk(normalized.complianceFeedback)}` },
                        { content: `### Enhanced (EARS)\n\n${mk(normalized.enhancedReqEars)}` },
                        { content: `### Enhanced (INCOSE)\n\n${mk(normalized.enhancedReqIncose)}` },
                        { content: `### Enhanced Feedback\n\n${mk(normalized.enhancedGeneralFeedback)}` },
                    ];
                    messages.forEach((m, idx) =>
                        addMessage({
                            id: String(now + idx),
                            content: m.content,
                            role: 'assistant',
                            timestamp: new Date(),
                            category: 'chat',
                            threadId,
                        }),
                    );
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
