'use client';

import { CheckCircle, Loader2, Mail } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export function NewsletterSignup() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !email.includes('@')) {
            toast({
                title: 'Invalid email',
                description: 'Please enter a valid email address.',
                variant: 'destructive',
            });
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/newsletter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            if (response.ok) {
                setIsSubscribed(true);
                setEmail('');
                toast({
                    title: 'Successfully subscribed!',
                    description:
                        "You'll receive updates about ATOMS.TECH features and improvements.",
                });
            } else {
                throw new Error('Subscription failed');
            }
        } catch (error) {
            toast({
                title: 'Subscription failed',
                description: 'Please try again later or contact us directly.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubscribed) {
        return (
            <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-lg p-6 text-center">
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">
                    You're all set!
                </h3>
                <p className="text-gray-300">
                    Thanks for subscribing. We'll keep you updated on the latest
                    features and improvements.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Mail className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">
                        Stay Updated
                    </h3>
                    <p className="text-sm text-gray-300">
                        Get the latest features and updates
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-2">
                    <Input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="flex-1 bg-black/50 border-gray-600 text-white placeholder:text-gray-400"
                        disabled={isLoading}
                    />
                    <Button
                        type="submit"
                        disabled={isLoading || !email}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            'Subscribe'
                        )}
                    </Button>
                </div>
                <p className="text-xs text-gray-400">
                    No spam, unsubscribe at any time. We respect your privacy.
                </p>
            </form>
        </div>
    );
}
