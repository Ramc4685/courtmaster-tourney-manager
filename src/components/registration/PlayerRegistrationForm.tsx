import React from "react";
import { useForm } from "react-hook-form";
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
import { playerRegistrationSchema, PlayerRegistration } from "@/types/registration";
import { useToast } from "@/components/ui/use-toast";

interface PlayerRegistrationFormProps {
  tournamentId: string;
  divisionId: string;
  playerId: string;
  onSubmit: (data: PlayerRegistration) => Promise<void>;
  registrationDeadline?: string;
}

const PlayerRegistrationForm: React.FC<PlayerRegistrationFormProps> = ({
  tournamentId,
  divisionId,
  playerId,
  onSubmit,
  registrationDeadline,
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<PlayerRegistration>({
    resolver: zodResolver(playerRegistrationSchema),
    defaultValues: {
      player_id: playerId,
      division_id: divisionId,
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    },
  });

  const handleSubmit = async (data: PlayerRegistration) => {
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
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} type="email" disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone (optional)</FormLabel>
                <FormControl>
                  <Input {...field} type="tel" disabled={isSubmitting} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Registration
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default PlayerRegistrationForm; 