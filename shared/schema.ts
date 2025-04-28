import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'member']);
export const memberStatusEnum = pgEnum('member_status', ['pending', 'active', 'rejected']);
export const electionStatusEnum = pgEnum('election_status', ['upcoming', 'ongoing', 'completed']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default('member'),
  organizationId: text("organization_id"),
  memberId: text("member_id"),
  status: memberStatusEnum("status").default('pending'),
  createdAt: timestamp("created_at").defaultNow(),
});

// Organizations table
export const organizations = pgTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  adminId: integer("admin_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Elections table
export const elections = pgTable("elections", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  organizationId: text("organization_id").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: electionStatusEnum("status").default('upcoming'),
  createdAt: timestamp("created_at").defaultNow(),
});

// Candidates table
export const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  position: text("position"),
  electionId: integer("election_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Votes table
export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  electionId: integer("election_id").notNull(),
  candidateId: integer("candidate_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  votes: many(votes),
}));

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  admin: one(users, {
    fields: [organizations.adminId],
    references: [users.id],
  }),
  members: many(users),
  elections: many(elections),
}));

export const electionsRelations = relations(elections, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [elections.organizationId],
    references: [organizations.id],
  }),
  candidates: many(candidates),
  votes: many(votes),
}));

export const candidatesRelations = relations(candidates, ({ one, many }) => ({
  election: one(elections, {
    fields: [candidates.electionId],
    references: [elections.id],
  }),
  votes: many(votes),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  user: one(users, {
    fields: [votes.userId],
    references: [users.id],
  }),
  election: one(elections, {
    fields: [votes.electionId],
    references: [elections.id],
  }),
  candidate: one(candidates, {
    fields: [votes.candidateId],
    references: [candidates.id],
  }),
}));

// Schemas for inserting data
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true 
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({ 
  createdAt: true 
});

// Base election schema from Drizzle
const baseElectionSchema = createInsertSchema(elections).omit({ 
  id: true, 
  createdAt: true 
});

// Enhanced election schema with proper date validation
export const insertElectionSchema = baseElectionSchema.extend({
  startDate: z.string().or(z.date()).transform((val) => 
    typeof val === 'string' ? val : val.toISOString()
  ),
  endDate: z.string().or(z.date()).transform((val) => 
    typeof val === 'string' ? val : val.toISOString()
  ),
});

export const insertCandidateSchema = createInsertSchema(candidates).omit({ 
  id: true, 
  createdAt: true 
});

export const insertVoteSchema = createInsertSchema(votes).omit({ 
  id: true, 
  createdAt: true 
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Registration schemas
export const adminRegisterSchema = insertUserSchema
  .extend({
    organizationName: z.string().min(3),
    confirmPassword: z.string().min(6)
  })
  .omit({ 
    organizationId: true, 
    memberId: true, 
    status: true, 
    role: true 
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const memberRegisterSchema = insertUserSchema
  .extend({
    organizationId: z.string().min(3),
    memberId: z.string().min(3),
    confirmPassword: z.string().min(6)
  })
  .omit({ 
    role: true,
    status: true
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Types based on schemas
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type InsertElection = z.infer<typeof insertElectionSchema>;
export type InsertCandidate = z.infer<typeof insertCandidateSchema>;
export type InsertVote = z.infer<typeof insertVoteSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type AdminRegisterData = z.infer<typeof adminRegisterSchema>;
export type MemberRegisterData = z.infer<typeof memberRegisterSchema>;

// Types for selecting data
export type User = typeof users.$inferSelect;
export type Organization = typeof organizations.$inferSelect;
export type Election = typeof elections.$inferSelect;
export type Candidate = typeof candidates.$inferSelect;
export type Vote = typeof votes.$inferSelect;

// Extended types for display
export type ElectionWithCandidates = Election & { 
  candidates: Candidate[];
  userVoted?: boolean;
  voteCount?: number;
};

export type CandidateWithVotes = Candidate & {
  votes: number;
};
