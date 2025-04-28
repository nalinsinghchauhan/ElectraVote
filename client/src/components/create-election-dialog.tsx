import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Loader2, PlusCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Schema for creating an election
const electionSchema = z.object({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters.",
  }),
  description: z.string().optional(),
  startDate: z.date({
    required_error: "Start date is required.",
  }),
  endDate: z.date({
    required_error: "End date is required.",
  }),
}).refine((data) => data.endDate > data.startDate, {
  message: "End date must be after start date.",
  path: ["endDate"],
});

// Schema for candidates
const candidateSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  position: z.string().optional(),
});

type CandidateType = z.infer<typeof candidateSchema>;

interface CreateElectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateElectionDialog({
  open,
  onOpenChange,
}: CreateElectionDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [candidates, setCandidates] = useState<CandidateType[]>([]);
  const [newCandidate, setNewCandidate] = useState({ name: "", position: "" });
  const [addingCandidate, setAddingCandidate] = useState(false);
  
  // Form for election details
  const form = useForm<z.infer<typeof electionSchema>>({
    resolver: zodResolver(electionSchema),
    defaultValues: {
      title: "",
      description: "",
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 1 week
    },
  });
  
  // Mutation for creating an election
  const createElectionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof electionSchema>) => {
      // Dates will be automatically transformed to ISO strings by the schema
      const response = await apiRequest("POST", "/api/elections", {
        ...data,
        organizationId: user?.organizationId,
      });
      return await response.json();
    },
    onSuccess: async (election) => {
      toast({
        title: "Election created",
        description: "Your election has been created successfully.",
      });
      
      // Add candidates if there are any
      if (candidates.length > 0) {
        try {
          for (const candidate of candidates) {
            await apiRequest("POST", `/api/elections/${election.id}/candidates`, candidate);
          }
          toast({
            title: "Candidates added",
            description: `Added ${candidates.length} candidate(s) to the election.`,
          });
        } catch (error) {
          toast({
            title: "Error adding candidates",
            description: error instanceof Error ? error.message : "Failed to add candidates",
            variant: "destructive",
          });
          // Still keep dialog open on candidate error
          return;
        }
      }
      
      // Reset form and state
      form.reset();
      setCandidates([]);
      onOpenChange(false);
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/elections'] });
      queryClient.invalidateQueries({ queryKey: ['/api/elections/status/upcoming'] });
      queryClient.invalidateQueries({ queryKey: ['/api/elections/status/ongoing'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  function onSubmit(values: z.infer<typeof electionSchema>) {
    createElectionMutation.mutate(values);
  }
  
  // Handle adding a candidate
  const handleAddCandidate = () => {
    const result = candidateSchema.safeParse(newCandidate);
    if (!result.success) {
      toast({
        title: "Invalid candidate",
        description: "Please provide at least a name for the candidate.",
        variant: "destructive",
      });
      return;
    }
    
    setCandidates([...candidates, newCandidate]);
    setNewCandidate({ name: "", position: "" });
    setAddingCandidate(false);
  };
  
  // Handle removing a candidate
  const handleRemoveCandidate = (index: number) => {
    setCandidates(candidates.filter((_, i) => i !== index));
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] border-border/40 bg-card">
        <DialogHeader>
          <DialogTitle>Create New Election</DialogTitle>
          <DialogDescription>
            Create a new election for your organization. Add details and candidates below.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Election title" {...field} />
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
                    <Textarea 
                      placeholder="Provide a description for this election" 
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date <= form.getValues("startDate")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium">Candidates</h3>
                {!addingCandidate && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAddingCandidate(true)}
                  >
                    <PlusCircle className="h-4 w-4 mr-1" />
                    Add Candidate
                  </Button>
                )}
              </div>
              
              {candidates.length > 0 ? (
                <ul className="space-y-2 mb-4">
                  {candidates.map((candidate, index) => (
                    <li 
                      key={index}
                      className="flex justify-between items-center p-2 bg-secondary/30 rounded-md"
                    >
                      <div>
                        <span className="font-medium">{candidate.name}</span>
                        {candidate.position && (
                          <span className="text-muted-foreground text-sm ml-2">
                            {candidate.position}
                          </span>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCandidate(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground mb-4">
                  No candidates added yet. Add candidates to allow voting.
                </p>
              )}
              
              {addingCandidate && (
                <div className="space-y-3 p-3 border border-border/60 rounded-md mb-4 bg-card/50">
                  <div className="space-y-2">
                    <Label htmlFor="candidate-name">Candidate Name</Label>
                    <Input
                      id="candidate-name"
                      value={newCandidate.name}
                      onChange={(e) => setNewCandidate({ ...newCandidate, name: e.target.value })}
                      placeholder="Enter candidate name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="candidate-position">Position (Optional)</Label>
                    <Input
                      id="candidate-position"
                      value={newCandidate.position}
                      onChange={(e) => setNewCandidate({ ...newCandidate, position: e.target.value })}
                      placeholder="E.g., President, Treasurer"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setAddingCandidate(false);
                        setNewCandidate({ name: "", position: "" });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleAddCandidate}
                      className="bg-primary/90 hover:bg-primary"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setCandidates([]);
                  onOpenChange(false);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createElectionMutation.isPending}
                className="bg-primary/90 hover:bg-primary"
              >
                {createElectionMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Election"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
