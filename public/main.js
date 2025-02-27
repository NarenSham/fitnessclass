import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Scene, Camera, Renderer
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
const light = new THREE.AmbientLight(0xffffff, 1);
scene.add(light);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(1, 3, 2);
scene.add(directionalLight);

// Add back light
const backLight = new THREE.DirectionalLight(0xffffff, 1);
backLight.position.set(-1, 2, -2);
scene.add(backLight);

let model, mixer;

// Load GLB Model
const loader = new GLTFLoader();
loader.load('GLB/jumping_jacks.glb', function (gltf) {
    model = gltf.scene;
    model.position.set(0, 0, 0);
    model.scale.set(1.3, 1.3, 1.3); // Adjusted scale to 1 for testing
    scene.add(model);

    // Initialize mixer within the load callback
    mixer = new THREE.AnimationMixer(model);
    
    // Array of clips
    const clips = gltf.animations;
    console.log("Loaded animations:", clips); // Debugging log to see available animations
    const clip = THREE.AnimationClip.findByName(clips, 'Action'); // Find the clip named 'Test'
    
    if (clip) {
        const action = mixer.clipAction(clip);
        action.play(); // Play the animation
        console.log("Playing animation:", clip.name); // Debugging log
    } else {
        console.error("Clip named 'Standard' not found.");
    }

}, undefined, function (error) {
    console.error("Error loading model:", error);
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
