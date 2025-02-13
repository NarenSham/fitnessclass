const express = require('express');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require("@google/generative-ai"); // Import the GoogleGenerativeAI class
require('dotenv').config(); // Load environment variables from .env file

async function startServer() {
    const { default: fetch, Headers } = await import('node-fetch'); // Import node-fetch dynamically
    global.fetch = fetch; // Set fetch as a global function
    global.Headers = Headers; // Set Headers as a global function

    const app = express();
    const port = 3000;

    app.use(bodyParser.json());

    // Serve static files from the 'public' directory
    app.use(express.static('public')); // Ensure 'main.js' is in the 'public' directory

    // Initialize GoogleGenerativeAI with the API key from environment variables
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); // Initialize with your API key
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Specify the model

    // Endpoint to get workouts
    app.post('/api/getWorkouts', async (req, res) => {
        const { weight, height, age, gender, equipment } = req.body;

        // Create a prompt for the Gemini API
        const prompt = `Generate a list of workouts for a ${age}-year-old ${gender} who weighs ${weight} kg, is ${height} cm tall, and has access to ${equipment}.`;

        try {
            const result = await model.generateContent(prompt); // Generate content using the new method
            res.json(result.response.text()); // Send the response back to the client
        } catch (error) {
            console.error('Error generating workouts:', error);
            res.status(500).send('Error generating workouts');
        }
    });

    // Define a GET route for the root URL
    app.get('/', (req, res) => {
        res.send(`
            <html>
                <head>
                    </head>
                <body>
                    
                    <script type="module">
                    import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.module.js';
                    import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/loaders/GLTFLoader.js';

                    import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
                    const scene = new THREE.Scene();
                    scene.background = new THREE.Color(0xfce4ec);
                    const camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 1000);

                    // Define circular motion variables
                    const radius = 4; // Radius of the circular path
                    let angle = 1; // Initial angle for circular motion
                    const speed = 0.002; // Speed of rotation
                    let isOrbiting = false; // Flag to check if orbiting mode is active

                    const renderer = new THREE.WebGLRenderer({ antialias: true });
                    renderer.setSize(window.innerWidth, window.innerHeight);
                    document.body.appendChild(renderer.domElement);

                    // Lighting
                    const light = new THREE.AmbientLight(0xffffff, 2);
                    scene.add(light);

                    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
                    directionalLight.position.set(1, 3, 2);
                    scene.add(directionalLight);

                    // Add back light
                    const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
                    backLight.position.set(-1, 2, -2);
                    scene.add(backLight);

                    let model, mixer;

                    // Load GLB Model
                    const loader = new GLTFLoader();
                    loader.load('lowpoly9.glb', function (gltf) {
                        model = gltf.scene;
                        model.position.set(0, 0, 0);
                        model.scale.set(1.3 , 1.3 , 1.3 ); // Adjusted scale to 1 for testing
                        scene.add(model);

                        // Initialize mixer within the load callback
                        mixer = new THREE.AnimationMixer(model);
                        
                        // Array of clips
                        const clips = gltf.animations;
                        console.log("Loaded animations:", clips); // Debugging log to see available animations
                        const clip = THREE.AnimationClip.findByName(clips, 'Regular Pushup'); // Find the clip named 'Test'
                        
                        if (clip) {
                            const action = mixer.clipAction(clip);
                            action.play(); // Play the animation
                            console.log("Playing animation:", clip.name); // Debugging log
                        } else {
                            console.error("Clip named 'Test' not found.");
                        }

                    }, undefined, function (error) {
                        console.error('An error occurred while loading the model:', error); // Log any errors
                        document.getElementById('canvas-container').innerHTML = '<p>Error loading model. Check console for details.</p>';
                    });

                    // OrbitControls
                    const controls = new OrbitControls(camera, renderer.domElement);
                    controls.minDistance = 1; // Adjusted minimum distance for zooming in
                    controls.maxDistance = 50; // Adjusted maximum distance for zooming out
                    controls.enablePan = false;
                    controls.target.set(0, 0, 0); // Set target to the origin
                    controls.update();

                    const clock = new THREE.Clock(); // Moved clock initialization here

                    // Event listener for mouse click to toggle orbiting
                    window.addEventListener('mousedown', () => {
                        isOrbiting = !isOrbiting; // Toggle orbiting mode
                        if (isOrbiting) {
                            // If entering orbit mode, stop circular motion
                            controls.enabled = true; // Enable orbit controls
                            //clearTimeout(resumeRotationTimeout); // Clear any existing timeout
                        } else {
                            // If exiting orbit mode, disable orbit controls
                            controls.enabled = true; // Enable orbit controls
                            // Set a timeout to resume circular motion after 10 seconds
                            // resumeRotationTimeout = setTimeout(() => {
                            //     isOrbiting = false; // Resume circular motion
                            // }, 10000); // 10000 milliseconds = 10 seconds
                        }
                    });

                    // Create overlay text element
                    const overlayText = document.createElement('div');
                    overlayText.style.position = 'absolute';
                    overlayText.style.top = '8px'; // Position from the top
                    overlayText.style.left = '50%'; // Center horizontally
                    overlayText.style.transform = 'translateX(-50%)'; // Adjust for centering
                    overlayText.style.color = '1d1d1d'; // Text color
                    overlayText.style.fontSize = '18px'; // Font size
                    overlayText.style.fontFamily = 'Ariel, sans-serif'; // Change font type here
                    overlayText.style.pointerEvents = 'none'; // Prevent mouse events on the text
                    overlayText.innerText = 'Exercise 1'; // Set the text
                    document.body.appendChild(overlayText);

                    animate();

                    // Render function
                    function animate() {
                        requestAnimationFrame(animate); // Ensure the animation loop is continuous
                        if (mixer) {
                            const delta = clock.getDelta();
                            mixer.update(delta); // Update the mixer for animations
                        }

                        if (!isOrbiting) {
                            // Update camera position for horizontal circular pan
                            angle += speed; // Increment the angle
                            camera.position.x = radius * Math.cos(angle); // Update X position
                            camera.position.z = radius * Math.sin(angle); // Update Z position
                            camera.position.y = 1.2; // Keep the camera height constant
                            camera.lookAt(0, 0, 0); // Make the camera look at the origin
                        } else {
                            controls.enabled = true; 
                        }

                        renderer.render(scene, camera);
                    }

                    // Resize Event
                    window.addEventListener('resize', () => {
                        camera.aspect = window.innerWidth / window.innerHeight;
                        camera.updateProjectionMatrix();
                        renderer.setSize(window.innerWidth, window.innerHeight);
                    });

                    // Function to update the text excerpt
                    function updateTextExcerpt(title, description) {
                        document.getElementById('exerciseExcerpt').querySelector('h2').innerText = title;
                        document.getElementById('exerciseDescription').innerText = description;
                    }

                    // Example usage: Update text on a button click
                    document.getElementById('someButton').addEventListener('click', () => {
                        updateTextExcerpt('New Type of Exercise', 'This is a new description based on user action.');
                    });

                    // Instead, display a welcome message
                    const welcomeMessage = document.createElement('div');
                    welcomeMessage.style.position = 'absolute';
                    welcomeMessage.style.top = '50%'; // Center vertically
                    welcomeMessage.style.left = '50%'; // Center horizontally
                    welcomeMessage.style.transform = 'translate(-50%, -50%)'; // Adjust for centering
                    welcomeMessage.style.color = '#1d1d1d'; // Text color
                    welcomeMessage.style.fontSize = '24px'; // Font size
                    welcomeMessage.style.fontFamily = 'Arial, sans-serif'; // Font type
                    welcomeMessage.innerText = 'Welcome to the Application!'; // Set the welcome text
                    document.body.appendChild(welcomeMessage);

                    // Event listener for the "Go to Workout" button
                    document.getElementById('goToWorkout').addEventListener('click', async () => {
                        // Parameters for the workout request
                        const params = {
                            weight: 70, // Example weight in kg
                            height: 175, // Example height in cm
                            age: 25, // Example age
                            gender: 'male', // Example gender
                            equipment: 'dumbbells', // Example equipment availability
                        };

                        try {
                            const response = await fetch('/api/getWorkouts', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(params),
                            });

                            if (!response.ok) {
                                throw new Error('Network response was not ok');
                            }

                            const workouts = await response.json();
                            console.log('Workouts for the day:', workouts);

                            // Display the workouts on the page
                            displayWorkouts(workouts);
                        } catch (error) {
                            console.error('Error fetching workouts:', error);
                        }
                    });

                    // Function to display workouts on the page
                    function displayWorkouts(workouts) {
                        // Clear any existing workout display
                        const workoutContainer = document.getElementById('workoutContainer');
                        workoutContainer.innerHTML = ''; // Clear previous workouts

                        // Create a list to display workouts
                        const workoutList = document.createElement('ul');

                        // Assuming workouts is an array of workout objects
                        workouts.forEach(workout => {
                            const listItem = document.createElement('li');
                            listItem.textContent = workout; // Adjust this based on the structure of the response
                            workoutList.appendChild(listItem);
                        });

                        workoutContainer.appendChild(workoutList);
                    }

                    document.addEventListener('DOMContentLoaded', () => {
                        // Example of making a POST request to get workouts
                        const getWorkouts = async () => {
                            const response = await fetch('/api/getWorkouts', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    weight: 70, // Example weight
                                    height: 175, // Example height
                                    age: 25, // Example age
                                    gender: 'male', // Example gender
                                    equipment: 'dumbbells', // Example equipment
                                }),
                            });

                            if (response.ok) {
                                const data = await response.json();
                                console.log(data); // Handle the response data
                            } else {
                                console.error('Error fetching workouts:', response.statusText);
                            }
                        };

                        // Call the function to get workouts
                        getWorkouts();
                    });
                    </script>
                </body>
            </html>
        `); // Response message with button and Three.js setup
    });

    // Define a new route to handle workout requests
    app.get('/workouts', async (req, res) => {
        // Example parameters for the workout generation
        const weight = 70; // Replace with actual data
        const height = 175; // Replace with actual data
        const age = 25; // Replace with actual data
        const gender = 'male'; // Replace with actual data
        const equipment = 'dumbbells'; // Replace with actual data

        // Create a prompt for the Gemini API
        const prompt = `Generate a list of workouts for a ${age}-year-old ${gender} who weighs ${weight} kg, is ${height} cm tall, and has access to ${equipment}.\
        Provide the response for a single day and return the workouts in the form of a json of the format workout followed by the number of reps`;

        try {
            const result = await model.generateContent(prompt); // Generate content using the new method
            res.send(`
                <html>
                    <body>
                        <h1>Generated Workouts</h1>
                        <p>${result.response.text()}</p>
                        <button onclick="location.href='/'">Back to Home</button>
                    </body>
                </html>
            `); // Display the generated workouts
        } catch (error) {
            console.error('Error generating workouts:', error.message); // Log the error message
            console.error('Full error details:', error); // Log the full error object for more details
            res.status(500).send('Error generating workouts');
        }
    });

    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

startServer(); // Call the async function to start the server 