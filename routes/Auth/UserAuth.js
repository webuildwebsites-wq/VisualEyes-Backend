import express from 'express';
import { userLogin, userForgotPassword, userResetPassword, userUpdatePassword, getUserProfile } from '../../controllers/Auth/User/UserAuth.js';
import { logout, refreshToken } from '../../Utils/Auth/tokenUtils.js';
import { ProtectUsers } from '../../middlewares/Auth/AdminMiddleware/adminMiddleware.js';

const userRouter = express.Router();


userRouter.post('/login', userLogin);
userRouter.get('/profile', ProtectUsers, getUserProfile);
userRouter.put('/update-password', ProtectUsers, userUpdatePassword);
userRouter.post('/forgot-password', userForgotPassword);
userRouter.put('/reset-password/:resettoken', userResetPassword);

userRouter.post('/refresh', refreshToken);
userRouter.post('/logout', ProtectUsers, logout);

export default userRouter;