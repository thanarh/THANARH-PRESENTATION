import { Router } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import invitationsRouter from "./invitations";
import usersRouter from "./users";
import sessionsRouter from "./sessions";
import presentationRouter from "./presentation";
import adminRouter from "./admin";
import visitsRouter from "./visits";
import whatsappRouter from "./whatsapp";

const router = Router();

router.use("/healthz", healthRouter);
router.use("/auth", authRouter);
router.use("/invitations", invitationsRouter);
router.use("/users", usersRouter);
router.use("/sessions", sessionsRouter);
router.use("/presentation", presentationRouter);
router.use("/admin", adminRouter);
router.use("/visits", visitsRouter);
router.use("/whatsapp", whatsappRouter);

export default router;
