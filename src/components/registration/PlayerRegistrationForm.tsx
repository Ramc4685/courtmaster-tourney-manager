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

interface PlayerRegistrationFormProps {
  tournamentId: string;
  onSubmit: (data: PlayerRegistration) => Promise<void>;
}

const PlayerRegistrationForm: React.FC<PlayerRegistrationFormProps> = ({
  tournamentId,
  onSubmit,
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

  const handleSubmit = async (data: PlayerRegistration) => {
    try {
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

        <Button type="submit" className="w-full">
          Submit Registration
        </Button>
      </form>
    </Form>
  );
};

export default PlayerRegistrationForm; 