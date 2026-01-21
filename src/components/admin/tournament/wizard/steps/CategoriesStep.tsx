import React, { useState, useEffect } from 'react';
import { Control, useFieldArray, UseFormWatch, useFormContext } from "react-hook-form";
import { v4 as uuidv4 } from 'uuid';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  PlusCircle,
  Trash2,
  Users,
  Trophy,
  Shuffle,
  ChevronDown,
  ChevronRight,
  Grip,
  Copy,
  Settings,
  CheckCircle2,
  AlertCircle,
  GamepadIcon,
  UserIcon
} from "lucide-react";
import { Division, PlayType, TournamentFormat, GameType, CategoryType } from '@/types/tournament-enums';
import { TournamentFormValues, Category } from "../../types";
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';

interface CategoriesStepProps {
  control: Control<TournamentFormValues>;
  watch: UseFormWatch<TournamentFormValues>;
}

const CategoriesStep: React.FC<CategoriesStepProps> = ({
  control,
  watch
}) => {
  const { setValue, getValues } = useFormContext<TournamentFormValues>();
  const { isMobile } = useMobileOptimization();
  const [expandedDivisions, setExpandedDivisions] = useState<Set<string>>(new Set());
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [draggedCategory, setDraggedCategory] = useState<string | null>(null);
  const { toast } = useToast();

  const { fields: divisionFields, append: appendDivision, remove: removeDivision, move: moveDivision, replace: replaceDivisions } = useFieldArray({
    control,
    name: "divisionDetails"
  });

  const gameType = watch('gameType');
  const divisionDetails = watch('divisionDetails');

  // Drag and drop handlers
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Handle division reordering
    if (source.droppableId === 'divisions' && destination.droppableId === 'divisions') {
      moveDivision(source.index, destination.index);
      return;
    }

    // Handle category reordering within same division
    if (source.droppableId.startsWith('categories-') && destination.droppableId.startsWith('categories-')) {
      const sourceDivisionId = source.droppableId.replace('categories-', '');
      const destinationDivisionId = destination.droppableId.replace('categories-', '');

      const sourceDivisionIndex = divisionFields.findIndex(div => div.id === sourceDivisionId);
      const destinationDivisionIndex = divisionFields.findIndex(div => div.id === destinationDivisionId);

      if (sourceDivisionIndex === -1 || destinationDivisionIndex === -1) {
        return;
      }

      const currentDivisions = watch("divisionDetails");

      if (sourceDivisionId === destinationDivisionId) {
        // Same division reordering
        const sourceCategories = [...(currentDivisions[sourceDivisionIndex].categories || [])];
        const [movedCategory] = sourceCategories.splice(source.index, 1);
        sourceCategories.splice(destination.index, 0, movedCategory);

        setValue(`divisionDetails.${sourceDivisionIndex}.categories`, sourceCategories);
      } else {
        // Cross-division movement
        const sourceCategories = [...(currentDivisions[sourceDivisionIndex].categories || [])];
        const destinationCategories = [...(currentDivisions[destinationDivisionIndex].categories || [])];

        const [movedCategory] = sourceCategories.splice(source.index, 1);
        destinationCategories.splice(destination.index, 0, movedCategory);

        setValue(`divisionDetails.${sourceDivisionIndex}.categories`, sourceCategories);
        setValue(`divisionDetails.${destinationDivisionIndex}.categories`, destinationCategories);
      }
    }
  };

  // Common division/category templates based on game type
  const getTemplatesForGameType = (gameType: GameType) => {
    const commonTemplates = {
      [GameType.BADMINTON]: [
        {
          name: "Standard Badminton",
          divisions: [
            {
              name: "Open Division",
              type: Division.OPEN,
              categories: [
                { name: "Men's Singles", playType: PlayType.SINGLES, format: TournamentFormat.SINGLE_ELIMINATION },
                { name: "Women's Singles", playType: PlayType.SINGLES, format: TournamentFormat.SINGLE_ELIMINATION },
                { name: "Men's Doubles", playType: PlayType.DOUBLES, format: TournamentFormat.SINGLE_ELIMINATION },
                { name: "Women's Doubles", playType: PlayType.DOUBLES, format: TournamentFormat.SINGLE_ELIMINATION },
                { name: "Mixed Doubles", playType: PlayType.MIXED, format: TournamentFormat.SINGLE_ELIMINATION },
              ]
            }
          ]
        },
        {
          name: "Recreational Badminton",
          divisions: [
            {
              name: "Beginner",
              type: Division.OPEN,
              level: "Beginner",
              categories: [
                { name: "Mixed Doubles", playType: PlayType.MIXED, format: TournamentFormat.ROUND_ROBIN },
              ]
            },
            {
              name: "Intermediate",
              type: Division.OPEN,
              level: "Intermediate",
              categories: [
                { name: "Men's Doubles", playType: PlayType.DOUBLES, format: TournamentFormat.SINGLE_ELIMINATION },
                { name: "Women's Doubles", playType: PlayType.DOUBLES, format: TournamentFormat.SINGLE_ELIMINATION },
                { name: "Mixed Doubles", playType: PlayType.MIXED, format: TournamentFormat.SINGLE_ELIMINATION },
              ]
            }
          ]
        }
      ],
      [GameType.TENNIS]: [
        {
          name: "Standard Tennis",
          divisions: [
            {
              name: "Open Division",
              type: Division.OPEN,
              categories: [
                { name: "Men's Singles", playType: PlayType.SINGLES, format: TournamentFormat.SINGLE_ELIMINATION },
                { name: "Women's Singles", playType: PlayType.SINGLES, format: TournamentFormat.SINGLE_ELIMINATION },
                { name: "Men's Doubles", playType: PlayType.DOUBLES, format: TournamentFormat.SINGLE_ELIMINATION },
                { name: "Women's Doubles", playType: PlayType.DOUBLES, format: TournamentFormat.SINGLE_ELIMINATION },
              ]
            }
          ]
        }
      ],
      [GameType.TABLE_TENNIS]: [
        {
          name: "Standard Table Tennis",
          divisions: [
            {
              name: "Open Division",
              type: Division.OPEN,
              categories: [
                { name: "Men's Singles", playType: PlayType.SINGLES, format: TournamentFormat.SINGLE_ELIMINATION },
                { name: "Women's Singles", playType: PlayType.SINGLES, format: TournamentFormat.SINGLE_ELIMINATION },
                { name: "Men's Doubles", playType: PlayType.DOUBLES, format: TournamentFormat.SINGLE_ELIMINATION },
                { name: "Women's Doubles", playType: PlayType.DOUBLES, format: TournamentFormat.SINGLE_ELIMINATION },
              ]
            }
          ]
        }
      ]
    };

    return commonTemplates[gameType] || [];
  };

  const handleApplyTemplate = (templateName: string) => {
    const templates = getTemplatesForGameType(gameType);
    const template = templates.find(t => t.name === templateName);

    if (template) {
      const newDivisions = template.divisions.map(div => ({
        id: uuidv4(),
        name: div.name,
        type: div.type,
        level: div.level || '',
        categories: div.categories.map(cat => ({
          id: uuidv4(),
          name: cat.name,
          type: CategoryType.STANDARD,
          playType: cat.playType,
          format: cat.format,
          maxTeams: undefined,
          seeded: true,
        }))
      }));

      replaceDivisions(newDivisions);
      setExpandedDivisions(new Set(newDivisions.map(d => d.id)));

      toast({
        title: "Template Applied",
        description: `${templateName} template has been applied successfully.`,
      });
    }
  };

  const handleAddDivision = () => {
    const newDivision = {
      id: uuidv4(),
      name: `Division ${divisionFields.length + 1}`,
      type: Division.OPEN,
      level: '',
      categories: []
    };

    appendDivision(newDivision);
    setExpandedDivisions(prev => new Set([...prev, newDivision.id]));
  };

  const handleAddCategory = (divisionIndex: number) => {
    const currentDivisions = watch("divisionDetails");
    const targetDivision = currentDivisions[divisionIndex];
    const newCategory: Category = {
      id: uuidv4(),
      name: `Category ${(targetDivision.categories?.length || 0) + 1}`,
      type: CategoryType.STANDARD,
      playType: PlayType.SINGLES,
      format: TournamentFormat.SINGLE_ELIMINATION,
      maxTeams: undefined,
      seeded: true,
    };

    setValue(`divisionDetails.${divisionIndex}.categories`, [
      ...(targetDivision.categories || []),
      newCategory
    ]);
  };

  const handleRemoveCategory = (divisionIndex: number, categoryIndex: number) => {
    const currentDivisions = watch("divisionDetails");
    const targetDivision = currentDivisions[divisionIndex];
    const updatedCategories = (targetDivision.categories || []).filter((_, idx) => idx !== categoryIndex);
    setValue(`divisionDetails.${divisionIndex}.categories`, updatedCategories);
  };

  const handleDuplicateDivision = (divisionIndex: number) => {
    const divisionToDuplicate = divisionFields[divisionIndex];
    const duplicatedDivision = {
      ...divisionToDuplicate,
      id: uuidv4(),
      name: `${divisionToDuplicate.name} (Copy)`,
      categories: divisionToDuplicate.categories?.map(cat => ({
        ...cat,
        id: uuidv4(),
      })) || []
    };

    appendDivision(duplicatedDivision);
    setExpandedDivisions(prev => new Set([...prev, duplicatedDivision.id]));
  };

  const toggleDivisionExpansion = (divisionId: string) => {
    setExpandedDivisions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(divisionId)) {
        newSet.delete(divisionId);
      } else {
        newSet.add(divisionId);
      }
      return newSet;
    });
  };

  const getDivisionValidationIcon = (division: any) => {
    const hasName = division.name && division.name.trim().length > 0;
    const hasCategories = division.categories && division.categories.length > 0;

    if (hasName && hasCategories) {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    } else {
      return <AlertCircle className="h-4 w-4 text-amber-500" />;
    }
  };

  const templates = getTemplatesForGameType(gameType);

  return (
    <div className={cn("space-y-6", isMobile && "space-y-4")}>
      {/* Header */}
      <div className="flex items-center space-x-2 mb-6">
        <Trophy className="h-6 w-6 text-primary" />
        <div>
          <h3 className="text-lg font-semibold">Tournament Structure</h3>
          <p className="text-sm text-muted-foreground">Set up divisions and categories for your tournament</p>
        </div>
      </div>

      {/* Quick Setup Templates */}
      {templates.length > 0 && (
        <Card className="border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Quick Setup Templates</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Choose a template to quickly set up common {gameType.toLowerCase().replace('_', ' ')} tournament structures:
              </p>
              <div className={cn(
                "grid gap-2",
                isMobile ? "grid-cols-1" : "grid-cols-2 md:grid-cols-3"
              )}>
                {templates.map((template) => (
                  <Button
                    key={template.name}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleApplyTemplate(template.name)}
                    className="justify-start h-auto p-3"
                  >
                    <div className="text-left">
                      <div className="font-medium">{template.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {template.divisions.length} division{template.divisions.length !== 1 ? 's' : ''},
                        {' '}{template.divisions.reduce((sum, div) => sum + div.categories.length, 0)} categories
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Division Management */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <h4 className="text-lg font-semibold">Divisions & Categories</h4>
          {divisionFields.length > 0 && (
            <Badge variant="secondary">
              {divisionFields.length} division{divisionFields.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <Button type="button" onClick={handleAddDivision} variant="outline" size="sm">
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Division
        </Button>
      </div>

      {divisionFields.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No divisions yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create divisions to organize your tournament participants.<br />
                You can use templates above or create custom divisions.
              </p>
              <Button type="button" onClick={handleAddDivision} variant="outline">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create First Division
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="divisions">
            {(provided) => (
              <div
                className="space-y-4"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {divisionFields.map((divisionField, divisionIndex) => {
                  const isExpanded = expandedDivisions.has(divisionField.id);
                  const division = watch(`divisionDetails.${divisionIndex}`);

                  return (
                    <Draggable
                      key={divisionField.id}
                      draggableId={divisionField.id}
                      index={divisionIndex}
                    >
                      {(provided, snapshot) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={cn(
                            "transition-all",
                            isExpanded && "ring-2 ring-primary/20",
                            snapshot.isDragging && "shadow-lg ring-2 ring-primary/40"
                          )}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3 flex-1 min-w-0">
                                <div
                                  {...provided.dragHandleProps}
                                  className="cursor-grab active:cursor-grabbing"
                                >
                                  <Grip className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                                </div>

                                <Collapsible open={isExpanded} onOpenChange={() => toggleDivisionExpansion(divisionField.id)}>
                                  <CollapsibleTrigger asChild>
                                    <Button
                                      type="button"
                                      data-testid="division-toggle-btn"
                                      variant="ghost"
                                      size="sm"
                                      className="p-1"
                                    >
                                      {isExpanded ?
                                        <ChevronDown className="h-4 w-4" /> :
                                        <ChevronRight className="h-4 w-4" />
                                      }
                                    </Button>
                                  </CollapsibleTrigger>
                                </Collapsible>

                                {getDivisionValidationIcon(division)}

                                <div className="flex-1 min-w-0">
                                  <FormField
                                    control={control}
                                    name={`divisionDetails.${divisionIndex}.name`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <Input
                                            {...field}
                                            placeholder="Enter division name"
                                            className="font-semibold border-none p-0 h-auto bg-transparent focus-visible:ring-0"
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />
                                  <div className="flex items-center space-x-2 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                      {division.categories?.length || 0} categor{division.categories?.length !== 1 ? 'ies' : 'y'}
                                    </Badge>
                                    {division.level && (
                                      <Badge variant="secondary" className="text-xs">
                                        {division.level}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-1">
                                <Button
                                  type="button"
                                  onClick={() => handleDuplicateDivision(divisionIndex)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  title="Duplicate division"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  onClick={() => removeDivision(divisionIndex)}
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  title="Remove division"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>

                          <Collapsible open={isExpanded} onOpenChange={() => toggleDivisionExpansion(divisionField.id)}>
                            <CollapsibleContent>
                              <CardContent className="pt-0 space-y-6">
                                {/* Division Settings */}
                                <div className={cn(
                                  "grid gap-4",
                                  isMobile ? "grid-cols-1" : "grid-cols-2"
                                )}>
                                  <FormField
                                    control={control}
                                    name={`divisionDetails.${divisionIndex}.type`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Division Type</FormLabel>
                                        <Select
                                          onValueChange={field.onChange}
                                          defaultValue={field.value}
                                        >
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select division type" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            <SelectItem value={Division.OPEN}>
                                              <div className="flex items-center space-x-2">
                                                <UserIcon className="h-4 w-4" />
                                                <span>Open</span>
                                              </div>
                                            </SelectItem>
                                            <SelectItem value={Division.MENS}>Men's</SelectItem>
                                            <SelectItem value={Division.WOMENS}>Women's</SelectItem>
                                            <SelectItem value={Division.MIXED}>Mixed</SelectItem>
                                            <SelectItem value={Division.JUNIORS}>Juniors</SelectItem>
                                            <SelectItem value={Division.SENIORS}>Seniors</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  <FormField
                                    control={control}
                                    name={`divisionDetails.${divisionIndex}.level`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Skill Level <Badge variant="secondary" className="text-xs ml-1">Optional</Badge></FormLabel>
                                        <FormControl>
                                          <Input {...field} placeholder="e.g., Beginner, A, B, 4.0+" />
                                        </FormControl>
                                        <FormDescription>
                                          Specify skill level or rating for this division
                                        </FormDescription>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>

                                {/* Categories */}
                                <div>
                                  <div className="flex justify-between items-center mb-4">
                                    <h5 className="text-sm font-medium flex items-center space-x-2">
                                      <GamepadIcon className="h-4 w-4" />
                                      <span>Categories</span>
                                    </h5>
                                    <Button
                                      onClick={() => handleAddCategory(divisionIndex)}
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                    >
                                      <PlusCircle className="h-4 w-4 mr-2" />
                                      Add Category
                                    </Button>
                                  </div>

                                  {(watch(`divisionDetails.${divisionIndex}.categories`) || []).length === 0 ? (
                                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                                      <GamepadIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                      <p className="text-sm text-muted-foreground mb-3">
                                        No categories in this division yet
                                      </p>
                                      <Button
                                        onClick={() => handleAddCategory(divisionIndex)}
                                        variant="outline"
                                        size="sm"
                                      >
                                        Add First Category
                                      </Button>
                                    </div>
                                  ) : (
                                    <Droppable droppableId={`categories-${divisionField.id}`}>
                                      {(provided) => (
                                        <div
                                          className="space-y-3"
                                          {...provided.droppableProps}
                                          ref={provided.innerRef}
                                        >
                                          {watch(`divisionDetails.${divisionIndex}.categories`)?.map(
                                            (category, categoryIndex) => (
                                              <Draggable
                                                key={category.id}
                                                draggableId={category.id}
                                                index={categoryIndex}
                                              >
                                                {(provided, snapshot) => (
                                                  <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className={cn(
                                                      "border rounded-lg p-4 group hover:bg-muted/50 transition-colors",
                                                      snapshot.isDragging && "shadow-lg ring-2 ring-primary/40 bg-background"
                                                    )}
                                                  >
                                                    <div className="flex items-start justify-between mb-3">
                                                      <div className="flex items-center space-x-2">
                                                        <div
                                                          {...provided.dragHandleProps}
                                                          className="cursor-grab active:cursor-grabbing"
                                                        >
                                                          <Grip className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                                                        </div>
                                                        <FormField
                                                          control={control}
                                                          name={`divisionDetails.${divisionIndex}.categories.${categoryIndex}.name`}
                                                          render={({ field }) => (
                                                            <FormItem className="flex-1">
                                                              <FormControl>
                                                                <Input
                                                                  {...field}
                                                                  placeholder="Category name"
                                                                  className="font-medium border-none p-0 h-auto bg-transparent focus-visible:ring-0"
                                                                />
                                                              </FormControl>
                                                            </FormItem>
                                                          )}
                                                        />
                                                      </div>
                                                      <Button
                                                        onClick={() => handleRemoveCategory(divisionIndex, categoryIndex)}
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                      >
                                                        <Trash2 className="h-4 w-4" />
                                                      </Button>
                                                    </div>

                                                    <div className={cn(
                                                      "grid gap-3",
                                                      isMobile ? "grid-cols-1" : "grid-cols-2 md:grid-cols-3"
                                                    )}>
                                                      <FormField
                                                        control={control}
                                                        name={`divisionDetails.${divisionIndex}.categories.${categoryIndex}.playType`}
                                                        render={({ field }) => (
                                                          <FormItem>
                                                            <FormLabel className="text-xs">Play Type</FormLabel>
                                                            <Select
                                                              onValueChange={field.onChange}
                                                              defaultValue={field.value}
                                                            >
                                                              <FormControl>
                                                                <SelectTrigger className="h-8">
                                                                  <SelectValue placeholder="Select" />
                                                                </SelectTrigger>
                                                              </FormControl>
                                                              <SelectContent>
                                                                <SelectItem value={PlayType.SINGLES}>Singles</SelectItem>
                                                                <SelectItem value={PlayType.DOUBLES}>Doubles</SelectItem>
                                                                <SelectItem value={PlayType.MIXED}>Mixed Doubles</SelectItem>
                                                              </SelectContent>
                                                            </Select>
                                                          </FormItem>
                                                        )}
                                                      />

                                                      <FormField
                                                        control={control}
                                                        name={`divisionDetails.${divisionIndex}.categories.${categoryIndex}.format`}
                                                        render={({ field }) => (
                                                          <FormItem>
                                                            <FormLabel className="text-xs">Format</FormLabel>
                                                            <Select
                                                              onValueChange={field.onChange}
                                                              defaultValue={field.value}
                                                            >
                                                              <FormControl>
                                                                <SelectTrigger className="h-8">
                                                                  <SelectValue placeholder="Select" />
                                                                </SelectTrigger>
                                                              </FormControl>
                                                              <SelectContent>
                                                                <SelectItem value={TournamentFormat.SINGLE_ELIMINATION}>
                                                                  Single Elimination
                                                                </SelectItem>
                                                                <SelectItem value={TournamentFormat.DOUBLE_ELIMINATION}>
                                                                  Double Elimination
                                                                </SelectItem>
                                                                <SelectItem value={TournamentFormat.ROUND_ROBIN}>
                                                                  Round Robin
                                                                </SelectItem>
                                                                <SelectItem value={TournamentFormat.GROUP_KNOCKOUT}>
                                                                  Group + Knockout
                                                                </SelectItem>
                                                              </SelectContent>
                                                            </Select>
                                                          </FormItem>
                                                        )}
                                                      />

                                                      <FormField
                                                        control={control}
                                                        name={`divisionDetails.${divisionIndex}.categories.${categoryIndex}.maxTeams`}
                                                        render={({ field }) => (
                                                          <FormItem>
                                                            <FormLabel className="text-xs">Max Teams</FormLabel>
                                                            <FormControl>
                                                              <Input
                                                                {...field}
                                                                type="number"
                                                                min="4"
                                                                max="128"
                                                                placeholder="e.g., 16"
                                                                className="h-8"
                                                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                                                value={field.value || ''}
                                                              />
                                                            </FormControl>
                                                          </FormItem>
                                                        )}
                                                      />
                                                    </div>
                                                  </div>
                                                )}
                                              </Draggable>
                                            )
                                          )}
                                          {provided.placeholder}
                                        </div>
                                      )}
                                    </Droppable>
                                  )}
                                </div>
                              </CardContent>
                            </CollapsibleContent>
                          </Collapsible>
                        </Card>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* Summary */}
      {divisionFields.length > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Tournament Structure Summary</h4>
              <Badge variant="default">
                {divisionFields.reduce((sum, div) => sum + (div.categories?.length || 0), 0)} total categories
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground mb-2">Divisions:</p>
                <ul className="space-y-1">
                  {divisionDetails.map((div, idx) => (
                    <li key={div.id} className="flex items-center space-x-2">
                      {getDivisionValidationIcon(div)}
                      <span>{div.name || `Division ${idx + 1}`}</span>
                      <Badge variant="outline" className="text-xs">
                        {div.categories?.length || 0} categories
                      </Badge>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-muted-foreground mb-2">Quick Stats:</p>
                <ul className="space-y-1 text-xs">
                  <li>• {divisionFields.length} division{divisionFields.length !== 1 ? 's' : ''} created</li>
                  <li>• {divisionFields.reduce((sum, div) => sum + (div.categories?.length || 0), 0)} categories total</li>
                  <li>• Ready for team registration</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mobile tips */}
      {isMobile && divisionFields.length > 0 && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Mobile Tips:</p>
              <ul className="text-xs space-y-1 list-disc list-inside">
                <li>Tap division headers to expand/collapse</li>
                <li>Use templates for quick setup</li>
                <li>Each division needs at least one category</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      <div className="h-24" /> {/* Spacer to prevent footer overlap */}
    </div>
  );
};

export default CategoriesStep;