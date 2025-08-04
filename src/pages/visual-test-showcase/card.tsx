import React from 'react';
import { NextPage } from 'next';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Settings as _Settings, Heart, Share2, MoreHorizontal } from 'lucide-react';

/**
 * Card Visual Test Showcase
 * 
 * Comprehensive showcase of card components for visual testing
 */
const CardShowcase: NextPage = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Card Components</h1>
          <p className="text-muted-foreground">
            Visual testing showcase for card layouts and interactions
          </p>
        </div>

        {/* Basic Cards */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Basic Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card data-testid="card-basic">
              <CardHeader>
                <CardTitle>Simple Card</CardTitle>
                <CardDescription>
                  A simple card with header and content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>This is the card content area.</p>
              </CardContent>
            </Card>

            <Card data-testid="card-with-header">
              <CardHeader>
                <CardTitle>Card with Header</CardTitle>
                <CardDescription>
                  This card has a detailed header section
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Content goes here with proper spacing.</p>
              </CardContent>
            </Card>

            <Card data-testid="card-with-footer">
              <CardHeader>
                <CardTitle>Card with Footer</CardTitle>
              </CardHeader>
              <CardContent>
                <p>This card includes a footer with actions.</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm">
                  Action
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Complete Cards */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Complete Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card data-testid="card-complete">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Avatar>
                    <AvatarImage src="/api/placeholder/40/40" alt="Avatar" />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>John Doe</CardTitle>
                    <CardDescription>Software Engineer</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p>This is a complete card with header, content, and footer sections.</p>
                <div className="mt-4 flex space-x-2">
                  <Badge variant="secondary">React</Badge>
                  <Badge variant="secondary">TypeScript</Badge>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm">
                  <Heart className="mr-2 h-4 w-4" />
                  Like
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </CardFooter>
            </Card>

            <Card data-testid="card-product">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Product Card</CardTitle>
                    <CardDescription>$29.99</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-md mb-4"></div>
                <p>Product description goes here with all the important details.</p>
              </CardContent>
              <CardFooter>
                <Button className="w-full">
                  Add to Cart
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* Interactive Cards */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Interactive Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card 
              data-testid="card-interactive"
              className="cursor-pointer hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <CardTitle>Hover Card</CardTitle>
                <CardDescription>
                  This card responds to hover
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Hover over this card to see the effect.</p>
              </CardContent>
            </Card>

            <Card 
              data-testid="card-clickable"
              className="cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <CardHeader>
                <CardTitle>Clickable Card</CardTitle>
                <CardDescription>
                  This card can be clicked
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Click anywhere on this card.</p>
              </CardContent>
            </Card>

            <Card 
              data-testid="card-selected"
              className="ring-2 ring-primary"
            >
              <CardHeader>
                <CardTitle>Selected Card</CardTitle>
                <CardDescription>
                  This card is selected
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>This card shows a selected state.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Card Variants */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Card Variants</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card data-testid="card-elevated" className="shadow-lg">
              <CardHeader>
                <CardTitle>Elevated Card</CardTitle>
                <CardDescription>
                  This card has elevated shadow
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Elevated cards stand out from the page.</p>
              </CardContent>
            </Card>

            <Card data-testid="card-outlined" className="border-2 border-primary">
              <CardHeader>
                <CardTitle>Outlined Card</CardTitle>
                <CardDescription>
                  This card has a colored border
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Outlined cards can highlight important content.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Card States */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Card States</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card data-testid="card-loading">
              <CardHeader>
                <CardTitle>Loading Card</CardTitle>
                <CardDescription>
                  This card is loading
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded"></div>
                  <div className="h-4 bg-muted animate-pulse rounded w-3/4"></div>
                  <div className="h-4 bg-muted animate-pulse rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>

            <Card data-testid="card-error" className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Error Card</CardTitle>
                <CardDescription>
                  This card shows an error state
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-destructive">Something went wrong loading this content.</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm">
                  Try Again
                </Button>
              </CardFooter>
            </Card>

            <Card data-testid="card-success" className="border-green-500">
              <CardHeader>
                <CardTitle className="text-green-600">Success Card</CardTitle>
                <CardDescription>
                  This card shows a success state
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-green-600">Operation completed successfully!</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Card Sizes */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Card Sizes</h2>
          <div className="space-y-6">
            <Card data-testid="card-small" className="max-w-sm">
              <CardHeader>
                <CardTitle>Small Card</CardTitle>
              </CardHeader>
              <CardContent>
                <p>This is a small card with limited width.</p>
              </CardContent>
            </Card>

            <Card data-testid="card-medium" className="max-w-md">
              <CardHeader>
                <CardTitle>Medium Card</CardTitle>
                <CardDescription>
                  This card has a medium width
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Medium cards are good for most content types.</p>
              </CardContent>
            </Card>

            <Card data-testid="card-large" className="max-w-4xl">
              <CardHeader>
                <CardTitle>Large Card</CardTitle>
                <CardDescription>
                  This card takes up more horizontal space
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Large cards are perfect for detailed content that needs more space to breathe.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Card Grid Layout */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold">Card Grid Layout</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i} data-testid={`card-grid-${i}`}>
                <CardHeader>
                  <CardTitle>Card {i}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Content for card {i}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default CardShowcase;