"""
Management command to seed pile type configurations.

Run: python manage.py seed_pile_types

Populates the database with reinforcement configurations
reverse-engineered from TECON Construction Excel sheets.
"""

import logging

from django.core.management.base import BaseCommand

from apps.piles.models import PileTypeConfiguration

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Seed pile type configurations from TECON Excel data"

    def handle(self, *args, **options):
        self.stdout.write("Seeding pile type configurations...")

        configs = [
            {
                "pile_type": "TYPE_I",
                "description": (
                    "Type I piles - Typically test piles or minimal reinforcement. "
                    "Reinforcement configuration varies by project requirements."
                ),
                "main_bar_sections": [
                    {
                        "bar_size": 16,
                        "length_per_bar_m": 12.0,
                        "count": 6,
                        "section_name": "full_length",
                    },
                ],
                "lap_length_m": 0.0,
                "helix_bar_size_mm": 8,
                "helix_pitch_mm": 250,
                "cage_diameter_mm": 480,
                "helix_end_turns": 8,
                "stiffener_bar_size_mm": 16,
                "stiffener_ring_diameter_mm": 543.6,
                "stiffener_spacing_m": 2.5,
                "concrete_cover_mm": 20,
            },
            {
                "pile_type": "TYPE_II",
                "description": (
                    "Type II piles - Full reinforcement with lapped main bars. "
                    "Y16 bottom full cage + Y25 top short piece. "
                    "Verified against TECON Excel: 662.52 kg steel per pile."
                ),
                "main_bar_sections": [
                    {
                        "bar_size": 16,
                        "length_per_bar_m": 15.78,
                        "count": 10,
                        "section_name": "full_cage_y16",
                    },
                    {
                        "bar_size": 25,
                        "length_per_bar_m": 8.74,
                        "count": 10,
                        "section_name": "short_piece_y25",
                    },
                ],
                "lap_length_m": 1.2,
                "helix_bar_size_mm": 8,
                "helix_pitch_mm": 250,
                "cage_diameter_mm": 480,
                "helix_end_turns": 8,
                "stiffener_bar_size_mm": 16,
                "stiffener_ring_diameter_mm": 543.6,
                "stiffener_spacing_m": 2.5,
                "concrete_cover_mm": 20,
            },
            {
                "pile_type": "TYPE_III",
                "description": (
                    "Type III piles - Enhanced reinforcement for heavier loads. "
                    "Typically larger bar sizes and/or higher bar counts. "
                    "Verified against TECON Excel: ~695 kg steel per pile."
                ),
                "main_bar_sections": [
                    {
                        "bar_size": 16,
                        "length_per_bar_m": 15.78,
                        "count": 10,
                        "section_name": "full_cage_y16",
                    },
                    {
                        "bar_size": 25,
                        "length_per_bar_m": 8.74,
                        "count": 10,
                        "section_name": "short_piece_y25",
                    },
                ],
                "lap_length_m": 1.2,
                "helix_bar_size_mm": 8,
                "helix_pitch_mm": 250,
                "cage_diameter_mm": 480,
                "helix_end_turns": 8,
                "stiffener_bar_size_mm": 16,
                "stiffener_ring_diameter_mm": 543.6,
                "stiffener_spacing_m": 2.0,
                "concrete_cover_mm": 20,
            },
        ]

        created_count = 0
        updated_count = 0

        for config_data in configs:
            config, created = PileTypeConfiguration.objects.update_or_create(
                pile_type=config_data["pile_type"],
                defaults=config_data,
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"  Created {config.pile_type}"))
            else:
                updated_count += 1
                self.stdout.write(self.style.NOTICE(f"  Updated {config.pile_type}"))

        self.stdout.write(
            self.style.SUCCESS(
                f"\nDone! Created {created_count}"
                f", Updated {updated_count} configurations."
            )
        )
