"""
Unit Tests for Statistical Mathematics and Financial Formulas.
Verifies against hand-calculated analytical benchmarks.
"""

import pytest
import math
from api.stats import normal_cdf, wilson_score_interval, black_scholes, option_delta


def test_normal_cdf():
    # N(0) = 0.5
    assert math.isclose(normal_cdf(0.0), 0.5, abs_tol=1e-7)
    # N(1.95996) ≈ 0.975 (97.5%)
    assert math.isclose(normal_cdf(1.95996398), 0.975, abs_tol=1e-4)
    # N(-1.95996) ≈ 0.025
    assert math.isclose(normal_cdf(-1.95996398), 0.025, abs_tol=1e-4)


def test_wilson_score_interval_hand_calc():
    # Hand calculation: k=5, n=100, 95% confidence
    # p_hat = 0.05
    # center ≈ 0.0666, spread ≈ 0.0451 => lower ≈ 2.155%, upper ≈ 11.175%
    lower, upper = wilson_score_interval(5, 100, confidence=0.95)
    assert math.isclose(lower, 2.155, abs_tol=0.05)
    assert math.isclose(upper, 11.175, abs_tol=0.05)

    # Edge case: zero touches (k=0, n=100)
    lower_zero, upper_zero = wilson_score_interval(0, 100, confidence=0.95)
    assert lower_zero == 0.0
    assert math.isclose(upper_zero, 3.69, abs_tol=0.1)

    # Edge case: 100% touches (k=100, n=100)
    lower_full, upper_full = wilson_score_interval(100, 100, confidence=0.95)
    assert math.isclose(lower_full, 96.31, abs_tol=0.1)
    assert upper_full == 100.0


def test_black_scholes_atm_hand_calc():
    # Benchmark: S = 100, K = 100, T = 1 yr (8760h), iv = 0.20, r = 0.0
    # Theoretical Call price = 100 * (N(0.1) - N(-0.1)) ≈ 7.96556
    call_price = black_scholes(spot=100.0, strike=100.0, hours=8760.0, iv=0.20, is_call=True, r=0.0)
    put_price = black_scholes(spot=100.0, strike=100.0, hours=8760.0, iv=0.20, is_call=False, r=0.0)

    assert math.isclose(call_price, 7.96556, abs_tol=1e-3)
    # Put-call parity for S=K, r=0: C == P
    assert math.isclose(call_price, put_price, abs_tol=1e-6)


def test_black_scholes_crypto_scale():
    # Spot BTC = $70,000, 6h hold, IV = 0.50
    # ATM Call (Strike = 70,000)
    atm_call = black_scholes(spot=70000.0, strike=70000.0, hours=6.0, iv=0.50, is_call=True)
    # S * (N(d1) - N(d2)), d1 = 0.5 * 0.0130856 ≈ 0.00654
    assert atm_call > 0.0
    assert 300.0 < atm_call < 450.0  # expected ~365 USD

    # Far OTM Call (Strike = 75,000 -> +7.1% away)
    otm_call = black_scholes(spot=70000.0, strike=75000.0, hours=6.0, iv=0.50, is_call=True)
    assert otm_call < 1.0  # near 0 for 6h expiry


def test_option_delta():
    # ATM Call delta should be slightly > 0.5 (due to 0.5 * sigma^2 term)
    delta_call = option_delta(100.0, 100.0, 8760.0, 0.20, is_call=True)
    assert 0.50 < delta_call < 0.55

    # ATM Put delta should be slightly > -0.5
    delta_put = option_delta(100.0, 100.0, 8760.0, 0.20, is_call=False)
    assert -0.50 < delta_put < -0.45
    # Call Delta - Put Delta = 1.0
    assert math.isclose(delta_call - delta_put, 1.0, abs_tol=1e-6)

