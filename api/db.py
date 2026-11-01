"""
DuckDB Database Manager for Analytics API.
Accesses precomputed parquet files in read-only mode with thread pooling.
"""

import os
from pathlib import Path
import duckdb

PROCESSED_DIR = os.getenv("BTC_PROCESSED_DIR", r"C:/binance_btc_data/processed").replace("\\", "/")


def get_db():
    """Returns a DuckDB connection configured for analytical read performance."""
    con = duckdb.connect()
    con.execute("PRAGMA threads=6;")
    con.execute("PRAGMA memory_limit='4GB';")
    return con


def get_candles_path() -> str:
    return f"{PROCESSED_DIR}/candles_1m.parquet"


def get_excursions_path() -> str:
    return f"{PROCESSED_DIR}/excursions.parquet"


def get_daily_path() -> str:
    return f"{PROCESSED_DIR}/daily_stats.parquet"


def get_hourly_path() -> str:
    return f"{PROCESSED_DIR}/hourly_stats.parquet"

