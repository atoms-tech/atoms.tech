import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/custom/toggles/ThemeToggle';
import { RecentActivityTab } from '@/components/home/RecentActivityTab';

/**
 * Visual Test Showcase Page
 * 
 * This page provides a comprehensive showcase of all UI components
 * for visual regression testing. It includes all component variants,
 * states, and interactions.
 */
export default function VisualTestShowcase() {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        description: '',
    });
    const [_selectedValue, _setSelectedValue] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleFormSubmit = () => {
        const newErrors: Record<string, string> = {};
        
        if (!formData.name) newErrors.name = 'Name is required';
        if (!formData.email) newErrors.email = 'Email is required';
        if (formData.email && !formData.email.includes('@')) newErrors.email = 'Invalid email format';
        
        setErrors(newErrors);
        
        if (Object.keys(newErrors).length === 0) {
            setIsLoading(true);
            setTimeout(() => setIsLoading(false), 2000);
        }
    };

    return (
        <div className="p-8 space-y-12">
            <div className="space-y-4">
                <h1 className="text-3xl font-bold">Visual Test Showcase</h1>
                <p className="text-muted-foreground">
                    Comprehensive showcase of all UI components for visual regression testing
                </p>
            </div>

            {/* Theme Toggle Section */}
            <section className="space-y-6">
                <h2 className="text-2xl font-semibold">Theme Toggle</h2>
                <div className="flex items-center space-x-4">
                    <ThemeToggle />
                    <span className="text-sm text-muted-foreground">
                        Toggle between light and dark themes
                    </span>
                </div>
            </section>

            {/* Button Components */}
            <section className="space-y-6">
                <h2 className="text-2xl font-semibold">Buttons</h2>
                
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Button Variants</h3>
                    <div className="flex flex-wrap gap-4">
                        <Button data-testid="button-default" variant="default">Default</Button>
                        <Button data-testid="button-destructive" variant="destructive">Destructive</Button>
                        <Button data-testid="button-outline" variant="outline">Outline</Button>
                        <Button data-testid="button-secondary" variant="secondary">Secondary</Button>
                        <Button data-testid="button-ghost" variant="ghost">Ghost</Button>
                        <Button data-testid="button-link" variant="link">Link</Button>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Button Sizes</h3>
                    <div className="flex flex-wrap items-center gap-4">
                        <Button data-testid="button-size-sm" size="sm">Small</Button>
                        <Button data-testid="button-size-default" size="default">Default</Button>
                        <Button data-testid="button-size-lg" size="lg">Large</Button>
                        <Button data-testid="button-size-icon" size="icon">🎯</Button>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Button States</h3>
                    <div className="flex flex-wrap gap-4">
                        <Button data-testid="button-primary">Primary</Button>
                        <Button data-testid="button-disabled" disabled>Disabled</Button>
                        <Button data-testid="button-loading" disabled>
                            {isLoading ? 'Loading...' : 'Load Data'}
                        </Button>
                        <Button data-testid="button-active" className="bg-primary/80">Active</Button>
                    </div>
                </div>
            </section>

            {/* Card Components */}
            <section className="space-y-6">
                <h2 className="text-2xl font-semibold">Cards</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card data-testid="card-basic">
                        <CardContent className="p-6">
                            <p>Basic card content without header or footer.</p>
                        </CardContent>
                    </Card>

                    <Card data-testid="card-with-header">
                        <CardHeader>
                            <CardTitle>Card with Header</CardTitle>
                            <CardDescription>This card has a header section</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>Card content goes here.</p>
                        </CardContent>
                    </Card>

                    <Card data-testid="card-with-footer">
                        <CardContent className="p-6">
                            <p>Card content with footer.</p>
                        </CardContent>
                        <CardContent className="pt-0">
                            <Button size="sm">Footer Action</Button>
                        </CardContent>
                    </Card>

                    <Card data-testid="card-complete">
                        <CardHeader>
                            <CardTitle>Complete Card</CardTitle>
                            <CardDescription>Header, content, and footer</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>This card demonstrates all sections working together.</p>
                        </CardContent>
                        <CardContent className="pt-0">
                            <div className="flex justify-between">
                                <Button variant="outline" size="sm">Cancel</Button>
                                <Button size="sm">Save</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card data-testid="card-interactive" className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardHeader>
                            <CardTitle>Interactive Card</CardTitle>
                            <CardDescription>Hover to see effect</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p>This card has hover effects and is clickable.</p>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Input Components */}
            <section className="space-y-6">
                <h2 className="text-2xl font-semibold">Input Fields</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="input-basic">Basic Input</Label>
                            <Input data-testid="input-basic" id="input-basic" />
                        </div>

                        <div>
                            <Label htmlFor="input-placeholder">With Placeholder</Label>
                            <Input 
                                data-testid="input-placeholder" 
                                id="input-placeholder" 
                                placeholder="Enter your name..." 
                            />
                        </div>

                        <div>
                            <Label htmlFor="input-with-value">With Value</Label>
                            <Input 
                                data-testid="input-with-value" 
                                id="input-with-value" 
                                value="John Doe"
                                readOnly
                            />
                        </div>

                        <div>
                            <Label htmlFor="input-disabled">Disabled Input</Label>
                            <Input 
                                data-testid="input-disabled" 
                                id="input-disabled" 
                                disabled 
                                placeholder="Disabled input"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="input-error">Error State</Label>
                            <Input 
                                data-testid="input-error" 
                                id="input-error" 
                                className="border-red-500"
                                placeholder="This field has an error"
                            />
                            <p className="text-sm text-red-500 mt-1">This field is required</p>
                        </div>

                        <div>
                            <Label htmlFor="input-success">Success State</Label>
                            <Input 
                                data-testid="input-success" 
                                id="input-success" 
                                className="border-green-500"
                                value="valid@example.com"
                                readOnly
                            />
                            <p className="text-sm text-green-500 mt-1">Valid email address</p>
                        </div>

                        <div>
                            <Label htmlFor="input-validation">Validation Test</Label>
                            <Input 
                                data-testid="input-validation" 
                                id="input-validation" 
                                placeholder="Enter email to test validation"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Select Components */}
            <section className="space-y-6">
                <h2 className="text-2xl font-semibold">Select Components</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div>
                            <Label>Basic Select</Label>
                            <Select data-testid="select-basic">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an option" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem data-testid="select-option-1" value="option1">Option 1</SelectItem>
                                    <SelectItem data-testid="select-option-2" value="option2">Option 2</SelectItem>
                                    <SelectItem data-testid="select-option-3" value="option3">Option 3</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Select with Value</Label>
                            <Select data-testid="select-with-value" value="selected">
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="selected">Selected Option</SelectItem>
                                    <SelectItem value="other">Other Option</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <Label>Disabled Select</Label>
                            <Select data-testid="select-disabled" disabled>
                                <SelectTrigger>
                                    <SelectValue placeholder="Disabled select" />
                                </SelectTrigger>
                            </Select>
                        </div>

                        <div>
                            <Label>Error Select</Label>
                            <Select data-testid="select-error">
                                <SelectTrigger className="border-red-500">
                                    <SelectValue placeholder="Select has error" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="option1">Option 1</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-sm text-red-500 mt-1">Please select an option</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Dialog Components */}
            <section className="space-y-6">
                <h2 className="text-2xl font-semibold">Dialog Components</h2>
                
                <div className="flex flex-wrap gap-4">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button data-testid="dialog-trigger-basic" variant="outline">
                                Basic Dialog
                            </Button>
                        </DialogTrigger>
                        <DialogContent data-testid="dialog-basic">
                            <DialogHeader>
                                <DialogTitle>Basic Dialog</DialogTitle>
                                <DialogDescription>
                                    This is a basic dialog with title and description.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                <p>Dialog content goes here.</p>
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog>
                        <DialogTrigger asChild>
                            <Button data-testid="dialog-trigger-form" variant="outline">
                                Form Dialog
                            </Button>
                        </DialogTrigger>
                        <DialogContent data-testid="dialog-form">
                            <DialogHeader>
                                <DialogTitle>Form Dialog</DialogTitle>
                                <DialogDescription>
                                    Dialog containing a form with various inputs.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div>
                                    <Label htmlFor="dialog-name">Name</Label>
                                    <Input id="dialog-name" placeholder="Enter name" />
                                </div>
                                <div>
                                    <Label htmlFor="dialog-email">Email</Label>
                                    <Input id="dialog-email" type="email" placeholder="Enter email" />
                                </div>
                                <div className="flex justify-end space-x-2">
                                    <Button variant="outline">Cancel</Button>
                                    <Button>Save</Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </section>

            {/* Badge Components */}
            <section className="space-y-6">
                <h2 className="text-2xl font-semibold">Badge Components</h2>
                
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-medium">Badge Variants</h3>
                        <div className="flex flex-wrap gap-2">
                            <Badge data-testid="badge-default">Default</Badge>
                            <Badge data-testid="badge-secondary" variant="secondary">Secondary</Badge>
                            <Badge data-testid="badge-destructive" variant="destructive">Destructive</Badge>
                            <Badge data-testid="badge-outline" variant="outline">Outline</Badge>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-medium">Badge with Status</h3>
                        <div className="flex flex-wrap gap-2">
                            <Badge className="bg-green-500">Success</Badge>
                            <Badge className="bg-yellow-500">Warning</Badge>
                            <Badge className="bg-red-500">Error</Badge>
                            <Badge className="bg-blue-500">Info</Badge>
                        </div>
                    </div>
                </div>
            </section>

            {/* Tooltip Components */}
            <section className="space-y-6">
                <h2 className="text-2xl font-semibold">Tooltip Components</h2>
                
                <TooltipProvider>
                    <div className="flex flex-wrap gap-4">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button data-testid="tooltip-trigger-top" variant="outline">
                                    Top Tooltip
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                                <p>This tooltip appears on top</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button data-testid="tooltip-trigger-right" variant="outline">
                                    Right Tooltip
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                <p>This tooltip appears on the right</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button data-testid="tooltip-trigger-bottom" variant="outline">
                                    Bottom Tooltip
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                                <p>This tooltip appears on the bottom</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button data-testid="tooltip-trigger-left" variant="outline">
                                    Left Tooltip
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                                <p>This tooltip appears on the left</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </TooltipProvider>
            </section>

            {/* Avatar Components */}
            <section className="space-y-6">
                <h2 className="text-2xl font-semibold">Avatar Components</h2>
                
                <div className="flex flex-wrap gap-4">
                    <Avatar data-testid="avatar-with-image">
                        <AvatarImage src="/api/placeholder/40/40" alt="User" />
                        <AvatarFallback>JD</AvatarFallback>
                    </Avatar>

                    <Avatar data-testid="avatar-initials">
                        <AvatarFallback>AB</AvatarFallback>
                    </Avatar>

                    <Avatar data-testid="avatar-fallback">
                        <AvatarImage src="/broken-image.jpg" alt="User" />
                        <AvatarFallback>?</AvatarFallback>
                    </Avatar>
                </div>
            </section>

            {/* Skeleton Components */}
            <section className="space-y-6">
                <h2 className="text-2xl font-semibold">Skeleton Components</h2>
                
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-medium">Text Skeletons</h3>
                        <div className="space-y-2">
                            <Skeleton data-testid="skeleton-text" className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-medium">Shape Skeletons</h3>
                        <div className="flex gap-4">
                            <Skeleton data-testid="skeleton-circle" className="h-12 w-12 rounded-full" />
                            <Skeleton data-testid="skeleton-rectangle" className="h-12 w-24" />
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-medium">Card Skeleton</h3>
                        <Card data-testid="skeleton-card" className="p-6">
                            <div className="space-y-4">
                                <div className="flex items-center space-x-4">
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-3/4" />
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Separator Components */}
            <section className="space-y-6">
                <h2 className="text-2xl font-semibold">Separator Components</h2>
                
                <div className="space-y-4">
                    <div>
                        <p>Content above separator</p>
                        <Separator data-testid="separator-horizontal" className="my-4" />
                        <p>Content below separator</p>
                    </div>

                    <div className="flex items-center space-x-4">
                        <p>Left content</p>
                        <Separator data-testid="separator-vertical" orientation="vertical" className="h-6" />
                        <p>Right content</p>
                    </div>
                </div>
            </section>

            {/* Custom Components */}
            <section className="space-y-6">
                <h2 className="text-2xl font-semibold">Custom Components</h2>
                
                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Activity Component</CardTitle>
                            <CardDescription>
                                Custom component showing recent user activity
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <RecentActivityTab />
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* Form Example */}
            <section className="space-y-6">
                <h2 className="text-2xl font-semibold">Form Example</h2>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Contact Form</CardTitle>
                        <CardDescription>
                            Example form with validation and different states
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="form-name">Name</Label>
                            <Input
                                data-testid="form-input-name"
                                id="form-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className={errors.name ? 'border-red-500' : ''}
                            />
                            {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                        </div>

                        <div>
                            <Label htmlFor="form-email">Email</Label>
                            <Input
                                data-testid="form-input-email"
                                id="form-email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className={errors.email ? 'border-red-500' : ''}
                            />
                            {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                        </div>

                        <div>
                            <Label htmlFor="form-description">Description</Label>
                            <textarea
                                data-testid="form-textarea-description"
                                id="form-description"
                                className="w-full min-h-24 px-3 py-2 border rounded-md"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setFormData({ name: '', email: '', description: '' })}>
                                Clear
                            </Button>
                            <Button 
                                data-testid="form-submit"
                                onClick={handleFormSubmit}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Submitting...' : 'Submit'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
}