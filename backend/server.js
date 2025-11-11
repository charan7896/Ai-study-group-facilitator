require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = 5001;

// Enable CORS for all routes and origins to fix "Failed to fetch" error
app.use(cors());
app.use(express.json());

// --- MongoDB Connection ---
if (!process.env.MONGODB_URI) {
    console.error("FATAL ERROR: MONGODB_URI is not defined.");
    process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    seedDatabase();
  })
  .catch(err => console.error('Could not connect to MongoDB...', err));


// --- Mongoose Schemas and Models ---
const schemaOptions = {
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret._id;
        delete ret.__v;
      }
    },
    toObject: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret._id;
        delete ret.__v;
      }
    }
};

const ChatMessageSchema = new mongoose.Schema({
    id: { type: String, required: true },
    sender: { type: String, required: true },
    text: { type: String, required: true },
    timestamp: { type: String, required: true },
    parentId: { type: String },
    reactions: { type: mongoose.Schema.Types.Mixed },
}, { _id: false });

const GroupSchema = new mongoose.Schema({
    groupName: { type: String, required: true },
    admin: { type: String, required: true },
    members: [String],
    focusCourses: [String],
    suggestedTimes: [String],
    reason: { type: String },
    messages: [ChatMessageSchema],
}, { ...schemaOptions, timestamps: true });

GroupSchema.virtual('id').get(function() {
  return this._id.toHexString();
});


const StudentSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    courses: [String],
    cgpa: { type: String },
    availability: [String],
}, { ...schemaOptions, timestamps: true });

StudentSchema.virtual('id').get(function() {
  return this._id.toHexString();
});


const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
}, { ...schemaOptions, timestamps: true });

UserSchema.virtual('id').get(function() {
  return this._id.toHexString();
});


const Group = mongoose.model('Group', GroupSchema);
const Student = mongoose.model('Student', StudentSchema);
const User = mongoose.model('User', UserSchema);


// --- API Routes ---
const apiRouter = express.Router();

// User & Student Routes
apiRouter.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }
    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ message: 'Username already exists.' });
        }
        
        const newStudent = new Student({
            username: username,
            name: username, // Default name
            courses: [],
            cgpa: '',
            availability: [],
        });
        await newStudent.save();

        const newUser = new User({
            username,
            password, // In a real app, hash this!
            student: newStudent._id,
        });
        await newUser.save();

        console.log(`User registered: ${username}`);
        res.status(201).json({ message: 'User registered successfully', userId: newStudent.id });
    } catch (error) {
        res.status(500).json({ message: 'Server error during registration.', error: error.message });
    }
});

apiRouter.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username }).populate('student');
        if (!user || user.password !== password) {
            return res.status(401).json({ message: 'Invalid username or password.' });
        }
        if (!user.student) {
            return res.status(404).json({ message: 'Student profile not found.' });
        }
        console.log(`User logged in: ${username}`);
        res.json(user.student.toJSON());
    } catch (error) {
        res.status(500).json({ message: 'Server error during login.', error: error.message });
    }
});

apiRouter.get('/students', async (req, res) => {
    try {
        const students = await Student.find();
        res.json(students.map(s => s.toJSON()));
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve students.' });
    }
});

apiRouter.put('/students/:username', async (req, res) => {
    const { username } = req.params;
    try {
        const updatedStudent = await Student.findOneAndUpdate({ username }, req.body, { new: true });
        if (!updatedStudent) {
            return res.status(404).json({ message: 'Student profile not found.' });
        }
        console.log(`Profile updated for: ${username}`);
        res.json(updatedStudent.toJSON());
    } catch (error) {
        res.status(500).json({ message: 'Failed to update student profile.' });
    }
});

// Group Routes
apiRouter.get('/groups', async (req, res) => {
    try {
        const groups = await Group.find();
        res.json(groups.map(g => g.toJSON()));
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve groups.' });
    }
});

apiRouter.post('/groups', async (req, res) => {
    const newGroupData = req.body;
    try {
        const newGroup = new Group({ ...newGroupData, messages: [] });
        await newGroup.save();
        console.log(`Group created: ${newGroup.groupName}`);
        res.status(201).json(newGroup.toJSON());
    } catch (error) {
        res.status(400).json({ message: 'Failed to create group.', error: error.message });
    }
});

apiRouter.put('/groups/:id', async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid group ID format.' });
    }
    try {
        const updatedGroup = await Group.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedGroup) {
            return res.status(404).json({ message: 'Group not found.' });
        }
        console.log(`Group updated: ${updatedGroup.groupName}`);
        res.json(updatedGroup.toJSON());
    } catch (error) {
        res.status(500).json({ message: 'Failed to update group.' });
    }
});

