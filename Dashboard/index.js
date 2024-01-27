import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import mongoose from "mongoose";

/* middleware configurations*/
dotenv.cofigure();
const app = express();
app.use(express.json());
app.use(helmet());
app.use(morgan("common"));
app.use(helmet.corsOriginResourcePolicy({ policy: "cross-origin" }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors())

/*Routes setup*/
app.use("/client",clientRoute);
app.use("/management",managementRoute);
app.use("/sales",salesRoute);
app.use("/general",generalRoute);