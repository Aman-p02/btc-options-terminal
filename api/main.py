"""
Main FastAPI Application for BTC Options Research Analytics API.
"""

import time
import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api.routers import (
    heatmap,
    strike_finder,
    distance_calc,
    sl_planner,
    backtester,
    live_ticker,
    regimes
)
from api.db import get_db, get_excursions_path

app = FastAPI(
    title="BTC Options Research Analytics API",
    description="Deterministic statistical research terminal engine powered by 9 years of Binance 1-second BTCUSDT history.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000.0
    response.headers["X-Process-Time-Ms"] = f"{process_time:.2f}"
    return response


@app.get("/health")
def health_check():
    try:
        con = get_db()
        ex_path = get_excursions_path()
        count = con.execute(f"SELECT count(*) FROM '{ex_path}'").fetchone()[0]
        db_status = f"connected ({count:,} precomputed excursion rows)"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "healthy",
        "service": "btc-analytics-api",
        "data_as_of": "2026-10-31 UTC",
        "storage": db_status,
        "timestamp": time.time()
    }


# Mount feature routers under /api
app.include_router(heatmap.router, prefix="/api")
app.include_router(strike_finder.router, prefix="/api")
app.include_router(distance_calc.router, prefix="/api")
app.include_router(sl_planner.router, prefix="/api")
app.include_router(backtester.router, prefix="/api")
app.include_router(live_ticker.router, prefix="/api")
app.include_router(regimes.router, prefix="/api")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)

