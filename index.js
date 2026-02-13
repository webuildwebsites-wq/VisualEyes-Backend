import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser'
import helmet from 'helmet';
import hpp from 'hpp';
import compression from 'compression';
import morgan from 'morgan';
import customerRouter from './src/routes/Auth/CustomerAuth.js';
import employeeRouter from './src/routes/Auth/EmployeeAuth.js';
import employeeManagementRouter from './src/routes/Auth/EmployeeManagement.js';
import connectDB from './src/core/config/DB/connectDb.js';
import imageUploadRouter from './src/routes/uploads/upload.js';
dotenv.config();

const app = express();
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://visualeye.digibysr.in",
  "https://www.visualeye.digibysr.in",
  "https://visualeye.digibysr.com",
  "https://www.visualeye.digibysr.com",
  "https://visualeyeye.netlify.app",
  "https://www.visualeyeye.netlify.app",
  "http://139.59.65.108"
];

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));

app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(compression()); 
app.use(morgan('combined'));
app.use(hpp()); 
app.use(express.json({ limit: '10mb' })); 
app.use(cookieParser())
app.set('trust proxy', 1);

try {
    app.get("/", (req, res) => {
        res.json({
            message: "VisualEyes Server is running on port " + (process.env.PORT || 8080),
            error: false,
            success: true,
        })
    })

    // EMPLOYEE ROUTES (Admin/Staff)
    app.use('/api/employee/auth', employeeRouter);
    app.use('/api/employee/management', employeeManagementRouter);
    

   // CUSTOMER ROUTES
    app.use('/api/customer/auth', customerRouter);

   // UPLOAD IMAGE ROUTES
    app.use('/api/bucket/upload-image', imageUploadRouter)
    
} catch (error) {
    console.error("Error occurred:", error);
    res.status(500).json({
        message: "Internal Server Error",
        error: true,
        success: false,
        server: "lens-manufacturing-erp",
        serverError: error.message || error
    });
}

app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    const status = err?.status || 500;
    res.status(status).json({
        message: err?.message || 'Internal Server Error',
        error: true,
        success: false,
        ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
    });
});

app.listen(process.env.PORT || 8080, () => {
    console.log(`Server is running http://localhost:${process.env.PORT || 8080}`);
});

connectDB()
  .then(() => console.log("DB Connected"))
  .catch(err => console.error("DB Failed:", err));