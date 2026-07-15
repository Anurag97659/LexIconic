import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { optionalJWT } from "../middlewares/auth.middleware.js";
import {
  createWord,
  getWords,
  getWordById,
  updateWord,
  deleteWord,
  searchWords
} from "../controllers/word.controllers.js";
const router = Router();

router.route("/createword").post(verifyJWT, createWord);
router.route("/getwords").get(optionalJWT, getWords);
router.route("/getword/:id").get(optionalJWT, getWordById);
router.route("/updateword/:id").put(verifyJWT, updateWord);
router.route("/deleteword/:id").delete(verifyJWT, deleteWord);
router.route("/search").get(optionalJWT, searchWords);


export default router;