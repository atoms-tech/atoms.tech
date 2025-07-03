'use client';

import { motion } from 'framer-motion';
import { 
    Rocket, 
    FileText, 
    Users, 
    Brain, 
    BarChart3, 
    Shield,
    Zap,
    CheckCircle
} from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOnboarding } from '../OnboardingContext';

const features = [
    {
        icon: <FileText className="h-6 w-6" />,
        title: 'Smart Requirements',
        description: 'Create, organize, and manage requirements with AI assistance',
        color: 'bg-blue-500'
    },
    {
        icon: <Users className="h-6 w-6" />,
        title: 'Team Collaboration',
        description: 'Work together in real-time with your team members',
        color: 'bg-green-500'
    },
    {
        icon: <Brain className="h-6 w-6" />,
        title: 'AI Analysis',
        description: 'Get intelligent insights and suggestions for your requirements',
        color: 'bg-purple-500'
    },
    {
        icon: <BarChart3 className="h-6 w-6" />,
        title: 'Traceability',
        description: 'Track relationships and dependencies between requirements',
        color: 'bg-orange-500'
    },
    {
        icon: <Shield className="h-6 w-6" />,
        title: 'SOC2 Compliant',
        description: 'Enterprise-grade security and compliance features',
        color: 'bg-red-500'
    },
    {
        icon: <Zap className="h-6 w-6" />,
        title: 'Fast & Reliable',
        description: 'Built for performance with modern web technologies',
        color: 'bg-yellow-500'
    }
];

export function WelcomeStep() {
    const { user } = useOnboarding();

    return (
        <div className="p-6">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Rocket className="h-6 w-6 text-primary-foreground" />
                </div>

                <h1 className="text-2xl font-bold text-foreground mb-2">
                    Welcome to ATOMS.TECH{user.user_metadata?.full_name?.split(' ')[0] ? `, ${user.user_metadata.full_name.split(' ')[0]}` : ''}!
                </h1>

                <p className="text-muted-foreground">
                    Let's get you set up to create and manage requirements efficiently.
                </p>
            </div>

            {/* Key Features */}
            <div className="space-y-4 mb-8">
                {features.slice(0, 3).map((feature, index) => (
                    <div key={feature.title} className="flex items-start space-x-3">
                        <div className={`w-8 h-8 ${feature.color} rounded-lg flex items-center justify-center text-white flex-shrink-0`}>
                            {feature.icon}
                        </div>
                        <div>
                            <h3 className="font-medium text-foreground mb-1">
                                {feature.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {feature.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* What's Next */}
            <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div>
                        <h3 className="font-medium text-foreground mb-2">
                            What's next?
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                            We'll help you set up your profile and create your first project.
                            This should take about 2-3 minutes.
                        </p>
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="text-xs">
                                2-3 minutes
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                                Skip anytime
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
