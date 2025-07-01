'use client';

import { motion } from 'framer-motion';
import {
    ArrowRight,
    Lightbulb,
    RefreshCw,
    Sparkles,
    TrendingUp,
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WidgetProps } from '@/types/dashboard.types';

interface AISuggestion {
    id: string;
    title: string;
    description: string;
    type: 'optimization' | 'automation' | 'insight' | 'improvement';
    priority: 'low' | 'medium' | 'high';
    impact: string;
    action?: string;
    confidence: number;
}

export function AISuggestionsWidget({ instance, onConfigChange }: WidgetProps) {
    const {
        maxSuggestions = 4,
        showPriority = true,
        showConfidence = true,
    } = instance.config || {};

    const [suggestions] = useState<AISuggestion[]>([
        {
            id: '1',
            title: 'Optimize Dashboard Layout',
            description:
                'Based on your usage patterns, consider moving the Analytics widget to the top-left for better accessibility.',
            type: 'optimization',
            priority: 'medium',
            impact: 'Improve workflow efficiency by 15%',
            action: 'Rearrange widgets',
            confidence: 85,
        },
        {
            id: '2',
            title: 'Automate Daily Reports',
            description:
                'You frequently check project metrics at 9 AM. Set up automated daily reports to save time.',
            type: 'automation',
            priority: 'high',
            impact: 'Save 30 minutes daily',
            action: 'Create automation',
            confidence: 92,
        },
        {
            id: '3',
            title: 'Team Collaboration Insight',
            description:
                'Your team shows peak collaboration between 2-4 PM. Schedule important meetings during this window.',
            type: 'insight',
            priority: 'low',
            impact: 'Increase meeting effectiveness',
            confidence: 78,
        },
        {
            id: '4',
            title: 'Improve Task Management',
            description:
                'Consider breaking down large tasks into smaller ones. Your completion rate increases by 40% with smaller tasks.',
            type: 'improvement',
            priority: 'medium',
            impact: 'Boost productivity',
            action: 'Review task structure',
            confidence: 88,
        },
        {
            id: '5',
            title: 'Resource Allocation',
            description:
                'Project Alpha is trending ahead of schedule. Consider reallocating resources to Project Beta.',
            type: 'insight',
            priority: 'high',
            impact: 'Optimize resource utilization',
            action: 'Review allocations',
            confidence: 91,
        },
    ]);

    const [isRefreshing, setIsRefreshing] = useState(false);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'optimization':
                return <TrendingUp className="h-4 w-4" />;
            case 'automation':
                return <RefreshCw className="h-4 w-4" />;
            case 'insight':
                return <Lightbulb className="h-4 w-4" />;
            case 'improvement':
                return <Sparkles className="h-4 w-4" />;
            default:
                return <Lightbulb className="h-4 w-4" />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'optimization':
                return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
            case 'automation':
                return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
            case 'insight':
                return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
            case 'improvement':
                return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'border-red-500 bg-red-50 dark:bg-red-950';
            case 'medium':
                return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950';
            case 'low':
                return 'border-green-500 bg-green-50 dark:bg-green-950';
            default:
                return 'border-gray-300 bg-gray-50 dark:bg-gray-800';
        }
    };

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => setIsRefreshing(false), 1000);
    };

    const displayedSuggestions = suggestions.slice(0, maxSuggestions);

    return (
        <Card className="h-full">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Lightbulb className="h-5 w-5" />
                        AI Suggestions
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="h-8 w-8 p-0"
                    >
                        <RefreshCw
                            className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
                        />
                    </Button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Smart recommendations to improve your workflow
                </p>
            </CardHeader>

            <CardContent className="space-y-3">
                {displayedSuggestions.map((suggestion, index) => (
                    <motion.div
                        key={suggestion.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-3 rounded-lg border transition-all duration-200 hover:shadow-sm group ${
                            showPriority
                                ? getPriorityColor(suggestion.priority)
                                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                        }`}
                    >
                        <div className="flex items-start gap-3">
                            <div
                                className={`p-2 rounded-lg ${getTypeColor(suggestion.type)}`}
                            >
                                {getTypeIcon(suggestion.type)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                        {suggestion.title}
                                    </h4>
                                    {showConfidence && (
                                        <span className="text-xs text-gray-500 ml-2">
                                            {suggestion.confidence}%
                                        </span>
                                    )}
                                </div>

                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {suggestion.description}
                                </p>

                                <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`text-xs px-2 py-1 rounded-full ${getTypeColor(suggestion.type)}`}
                                        >
                                            {suggestion.type}
                                        </span>
                                        {showPriority && (
                                            <span
                                                className={`text-xs px-2 py-1 rounded-full capitalize ${
                                                    suggestion.priority ===
                                                    'high'
                                                        ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                                        : suggestion.priority ===
                                                            'medium'
                                                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                                                          : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                                }`}
                                            >
                                                {suggestion.priority}
                                            </span>
                                        )}
                                    </div>

                                    {suggestion.action && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            {suggestion.action}
                                            <ArrowRight className="h-3 w-3 ml-1" />
                                        </Button>
                                    )}
                                </div>

                                <p className="text-xs text-gray-500 mt-1">
                                    Impact: {suggestion.impact}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                ))}

                {suggestions.length > maxSuggestions && (
                    <div className="text-center pt-2">
                        <Button variant="ghost" size="sm" className="text-xs">
                            View {suggestions.length - maxSuggestions} more
                            suggestions
                        </Button>
                    </div>
                )}

                {displayedSuggestions.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No suggestions available</p>
                        <p className="text-sm">
                            Check back later for AI-powered insights
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
