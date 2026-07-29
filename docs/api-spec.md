# SwarmRescue AI - API Specification

## Base URL

- **Backend API:** `http://localhost:8000/api/v1`
- **Frontend Internal API:** `http://localhost:3000/api`

## Endpoint Summary

### Requests Router (`/api/v1/requests`)
- `POST /` - Submit an emergency request.
- `GET /` - List active emergency requests.
- `GET /{id}` - Get emergency request details.
- `PATCH /{id}/status` - Update emergency request status.

### Teams Router (`/api/v1/teams`)
- `GET /` - List rescue teams.
- `POST /` - Register a rescue team.
- `PATCH /{id}/location` - Update team live coordinates.

### Ambulances Router (`/api/v1/ambulances`)
- `GET /` - List available ambulances.
- `PATCH /{id}/status` - Update ambulance dispatch status.

### Hospitals Router (`/api/v1/hospitals`)
- `GET /` - List partner hospitals and capacity.

### Volunteers Router (`/api/v1/volunteers`)
- `GET /` - List nearby registered volunteers.

### Assignments Router (`/api/v1/assignments`)
- `POST /auto-assign` - Trigger automatic weighted dispatch assignment.
- `POST /manual-override` - Manually assign team/ambulance to request.

### Auth Router (`/api/v1/auth`)
- `POST /login` - Responder/Admin login.
- `POST /refresh` - Token refresh.

### WebSockets (`/ws`)
- `WS /ws/live-feed` - Real-time position updates and incident queue broadcast.
