
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';

const PricingPlans: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Free</CardTitle>
          <CardDescription>For individual players</CardDescription>
          <div className="mt-1 text-3xl font-bold">$0</div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-center">
              <Check className="mr-2 h-4 w-4 text-green-500" />
              <span>3 tournaments per month</span>
            </li>
            <li className="flex items-center">
              <Check className="mr-2 h-4 w-4 text-green-500" />
              <span>Up to 20 players per tournament</span>
            </li>
            <li className="flex items-center">
              <Check className="mr-2 h-4 w-4 text-green-500" />
              <span>Basic tournament formats</span>
            </li>
            <li className="flex items-center">
              <Check className="mr-2 h-4 w-4 text-green-500" />
              <span>7-day data retention</span>
            </li>
          </ul>
        </CardContent>
        <CardFooter>
          <Button className="w-full" variant="outline">
            Get Started
          </Button>
        </CardFooter>
      </Card>

      <Card className="border-primary shadow-md">
        <CardHeader className="bg-primary/5">
          <div className="text-sm font-medium text-primary mb-1">Most Popular</div>
          <CardTitle className="text-xl">Pro</CardTitle>
          <CardDescription>For clubs and organizations</CardDescription>
          <div className="mt-1 text-3xl font-bold">$29<span className="text-sm font-normal">/month</span></div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-center">
              <Check className="mr-2 h-4 w-4 text-green-500" />
              <span>Unlimited tournaments</span>
            </li>
            <li className="flex items-center">
              <Check className="mr-2 h-4 w-4 text-green-500" />
              <span>Up to 100 players per tournament</span>
            </li>
            <li className="flex items-center">
              <Check className="mr-2 h-4 w-4 text-green-500" />
              <span>All tournament formats</span>
            </li>
            <li className="flex items-center">
              <Check className="mr-2 h-4 w-4 text-green-500" />
              <span>30-day data retention</span>
            </li>
            <li className="flex items-center">
              <Check className="mr-2 h-4 w-4 text-green-500" />
              <span>Basic analytics</span>
            </li>
          </ul>
        </CardContent>
        <CardFooter>
          <Button className="w-full">
            Subscribe Now
          </Button>
        </CardFooter>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Enterprise</CardTitle>
          <CardDescription>For large organizations</CardDescription>
          <div className="mt-1 text-3xl font-bold">$99<span className="text-sm font-normal">/month</span></div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-center">
              <Check className="mr-2 h-4 w-4 text-green-500" />
              <span>Unlimited tournaments</span>
            </li>
            <li className="flex items-center">
              <Check className="mr-2 h-4 w-4 text-green-500" />
              <span>Unlimited players</span>
            </li>
            <li className="flex items-center">
              <Check className="mr-2 h-4 w-4 text-green-500" />
              <span>Custom tournament formats</span>
            </li>
            <li className="flex items-center">
              <Check className="mr-2 h-4 w-4 text-green-500" />
              <span>90-day data retention</span>
            </li>
            <li className="flex items-center">
              <Check className="mr-2 h-4 w-4 text-green-500" />
              <span>Advanced analytics</span>
            </li>
            <li className="flex items-center">
              <Check className="mr-2 h-4 w-4 text-green-500" />
              <span>Custom branding</span>
            </li>
          </ul>
        </CardContent>
        <CardFooter>
          <Button className="w-full" variant="outline">
            Contact Sales
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PricingPlans;
