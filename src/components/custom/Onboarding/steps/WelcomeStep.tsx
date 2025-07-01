'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Rocket, 
  Shield, 
  Users, 
  Zap, 
  CheckCircle,
  ArrowRight
} from 'lucide-react';

const features = [
  {
    icon: Rocket,
    title: 'Requirements Management',
    description: 'Streamline your requirements with intelligent organization and tracking.',
    color: 'text-blue-500',
  },
  {
    icon: Shield,
    title: 'SOC2 Compliance',
    description: 'Enterprise-grade security and compliance monitoring built-in.',
    color: 'text-green-500',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Work together seamlessly with real-time collaboration tools.',
    color: 'text-purple-500',
  },
  {
    icon: Zap,
    title: 'Automated Workflows',
    description: 'Boost productivity with intelligent automation and AI assistance.',
    color: 'text-yellow-500',
  },
];

const benefits = [
  'Reduce requirements management time by 60%',
  'Ensure 100% compliance with industry standards',
  'Improve team collaboration and communication',
  'Automate repetitive tasks and workflows',
  'Get real-time insights and analytics',
];

export function WelcomeStep() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center mb-4">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <Rocket className="h-10 w-10 text-white" />
            </div>
            <div className="absolute -top-2 -right-2">
              <Badge className="bg-green-500 hover:bg-green-600 text-white">
                New
              </Badge>
            </div>
          </div>
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Welcome to ATOMS.tech
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          The most advanced requirements management platform designed for modern teams. 
          Let's get you set up in just a few minutes.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature, index) => (
          <Card key={index} className="border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg bg-gray-100 dark:bg-gray-800 ${feature.color}`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {feature.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Benefits Section */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
            What you'll achieve with ATOMS.tech
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center space-x-3">
                <ArrowRight className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300 text-sm">
                  {benefit}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Getting Started */}
      <div className="text-center space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Ready to get started?
        </h3>
        <p className="text-gray-600 dark:text-gray-300">
          This setup will take about 3-5 minutes and will help us personalize your experience.
        </p>
        <div className="flex items-center justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Free 30-day trial</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Cancel anytime</span>
          </div>
        </div>
      </div>
    </div>
  );
}
