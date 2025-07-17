'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/lib/supabase/supabaseBrowser';
import { cn } from '@/lib/utils';
import { Profile } from '@/types/base/profiles.types';

interface AutocompleteInputProps {
    orgId: string;
    value: string;
    onChange: (value: string) => void;
}

export function OrgMemberAutocomplete({
    orgId,
    value,
    onChange,
}: AutocompleteInputProps) {
    const [open, setOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [orgMembers, setOrgMembers] = useState<Profile[]>([]);

    useEffect(() => {
        const fetchMembers = async () => {
            const { data, error } = await supabase
                .from('organization_members')
                .select('user_id')
                .eq('organization_id', orgId || '');

            if (!data || error) {
                console.error(error);
                return;
            }
            const orgMembersIds = data.map((member) => member.user_id);
            console.log('orgMembersIds', orgMembersIds);

            const { data: orgMembers, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .in('id', orgMembersIds);

            if (!orgMembers || profileError) {
                console.error(error);
                return;
            }

            setOrgMembers(orgMembers);
            console.log('orgMembers', orgMembers);
        };

        fetchMembers();
    }, [orgId]);

    const filteredMembers = useMemo(() => {
        if (!orgMembers) {
            return;
        }
        const searchValue = value.toLowerCase().trim();
        if (!searchValue) {
            return orgMembers;
        }

        const filteredMembers = orgMembers.filter(
            (profile) =>
                profile.full_name?.toLowerCase().startsWith(searchValue) ||
                profile.email?.toLowerCase().startsWith(searchValue),
        );

        return filteredMembers;
    }, [orgMembers, value]);

    const handleSelect = (value: string) => {
        onChange(value);
        setOpen(false);
        requestAnimationFrame(() => {
            inputRef.current?.setSelectionRange(value.length, value.length);
        });
    };

    return (
        <Popover
            open={open && filteredMembers && filteredMembers.length > 0}
            onOpenChange={setOpen}
        >
            <PopoverTrigger asChild>
                <Input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onClick={() => setOpen(true)}
                    onChange={(e) => {
                        onChange(e.target.value);
                        setOpen(true);
                    }}
                    placeholder="Add Org Member"
                />
            </PopoverTrigger>
            {filteredMembers && filteredMembers.length > 0 && (
                <PopoverContent
                    className={cn(
                        'z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
                        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
                    )}
                    align="end"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    {filteredMembers.map((member, index) => (
                        <li
                            key={index}
                            className={cn(
                                'hover:bg-muted relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-secondary focus:text-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0',
                            )}
                            onClick={() => handleSelect(member?.email || '')}
                        >
                            <div>
                                <div className="font-medium">
                                    {member.full_name || 'User'}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {member.email}
                                </div>
                            </div>
                        </li>
                    ))}
                </PopoverContent>
            )}
        </Popover>
    );
}
// The classname of PopoverContent comes from DropdownMenuContent
// The classname of li comes from DropdownMenuItem
