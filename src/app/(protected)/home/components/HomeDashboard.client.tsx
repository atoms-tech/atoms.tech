'use client';

import { Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useOrgsByUser } from '@/hooks/queries/useOrganization';
import { useOrganization } from '@/lib/providers/organization.provider';
import { useUser } from '@/lib/providers/user.provider';
import { useContextStore } from '@/lib/store/context.store';
import { Organization } from '@/types';

export default function HomeDashboard() {
    const { user, profile } = useUser();
    const router = useRouter();
    const { setCurrentUserId } = useContextStore();
    const { setOrganization } = useOrganization();
    const { data: organizations } = useOrgsByUser(user?.id || '');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (organizations) {
            console.log('Organizations:', organizations);
        }
    }, [organizations]);

    const handleRowClick = (item: Organization) => {
        setCurrentUserId(user?.id || '');
        setOrganization(item);
        router.push(`/org/${item.id}`);
    };

    const filteredOrganizations = organizations?.filter((org) =>
        org.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    return (
        <div className="container mx-auto p-6">
            <div className="mb-4">
                <h2 className="text-xl font-medium">
                    Welcome back, {profile?.full_name}
                </h2>
            </div>
            <div className="mb-4 flex w-full sm:w-1/5 space-x-2">
                <Input
                    type="text"
                    placeholder="Search organizations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                />
                <Button variant="default" className="w-9 h-9">
                    <Filter className="w-4 h-4" />
                </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 justify-start">
                {filteredOrganizations?.map((org) => (
                    <Card
                        key={org.id}
                        className="p-5 hover:bg-gray-200 border border-gray-300"
                        onClick={() => handleRowClick(org)}
                    >
                        <h3 className="text-sm font-semibold">{org.name}</h3>
                        <p className="pb-3 text-xs text-gray-400">{org.slug}</p>
                        <Badge
                            variant="outline"
                            className={
                                org.status === 'active'
                                    ? 'border-green-500 text-green-500'
                                    : org.status === 'inactive'
                                      ? 'border-gray-500 text-gray-500'
                                      : 'border-yellow-500 text-yellow-500'
                            }
                        >
                            {org.status}
                        </Badge>
                    </Card>
                ))}
            </div>
        </div>
    );
}
