
import React from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

interface WaiverFormProps {
  onSubmit: (data: WaiverFormData) => Promise<void>;
}

interface WaiverFormData {
  acknowledgement: boolean;
  signature: string;
  date: string;
}

const WaiverForm: React.FC<WaiverFormProps> = ({ onSubmit }) => {
  const form = useForm<WaiverFormData>();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="prose max-w-none">
          <h2>Liability Waiver</h2>
          <p>By signing this waiver, you acknowledge and agree to the following:</p>
          {/* Add your waiver text here */}
        </div>

        <FormField
          control={form.control}
          name="acknowledgement"
          render={({ field }) => (
            <FormItem className="flex items-center space-x-2">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel>I have read and agree to the terms above</FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="signature"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Digital Signature</FormLabel>
              <FormControl>
                <Textarea placeholder="Type your full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Submit Waiver</Button>
      </form>
    </Form>
  );
};

export default WaiverForm;
