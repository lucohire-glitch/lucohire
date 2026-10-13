import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const signToken = (role, user) =>
  jwt.sign({ id: user.id, role, email: user.email }, env.jwt.secret, { expiresIn: env.jwt.expiresIn });

export const verifyToken = (token) => jwt.verify(token, env.jwt.secret);

export const publicUser = (row) => {
  const { password_hash, ...rest } = row;
  return rest;
};
