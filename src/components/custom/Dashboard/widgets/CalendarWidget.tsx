'use client';

import { motion } from 'framer-motion';
import { Calendar, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WidgetProps } from '@/types/dashboard.types';

interface CalendarEvent {
    id: string;
    title: string;
    date: Date;
    time?: string;
    type: 'meeting' | 'deadline' | 'reminder' | 'event';
}

export function CalendarWidget({ instance, onConfigChange: _onConfigChange }: WidgetProps) {
    const {
        viewMode = 'month',
        showWeekends: _showWeekends = true,
        highlightToday = true,
    } = instance.config || {};

    const [currentDate, setCurrentDate] = useState(new Date());

    // Mock events - in real app, this would come from props.data
    const events: CalendarEvent[] = [
        {
            id: '1',
            title: 'Team Meeting',
            date: new Date(),
            time: '10:00 AM',
            type: 'meeting',
        },
        {
            id: '2',
            title: 'Project Deadline',
            date: new Date(Date.now() + 86400000 * 2),
            type: 'deadline',
        },
        {
            id: '3',
            title: 'Code Review',
            date: new Date(Date.now() + 86400000 * 3),
            time: '2:00 PM',
            type: 'meeting',
        },
    ];

    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
        setCurrentDate((prev) => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
            return newDate;
        });
    };

    const isToday = (day: number) => {
        const today = new Date();
        return (
            today.getDate() === day &&
            today.getMonth() === currentDate.getMonth() &&
            today.getFullYear() === currentDate.getFullYear()
        );
    };

    const hasEvent = (day: number) => {
        return events.some((event) => {
            const eventDate = new Date(event.date);
            return (
                eventDate.getDate() === day &&
                eventDate.getMonth() === currentDate.getMonth() &&
                eventDate.getFullYear() === currentDate.getFullYear()
            );
        });
    };

    const getEventTypeColor = (type: string) => {
        switch (type) {
            case 'meeting':
                return 'bg-blue-500';
            case 'deadline':
                return 'bg-red-500';
            case 'reminder':
                return 'bg-yellow-500';
            case 'event':
                return 'bg-green-500';
            default:
                return 'bg-gray-500';
        }
    };

    const renderCalendarGrid = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const days = [];

        // Empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-8"></div>);
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const isCurrentDay = isToday(day);
            const dayHasEvent = hasEvent(day);

            days.push(
                <motion.div
                    key={day}
                    whileHover={{ scale: 1.05 }}
                    className={`h-8 flex items-center justify-center text-sm cursor-pointer rounded transition-colors relative ${
                        isCurrentDay && highlightToday
                            ? 'bg-blue-500 text-white font-bold'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                >
                    {day}
                    {dayHasEvent && (
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-400 rounded-full"></div>
                    )}
                </motion.div>,
            );
        }

        return days;
    };

    const upcomingEvents = events
        .filter((event) => event.date >= new Date())
        .sort((a, b) => a.date.getTime() - b.date.getTime())
        .slice(0, 3);

    return (
        <Card className="h-full">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Calendar className="h-5 w-5" />
                        Calendar
                    </CardTitle>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigateMonth('prev')}
                            className="h-8 w-8 p-0"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigateMonth('next')}
                            className="h-8 w-8 p-0"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <div className="text-center font-medium">
                    {currentDate.toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric',
                    })}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {viewMode === 'month' && (
                    <div className="space-y-2">
                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1 text-xs text-gray-500 mb-2">
                            {[
                                'Sun',
                                'Mon',
                                'Tue',
                                'Wed',
                                'Thu',
                                'Fri',
                                'Sat',
                            ].map((day) => (
                                <div
                                    key={day}
                                    className="text-center font-medium"
                                >
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {renderCalendarGrid()}
                        </div>
                    </div>
                )}

                {/* Upcoming Events */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">Upcoming</h4>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                        >
                            <Plus className="h-3 w-3" />
                        </Button>
                    </div>
                    <div className="space-y-2">
                        {upcomingEvents.map((event, index) => (
                            <motion.div
                                key={event.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800"
                            >
                                <div
                                    className={`w-2 h-2 rounded-full ${getEventTypeColor(event.type)}`}
                                ></div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">
                                        {event.title}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {event.date.toLocaleDateString()}
                                        {event.time && ` • ${event.time}`}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        {upcomingEvents.length === 0 && (
                            <div className="text-center py-4 text-gray-500 text-sm">
                                No upcoming events
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
