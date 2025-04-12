from fastapi import FastAPI, HTTPException
import pandas as pd
import uvicorn

app = FastAPI()

# Load the CSV file
df = pd.read_csv('licenses_enterprise.csv')

@app.get("/check_license/{license_code}")
async def check_license(license_code: str):
    # Check if the license code exists in the DataFrame
    if license_code in df['License Code'].values:
        return {"valid": True}
    else:
        return {"valid": False}

# Add this block to run the server with uvicorn
if __name__ == "__main__":
    uvicorn.run("api:app", host="127.0.0.1", port=8000, reload=True)


