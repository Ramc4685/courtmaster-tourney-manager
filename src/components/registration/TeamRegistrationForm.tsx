import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Plus, Trash2 } from "lucide-react";
import { TeamRegistration, teamRegistrationSchema } from "@/types/registration";

interface TeamRegistrationFormProps {
  tournamentId: string;
  onSubmit: (data: TeamRegistration) => void;
  registrationDeadline?: Date;
}

export function TeamRegistrationForm({
  tournamentId,
  onSubmit,
  registrationDeadline,
}: TeamRegistrationFormProps) {
  const [teamMembers, setTeamMembers] = useState([{ name: "", email: "" }]);
  const isRegistrationClosed = registrationDeadline ? new Date() > new Date(registrationDeadline) : false;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TeamRegistration>({
    resolver: zodResolver(teamRegistrationSchema),
    defaultValues: {
      teamName: "",
      captainName: "",
      captainEmail: "",
      captainPhone: "",
      members: [{ name: "", email: "" }],
    },
  });

  const addTeamMember = () => {
    setTeamMembers([...teamMembers, { name: "", email: "" }]);
  };

  const removeTeamMember = (index: number) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };

  const updateTeamMember = (index: number, field: keyof typeof teamMembers[0], value: string) => {
    const updatedMembers = [...teamMembers];
    updatedMembers[index] = { ...updatedMembers[index], [field]: value };
    setTeamMembers(updatedMembers);
  };

  const onSubmitForm = (data: TeamRegistration) => {
    if (isRegistrationClosed) return;
    
    const formData = {
      ...data,
      members: teamMembers.filter(member => member.name && member.email),
    };
    
    onSubmit(formData);
    
    // Store registration in local storage
    const registrations = JSON.parse(localStorage.getItem(`team-registrations-${tournamentId}`) || "[]");
    localStorage.setItem(
      `team-registrations-${tournamentId}`,
      JSON.stringify([...registrations, formData])
    );
  };

  if (isRegistrationClosed) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Registration is closed for this tournament.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Registration</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="teamName">Team Name</Label>
              <Input
                id="teamName"
                {...register("teamName")}
                placeholder="Enter team name"
              />
              {errors.teamName && (
                <p className="text-sm text-red-500">{errors.teamName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="captainName">Team Captain Name</Label>
              <Input
                id="captainName"
                {...register("captainName")}
                placeholder="Enter captain name"
              />
              {errors.captainName && (
                <p className="text-sm text-red-500">{errors.captainName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="captainEmail">Team Captain Email</Label>
              <Input
                id="captainEmail"
                type="email"
                {...register("captainEmail")}
                placeholder="Enter captain email"
              />
              {errors.captainEmail && (
                <p className="text-sm text-red-500">{errors.captainEmail.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="captainPhone">Team Captain Phone (Optional)</Label>
              <Input
                id="captainPhone"
                {...register("captainPhone")}
                placeholder="Enter captain phone"
              />
              {errors.captainPhone && (
                <p className="text-sm text-red-500">{errors.captainPhone.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Team Members</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTeamMember}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </div>

            {teamMembers.map((member, index) => (
              <div key={index} className="flex gap-4 items-start">
                <div className="flex-1">
                  <Label htmlFor={`member-${index}-name`}>Name</Label>
                  <Input
                    id={`member-${index}-name`}
                    value={member.name}
                    onChange={(e) => updateTeamMember(index, "name", e.target.value)}
                    placeholder="Enter member name"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor={`member-${index}-email`}>Email</Label>
                  <Input
                    id={`member-${index}-email`}
                    type="email"
                    value={member.email}
                    onChange={(e) => updateTeamMember(index, "email", e.target.value)}
                    placeholder="Enter member email"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-6"
                  onClick={() => removeTeamMember(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button type="submit" className="w-full">
            Register Team
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 