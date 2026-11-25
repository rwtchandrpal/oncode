const express = require('express');
const { requireAdmin } = require('../middlewares/authenticate');


const { getDashboardStats } = require('../controllers/adminController');
const adminRouter = express.Router();

adminRouter.get('/dashboard',requireAdmin, getDashboardStats);

module.exports = adminRouter;