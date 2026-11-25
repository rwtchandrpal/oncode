const express = require('express');
const {register, login, logout, demoLogin, adminRegister, deleteProfile, checkAuth, getUserStats} =
require('../controllers/userAuthenticate');
const authRouter = express.Router();
const userMiddleware = require('../middlewares/userMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');
const { registerLimiter, loginEmailLimiter, loginIpLimiter, demoLimiter } = require('../middlewares/rateLimits');
const validate = require('../middlewares/validate');
const { registerBody, adminRegisterBody, loginBody } = require('../validation/auth');



// different user routes 
authRouter.post("/register", registerLimiter, validate({ body: registerBody }), register);
authRouter.post("/login", loginIpLimiter, loginEmailLimiter, validate({ body: loginBody }), login);
authRouter.post("/demo", demoLimiter, demoLogin);
authRouter.post("/logout", userMiddleware, logout);
authRouter.post("/admin/register", adminMiddleware, validate({ body: adminRegisterBody }), adminRegister);

authRouter.get("/profile", userMiddleware, getUserStats);
authRouter.delete("/profile",userMiddleware, deleteProfile);
authRouter.get("/check", userMiddleware, checkAuth);


module.exports = authRouter;