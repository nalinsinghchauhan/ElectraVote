import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { ElectionWithCandidates, CandidateWithVotes } from "@shared/schema";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, AlertCircle, ChevronLeft, Trophy, User, Vote } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

export default function ElectionResults() {
  const [, params] = useRoute("/member/elections/:id/results");
  const electionId = params?.id ? parseInt(params.id, 10) : null;

  const { data: election, isLoading, error } = useQuery<ElectionWithCandidates>({
    queryKey: [`/api/elections/${electionId}`],
    enabled: !!electionId,
  });

  // Find the winner (candidate with the most votes)
  const [winner, setWinner] = useState<CandidateWithVotes | null>(null);
  
  useEffect(() => {
    if (election?.candidates && election.candidates.length > 0) {
      const candidates = election.candidates as CandidateWithVotes[];
      const sortedCandidates = [...candidates].sort((a, b) => b.votes - a.votes);
      setWinner(sortedCandidates[0]);
    }
  }, [election]);

  if (isLoading) {
    return (
      <DashboardLayout title="Election Results">
        <div className="mb-4">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-24 w-full mb-6" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  if (error || !election) {
    return (
      <DashboardLayout title="Election Results">
        <div className="bg-red-50 p-4 rounded-md mb-6">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <h3 className="text-sm font-medium text-red-800">Error loading election</h3>
          </div>
          <div className="mt-2 text-sm text-red-700">
            {error?.message || "Election not found"}
          </div>
        </div>
        
        <Link href="/member/elections">
          <Button variant="outline" className="mb-6">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Elections
          </Button>
        </Link>
      </DashboardLayout>
    );
  }

  // Format dates
  const startDate = format(new Date(election.startDate), "MMMM d, yyyy");
  const endDate = format(new Date(election.endDate), "MMMM d, yyyy");
  
  // Get total votes
  const totalVotes = election.voteCount || 0;
  
  // Sort candidates by votes (highest first)
  const sortedCandidates = [...(election.candidates as CandidateWithVotes[])].sort(
    (a, b) => b.votes - a.votes
  );

  return (
    <DashboardLayout title="Election Results">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{election.title}</h1>
          <p className="text-gray-500">
            {election.status === "completed" 
              ? `Ended on ${endDate}` 
              : election.status === "ongoing" 
                ? `Ends on ${endDate}` 
                : `Starts on ${startDate}`}
          </p>
        </div>
        
        <Link href="/member/elections">
          <Button variant="outline">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Elections
          </Button>
        </Link>
      </div>
      
      {election.description && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-md font-medium text-gray-900 mb-2">Description</h2>
            <p className="text-gray-700">{election.description}</p>
          </CardContent>
        </Card>
      )}
      
      {/* Election Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-50 rounded-full mr-4">
                <User className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Voters</p>
                <p className="text-xl font-semibold">{totalVotes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-50 rounded-full mr-4">
                <Vote className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Candidates</p>
                <p className="text-xl font-semibold">{election.candidates.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-50 rounded-full mr-4">
                <Trophy className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Winner</p>
                <p className="text-xl font-semibold truncate max-w-32">
                  {election.status === "completed" && winner 
                    ? winner.name 
                    : election.status === "ongoing" 
                      ? "In progress" 
                      : "Not started"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {election.status === "completed" 
              ? "Final Results" 
              : election.status === "ongoing" 
                ? "Current Results" 
                : "Candidates"}
          </h2>
          
          {winner && election.status === "completed" && (
            <div className="bg-green-50 p-4 rounded-md mb-6">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <div>
                  <p className="font-medium text-green-800">
                    {winner.name} {winner.position ? `(${winner.position})` : ""} is the winner
                  </p>
                  <p className="text-sm text-green-600">
                    With {winner.votes} votes ({totalVotes > 0 
                      ? Math.round((winner.votes / totalVotes) * 100)
                      : 0}% of total votes)
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-6">
            {sortedCandidates.map((candidate, index) => {
              const percentage = totalVotes > 0 
                ? Math.round((candidate.votes / totalVotes) * 100) 
                : 0;
                
              return (
                <div key={candidate.id} className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 
                        ${index === 0 && election.status === "completed" ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{candidate.name}</p>
                        {candidate.position && (
                          <p className="text-sm text-gray-500">{candidate.position}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{candidate.votes} votes</p>
                      <p className="text-sm text-gray-500">{percentage}% of total</p>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              );
            })}
            
            {sortedCandidates.length === 0 && (
              <p className="text-center text-gray-500 py-8">No candidates in this election.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}