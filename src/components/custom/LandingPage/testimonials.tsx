'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

const testimonials = [
    {
        quote: 'THIS TOOL TRANSFORMED MY REQUIREMENTS PROCESS. NO WRESTLING WITH INCOMPLETE REQUIREMENTS WITH INADEQUATE TOOLS. UPLOAD, ENHANCE AND DELIVER.',
        author: 'SHANKAR',
        title: 'STARTUP CONSULTANT',
        company: 'TECH INNOVATIONS',
    },
    {
        quote: "FINALLY, A REQUIREMENTS TOOL THAT DOESN'T MAKE ME WANT TO THROW MY LAPTOP OUT THE WINDOW. THE AI ACTUALLY HELPS INSTEAD OF GETTING IN THE WAY.",
        author: 'SARAH CHEN',
        title: 'SYSTEMS ENGINEER',
        company: 'AEROSPACE DYNAMICS',
    },
    {
        quote: 'WE CUT OUR REQUIREMENTS REVIEW TIME BY 60%. THE COMPLIANCE CHECKING ALONE SAVED US WEEKS OF BACK-AND-FORTH WITH REGULATORS.',
        author: 'MICHAEL TORRES',
        title: 'LEAD ENGINEER',
        company: 'MEDICAL DEVICES INC',
    },
    {
        quote: 'SWITCHING FROM EXCEL HELL TO THIS WAS THE BEST DECISION WE MADE THIS YEAR. OUR TEAM ACTUALLY ENJOYS WRITING REQUIREMENTS NOW.',
        author: 'ALEX KUMAR',
        title: 'PROJECT MANAGER',
        company: 'AUTOMOTIVE SYSTEMS',
    },
];

export function Testimonials() {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % testimonials.length);
        }, 8000);

        return () => clearInterval(timer);
    }, []);

    const nextTestimonial = () => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    };

    const prevTestimonial = () => {
        setCurrentIndex(
            (prev) => (prev - 1 + testimonials.length) % testimonials.length,
        );
    };

    const currentTestimonial = testimonials[currentIndex];

    return (
        <section className="py-24 md:py-32 relative bg-black">
            <div className="absolute top-0 left-0 w-full h-1 bg-white" />
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-[48px] sm:text-[64px] md:text-[80px] lg:text-[96px] xl:text-[112px] font-black tracking-tighter text-white leading-none mb-8">
                        WHAT USERS SAY
                    </h2>
                </div>

                <div className="max-w-5xl mx-auto">
                    <div className="relative border-2 border-white p-8 md:p-16">
                        <div className="flex justify-between items-start mb-8">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={prevTestimonial}
                                className="text-white hover:bg-white/10"
                            >
                                <ChevronLeft className="h-6 w-6" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={nextTestimonial}
                                className="text-white hover:bg-white/10"
                            >
                                <ChevronRight className="h-6 w-6" />
                            </Button>
                        </div>

                        <div className="text-center">
                            <p className="text-2xl md:text-3xl lg:text-4xl font-black mb-8 text-white tracking-tight leading-tight">
                                &quot;{currentTestimonial.quote}&quot;
                            </p>
                            <div className="space-y-2">
                                <p className="text-lg text-purple-400 font-bold">
                                    — {currentTestimonial.author}
                                </p>
                                <p className="text-md text-gray-400 font-medium">
                                    {currentTestimonial.title}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {currentTestimonial.company}
                                </p>
                            </div>
                        </div>

                        {/* Pagination dots */}
                        <div className="flex justify-center mt-8 space-x-2">
                            {testimonials.map((_, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => setCurrentIndex(index)}
                                    aria-label={`Go to testimonial ${index + 1}`}
                                    className={`w-3 h-3 rounded-full transition-colors ${
                                        index === currentIndex
                                            ? 'bg-purple-400'
                                            : 'bg-gray-600 hover:bg-gray-500'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-white" />
        </section>
    );
}
