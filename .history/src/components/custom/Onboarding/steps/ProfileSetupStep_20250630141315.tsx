'use client';

import { User } from 'lucide-react';

import { useOnboarding } from '@/components/custom/Onboarding/OnboardingContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const roles = [
    'Product Manager',
    'Business Analyst',
    'Systems Engineer',
    'Software Developer',
    'Project Manager',
    'Quality Assurance',
    'Technical Writer',
    'Consultant',
    'Student',
    'Other',
];

const departments = [
    'Engineering',
    'Product',
    'Quality Assurance',
    'Operations',
    'Marketing',
    'Sales',
    'Consulting',
    'Research & Development',
    'Other',
];

const goals = [
    'Improve requirements quality',
    'Enhance team collaboration',
    'Streamline documentation',
    'Ensure compliance',
    'Reduce project risks',
    'Accelerate delivery',
    'Better traceability',
    'Learn best practices',
];

export function ProfileSetupStep() {
    const { data, updateData } = useOnboarding();

    const handleInputChange = (field: string, value: string) => {
        updateData('profileData', { [field]: value });
    };

    const handleGoalsChange = (goal: string, checked: boolean) => {
        const currentGoals = data.profileData.goals || [];
        const updatedGoals = checked
            ? [...currentGoals, goal]
            : currentGoals.filter((g) => g !== goal);

        updateData('profileData', { goals: updatedGoals });
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="text-center mb-6">
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                    <User className="h-6 w-6 text-primary-foreground" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                    Set up your profile
                </h2>
                <p className="text-sm text-muted-foreground">
                    Tell us a bit about yourself to personalize your experience
                </p>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
                {/* Display Name */}
                <div className="space-y-2">
                    <Label
                        htmlFor="displayName"
                        className="text-sm font-medium"
                    >
                        Display Name *
                    </Label>
                    <Input
                        id="displayName"
                        value={data.profileData.displayName || ''}
                        onChange={(e) =>
                            handleInputChange('displayName', e.target.value)
                        }
                        placeholder="How should we address you?"
                    />
                </div>

                {/* Role */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium">Your Role *</Label>
                    <Select
                        value={data.profileData.role || ''}
                        onValueChange={(value) =>
                            handleInputChange('role', value)
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent>
                            {roles.map((role) => (
                                <SelectItem key={role} value={role}>
                                    {role}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Department */}
                <div className="space-y-2">
                    <Label className="text-sm font-medium">
                        Department (Optional)
                    </Label>
                    <Select
                        value={data.profileData.department || ''}
                        onValueChange={(value) =>
                            handleInputChange('department', value)
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select your department" />
                        </SelectTrigger>
                        <SelectContent>
                            {departments.map((dept) => (
                                <SelectItem key={dept} value={dept}>
                                    {dept}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}
