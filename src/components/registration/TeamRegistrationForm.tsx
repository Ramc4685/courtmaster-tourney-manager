import React from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { teamRegistrationSchema } from "@/types/registration";
import { BaseRegistrationForm } from "./BaseRegistrationForm";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useFieldArray } from "react-hook-form";

// Extend the team registration schema to include player_id and division_id
const extendedTeamRegistrationSchema = teamRegistrationSchema.extend({
  player_id: z.string(),
  division_id: z.string()
});

interface TeamRegistrationFormProps {
  tournamentId: string;
  divisionId: string;
  playerId: string;
  onSubmit: (data: z.infer<typeof extendedTeamRegistrationSchema>) => Promise<void>;
  registrationDeadline?: string;
}

const TeamRegistrationForm: React.FC<TeamRegistrationFormProps> = ({
  tournamentId,
  divisionId,
  playerId,
  onSubmit,
  registrationDeadline,
}) => {
  const defaultValues: z.infer<typeof extendedTeamRegistrationSchema> = {
    player_id: playerId,
    division_id: divisionId,
    teamName: "",
    captainName: "",
    captainEmail: "",
    captainPhone: "",
    members: [{
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      isTeamCaptain: false
    }],
  };

  return (
    <BaseRegistrationForm
      schema={extendedTeamRegistrationSchema}
      defaultValues={defaultValues}
      onSubmit={onSubmit}
      registrationDeadline={registrationDeadline}
      submitButtonText="Submit Team Registration"
    >
      {({ form, isSubmitting }) => {
        const { fields, append, remove } = useFieldArray({
          control: form.control,
          name: "members"
        });

        return (
          <>
            <FormField
              control={form.control}
              name="teamName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Name</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="captainName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Captain Name</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="captainEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Captain Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="captainPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Captain Phone (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} type="tel" disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <FormLabel>Team Members</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({
                    firstName: "",
                    lastName: "",
                    email: "",
                    phone: "",
                    isTeamCaptain: false
                  })}
                  disabled={isSubmitting}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="space-y-4 rounded-lg border p-4">
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      disabled={isSubmitting || fields.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`members.${index}.firstName`}
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
                      name={`members.${index}.lastName`}
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
                      name={`members.${index}.email`}
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
                      name={`members.${index}.phone`}
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
                  </div>
                </div>
              ))}
            </div>
          </>
        );
      }}
    </BaseRegistrationForm>
  );
};

export default TeamRegistrationForm; 