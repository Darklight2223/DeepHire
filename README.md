# DeepHire - AI-Powered Job Matching Platform

A modern full-stack job matching platform that uses AI to connect job seekers with the perfect opportunities. Built with Next.js, FastAPI, and MongoDB.

## 🚀 Features

- **Smart Job Matching**: AI-powered job recommendations using Google's Gemini AI
- **Multi-Auth Support**: Email/password, Google, GitHub, and LinkedIn OAuth
- **Resume Analysis**: PDF resume parsing and intelligent matching
- **User Dashboard**: Comprehensive job tracking and profile management
- **GitHub Integration**: Connect and showcase your GitHub profile
- **Real-time Matching**: Fast job matching algorithm
- **Responsive Design**: Mobile-first design with Tailwind CSS

## 🛠 Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **Tailwind CSS 4** - Utility-first CSS framework
- **NextAuth.js** - Authentication
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **Recharts** - Data visualization

### Backend
- **FastAPI** - Python web framework for AI services
- **Node.js** - JavaScript runtime for Next.js API routes
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling

### AI & Processing
- **Google Gemini AI** - For job matching and resume analysis
- **PDF-lib** - PDF processing
- **Mammoth** - Document parsing

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (version 18 or higher)
- **Python** (version 3.8 or higher)
- **MongoDB** (local installation or MongoDB Atlas)
- **Git**

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd myapp
```

### 2. Install Node.js Dependencies
```bash
npm install
```

### 3. Install Python Dependencies
```bash
pip install fastapi uvicorn pymongo python-multipart PyMuPDF google-generativeai python-dotenv
```

### 4. Environment Configuration

Create a `.env.local` file in the root directory:

```bash
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/deephire
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/deephire

# NextAuth Configuration
NEXTAUTH_SECRET=your-super-secret-nextauth-key-here
NEXTAUTH_URL=http://localhost:3000

# JWT Secret
JWT_SECRET=your-jwt-secret-key-here

# Google AI API (Required for job matching)
GOOGLE_AI_API_KEY=your-google-ai-api-key-here

# OAuth Providers (Optional - for social login)
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth  
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
```

### 5. Generate Secrets

Generate secure secrets for your environment:

```bash
# Generate NextAuth Secret
openssl rand -base64 32

# Generate JWT Secret  
openssl rand -base64 32
```

### 6. Database Setup

#### Option A: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service:
   ```bash
   # Windows
   net start MongoDB
   
   # macOS (with Homebrew)
   brew services start mongodb/brew/mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```

#### Option B: MongoDB Atlas (Recommended)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env.local`

### 7. OAuth Setup (Optional)

For social authentication, follow the detailed setup in `OAUTH_SETUP.md`:

- **Google**: [Google Cloud Console](https://console.cloud.google.com/)
- **GitHub**: [GitHub Developer Settings](https://github.com/settings/developers)  
- **LinkedIn**: [LinkedIn Developer Portal](https://www.linkedin.com/developers/)

## 🚀 Running the Application

### Development Mode

1. **Start the Next.js development server:**
   ```bash
   npm run dev
   ```

2. **Start the FastAPI server (in a new terminal):**
   ```bash
   # Navigate to the project directory
   cd myapp
   
   # Run the FastAPI server
   python main.py
   # or
   uvicorn main:app --reload --port 8000
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - FastAPI Docs: http://localhost:8000/docs

### Production Mode

1. **Build the Next.js application:**
   ```bash
   npm run build
   ```

2. **Start the production server:**
   ```bash
   npm start
   ```

3. **Run FastAPI in production:**
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

## 📁 Project Structure

```
myapp/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── job/                  # Job-related endpoints
│   │   └── ...
│   ├── components/               # React components
│   ├── lib/                      # Utility libraries
│   ├── models/                   # MongoDB models
│   └── (pages)/                  # App pages
├── public/                       # Static assets
├── main.py                       # FastAPI server
├── package.json                  # Node.js dependencies
├── .env.local                    # Environment variables (create this)
├── .env.local.example           # Environment template
└── README.md                     # This file
```

## 🔑 API Endpoints

### Next.js API Routes (Port 3000)
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/post-job` - Create new job posting
- `GET /api/myjobs` - Get user's jobs
- `POST /api/match-jobs` - Get job matches

### FastAPI Routes (Port 8000)
- `POST /match` - AI-powered job matching
- `POST /improve-resume` - Resume improvement suggestions
- `POST /upload-resume` - Upload and parse resume
- `GET /jobs` - Get all jobs
- `GET /docs` - Interactive API documentation

## 🔒 Security Notes

⚠️ **Important**: Never commit sensitive information to version control!

- All API keys and secrets are stored in `.env.local`
- The `.gitignore` file excludes all `.env*` files
- Use different secrets for development and production
- Regularly rotate your API keys and secrets

## 🎨 Customization

### Styling
- Modify `app/globals.css` for global styles
- Update Tailwind configuration in `postcss.config.mjs`
- Components use Tailwind classes for styling

### AI Model
- Change the AI model in `main.py`:
  ```python
  model = genai.GenerativeModel("models/gemini-1.5-flash-8b")
  ```

### Database Schema
- Models are defined in `app/models/`
- Modify schemas as needed for your use case

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check `MONGODB_URI` in `.env.local`
   - Verify network connectivity for Atlas

2. **Authentication Issues**  
   - Verify `NEXTAUTH_SECRET` is set
   - Check OAuth credentials and redirect URLs
   - Ensure `JWT_SECRET` is configured

3. **AI Features Not Working**
   - Verify `GOOGLE_AI_API_KEY` is valid
   - Check Google AI API quotas and billing

4. **Build Errors**
   - Clear Next.js cache: `rm -rf .next`
   - Delete node_modules and reinstall: `rm -rf node_modules && npm install`

### Environment Variables Checklist

- [ ] `MONGODB_URI` - Database connection
- [ ] `NEXTAUTH_SECRET` - Authentication secret  
- [ ] `JWT_SECRET` - JWT token secret
- [ ] `GOOGLE_AI_API_KEY` - AI functionality
- [ ] OAuth credentials (if using social login)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

**Happy coding! 🚀**
