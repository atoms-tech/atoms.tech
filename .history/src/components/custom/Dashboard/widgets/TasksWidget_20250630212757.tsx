'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Plus, Target } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { WidgetProps } from '@/types/dashboard.types';

interface Task {
    id: string;
    title: string;
    completed: boolean;
    priority: 'low' | 'medium' | 'high';
    dueDate?: Date;
    category?: string;
}

export function TasksWidget({ instance }: WidgetProps) {
    const {
        maxTasks = 5,
        showCompleted = true,
        showPriority = true,
    } = instance.config || {};

    const [tasks, setTasks] = useState<Task[]>([
        {
            id: '1',
            title: 'Review project requirements',
            completed: false,
            priority: 'high',
            dueDate: new Date(Date.now() + 86400000),
            category: 'Work',
        },
        {
            id: '2',
            title: 'Update documentation',
            completed: false,
            priority: 'medium',
            category: 'Work',
        },
        {
            id: '3',
            title: 'Team standup meeting',
            completed: true,
            priority: 'low',
            category: 'Meetings',
        },
        {
            id: '4',
            title: 'Code review for PR #123',
            completed: false,
            priority: 'high',
            dueDate: new Date(Date.now() + 43200000),
            category: 'Development',
        },
    ]);

    const [newTaskTitle, setNewTaskTitle] = useState('');

    const toggleTask = (taskId: string) => {
        setTasks((prev) =>
            prev.map((task) =>
                task.id === taskId
                    ? { ...task, completed: !task.completed }
                    : task,
            ),
        );
    };

    const addTask = () => {
        if (newTaskTitle.trim()) {
            const newTask: Task = {
                id: Date.now().toString(),
                title: newTaskTitle.trim(),
                completed: false,
                priority: 'medium',
            };
            setTasks((prev) => [newTask, ...prev]);
            setNewTaskTitle('');
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

    const getPriorityDot = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'bg-red-500';
            case 'medium':
                return 'bg-yellow-500';
            case 'low':
                return 'bg-green-500';
            default:
                return 'bg-gray-400';
        }
    };

    const filteredTasks = tasks
        .filter((task) => showCompleted || !task.completed)
        .slice(0, Number(maxTasks) || 5);

    const completedCount = tasks.filter((task) => task.completed).length;
    const totalCount = tasks.length;
    const completionPercentage =
        totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
        <Card className="h-full">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Target className="h-5 w-5" />
                        Tasks
                    </CardTitle>
                    <div className="text-sm text-gray-500">
                        {completedCount}/{totalCount} ({completionPercentage}%)
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <motion.div
                        className="bg-blue-500 h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${completionPercentage}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Add New Task */}
                <div className="flex gap-2">
                    <Input
                        placeholder="Add a new task..."
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addTask()}
                        className="flex-1"
                    />
                    <Button onClick={addTask} size="sm" className="px-3">
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>

                {/* Task List */}
                <div className="space-y-2">
                    {filteredTasks.map((task, index) => (
                        <motion.div
                            key={task.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`p-3 rounded-lg border transition-all duration-200 ${
                                task.completed
                                    ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-60'
                                    : showPriority
                                      ? getPriorityColor(task.priority)
                                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <button
                                    type="button"
                                    onClick={() => toggleTask(task.id)}
                                    className="mt-0.5 transition-colors"
                                >
                                    {task.completed ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    ) : (
                                        <Circle className="h-5 w-5 text-gray-400 hover:text-blue-500" />
                                    )}
                                </button>

                                <div className="flex-1 min-w-0">
                                    <div
                                        className={`text-sm font-medium ${
                                            task.completed
                                                ? 'line-through text-gray-500'
                                                : ''
                                        }`}
                                    >
                                        {task.title}
                                    </div>

                                    <div className="flex items-center gap-2 mt-1">
                                        {Boolean(showPriority) &&
                                            !task.completed && (
                                                <div className="flex items-center gap-1">
                                                    <div
                                                        className={`w-2 h-2 rounded-full ${getPriorityDot(task.priority)}`}
                                                    ></div>
                                                    <span className="text-xs text-gray-500 capitalize">
                                                        {task.priority}
                                                    </span>
                                                </div>
                                            )}

                                        {task.category && (
                                            <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">
                                                {task.category}
                                            </span>
                                        )}

                                        {task.dueDate && (
                                            <span className="text-xs text-gray-500">
                                                Due{' '}
                                                {task.dueDate.toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {filteredTasks.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No tasks to show</p>
                            <p className="text-sm">Add a task to get started</p>
                        </div>
                    )}
                </div>

                {tasks.length > Number(maxTasks) && (
                    <div className="text-center">
                        <Button variant="ghost" size="sm" className="text-xs">
                            View {tasks.length - Number(maxTasks)} more tasks
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
