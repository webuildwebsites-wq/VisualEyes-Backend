import express from 'express';
import { getUserProfile, userForgotPassword, userLogin, userResetPassword, userUpdatePassword } from '../../core/controllers/Auth/User/UserAuth.js';
import { logout, refreshToken } from '../../Utils/Auth/tokenUtils.js';
import { ProtectUser } from "../../middlewares/Auth/AdminMiddleware/adminMiddleware.js"
import { verifyUserEmail } from '../../core/controllers/Auth/User/VarifyAccount.js';

const userRouter = express.Router();

userRouter.post('/login', userLogin);
userRouter.get('/profile', ProtectUser, getUserProfile);

userRouter.post('/verify-email', verifyUserEmail);

userRouter.post('/forgot-password', userForgotPassword);
userRouter.put('/update-password', ProtectUser, userUpdatePassword);
userRouter.put('/reset-password/:resettoken', userResetPassword);

userRouter.post('/refresh', refreshToken);
userRouter.post('/logout', ProtectUser, logout);

export default userRouter;