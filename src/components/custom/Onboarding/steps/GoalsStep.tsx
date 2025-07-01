'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOnboarding } from '../OnboardingContext';
import { 
  Target, 
  Zap, 
  Users, 
  Shield, 
  BarChart3, 
  Clock,
  CheckCircle,
  Plus
} from 'lucide-react';

const goals = [
  {
    id: 'streamline-requirements',
    title: 'Streamline Requirements Management',
    description: 'Organize and track requirements more efficiently',
    icon: Target,
    color: 'bg-blue-500',
    category: 'Productivity',
  },
  {
    id: 'improve-collaboration',
    title: 'Improve Team Collaboration',
    description: 'Enhance communication and coordination across teams',
    icon: Users,
    color: 'bg-green-500',
    category: 'Teamwork',
  },
  {
    id: 'ensure-compliance',
    title: 'Ensure Compliance',
    description: 'Meet industry standards and regulatory requirements',
    icon: Shield,
    color: 'bg-purple-500',
    category: 'Compliance',
  },
  {
    id: 'automate-workflows',
    title: 'Automate Workflows',
    description: 'Reduce manual work with intelligent automation',
    icon: Zap,
    color: 'bg-yellow-500',
    category: 'Automation',
  },
  {
    id: 'gain-insights',
    title: 'Gain Better Insights',
    description: 'Make data-driven decisions with analytics',
    icon: BarChart3,
    color: 'bg-red-500',
    category: 'Analytics',
  },
  {
    id: 'save-time',
    title: 'Save Time',
    description: 'Reduce time spent on administrative tasks',
    icon: Clock,
    color: 'bg-orange-500',
    category: 'Efficiency',
  },
];

export function GoalsStep() {
  const { state, updateUserData } = useOnboarding();

  const selectedGoals = state.userData.goals || [];

  const handleGoalToggle = (goalId: string) => {
    const currentGoals = selectedGoals;
    const isSelected = currentGoals.includes(goalId);
    
    let newGoals;
    if (isSelected) {
      newGoals = currentGoals.filter(id => id !== goalId);
    } else {
      newGoals = [...currentGoals, goalId];
    }
    
    updateUserData({ goals: newGoals });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Target className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          What are your goals?
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Select the goals that matter most to you. We'll help you achieve them.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((goal) => {
          const isSelected = selectedGoals.includes(goal.id);
          
          return (
            <Card
              key={goal.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => handleGoalToggle(goal.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${goal.color} text-white flex-shrink-0`}>
                    <goal.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {goal.title}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {goal.category}
                        </Badge>
                      </div>
                      {isSelected ? (
                        <CheckCircle className="h-5 w-5 text-blue-500 flex-shrink-0" />
                      ) : (
                        <Plus className="h-5 w-5 text-gray-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                      {goal.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedGoals.length > 0 && (
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                  Excellent! You've selected {selectedGoals.length} goal{selectedGoals.length !== 1 ? 's' : ''}.
                </p>
                <p className="text-xs text-green-700 dark:text-green-200">
                  We'll customize your dashboard and recommend features to help you achieve these goals.
                  You can always update your goals later in your profile settings.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Select as many goals as you'd like. You can always change these later.
        </p>
      </div>
    </div>
  );
}
