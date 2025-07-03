'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle,
    Lightbulb,
    Play,
    Target,
    X,
    Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TutorialStep {
    id: string;
    title: string;
    description: string;
    content: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    tip?: string;
}

interface Tutorial {
    id: string;
    title: string;
    description: string;
    duration: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    steps: TutorialStep[];
    icon: React.ReactNode;
}

const tutorials: Tutorial[] = [
    {
        id: 'getting-started',
        title: 'Getting Started with ATOMS.TECH',
        description: 'Learn the basics of creating and managing requirements',
        duration: '5 min',
        difficulty: 'Beginner',
        icon: <Play className="h-5 w-5" />,
        steps: [
            {
                id: 'welcome',
                title: 'Welcome to ATOMS.TECH',
                description: 'Your modern requirements management platform',
                content:
                    "ATOMS.TECH helps you write, organize, and manage requirements with AI assistance. Let's get you started with the basics.",
                tip: 'Take your time to explore each feature as we go through them.',
            },
            {
                id: 'create-project',
                title: 'Create Your First Project',
                description: 'Projects help organize your requirements',
                content:
                    'Click the "Create New Project" button to start. Projects are containers for all your requirements, documents, and team collaboration.',
                action: {
                    label: 'Create Project',
                    onClick: () => console.log('Navigate to project creation'),
                },
            },
            {
                id: 'add-requirements',
                title: 'Add Requirements',
                description: 'Document what your system needs to do',
                content:
                    'Requirements are the building blocks of your project. Write them in natural language - our AI will help you improve them.',
                tip: 'Start with simple, clear statements about what your system should do.',
            },
            {
                id: 'ai-analysis',
                title: 'Use AI Analysis',
                description: 'Let AI improve your requirements',
                content:
                    'Our AI can rewrite requirements for clarity, check compliance, and suggest improvements. Try it on any requirement.',
                action: {
                    label: 'Try AI Demo',
                    onClick: () => console.log('Navigate to AI demo'),
                },
            },
        ],
    },
    {
        id: 'ai-features',
        title: 'AI-Powered Features',
        description: 'Discover how AI can accelerate your workflow',
        duration: '8 min',
        difficulty: 'Intermediate',
        icon: <Zap className="h-5 w-5" />,
        steps: [
            {
                id: 'ai-rewriting',
                title: 'AI Rewriting',
                description: 'Transform requirements into industry standards',
                content:
                    'Our AI can rewrite requirements in EARS, INCOSE, or other formats. It also improves clarity and removes ambiguity.',
                tip: 'Try different formats to see which works best for your project.',
            },
            {
                id: 'compliance-checking',
                title: 'Compliance Checking',
                description: 'Ensure requirements meet regulations',
                content:
                    'AI automatically checks requirements against industry regulations and standards, flagging potential issues before they become problems.',
            },
            {
                id: 'test-generation',
                title: 'Test Case Generation',
                description: 'Generate test cases from requirements',
                content:
                    'Automatically create structured test cases from your requirements, saving hours of manual work.',
            },
        ],
    },
];

export function InteractiveTutorial() {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(
        null,
    );
    const [currentStep, setCurrentStep] = useState(0);
    const [completedTutorials, setCompletedTutorials] = useState<string[]>([]);

    const startTutorial = (tutorial: Tutorial) => {
        setSelectedTutorial(tutorial);
        setCurrentStep(0);
        setIsOpen(true);
    };

    const nextStep = () => {
        if (
            selectedTutorial &&
            currentStep < selectedTutorial.steps.length - 1
        ) {
            setCurrentStep(currentStep + 1);
        } else {
            completeTutorial();
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const completeTutorial = () => {
        if (
            selectedTutorial &&
            !completedTutorials.includes(selectedTutorial.id)
        ) {
            setCompletedTutorials([...completedTutorials, selectedTutorial.id]);
        }
        setIsOpen(false);
        setSelectedTutorial(null);
        setCurrentStep(0);
    };

    const closeTutorial = () => {
        setIsOpen(false);
        setSelectedTutorial(null);
        setCurrentStep(0);
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'Beginner':
                return 'bg-green-500/20 text-green-400';
            case 'Intermediate':
                return 'bg-yellow-500/20 text-yellow-400';
            case 'Advanced':
                return 'bg-red-500/20 text-red-400';
            default:
                return 'bg-gray-500/20 text-gray-400';
        }
    };

    if (!isOpen) {
        return (
            <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                        <Lightbulb className="h-5 w-5 text-yellow-400" />
                        Interactive Tutorials
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {tutorials.map((tutorial) => (
                            <div
                                key={tutorial.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-black/30 border border-gray-700 hover:border-purple-500/50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="text-purple-400">
                                        {tutorial.icon}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="text-sm font-medium text-white">
                                                {tutorial.title}
                                            </h4>
                                            {completedTutorials.includes(
                                                tutorial.id,
                                            ) && (
                                                <CheckCircle className="h-4 w-4 text-green-400" />
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-400">
                                            {tutorial.description}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge
                                                variant="outline"
                                                className={getDifficultyColor(
                                                    tutorial.difficulty,
                                                )}
                                            >
                                                {tutorial.difficulty}
                                            </Badge>
                                            <span className="text-xs text-gray-500">
                                                {tutorial.duration}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => startTutorial(tutorial)}
                                    className="bg-purple-600 hover:bg-purple-700"
                                >
                                    {completedTutorials.includes(tutorial.id)
                                        ? 'Replay'
                                        : 'Start'}
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!selectedTutorial) return null;

    const currentStepData = selectedTutorial.steps[currentStep];
    const isLastStep = currentStep === selectedTutorial.steps.length - 1;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="w-full max-w-2xl"
                >
                    <Card className="bg-gray-900 border-gray-700">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-white">
                                    {selectedTutorial.title}
                                </CardTitle>
                                <p className="text-sm text-gray-400 mt-1">
                                    Step {currentStep + 1} of{' '}
                                    {selectedTutorial.steps.length}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={closeTutorial}
                                className="text-gray-400 hover:text-white"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-2">
                                    {currentStepData.title}
                                </h3>
                                <p className="text-sm text-gray-300 mb-4">
                                    {currentStepData.description}
                                </p>
                                <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                                    <p className="text-gray-300">
                                        {currentStepData.content}
                                    </p>
                                </div>
                                {currentStepData.tip && (
                                    <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                        <Target className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                        <p className="text-sm text-blue-300">
                                            <strong>Tip:</strong>{' '}
                                            {currentStepData.tip}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {currentStepData.action && (
                                <div className="flex justify-center">
                                    <Button
                                        onClick={currentStepData.action.onClick}
                                        className="bg-purple-600 hover:bg-purple-700"
                                    >
                                        {currentStepData.action.label}
                                    </Button>
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                                <Button
                                    variant="outline"
                                    onClick={prevStep}
                                    disabled={currentStep === 0}
                                    className="flex items-center gap-2"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Previous
                                </Button>
                                <div className="flex space-x-1">
                                    {selectedTutorial.steps.map((_, index) => (
                                        <div
                                            key={index}
                                            className={`w-2 h-2 rounded-full ${
                                                index === currentStep
                                                    ? 'bg-purple-400'
                                                    : index < currentStep
                                                      ? 'bg-green-400'
                                                      : 'bg-gray-600'
                                            }`}
                                        />
                                    ))}
                                </div>
                                <Button
                                    onClick={nextStep}
                                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
                                >
                                    {isLastStep ? 'Complete' : 'Next'}
                                    {!isLastStep && (
                                        <ArrowRight className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
