/**
 * E2E Test Coverage Tracking System
 * Maps test coverage to user stories, requirements, and application features
 */

export interface UserStory {
    id: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    epic: string;
    acceptanceCriteria: string[];
    testCoverage: TestCoverage[];
}

export interface TestCoverage {
    testId: string;
    testName: string;
    testFile: string;
    coverageType: 'happy-path' | 'edge-case' | 'error-handling' | 'performance' | 'accessibility' | 'security';
    browsers: string[];
    lastRun: string;
    status: 'passing' | 'failing' | 'skipped';
}

export interface FeatureMapping {
    feature: string;
    routes: string[];
    components: string[];
    userStories: string[];
    tests: TestCoverage[];
    coveragePercentage: number;
}

export class CoverageTracker {
    private userStories: Map<string, UserStory> = new Map();
    private featureMappings: Map<string, FeatureMapping> = new Map();
    private testResults: Map<string, TestCoverage> = new Map();

    constructor() {
        this.initializeUserStories();
        this.initializeFeatureMappings();
    }

    private initializeUserStories(): void {
        const stories: UserStory[] = [
            // Authentication Epic
            {
                id: 'AUTH-001',
                title: 'User Registration',
                description: 'As a new user, I want to create an account so I can access the platform',
                priority: 'high',
                epic: 'Authentication',
                acceptanceCriteria: [
                    'User can register with email and password',
                    'Email verification is required',
                    'Password strength requirements are enforced',
                    'User receives welcome email after registration'
                ],
                testCoverage: []
            },
            {
                id: 'AUTH-002',
                title: 'User Login',
                description: 'As a returning user, I want to log in to access my account',
                priority: 'high',
                epic: 'Authentication',
                acceptanceCriteria: [
                    'User can login with email and password',
                    'User can login with OAuth providers',
                    'Invalid credentials show appropriate error',
                    'Account lockout after multiple failed attempts'
                ],
                testCoverage: []
            },
            {
                id: 'AUTH-003',
                title: 'Password Recovery',
                description: 'As a user, I want to reset my password if I forget it',
                priority: 'medium',
                epic: 'Authentication',
                acceptanceCriteria: [
                    'User can request password reset via email',
                    'Reset link expires after reasonable time',
                    'User can set new password using reset link',
                    'Old sessions are invalidated after password reset'
                ],
                testCoverage: []
            },
            
            // Project Management Epic
            {
                id: 'PROJ-001',
                title: 'Create Project',
                description: 'As a user, I want to create new projects to organize my work',
                priority: 'high',
                epic: 'Project Management',
                acceptanceCriteria: [
                    'User can create project with name and description',
                    'User can select project template',
                    'Project is added to user\'s project list',
                    'User becomes project owner automatically'
                ],
                testCoverage: []
            },
            {
                id: 'PROJ-002',
                title: 'Project Navigation',
                description: 'As a user, I want to navigate between different project sections',
                priority: 'high',
                epic: 'Project Management',
                acceptanceCriteria: [
                    'User can access requirements section',
                    'User can access documents section',
                    'User can access canvas/diagrams section',
                    'User can access testing section',
                    'Navigation state is preserved'
                ],
                testCoverage: []
            },
            {
                id: 'PROJ-003',
                title: 'Project Collaboration',
                description: 'As a project owner, I want to invite team members to collaborate',
                priority: 'medium',
                epic: 'Project Management',
                acceptanceCriteria: [
                    'Owner can invite users by email',
                    'Invited users receive invitation email',
                    'Users can accept/decline invitations',
                    'Different permission levels are enforced'
                ],
                testCoverage: []
            },

            // Requirements Management Epic
            {
                id: 'REQ-001',
                title: 'Create Requirements',
                description: 'As a project member, I want to create and manage requirements',
                priority: 'high',
                epic: 'Requirements Management',
                acceptanceCriteria: [
                    'User can create functional requirements',
                    'User can create non-functional requirements',
                    'Requirements have priority levels',
                    'Requirements can be linked to other requirements'
                ],
                testCoverage: []
            },
            {
                id: 'REQ-002',
                title: 'Requirements Traceability',
                description: 'As a project member, I want to trace requirements through implementation',
                priority: 'medium',
                epic: 'Requirements Management',
                acceptanceCriteria: [
                    'Requirements can be linked to documents',
                    'Requirements can be linked to test cases',
                    'Traceability matrix is automatically maintained',
                    'Changes propagate through linked items'
                ],
                testCoverage: []
            },

            // Document Management Epic
            {
                id: 'DOC-001',
                title: 'Create Documents',
                description: 'As a user, I want to create and edit project documents',
                priority: 'high',
                epic: 'Document Management',
                acceptanceCriteria: [
                    'User can create different document types',
                    'Rich text editing is available',
                    'Documents can include images and links',
                    'Document versions are tracked'
                ],
                testCoverage: []
            },
            {
                id: 'DOC-002',
                title: 'Document Collaboration',
                description: 'As a team member, I want to collaborate on documents in real-time',
                priority: 'medium',
                epic: 'Document Management',
                acceptanceCriteria: [
                    'Multiple users can edit simultaneously',
                    'Changes are synchronized in real-time',
                    'Conflict resolution is handled gracefully',
                    'Comment system for feedback'
                ],
                testCoverage: []
            },

            // Visual Design Epic
            {
                id: 'VIS-001',
                title: 'Create Diagrams',
                description: 'As a user, I want to create visual diagrams and mockups',
                priority: 'medium',
                epic: 'Visual Design',
                acceptanceCriteria: [
                    'User can create system architecture diagrams',
                    'User can create UI wireframes',
                    'Diagrams can be exported in multiple formats',
                    'Collaborative editing is supported'
                ],
                testCoverage: []
            },

            // Testing Epic
            {
                id: 'TEST-001',
                title: 'Test Case Management',
                description: 'As a tester, I want to create and manage test cases',
                priority: 'high',
                epic: 'Testing',
                acceptanceCriteria: [
                    'User can create manual test cases',
                    'Test cases can be linked to requirements',
                    'Test execution results are tracked',
                    'Test reports can be generated'
                ],
                testCoverage: []
            }
        ];

        stories.forEach(story => this.userStories.set(story.id, story));
    }

