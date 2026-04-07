import { Router, type IRouter } from "express";
import healthRouter from "./health";
import showsRouter from "./shows";
import genresRouter from "./genres";

const router: IRouter = Router();

router.use(healthRouter);
router.use(showsRouter);
router.use(genresRouter);

export default router;
