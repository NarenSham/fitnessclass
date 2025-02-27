const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai"); // Import the GoogleGenerativeAI class
require('dotenv').config(); // Load environment variables from .env file
const User = require('./models/User'); // Import the User model
const requireAuth = require('./middleware/auth'); // Add this line
const Workout = require('./models/Workout'); // Import the Workout model

async function startServer() {
    const { default: fetch, Headers } = await import('node-fetch'); // Import node-fetch dynamically
    global.fetch = fetch; // Set fetch as a global function
    global.Headers = Headers; // Set Headers as a global function

    const app = express();
    const port = 3000;

    // Middleware setup
    app.use(express.json()); // For parsing JSON bodies
    app.use(express.static('public')); // Serve static files from 'public' directory

    // Session configuration
    app.use(session({
        secret: 'everythingisplanned',
        resave: false,
        saveUninitialized: false,
        cookie: { 
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        }
    }));

    // MongoDB connection
    mongoose.connect('mongodb://localhost/fitnessclass')
        .then(() => console.log('Connected to MongoDB: fitnessclass'))
        .catch(err => console.error('MongoDB connection error:', err));

    // Test the connection
    mongoose.connection.on('connected', () => {
        console.log('Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
        console.error('Mongoose connection error:', err);
    });

    // Initialize GoogleGenerativeAI with the API key from environment variables
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-pro",  // Update to the working model
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
        }
    });

    const WORKOUT_LIBRARY = {
        "Arm Circles": {
            glbPath: "GLB/arm_circles.glb",
            muscleGroups: ["shoulders", "arms"],
            difficulty: "beginner"
        },
        "Burpees": {
            glbPath: "GLB/burpee.glb",
            muscleGroups: ["full body", "cardio"],
            difficulty: "advanced"
        },
        "Bodyweight Push-ups": {
            glbPath: "GLB/Bodyweight_pushup.glb",
            muscleGroups: ["chest", "triceps", "shoulders"],
            difficulty: "intermediate"
        },
        "T Push-ups": {
            glbPath: "GLB/t_pushup.glb",
            muscleGroups: ["chest", "shoulders", "core"],
            difficulty: "intermediate"
        },
        "Breakdance Push-ups": {
            glbPath: "GLB/breakdance_pushup.glb",
            muscleGroups: ["chest", "shoulders", "core"],
            difficulty: "advanced"
        },
        "Dive Bomb Push-ups": {
            glbPath: "GLB/divebomb_pushup.glb",
            muscleGroups: ["shoulders", "chest", "triceps"],
            difficulty: "advanced"
        },
        "Diamond Pushups": {
            glbPath: "GLB/Diamond_pushup.glb",
            muscleGroups: ["triceps", "chest"],
            difficulty: "intermediate"
        },
        "Shoulder Taps": {
            glbPath: "GLB/shoulder_taps.glb",
            muscleGroups: ["shoulders", "core"],
            difficulty: "beginner"
        },
        "Squats": {
            glbPath: "GLB/Bodyweight_squat.glb",
            muscleGroups: ["legs", "glutes"],
            difficulty: "beginner"
        },
        "Lunges (each leg)": {
            glbPath: "GLB/fwd_lunge.glb",
            muscleGroups: ["legs", "glutes"],
            difficulty: "beginner"
        },
        "Plank": {
            glbPath: "GLB/standard_plank.glb",
            muscleGroups: ["core", "shoulders"],
            difficulty: "beginner"
        },
        "Side Plank": {
            glbPath: "GLB/side_plank.glb",
            muscleGroups: ["core", "obliques"],
            difficulty: "intermediate"
        },
        "Mountain Climbers": {
            glbPath: "GLB/Mountainclimber_pushup.glb",
            muscleGroups: ["core", "cardio"],
            difficulty: "intermediate"
        },
        "Jumping Jacks": {
            glbPath: "GLB/jumping_jacks.glb",
            muscleGroups: ["cardio", "full body"],
            difficulty: "beginner"
        }
    };

    // Helper function to get GLB path
    function getGlbPath(exerciseName) {
        return WORKOUT_LIBRARY[exerciseName]?.glbPath;
    }

    // Helper function to get muscle groups
    function getMuscleGroups(exerciseName) {
        return WORKOUT_LIBRARY[exerciseName]?.muscleGroups || [];
    }

    // Serve the main page
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    // Serve the view-workouts page
    app.get('/view-workouts', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'view-workouts.html'));
    });

    // Serve the view-workouts page
    app.get('/profile', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'profile.html'));
    });

    // Serve the registration page
    app.get('/register', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'register.html'));
    });    // Endpoint to get workout

 
    // Middleware to check if user is authenticated
    const isAuthenticated = (req, res, next) => {
        if (req.session.userId) {
            next();
        } else {
            res.status(401).json({ error: 'Not authenticated' });
        }
    };

    // Session check endpoint
    app.get('/api/check-session', async (req, res) => {
        if (req.session.userId) {
            try {
                const user = await User.findById(req.session.userId);
                res.json({ 
                    authenticated: true,
                    username: user.username 
                });
            } catch (error) {
                res.json({ authenticated: false });
            }
        } else {
            res.json({ authenticated: false });
        }
    });

    // Login endpoint
    app.post('/api/login', async (req, res) => {
        try {
            const { username, password } = req.body;
            const user = await User.findOne({ username });

            if (!user) {
                return res.status(401).json({ error: 'Invalid username or password' });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ error: 'Invalid username or password' });
            }

            req.session.userId = user._id;
            res.json({ success: true });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // Register endpoint
    app.post('/api/register', async (req, res) => {
        try {
            const { username, password } = req.body;
            
            // Check if username already exists
            const existingUser = await User.findOne({ username });
            if (existingUser) {
                return res.status(400).json({ error: 'Username already exists' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Create new user
            const user = new User({
                username,
                password: hashedPassword,
                profile: {
                    isComplete: false
                }
            });

            await user.save();
            req.session.userId = user._id;
            res.json({ success: true });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // Get profile endpoint
    app.get('/api/profile', isAuthenticated, async (req, res) => {
        try {
            const user = await User.findById(req.session.userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json(user.profile);
        } catch (error) {
            console.error('Profile fetch error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // Update profile endpoint
    app.post('/api/update-profile', isAuthenticated, async (req, res) => {
        try {
            const { age, gender, weight, height, workoutDuration, hasEquipment } = req.body;
            
            const user = await User.findById(req.session.userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Check if relevant profile details have changed
            const profileChanged = user.profile.weight !== weight ||
                                 user.profile.height !== height ||
                                 user.profile.hasEquipment !== hasEquipment ||
                                 user.profile.workoutDuration !== workoutDuration;

            user.profile = {
                age,
                gender,
                weight,
                height,
                workoutDuration,
                hasEquipment,
                isComplete: true
            };

            await user.save();

            // If profile changed significantly, delete today's workout to force regeneration
            if (profileChanged) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                await Workout.deleteOne({
                    userId: req.session.userId,
                    date: {
                        $gte: today,
                        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                    }
                });
            }

            res.json({ success: true });
        } catch (error) {
            console.error('Profile update error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    });

    // Logout endpoint
    app.post('/api/logout', (req, res) => {
        req.session.destroy(err => {
            if (err) {
                return res.status(500).json({ error: 'Could not log out' });
            }
            res.json({ success: true });
        });
    });

    // Function to check if workout needs to be generated
    async function shouldGenerateNewWorkout(user) {
        if (!user.profile.lastWorkoutGenerated) {
            return true;
        }

        const lastGenerated = new Date(user.profile.lastWorkoutGenerated);
        const today = new Date();
        
        // Return true if it's a new day
        return lastGenerated.toDateString() !== today.toDateString();
    }

    // Helper function to get recent workouts
    async function getRecentWorkouts(userId, daysToLookBack = 7) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysToLookBack);
        
        const recentWorkouts = await Workout.find({
            userId: userId,
            date: {
                $gte: startDate,
                $lt: new Date()
            }
        }).sort({ date: -1 });

        return recentWorkouts;
    }

    function generateWorkoutPrompt(profile, recentWorkouts) {
        // Convert recent workouts into a summary
        let recentWorkoutSummary = recentWorkouts.map(workout => {
            const exerciseNames = workout.exercises.map(ex => ex.name);
            const muscleGroups = new Set();
            exerciseNames.forEach(name => {
                getMuscleGroups(name).forEach(group => muscleGroups.add(group));
            });
            
            return {
                date: workout.date.toISOString().split('T')[0],
                muscleGroups: Array.from(muscleGroups),
                exercises: exerciseNames
            };
        });

        return `Generate a workout routine for a ${profile.age} year old ${profile.gender}, 
        weight: ${profile.weight}kg, height: ${profile.height}cm, 
        duration: ${profile.workoutDuration} minutes, 
        equipment available: ${profile.hasEquipment ? 'basic equipment' : 'bodyweight only'}.
        
        Recent workout history (past ${recentWorkouts.length} days):
        ${JSON.stringify(recentWorkoutSummary, null, 2)}

        Available exercises and their muscle groups:
        ${Object.entries(WORKOUT_LIBRARY)
            .map(([name, data]) => `${name}: ${data.muscleGroups.join(', ')} (${data.difficulty})`)
            .join('\n')}

        Important guidelines:
        1. Avoid exercises that target the same muscle groups used heavily in recent workouts
        2. Ensure adequate recovery time between similar exercises
        3. Provide a balanced workout that complements previous routines
        4. Focus on muscle groups that haven't been worked recently
        5. Consider the user's profile and available equipment
        6. Mix different difficulty levels appropriately
        
        Select exercises ONLY from the provided list and format the response as a JSON object.`;
    }

    // Function to generate workout using LLM
    async function generateWorkoutWithLLM(prompt) {
        try {
            const availableExercisesList = Object.keys(WORKOUT_LIBRARY).join(", ");
            
            const result = await model.generateContent({
                contents: [{ 
                    role: "user",
                    parts: [{ 
                        text: `Generate a workout routine based on these parameters: ${prompt}. 
                        IMPORTANT: You MUST ONLY use exercises from this list: ${availableExercisesList}.
                        
                        Consider the workout duration when determining the number of exercises. 
                        Format your response EXACTLY like this example, with no additional text or formatting:
                        {
                            "exercises": [
                                {
                                    "name": "Squats",
                                    "description": "Stand with feet shoulder-width apart, lower your body by bending knees and hips, then return to standing",
                                    "reps": "12",
                                    "weight": "bodyweight"
                                }
                            ]
                        }
                        
                        Remember:
                        1. Only use exercise names from the provided list
                        2. Each exercise name must match EXACTLY with one from the list
                        3. Return only the JSON object with no additional text`
                    }]
                }]
            });

            let responseText = result.response.text().trim();
            console.log('Raw response:', responseText);

            // Clean up the response
            if (responseText.startsWith('```')) {
                responseText = responseText
                    .replace(/```(?:json)?\n?/, '')
                    .replace(/\n?```$/, '')
                    .trim();
            }

            console.log('Cleaned response:', responseText);

            try {
                const response = JSON.parse(responseText);
                
                // Validate that all exercises are from the available list
                const invalidExercises = response.exercises.filter(
                    exercise => !WORKOUT_LIBRARY.hasOwnProperty(exercise.name)
                );

                if (invalidExercises.length > 0) {
                    throw new Error(`Invalid exercises found: ${invalidExercises.map(e => e.name).join(', ')}`);
                }

                if (!response.exercises || !Array.isArray(response.exercises)) {
                    throw new Error('Invalid workout format: missing exercises array');
                }

                return response;
            } catch (jsonError) {
                console.error('JSON parsing error:', jsonError);
                console.error('Response that failed to parse:', responseText);
                throw new Error(`Failed to parse workout response: ${jsonError.message}`);
            }
        } catch (error) {
            console.error('Error in generateWorkoutWithLLM:', error);
            throw error;
        }
    }

    // Add this function to check if a workout exists for today
    async function getTodaysWorkout(userId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const workout = await Workout.findOne({
            userId: userId,
            date: {
                $gte: today,
                $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            }
        }).sort({ date: -1 });

        return workout;
    }

    // Update the /api/todays-workout endpoint
    app.get('/api/todays-workout', isAuthenticated, async (req, res) => {
        try {
            const user = await User.findById(req.session.userId);
            if (!user || !user.profile.isComplete) {
                return res.status(400).json({
                    success: false,
                    error: 'Please complete your profile first'
                });
            }

            // Check if workout exists for today
            const existingWorkout = await getTodaysWorkout(req.session.userId);
            
            if (existingWorkout && user.lastWorkoutDate && 
                user.lastWorkoutDate.toDateString() === new Date().toDateString()) {
                console.log('Returning existing workout for today:', existingWorkout);
                return res.json({
                    success: true,
                    workout: existingWorkout
                });
            }

            // Get recent workout history
            const recentWorkouts = await getRecentWorkouts(req.session.userId);
            console.log('Recent workouts found:', recentWorkouts.length);

            // Generate new workout using user's profile data and workout history
            const workoutPrompt = generateWorkoutPrompt(user.profile, recentWorkouts);
            console.log('Generated prompt:', workoutPrompt);

            const llmResponse = await generateWorkoutWithLLM(workoutPrompt);
            console.log('LLM Response:', llmResponse);

            // Create and save the new workout
            const workout = {
                exercises: llmResponse.exercises || [],
                duration: user.profile.workoutDuration
            };

            const newWorkout = new Workout({
                userId: req.session.userId,
                date: new Date(),
                exercises: workout.exercises,
                duration: workout.duration
            });

            await newWorkout.save();
            
            // Update the last workout date
            user.lastWorkoutDate = new Date();
            await user.save();

            res.json({
                success: true,
                workout: newWorkout
            });

        } catch (error) {
            console.error('Error in /api/todays-workout:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to generate or retrieve workout: ' + error.message
            });
        }
    });

    app.get('/workouts', requireAuth, async (req, res) => {
        try {
            const user = await User.findById(req.session.userId);
            
            // Define the prompt for workout generation
            const prompt = `Generate a workout routine with the following format:
            {
                "workout": [
                    {
                        "name": "Exercise name",
                        "description": "Exercise description",
                        "reps": "Number of reps",
                        "weight": "Weight or 'Bodyweight'"
                    }
                ]
            }
            Include 5-6 exercises with specific rep counts and descriptions.`;

            // Generate workout from LLM
            const workoutData = await model.generateContent(prompt);
            const rawResponse = await workoutData.response.text();
            console.log('Raw LLM Response:', rawResponse);

            // Parse the LLM response
            const jsonMatch = rawResponse.match(/```json\s*({.*?})\s*```/s);
            if (!jsonMatch) {
                throw new Error('No JSON found in the response');
            }

            let jsonString = jsonMatch[1];
            const parsedWorkout = JSON.parse(jsonString);
            console.log('Parsed workout:', parsedWorkout);

            // Create new workout document
            const workoutToSave = {
                date: new Date(),
                exercises: parsedWorkout.workout,
                duration: 30
            };

            console.log('Workout to save:', JSON.stringify(workoutToSave, null, 2));

            // Save the workout
            const updatedUser = await User.findByIdAndUpdate(
                user._id,
                { 
                    $push: { 
                        workoutHistory: workoutToSave 
                    }
                },
                { new: true }
            );

            if (!updatedUser) {
                throw new Error('Failed to save workout to user history');
            }

            console.log('Updated workout history:', JSON.stringify(updatedUser.workoutHistory, null, 2));

            res.json({
                success: true,
                workout: workoutToSave
            });
        } catch (error) {
            console.error('Error in workout generation:', error);
            res.status(500).json({ error: 'Failed to generate workout', details: error.message });
        }
    });

    app.get('/api/workout-history', requireAuth, async (req, res) => {
        try {
            const user = await User.findById(req.session.userId);
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            console.log('User ID:', user._id);
            console.log('Raw workout history:', JSON.stringify(user.workoutHistory, null, 2));

            // Only include workouts that have exercises
            const formattedWorkouts = user.workoutHistory
                .filter(workout => workout.exercises && workout.exercises.length > 0)
                .map(workout => ({
                    date: new Date(workout.date).toISOString(),
                    exercises: workout.exercises,
                    duration: workout.duration || 30
                }));

            console.log('Sending formatted workouts:', JSON.stringify(formattedWorkouts, null, 2));
            res.json(formattedWorkouts);
        } catch (error) {
            console.error('Error fetching workout history:', error);
            res.status(500).json({ error: 'Failed to fetch workout history' });
        }
    });

    // Add this endpoint to fetch workouts for a specific month
    app.get('/api/workouts/:year/:month', isAuthenticated, async (req, res) => {
        try {
            const { year, month } = req.params;
            const startDate = new Date(year, month, 1);
            const endDate = new Date(year, parseInt(month) + 1, 0);

            const workouts = await Workout.find({
                userId: req.session.userId,
                date: {
                    $gte: startDate,
                    $lte: endDate
                }
            }).sort({ date: 1 });

            // Add muscle groups to each exercise in the workouts
            const workoutsWithMuscleGroups = workouts.map(workout => {
                const workoutObj = workout.toObject();
                workoutObj.exercises = workoutObj.exercises.map(exercise => ({
                    ...exercise,
                    muscleGroups: WORKOUT_LIBRARY[exercise.name]?.muscleGroups || []
                }));
                return workoutObj;
            });

            res.json({ success: true, workouts: workoutsWithMuscleGroups });
        } catch (error) {
            console.error('Error fetching workouts:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch workouts' });
        }
    });

    // Add endpoint to get workout library
    app.get('/api/workout-library', isAuthenticated, (req, res) => {
        res.json(WORKOUT_LIBRARY);
    });

    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
}

startServer(); // Call the async function to start the server