    private initializeFeatureMappings(): void {
        const mappings: FeatureMapping[] = [
            {
                feature: 'Authentication',
                routes: ['/login', '/signup', '/forgot-password', '/reset-password'],
                components: ['AuthForm', 'LoginForm', 'SignupForm', 'PasswordReset', 'OAuthButtons'],
                userStories: ['AUTH-001', 'AUTH-002', 'AUTH-003'],
                tests: [],
                coveragePercentage: 0
            },
            {
                feature: 'Dashboard',
                routes: ['/home', '/dashboard'],
                components: ['Dashboard', 'ProjectList', 'RecentActivity', 'QuickActions'],
                userStories: ['PROJ-001', 'PROJ-002'],
                tests: [],
                coveragePercentage: 0
            },
            {
                feature: 'Project Management',
                routes: ['/org/:orgId', '/org/:orgId/project/:projectId'],
                components: ['ProjectDashboard', 'ProjectHeader', 'ProjectNavigation', 'ProjectSettings'],
                userStories: ['PROJ-001', 'PROJ-002', 'PROJ-003'],
                tests: [],
                coveragePercentage: 0
            },
            {
                feature: 'Requirements',
                routes: ['/org/:orgId/project/:projectId/requirements', '/org/:orgId/project/:projectId/requirements/:reqId'],
                components: ['RequirementsList', 'RequirementForm', 'RequirementDetail', 'TraceabilityMatrix'],
                userStories: ['REQ-001', 'REQ-002'],
                tests: [],
                coveragePercentage: 0
            },
            {
                feature: 'Documents',
                routes: ['/org/:orgId/project/:projectId/documents', '/org/:orgId/project/:projectId/documents/:docId'],
                components: ['DocumentList', 'DocumentEditor', 'DocumentViewer', 'DocumentCollaboration'],
                userStories: ['DOC-001', 'DOC-002'],
                tests: [],
                coveragePercentage: 0
            },
            {
                feature: 'Visual Design',
                routes: ['/org/:orgId/project/:projectId/canvas'],
                components: ['Canvas', 'DiagramEditor', 'ComponentLibrary', 'ExportTools'],
                userStories: ['VIS-001'],
                tests: [],
                coveragePercentage: 0
            },
            {
                feature: 'Testing',
                routes: ['/org/:orgId/project/:projectId/testbed'],
                components: ['TestCaseList', 'TestCaseForm', 'TestExecution', 'TestReports'],
                userStories: ['TEST-001'],
                tests: [],
                coveragePercentage: 0
            }
        ];

        mappings.forEach(mapping => this.featureMappings.set(mapping.feature, mapping));
    }

    // Test registration and tracking
    public registerTest(testCoverage: TestCoverage): void {
        this.testResults.set(testCoverage.testId, testCoverage);
        
        // Associate test with relevant user stories
        this.associateTestWithStories(testCoverage);
        
        // Update feature coverage
        this.updateFeatureCoverage(testCoverage);
    }

