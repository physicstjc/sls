# Chinese Writing Backend

Secure backend for character recognition using Google's Gemini API.

## Setup (Local Development)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```

3. **Add your Gemini API key to `.env`:**
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   PORT=3000
   ```

4. **Run locally:**
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000/health` to verify the server is running.

## Deployment Options

### Option 1: Vercel (Recommended - Free Tier)
1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign up
3. Import your repository
4. Add environment variable in Vercel dashboard:
   - Name: `GEMINI_API_KEY`
   - Value: Your actual API key
5. Deploy with one click

### Option 2: Railway (Free Tier)
1. Go to [railway.app](https://railway.app)
2. Create new project → Deploy from GitHub
3. Select your repository
4. Add environment variable `GEMINI_API_KEY`
5. Deploy

### Option 3: Google Cloud Functions
1. Create function with Node.js 18
2. Copy `server.js` content to `index.js`
3. Update handler to export Express app
4. Set environment variable `GEMINI_API_KEY`

### Option 4: Docker Deployment
```bash
docker build -t chinese-writing-backend .
docker run -e GEMINI_API_KEY=your_key -p 3000:3000 chinese-writing-backend
```

## Production Notes

- The frontend will automatically detect if it's running locally and adjust the API endpoint accordingly
- For production deployment, ensure CORS is properly configured if frontend and backend are on different domains
- Keep your `GEMINI_API_KEY` secure - never commit it to version control
- Use the environment variable system of your hosting platform to inject the API key
