
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, X } from 'lucide-react';

type PricingPlanProps = {
  title: string;
  price: string;
  description: string;
  features: Array<{
    included: boolean;
    text: string;
  }>;
  buttonText?: string;
  highlighted?: boolean;
  onSelect?: () => void;
};

const PricingPlan: React.FC<PricingPlanProps> = ({
  title,
  price,
  description,
  features,
  buttonText = "Select Plan",
  highlighted = false,
  onSelect
}) => {
  return (
    <Card className={`relative flex flex-col p-6 ${highlighted ? 'border-2 border-primary shadow-lg' : 'border bg-card'}`}>
      {highlighted && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-medium">
          MOST POPULAR
        </div>
      )}

      <div className="mb-5">
        <h3 className="text-2xl font-bold">{title}</h3>
        <div className="mt-2 text-3xl font-bold">{price}</div>
        <p className="mt-2 text-muted-foreground">{description}</p>
      </div>

      <ul className="mb-6 space-y-2 flex-grow">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center text-sm">
            {feature.included ? (
              <Check className="h-4 w-4 text-green-500 mr-2 shrink-0" />
            ) : (
              <X className="h-4 w-4 text-gray-300 mr-2 shrink-0" />
            )}
            <span className={feature.included ? '' : 'text-muted-foreground'}>{feature.text}</span>
          </li>
        ))}
      </ul>

      <Button 
        onClick={onSelect} 
        className="w-full" 
        variant={highlighted ? "default" : "outline"}
      >
        {buttonText}
      </Button>
    </Card>
  );
};

const PricingPlans: React.FC = () => {
  const handleSelectPlan = (plan: string) => {
    console.log(`Selected plan: ${plan}`);
    // Here you would integrate with your payment provider (e.g., Stripe)
  };

  return (
    <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold">Choose Your Plan</h2>
        <p className="mt-4 text-xl text-muted-foreground">
          Find the perfect plan for your badminton tournament needs
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <PricingPlan
          title="Free"
          price="$0"
          description="Get started with the basics"
          features={[
            { included: true, text: "1 Tournament" },
            { included: true, text: "Up to 25 Players" },
            { included: true, text: "Basic Scoring" },
            { included: false, text: "Advanced Analytics" },
            { included: false, text: "Custom Branding" },
            { included: false, text: "Priority Support" }
          ]}
          buttonText="Get Started"
          onSelect={() => handleSelectPlan('free')}
        />

        <PricingPlan
          title="Starter"
          price="$19/month"
          description="Perfect for growing clubs"
          features={[
            { included: true, text: "1 Tournament" },
            { included: true, text: "Up to 50 Players" },
            { included: true, text: "Advanced Scoring" },
            { included: true, text: "Basic Analytics" },
            { included: false, text: "Custom Branding" },
            { included: false, text: "Priority Support" }
          ]}
          highlighted={true}
          buttonText="Choose Starter"
          onSelect={() => handleSelectPlan('starter')}
        />

        <PricingPlan
          title="Pro"
          price="$49/month"
          description="For professional tournaments"
          features={[
            { included: true, text: "1 Tournament" },
            { included: true, text: "Up to 100 Players" },
            { included: true, text: "Advanced Scoring" },
            { included: true, text: "Advanced Analytics" },
            { included: true, text: "Custom Branding" },
            { included: true, text: "Priority Support" }
          ]}
          buttonText="Choose Pro"
          onSelect={() => handleSelectPlan('pro')}
        />
      </div>
    </div>
  );
};

export default PricingPlans;
