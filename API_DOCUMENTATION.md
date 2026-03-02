# Facility Booking Mini-Project: Architecture & API Documentation

## 1. MVC Architecture Overview

This project is built using the **Model-View-Controller (MVC)** design pattern, implemented via the Laravel (PHP) backend framework and a decoupled React frontend.

### The Flow of Data
When a user interacts with the application (e.g., clicking "Book Now" on the React frontend), the following happens:
1.  **View (Frontend):** The React frontend captures the user input and dispatches an HTTP request (via Axios) to a specific Backend API endpoint.
2.  **Controller:** The Laravel router intercepts this request and directs it to the appropriate Controller (e.g., `BookingController@store`). The Controller acts as the "middleman." It receives the payload, validates the incoming data (ensuring the date and times are correct), and checks business logic (e.g., ensuring the facility isn't already booked or double-booked).
3.  **Model:** To fulfill the business logic, the Controller interacts with the Eloquent Models (e.g., `Booking`, `Facility`, `User`). These models represent the database tables and handle the actual data writing, reading, and relationship mapping (e.g., knowing that a `Booking` belongs to a `Facility` and a `User`).
4.  **Response:** Once the Model saves the new booking, it returns the data to the Controller. The Controller serializes this data into a JSON response and sends it back to the React View, which securely updates the UI.

---

## 2. Core API Endpoints

The backend is secured using Laravel Sanctum for API token authentication. Endpoints return JSON and utilize standard HTTP status codes (`200 OK`, `201 Created`, `401 Unauthorized`, `409 Conflict`).

### Authentication
#### Register User
*   **`POST /api/auth/register`**
*   **Description:** Registers a new standard user in the system.
*   **Body (JSON):** 
    ```json
    {
      "name": "Jane Doe",
      "email": "jane@example.com",
      "password": "password"
    }
    ```
*   **Returns (`201 Created`):** 
    ```json
    {
      "user": { "id": 1, "name": "Jane Doe", "email": "jane@example.com", "role": "user" },
      "token": "1|abc123def456..."
    }
    ```

#### Login User
*   **`POST /api/auth/login`**
*   **Description:** Authenticates a user and issues an API token.
*   **Body (JSON):** 
    ```json
    {
      "email": "jane@example.com",
      "password": "password"
    }
    ```
*   **Returns (`200 OK`):** User object and Bearer token.
*   **Returns (`401 Unauthorized`):** `{"message": "Invalid credentials."}`

---

### Facilities (Rooms)
#### List Facilities
*   **`GET /api/facilities`**
*   **Description:** Public endpoint to list all available rooms.
*   **Query Params (Optional):** `?building_id=1` (Filters rooms by a specific building).
*   **Returns (`200 OK`):** 
    ```json
    [
      {
        "id": 1,
        "name": "Conference Room A",
        "capacity": 20,
        "building": { "id": 1, "name": "Main Office" }
      }
    ]
    ```

#### List Available Time Slots
*   **`GET /api/facilities/{id}/slots?date=YYYY-MM-DD`**
*   **Description:** Returns 30-minute booking slots (from 06:00 to 22:00) for a specific room on a specific date.
*   **Returns (`200 OK`):** 
    ```json
    [
      { "start": "06:00", "end": "06:30", "status": "available" },
      { "start": "06:30", "end": "07:00", "status": "booked" }
    ]
    ```

---

### Bookings (Requires Authentication)
#### Get User Bookings
*   **`GET /api/bookings`**
*   **Description:** Retrieves a list of bookings. If accessed by a standard user, returns *only* their bookings. If accessed by an Admin, returns all bookings across the system.
*   **Returns (`200 OK`):** Array of Booking objects.

#### Create a Booking
*   **`POST /api/bookings`**
*   **Description:** Creates a new reservation. Confirms time availability to prevent double-booking.
*   **Body (JSON):** 
    ```json
    {
      "facility_id": 1,
      "user_id": 2,
      "date": "2026-10-15",
      "start_time": "14:00",
      "end_time": "15:00"
    }
    ```
*   **Returns (`201 Created`):** The created Booking object.
*   **Returns (`409 Conflict`):** `{"message": "The facility is already booked for this time slot."}`

#### Cancel Booking
*   **`DELETE /api/bookings/{id}`**
*   **Description:** Soft-cancels a booking by changing its status to `cancelled` rather than omitting the record completely.
*   **Returns (`200 OK`):** The updated Booking object.

---

### Administrator Operations (Requires Admin Role)
#### Dashboard Statistics
*   **`GET /api/admin/stats`**
*   **Description:** An aggregated dashboard endpoint summarizing system totals and recent activity. Heavily cached.
*   **Returns (`200 OK`):** 
    ```json
    {
      "total_bookings": 150,
      "total_facilities": 12,
      "open_complaints": 3,
      "recent_bookings": [ ... ]
    }
    ```

#### Manage Facilities & Buildings
*   **`POST /api/buildings`** / **`POST /api/facilities`**
*   **Description:** Allows the creation of new physical structures. 
*   **Returns (`201 Created`):** Automatically clears the relevant read-caches so users see the new rooms instantly.
