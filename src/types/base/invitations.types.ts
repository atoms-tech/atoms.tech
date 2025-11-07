export interface Invitation {
    id: string;
    organization_id: string;
    email: string;
    role: string;
    status: string;
    organizations?: {
        id: string;
        name: string;
        slug: string;
    };
}
