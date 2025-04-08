
import React from "react";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { UseFormReturn } from "react-hook-form";
import { TournamentFormValues } from "./types";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

interface RegistrationTabProps {
  form: UseFormReturn<TournamentFormValues>;
}

const RegistrationTab: React.FC<RegistrationTabProps> = ({ form }) => {
  // Get divisions for category-specific settings
  const divisions = form.watch("divisions");
  const registrationEnabled = form.watch("registrationEnabled");

  const allCategories = divisions.flatMap(division => 
    division.categories.map(category => ({
      divisionName: division.name,
      ...category
    }))
  );
  
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Advanced Registration Settings</h3>
        <FormDescription>
          Configure advanced registration settings for specific categories and player eligibility.
        </FormDescription>
        
        <Separator className="my-4" />

        {registrationEnabled ? (
          <>
            {allCategories.length > 0 ? (
              <div className="space-y-4">
                <h4 className="font-medium">Category-Specific Registration Rules</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Division</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Registration Requirements</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allCategories.map((category, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{category.divisionName}</TableCell>
                        <TableCell>{category.name}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              type="button"
                              onClick={() => {
                                // This would open a dialog to configure registration rules
                                // For now we'll just log
                                console.log("Configure rules for:", category.name);
                              }}
                            >
                              Configure
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="p-4 border rounded-md bg-muted/20">
                <p className="text-sm text-muted-foreground">
                  No categories defined yet. Add categories in the Divisions tab to configure category-specific registration rules.
                </p>
              </div>
            )}

            <h4 className="font-medium mt-6">Registration Document Requirements</h4>
            <FormField
              control={form.control}
              name="requirePlayerProfile"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Require Player Profile</FormLabel>
                    <FormDescription>
                      Players must complete their profile before registering
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </>
        ) : (
          <div className="p-4 border rounded-md bg-muted/20">
            <p className="text-sm text-muted-foreground">
              Registration is currently disabled. Enable registration in the Format tab to configure advanced settings.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistrationTab;
