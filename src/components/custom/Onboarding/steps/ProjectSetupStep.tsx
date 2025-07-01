'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOnboarding } from '../OnboardingContext';
import { 
  FolderPlus, 
  Lightbulb, 
  Rocket, 
  FileText,
  Plus
} from 'lucide-react';

const projectTemplates = [
  {
    id: 'web-application',
    title: 'Web Application',
    description: 'Requirements for web-based software projects',
    icon: '🌐',
    features: ['User stories', 'API requirements', 'UI/UX specifications'],
  },
  {
    id: 'mobile-app',
    title: 'Mobile Application',
    description: 'Requirements for iOS and Android applications',
    icon: '📱',
    features: ['Platform requirements', 'Performance specs', 'User interface'],
  },
  {
    id: 'enterprise-software',
    title: 'Enterprise Software',
    description: 'Large-scale business software requirements',
    icon: '🏢',
    features: ['Business rules', 'Integration requirements', 'Security specs'],
  },
  {
    id: 'api-service',
    title: 'API/Service',
    description: 'Backend services and API requirements',
    icon: '⚡',
    features: ['Endpoint specifications', 'Data models', 'Performance requirements'],
  },
];

export function ProjectSetupStep() {
  const { state, updateUserData } = useOnboarding();

  const handleInputChange = (field: string, value: string) => {
    updateUserData({ [field]: value });
  };

  const handleTemplateSelect = (templateId: string) => {
    // In a real implementation, this would set up the project with template-specific requirements
    console.log('Selected template:', templateId);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <FolderPlus className="h-8 w-8 text-orange-600 dark:text-orange-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Set up your first project
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Create your first project to start managing requirements
        </p>
      </div>

      <Card className="border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Project Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="projectName" className="text-gray-700 dark:text-gray-300">
              Project Name *
            </Label>
            <Input
              id="projectName"
              type="text"
              placeholder="Enter your project name"
              value={state.userData.projectName || ''}
              onChange={(e) => handleInputChange('projectName', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectDescription" className="text-gray-700 dark:text-gray-300">
              Project Description
            </Label>
            <Textarea
              id="projectDescription"
              placeholder="Describe what your project is about..."
              value={state.userData.projectDescription || ''}
              onChange={(e) => handleInputChange('projectDescription', e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center">
            <Lightbulb className="h-5 w-5 mr-2" />
            Choose a Template (Optional)
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Start with a pre-built template to speed up your setup
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projectTemplates.map((template) => (
              <Card
                key={template.id}
                className="cursor-pointer transition-all duration-200 hover:shadow-md border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600"
                onClick={() => handleTemplateSelect(template.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">{template.icon}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                        {template.title}
                      </h4>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                        {template.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {template.features.map((feature, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs bg-gray-100 dark:bg-gray-800"
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

          <div className="mt-4 text-center">
            <Button variant="outline" className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Start with blank project</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Rocket className="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Quick Start Tip
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-200">
                Don't worry about getting everything perfect right now. You can always 
                add more details, create additional projects, and modify settings after 
                completing the setup.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          * Required fields
        </p>
      </div>
    </div>
  );
}
