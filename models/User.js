const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const exerciseSchema = new mongoose.Schema({
    name: String,
    description: String,
    reps: String,
    weight: String
});

const workoutSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    exercises: [exerciseSchema],
    duration: Number
});

const profileSchema = new mongoose.Schema({
    isComplete: {
        type: Boolean,
        default: false
    },
    age: Number,
    gender: String,
    weight: Number,
    height: Number,
    workoutDuration: Number,
    hasEquipment: Boolean
});

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    profile: profileSchema,
    workoutHistory: [workoutSchema],
    lastLogin: { type: Date, default: Date.now },
    lastWorkoutDate: { type: Date }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);