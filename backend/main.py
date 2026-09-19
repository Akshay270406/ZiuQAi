# backend/main.py
import uvicorn 

# test routes at: http://localhost:8080/docs

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8080, reload=True)