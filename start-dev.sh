#!/bin/bash

# Start Backend
echo "Starting Backend..."
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# Run in background
uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Start Frontend
echo "Starting Frontend..."
cd ../frontend
npm install
npm run dev &
FRONTEND_PID=$!

echo "Site running!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:4321"
echo "Press CTRL+C to stop both."

# Handle shutdown
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
