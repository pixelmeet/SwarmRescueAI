from fastapi import APIRouter
from app.db.mongo import get_database

router = APIRouter()

@router.get("")
@router.get("/")
async def get_analytics():
    db = get_database()

    # Fetch all emergency requests
    requests_cursor = db["emergency_requests"].find({})
    requests = await requests_cursor.to_list(length=1000)

    category_counts = {"fire": 0, "medical": 0, "trapped": 0, "flood": 0, "other": 0}
    severity_counts = {"low": 0, "medium": 0, "high": 0, "critical": 0}

    total_requests = len(requests)
    resolved_count = 0

    assign_diffs = []
    resolve_diffs = []

    for req in requests:
        cat = req.get("category", "other")
        if cat in category_counts:
            category_counts[cat] += 1
        else:
            category_counts["other"] += 1

        sev = req.get("severity", "medium")
        if sev in severity_counts:
            severity_counts[sev] += 1
        else:
            severity_counts["medium"] += 1

        if req.get("status") == "resolved":
            resolved_count += 1

        created_at = req.get("created_at")
        assigned_at = req.get("assigned_at")
        resolved_at = req.get("resolved_at")

        if created_at and assigned_at:
            try:
                diff_min = (assigned_at - created_at).total_seconds() / 60.0
                if diff_min >= 0:
                    assign_diffs.append(diff_min)
            except Exception:
                pass

        if assigned_at and resolved_at:
            try:
                diff_min = (resolved_at - assigned_at).total_seconds() / 60.0
                if diff_min >= 0:
                    resolve_diffs.append(diff_min)
            except Exception:
                pass

    avg_creation_to_assignment = round(sum(assign_diffs) / len(assign_diffs), 1) if assign_diffs else None
    avg_assignment_to_resolution = round(sum(resolve_diffs) / len(resolve_diffs), 1) if resolve_diffs else None

    # Calculate resource utilization across all collections
    teams = await db["rescue_teams"].find({}).to_list(length=1000)
    ambulances = await db["ambulances"].find({}).to_list(length=1000)
    hospitals = await db["hospitals"].find({}).to_list(length=1000)
    volunteers = await db["volunteers"].find({}).to_list(length=1000)

    total_resources = len(teams) + len(ambulances) + len(volunteers)
    busy_resources = sum(1 for r in teams + ambulances + volunteers if r.get("status") == "busy")

    resource_utilization_pct = round((busy_resources / total_resources) * 100, 1) if total_resources > 0 else 0.0

    return {
        "total_requests": total_requests,
        "resolved_requests": resolved_count,
        "avg_time_creation_to_assignment": avg_creation_to_assignment,
        "avg_time_assignment_to_resolution": avg_assignment_to_resolution,
        "request_count_by_category": category_counts,
        "request_count_by_severity": severity_counts,
        "resource_utilization_pct": resource_utilization_pct,
        "active_resources_count": total_resources,
        "has_sufficient_data": len(resolve_diffs) > 0,
    }
