def calculate_assignment_score(distance_km: float, team_capacity: int, severity_weight: float) -> float:
    """
    Weighted assignment algorithm placeholder for matching requests to available response units.
    """
    score = (1.0 / (distance_km + 0.1)) * 0.5 + (team_capacity * 0.2) + (severity_weight * 0.3)
    return round(score, 4)
