import { useState, forwardRef, useImperativeHandle } from "react";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SaveIcon, Edit2Icon, CheckCircleIcon, MessageCircleIcon, Calendar } from "lucide-react";
import { Video } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

interface SelfReflectionProps {
  videoId?: number;
  defaultValues?: SelfReflectionData;
  isReadOnly?: boolean;
  onReflectionSaved?: (data: SelfReflectionData) => void;
}

export interface SelfReflectionData {
  sessionTitle: string;
  sessionDate: string;
  coachName: string;
  ageGroup: string;
  intendedOutcomes: string;
  sessionStrengths: string;
  areasForDevelopment: string;
  notes?: string;
  generateCalendarEvent: boolean;
}

const SelfReflection = forwardRef<{ submitForm: () => Promise<SelfReflectionData> }, SelfReflectionProps>(
  function SelfReflectionComponent({ videoId, defaultValues, isReadOnly = false, onReflectionSaved }, ref) {
    const [isEditing, setIsEditing] = useState(!isReadOnly && !defaultValues);
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<SelfReflectionData>({
      defaultValues: defaultValues || {
        sessionTitle: "",
        sessionDate: new Date().toISOString().split('T')[0], // Today's date
        coachName: "",
        ageGroup: "",
        intendedOutcomes: "",
        sessionStrengths: "",
        areasForDevelopment: "",
        notes: "",
        generateCalendarEvent: false
      }
    });

    const generateCalendarEvent = watch("generateCalendarEvent");

    const onSubmit = async (data: SelfReflectionData) => {
      if (!videoId) {
        // If there's no videoId, we're just collecting the data for a new upload
        if (onReflectionSaved) {
          onReflectionSaved(data);
        }
        return data;
      }

      try {
        setIsSaving(true);
        const response = await apiRequest("POST", `/api/audios/${videoId}/reflection`, data);
        
        if (response.ok) {
          toast({
            title: "Reflection Saved",
            description: "Your session reflection has been saved successfully.",
          });
          
          // Update queries that might contain this video's data
          queryClient.invalidateQueries({ queryKey: ["/api/audios"] });
          queryClient.invalidateQueries({ queryKey: ["/api/audios", videoId] });
          
          setIsEditing(false);
          
          // If this was just added for the first time, update our local state
          if (!defaultValues) {
            reset(data);
          }

          if (onReflectionSaved) {
            onReflectionSaved(data);
          }
        } else {
          throw new Error("Failed to save reflection");
        }
      } catch (error) {
        toast({
          title: "Error Saving Reflection",
          description: error instanceof Error ? error.message : "An unknown error occurred",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    };

    // Expose submitForm method to parent component
    useImperativeHandle(ref, () => ({
      submitForm: async () => {
        return new Promise<SelfReflectionData>((resolve, reject) => {
          handleSubmit(
            // Success callback
            async (data) => { 
              try {
                if (videoId) {
                  // If we have a videoId, save to backend
                  await onSubmit(data);
                }
                resolve(data);
              } catch (error) {
                reject(error);
              }
            },
            // Error callback
            (errors) => {
              console.error("Form validation errors:", errors);
              reject(new Error("Please complete all required fields"));
            }
          )();
        });
      }
    }));

    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Session Self-Reflection</CardTitle>
              <CardDescription>
                Record your personal thoughts about this coaching session
              </CardDescription>
            </div>
            {!isEditing && !isReadOnly && defaultValues && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsEditing(true)}
              >
                <Edit2Icon className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <form id="reflection-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4">
              {/* Session Title and Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionTitle">Session Title</Label>
                  <Input
                    id="sessionTitle"
                    placeholder="e.g., Shooting Practice, Tactical Session"
                    disabled={!isEditing}
                    {...register("sessionTitle", { required: "Session title is required" })}
                  />
                  {errors.sessionTitle && (
                    <p className="text-sm text-red-500">{errors.sessionTitle.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sessionDate">Session Date</Label>
                  <Input
                    id="sessionDate"
                    type="date"
                    disabled={!isEditing}
                    {...register("sessionDate", { required: "Session date is required" })}
                  />
                  {errors.sessionDate && (
                    <p className="text-sm text-red-500">{errors.sessionDate.message}</p>
                  )}
                </div>
              </div>

              {/* Calendar Integration */}
              <div className="flex items-center space-x-2 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <Checkbox
                  id="generateCalendarEvent"
                  checked={generateCalendarEvent}
                  onCheckedChange={(checked) => setValue("generateCalendarEvent", !!checked)}
                  disabled={!isEditing}
                  className="border-purple-400 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                />
                <div className="flex-1">
                  <Label htmlFor="generateCalendarEvent" className="flex items-center cursor-pointer text-slate-900 dark:text-slate-100 font-medium">
                    <Calendar className="h-4 w-4 mr-2 text-purple-600 dark:text-purple-400" />
                    Generate Calendar Event for Session Review
                  </Label>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                    This will create a calendar reminder to review this session's feedback and plan improvements
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="coachName">Coach's Name</Label>
                  <Input
                    id="coachName"
                    placeholder="Enter your name"
                    disabled={!isEditing}
                    {...register("coachName", { required: "Coach's name is required" })}
                  />
                  {errors.coachName && (
                    <p className="text-sm text-red-500">{errors.coachName.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ageGroup">Age Group Coached</Label>
                  <Input
                    id="ageGroup"
                    placeholder="e.g., U12, Adults, Seniors"
                    disabled={!isEditing}
                    {...register("ageGroup", { required: "Age group is required" })}
                  />
                  {errors.ageGroup && (
                    <p className="text-sm text-red-500">{errors.ageGroup.message}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="intendedOutcomes">Session Intended Outcomes</Label>
                <Textarea
                  id="intendedOutcomes"
                  placeholder="What were you trying to achieve in this session?"
                  className="min-h-[80px]"
                  disabled={!isEditing}
                  {...register("intendedOutcomes", { required: "Intended outcomes are required" })}
                />
                {errors.intendedOutcomes && (
                  <p className="text-sm text-red-500">{errors.intendedOutcomes.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sessionStrengths">Session Strengths</Label>
                <Textarea
                  id="sessionStrengths"
                  placeholder="What went well in this session?"
                  className="min-h-[80px]"
                  disabled={!isEditing}
                  {...register("sessionStrengths", { required: "Session strengths are required" })}
                />
                {errors.sessionStrengths && (
                  <p className="text-sm text-red-500">{errors.sessionStrengths.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="areasForDevelopment">Areas for Development</Label>
                <Textarea
                  id="areasForDevelopment"
                  placeholder="What could you improve for next time?"
                  className="min-h-[80px]"
                  disabled={!isEditing}
                  {...register("areasForDevelopment", { required: "Areas for development are required" })}
                />
                {errors.areasForDevelopment && (
                  <p className="text-sm text-red-500">{errors.areasForDevelopment.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes <span className="text-xs text-muted-foreground">(Optional)</span></Label>
                <Textarea
                  id="notes"
                  placeholder="Any other thoughts about this session?"
                  className="min-h-[80px]"
                  disabled={!isEditing}
                  {...register("notes")}
                />
              </div>
            </div>
          </form>
        </CardContent>
      
        <CardFooter className="flex justify-between border-t px-6 py-4">
          {defaultValues && isEditing && (
            <Button 
              variant="outline" 
              onClick={() => {
                reset(defaultValues);
                setIsEditing(false);
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
          )}
          <Button 
            type="submit" 
            form="reflection-form"
            className={defaultValues && isEditing ? "ml-auto" : ""}
            disabled={isSaving || isReadOnly}
          >
            {isSaving ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <SaveIcon className="h-4 w-4 mr-1" />
                Save Reflection
              </>
            )}
          </Button>
        </CardFooter>
    </Card>
  );
});

export default SelfReflection;