import { Router, type IRouter } from "express";
import healthRouter from "./health";
import loanRouter from "./loan";
import telegramRouter from "./telegram";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(loanRouter);
router.use(telegramRouter);
router.use(adminRouter);

export default router;
