import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import http from 'http'
import { Server } from 'socket.io'
import path from 'path'
import { fileURLToPath } from 'url'

import { connectDB } from './config/db.js';
import authRouter from './routes/authroutes.js';
import userRouter from './routes/userroutes.js';
import propertyRouter from './routes/propertyroutes.js';
import inquiryRouter from './routes/inquiryroutes.js';
import WishlistRouter from './routes/wishlistroutes.js';
import contactRouter from './routes/contactroutes.js';
import adminRouter from './routes/adminroutes.js';
import chatRouter from './routes/chatroutes.js';

// if (!process.env.JWT_SECRET) {
//       throw new Error('JWT_SECRET environment variable is required');
// }

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');

await connectDB();

//middlewares
const allowedOrigins = [
      process.env.CLIENT_URL,
      process.env.FRONTEND_URL,
      "https://realestate-platformfrontend.onrender.com",
      "https://realestate-platform-backend-aewr.onrender.com",
      "http://localhost:5000",
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:4173",
      "http://127.0.0.1:4173"
].filter(Boolean);

const isAllowedOrigin = (origin) => {
      if (!origin) return true;

      if (allowedOrigins.includes(origin)) return true;

      try {
            const hostname = new URL(origin).hostname;
            return hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".onrender.com");
      } catch {
            return false;
      }
};

app.use(cors({
      origin: function (origin, callback) {
            if (isAllowedOrigin(origin)) {
                  callback(null, true);
            }
            else {
                  callback(new Error("Not allowed by CORS"))
            }
      },
      credentials: true
}));
app.use(express.json());

//routes
app.get('/api', (req, res) => {
      res.send('server is ready');
})

app.use('/api/auth', authRouter);

app.use("/api/user", userRouter);

app.use("/api/property", propertyRouter);
app.use("/api/properties", propertyRouter);

app.use("/api/inquiry", inquiryRouter);

app.use("/api/wishlist", WishlistRouter);

app.use("/api/contact", contactRouter);

app.use("/api/admin", adminRouter);

app.use("/api/chat", chatRouter);

app.use(express.static(frontendDistPath));

app.get(/^\/(?!api)(?!.*\.[^/]+$).*/, (req, res) => {
      res.sendFile(path.join(frontendDistPath, 'index.html'));
});

const httpServer = http.createServer(app);
//socket .io setup
const io = new Server(httpServer, {
      cors: {
            origin: allowedOrigins,
            methods: ["GET", "POST"],
      }
})

io.on("connection", (socket) => {
      socket.on("joinChat", (chatId) => {
            socket.join(chatId);
      })
      socket.on("sendMessage", (data) => {
            io.to(data.chatId).emit("receiveMessage", data);
      })
      socket.on("disconnect", () => { })
})


const PORT = Number(process.env.PORT || 5000);

httpServer.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
            console.error(
                  `Port ${PORT} is already in use. The backend is likely already running in another terminal.`
            );
            console.error("Stop the existing process or choose a different PORT before starting again.");
            process.exit(1);
      }

      throw error;
});

httpServer.listen(PORT, () => {
      console.log(`server is running on port ${PORT}`)
})
