const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

// --- In-memory Database ---
let users = {}; // { username: { password, studentId } }
let students = {}; // { id: Student }
let groups = {}; // { id: Group }

// --- Initial Mock Data ---
const student1Id = uuidv4();
const student2Id = uuidv4();
const student3Id = uuidv4();
const student4Id = uuidv4();

users['alice'] = { password: 'password123', studentId: student1Id };
users['bob'] = { password: 'password123', studentId: student2Id };
users['charlie'] = { password: 'password123', studentId: student3Id };
users['diana'] = { password: 'password123', studentId: student4Id };

students[student1Id] = {
    id: student1Id,
    username: 'alice',
    name: 'Alice Johnson',
    courses: ['Data Structures', 'Algorithms'],
    cgpa: '3.8',
    availability: ['Mon Afternoon', 'Wed Afternoon'],
};
students[student2Id] = {
    id: student2Id,
    username: 'bob',
    name: 'Bob Williams',
    courses: ['Data Structures', 'Operating Systems'],
    cgpa: '3.5',
    availability: ['Tue Morning', 'Thu Morning'],
};
students[student3Id] = {
    id: student3Id,
    username: 'charlie',
    name: 'Charlie Brown',
    courses: ['Algorithms', 'Database Systems', 'Intro to CS'],
    cgpa: '3.9',
    availability: ['Mon Afternoon', 'Fri Afternoon'],
};
students[student4Id] = {
    id: student4Id,
    username: 'diana',
    name: 'Diana Prince',
    courses: ['Machine Learning', 'Artificial Intelligence'],
    cgpa: '4.0',
    availability: ['Weekends'],
};

const group1Id = uuidv4();
const group2Id = uuidv4();

groups[group1Id] = {
    id: group1Id,
    groupName: 'Algo Avengers',
    admin: 'alice',
    members: ['alice', 'charlie'],
    focusCourses: ['Algorithms'],
    suggestedTimes: ['Mon Afternoon'],
    reason: 'Initial group for Algorithms course.',
    messages: [
        { id: 'm1', sender: 'alice', text: 'Hey Charlie, ready for the midterm?', timestamp: '10:30 AM' },
        { id: 'm2', sender: 'charlie', text: 'You bet! Been studying sorting algorithms all night.', timestamp: '10:31 AM' },
    ],
};
groups[group2Id] = {
    id: group2Id,
    groupName: 'Data Dominators',
    admin: 'bob',
    members: ['bob'],
    focusCourses: ['Data Structures'],
    suggestedTimes: ['Tue Morning'],
    reason: 'Bob created this group for DS.',
    messages: [],
};


// --- API Routes ---
const apiRouter = express.Router();

// User & Student Routes
apiRouter.post('/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }
    if (users[username]) {
        return res.status(409).json({ message: 'Username already exists.' });
    }
    const newStudentId = uuidv4();
    users[username] = { password, studentId: newStudentId };
    students[newStudentId] = {
        id: newStudentId,
        username: username,
        name: username, // Default name to username
        courses: [],
        cgpa: '',
        availability: [],
    };
    console.log(`User registered: ${username}`);
    res.status(201).json({ message: 'User registered successfully', userId: newStudentId });
});

apiRouter.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users[username];
    if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid username or password.' });
    }
    const studentProfile = students[user.studentId];
    if (!studentProfile) {
        return res.status(404).json({ message: 'Student profile not found.' });
    }
    console.log(`User logged in: ${username}`);
    res.json(studentProfile);
});

apiRouter.get('/students', (req, res) => {
    res.json(Object.values(students));
});

apiRouter.put('/students/:username', (req, res) => {
    const { username } = req.params;
    const user = users[username];
    if (!user) {
        return res.status(404).json({ message: 'User not found.' });
    }
    const studentProfile = students[user.studentId];
    if (!studentProfile) {
        return res.status(404).json({ message: 'Student profile not found.' });
    }
    
    const updatedProfile = { ...studentProfile, ...req.body, username: studentProfile.username, id: studentProfile.id };
    students[user.studentId] = updatedProfile;
    console.log(`Profile updated for: ${username}`);
    res.json(updatedProfile);
});


// Group Routes
apiRouter.get('/groups', (req, res) => {
    res.json(Object.values(groups));
});

apiRouter.post('/groups', (req, res) => {
    const newGroupData = req.body;
    if (!newGroupData.groupName || !newGroupData.admin || !newGroupData.members) {
        return res.status(400).json({ message: 'Missing required group data.' });
    }
    const newGroup = {
        ...newGroupData,
        id: uuidv4(),
        messages: [],
    };
    groups[newGroup.id] = newGroup;
    console.log(`Group created: ${newGroup.groupName}`);
    res.status(201).json(newGroup);
});

apiRouter.get('/groups/:id', (req, res) => {
    const group = groups[req.params.id];
    if (!group) {
        return res.status(404).json({ message: 'Group not found.' });
    }
    res.json(group);
});

apiRouter.put('/groups/:id', (req, res) => {
    const { id } = req.params;
    if (!groups[id]) {
        return res.status(404).json({ message: 'Group not found.' });
    }
    const updatedGroupData = { ...req.body, id }; // ensure id is not changed
    groups[id] = updatedGroupData;
    console.log(`Group updated: ${updatedGroupData.groupName}`);
    res.json(updatedGroupData);
});

apiRouter.delete('/groups/:id', (req, res) => {
    const { id } = req.params;
    if (!groups[id]) {
        return res.status(404).json({ message: 'Group not found.' });
    }
    delete groups[id];
    console.log(`Group deleted: ${id}`);
    res.status(204).send();
});

// Chat Message Routes
apiRouter.get('/groups/:groupId/messages', (req, res) => {
    const group = groups[req.params.groupId];
    if (!group) {
        return res.status(404).json({ message: 'Group not found.' });
    }
    res.json(group.messages || []);
});

apiRouter.post('/groups/:groupId/messages', (req, res) => {
    const { groupId } = req.params;
    const group = groups[groupId];
    if (!group) {
        return res.status(404).json({ message: 'Group not found.' });
    }
    const newMessage = req.body;
    if (!newMessage.id || !newMessage.sender || !newMessage.text) {
        return res.status(400).json({ message: 'Invalid message format.' });
    }
    if (!group.messages) {
        group.messages = [];
    }
    // Prevent duplicate messages on optimistic UI updates
    if (!group.messages.find(m => m.id === newMessage.id)) {
        group.messages.push(newMessage);
    }
    console.log(`Message posted in group ${group.groupName} by ${newMessage.sender}`);
    res.status(201).json(newMessage);
});

app.use('/api', apiRouter);

app.listen(PORT, () => {
    console.log(`Mock API server running on http://localhost:${PORT}`);
});
