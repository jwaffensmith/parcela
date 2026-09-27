from datetime import date
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class ListingStatus(str, Enum):
    ACTIVE = "active"
    PENDING = "pending"
    SOLD = "sold"


class ApiModel(BaseModel):
    """snake_case in Python, camelCase on the wire — both feeds and clients use camelCase."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class Listing(ApiModel):
    """One property as it arrives from an MLS feed.

    Frozen because a feed row is a fact: nothing downstream may edit what a feed reported.
    """

    model_config = ConfigDict(frozen=True)

    id: str
    source: str
    address: str
    city: str
    state: str
    zip: str
    price: float
    bedrooms: int
    bathrooms: float
    sqft: int
    latitude: float
    longitude: float
    listed_date: date
    status: ListingStatus
    description: str


class DuplicateRef(ApiModel):
    """The same property as another feed listed it."""

    source: str
    id: str
    price: float


class MergedListing(Listing):
    duplicates: list[DuplicateRef] = Field(default_factory=list)


class ScoredListing(MergedListing):
    relevance_score: float


class SearchResponse(ApiModel):
    total: int
    page: int
    page_size: int
    total_pages: int
    results: list[ScoredListing]


class HealthResponse(ApiModel):
    status: str


class IndexResponse(ApiModel):
    service: str
    docs: str
    health: str
    search: str
