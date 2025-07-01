'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOnboarding } from '../OnboardingContext';
import { 
  Code, 
  Users, 
  Shield, 
  BarChart3, 
  Settings, 
  UserCheck,
  CheckCircle
} from 'lucide-react';

const roles = [
  {
    id: 'developer',
    title: 'Software Developer',
    description: 'Build and implement software solutions based on requirements',
    icon: Code,
    color: 'bg-blue-500',
    features: ['Code implementation', 'Technical requirements', 'API documentation'],
  },
  {
    id: 'product-manager',
    title: 'Product Manager',
    description: 'Define product strategy and manage requirements lifecycle',
    icon: BarChart3,
    color: 'bg-green-500',
    features: ['Product roadmap', 'Stakeholder management', 'Requirements prioritization'],
  },
  {
    id: 'business-analyst',
    title: 'Business Analyst',
    description: 'Analyze business needs and translate them into requirements',
    icon: UserCheck,
    color: 'bg-purple-500',
    features: ['Requirements analysis', 'Process mapping', 'Stakeholder interviews'],
  },
  {
    id: 'qa-engineer',
    title: 'QA Engineer',
    description: 'Ensure quality through testing and validation of requirements',
    icon: Shield,
    color: 'bg-orange-500',
    features: ['Test planning', 'Requirements validation', 'Quality assurance'],
  },
  {
    id: 'project-manager',
    title: 'Project Manager',
    description: 'Coordinate projects and manage requirements delivery',
    icon: Users,
    color: 'bg-red-500',
    features: ['Project coordination', 'Timeline management', 'Team collaboration'],
  },
  {
    id: 'admin',
    title: 'System Administrator',
    description: 'Manage system configuration and user access',
    icon: Settings,
    color: 'bg-gray-500',
    features: ['User management', 'System configuration', 'Security settings'],
  },
];

export function RoleSelectionStep() {
  const { state, updateUserData } = useOnboarding();

  const handleRoleSelect = (roleId: string) => {
    updateUserData({ role: roleId });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <UserCheck className="h-8 w-8 text-purple-600 dark:text-purple-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          What's your role?
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Help us customize your experience based on your responsibilities
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((role) => (
          <Card
            key={role.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
              state.userData.role === role.id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            onClick={() => handleRoleSelect(role.id)}
          >
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${role.color} text-white flex-shrink-0`}>
                  <role.icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {role.title}
                    </h3>
                    {state.userData.role === role.id && (
                      <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                    {role.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {role.features.map((feature, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                      >
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {state.userData.role && (
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  Great choice! We'll customize your dashboard and features for{' '}
                  {roles.find(r => r.id === state.userData.role)?.title}.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Don't worry, you can change this later in your profile settings.
        </p>
      </div>
    </div>
  );
}
