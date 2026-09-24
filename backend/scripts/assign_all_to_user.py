"""
Reassign every scan and comparison to a single user.

Usage:
    python -m backend.scripts.assign_all_to_user --email demo@yourdomain.com

Options:
    --email        The target user's email. Must already be registered.
    --dry-run      Print what would change without writing.

The script:
  1. Looks up the user by email (must be verified).
  2. Updates every document in `scans` to set owner_id to that user's user_id.
  3. Updates every document in `comparisons` to set owner_id to that user's user_id.
  4. Prints a summary.
"""

import argparse
import sys

from backend.persistence.database import (
    get_collection,
    get_comparisons_collection,
    get_users_collection,
)


def main() -> int:
    parser = argparse.ArgumentParser(description="Reassign all data to one user.")
    parser.add_argument(
        "--email",
        required=True,
        help="Email of the target user. Must already exist in the users collection.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print what would change without writing.",
    )
    args = parser.parse_args()

    target_email = args.email.strip().lower()

    users = get_users_collection()
    user = users.find_one({"email_lower": target_email}, {"_id": 0})
    if user is None:
        print(f"ERROR: No user found with email '{target_email}'.")
        print("Register this user first, then re-run this script.")
        return 1

    if not user.get("is_verified"):
        print(
            f"WARNING: User '{target_email}' is not verified. "
            "They will still be assigned the data, but cannot log in until verified."
        )

    owner_id = user["user_id"]
    print(f"Target user: {target_email}  (user_id: {owner_id})")

    scans = get_collection()
    comparisons = get_comparisons_collection()

    scan_count = scans.count_documents({})
    comparison_count = comparisons.count_documents({})

    print(f"Found {scan_count} scan(s) and {comparison_count} comparison(s).")

    if args.dry_run:
        print()
        print("DRY RUN — no writes performed.")
        sample_scans = list(scans.find({}, {"_id": 0, "scan_id": 1, "owner_id": 1}).limit(5))
        sample_comparisons = list(
            comparisons.find({}, {"_id": 0, "comparison_id": 1, "owner_id": 1}).limit(5)
        )
        print("Sample scans:", sample_scans)
        print("Sample comparisons:", sample_comparisons)
        return 0

    scan_result = scans.update_many(
        {"owner_id": {"$ne": owner_id}},
        {"$set": {"owner_id": owner_id}},
    )
    comparison_result = comparisons.update_many(
        {"owner_id": {"$ne": owner_id}},
        {"$set": {"owner_id": owner_id}},
    )

    print()
    print(f"Scans modified:        {scan_result.modified_count}")
    print(f"Comparisons modified:  {comparison_result.modified_count}")
    print()
    print(f"All data now belongs to {target_email}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())