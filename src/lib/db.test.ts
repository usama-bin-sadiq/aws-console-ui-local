import { describe, it, expect, beforeEach } from 'vitest';
import { validateUser, createUser, getUserByUsername, getAllUsers } from '@/lib/db';

describe('Database Operations', () => {
  let counter = 0;

  beforeEach(() => {
    counter++;
  });

  function uniqueUser(): { username: string; password: string; email: string } {
    return {
      username: `testuser_${counter}_${Date.now()}`,
      password: 'testpass123',
      email: `test${counter}@example.com`,
    };
  }

  describe('User Creation', () => {
    it('should create a user with hashed password', () => {
      const { username, email } = uniqueUser();
      const user = createUser({
        username,
        password: 'testpass123',
        email,
        permissions: ['s3:GetObject'],
      });

      expect(user.username).toBe(username);
      expect(user.email).toBe(email);
      expect(user.permissions).toBe(JSON.stringify(['s3:GetObject']));
      expect(user.password).not.toBe('testpass123');
      expect(user.password).toContain('$2a$');
    });
  });

  describe('User Validation', () => {
    it('should validate correct password', () => {
      const { username, password } = uniqueUser();
      createUser({ username, password, email: 'validate@example.com' });

      const isValid = validateUser(username, password);
      expect(isValid).toBeDefined();
      expect(isValid?.username).toBe(username);
    });

    it('should reject incorrect password', () => {
      const { username } = uniqueUser();
      createUser({ username, password: 'correctpass', email: 'validate@example.com' });

      const result = validateUser(username, 'wrongpass');
      expect(result).toBeUndefined();
    });

    it('should reject nonexistent user', () => {
      const result = validateUser('nonexistent_user_xyz', 'any');
      expect(result).toBeUndefined();
    });
  });

  describe('Get User By Username', () => {
    it('should find existing user', () => {
      const { username, email } = uniqueUser();
      createUser({ username, password: 'findpass', email });

      const user = getUserByUsername(username);
      expect(user).toBeDefined();
      expect(user?.email).toBe(email);
    });

    it('should return undefined for nonexistent user', () => {
      const user = getUserByUsername('nonexistent_user_xyz');
      expect(user).toBeUndefined();
    });
  });

  describe('Get All Users', () => {
    it('should return all users without passwords', () => {
      const users = getAllUsers();
      expect(Array.isArray(users)).toBe(true);
      users.forEach((user: any) => {
        expect('password' in user).toBe(false);
        expect('mfa_secret' in user).toBe(false);
      });
    });
  });
});