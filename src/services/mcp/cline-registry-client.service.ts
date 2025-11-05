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

    async fetchServers(): Promise<ClineMCPServer[]> {
        try {
            const issues = await this.fetchApprovedIssues();
            const servers = await Promise.all(
                issues.map((issue) => this.parseIssueToServer(issue)),
            );
            return servers.filter((server): server is ClineMCPServer => server !== null);
        } catch (error) {
            console.error('Failed to fetch Cline servers:', error);
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
                throw new Error(`GitHub API error: ${response.status}`);
            }

            return response.json();
        } catch (error) {
            console.error('Failed to fetch approved issues:', error);
            return [];
        }
    }

    private async parseIssueToServer(issue: GitHubIssue): Promise<ClineMCPServer | null> {
        try {
            const githubUrl = this.extractGitHubUrl(issue.body);
            if (!githubUrl) {
                console.warn(`No GitHub URL found in issue #${issue.number}`);
                return null;
            }

            const logoUrl = this.extractLogoUrl(issue.body);
            const repoInfo = await this.fetchRepoInfo(githubUrl);
            if (!repoInfo) return null;

            const hasLLMSInstall = await this.checkLLMSInstall(githubUrl);
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

            return response.json();
        } catch (error) {
            console.error('Failed to fetch repo info:', error);
            return null;
        }
    }

    private async checkLLMSInstall(githubUrl: string): Promise<boolean> {
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

            return response.ok;
        } catch (error) {
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
        } catch (error) {
            return undefined;
        }
    }
}

export const clineRegistryClient = new ClineRegistryClient();
