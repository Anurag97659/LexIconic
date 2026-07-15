import { Router } from "express";
import {
  registeruser,
  loginuser,
  logoutuser,
  changeCurrentPassword,
  updateDetails,
  refreshAccessToken,
  deleteUser,
  getUsername,
  getProfile,
  resetPassword,
  getSecurityQuestion
} from "../controllers/user.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router();
router.route("/register").post(registeruser);
router.route("/login").post(loginuser);
router.route("/reset-password").post(resetPassword);
router.route("/question/:username").get(getSecurityQuestion);
router.route("/logout").post(verifyJWT, logoutuser);
router.route("/refreshToken").get(refreshAccessToken);

router.route("/getUsername").get(verifyJWT, getUsername);
router.route("/getProfile").get(verifyJWT, getProfile);
router.route("/updateDetails").post(verifyJWT, updateDetails);
router.route("/changePassword").post(verifyJWT, changeCurrentPassword);
router.route("/delete").post(verifyJWT, deleteUser);

export default router;