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
import { playerRegistrationSchema, PlayerRegistration } from "@/types/registration";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface PlayerRegistrationFormProps {
  tournamentId: string;
  onSubmit: (data: PlayerRegistration) => Promise<void>;
  registrationDeadline?: Date;
}

const PlayerRegistrationForm: React.FC<PlayerRegistrationFormProps> = ({
  tournamentId,
  onSubmit,
  registrationDeadline,
}) => {
  const { toast } = useToast();
  const form = useForm<PlayerRegistration>({
    resolver: zodResolver(playerRegistrationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    },
  });

  // Check if registration is closed
  const isRegistrationClosed = registrationDeadline ? new Date() > new Date(registrationDeadline) : false;

  const handleSubmit = async (data: PlayerRegistration) => {
    try {
      // Check if registration is closed before submitting
      if (isRegistrationClosed) {
        toast({
          title: "Registration Closed",
          description: "The registration deadline has passed.",
          variant: "destructive",
        });
        return;
      }

      await onSubmit(data);
      
      // Store registration data in local storage
      const storageKey = `tournament_${tournamentId}_player_registrations`;
      const existingRegistrations = JSON.parse(localStorage.getItem(storageKey) || "[]");
      localStorage.setItem(
        storageKey,
        JSON.stringify([...existingRegistrations, data])
      );

      toast({
        title: "Registration Successful",
        description: "Your registration has been submitted successfully.",
      });

      form.reset();
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "An error occurred during registration",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {isRegistrationClosed && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Registration is closed. The deadline has passed.
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your first name" {...field} />
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
                    <Input placeholder="Enter your last name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    {...field}
                  />
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
                <FormLabel>Phone Number (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="Enter your phone number"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isRegistrationClosed}>
            Submit Registration
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default PlayerRegistrationForm; 