import React, { useState, useEffect } from "react";
import { Container, Form, Button, Card, Image, Row, Col } from 'react-bootstrap';
import "leaflet/dist/leaflet.css";
import LeafletMapComponent from "./componets/LeafletMapComponent";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "react-circular-progressbar/dist/styles.css";
import logo from './logo.svg'
import './App.css'






// Helper function to calculate distance using the Haversine formula
const haversineDistance = (coords1, coords2) => {
  const toRad = (value) => (value * Math.PI) / 180;

  const R = 6371; // Radius of the Earth in kilometers
  const lat1 = coords1.lat;
  const lon1 = coords1.lng;
  const lat2 = coords2.lat;
  const lon2 = coords2.lng;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers

  return distance;
};

// Helper function to format time duration
const formatDuration = (milliseconds) => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours}h ${minutes}m ${seconds}s`;
};

function App() {
  const [weeklyGoal, setWeeklyGoal] = useState(() => {
    // Load from localStorage, fallback to default value if null
    return parseFloat(localStorage.getItem("weeklyGoal")) || 40;
  });
  const [dailyGoal, setDailyGoal] = useState(() => {
    return parseFloat(localStorage.getItem("dailyGoal")) || 5;
  });
  const [distanceCovered, setDistanceCovered] = useState(0); // Distance covered in kilometers
  const [route, setRoute] = useState([]); // Store the running route
  const [userLocation, setUserLocation] = useState({ lng: 0, lat: 0  }); // Default location
  const [prevLocation, setPrevLocation] = useState(null); // To store the previous location
  const [isTracking, setIsTracking] = useState(false);
  const [isSessionEnded, setIsSessionEnded] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [progress, setProgress] = useState(0); // Track progress
  const [inputError, setInputError] = useState(""); // For input validation messages
  const [endTime, setEndTime] = useState(null); // Track the end time of the session
  const [watchId, setWatchId] = useState(null); // Store watch ID

  // Validate the goal input and set error message if needed
  const validateInput = (value) => {
    if (isNaN(value) || value <= 0) {
      return false;
    }
    return true;
  };

  // Update weekly goal with validation
  const handleWeeklyGoalChange = (e) => {
    const value = parseFloat(e.target.value);
    if (!validateInput(value)) {
      setInputError("Please enter a valid number greater than 0 for weekly goal.");
    } else {
      setInputError("");
      setWeeklyGoal(value);
      localStorage.setItem("weeklyGoal", value); // Save to localStorage
    }
  };

  // Update daily goal with validation
  const handleDailyGoalChange = (e) => {
    const value = parseFloat(e.target.value);
    if (!validateInput(value)) {
      setInputError("Please enter a valid number greater than 0 for daily goal.");
    } else {
      setInputError("");
      setDailyGoal(value);
      localStorage.setItem("dailyGoal", value); // Save to localStorage
    }
  };

  // Function to start GPS tracking
  const startTracking = () => {
    if (navigator.geolocation) {
      setIsTracking(true);
      setIsSessionEnded(false); // Reset session ended state
      setStartTime(new Date()); // Record the start time when tracking begins
      setEndTime(null); // Reset the end time for the new session
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newLocation = { lat: latitude, lng: longitude };

          if (prevLocation) {
            const distance = haversineDistance(prevLocation, newLocation);
            setDistanceCovered((prevDistance) => prevDistance + distance);
          }

          setPrevLocation(newLocation); // Update previous location
          setUserLocation(newLocation); // Update current location
          setRoute((prevRoute) => [...prevRoute, newLocation]); // Update the route for the polyline
        },
        (error) => console.error(error),
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 10000,
        }
      );
      setWatchId(id); // Store watch ID
    }
  };

  // Update the progress circle based on distance covered and daily goal
  useEffect(() => {
    const progressPercentage = Math.min(
      (distanceCovered / dailyGoal) * 100,
      100
    );
    setProgress(progressPercentage);
  }, [distanceCovered, dailyGoal]);

  // Stop GPS tracking
  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setIsTracking(false); // Reset tracking status
    }
  };

  const endSession = () => {
    stopTracking(); // Stop GPS tracking
    setEndTime(new Date()); // Record the end time when the session ends
    setIsSessionEnded(true); // Mark session as ended
  };

  // Function to reset the tracking session
  const resetSession = () => {
    // Stop geolocation watch if it's running
    if (navigator.geolocation && watchId !== null) {
      navigator.geolocation.clearWatch(watchId); // Clear any active geolocation watch
      setWatchId(null); // Reset the watchId state
    }
    setDistanceCovered(0);
    setRoute([]);
    setProgress(0);
    setIsSessionEnded(false);
    setIsTracking(false);
    setStartTime(null);
    setEndTime(null);
    setPrevLocation(null); // Reset previous location to avoid inaccurate calculations
  };

  // Calculate the duration of the session
  const getSessionDuration = () => {
    if (startTime && endTime) {
      const duration = endTime - startTime; // In milliseconds
      return formatDuration(duration); // Convert milliseconds to hh:mm:ss
    }
    return "0h 0m 0s";
  };

  return (
    <Container className="my-4 py-4">
      {/* Card for Logo and App Title */}
      <Card className="text-center shadow-sm p-3 mb-4">
        <Card.Body>
          <Image src={logo} width={100} height={100} alt="logo" rounded className="mb-3" />
          <Card.Title as="h1" className="text-primary">Jogging Tracker</Card.Title>
          <Card.Text className="text-muted">Track your runs and set goals effortlessly</Card.Text>
        </Card.Body>
      </Card>

      {/* Card for Goals Inputs */}
      <Card className="shadow-sm p-3 mb-4">
        <Card.Body>
          <h2>Set Your Weekly and Daily Goals</h2>
          <Form>
            {/* Weekly Goal Input */}
            <Form.Group as={Row} className="mb-3" controlId="formWeeklyGoal">
              <Form.Label column sm="4" className="text-end">
                Weekly Goal (km):
              </Form.Label>
              <Col sm="6">
                <Form.Control
                  type="number"
                  step="0.1" // Allow decimal input
                  inputMode="decimal" // Mobile optimization to bring numeric keyboard
                  value={weeklyGoal}
                  onChange={handleWeeklyGoalChange}
                  min="1"
                  className="text-center"
                  isInvalid={inputError !== ""}
                />
              </Col>
            </Form.Group>

            {/* Daily Goal Input */}
            <Form.Group as={Row} className="mb-3" controlId="formDailyGoal">
              <Form.Label column sm="4" className="text-end">
                Daily Goal (km):
              </Form.Label>
              <Col sm="6">
                <Form.Control
                  type="number"
                  step="0.1"
                  inputMode="decimal"
                  value={dailyGoal}
                  onChange={handleDailyGoalChange}
                  min="1"
                  className="text-center"
                  isInvalid={inputError !== ""}
                />
                {inputError && <Form.Control.Feedback type="invalid">{inputError}</Form.Control.Feedback>}
              </Col>
            </Form.Group>
          </Form>
        </Card.Body>
      </Card>

      {/* Tracking Actions */}
      <Card className="shadow-sm p-3 mb-4 text-center">
        <Card.Body>
          {!isSessionEnded ? (
            <div className="d-flex justify-content-center">
              <Button
                variant="success"
                size="lg"
                className="me-3"
                onClick={startTracking}
                disabled={isTracking}
              >
                <i className="fas fa-play me-2"></i>Start Tracking
              </Button>
              <Button
                variant="danger"
                size="lg"
                className="me-3"
                onClick={stopTracking}
                disabled={!isTracking}
              >
                <i className="fas fa-stop me-2"></i>Stop Tracking
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={endSession}
                disabled={!isTracking}
              >
                <i className="fas fa-flag-checkered me-2"></i>End Session
              </Button>
            </div>
          ) : (
            <Button variant="dark" size="lg" onClick={resetSession}>
              <i className="fas fa-sync-alt me-2"></i>Start New Session
            </Button>
          )}
        </Card.Body>
      </Card>

      {/* Progress Circle */}
      <Card className="shadow-sm p-3 mb-4">
        <Card.Body className="text-center">
          <div style={{ width: 150, height: 150, margin: "0 auto" }}>
            <CircularProgressbar
              value={progress}
              text={`${Math.round(progress)}%`}
              styles={buildStyles({
                pathColor: progress >= 100 ? "green" : "orange",
                textColor: "green",
                trailColor: "#d6d6d6",
              })}
            />
          </div>
          <h3 className="mt-3">Distance Covered: {distanceCovered.toFixed(2)} km</h3>
          <p className="text-muted">
            {distanceCovered.toFixed(2)} km out of {dailyGoal} km
          </p>
        </Card.Body>
      </Card>

      {/* Map and Distance Stats */}
      <Card className="shadow-sm p-3">
        <Card.Body>
          <LeafletMapComponent userLocation={userLocation} route={route} />
          <div className="mt-4 text-center">
            <h4>Session Duration: {getSessionDuration()}</h4>
            <p className="text-muted">Track your distance and view your route on the map.</p>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

export default App;