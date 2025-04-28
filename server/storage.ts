import { nanoid } from "nanoid";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { eq, and, count, sql } from "drizzle-orm";
import {
  users, organizations, elections, candidates, votes,
  type User, type Organization, type Election, type Candidate, type Vote,
  type InsertUser, type InsertOrganization, type InsertElection, type InsertCandidate, type InsertVote,
  type ElectionWithCandidates, type CandidateWithVotes
} from "@shared/schema";
import { pool, db } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStatus(id: number, status: 'active' | 'pending' | 'rejected'): Promise<User | undefined>;

  // Organization methods
  getOrganization(id: string): Promise<Organization | undefined>;
  getOrganizationByAdmin(adminId: number): Promise<Organization | undefined>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  
  // Election methods
  getElection(id: number): Promise<Election | undefined>;
  getElectionsByOrganization(organizationId: string): Promise<Election[]>;
  getElectionWithCandidates(id: number): Promise<ElectionWithCandidates | undefined>;
  getElectionsByStatus(organizationId: string, status: 'upcoming' | 'ongoing' | 'completed'): Promise<Election[]>;
  createElection(election: InsertElection): Promise<Election>;
  updateElectionStatus(id: number, status: 'upcoming' | 'ongoing' | 'completed'): Promise<Election | undefined>;
  
  // Candidate methods
  getCandidate(id: number): Promise<Candidate | undefined>;
  getCandidatesByElection(electionId: number): Promise<Candidate[]>;
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;
  getCandidatesWithVotes(electionId: number): Promise<CandidateWithVotes[]>;
  
  // Vote methods
  createVote(vote: InsertVote): Promise<Vote>;
  getVoteByUserAndElection(userId: number, electionId: number): Promise<Vote | undefined>;
  getVoteCountByCandidate(candidateId: number): Promise<number>;
  
  // Member methods  
  getMembersByOrganization(organizationId: string, status?: 'active' | 'pending'): Promise<User[]>;
  
  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.id, id));
    return results[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const results = await db.select().from(users).where(eq(users.email, email));
    return results[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const results = await db.insert(users).values(insertUser).returning();
    return results[0];
  }
  
  async updateUserStatus(id: number, status: 'active' | 'pending' | 'rejected'): Promise<User | undefined> {
    const results = await db
      .update(users)
      .set({ status })
      .where(eq(users.id, id))
      .returning();
    return results[0];
  }

  // Organization methods
  async getOrganization(id: string): Promise<Organization | undefined> {
    const results = await db.select().from(organizations).where(eq(organizations.id, id));
    return results[0];
  }
  
  async getOrganizationByAdmin(adminId: number): Promise<Organization | undefined> {
    const results = await db.select().from(organizations).where(eq(organizations.adminId, adminId));
    return results[0];
  }

  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const results = await db.insert(organizations).values(org).returning();
    return results[0];
  }
  
  // Election methods
  async getElection(id: number): Promise<Election | undefined> {
    const results = await db.select().from(elections).where(eq(elections.id, id));
    return results[0];
  }
  
  async getElectionsByOrganization(organizationId: string): Promise<Election[]> {
    return db
      .select()
      .from(elections)
      .where(eq(elections.organizationId, organizationId));
  }
  
  async getElectionWithCandidates(id: number): Promise<ElectionWithCandidates | undefined> {
    const electionResults = await db
      .select()
      .from(elections)
      .where(eq(elections.id, id));
    
    if (electionResults.length === 0) return undefined;
    
    const election = electionResults[0];
    const electionCandidates = await this.getCandidatesByElection(id);
    
    return {
      ...election,
      candidates: electionCandidates
    };
  }
  
  async getElectionsByStatus(organizationId: string, status: 'upcoming' | 'ongoing' | 'completed'): Promise<Election[]> {
    return db
      .select()
      .from(elections)
      .where(
        and(
          eq(elections.organizationId, organizationId),
          eq(elections.status, status)
        )
      );
  }
  
  async createElection(election: InsertElection): Promise<Election> {
    // Convert ISO string dates to Date objects if they are strings
    const processedElection = {
      ...election,
      startDate: typeof election.startDate === 'string' ? new Date(election.startDate) : election.startDate,
      endDate: typeof election.endDate === 'string' ? new Date(election.endDate) : election.endDate
    };
    
    const results = await db.insert(elections).values(processedElection).returning();
    return results[0];
  }
  
  async updateElectionStatus(id: number, status: 'upcoming' | 'ongoing' | 'completed'): Promise<Election | undefined> {
    const results = await db
      .update(elections)
      .set({ status })
      .where(eq(elections.id, id))
      .returning();
    return results[0];
  }
  
  // Candidate methods
  async getCandidate(id: number): Promise<Candidate | undefined> {
    const results = await db.select().from(candidates).where(eq(candidates.id, id));
    return results[0];
  }
  
  async getCandidatesByElection(electionId: number): Promise<Candidate[]> {
    return db
      .select()
      .from(candidates)
      .where(eq(candidates.electionId, electionId));
  }
  
  async createCandidate(candidate: InsertCandidate): Promise<Candidate> {
    const results = await db.insert(candidates).values(candidate).returning();
    return results[0];
  }
  
  async getCandidatesWithVotes(electionId: number): Promise<CandidateWithVotes[]> {
    // First get all candidates for this election
    const electionCandidates = await this.getCandidatesByElection(electionId);
    
    // For each candidate, get their vote count and create CandidateWithVotes objects
    const candidatesWithVotes: CandidateWithVotes[] = await Promise.all(
      electionCandidates.map(async (candidate) => {
        const voteCount = await this.getVoteCountByCandidate(candidate.id);
        return {
          ...candidate,
          votes: voteCount
        };
      })
    );
    
    return candidatesWithVotes;
  }
  
  // Vote methods
  async createVote(vote: InsertVote): Promise<Vote> {
    const results = await db.insert(votes).values(vote).returning();
    return results[0];
  }
  
  async getVoteByUserAndElection(userId: number, electionId: number): Promise<Vote | undefined> {
    const results = await db
      .select()
      .from(votes)
      .where(
        and(
          eq(votes.userId, userId),
          eq(votes.electionId, electionId)
        )
      );
    return results[0];
  }
  
  async getVoteCountByCandidate(candidateId: number): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(votes)
      .where(eq(votes.candidateId, candidateId));
    
    return result[0]?.count || 0;
  }
  
  // Member methods
  async getMembersByOrganization(organizationId: string, status?: 'active' | 'pending'): Promise<User[]> {
    if (status) {
      return db
        .select()
        .from(users)
        .where(
          and(
            eq(users.organizationId, organizationId),
            eq(users.role, 'member'),
            eq(users.status, status)
          )
        );
    } else {
      return db
        .select()
        .from(users)
        .where(
          and(
            eq(users.organizationId, organizationId),
            eq(users.role, 'member')
          )
        );
    }
  }
}

export const storage = new DatabaseStorage();
