import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
import { AlertCircle, Loader2, Plus, Trash2 } from "lucide-react";
import { teamRegistrationSchema, TeamRegistration } from "@/types/registration";
import { useToast } from "@/components/ui/use-toast";

interface TeamRegistrationFormProps {
  tournamentId: string;
  divisionId: string;
  playerId: string;
  onSubmit: (data: TeamRegistration) => Promise<void>;
  registrationDeadline?: string;
}

const TeamRegistrationForm: React.FC<TeamRegistrationFormProps> = ({
  tournamentId,
  divisionId,
  playerId,
  onSubmit,
  registrationDeadline,
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<TeamRegistration>({
    resolver: zodResolver(teamRegistrationSchema),
    defaultValues: {
      player_id: playerId,
      division_id: divisionId,
      teamName: "",
      captainName: "",
      captainEmail: "",
      captainPhone: "",
      members: [{ name: "", email: "", player_id: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "members",
  });

  const handleSubmit = async (data: TeamRegistration) => {
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
        description: "Your team registration has been submitted successfully.",
      });
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit team registration");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit team registration. Please try again.",
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
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="space-y-4">
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
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Team Members</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ name: "", email: "", player_id: "" })}
                disabled={isSubmitting}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="space-y-4 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Member {index + 1}</h4>
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
                    name={`members.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
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
                </div>
              </div>
            ))}
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Team Registration
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default TeamRegistrationForm; 