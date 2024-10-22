import React, { useState, useEffect } from "react";
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import "leaflet/dist/leaflet.css";
import LeafletMapComponent from "./componets/LeafletMapComponent";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import 'leaflet/dist/leaflet.css';
import Image from 'react-bootstrap/Image';
import logo from './logo.svg'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import './index.css'






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
    return parseFloat(localStorage.getItem("weeklyGoal")) || 5;
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
      navigator.geolocation.watchPosition(
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
  maximumAge: 30000,
  timeout: 27000,
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
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

  const stopTracking = () => {
    setIsTracking(false);
    setPrevLocation(null); // Reset previous location
  };

  const endSession = () => {
    stopTracking(); // Stop GPS tracking
    setEndTime(new Date()); // Record the end time when the session ends
    setIsSessionEnded(true); // Mark session as ended
  };

  // Function to reset the tracking session
  const resetSession = () => {
    setDistanceCovered(0);
    setRoute([]);
    setProgress(0);
    setIsSessionEnded(false);
    setIsTracking(false);
    setStartTime(null);
    setEndTime(null);
  };

   // Calculate the duration of the session
   const getSessionDuration = () => {
    if (startTime && endTime) {
      const duration = endTime - startTime; // In milliseconds
      return formatDuration(duration); // Convert milliseconds to hh:mm:ss
    }
    return "0h 0m 0s";
  }

  return (
    <Container className="container-sm text-center p-4 btn btn-light">
       <Card className="">
       <Image src={logo} width={171}
        height={180} rounded alt="logo" className="text-primary mx-auto text-center px-3"/>
       
       
  
    <div className="App">
    
       
      <h1>Jogging Tracker</h1>
      <div>
      
      
        <p>Set Your Weekly and Daily Goals</p>
        {/* Input fields for weekly and daily goals with validation */}
        <Form className="align-items-center">
        <Form.Group className="mb-2" as={Row} controlId="formWeeklyGoal">
        <Form.Label>
          Weekly Goal (km)
          </Form.Label>
          <Col sm="10">
          <input className="text-dark text-center"
            type="number"
            value={weeklyGoal}
            onChange={handleWeeklyGoalChange}
            min="1"
            />
          </Col>
          
          </Form.Group>
        <br />
        <Form.Group className="mb-2" as={Row} controlId="formDailyGoal">
        <Form.Label >
          Daily Goal (km)
          </Form.Label>
          <Col sm="10">
          <input className=" text-dark text-center" 
            type="number"
            value={dailyGoal}
            onChange={handleDailyGoalChange}
            min="1"
          />
          </Col>
        </Form.Group>
        </Form>
        <br />
        {inputError && <p style={{ color: "red" }}>{inputError}</p>}
        <div>
        {!isSessionEnded && (
          <>
            <Button variant="success" size="lg" className="me-2"  onClick={startTracking} disabled={isTracking}>
              Start Tracking
            </Button>
            
            <Button variant="danger" size="lg" className="me-2" onClick={stopTracking} disabled={!isTracking}>
              Stop Tracking
            </Button>
            <Button variant="secondary" size="lg" onClick={endSession} disabled={!isTracking}>
              End Session
            </Button>
          </>
        )}
        {isSessionEnded && (
          <Button variant="dark" size="lg" onClick={resetSession}>Start New Session</Button>
        )}
      </div>
      </div>

      <div style={{ width: 200, height: 200, margin: "20px auto" }}>
        <CircularProgressbar
          value={progress}
          text={`${Math.round(progress)}%`}
          styles={buildStyles({
            pathColor: "green",
            textColor: "green",
          })}
        />
      </div>

      <LeafletMapComponent userLocation={userLocation} route={route}/>
      <div style={{ marginTop: "20px"  }}>
        <h3>Distance Covered: {distanceCovered.toFixed(2)} km</h3>
        <p>
          Progress: {distanceCovered.toFixed(2)} km out of {dailyGoal} km
        </p>
        <p>Duration: {getSessionDuration()}</p> {/* Display duration here */}
            {/* You can display more session stats here */}
      </div>
    </div>
    </Card>
    </Container>
  );
  
}



export default App
