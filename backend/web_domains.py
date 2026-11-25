"""Classify DNS hostnames using the bundled registry suffix list."""

from functools import lru_cache

from tldextract import TLDExtract


# Hosting-provider suffixes such as fastly-edge.com are registrable domains here.
extract = TLDExtract(
    suffix_list_urls=(), cache_dir=None, include_psl_private_domains=False
)


@lru_cache(maxsize=16384)
def is_bare_or_www(hostname: str) -> bool:
    parts = extract(hostname)
    if not parts.domain or not parts.suffix:
        return False

    registered_domain = f"{parts.domain}.{parts.suffix}"
    return hostname in (registered_domain, f"www.{registered_domain}")
