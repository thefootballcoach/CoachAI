import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { TrendingUp, Target, Calendar, User } from "lucide-react";

const developmentPlanSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  targetDate: z.string().optional(),
  
  // Areas of Strength
  strengthArea1: z.string().optional(),
  strengthHow1: z.string().optional(),
  strengthWhere1: z.string().optional(),
  strengthWhy1: z.string().optional(),
  
  strengthArea2: z.string().optional(),
  strengthHow2: z.string().optional(),
  strengthWhere2: z.string().optional(),
  strengthWhy2: z.string().optional(),
  
  strengthArea3: z.string().optional(),
  strengthHow3: z.string().optional(),
  strengthWhere3: z.string().optional(),
  strengthWhy3: z.string().optional(),
  
  // Areas of Development
  developmentArea1: z.string().optional(),
  developmentHow1: z.string().optional(),
  developmentWhere1: z.string().optional(),
  developmentWhy1: z.string().optional(),
  
  developmentArea2: z.string().optional(),
  developmentHow2: z.string().optional(),
  developmentWhere2: z.string().optional(),
  developmentWhy2: z.string().optional(),
  
  developmentArea3: z.string().optional(),
  developmentHow3: z.string().optional(),
  developmentWhere3: z.string().optional(),
  developmentWhy3: z.string().optional(),
  
  // 12-week focus
  focusArea: z.string().optional(),
  focusHow: z.string().optional(),
  focusWhere: z.string().optional(),
  focusWhy: z.string().optional(),
  
  // Personal Development
  currentQualification: z.string().optional(),
  desiredQualification: z.string().optional(),
  currentRole: z.string().optional(),
  desiredRole: z.string().optional(),
});

type DevelopmentPlanFormData = z.infer<typeof developmentPlanSchema>;

interface PlanFormProps {
  initialData?: Partial<DevelopmentPlanFormData>;
  onSubmit: (data: DevelopmentPlanFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function PlanForm({ initialData, onSubmit, onCancel, isLoading }: PlanFormProps) {
  const form = useForm<DevelopmentPlanFormData>({
    resolver: zodResolver(developmentPlanSchema),
    defaultValues: {
      title: "",
      description: "",
      targetDate: "",
      ...initialData,
    },
  });

  const renderHowWhereWhySection = (prefix: string, number: number, title: string, color: string) => (
    <div className={`border-l-4 border-${color}-500 pl-4 space-y-4`}>
      <FormField
        control={form.control}
        name={`${prefix}Area${number}` as keyof DevelopmentPlanFormData}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="font-semibold">{title} {number}</FormLabel>
            <FormControl>
              <Input placeholder={`Enter ${title.toLowerCase()} ${number}`} {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name={`${prefix}How${number}` as keyof DevelopmentPlanFormData}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-blue-600 font-medium">How</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="How will you demonstrate/develop this?"
                  className="min-h-[80px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name={`${prefix}Where${number}` as keyof DevelopmentPlanFormData}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-purple-600 font-medium">Where</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Where will this be applied/developed?"
                  className="min-h-[80px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name={`${prefix}Why${number}` as keyof DevelopmentPlanFormData}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-orange-600 font-medium">Why</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Why is this important for your development?"
                  className="min-h-[80px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Plan Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter development plan title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Brief description of this development plan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="targetDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Completion Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Areas of Strength */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
              Areas of Strength
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {[1, 2, 3].map((num) => 
              renderHowWhereWhySection("strength", num, "Strength Area", "green")
            )}
          </CardContent>
        </Card>

        {/* Areas of Development */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2 text-blue-600" />
              Areas of Development
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8">
            {[1, 2, 3].map((num) => 
              renderHowWhereWhySection("development", num, "Development Area", "blue")
            )}
          </CardContent>
        </Card>

        {/* 12-Week Focus */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-amber-600" />
              12-Week Focus Area
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-l-4 border-amber-500 pl-4 space-y-4">
              <FormField
                control={form.control}
                name="focusArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Focus Area</FormLabel>
                    <FormControl>
                      <Input placeholder="What will you focus on in the next 12 weeks?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="focusHow"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-600 font-medium">How</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="How will you develop this focus area?"
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="focusWhere"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-purple-600 font-medium">Where</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Where will you apply this focus?"
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="focusWhy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-orange-600 font-medium">Why</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Why is this focus area important?"
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Development */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2 text-indigo-600" />
              Personal Development
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 mb-4">Qualifications</h4>
                <FormField
                  control={form.control}
                  name="currentQualification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-green-600 font-medium">Current Highest Qualification</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., UEFA B License, FA Level 2" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="desiredQualification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-600 font-medium">Desired Qualification</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., UEFA A License, Pro License" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 mb-4">Roles</h4>
                <FormField
                  control={form.control}
                  name="currentRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-green-600 font-medium">Current Role</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Assistant Coach, Youth Coach" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="desiredRole"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-blue-600 font-medium">Desired Role</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Head Coach, Academy Director" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6">
          <Button type="submit" disabled={isLoading} className="flex-1 sm:flex-none">
            {isLoading ? "Saving..." : "Save Development Plan"}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1 sm:flex-none">
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}