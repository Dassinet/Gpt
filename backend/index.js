const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("./routes/authRoutes");
const cookieParser = require("cookie-parser");
const connectDB = require("./lib/db");
const gptRoutes = require("./routes/gptRoutes");
const chatRoutes = require("./routes/chatRoutes");

dotenv.config();


const app = express();

const PORT = process.env.PORT || 3001;

connectDB();

const allowedOrigins = [
    process.env.FRONTEND_URL || 'https://gpt-frontend-five.vercel.app',
    'http://localhost:3000',
    'https://emsa-beta.vercel.app'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    exposedHeaders: ['Authorization', 'Set-Cookie'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/gpt", gptRoutes); 
app.use("/api/chat", chatRoutes);

app.get("/", (req, res) => {
    res.send("Hello World");
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});