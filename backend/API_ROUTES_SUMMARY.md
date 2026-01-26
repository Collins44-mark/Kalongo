# API Routes Summary

All public API routes are now explicitly defined in `app.py` using `@app.route("/api/...")` decorators.

## Available API Endpoints

### Core Endpoints
- `GET /` - API status check
- `GET /health` - Health check with database status
- `GET /api/db/test` - Database connection test

### Public API Routes (All under `/api/`)

1. **Hero Slides**
   - `GET /api/hero-slides` - Get all active hero slides

2. **Rooms**
   - `GET /api/rooms` - Get all rooms with images

3. **Facilities**
   - `GET /api/facilities` - Get all facilities

4. **Activities**
   - `GET /api/activities` - Get all activities

5. **Pricing**
   - `GET /api/pricing` - Get all pricing categories with items

6. **Food**
   - `GET /api/food` - Get all food items

7. **Videos**
   - `GET /api/videos` - Get all videos

8. **Reviews**
   - `GET /api/reviews` - Get all reviews

9. **Settings**
   - `GET /api/settings` - Get all site settings

10. **Restaurant Menu**
    - `GET /api/restaurant-menu` - Get all restaurant menu categories with items

11. **Homepage Data (Combined)**
    - `GET /api/homepage-data` - Get combined homepage data (hero slides, rooms, facilities, reviews, settings) for faster loading

## Route Structure

All routes follow this pattern:
```python
@app.route("/api/endpoint-name")
def function_name():
    """Description"""
    s = get_session()
    try:
        # Database query and processing
        return jsonify(result)
    finally:
        s.close()
```

## Frontend Integration

The frontend (`frontend/js/api.js`) calls these endpoints using:
- Base URL: `https://kalongo.onrender.com/api` (production)
- Base URL: `http://localhost:5001/api` (local development)

All endpoints return JSON responses with proper error handling.

## Notes

- All routes use database sessions properly with try/finally blocks
- Routes are optimized with eager loading where needed (rooms, pricing, restaurant menu)
- All routes return JSON using `jsonify()`
- CORS is enabled for all routes to allow frontend access
