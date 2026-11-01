"""
Hugging Face Space Entrypoint for BTC Options Analytics Engine.
Mounts FastAPI directly onto Gradio's underlying ASGI server.
"""

import os
import sys

# Add root directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ["BTC_PROCESSED_DIR"] = os.path.join(os.path.dirname(os.path.abspath(__file__)), "processed")

import gradio as gr
from api.main import app as fastapi_app

# Gradio Interface wrapper displaying terminal status
with gr.Blocks(title="BTC Options Research Engine API") as demo:
    gr.Markdown("""
    # 🚀 BTC Options Analytics Microservice (Live)
    
    This Space powers the **BTC Options Research Terminal** Next.js frontend on Vercel.
    - **Engine:** Python DuckDB 2.0.0
    - **Dataset:** 9.2 Years Real Binance 1-Second Ticks (2017-2026)
    - **Processed Records:** 2.57M Excursion Windows, 4.83M 1m Candles
    - **API Endpoints:** `/health`, `/api/heatmap`, `/api/strike-finder`, `/api/distance-calculator`, `/api/sl-planner`, `/api/backtest`, `/api/live`
    
    *Status: Healthy & Listening for Terminal Requests*
    """)

# Mount FastAPI app onto Gradio
app = gr.mount_gradio_app(fastapi_app, demo, path="/status")

if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860)

