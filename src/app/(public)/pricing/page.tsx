'use client';

import { Button } from '@/components/ui/button';

export default function PricingPage() {
    const pricingPlans = [
        {
            name: 'Basic',
            price: '$9',
            period: '/month',
            features: ['1 User', '10 Projects', 'Basic Support', '2GB Storage'],
        },
        {
            name: 'Pro',
            price: '$29',
            period: '/month',
            features: [
                '5 Users',
                'Unlimited Projects',
                'Priority Support',
                '10GB Storage',
            ],
        },
        {
            name: 'Enterprise',
            price: '$99',
            period: '/month',
            features: [
                'Unlimited Users',
                'Unlimited Projects',
                '24/7 Support',
                'Unlimited Storage',
            ],
        },
    ];

    return (
        <div className="py-16 px-4 max-w-7xl mx-auto">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold mb-4">
                    Simple, Transparent Pricing
                </h1>
                <p className="text-gray-600">
                    Choose the plan that works best for you
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {pricingPlans.map((plan) => (
                    <div
                        key={plan.name}
                        className="border rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow"
                    >
                        <h2 className="text-2xl font-bold mb-4">{plan.name}</h2>
                        <div className="mb-6">
                            <span className="text-4xl font-bold">
                                {plan.price}
                            </span>
                            <span className="text-gray-600">{plan.period}</span>
                        </div>
                        <ul className="space-y-3 mb-8">
                            {plan.features.map((feature) => (
                                <li key={feature} className="flex items-center">
                                    <svg
                                        className="w-5 h-5 text-green-500 mr-2"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                    {feature}
                                </li>
                            ))}
                        </ul>
                        <Button className="w-full">Get Started</Button>
                    </div>
                ))}
            </div>
        </div>
    );
}
