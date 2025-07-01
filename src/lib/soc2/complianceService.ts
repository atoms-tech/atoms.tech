import { exec } from 'child_process';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

// SOC2 Control Families
export enum ControlFamily {
    CC1 = 'CC1', // Control Environment
    CC2 = 'CC2', // Communication and Information
    CC3 = 'CC3', // Risk Assessment
    CC4 = 'CC4', // Monitoring Activities
    CC5 = 'CC5', // Control Activities
    CC6 = 'CC6', // Logical and Physical Access Controls
    CC7 = 'CC7', // System Operations
    CC8 = 'CC8', // Change Management
}

// Compliance Status
export enum ComplianceStatus {
    COMPLIANT = 'compliant',
    NON_COMPLIANT = 'non_compliant',
    IN_PROGRESS = 'in_progress',
    NOT_ASSESSED = 'not_assessed',
}

// Risk Level
export enum RiskLevel {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical',
}

// Control Interface
export interface Control {
    id: string;
    name: string;
    description: string;
    family: ControlFamily;
    status: ComplianceStatus;
    riskLevel: RiskLevel;
    lastAssessed: Date;
    nextAssessment: Date;
    evidence: string[];
    issues: Issue[];
}

// Issue Interface
export interface Issue {
    id: string;
    controlId: string;
    title: string;
    description: string;
    severity: RiskLevel;
    status: 'open' | 'in_progress' | 'resolved';
    createdAt: Date;
    resolvedAt?: Date;
    assignee?: string;
}

// Compliance Summary
export interface ComplianceSummary {
    totalControls: number;
    compliantControls: number;
    nonCompliantControls: number;
    inProgressControls: number;
    notAssessedControls: number;
    compliancePercentage: number;
    riskScore: number;
    lastUpdated: Date;
}

// Audit Event
export interface AuditEvent {
    id: string;
    timestamp: Date;
    eventType: string;
    userId?: string;
    resource: string;
    action: string;
    details: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
}

export class SOC2ComplianceService {
    private static instance: SOC2ComplianceService;
    private complyPath: string;

    private constructor() {
        this.complyPath = path.join(process.cwd(), 'comply-v1.6.0-linux-amd64');
    }

    public static getInstance(): SOC2ComplianceService {
        if (!SOC2ComplianceService.instance) {
            SOC2ComplianceService.instance = new SOC2ComplianceService();
        }
        return SOC2ComplianceService.instance;
    }

    /**
     * Get compliance summary
     */
    async getComplianceSummary(): Promise<ComplianceSummary> {
        try {
            const controls = await this.getAllControls();

            const totalControls = controls.length;
            const compliantControls = controls.filter(
                (c) => c.status === ComplianceStatus.COMPLIANT,
            ).length;
            const nonCompliantControls = controls.filter(
                (c) => c.status === ComplianceStatus.NON_COMPLIANT,
            ).length;
            const inProgressControls = controls.filter(
                (c) => c.status === ComplianceStatus.IN_PROGRESS,
            ).length;
            const notAssessedControls = controls.filter(
                (c) => c.status === ComplianceStatus.NOT_ASSESSED,
            ).length;

            const compliancePercentage =
                totalControls > 0
                    ? (compliantControls / totalControls) * 100
                    : 0;
            const riskScore = this.calculateRiskScore(controls);

            return {
                totalControls,
                compliantControls,
                nonCompliantControls,
                inProgressControls,
                notAssessedControls,
                compliancePercentage,
                riskScore,
                lastUpdated: new Date(),
            };
        } catch (error) {
            console.error('Error getting compliance summary:', error);
            throw error;
        }
    }