    private associateTestWithStories(testCoverage: TestCoverage): void {
        // Auto-associate tests with user stories based on test name and file
        const testContext = testCoverage.testFile.toLowerCase() + ' ' + testCoverage.testName.toLowerCase();
        
        this.userStories.forEach((story, storyId) => {
            const epic = story.epic.toLowerCase();
            const title = story.title.toLowerCase();
            
            if (testContext.includes(epic) || testContext.includes(title)) {
                const existingCoverage = story.testCoverage.find(t => t.testId === testCoverage.testId);
                if (!existingCoverage) {
                    story.testCoverage.push(testCoverage);
                }
            }
        });
    }

    private updateFeatureCoverage(testCoverage: TestCoverage): void {
        this.featureMappings.forEach(mapping => {
            const testContext = testCoverage.testFile.toLowerCase() + ' ' + testCoverage.testName.toLowerCase();
            const featureName = mapping.feature.toLowerCase();
            
            if (testContext.includes(featureName)) {
                const existingTest = mapping.tests.find(t => t.testId === testCoverage.testId);
                if (!existingTest) {
                    mapping.tests.push(testCoverage);
                    mapping.coveragePercentage = this.calculateFeatureCoverage(mapping);
                }
            }
        });
    }

    private calculateFeatureCoverage(mapping: FeatureMapping): number {
        const totalStories = mapping.userStories.length;
        if (totalStories === 0) return 100;

        const coveredStories = mapping.userStories.filter(storyId => {
            const story = this.userStories.get(storyId);
            return story && story.testCoverage.length > 0;
        }).length;

        return Math.round((coveredStories / totalStories) * 100);
    }

    // Coverage reporting
    public generateCoverageReport(): CoverageReport {
        const storyMetrics = this.getStoryMetrics();
        const featureMetrics = this.getFeatureMetrics();
        const testMetrics = this.getTestMetrics();
        
        return {
            timestamp: new Date().toISOString(),
            summary: {
                totalUserStories: this.userStories.size,
                coveredUserStories: storyMetrics.covered,
                totalFeatures: this.featureMappings.size,
                totalTests: this.testResults.size,
                passingTests: testMetrics.passing,
                failingTests: testMetrics.failing,
                overallCoverage: this.calculateOverallCoverage()
            },
            storyMetrics,
            featureMetrics,
            testMetrics,
            gaps: this.identifyCoverageGaps(),
            recommendations: this.generateRecommendations()
        };
    }

    private getStoryMetrics() {
        const stories = Array.from(this.userStories.values());
        const covered = stories.filter(story => story.testCoverage.length > 0).length;
        const uncovered = stories.length - covered;
        
        const byPriority = {
            high: stories.filter(s => s.priority === 'high'),
            medium: stories.filter(s => s.priority === 'medium'),
            low: stories.filter(s => s.priority === 'low')
        };

        return {
            total: stories.length,
            covered,
            uncovered,
            coveragePercentage: Math.round((covered / stories.length) * 100),
            byPriority: {
                high: {
                    total: byPriority.high.length,
                    covered: byPriority.high.filter(s => s.testCoverage.length > 0).length
                },
                medium: {
                    total: byPriority.medium.length,
                    covered: byPriority.medium.filter(s => s.testCoverage.length > 0).length
                },
                low: {
                    total: byPriority.low.length,
                    covered: byPriority.low.filter(s => s.testCoverage.length > 0).length
                }
            }
        };
    }

    private getFeatureMetrics() {
        const features = Array.from(this.featureMappings.values());
        
        return features.map(feature => ({
            name: feature.feature,
            coveragePercentage: feature.coveragePercentage,
            totalTests: feature.tests.length,
            passingTests: feature.tests.filter(t => t.status === 'passing').length,
            failingTests: feature.tests.filter(t => t.status === 'failing').length,
            testTypes: this.groupTestsByType(feature.tests)
        }));
    }

    private getTestMetrics() {
        const tests = Array.from(this.testResults.values());
        
        return {
            total: tests.length,
            passing: tests.filter(t => t.status === 'passing').length,
            failing: tests.filter(t => t.status === 'failing').length,
            skipped: tests.filter(t => t.status === 'skipped').length,
            byType: this.groupTestsByType(tests),
            byBrowser: this.groupTestsByBrowser(tests)
        };
    }

    private groupTestsByType(tests: TestCoverage[]) {
        const types = ['happy-path', 'edge-case', 'error-handling', 'performance', 'accessibility', 'security'];
        const grouped: Record<string, number> = {};
        
        types.forEach(type => {
            grouped[type] = tests.filter(t => t.coverageType === type).length;
        });
        
        return grouped;
    }

