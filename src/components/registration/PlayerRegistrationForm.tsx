import React from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { playerRegistrationSchema } from "@/types/registration";
import { BaseRegistrationForm } from "./BaseRegistrationForm";
import { z } from "zod";

interface PlayerRegistrationFormProps {
  tournamentId: string;
  divisionId: string;
  playerId: string;
  onSubmit: (data: z.infer<typeof playerRegistrationSchema>) => Promise<void>;
  registrationDeadline?: string;
}

const PlayerRegistrationForm: React.FC<PlayerRegistrationFormProps> = ({
  tournamentId,
  divisionId,
  playerId,
  onSubmit,
  registrationDeadline,
}) => {
  const defaultValues: z.infer<typeof playerRegistrationSchema> = {
    player_id: playerId,
    division_id: divisionId,
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  };

  return (
    <BaseRegistrationForm
      schema={playerRegistrationSchema}
      defaultValues={defaultValues}
      onSubmit={onSubmit}
      registrationDeadline={registrationDeadline}
    >
      {({ form, isSubmitting }) => (
        <>
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
        </>
      )}
    </BaseRegistrationForm>
  );
};

export default PlayerRegistrationForm;
