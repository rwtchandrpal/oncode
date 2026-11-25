const express = require('express');
const { requireAdmin, requireUser } = require('../middlewares/authenticate');
const {register, login, logout, demoLogin, adminRegister, deleteProfile, checkAuth, getUserStats} =
require('../controllers/userAuthenticate');
const authRouter = express.Router();
const { registerLimiter, loginEmailLimiter, loginIpLimiter, demoLimiter } = require('../middlewares/rateLimits');
const validate = require('../middlewares/validate');
const { registerBody, adminRegisterBody, loginBody } = require('../validation/auth');



// different user routes 
authRouter.post("/register", registerLimiter, validate({ body: registerBody }), register);
authRouter.post("/login", loginIpLimiter, loginEmailLimiter, validate({ body: loginBody }), login);
authRouter.post("/demo", demoLimiter, demoLogin);
authRouter.post("/logout", requireUser, logout);
authRouter.post("/admin/register", requireAdmin, validate({ body: adminRegisterBody }), adminRegister);

authRouter.get("/profile", requireUser, getUserStats);
authRouter.delete("/profile",requireUser, deleteProfile);
authRouter.get("/check", requireUser, checkAuth);


module.exports = authRouter;