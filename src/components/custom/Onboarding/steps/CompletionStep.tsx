'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOnboarding } from '../OnboardingContext';
import { 
  CheckCircle, 
  Rocket, 
  ArrowRight, 
  Star,
  Gift,
  BookOpen,
  Users,
  Zap
} from 'lucide-react';

const nextSteps = [
  {
    icon: BookOpen,
    title: 'Explore the Dashboard',
    description: 'Get familiar with your personalized workspace',
    action: 'View Dashboard',
    color: 'text-blue-500',
  },
  {
    icon: Users,
    title: 'Invite Your Team',
    description: 'Collaborate with colleagues on requirements',
    action: 'Invite Team',
    color: 'text-green-500',
  },
  {
    icon: Zap,
    title: 'Create Requirements',
    description: 'Start adding your first requirements',
    action: 'Add Requirements',
    color: 'text-purple-500',
  },
];

const achievements = [
  'Profile completed',
  'Role configured',
  'Goals selected',
  'First project created',
];

export function CompletionStep() {
  const { state } = useOnboarding();

  return (
    <div className="space-y-8">
      {/* Success Header */}
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <div className="absolute -top-2 -right-2">
            <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
              <Star className="h-4 w-4 text-yellow-800" />
            </div>
          </div>
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Welcome to ATOMS.tech!
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Congratulations! Your account is set up and ready to go. 
          Let's start building amazing requirements together.
        </p>
      </div>

      {/* User Summary */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Your Setup Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium">Name:</span> {state.userData.name || 'Not provided'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium">Email:</span> {state.userData.email || 'Not provided'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium">Organization:</span> {state.userData.organizationName || 'Not provided'}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium">Role:</span> {state.userData.role || 'Not selected'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium">Goals:</span> {state.userData.goals?.length || 0} selected
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium">Project:</span> {state.userData.projectName || 'Not created'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card className="border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Gift className="h-5 w-5 mr-2 text-yellow-500" />
            Setup Achievements
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {achievements.map((achievement, index) => (
              <div key={index} className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {achievement}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center">
          What's next?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {nextSteps.map((step, index) => (
            <Card key={index} className="border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <div className={`w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4 ${step.color}`}>
                  <step.icon className="h-6 w-6" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {step.title}
                </h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                  {step.description}
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  {step.action}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Special Offer */}
      <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center mb-4">
            <Gift className="h-8 w-8 mr-2" />
            <h3 className="text-xl font-bold">
              Special Welcome Offer
            </h3>
          </div>
          <p className="mb-4">
            As a new user, you get 30 days of our Pro features absolutely free!
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Badge className="bg-white/20 text-white">
              ✨ Advanced Analytics
            </Badge>
            <Badge className="bg-white/20 text-white">
              🚀 Priority Support
            </Badge>
            <Badge className="bg-white/20 text-white">
              🔒 Enhanced Security
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Final CTA */}
      <div className="text-center space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          Ready to transform your requirements management?
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          Click "Complete Setup" to access your personalized dashboard and start your journey with ATOMS.tech.
        </p>
      </div>
    </div>
  );
}
