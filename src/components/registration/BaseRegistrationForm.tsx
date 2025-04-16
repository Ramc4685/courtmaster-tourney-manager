import React from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { z } from "zod";

interface FormFieldProps<T extends z.ZodType> {
  form: UseFormReturn<z.infer<T>>;
  isSubmitting: boolean;
}

interface BaseRegistrationFormProps<T extends z.ZodType> {
  schema: T;
  defaultValues: z.infer<T>;
  onSubmit: (data: z.infer<T>) => Promise<void>;
  registrationDeadline?: string;
  children: (props: FormFieldProps<T>) => React.ReactNode;
  submitButtonText?: string;
}

export function BaseRegistrationForm<T extends z.ZodType>({
  schema,
  defaultValues,
  onSubmit,
  registrationDeadline,
  children,
  submitButtonText = "Submit Registration"
}: BaseRegistrationFormProps<T>) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const handleSubmit = async (data: z.infer<T>) => {
    if (registrationDeadline && new Date(registrationDeadline) < new Date()) {
      setError("Registration deadline has passed");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(data);
      toast({
        title: "Success",
        description: "Your registration has been submitted successfully.",
      });
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit registration");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit registration. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {registrationDeadline && new Date(registrationDeadline) < new Date() && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Registration deadline has passed</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {children({ form, isSubmitting })}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitButtonText}
          </Button>
        </form>
      </Form>
    </div>
  );
} 