
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { TournamentFormat } from '@/types/tournament';
import { TournamentFormatService } from '@/services/tournament/formats/TournamentFormatService';

interface TournamentFormatDocumentationProps {
  format: TournamentFormat;
}

const TournamentFormatDocumentation: React.FC<TournamentFormatDocumentationProps> = ({ format }) => {
  const formatDoc = TournamentFormatService.getFormatDocumentation(format);
  
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>{formatDoc.name} Format</CardTitle>
        <CardDescription>How this tournament format works</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Description</h4>
            <p className="text-sm text-muted-foreground">{formatDoc.description}</p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Frequently Asked Questions</h4>
            <Accordion type="single" collapsible className="w-full">
              {formatDoc.faq.map((faqItem, index) => {
                const [question, answer] = faqItem.split('\nA: ');
                const questionText = question.replace('Q: ', '');
                
                return (
                  <AccordionItem key={index} value={`faq-${index}`}>
                    <AccordionTrigger className="text-sm">
                      {questionText}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      {answer}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TournamentFormatDocumentation;
