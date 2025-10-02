# Orion — Social Media MVP (Baseline)
Endpoints:
- GET /api/health
- GET /api/version
- POST /api/renderTemplate  body: {"headline":"Hello"}
- GET /api/status?id=<jobId>
- POST /api/tts body: {"script":"Hi","voice":"alloy"}

Env (Vercel):
- SHOTSTACK_API_KEY
- SHOTSTACK_HOST=https://api.shotstack.io
- SHOTSTACK_ENV=v1
- OPENAI_API_KEY