apiRouter.delete('/groups/:id', async (req, res) => {
    const { id } = req.params;
     if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid group ID format.' });
    }
    try {
        const deletedGroup = await Group.findByIdAndDelete(id);
        if (!deletedGroup) {
            return res.status(404).json({ message: 'Group not found.' });
        }
        console.log(`Group deleted: ${id}`);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete group.' });
    }
});

// Chat Message Routes
apiRouter.get('/groups/:groupId/messages', async (req, res) => {
    const { groupId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
        return res.status(400).json({ message: 'Invalid group ID format.' });
    }
    try {
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found.' });
        }
        res.json(group.messages || []);
    } catch (error) {
        res.status(500).json({ message: 'Failed to retrieve messages.' });
    }
});

apiRouter.post('/groups/:groupId/messages', async (req, res) => {
    const { groupId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
        return res.status(400).json({ message: 'Invalid group ID format.' });
    }
    try {
        const newMessage = req.body;
        if (!newMessage.id || !newMessage.sender || !newMessage.text) {
            return res.status(400).json({ message: 'Invalid message format.' });
        }
        
        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found.' });
        }

        // Prevent duplicate messages on optimistic UI updates
        const messageExists = group.messages.some(m => m.id === newMessage.id);
        if (!messageExists) {
            group.messages.push(newMessage);
            await group.save();
        }
        
        console.log(`Message posted in group ${group.groupName} by ${newMessage.sender}`);
        const savedMessage = group.messages.find(m => m.id === newMessage.id) || newMessage;
        res.status(201).json(savedMessage);
    } catch (error) {
        res.status(500).json({ message: 'Failed to post message.' });
    }
});


app.use('/api', apiRouter);

app.get('/', (req, res) => {
    res.send('<h1>AI Study Group Facilitator Backend</h1><p>The API server is running correctly. Connect your frontend application to this server.</p>');
});

app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
});


// --- Database Seeding ---
async function seedDatabase() {
    try {
        const userCount = await User.countDocuments();
        if (userCount > 0) {
            console.log('Database already seeded.');
            return;
        }

        console.log('Seeding database with initial data...');

        const studentsData = [
            { username: 'alice', name: 'Alice Johnson', courses: ['Data Structures', 'Algorithms'], cgpa: '3.8', availability: ['Mon Afternoon', 'Wed Afternoon'] },
            { username: 'bob', name: 'Bob Williams', courses: ['Data Structures', 'Operating Systems'], cgpa: '3.5', availability: ['Tue Morning', 'Thu Morning'] },
            { username: 'charlie', name: 'Charlie Brown', courses: ['Algorithms', 'Database Systems', 'Intro to CS'], cgpa: '3.9', availability: ['Mon Afternoon', 'Fri Afternoon'] },
            { username: 'diana', name: 'Diana Prince', courses: ['Machine Learning', 'Artificial Intelligence'], cgpa: '4.0', availability: ['Weekends'] },
        ];
        const createdStudents = await Student.insertMany(studentsData);

        const usersData = [
            { username: 'alice', password: 'password123', student: createdStudents[0]._id },
            { username: 'bob', password: 'password123', student: createdStudents[1]._id },
            { username: 'charlie', password: 'password123', student: createdStudents[2]._id },
            { username: 'diana', password: 'password123', student: createdStudents[3]._id },
        ];
        await User.insertMany(usersData);

        const groupsData = [
            {
                groupName: 'Algo Avengers', admin: 'alice', members: ['alice', 'charlie'], focusCourses: ['Algorithms'],
                suggestedTimes: ['Mon Afternoon'], reason: 'Initial group for Algorithms course.',
                messages: [
                    { id: 'm1', sender: 'alice', text: 'Hey Charlie, ready for the midterm?', timestamp: '10:30 AM' },
                    { id: 'm2', sender: 'charlie', text: 'You bet! Been studying sorting algorithms all night.', timestamp: '10:31 AM' },
                ],
            },
            {
                groupName: 'Data Dominators', admin: 'bob', members: ['bob'], focusCourses: ['Data Structures'],
                suggestedTimes: ['Tue Morning'], reason: 'Bob created this group for DS.', messages: [],
            },
        ];
        await Group.insertMany(groupsData);

        console.log('Database seeding complete.');
    } catch (error) {
        console.error('Error seeding database:', error);
    }
}