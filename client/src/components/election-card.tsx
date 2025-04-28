import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ElectionWithCandidates, CandidateWithVotes } from "@shared/schema";
import { Link } from "wouter";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle } from "lucide-react";

interface ElectionCardProps {
  election: ElectionWithCandidates;
  onStatusChange?: (id: number, status: string) => void;
}

export default function ElectionCard({ election, onStatusChange }: ElectionCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showResults, setShowResults] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(null);
  const [confirmVoteOpen, setConfirmVoteOpen] = useState(false);
  
  const isAdmin = user?.role === "admin";
  const isActive = election.status === "ongoing";
  const isCompleted = election.status === "completed";
  const isUpcoming = election.status === "upcoming";
  
  // Format dates
  const startDate = format(new Date(election.startDate), "MMM d, yyyy");
  const endDate = format(new Date(election.endDate), "MMM d, yyyy");
  
  // Get total votes to calculate percentages
  const totalVotes = election.voteCount || 0;
  
  // Mutations
  const voteMutation = useMutation({
    mutationFn: async (candidateId: number) => {
      await apiRequest("POST", `/api/elections/${election.id}/vote`, { candidateId });
    },
    onSuccess: () => {
      toast({
        title: "Vote recorded",
        description: "Your vote has been successfully recorded.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/elections'] });
      queryClient.invalidateQueries({ queryKey: [`/api/elections/${election.id}`] });
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
  
  const statusMutation = useMutation({
    mutationFn: async (status: string) => {
      await apiRequest("PUT", `/api/elections/${election.id}/status`, { status });
    },
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: "The election status has been updated.",
      });
      
      if (onStatusChange) {
        onStatusChange(election.id, statusMutation.variables as string);
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/elections'] });
      queryClient.invalidateQueries({ queryKey: [`/api/elections/${election.id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/elections/status/upcoming'] });
      queryClient.invalidateQueries({ queryKey: ['/api/elections/status/ongoing'] });
      queryClient.invalidateQueries({ queryKey: ['/api/elections/status/completed'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle vote button click
  const handleVoteClick = (candidateId: number) => {
    setSelectedCandidateId(candidateId);
    setConfirmVoteOpen(true);
  };
  
  // Handle vote confirmation
  const handleVoteConfirm = () => {
    if (selectedCandidateId) {
      voteMutation.mutate(selectedCandidateId);
    }
    setConfirmVoteOpen(false);
  };
  
  // Handle status change (admin only)
  const handleStatusChange = (status: string) => {
    statusMutation.mutate(status);
  };
  
  // Calculate the winner (for completed elections)
  const getWinner = (): CandidateWithVotes | null => {
    if (!election.candidates || election.candidates.length === 0) return null;
    
    let winner: CandidateWithVotes = election.candidates[0] as CandidateWithVotes;
    
    for (const candidate of election.candidates as CandidateWithVotes[]) {
      if (candidate.votes > winner.votes) {
        winner = candidate;
      }
    }
    
    return winner;
  };
  
  const winner = isCompleted ? getWinner() : null;
  
  return (
    <>
      <Card className="mb-6 hover-card dashboard-card">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl font-bold">{election.title}</CardTitle>
              <CardDescription className="text-muted-foreground mt-1">{election.description}</CardDescription>
            </div>
            <Badge 
              className={`
                ${isActive ? "status-badge status-badge-ongoing" : ""} 
                ${isCompleted ? "status-badge status-badge-completed" : ""} 
                ${isUpcoming ? "status-badge status-badge-upcoming" : ""}
              `}
            >
              {election.status ? election.status.charAt(0).toUpperCase() + election.status.slice(1) : "Unknown"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-5 text-sm">
            <div className="bg-primary/5 rounded-lg p-3">
              <p className="text-muted-foreground mb-1">Start Date</p>
              <p className="font-medium text-foreground">{startDate}</p>
            </div>
            <div className="bg-primary/5 rounded-lg p-3">
              <p className="text-muted-foreground mb-1">End Date</p>
              <p className="font-medium text-foreground">{endDate}</p>
            </div>
          </div>
          
          {(isCompleted || showResults || isAdmin || election.userVoted) && (
            <div className="border-t border-border/40 pt-5 mt-1">
              {isCompleted && winner && (
                <div className="bg-green-500/10 p-4 rounded-lg mb-5">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    <p className="text-sm font-medium text-green-500">
                      Winner: <span className="text-foreground">{winner.name}</span> {winner.position ? <span className="text-muted-foreground">({winner.position})</span> : ""}
                    </p>
                  </div>
                </div>
              )}
              
              <h3 className="text-md font-semibold mb-4">
                {isCompleted ? "Final Results" : "Current Standings"}
              </h3>
              
              <div className="space-y-5">
                {(election.candidates as CandidateWithVotes[]).map((candidate) => {
                  const percentage = totalVotes > 0 
                    ? Math.round((candidate.votes / totalVotes) * 100) 
                    : 0;
                    
                  return (
                    <div key={candidate.id} className="space-y-2 bg-muted/30 p-3 rounded-lg">
                      <div className="flex justify-between mb-1">
                        <div>
                          <span className="text-sm font-medium">
                            {candidate.name}
                          </span>
                          {candidate.position && (
                            <span className="text-xs text-muted-foreground ml-2">
                              ({candidate.position})
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-medium">
                          {candidate.votes} <span className="text-muted-foreground">votes</span>
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                      <p className="text-xs text-muted-foreground text-right">
                        {percentage}% of votes
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {isActive && !election.userVoted && !isAdmin && !showResults && (
            <div className="border-t border-border/40 pt-5 mt-1">
              <h3 className="text-md font-semibold mb-4">Available Candidates</h3>
              <div className="space-y-3">
                {election.candidates.map((candidate) => (
                  <div key={candidate.id} className="flex justify-between items-center p-3 hover:bg-muted/30 rounded-lg transition-colors bg-muted/10">
                    <div>
                      <p className="text-sm font-medium">{candidate.name}</p>
                      {candidate.position && (
                        <p className="text-xs text-muted-foreground mt-0.5">{candidate.position}</p>
                      )}
                    </div>
                    <Button 
                      size="sm"
                      className="bg-primary/90 hover:bg-primary"
                      onClick={() => handleVoteClick(candidate.id)}
                      disabled={voteMutation.isPending}
                    >
                      {voteMutation.isPending && selectedCandidateId === candidate.id ? (
                        <>
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Voting...
                        </>
                      ) : (
                        "Vote"
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {isActive && election.userVoted && !showResults && (
            <div className="mt-5 bg-green-500/10 p-4 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <p className="text-sm font-medium text-green-500">
                  You have successfully voted in this election. Thank you for participating!
                </p>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between pt-2 border-t border-border/40">
          <div>
            {!isAdmin && isActive && (
              <Button 
                variant="ghost"
                onClick={() => setShowResults(!showResults)}
                className="mr-2"
              >
                {showResults ? "Hide Results" : "View Results"}
              </Button>
            )}
            
            <Link href={isAdmin ? `/admin/elections/${election.id}/results` : `/member/elections/${election.id}/results`}>
              <Button variant="outline" className="hover:bg-primary/5">View Details</Button>
            </Link>
          </div>
          
          {isAdmin && (
            <div className="flex space-x-3">
              <Button variant="outline" className="hover:bg-primary/5 border-border/60">Edit</Button>
              
              {isUpcoming && (
                <Button 
                  className="bg-primary/90 hover:bg-primary/100"
                  onClick={() => handleStatusChange("ongoing")}
                  disabled={statusMutation.isPending}
                >
                  {statusMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Activating...
                    </>
                  ) : (
                    "Activate Election"
                  )}
                </Button>
              )}
              
              {isActive && (
                <Button 
                  variant="destructive"
                  className="hover:bg-destructive/90"
                  onClick={() => handleStatusChange("completed")}
                  disabled={statusMutation.isPending}
                >
                  {statusMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Ending...
                    </>
                  ) : (
                    "End Election"
                  )}
                </Button>
              )}
            </div>
          )}
        </CardFooter>
      </Card>
      
      {/* Vote confirmation alert dialog */}
      <AlertDialog open={confirmVoteOpen} onOpenChange={setConfirmVoteOpen}>
        <AlertDialogContent className="border-border/40 bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Confirm your vote</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              You are about to cast your vote in <span className="font-medium text-foreground">"{election.title}"</span>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border/40">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleVoteConfirm}
              className="bg-primary/90 hover:bg-primary"
            >
              Confirm Vote
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
