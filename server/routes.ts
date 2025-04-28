import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertElectionSchema, insertCandidateSchema, insertVoteSchema,
  Election, Candidate, Vote
} from "@shared/schema";

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

// Middleware to check if user is an admin
const isAdmin = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ message: "Forbidden - Admin access required" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Get organization details
  app.get("/api/organization", isAuthenticated, async (req, res) => {
    const organizationId = req.user.organizationId;
    
    if (!organizationId) {
      return res.status(404).json({ message: "Organization not found" });
    }
    
    const organization = await storage.getOrganization(organizationId);
    
    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }
    
    // Get member counts
    const activeMembers = await storage.getMembersByOrganization(organizationId, 'active');
    const pendingMembers = await storage.getMembersByOrganization(organizationId, 'pending');
    
    console.log("DEBUG - Organization ID:", organizationId);
    console.log("DEBUG - Pending members:", pendingMembers);
    console.log("DEBUG - Active members:", activeMembers);
    
    // Get election counts
    const elections = await storage.getElectionsByOrganization(organizationId);
    const ongoingElections = elections.filter(e => e.status === 'ongoing');
    const upcomingElections = elections.filter(e => e.status === 'upcoming');
    const completedElections = elections.filter(e => e.status === 'completed');
    
    res.json({
      ...organization,
      counts: {
        activeMembers: activeMembers.length,
        pendingMembers: pendingMembers.length,
        totalMembers: activeMembers.length + pendingMembers.length,
        ongoingElections: ongoingElections.length,
        upcomingElections: upcomingElections.length,
        completedElections: completedElections.length,
        totalElections: elections.length
      }
    });
  });

  // Elections routes
  
  // Get all elections for the organization
  app.get("/api/elections", isAuthenticated, async (req, res) => {
    const organizationId = req.user.organizationId;
    const elections = await storage.getElectionsByOrganization(organizationId);
    
    // Enhance elections with candidate info and user vote status
    const enhancedElections = await Promise.all(elections.map(async (election) => {
      const candidates = await storage.getCandidatesWithVotes(election.id);
      const userVoted = req.user ? 
        !!(await storage.getVoteByUserAndElection(req.user.id, election.id)) : 
        false;
      
      let totalVotes = 0;
      candidates.forEach(candidate => {
        totalVotes += candidate.votes;
      });
      
      return {
        ...election,
        candidates,
        userVoted,
        voteCount: totalVotes
      };
    }));
    
    res.json(enhancedElections);
  });
  
  // Get elections by status
  app.get("/api/elections/status/:status", isAuthenticated, async (req, res) => {
    const organizationId = req.user.organizationId;
    const status = req.params.status as 'upcoming' | 'ongoing' | 'completed';
    
    if (!['upcoming', 'ongoing', 'completed'].includes(status)) {
      return res.status(400).json({ message: "Invalid status parameter" });
    }
    
    const elections = await storage.getElectionsByStatus(organizationId, status);
    
    // Enhance elections with candidate info and user vote status
    const enhancedElections = await Promise.all(elections.map(async (election) => {
      const candidates = await storage.getCandidatesWithVotes(election.id);
      const userVoted = req.user ? 
        !!(await storage.getVoteByUserAndElection(req.user.id, election.id)) : 
        false;
      
      let totalVotes = 0;
      candidates.forEach(candidate => {
        totalVotes += candidate.votes;
      });
      
      return {
        ...election,
        candidates,
        userVoted,
        voteCount: totalVotes
      };
    }));
    
    res.json(enhancedElections);
  });
  
  // Get specific election with candidates
  app.get("/api/elections/:id", isAuthenticated, async (req, res) => {
    const electionId = parseInt(req.params.id, 10);
    const election = await storage.getElection(electionId);
    
    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }
    
    if (election.organizationId !== req.user.organizationId) {
      return res.status(403).json({ message: "You don't have access to this election" });
    }
    
    const candidates = await storage.getCandidatesWithVotes(electionId);
    const userVoted = req.user ? 
      !!(await storage.getVoteByUserAndElection(req.user.id, electionId)) : 
      false;
    
    let totalVotes = 0;
    candidates.forEach(candidate => {
      totalVotes += candidate.votes;
    });
    
    res.json({
      ...election,
      candidates,
      userVoted,
      voteCount: totalVotes
    });
  });
  
  // Create a new election (admin only)
  app.post("/api/elections", isAdmin, async (req, res) => {
    const result = insertElectionSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: result.error.format() 
      });
    }
    
    const data = result.data;
    
    // Ensure the organization ID matches the admin's organization
    if (data.organizationId !== req.user.organizationId) {
      return res.status(403).json({ message: "You can only create elections for your organization" });
    }
    
    // Ensure dates are Date objects for comparison
    const startDate = typeof data.startDate === 'string' ? new Date(data.startDate) : data.startDate;
    const endDate = typeof data.endDate === 'string' ? new Date(data.endDate) : data.endDate;
    
    if (startDate > endDate) {
      return res.status(400).json({ message: "End date must be after start date" });
    }
    
    // Set initial status based on dates
    const now = new Date();
    let status: 'upcoming' | 'ongoing' = 'upcoming';
    
    if (startDate <= now && endDate >= now) {
      status = 'ongoing';
    }
    
    const election = await storage.createElection({
      ...data,
      status
    });
    
    res.status(201).json(election);
  });
  
  // Add a candidate to an election (admin only)
  app.post("/api/elections/:id/candidates", isAdmin, async (req, res) => {
    const electionId = parseInt(req.params.id, 10);
    const election = await storage.getElection(electionId);
    
    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }
    
    if (election.organizationId !== req.user.organizationId) {
      return res.status(403).json({ message: "You don't have access to this election" });
    }
    
    const result = insertCandidateSchema.safeParse({
      ...req.body,
      electionId
    });
    
    if (!result.success) {
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: result.error.format() 
      });
    }
    
    const candidate = await storage.createCandidate(result.data);
    res.status(201).json(candidate);
  });
  
  // Update election status (admin only)
  app.put("/api/elections/:id/status", isAdmin, async (req, res) => {
    const electionId = parseInt(req.params.id, 10);
    const { status } = req.body;
    
    if (!['upcoming', 'ongoing', 'completed'].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    
    const election = await storage.getElection(electionId);
    
    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }
    
    if (election.organizationId !== req.user.organizationId) {
      return res.status(403).json({ message: "You don't have access to this election" });
    }
    
    const updatedElection = await storage.updateElectionStatus(electionId, status);
    
    if (!updatedElection) {
      return res.status(500).json({ message: "Failed to update election status" });
    }
    
    res.json(updatedElection);
  });
  
  // Vote in an election
  app.post("/api/elections/:id/vote", isAuthenticated, async (req, res) => {
    const electionId = parseInt(req.params.id, 10);
    const { candidateId } = req.body;
    
    if (!candidateId) {
      return res.status(400).json({ message: "Candidate ID is required" });
    }
    
    const election = await storage.getElection(electionId);
    
    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }
    
    if (election.organizationId !== req.user.organizationId) {
      return res.status(403).json({ message: "You don't have access to this election" });
    }
    
    if (election.status !== 'ongoing') {
      return res.status(400).json({ message: "This election is not currently active" });
    }
    
    // Check if user has already voted
    const existingVote = await storage.getVoteByUserAndElection(req.user.id, electionId);
    
    if (existingVote) {
      return res.status(400).json({ message: "You have already voted in this election" });
    }
    
    // Verify candidate exists and belongs to this election
    const candidate = await storage.getCandidate(candidateId);
    
    if (!candidate || candidate.electionId !== electionId) {
      return res.status(400).json({ message: "Invalid candidate" });
    }
    
    // Create the vote
    const vote = await storage.createVote({
      userId: req.user.id,
      electionId,
      candidateId
    });
    
    res.status(201).json({ message: "Vote recorded successfully" });
  });
  
  // Get members routes
  
  // Get all members for the organization (admin only)
  app.get("/api/members", isAdmin, async (req, res) => {
    const organizationId = req.user.organizationId;
    const members = await storage.getMembersByOrganization(organizationId);
    
    // Don't send passwords back to client
    const sanitizedMembers = members.map(member => {
      const { password, ...memberWithoutPassword } = member;
      return memberWithoutPassword;
    });
    
    res.json(sanitizedMembers);
  });
  
  // Get members by status (admin only)
  app.get("/api/members/status/:status", isAdmin, async (req, res) => {
    const organizationId = req.user.organizationId;
    const status = req.params.status as 'active' | 'pending';
    
    if (!['active', 'pending'].includes(status)) {
      return res.status(400).json({ message: "Invalid status parameter" });
    }
    
    const members = await storage.getMembersByOrganization(organizationId, status);
    
    // Don't send passwords back to client
    const sanitizedMembers = members.map(member => {
      const { password, ...memberWithoutPassword } = member;
      return memberWithoutPassword;
    });
    
    res.json(sanitizedMembers);
  });

  const httpServer = createServer(app);
  return httpServer;
}
