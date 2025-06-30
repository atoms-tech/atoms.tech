'use client';

import { useState } from 'react';
import {
    addMinutes,
    eachDayOfInterval,
    endOfMonth,
    format,
    isBefore,
    isWeekend,
    startOfDay,
    startOfMonth,
} from 'date-fns';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface ScheduleDemoDialogProps {
    className?: string;
}

export function ScheduleDemoDialog({ className }: ScheduleDemoDialogProps) {
    const [open, setOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        organization: '',
        email: '',
        description: '',
    });

    const today = startOfDay(new Date());
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);

    const days = eachDayOfInterval({ start: monthStart, end: monthEnd }).filter(
        (day) => !isWeekend(day) && !isBefore(day, today),
    );

    const timeSlots: string[] = [];
    if (selectedDate) {
        let current = new Date(selectedDate);
        current.setHours(9, 0, 0, 0);
        while (current.getHours() < 17) {
            timeSlots.push(format(current, 'HH:mm'));
            current = addMinutes(current, 30);
        }
    }

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Demo scheduled:', {
            date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null,
            time: selectedTime,
            ...formData,
        });
        setOpen(false);
        setSelectedDate(null);
        setSelectedTime(null);
        setFormData({ name: '', organization: '', email: '', description: '' });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className={className}>SCHEDULE A DEMO</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Schedule a Demo</DialogTitle>
                </DialogHeader>
                {!selectedDate && (
                    <div className="grid grid-cols-5 gap-2">
                        {days.map((day) => (
                            <button
                                key={day.toDateString()}
                                onClick={() => setSelectedDate(day)}
                                className="p-2 border rounded hover:bg-accent"
                            >
                                {format(day, 'MMM d')}
                            </button>
                        ))}
                    </div>
                )}
                {selectedDate && !selectedTime && (
                    <div className="space-y-4">
                        <p className="font-bold">
                            Select a time on {format(selectedDate, 'MMMM d, yyyy')}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {timeSlots.map((slot) => (
                                <button
                                    key={slot}
                                    onClick={() => setSelectedTime(slot)}
                                    className="p-2 border rounded hover:bg-accent"
                                >
                                    {slot}
                                </button>
                            ))}
                        </div>
                        <Button
                            variant="ghost"
                            className="mt-2"
                            onClick={() => setSelectedDate(null)}
                        >
                            Back
                        </Button>
                    </div>
                )}
                {selectedDate && selectedTime && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <p className="font-bold">
                            Demo on {format(selectedDate, 'MMMM d, yyyy')} at{' '}
                            {selectedTime}
                        </p>
                        <Input
                            name="name"
                            placeholder="Name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                        />
                        <Input
                            name="organization"
                            placeholder="Organization"
                            value={formData.organization}
                            onChange={handleInputChange}
                            required
                        />
                        <Input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                        />
                        <Textarea
                            name="description"
                            placeholder="Describe what you would like to see"
                            value={formData.description}
                            onChange={handleInputChange}
                        />
                        <DialogFooter>
                            <Button type="submit">Schedule</Button>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setSelectedTime(null)}
                            >
                                Back
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}