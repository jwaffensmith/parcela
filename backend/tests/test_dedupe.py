from datetime import date

from dedupe import deduplicate, property_key, unit_token
from factories import listing


def test_one_property_per_coordinate_and_shape() -> None:
    assert property_key(listing(id="a")) == property_key(listing(id="b", source="MLS_B"))


def test_coordinate_rounding_noise_between_feeds_does_not_prevent_a_merge() -> None:
    both = [
        listing(id="a", latitude=38.78930, longitude=-77.18730),
        listing(id="b", source="MLS_B", latitude=38.7893001, longitude=-77.1873001),
    ]

    assert len(deduplicate(both)) == 1


def test_homes_a_street_apart_are_not_merged_by_the_rounding() -> None:
    assert property_key(listing(latitude=38.7893)) != property_key(listing(latitude=38.7903))


def test_separate_units_at_one_address_stay_separate() -> None:
    upstairs = listing(id="a", sqft=980, bedrooms=2)
    downstairs = listing(id="b", sqft=1400, bedrooms=3)

    assert property_key(upstairs) != property_key(downstairs)


def test_nothing_to_merge_leaves_the_list_alone() -> None:
    listings = [listing(id="a"), listing(id="b", latitude=39.0)]

    assert len(deduplicate(listings)) == 2


def test_an_empty_feed_merges_to_nothing() -> None:
    assert deduplicate([]) == []


def test_the_same_home_from_two_feeds_becomes_one_result() -> None:
    both = [
        listing(id="A1", source="MLS_A", address="55 Elm Ct"),
        listing(id="B7", source="MLS_B", address="55 Elm Court"),
    ]

    assert len(deduplicate(both)) == 1


def test_differing_addresses_do_not_prevent_a_merge() -> None:
    both = [
        listing(id="A1", address="123 Main St, Apt 4B", zip="22150"),
        listing(id="B7", source="MLS_B", address="123 Main Street, Unit 4B", zip="22151"),
    ]

    assert len(deduplicate(both)) == 1


def test_one_feed_posting_the_same_home_twice_also_merges() -> None:
    """Matching is on the property, not on the pair of feeds that happened to list it."""
    twice = [
        listing(id="A1", source="MLS_A", address="55 Elm Ct"),
        listing(id="A9", source="MLS_A", address="55 Elm Court"),
    ]

    assert len(deduplicate(twice)) == 1


def test_two_units_in_one_building_are_not_merged_across_feeds() -> None:
    both = [
        listing(id="A1", source="MLS_A", address="1 Tower Rd, Apt 2", sqft=900),
        listing(id="B1", source="MLS_B", address="1 Tower Rd, Apt 5", sqft=1200),
    ]

    assert len(deduplicate(both)) == 2


def test_identical_floor_plans_in_one_building_stay_separate() -> None:
    both = [
        listing(id="a", address="1 Tower Rd, Apt 4B"),
        listing(id="b", source="MLS_B", address="1 Tower Rd, Apt 5C"),
    ]

    assert len(deduplicate(both)) == 2


def test_apt_unit_and_hash_all_name_the_same_unit() -> None:
    assert (
        unit_token("123 Main St, Apt 4B")
        == unit_token("123 Main Street, Unit 4B")
        == unit_token("123 Main St #4B")
        == "4b"
    )


def test_unit_matching_ignores_case() -> None:
    both = [
        listing(id="a", address="1 Tower Rd, APT 4B"),
        listing(id="b", source="MLS_B", address="1 Tower Rd, apt 4b"),
    ]

    assert len(deduplicate(both)) == 1


def test_an_address_without_a_unit_has_no_token() -> None:
    assert unit_token("55 Elm Ct") is None


def test_a_street_suffix_is_not_mistaken_for_a_unit() -> None:
    assert unit_token("480 Spring Street") is None


def test_a_listing_with_a_unit_never_merges_with_one_lacking_it() -> None:
    both = [
        listing(id="a", address="123 Main St, Apt 4B"),
        listing(id="b", source="MLS_B", address="123 Main St"),
    ]

    assert len(deduplicate(both)) == 2


def test_the_cheaper_listing_is_the_one_kept() -> None:
    merged = deduplicate(
        [
            listing(id="dear", source="MLS_A", price=470_000),
            listing(id="cheap", source="MLS_B", price=465_000),
        ]
    )

    assert merged[0].id == "cheap"


def test_the_pricier_listing_is_kept_as_a_duplicate() -> None:
    merged = deduplicate(
        [
            listing(id="dear", source="MLS_A", price=470_000),
            listing(id="cheap", source="MLS_B", price=465_000),
        ]
    )

    assert [(d.source, d.id, d.price) for d in merged[0].duplicates] == [
        ("MLS_A", "dear", 470_000)
    ]


def test_matching_prices_are_broken_by_the_more_recent_listing() -> None:
    merged = deduplicate(
        [
            listing(id="stale", listed_date="2026-01-01"),
            listing(id="fresh", source="MLS_B", listed_date="2026-09-01"),
        ]
    )

    assert merged[0].id == "fresh"


def test_a_property_listed_once_carries_no_duplicates() -> None:
    assert deduplicate([listing()])[0].duplicates == []


def test_three_feeds_collapse_to_one_result_with_two_duplicates() -> None:
    merged = deduplicate(
        [
            listing(id="a", source="MLS_A", price=470_000),
            listing(id="b", source="MLS_B", price=465_000),
            listing(id="c", source="MLS_C", price=480_000),
        ]
    )

    assert len(merged) == 1
    assert len(merged[0].duplicates) == 2


def test_merging_preserves_the_order_the_feed_supplied() -> None:
    merged = deduplicate(
        [
            listing(id="first", latitude=38.0),
            listing(id="second", latitude=39.0),
            listing(id="third", latitude=40.0),
        ]
    )

    assert [entry.id for entry in merged] == ["first", "second", "third"]


def test_the_kept_listing_keeps_its_own_details() -> None:
    merged = deduplicate(
        [
            listing(id="A1", source="MLS_A", price=470_000, description="Painted."),
            listing(id="B7", source="MLS_B", price=465_000, description="Renovated."),
        ]
    )

    assert merged[0].description == "Renovated."


def test_listed_dates_survive_the_merge() -> None:
    merged = deduplicate([listing(listed_date="2026-08-29")])

    assert merged[0].listed_date == date(2026, 8, 29)
