"""Regression tests for exact bare-domain and www query classification."""

import pytest

from web_domains import is_bare_or_www


@pytest.mark.parametrize(
    ("hostname", "expected"),
    [
        ("fastly-edge.com", True),
        ("www.fastly-edge.com", True),
        ("apple-relay.fastly-edge.com", False),
        ("www.apple-relay.fastly-edge.com", False),
        ("example.co.uk", True),
        ("www.example.co.uk", True),
        ("cdn.example.co.uk", False),
        ("www.cdn.example.co.uk", False),
        ("co.uk", False),
        ("localhost", False),
        ("127.0.0.1", False),
    ],
)
def test_is_bare_or_www(hostname, expected):
    assert is_bare_or_www(hostname) is expected
