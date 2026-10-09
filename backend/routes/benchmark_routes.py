from fastapi import APIRouter
from ..benchmarks.test_suite import run_benchmark_suite

router = APIRouter(prefix="/api/benchmark", tags=["Benchmark & Correctness Suite"])

@router.post("/run")
async def run_benchmark():
    """Runs the full correctness, ambiguity detection, and security guardrail test suite."""
    results = await run_benchmark_suite()
    return results
