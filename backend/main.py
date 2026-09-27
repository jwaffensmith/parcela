import logging
from typing import Optional

from fastapi import FastAPI, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from models import HealthResponse, IndexResponse, ListingStatus, SearchResponse
from search import DEFAULT_PAGE, DEFAULT_PAGE_SIZE, search
from validation import SearchError

ALLOWED_ORIGINS = ("http://localhost:5173", "http://localhost:3000")
BAD_REQUEST = 400
INTERNAL_ERROR = 500

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Parcela API",
    description="Search property listings ingested from multiple MLS feeds.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(ALLOWED_ORIGINS),
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/", response_model=IndexResponse)
def index() -> IndexResponse:
    return IndexResponse(
        service="Parcela API",
        docs="/docs",
        health="/health",
        search="/search",
    )


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok")


@app.get("/search", response_model=SearchResponse)
def search_listings(
    min_price: Optional[float] = Query(
        None, alias="minPrice", description="Lowest acceptable price"
    ),
    max_price: Optional[float] = Query(
        None, alias="maxPrice", description="Highest acceptable price"
    ),
    min_bedrooms: Optional[int] = Query(
        None, alias="minBedrooms", description="Fewest acceptable bedrooms"
    ),
    city: Optional[str] = Query(None, description="City name, matched case-insensitively"),
    keyword: Optional[str] = Query(
        None, description="Case-insensitive substring matched against the description"
    ),
    target_budget: Optional[float] = Query(
        None, alias="targetBudget", description="Budget the results are ranked against"
    ),
    status: Optional[ListingStatus] = Query(
        None, description="Restrict to one status; sold listings are excluded by default"
    ),
    page: int = Query(DEFAULT_PAGE, description="1-based page number"),
    page_size: int = Query(
        DEFAULT_PAGE_SIZE, alias="pageSize", description="Results per page"
    ),
) -> SearchResponse:
    return search(
        min_price=min_price,
        max_price=max_price,
        min_bedrooms=min_bedrooms,
        city=city,
        keyword=keyword,
        target_budget=target_budget,
        status=status,
        page=page,
        page_size=page_size,
    )


def error_response(status_code: int, message: str) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"detail": message})


@app.exception_handler(SearchError)
async def handle_search_error(_request: Request, exc: SearchError) -> JSONResponse:
    return error_response(BAD_REQUEST, str(exc))


@app.exception_handler(RequestValidationError)
async def handle_malformed_params(
    _request: Request, exc: RequestValidationError
) -> JSONResponse:
    detail = "; ".join(
        f"{error['loc'][-1]}: {error['msg']}" for error in exc.errors()
    )
    return error_response(BAD_REQUEST, detail)


@app.exception_handler(Exception)
async def handle_unexpected_error(_request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled error while serving request", exc_info=exc)
    return error_response(INTERNAL_ERROR, "Internal server error")
