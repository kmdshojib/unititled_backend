import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionIstance = await mongoose.connect(`mongodb://localhost:27017/${DB_NAME}`)
        console.log(`DB connection established: ${connectionIstance.connection.host}`);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

export default connectDB;