
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckIcon } from 'lucide-react';

const PricingPlans: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Free Plan */}
      <Card className="border-2 border-border">
        <CardHeader>
          <CardTitle className="text-xl">Free</CardTitle>
          <CardDescription>Get started with basic tournament management</CardDescription>
          <div className="mt-4">
            <span className="text-3xl font-bold">$0</span>
            <span className="text-muted-foreground">/month</span>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-center">
              <CheckIcon className="mr-2 h-4 w-4 text-primary" />
              <span>3 tournaments per year</span>
            </li>
            <li className="flex items-center">
              <CheckIcon className="mr-2 h-4 w-4 text-primary" />
              <span>Up to 20 players per tournament</span>
            </li>
            <li className="flex items-center">
              <CheckIcon className="mr-2 h-4 w-4 text-primary" />
              <span>Basic tournament formats</span>
            </li>
            <li className="flex items-center">
              <CheckIcon className="mr-2 h-4 w-4 text-primary" />
              <span>7-day data retention</span>
            </li>
            <li className="flex items-center">
              <CheckIcon className="mr-2 h-4 w-4 text-primary" />
              <span>Community support</span>
            </li>
          </ul>
        </CardContent>
        <CardFooter>
          <Button className="w-full">Get Started</Button>
        </CardFooter>
      </Card>

      {/* Premium Plan */}
      <Card className="border-2 border-primary">
        <CardHeader>
          <CardTitle className="text-xl">Premium</CardTitle>
          <CardDescription>Perfect for clubs and frequent organizers</CardDescription>
          <div className="mt-4">
            <span className="text-3xl font-bold">$29</span>
            <span className="text-muted-foreground">/month</span>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-center">
              <CheckIcon className="mr-2 h-4 w-4 text-primary" />
              <span>Unlimited tournaments</span>
            </li>
            <li className="flex items-center">
              <CheckIcon className="mr-2 h-4 w-4 text-primary" />
              <span>Up to 100 players per tournament</span>
            </li>
            <li className="flex items-center">
              <CheckIcon className="mr-2 h-4 w-4 text-primary" />
              <span>All tournament formats</span>
            </li>
            <li className="flex items-center">
              <CheckIcon className="mr-2 h-4 w-4 text-primary" />
              <span>30-day data retention</span>
            </li>
            <li className="flex items-center">
              <CheckIcon className="mr-2 h-4 w-4 text-primary" />
              <span>Priority email support</span>
            </li>
            <li className="flex items-center">
              <CheckIcon className="mr-2 h-4 w-4 text-primary" />
              <span>Advanced tournament analytics</span>
            </li>
            <li className="flex items-center">
              <CheckIcon className="mr-2 h-4 w-4 text-primary" />
              <span>Custom branding options</span>
            </li>
          </ul>
        </CardContent>
        <CardFooter>
          <Button className="w-full" variant="default">Subscribe Now</Button>
        </CardFooter>
      </Card>

      {/* Pro Plan */}
      <Card className="border-2 border-border">
        <CardHeader>
          <CardTitle className="text-xl">Professional</CardTitle>
          <CardDescription>For professional tournament organizers</CardDescription>
          <div className="mt-4">
            <span className="text-3xl font-bold">$79</span>
            <span className="text-muted-foreground">/month</span>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-center">
              <CheckIcon className="mr-2 h-4 w-4 text-primary" />
              <span>Unlimited tournaments</span>
            </li>
            <li className="flex items-center">
              <CheckIcon className="mr-2 h-4 w-4 text-primary" />
              <span>Unlimited players</span>
            </li>
            <li className="flex items-center">
              <CheckIcon className="mr-2 h-4 w-4 text-primary" />
              <span>All tournament formats</span>
            </li>
            <li className="flex items-center">
              <CheckIcon className="mr-2 h-4 w-4 text-primary" />
              <span>365-day data retention</span>
            </li>
            <li className="flex items-center">
              <CheckIcon className="mr-2 h-4 w-4 text-primary" />
              <span>Dedicated support</span>
            </li>
            <li className="flex items-center">
              <CheckIcon className="mr-2 h-4 w-4 text-primary" />
              <span>Premium analytics</span>
            </li>
            <li className="flex items-center">
              <CheckIcon className="mr-2 h-4 w-4 text-primary" />
              <span>White-label branding</span>
            </li>
            <li className="flex items-center">
              <CheckIcon className="mr-2 h-4 w-4 text-primary" />
              <span>API access</span>
            </li>
            <li className="flex items-center">
              <CheckIcon className="mr-2 h-4 w-4 text-primary" />
              <span>Multi-staff access</span>
            </li>
          </ul>
        </CardContent>
        <CardFooter>
          <Button className="w-full">Contact Sales</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PricingPlans;
