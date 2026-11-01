"""
Core Statistical and Financial Mathematics Engine.
All formulas are purely mathematical, deterministic, and verifiable against hand calculations.
"""

import math
from typing import Tuple


def normal_cdf(x: float) -> float:
    """Standard normal cumulative distribution function using error function."""
    return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))


def wilson_score_interval(
    k: int,
    n: int,
    confidence: float = 0.95
) -> Tuple[float, float]:
    """
    Wilson score interval for a binomial proportion.
    Non-asymmetric, stable even for small n or extreme proportions (near 0 or 1).

    k: number of successes (e.g. touches)
    n: total trials (sample size)
    confidence: confidence level (default 0.95, z=1.95996)
    Returns: (lower_bound, upper_bound) in percentage (0 to 100).
    """
    if n <= 0:
        return (0.0, 0.0)
    
    if confidence == 0.95:
        z = 1.959963984540054
    elif confidence == 0.99:
        z = 2.5758293035489004
    elif confidence == 0.90:
        z = 1.6448536269514722
    else:
        # Inverse error function approximation
        z = math.sqrt(2.0) * math.erf(confidence)

    p = k / n
    z2 = z * z
    denom = 1.0 + z2 / n
    center = (p + z2 / (2.0 * n)) / denom
    spread = (z / denom) * math.sqrt((p * (1.0 - p) / n) + (z2 / (4.0 * n * n)))

    lower = max(0.0, center - spread)
    upper = min(1.0, center + spread)

    return (round(lower * 100.0, 3), round(upper * 100.0, 3))


def black_scholes(
    spot: float,
    strike: float,
    hours: float,
    iv: float,
    is_call: bool,
    r: float = 0.0
) -> float:
    """
    Black-Scholes theoretical option pricing with interest rate r (default r=0 for crypto spot).
    
    spot: current underlying spot price ($)
    strike: strike price ($)
    hours: time to expiration in hours
    iv: implied volatility as a decimal (e.g., 0.50 = 50% annual IV)
    is_call: True for Call, False for Put
    r: risk-free rate (annualized, default 0.0)

    Returns: theoretical option price in USD.
    """
    if spot <= 0 or strike <= 0 or hours <= 0 or iv <= 0:
        return 0.0

    T = hours / 8760.0  # Crypto trades 24/7/365 => 8760 hours per year
    sigma = iv
    sigma_sqrt_t = sigma * math.sqrt(T)

    if sigma_sqrt_t < 1e-12:
        if is_call:
            return max(0.0, spot - strike)
        else:
            return max(0.0, strike - spot)

    d1 = (math.log(spot / strike) + (r + 0.5 * sigma * sigma) * T) / sigma_sqrt_t
    d2 = d1 - sigma_sqrt_t

    discount = math.exp(-r * T)

    if is_call:
        price = spot * normal_cdf(d1) - strike * discount * normal_cdf(d2)
    else:
        price = strike * discount * normal_cdf(-d2) - spot * normal_cdf(-d1)

    return max(0.0, price)


def option_delta(
    spot: float,
    strike: float,
    hours: float,
    iv: float,
    is_call: bool,
    r: float = 0.0
) -> float:
    """Option Delta calculation for risk profiling."""
    if spot <= 0 or strike <= 0 or hours <= 0 or iv <= 0:
        return 0.0
    T = hours / 8760.0
    sigma_sqrt_t = iv * math.sqrt(T)
    if sigma_sqrt_t < 1e-12:
        return 1.0 if (is_call and spot >= strike) else 0.0
    d1 = (math.log(spot / strike) + (r + 0.5 * iv * iv) * T) / sigma_sqrt_t
    if is_call:
        return normal_cdf(d1)
    else:
        return normal_cdf(d1) - 1.0

