/**
 * Cline MCP Marketplace Registry Client
 *
 * Fetches and parses MCP servers from Cline's GitHub marketplace
 * https://github.com/cline/mcp-marketplace
 */

export interface ClineMCPServer {
    id: string;
    name: string;
    description: string;
    githubUrl: string;
    author: string;
    stars: number;
    lastUpdated: string;
    license?: string;
    logoUrl?: string;
    hasLLMSInstall: boolean;
    installInstructions?: string;
    tags?: string[];
    category?: string;
    transport?: {
        type: 'stdio' | 'sse' | 'http';
        command?: string;
        url?: string;
    };
    source: 'cline';
}

interface GitHubIssue {
    number: number;
    title: string;
    body: string;
    html_url: string;
    created_at: string;
    updated_at: string;
    labels: Array<{ name: string }>;
}

interface GitHubRepo {
    name: string;
    full_name: string;
    description: string;
    html_url: string;
    stargazers_count: number;
    updated_at: string;
    license?: { spdx_id: string; name: string };
    owner: { login: string; avatar_url: string };
    topics?: string[];
}

export class ClineRegistryClient {
    private baseUrl = 'https://api.github.com';
    private marketplaceRepo = 'cline/mcp-marketplace';
    
    // Cache for registry data
    private serversCache: { data: ClineMCPServer[]; timestamp: number } | null = null;
    private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes
    
    // Cache for repo info and LLMS install checks
    private repoInfoCache = new Map<string, { data: GitHubRepo; timestamp: number }>();
    private llmsInstallCache = new Map<string, { data: boolean; timestamp: number }>();
    private readonly REPO_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

    async fetchServers(): Promise<ClineMCPServer[]> {
        // Check cache first
        if (this.serversCache && Date.now() - this.serversCache.timestamp < this.CACHE_TTL) {
            return this.serversCache.data;
        }

        try {
            const issues = await this.fetchApprovedIssues();
            
            // Batch fetch repo info in parallel
            const repoInfoPromises = issues.map(async (issue) => {
                const githubUrl = this.extractGitHubUrl(issue.body);
                if (!githubUrl) return { issue, repoInfo: null, githubUrl: null };
                
                const repoInfo = await this.fetchRepoInfo(githubUrl);
                return { issue, repoInfo, githubUrl };
            });
            
            const repoResults = await Promise.all(repoInfoPromises);
            
            // Batch check LLMS install in parallel
            const llmsPromises = repoResults.map(async ({ githubUrl }) => {
                if (!githubUrl) return { githubUrl, hasLLMS: false };
                const hasLLMS = await this.checkLLMSInstall(githubUrl);
                return { githubUrl, hasLLMS };
            });
            
            const llmsResults = await Promise.all(llmsPromises);
            const llmsMap = new Map(llmsResults.map(r => [r.githubUrl, r.hasLLMS]));
            
            // Parse servers with cached data
            const serverPromises = repoResults.map(async ({ issue, repoInfo, githubUrl }) => {
                if (!repoInfo || !githubUrl) return null;
                return await this.parseIssueToServer(issue, repoInfo, llmsMap.get(githubUrl) || false);
            });
            const serverResults = await Promise.all(serverPromises);
            const servers = serverResults.filter((server): server is ClineMCPServer => server !== null);
            
            // Cache the results
            this.serversCache = { data: servers, timestamp: Date.now() };
            
            return servers;
        } catch (error) {
            console.error('Failed to fetch Cline servers:', error);
            // Return cached data if available, even if stale
            if (this.serversCache) {
                return this.serversCache.data;
            }
            return [];
        }
    }

    private async fetchApprovedIssues(): Promise<GitHubIssue[]> {
        try {
            const response = await fetch(
                `${this.baseUrl}/repos/${this.marketplaceRepo}/issues?labels=approved&state=closed&per_page=100`,
                {
                    headers: {
                        Accept: 'application/vnd.github.v3+json',
                        ...(process.env.GITHUB_TOKEN && {
                            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
                        }),
                    },
                },
            );

            if (!response.ok) {
                // Handle rate limiting and other errors gracefully
                if (response.status === 403 || response.status === 429) {
                    console.warn(`GitHub API rate limited or forbidden (${response.status}). Skipping Cline registry.`);
                    return [];
                }
                // Log but don't throw for other errors
                console.warn(`GitHub API error: ${response.status}. Skipping Cline registry.`);
                return [];
            }

            return response.json();
        } catch (error) {
            // Gracefully handle errors - return empty array instead of throwing
            console.warn('Failed to fetch approved issues from Cline registry:', error instanceof Error ? error.message : error);
            return [];
        }
    }

