import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { teamRegistrationSchema, TeamRegistration } from "@/types/registration";
import { useToast } from "@/components/ui/use-toast";

interface TeamRegistrationFormProps {
  tournamentId: string;
  onSubmit: (data: TeamRegistration) => Promise<void>;
}

const TeamRegistrationForm: React.FC<TeamRegistrationFormProps> = ({
  tournamentId,
  onSubmit,
}) => {
  const { toast } = useToast();
  const form = useForm<TeamRegistration>({
    resolver: zodResolver(teamRegistrationSchema),
    defaultValues: {
      teamName: "",
      members: [
        {
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          isTeamCaptain: true,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "members",
  });

  const handleSubmit = async (data: TeamRegistration) => {
    try {
      await onSubmit(data);
      
      // Store registration data in local storage
      const storageKey = `tournament_${tournamentId}_team_registrations`;
      const existingRegistrations = JSON.parse(localStorage.getItem(storageKey) || "[]");
      localStorage.setItem(
        storageKey,
        JSON.stringify([...existingRegistrations, data])
      );

      toast({
        title: "Registration Successful",
        description: "Your team registration has been submitted successfully.",
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
        <FormField
          control={form.control}
          name="teamName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Team Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter team name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Team Members</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  firstName: "",
                  lastName: "",
                  email: "",
                  phone: "",
                  isTeamCaptain: false,
                })
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          </div>

          {fields.map((field, index) => (
            <Card key={field.id} className="p-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium">
                    Member {index + 1}
                  </h4>
                  {index > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`members.${index}.firstName`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter first name" {...field} />
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
                          <Input placeholder="Enter last name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name={`members.${index}.email`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter email address"
                          {...field}
                        />
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
                      <FormLabel>Phone Number (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="Enter phone number"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`members.${index}.isTeamCaptain`}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            // Uncheck other team captains
                            if (checked) {
                              form.setValue(
                                "members",
                                form
                                  .getValues("members")
                                  .map((member, i) => ({
                                    ...member,
                                    isTeamCaptain: i === index,
                                  }))
                              );
                            }
                            field.onChange(checked);
                          }}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Team Captain
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </Card>
          ))}
        </div>

        <Button type="submit" className="w-full">
          Submit Team Registration
        </Button>
      </form>
    </Form>
  );
};

export default TeamRegistrationForm; 