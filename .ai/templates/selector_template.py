"""YusBuild AI selector template

Use this template to add read/query scoping logic.

Rules:
- Selectors implement visibility scoping (project membership).
- Views must call selectors for get_queryset().
- Do not implement business workflow transitions here.
"""

from __future__ import annotations

from django.contrib.auth import get_user_model
from django.db.models import QuerySet


def visible_<entity>_queryset(user) -> QuerySet:
    """Return a visibility-scoped queryset for `<entity>`.

    This function must apply the repository's visibility rules (project membership).
    """

    # 1) Superuser/admin shortcut (follow existing patterns in the domain selectors).
    # 2) Otherwise filter via project membership joins.
    # 3) Apply ORM optimization:
    #    - select_related / prefetch_related
    #    - distinct where join-heavy

    # return <EntityModel>.objects.filter(...)
    raise NotImplementedError

