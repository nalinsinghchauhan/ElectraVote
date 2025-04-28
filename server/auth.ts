import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { nanoid } from "nanoid";
import { 
  User, adminRegisterSchema, memberRegisterSchema, loginSchema,
  AdminRegisterData, MemberRegisterData 
} from "@shared/schema";

declare global {
  namespace Express {
    interface User extends User {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "electravote-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax"
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false, { message: "Invalid email or password" });
          }
          
          // For members, check if they're approved
          if (user.role === 'member' && user.status !== 'active') {
            return done(null, false, { message: "Your account is pending approval by the organization admin." });
          }
          
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Admin registration
  app.post("/api/register/admin", async (req, res, next) => {
    try {
      const result = adminRegisterSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: result.error.format() 
        });
      }
      
      const data = result.data;
      
      // Check if email already exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      // Generate a unique organization ID
      const organizationId = nanoid(8).toUpperCase();
      
      // Create admin user
      const user = await storage.createUser({
        name: data.name,
        email: data.email,
        password: await hashPassword(data.password),
        role: 'admin',
        organizationId,
        status: 'active'
      });
      
      // Create organization
      await storage.createOrganization({
        id: organizationId,
        name: data.organizationName,
        adminId: user.id
      });
      
      // Log in the user
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Don't send the password back to the client
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  // Member registration
  app.post("/api/register/member", async (req, res, next) => {
    try {
      const result = memberRegisterSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: result.error.format() 
        });
      }
      
      const data = result.data;
      
      // Check if email already exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      // Verify organization exists
      const organization = await storage.getOrganization(data.organizationId);
      if (!organization) {
        return res.status(400).json({ message: "Invalid organization ID" });
      }
      
      // Create member (pending approval)
      const user = await storage.createUser({
        name: data.name,
        email: data.email,
        password: await hashPassword(data.password),
        role: 'member',
        organizationId: data.organizationId,
        memberId: data.memberId,
        status: 'pending'
      });
      
      res.status(201).json({ 
        message: "Registration successful! Your account is pending approval by the organization admin.",
        id: user.id
      });
    } catch (error) {
      next(error);
    }
  });

  // Login
  app.post("/api/login", (req, res, next) => {
    const result = loginSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        message: "Validation failed", 
        errors: result.error.format() 
      });
    }
    
    passport.authenticate('local', (err, user, info) => {
      if (err) return next(err);
      
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Don't send the password back to the client
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  // Logout
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Get current user
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Don't send the password back to the client
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
  
  // Approve member
  app.post("/api/members/:id/approve", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const memberId = parseInt(req.params.id, 10);
      const member = await storage.getUser(memberId);
      
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      if (member.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Cannot approve members from other organizations" });
      }
      
      const updatedMember = await storage.updateUserStatus(memberId, 'active');
      
      if (!updatedMember) {
        return res.status(500).json({ message: "Failed to approve member" });
      }
      
      // Don't send the password back to the client
      const { password, ...memberWithoutPassword } = updatedMember;
      res.status(200).json(memberWithoutPassword);
    } catch (error) {
      next(error);
    }
  });
  
  // Reject member
  app.post("/api/members/:id/reject", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || req.user.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const memberId = parseInt(req.params.id, 10);
      const member = await storage.getUser(memberId);
      
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      if (member.organizationId !== req.user.organizationId) {
        return res.status(403).json({ message: "Cannot reject members from other organizations" });
      }
      
      const updatedMember = await storage.updateUserStatus(memberId, 'rejected');
      
      if (!updatedMember) {
        return res.status(500).json({ message: "Failed to reject member" });
      }
      
      // Don't send the password back to the client
      const { password, ...memberWithoutPassword } = updatedMember;
      res.status(200).json(memberWithoutPassword);
    } catch (error) {
      next(error);
    }
  });
}
