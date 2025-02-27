const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    exercises: [{
        name: String,
        description: String,
        reps: String,
        weight: String
    }],
    duration: Number
});

module.exports = mongoose.model('Workout', workoutSchema); 