    /**
     * Get all controls
     */
    async getAllControls(): Promise<Control[]> {
        // Comprehensive SOC2 controls data based on actual Trust Service Criteria
        return [
            // CC1 - Control Environment
            {
                id: 'CC1.1',
                name: 'Control Environment - Integrity and Ethical Values',
                description:
                    'The entity demonstrates a commitment to integrity and ethical values.',
                family: ControlFamily.CC1,
                status: ComplianceStatus.COMPLIANT,
                riskLevel: RiskLevel.LOW,
                lastAssessed: new Date('2024-01-15'),
                nextAssessment: new Date('2024-04-15'),
                evidence: [
                    'Code of Conduct',
                    'Ethics Training Records',
                    'Whistleblower Policy',
                ],
                issues: [],
            },
            {
                id: 'CC1.2',
                name: 'Control Environment - Board Independence',
                description:
                    'The board of directors demonstrates independence from management.',
                family: ControlFamily.CC1,
                status: ComplianceStatus.COMPLIANT,
                riskLevel: RiskLevel.LOW,
                lastAssessed: new Date('2024-01-20'),
                nextAssessment: new Date('2024-04-20'),
                evidence: [
                    'Board Charter',
                    'Independence Declarations',
                    'Meeting Minutes',
                ],
                issues: [],
            },
            {
                id: 'CC1.3',
                name: 'Control Environment - Organizational Structure',
                description:
                    'Management establishes structures, reporting lines, and appropriate authorities.',
                family: ControlFamily.CC1,
                status: ComplianceStatus.COMPLIANT,
                riskLevel: RiskLevel.LOW,
                lastAssessed: new Date('2024-01-18'),
                nextAssessment: new Date('2024-04-18'),
                evidence: ['Org Chart', 'Job Descriptions', 'Authority Matrix'],
                issues: [],
            },
            {
                id: 'CC1.4',
                name: 'Control Environment - Competence',
                description:
                    'The entity demonstrates a commitment to attract, develop, and retain competent individuals.',
                family: ControlFamily.CC1,
                status: ComplianceStatus.IN_PROGRESS,
                riskLevel: RiskLevel.MEDIUM,
                lastAssessed: new Date('2024-01-12'),
                nextAssessment: new Date('2024-02-12'),
                evidence: [
                    'Training Programs',
                    'Performance Reviews',
                    'Competency Framework',
                ],
                issues: [
                    {
                        id: 'ISS-003',
                        controlId: 'CC1.4',
                        title: 'Security Training Completion Rate Below Target',
                        description:
                            'Only 78% of employees completed mandatory security training',
                        severity: RiskLevel.MEDIUM,
                        status: 'open',
                        createdAt: new Date('2024-01-25'),
                        assignee: 'hr-team',
                    },
                ],
            },
            {
                id: 'CC1.5',
                name: 'Control Environment - Accountability',
                description:
                    'The entity holds individuals accountable for their internal control responsibilities.',
                family: ControlFamily.CC1,
                status: ComplianceStatus.COMPLIANT,
                riskLevel: RiskLevel.LOW,
                lastAssessed: new Date('2024-01-22'),
                nextAssessment: new Date('2024-04-22'),
                evidence: [
                    'Performance Metrics',
                    'Accountability Framework',
                    'Disciplinary Procedures',
                ],
                issues: [],
            },

            // CC2 - Communication and Information
            {
                id: 'CC2.1',
                name: 'Communication and Information - Internal Communication',
                description:
                    'The entity obtains or generates and uses relevant, quality information.',
                family: ControlFamily.CC2,
                status: ComplianceStatus.COMPLIANT,
                riskLevel: RiskLevel.LOW,
                lastAssessed: new Date('2024-01-16'),
                nextAssessment: new Date('2024-04-16'),
                evidence: [
                    'Communication Policies',
                    'Information Systems',
                    'Data Quality Controls',
                ],
                issues: [],
            },
            {
                id: 'CC2.2',
                name: 'Communication and Information - External Communication',
                description:
                    'The entity internally communicates information necessary for effective internal control.',
                family: ControlFamily.CC2,
                status: ComplianceStatus.COMPLIANT,
                riskLevel: RiskLevel.LOW,
                lastAssessed: new Date('2024-01-14'),
                nextAssessment: new Date('2024-04-14'),
                evidence: [
                    'External Communication Procedures',
                    'Stakeholder Reports',
                    'Public Disclosures',
                ],
                issues: [],
            },
            {
                id: 'CC2.3',
                name: 'Communication and Information - External Communication',
                description:
                    'The entity communicates with external parties regarding matters affecting internal control.',
                family: ControlFamily.CC2,
                status: ComplianceStatus.IN_PROGRESS,
                riskLevel: RiskLevel.MEDIUM,
                lastAssessed: new Date('2024-01-08'),
                nextAssessment: new Date('2024-02-08'),
                evidence: [
                    'Vendor Communications',
                    'Customer Notifications',
                    'Regulatory Reporting',
                ],
                issues: [
                    {
                        id: 'ISS-004',
                        controlId: 'CC2.3',
                        title: 'Incident Communication Process Needs Update',
                        description:
                            'External incident communication procedures require revision',
                        severity: RiskLevel.MEDIUM,
                        status: 'in_progress',
                        createdAt: new Date('2024-01-28'),
                        assignee: 'compliance-team',
                    },
                ],
            },

            // CC3 - Risk Assessment
            {
                id: 'CC3.1',
                name: 'Risk Assessment - Objectives',
                description:
                    'The entity specifies objectives with sufficient clarity to enable identification of risks.',
                family: ControlFamily.CC3,
                status: ComplianceStatus.COMPLIANT,
                riskLevel: RiskLevel.LOW,
                lastAssessed: new Date('2024-01-19'),
                nextAssessment: new Date('2024-04-19'),
                evidence: [
                    'Strategic Objectives',
                    'Risk Register',
                    'Objective Setting Process',
                ],
                issues: [],
            },
            {
                id: 'CC3.2',
                name: 'Risk Assessment - Risk Identification',
                description:
                    'The entity identifies risks to the achievement of its objectives.',
                family: ControlFamily.CC3,
                status: ComplianceStatus.COMPLIANT,
                riskLevel: RiskLevel.LOW,
                lastAssessed: new Date('2024-01-17'),
                nextAssessment: new Date('2024-04-17'),
                evidence: [
                    'Risk Assessment Procedures',
                    'Risk Identification Workshops',
                    'Threat Analysis',
                ],
                issues: [],
            },
            {
                id: 'CC3.3',
                name: 'Risk Assessment - Fraud Risk',
                description:
                    'The entity considers the potential for fraud in assessing risks.',
                family: ControlFamily.CC3,
                status: ComplianceStatus.COMPLIANT,
                riskLevel: RiskLevel.MEDIUM,
                lastAssessed: new Date('2024-01-13'),
                nextAssessment: new Date('2024-04-13'),
                evidence: [
                    'Fraud Risk Assessment',
                    'Anti-Fraud Policies',
                    'Fraud Detection Controls',
                ],
                issues: [],
            },
            {
                id: 'CC3.4',
                name: 'Risk Assessment - Significant Changes',
                description:
                    'The entity identifies and assesses changes that could significantly impact internal control.',
                family: ControlFamily.CC3,
                status: ComplianceStatus.IN_PROGRESS,
                riskLevel: RiskLevel.MEDIUM,
                lastAssessed: new Date('2024-01-11'),
                nextAssessment: new Date('2024-02-11'),
                evidence: [
                    'Change Management Process',
                    'Impact Assessments',
                    'Change Control Board',
                ],
                issues: [
                    {
                        id: 'ISS-005',
                        controlId: 'CC3.4',
                        title: 'Change Impact Assessment Process Incomplete',
                        description:
                            'Formal process for assessing control impacts of changes needs enhancement',
                        severity: RiskLevel.MEDIUM,
                        status: 'open',
                        createdAt: new Date('2024-01-30'),
                        assignee: 'risk-team',
                    },
                ],
            },

            // CC4 - Monitoring Activities
            {
                id: 'CC4.1',
                name: 'Monitoring Activities - Ongoing Evaluations',
                description:
                    'The entity selects, develops, and performs ongoing and/or separate evaluations.',
                family: ControlFamily.CC4,
                status: ComplianceStatus.COMPLIANT,
                riskLevel: RiskLevel.LOW,
                lastAssessed: new Date('2024-01-21'),
                nextAssessment: new Date('2024-04-21'),
                evidence: [
                    'Monitoring Procedures',
                    'Control Testing Results',
                    'Evaluation Reports',
                ],
                issues: [],
            },
            {
                id: 'CC4.2',
                name: 'Monitoring Activities - Deficiency Evaluation',
                description:
                    'The entity evaluates and communicates internal control deficiencies.',
                family: ControlFamily.CC4,
                status: ComplianceStatus.COMPLIANT,
                riskLevel: RiskLevel.LOW,
                lastAssessed: new Date('2024-01-23'),
                nextAssessment: new Date('2024-04-23'),
                evidence: [
                    'Deficiency Tracking',
                    'Remediation Plans',
                    'Management Reports',
                ],
                issues: [],
            },

            // CC5 - Control Activities
            {
                id: 'CC5.1',
                name: 'Control Activities - Selection and Development',
                description:
                    'The entity selects and develops control activities that contribute to risk mitigation.',
                family: ControlFamily.CC5,
                status: ComplianceStatus.COMPLIANT,
                riskLevel: RiskLevel.LOW,
                lastAssessed: new Date('2024-01-24'),
                nextAssessment: new Date('2024-04-24'),
                evidence: [
                    'Control Design Documentation',
                    'Risk-Control Matrix',
                    'Control Effectiveness Testing',
                ],
                issues: [],
            },
            {
                id: 'CC5.2',
                name: 'Control Activities - Technology Controls',
                description:
                    'The entity selects and develops general control activities over technology.',
                family: ControlFamily.CC5,
                status: ComplianceStatus.IN_PROGRESS,
                riskLevel: RiskLevel.MEDIUM,
                lastAssessed: new Date('2024-01-09'),
                nextAssessment: new Date('2024-02-09'),
                evidence: [
                    'IT General Controls',
                    'System Access Controls',
                    'Change Management',
                ],
                issues: [
                    {
                        id: 'ISS-006',
                        controlId: 'CC5.2',
                        title: 'Automated Control Testing Framework Needed',
                        description:
                            'Implementation of automated testing for technology controls is pending',
                        severity: RiskLevel.MEDIUM,
                        status: 'in_progress',
                        createdAt: new Date('2024-02-01'),
                        assignee: 'it-team',
                    },
                ],
            },
            {
                id: 'CC5.3',
                name: 'Control Activities - Policies and Procedures',
                description:
                    'The entity deploys control activities through policies and procedures.',
                family: ControlFamily.CC5,
                status: ComplianceStatus.COMPLIANT,
                riskLevel: RiskLevel.LOW,
                lastAssessed: new Date('2024-01-26'),
                nextAssessment: new Date('2024-04-26'),
                evidence: [
                    'Policy Documentation',
                    'Procedure Manuals',
                    'Training Materials',
                ],
                issues: [],
            },

            // CC6 - Logical and Physical Access Controls
            {
                id: 'CC6.1',
                name: 'Logical and Physical Access Controls - Logical Access',
                description:
                    'The entity implements logical access security software, infrastructure, and architectures.',
                family: ControlFamily.CC6,
                status: ComplianceStatus.IN_PROGRESS,
                riskLevel: RiskLevel.MEDIUM,
                lastAssessed: new Date('2024-01-10'),
                nextAssessment: new Date('2024-02-10'),
                evidence: [
                    'Access Control Policies',
                    'User Access Reviews',
                    'Authentication Systems',
                ],
                issues: [
                    {
                        id: 'ISS-001',
                        controlId: 'CC6.1',
                        title: 'Privileged Access Review Overdue',
                        description:
                            'Quarterly privileged access review is 5 days overdue',
                        severity: RiskLevel.MEDIUM,
                        status: 'open',
                        createdAt: new Date('2024-01-20'),
                        assignee: 'security-team',
                    },
                ],
            },
            {
                id: 'CC6.2',
                name: 'Logical and Physical Access Controls - Physical Access',
                description:
                    'The entity restricts physical access to facilities and computer hardware.',
                family: ControlFamily.CC6,
                status: ComplianceStatus.COMPLIANT,
                riskLevel: RiskLevel.LOW,
                lastAssessed: new Date('2024-01-27'),
                nextAssessment: new Date('2024-04-27'),
                evidence: [
                    'Physical Security Policies',
                    'Access Card Systems',
                    'Visitor Logs',
                ],
                issues: [],
            },
            {
                id: 'CC6.3',
                name: 'Logical and Physical Access Controls - Network Security',
                description:
                    'The entity authorizes, modifies, or removes access to data, software, and system resources.',
                family: ControlFamily.CC6,
                status: ComplianceStatus.COMPLIANT,
                riskLevel: RiskLevel.MEDIUM,
                lastAssessed: new Date('2024-01-25'),
                nextAssessment: new Date('2024-04-25'),
                evidence: [
                    'Network Security Policies',
                    'Firewall Rules',
                    'Intrusion Detection Systems',
                ],
                issues: [],
            },

            // CC7 - System Operations
            {
                id: 'CC7.1',
                name: 'System Operations - System Development',
                description:
                    'The entity restricts the logical access to system configurations.',
                family: ControlFamily.CC7,
                status: ComplianceStatus.COMPLIANT,
                riskLevel: RiskLevel.LOW,
                lastAssessed: new Date('2024-01-28'),
                nextAssessment: new Date('2024-04-28'),
                evidence: [
                    'Development Standards',
                    'Code Review Processes',
                    'Deployment Procedures',
                ],
                issues: [],
            },
            {
                id: 'CC7.2',
                name: 'System Operations - System Monitoring',
                description:
                    'The entity monitors system components and the operation of controls.',
                family: ControlFamily.CC7,
                status: ComplianceStatus.NON_COMPLIANT,
                riskLevel: RiskLevel.HIGH,
                lastAssessed: new Date('2024-01-05'),
                nextAssessment: new Date('2024-02-05'),
                evidence: [
                    'Monitoring Procedures',
                    'Alert Configurations',
                    'Performance Metrics',
                ],
                issues: [
                    {
                        id: 'ISS-002',
                        controlId: 'CC7.2',
                        title: 'Critical System Alerts Not Configured',
                        description:
                            'Several critical system components lack proper alerting',
                        severity: RiskLevel.HIGH,
                        status: 'in_progress',
                        createdAt: new Date('2024-01-08'),
                        assignee: 'devops-team',
                    },
                ],
            },
            {
                id: 'CC7.3',
                name: 'System Operations - Change Management',
                description:
                    'The entity implements change management processes.',
                family: ControlFamily.CC7,
                status: ComplianceStatus.COMPLIANT,
                riskLevel: RiskLevel.MEDIUM,
                lastAssessed: new Date('2024-01-29'),
                nextAssessment: new Date('2024-04-29'),
                evidence: [
                    'Change Management Policy',
                    'Change Approval Process',
                    'Rollback Procedures',
                ],
                issues: [],
            },
            {
                id: 'CC7.4',
                name: 'System Operations - Data Backup',
                description: 'The entity restricts access to backup data.',
                family: ControlFamily.CC7,
                status: ComplianceStatus.COMPLIANT,
                riskLevel: RiskLevel.LOW,
                lastAssessed: new Date('2024-01-30'),
                nextAssessment: new Date('2024-04-30'),
                evidence: [
                    'Backup Procedures',
                    'Recovery Testing',
                    'Backup Access Controls',
                ],
                issues: [],
            },

            // CC8 - Change Management
            {
                id: 'CC8.1',
                name: 'Change Management - Authorization',
                description:
                    'The entity authorizes, designs, develops or acquires, configures, documents, tests, approves, and implements changes to infrastructure, data, software, and procedures.',
                family: ControlFamily.CC8,
                status: ComplianceStatus.COMPLIANT,
                riskLevel: RiskLevel.MEDIUM,
                lastAssessed: new Date('2024-01-31'),
                nextAssessment: new Date('2024-04-30'),
                evidence: [
                    'Change Authorization Matrix',
                    'Change Request Forms',
                    'Approval Workflows',
                ],
                issues: [],
            },
        ];
    }