    private groupTestsByBrowser(tests: TestCoverage[]) {
        const browsers = ['chromium', 'firefox', 'webkit'];
        const grouped: Record<string, number> = {};
        
        browsers.forEach(browser => {
            grouped[browser] = tests.filter(t => t.browsers.includes(browser)).length;
        });
        
        return grouped;
    }

    private calculateOverallCoverage(): number {
        const storyMetrics = this.getStoryMetrics();
        return storyMetrics.coveragePercentage;
    }

    private identifyCoverageGaps(): CoverageGap[] {
        const gaps: CoverageGap[] = [];
        
        // Identify uncovered user stories
        this.userStories.forEach(story => {
            if (story.testCoverage.length === 0) {
                gaps.push({
                    type: 'uncovered-story',
                    title: `Uncovered User Story: ${story.title}`,
                    description: `${story.id} has no test coverage`,
                    priority: story.priority,
                    recommendation: `Create E2E tests covering all acceptance criteria for ${story.title}`
                });
            }
        });

        // Identify features with low coverage
        this.featureMappings.forEach(feature => {
            if (feature.coveragePercentage < 70) {
                gaps.push({
                    type: 'low-feature-coverage',
                    title: `Low Coverage: ${feature.feature}`,
                    description: `${feature.feature} has only ${feature.coveragePercentage}% test coverage`,
                    priority: 'medium',
                    recommendation: `Add more comprehensive tests for ${feature.feature} components and user flows`
                });
            }
        });

        // Identify missing test types
        const tests = Array.from(this.testResults.values());
        const testTypes = this.groupTestsByType(tests);
        
        Object.entries(testTypes).forEach(([type, count]) => {
            if (count === 0) {
                gaps.push({
                    type: 'missing-test-type',
                    title: `Missing ${type} tests`,
                    description: `No ${type} tests found in the test suite`,
                    priority: type === 'happy-path' ? 'high' : 'medium',
                    recommendation: `Implement ${type} tests across key user workflows`
                });
            }
        });

        return gaps;
    }

    private generateRecommendations(): string[] {
        const recommendations: string[] = [];
        const gaps = this.identifyCoverageGaps();
        const storyMetrics = this.getStoryMetrics();
        
        // High-priority recommendations
        const highPriorityGaps = gaps.filter(g => g.priority === 'high');
        if (highPriorityGaps.length > 0) {
            recommendations.push(`Address ${highPriorityGaps.length} high-priority coverage gaps immediately`);
        }

        // Coverage percentage recommendations
        if (storyMetrics.coveragePercentage < 80) {
            recommendations.push('Increase overall test coverage to at least 80%');
        }

        // Test type diversity recommendations
        const tests = Array.from(this.testResults.values());
        const testTypes = this.groupTestsByType(tests);
        
        if (testTypes['accessibility'] < 5) {
            recommendations.push('Add more accessibility tests to ensure WCAG compliance');
        }
        
        if (testTypes['performance'] < 3) {
            recommendations.push('Implement performance tests for critical user workflows');
        }
        
        if (testTypes['error-handling'] < 10) {
            recommendations.push('Increase error handling test coverage for better resilience');
        }

        // Browser coverage recommendations
        const browserCoverage = this.groupTestsByBrowser(tests);
        const minBrowserCoverage = Math.min(...Object.values(browserCoverage));
        
        if (minBrowserCoverage < tests.length * 0.8) {
            recommendations.push('Ensure all critical tests run across all supported browsers');
        }

        return recommendations;
    }

    // Utility methods for test registration
    public static createTestCoverage(
        testId: string,
        testName: string,
        testFile: string,
        coverageType: TestCoverage['coverageType'],
        browsers: string[] = ['chromium'],
        status: TestCoverage['status'] = 'passing'
    ): TestCoverage {
        return {
            testId,
            testName,
            testFile,
            coverageType,
            browsers,
            lastRun: new Date().toISOString(),
            status
        };
    }
}

// Types
export interface CoverageReport {
    timestamp: string;
    summary: {
        totalUserStories: number;
        coveredUserStories: number;
        totalFeatures: number;
        totalTests: number;
        passingTests: number;
        failingTests: number;
        overallCoverage: number;
    };
    storyMetrics: any;
    featureMetrics: any[];
    testMetrics: any;
    gaps: CoverageGap[];
    recommendations: string[];
}

export interface CoverageGap {
    type: 'uncovered-story' | 'low-feature-coverage' | 'missing-test-type';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    recommendation: string;
}

// Global coverage tracker instance
export const coverageTracker = new CoverageTracker();