import jwt from 'jsonwebtoken';
import { issuePlayerToken } from './src/services/tokens.service';
import { env } from './src/config/env';

// Test token generation
const token = issuePlayerToken("KB6FY1", "team123", "player456");
console.log("Generated token:", token);

// Decode the token to see what's inside
const decoded = jwt.verify(token, env.JWT_SECRET);
console.log("Decoded payload:", decoded);

// Check if role is correct
const payload = decoded as any;
console.log(`Role check: ${payload.role === "PLAYER" ? "✓ PASS" : "✗ FAIL"}`);
console.log(`Expected: PLAYER, Got: ${payload.role}`);
