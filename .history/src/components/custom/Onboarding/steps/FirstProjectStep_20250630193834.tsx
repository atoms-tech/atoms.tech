'use client';

import { motion } from 'framer-motion';
import { FileText, FolderPlus, Globe, Lock, Users } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// import {
//     Select,
//     SelectContent,
//     SelectItem,
//     SelectTrigger,
//     SelectValue,
// } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

// Note: Using custom radio group implementation
import { useOnboarding } from '../OnboardingContext';

const projectTemplates = [
    {
        id: 'blank',
        title: 'Blank Project',
        description: 'Start from scratch with a clean slate',
        icon: <FileText className="h-5 w-5" />,
    },
    {
        id: 'software',
        title: 'Software Requirements',
        description: 'Template for software development projects',
        icon: <FileText className="h-5 w-5" />,
    },
    {
        id: 'system',
        title: 'System Requirements',
        description: 'Template for system engineering projects',
        icon: <FileText className="h-5 w-5" />,
    },
    {
        id: 'business',
        title: 'Business Requirements',
        description: 'Template for business analysis projects',
        icon: <FileText className="h-5 w-5" />,
    },
];

const visibilityOptions = [
    {
        id: 'private',
        title: 'Private',
        description: 'Only you can see this project',
        icon: <Lock className="h-4 w-4" />,
    },
    {
        id: 'team',
        title: 'Team',
        description: 'Your team members can access this project',
        icon: <Users className="h-4 w-4" />,
    },
    {
        id: 'organization',
        title: 'Organization',
        description: 'Everyone in your organization can see this project',
        icon: <Globe className="h-4 w-4" />,
    },
];

export function FirstProjectStep() {
    const { data, updateData } = useOnboarding();

    const handleInputChange = (field: string, value: string) => {
        updateData('projectData', { [field]: value });
    };

    return (
        <div className="max-w-2xl mx-auto">
            <Card className="bg-white dark:bg-gray-800 shadow-xl border-0">
                <CardHeader className="text-center pb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <FolderPlus className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                        Create your first project
                    </CardTitle>
                    <p className="text-gray-600 dark:text-gray-300">
                        Projects help you organize and manage your requirements
                    </p>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Project Name */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-2"
                    >
                        <Label
                            htmlFor="projectName"
                            className="text-sm font-medium"
                        >
                            Project Name *
                        </Label>
                        <Input
                            id="projectName"
                            value={data.projectData.name || ''}
                            onChange={(e) =>
                                handleInputChange('name', e.target.value)
                            }
                            placeholder="e.g., Mobile App Requirements, System Architecture..."
                            className="w-full"
                        />
                    </motion.div>

                    {/* Project Description */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-2"
                    >
                        <Label
                            htmlFor="projectDescription"
                            className="text-sm font-medium"
                        >
                            Description
                        </Label>
                        <Textarea
                            id="projectDescription"
                            value={data.projectData.description || ''}
                            onChange={(e) =>
                                handleInputChange('description', e.target.value)
                            }
                            placeholder="Brief description of what this project is about..."
                            rows={3}
                            className="w-full"
                        />
                    </motion.div>

                    {/* Template Selection */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-3"
                    >
                        <Label className="text-sm font-medium">
                            Choose a template
                        </Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {projectTemplates.map((template) => (
                                <div
                                    key={template.id}
                                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                        data.projectData.template ===
                                        template.id
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                    }`}
                                    onClick={() =>
                                        handleInputChange(
                                            'template',
                                            template.id,
                                        )
                                    }
                                >
                                    <div className="flex items-start space-x-3">
                                        <div
                                            className={`p-1 rounded ${
                                                data.projectData.template ===
                                                template.id
                                                    ? 'text-blue-600'
                                                    : 'text-gray-400'
                                            }`}
                                        >
                                            {template.icon}
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-sm text-gray-900 dark:text-white">
                                                {template.title}
                                            </h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {template.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Visibility */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="space-y-3"
                    >
                        <Label className="text-sm font-medium">
                            Project Visibility
                        </Label>
                        <div className="space-y-2">
                            {visibilityOptions.map((option) => (
                                <div
                                    key={option.id}
                                    className="flex items-center space-x-2"
                                >
                                    <input
                                        type="radio"
                                        value={option.id}
                                        id={option.id}
                                        name="visibility"
                                        checked={
                                            (data.projectData.visibility ||
                                                'private') === option.id
                                        }
                                        onChange={(e) =>
                                            handleInputChange(
                                                'visibility',
                                                e.target.value,
                                            )
                                        }
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                    />
                                    <Label
                                        htmlFor={option.id}
                                        className="flex items-center space-x-2 cursor-pointer"
                                    >
                                        {option.icon}
                                        <div>
                                            <span className="font-medium">
                                                {option.title}
                                            </span>
                                            <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                                                - {option.description}
                                            </span>
                                        </div>
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Help Text */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4"
                    >
                        <p className="text-sm text-purple-800 dark:text-purple-200">
                            💡 Don`'`t worry about getting everything perfect -
                            you can always modify these settings later from your
                            project dashboard.
                        </p>
                    </motion.div>
                </CardContent>
            </Card>
        </div>
    );
}
