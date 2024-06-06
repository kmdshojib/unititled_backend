import { app } from "./app.js";
import connectDB from "./db/db.js";
import dotenv from "dotenv";
dotenv.config({
    path: "/.env"
})
connectDB()
    .then(() => {
        app.listen(process.env.PORT || 5000, () => {
            console.log(`App listening on ${process.env.PORT}`);
        })
    })
    .catch((error) => console.error("Db error: " + error))




// import express from "express";
// const app = express();

// ; (async () => {
//     try {
//         await mongoose.connect(`mongodb://localhost:27017/${DB_NAME}`)
//         app.on("error", (error) => {
//             console.error("Error connecting to Mongo", error);
//             throw error;
//         })
//         app.listen(process.env.PORT, () => {
//             console.log("Listening on port " + process.env.PORT);
//         })
//     } catch (error) {
//         console.error(error);
//     }
// })()