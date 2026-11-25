const express = require('express');
const {register, login, logout, demoLogin, adminRegister, deleteProfile, checkAuth, getUserStats} =
require('../controllers/userAuthenticate');
const authRouter = express.Router();
const userMiddleware = require('../middlewares/userMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const rateLimit = require('express-rate-limit');
const validate = require('../middlewares/validate');
const { registerBody, adminRegisterBody, loginBody } = require('../validation/auth');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20, // Limit each IP to 20 requests per window
  standardHeaders: 'draft-7', 
  legacyHeaders: false, 
  message: { message: 'Too many authentication attempts, please try again later.' }
});

const demoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5, // Limit each IP to 5 demo sessions per 15 minutes
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many demo accounts created from this IP. Please try again in 15 minutes.' }
});

// different user routes 
authRouter.post("/register", authLimiter, validate({ body: registerBody }), register);
authRouter.post("/login", authLimiter, validate({ body: loginBody }), login);
authRouter.post("/demo", demoLimiter, demoLogin);
authRouter.post("/logout", userMiddleware, logout);
authRouter.post("/admin/register", adminMiddleware, validate({ body: adminRegisterBody }), adminRegister);

authRouter.get("/profile", userMiddleware, getUserStats);
authRouter.delete("/profile",userMiddleware, deleteProfile);
authRouter.get("/check", userMiddleware, checkAuth);


module.exports = authRouter;