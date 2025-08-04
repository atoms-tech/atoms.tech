import React, { useState } from 'react';
import { NextPage } from 'next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription as _CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Search, Mail, Lock, User as _User } from 'lucide-react';

/**
 * Input Visual Test Showcase
 * 
 * Comprehensive showcase of input components for visual testing
 */
const InputShowcase: NextPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [inputValue, setInputValue] = useState('');

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Input Components</h1>
          <p className="text-muted-foreground">
            Visual testing showcase for form inputs and validation states
          </p>
        </div>

        {/* Basic Inputs */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Basic Inputs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Standard Input</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="input-basic">Basic Input</Label>
                  <Input 
                    id="input-basic"
                    data-testid="input-basic"
                    placeholder="Enter text..."
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Input with Placeholder</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="input-placeholder">Placeholder Text</Label>
                  <Input 
                    id="input-placeholder"
                    data-testid="input-placeholder"
                    placeholder="This is placeholder text"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Input with Values */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Input with Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Input with Value</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="input-value">Pre-filled Input</Label>
                  <Input 
                    id="input-value"
                    data-testid="input-with-value"
                    value="Sample text content"
                    readOnly
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Input with Label</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="input-label">Full Name</Label>
                  <Input 
                    id="input-label"
                    data-testid="input-with-label"
                    placeholder="John Doe"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Input States */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Input States</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Default State</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="input-default">Default Input</Label>
                  <Input 
                    id="input-default"
                    data-testid="input-default"
                    placeholder="Default state"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Disabled State</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="input-disabled">Disabled Input</Label>
                  <Input 
                    id="input-disabled"
                    data-testid="input-disabled"
                    placeholder="Disabled state"
                    disabled
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Error State</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="input-error">Error Input</Label>
                  <Input 
                    id="input-error"
                    data-testid="input-error"
                    placeholder="Error state"
                    className="border-destructive focus:ring-destructive"
                    value="invalid@email"
                  />
                  <p className="text-sm text-destructive mt-1">
                    Please enter a valid email address
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Input Types */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Input Types</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Various Input Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="input-email">Email</Label>
                  <Input 
                    id="input-email"
                    data-testid="input-email"
                    type="email"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="input-password">Password</Label>
                  <Input 
                    id="input-password"
                    data-testid="input-password"
                    type="password"
                    placeholder="Password"
                  />
                </div>
                <div>
                  <Label htmlFor="input-number">Number</Label>
                  <Input 
                    id="input-number"
                    data-testid="input-number"
                    type="number"
                    placeholder="123"
                  />
                </div>
                <div>
                  <Label htmlFor="input-tel">Phone</Label>
                  <Input 
                    id="input-tel"
                    data-testid="input-tel"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Input with Icons</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Label htmlFor="input-search">Search</Label>
                  <Search className="absolute left-3 top-9 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="input-search"
                    data-testid="input-search"
                    placeholder="Search..."
                    className="pl-10"
                  />
                </div>
                <div className="relative">
                  <Label htmlFor="input-email-icon">Email</Label>
                  <Mail className="absolute left-3 top-9 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="input-email-icon"
                    data-testid="input-email-icon"
                    type="email"
                    placeholder="Email address"
                    className="pl-10"
                  />
                </div>
                <div className="relative">
                  <Label htmlFor="input-password-icon">Password</Label>
                  <Lock className="absolute left-3 top-9 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="input-password-icon"
                    data-testid="input-password-icon"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    className="pl-10 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-6 h-10 w-10"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Input Validation */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Input Validation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Validation States</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="input-validation">Email Validation</Label>
                  <Input 
                    id="input-validation"
                    data-testid="input-validation"
                    type="email"
                    placeholder="Enter email"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className={
                      inputValue && !inputValue.includes('@') 
                        ? 'border-destructive focus:ring-destructive' 
                        : inputValue.includes('@') 
                          ? 'border-green-500 focus:ring-green-500' 
                          : ''
                    }
                  />
                  {inputValue && !inputValue.includes('@') && (
                    <p className="text-sm text-destructive mt-1">
                      Please enter a valid email address
                    </p>
                  )}
                  {inputValue.includes('@') && (
                    <p className="text-sm text-green-600 mt-1">
                      Valid email format
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Required Field</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="input-required">
                    Required Field
                    <span className="text-destructive ml-1">*</span>
                  </Label>
                  <Input 
                    id="input-required"
                    data-testid="input-required"
                    placeholder="This field is required"
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    This field is required
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Input Sizes */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Input Sizes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Small Input</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="input-small">Small</Label>
                  <Input 
                    id="input-small"
                    data-testid="input-small"
                    placeholder="Small input"
                    className="h-8"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Default Input</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="input-default-size">Default</Label>
                  <Input 
                    id="input-default-size"
                    data-testid="input-default-size"
                    placeholder="Default input"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Large Input</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="input-large">Large</Label>
                  <Input 
                    id="input-large"
                    data-testid="input-large"
                    placeholder="Large input"
                    className="h-12"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Input Groups */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Input Groups</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Form Group</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="input-group-name">Name</Label>
                  <Input 
                    id="input-group-name"
                    data-testid="input-group-name"
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <Label htmlFor="input-group-email">Email</Label>
                  <Input 
                    id="input-group-email"
                    data-testid="input-group-email"
                    type="email"
                    placeholder="Email address"
                  />
                </div>
                <div>
                  <Label htmlFor="input-group-message">Message</Label>
                  <textarea
                    id="input-group-message"
                    data-testid="input-group-message"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Your message..."
                  />
                </div>
                <Button type="submit" className="w-full">
                  Submit
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inline Input Group</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Label htmlFor="input-inline-first">First Name</Label>
                    <Input 
                      id="input-inline-first"
                      data-testid="input-inline-first"
                      placeholder="First"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="input-inline-last">Last Name</Label>
                    <Input 
                      id="input-inline-last"
                      data-testid="input-inline-last"
                      placeholder="Last"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="input-inline-url">Website URL</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 text-sm text-muted-foreground bg-muted border border-r-0 border-input rounded-l-md">
                      https://
                    </span>
                    <Input 
                      id="input-inline-url"
                      data-testid="input-inline-url"
                      placeholder="example.com"
                      className="rounded-l-none"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
};

export default InputShowcase;