    /**
     * Get controls by family
     */
    async getControlsByFamily(family: ControlFamily): Promise<Control[]> {
        const allControls = await this.getAllControls();
        return allControls.filter((control) => control.family === family);
    }

    /**
     * Get recent audit events
     */
    async getRecentAuditEvents(limit: number = 50): Promise<AuditEvent[]> {
        // Comprehensive audit events - in production this would query actual audit logs
        const events: AuditEvent[] = [
            {
                id: 'evt-001',
                timestamp: new Date(),
                eventType: 'user_login',
                userId: 'admin@atoms.tech',
                resource: 'soc2_dashboard',
                action: 'login',
                details: {
                    success: true,
                    mfa_used: true,
                    session_id: 'sess_abc123',
                },
                ipAddress: '192.168.1.100',
                userAgent:
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            {
                id: 'evt-002',
                timestamp: new Date(Date.now() - 300000), // 5 minutes ago
                eventType: 'data_access',
                userId: 'security@atoms.tech',
                resource: 'compliance_controls',
                action: 'view',
                details: { control_id: 'CC6.1', access_level: 'read' },
                ipAddress: '192.168.1.101',
                userAgent:
                    'Mozilla/5.0 (macOS; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            },
            {
                id: 'evt-003',
                timestamp: new Date(Date.now() - 600000), // 10 minutes ago
                eventType: 'configuration_change',
                userId: 'devops@atoms.tech',
                resource: 'firewall_rules',
                action: 'modify',
                details: {
                    rule_id: 'fw_rule_443',
                    change_type: 'port_update',
                    old_value: '80',
                    new_value: '443',
                },
                ipAddress: '10.0.1.50',
                userAgent: 'curl/7.68.0',
            },
            {
                id: 'evt-004',
                timestamp: new Date(Date.now() - 900000), // 15 minutes ago
                eventType: 'privileged_access',
                userId: 'sysadmin@atoms.tech',
                resource: 'production_database',
                action: 'sudo_access',
                details: {
                    command: 'systemctl restart postgresql',
                    duration_seconds: 45,
                },
                ipAddress: '10.0.1.25',
                userAgent: 'SSH-2.0-OpenSSH_8.2',
            },
            {
                id: 'evt-005',
                timestamp: new Date(Date.now() - 1200000), // 20 minutes ago
                eventType: 'data_export',
                userId: 'analyst@atoms.tech',
                resource: 'user_data',
                action: 'export',
                details: {
                    record_count: 1250,
                    export_format: 'csv',
                    purpose: 'compliance_audit',
                },
                ipAddress: '192.168.1.105',
                userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
            },
            {
                id: 'evt-006',
                timestamp: new Date(Date.now() - 1500000), // 25 minutes ago
                eventType: 'access_denied',
                userId: 'contractor@external.com',
                resource: 'sensitive_documents',
                action: 'access_attempt',
                details: {
                    reason: 'insufficient_permissions',
                    requested_resource: '/admin/secrets',
                },
                ipAddress: '203.0.113.45',
                userAgent:
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            {
                id: 'evt-007',
                timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
                eventType: 'system_backup',
                userId: 'system',
                resource: 'database_backup',
                action: 'create',
                details: {
                    backup_size_gb: 15.7,
                    backup_location: 's3://backups/daily/',
                    status: 'completed',
                },
                ipAddress: '10.0.1.10',
                userAgent: 'backup-agent/2.1.0',
            },
            {
                id: 'evt-008',
                timestamp: new Date(Date.now() - 2100000), // 35 minutes ago
                eventType: 'password_change',
                userId: 'user@atoms.tech',
                resource: 'user_account',
                action: 'password_update',
                details: {
                    password_strength: 'strong',
                    previous_change: '2024-01-15T10:30:00Z',
                },
                ipAddress: '192.168.1.120',
                userAgent:
                    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
            },
            {
                id: 'evt-009',
                timestamp: new Date(Date.now() - 2400000), // 40 minutes ago
                eventType: 'api_access',
                userId: 'service_account_monitoring',
                resource: 'metrics_api',
                action: 'query',
                details: {
                    endpoint: '/api/v1/metrics/system',
                    response_code: 200,
                    response_time_ms: 145,
                },
                ipAddress: '10.0.2.15',
                userAgent: 'monitoring-service/1.5.2',
            },
            {
                id: 'evt-010',
                timestamp: new Date(Date.now() - 2700000), // 45 minutes ago
                eventType: 'file_upload',
                userId: 'compliance@atoms.tech',
                resource: 'document_management',
                action: 'upload',
                details: {
                    file_name: 'SOC2_Evidence_Q1_2024.pdf',
                    file_size_mb: 2.3,
                    scan_result: 'clean',
                },
                ipAddress: '192.168.1.115',
                userAgent:
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            {
                id: 'evt-011',
                timestamp: new Date(Date.now() - 3000000), // 50 minutes ago
                eventType: 'network_connection',
                userId: 'external_auditor',
                resource: 'vpn_gateway',
                action: 'connect',
                details: {
                    vpn_protocol: 'OpenVPN',
                    connection_duration_minutes: 120,
                    data_transferred_mb: 45.2,
                },
                ipAddress: '198.51.100.25',
                userAgent: 'OpenVPN/2.5.7',
            },
            {
                id: 'evt-012',
                timestamp: new Date(Date.now() - 3300000), // 55 minutes ago
                eventType: 'control_test',
                userId: 'auditor@atoms.tech',
                resource: 'cc6_1_control',
                action: 'test_execution',
                details: {
                    test_type: 'automated',
                    result: 'passed',
                    evidence_collected: true,
                },
                ipAddress: '192.168.1.130',
                userAgent: 'compliance-testing-tool/3.2.1',
            },
            {
                id: 'evt-013',
                timestamp: new Date(Date.now() - 3600000), // 1 hour ago
                eventType: 'incident_response',
                userId: 'security_team',
                resource: 'security_incident',
                action: 'escalate',
                details: {
                    incident_id: 'INC-2024-001',
                    severity: 'medium',
                    escalation_level: 'tier_2',
                },
                ipAddress: '10.0.1.75',
                userAgent: 'incident-management/4.1.0',
            },
            {
                id: 'evt-014',
                timestamp: new Date(Date.now() - 3900000), // 65 minutes ago
                eventType: 'certificate_renewal',
                userId: 'system',
                resource: 'ssl_certificate',
                action: 'renew',
                details: {
                    certificate_cn: '*.atoms.tech',
                    expiry_date: '2024-12-31T23:59:59Z',
                    auto_renewal: true,
                },
                ipAddress: '10.0.1.10',
                userAgent: 'cert-manager/1.8.0',
            },
            {
                id: 'evt-015',
                timestamp: new Date(Date.now() - 4200000), // 70 minutes ago
                eventType: 'vulnerability_scan',
                userId: 'security_scanner',
                resource: 'web_application',
                action: 'scan_complete',
                details: {
                    vulnerabilities_found: 2,
                    severity_breakdown: {
                        low: 1,
                        medium: 1,
                        high: 0,
                        critical: 0,
                    },
                },
                ipAddress: '10.0.3.20',
                userAgent: 'security-scanner/2.7.3',
            },
        ];

        return events.slice(0, limit);
    }

    /**
     * Calculate risk score based on controls
     */
    private calculateRiskScore(controls: Control[]): number {
        if (controls.length === 0) return 0;

        const riskWeights = {
            [RiskLevel.LOW]: 1,
            [RiskLevel.MEDIUM]: 3,
            [RiskLevel.HIGH]: 7,
            [RiskLevel.CRITICAL]: 10,
        };

        const statusWeights = {
            [ComplianceStatus.COMPLIANT]: 0,
            [ComplianceStatus.IN_PROGRESS]: 0.5,
            [ComplianceStatus.NON_COMPLIANT]: 1,
            [ComplianceStatus.NOT_ASSESSED]: 0.8,
        };

        let totalRisk = 0;
        let maxPossibleRisk = 0;

        controls.forEach((control) => {
            const riskWeight = riskWeights[control.riskLevel];
            const statusWeight = statusWeights[control.status];

            totalRisk += riskWeight * statusWeight;
            maxPossibleRisk += riskWeight;
        });

        return maxPossibleRisk > 0
            ? Math.round((totalRisk / maxPossibleRisk) * 100)
            : 0;
    }

    /**
     * Run comply todo command to get compliance status
     */
    async runComplyTodo(): Promise<string> {
        try {
            const { stdout } = await execAsync(
                `cd compliance && ../${path.basename(this.complyPath)} todo`,
            );
            return stdout;
        } catch (error) {
            console.error('Error running comply todo:', error);
            return 'Error running compliance check';
        }
    }

    /**
     * Generate compliance report
     */
    async generateComplianceReport(): Promise<{
        summary: ComplianceSummary;
        controlsByFamily: Record<ControlFamily, Control[]>;
        recentIssues: Issue[];
        auditEvents: AuditEvent[];
    }> {
        const summary = await this.getComplianceSummary();
        const allControls = await this.getAllControls();
        const auditEvents = await this.getRecentAuditEvents();

        const controlsByFamily = {} as Record<ControlFamily, Control[]>;
        Object.values(ControlFamily).forEach((family) => {
            controlsByFamily[family] = allControls.filter(
                (c) => c.family === family,
            );
        });

        const recentIssues = allControls
            .flatMap((control) => control.issues)
            .filter((issue) => issue.status !== 'resolved')
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, 10);

        return {
            summary,
            controlsByFamily,
            recentIssues,
            auditEvents,
        };
    }
}

// Export singleton instance
export const soc2ComplianceService = SOC2ComplianceService.getInstance();