    private async parseIssueToServer(
        issue: GitHubIssue,
        repoInfo: GitHubRepo,
        hasLLMSInstall: boolean
    ): Promise<ClineMCPServer | null> {
        try {
            const githubUrl = this.extractGitHubUrl(issue.body);
            if (!githubUrl) {
                console.warn(`No GitHub URL found in issue #${issue.number}`);
                return null;
            }

            const logoUrl = this.extractLogoUrl(issue.body);
            const category = this.extractCategory(issue.labels);

            return {
                id: `cline-${issue.number}`,
                name: repoInfo.name,
                description: repoInfo.description || issue.title,
                githubUrl,
                author: repoInfo.owner.login,
                stars: repoInfo.stargazers_count,
                lastUpdated: repoInfo.updated_at,
                license: repoInfo.license?.spdx_id,
                logoUrl: logoUrl || repoInfo.owner.avatar_url,
                hasLLMSInstall,
                tags: repoInfo.topics,
                category,
                source: 'cline',
            };
        } catch (error) {
            console.error(`Failed to parse issue #${issue.number}:`, error);
            return null;
        }
    }

    private extractGitHubUrl(body: string): string | null {
        const patterns = [
            /https?:\/\/github\.com\/[\w-]+\/[\w-]+/i,
            /github\.com\/[\w-]+\/[\w-]+/i,
        ];

        for (const pattern of patterns) {
            const match = body.match(pattern);
            if (match) {
                let url = match[0];
                if (!url.startsWith('http')) url = `https://${url}`;
                return url.replace(/\/$/, '').split('/').slice(0, 5).join('/');
            }
        }
        return null;
    }

    private extractLogoUrl(body: string): string | null {
        const imagePattern = /!\[.*?\]\((https?:\/\/[^\)]+)\)/;
        const match = body.match(imagePattern);
        return match ? match[1] : null;
    }

    private async fetchRepoInfo(githubUrl: string): Promise<GitHubRepo | null> {
        // Check cache first
        const cached = this.repoInfoCache.get(githubUrl);
        if (cached && Date.now() - cached.timestamp < this.REPO_CACHE_TTL) {
            return cached.data;
        }

        try {
            const match = githubUrl.match(/github\.com\/([\w-]+)\/([\w-]+)/);
            if (!match) return null;

            const [, owner, repo] = match;
            const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}`, {
                headers: {
                    Accept: 'application/vnd.github.v3+json',
                    ...(process.env.GITHUB_TOKEN && {
                        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
                    }),
                },
            });

            if (!response.ok) {
                console.warn(`Failed to fetch repo info for ${owner}/${repo}`);
                return null;
            }

            const repoInfo = await response.json();
            
            // Cache the result
            this.repoInfoCache.set(githubUrl, { data: repoInfo, timestamp: Date.now() });
            
            return repoInfo;
        } catch (error) {
            console.error('Failed to fetch repo info:', error);
            return null;
        }
    }

    async checkLLMSInstall(githubUrl: string): Promise<boolean> {
        // Check cache first
        const cached = this.llmsInstallCache.get(githubUrl);
        if (cached && Date.now() - cached.timestamp < this.REPO_CACHE_TTL) {
            return cached.data;
        }

        try {
            const match = githubUrl.match(/github\.com\/([\w-]+)\/([\w-]+)/);
            if (!match) return false;

            const [, owner, repo] = match;
            const response = await fetch(
                `${this.baseUrl}/repos/${owner}/${repo}/contents/llms-install.md`,
                {
                    headers: {
                        Accept: 'application/vnd.github.v3+json',
                        ...(process.env.GITHUB_TOKEN && {
                            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
                        }),
                    },
                },
            );

            const hasLLMS = response.ok;
            
            // Cache the result
            this.llmsInstallCache.set(githubUrl, { data: hasLLMS, timestamp: Date.now() });
            
            return hasLLMS;
        } catch {
            return false;
        }
    }

    private extractCategory(labels: Array<{ name: string }>): string | undefined {
        const categoryLabels = [
            'database',
            'api',
            'productivity',
            'development',
            'communication',
            'data',
            'ai',
            'automation',
        ];

        for (const label of labels) {
            const labelName = label.name.toLowerCase();
            if (categoryLabels.includes(labelName)) {
                return labelName;
            }
        }

        return undefined;
    }

    async fetchInstallInstructions(githubUrl: string): Promise<string | undefined> {
        try {
            const match = githubUrl.match(/github\.com\/([\w-]+)\/([\w-]+)/);
            if (!match) return undefined;

            const [, owner, repo] = match;
            const response = await fetch(
                `${this.baseUrl}/repos/${owner}/${repo}/contents/llms-install.md`,
                {
                    headers: {
                        Accept: 'application/vnd.github.v3.raw',
                        ...(process.env.GITHUB_TOKEN && {
                            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
                        }),
                    },
                },
            );

            if (!response.ok) return undefined;
            return response.text();
        } catch {
            return undefined;
        }
    }

    /**
     * Clear all caches
     */
    clearCache(): void {
        this.serversCache = null;
        this.repoInfoCache.clear();
        this.llmsInstallCache.clear();
    }
}

export const clineRegistryClient = new ClineRegistryClient();
