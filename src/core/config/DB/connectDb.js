import mongoose from "mongoose";
import dotenv from 'dotenv'
dotenv.config()

async function connectDB() {
    try {
        await mongoose.connect("mongodb+srv://webuildwebsites_db_user:IyVAzXTxudFDommn@cluster0.yewk4no.mongodb.net/")
        console.log("connect DB")
    } catch (error) {
        console.log("Mongodb connect error", error)
        process.exit(1);
    }
}

export default connectDB;