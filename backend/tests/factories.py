from models import Listing, ListingStatus

BASE_LISTING = {
    "id": "X1",
    "source": "MLS_A",
    "address": "123 Main St, Apt 4B",
    "city": "Springfield",
    "state": "VA",
    "zip": "22150",
    "price": 450_000,
    "bedrooms": 3,
    "bathrooms": 1.5,
    "sqft": 980,
    "latitude": 38.7893,
    "longitude": -77.1873,
    "listed_date": "2026-08-01",
    "status": ListingStatus.ACTIVE,
    "description": "Bright condo with a garage.",
}


def listing(**overrides: object) -> Listing:
    """A valid listing, so each test states only the fields it cares about."""
    return Listing.model_validate({**BASE_LISTING, **overrides})
