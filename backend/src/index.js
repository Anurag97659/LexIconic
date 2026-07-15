import dotenv from "dotenv";
dotenv.config({
    path: ".env"
});

import connectDatabase from "./db/db.js";
import app from "./app.js";
connectDatabase()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Server is running on port ${process.env.PORT}`);
    })
})
.catch((error)=>{
    console.log("Mongo db not connect !!!! /(ㄒoㄒ)/~~  error in main index.js")
})
