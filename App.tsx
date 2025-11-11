import React, { useState, useEffect } from 'react';
import { Student, Group, User, AISuggestions } from './types';
import Header from './components/Header';
import ProfileForm from './components/StudentInputForm';
import SuggestedStudents from './components/StudentList';
import SuggestedGroups from './components/GroupResults';
import OnlineResources from './components/OnlineResources';
import MyGroupsView from './components/MyGroupsView';
import GroupDirectory from './components/GroupDirectory';
import GroupChat from './components/GroupChat';
import { getAISuggestions } from './services/geminiService';
import * as api from './services/apiService';
import { SparklesIcon } from './components/icons/SparklesIcon';
import { UserCircleIcon } from './components/icons/UserCircleIcon';

type ActiveTab = 'students' | 'matched-groups' | 'my-groups' | 'all-groups' | 'resources';

// Main Application Component
const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Student | null>(null);
  
  // State is now fetched from the backend API
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  
  // App State
  const [activeChatGroup, setActiveChatGroup] = useState<Group | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('students');
  
  // AI Generation State
  const [suggestions, setSuggestions] = useState<AISuggestions | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial data when user is logged in
  useEffect(() => {
    if (currentUser) {
        const fetchData = async () => {
            try {
                const [students, groups] = await Promise.all([
                    api.getAllStudents(),
                    api.getAllGroups()
                ]);
                setAllStudents(students);
                setAllGroups(groups);
            } catch (err) {
                setError("Failed to load initial application data.");
            }
        };
        fetchData();
    }
  }, [currentUser]);


  const handleLogin = async (user: User) => {
    try {
        const studentProfile = await api.loginUser(user);
        setCurrentUser(studentProfile);
        setError(null);
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Login failed.');
    }
  };

  const handleRegister = async (user: User) => {
    try {
        await api.registerUser(user);
        // After successful registration, log them in automatically
        await handleLogin(user);
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Registration failed.');
    }
  };
  
  const handleLogout = () => {
    setCurrentUser(null);
    setSuggestions(null);
    setActiveChatGroup(null);
    setAllStudents([]);
    setAllGroups([]);
    setError(null);
  };

  const handleProfileUpdate = async (updatedProfileData: Omit<Student, 'id' | 'username'>) => {
    if (!currentUser) return;
    
    try {
      const updatedProfile = await api.updateStudentProfile({ ...currentUser, ...updatedProfileData });
      setCurrentUser(updatedProfile);
      setAllStudents(prev => prev.map(s => s.id === updatedProfile.id ? updatedProfile : s));
      
      setIsGenerating(true);
      setError(null);
      setSuggestions(null);
      setActiveTab('students');

      const otherStudents = allStudents.filter(s => s.id !== currentUser.id);
      const result = await getAISuggestions(updatedProfile, otherStudents, allGroups);
      setSuggestions(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred during profile update.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleCreateGroup = async (selectedStudentUsernames: string[]) => {
      if (!currentUser) return;
      const members = [currentUser.username, ...selectedStudentUsernames];
      const newGroupName = `Study Squad for ${currentUser.courses[0] || 'Success'}`;
      
      const newGroupData: Omit<Group, 'id' | 'messages'> = {
        groupName: newGroupName,
        admin: currentUser.username,
        members,
        focusCourses: currentUser.courses,
        suggestedTimes: currentUser.availability,
        reason: `${currentUser.name} wanted to form a group with AI-suggested peers.`,
      };

      try {
        const createdGroup = await api.createGroup(newGroupData);
        setAllGroups(prev => [...prev, createdGroup]);
        alert(`Group "${createdGroup.groupName}" created! You can find it in the "My Groups" tab.`);
        setActiveTab('my-groups');
      } catch (err) {
        setError("Failed to create the group.");
      }
  };

  const handleJoinGroup = async (groupToJoin: Group) => {
    if (!currentUser) return;

    if (groupToJoin.members.includes(currentUser.username)) {
        setActiveChatGroup(groupToJoin);
        return;
    }

    const updatedGroupData: Group = {
      ...groupToJoin,
      members: [...groupToJoin.members, currentUser.username],
    };
    
    try {
        const updatedGroup = await api.updateGroup(updatedGroupData);
        setAllGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g));
        alert(`You have joined "${updatedGroup.groupName}"!`);
        setActiveChatGroup(updatedGroup);
    } catch (err) {
        setError("Failed to join the group.");
    }
  };

  const handleUpdateGroup = async (updatedGroup: Group) => {
    try {
        const savedGroup = await api.updateGroup(updatedGroup);
        setAllGroups(prev => prev.map(g => g.id === savedGroup.id ? savedGroup : g));
        if (activeChatGroup && activeChatGroup.id === savedGroup.id) {
            setActiveChatGroup(savedGroup);
        }
    } catch (err) {
        setError("Failed to update group information.");
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!currentUser) return;

    const group = allGroups.find(g => g.id === groupId);
    if (!group) return;

    // If the user is the last member, delete the group. Otherwise, just remove them.
    if (group.members.length === 1) {
        await handleDeleteGroup(groupId, `You were the last member, so "${group.groupName}" has been deleted.`);
    } else {
        const updatedGroupData: Group = {
            ...group,
            members: group.members.filter(username => username !== currentUser.username),
            admin: group.admin === currentUser.username ? group.members.filter(username => username !== currentUser.username)[0] : group.admin
        };
        try {
            const updatedGroup = await api.updateGroup(updatedGroupData);
            setAllGroups(prev => prev.map(g => g.id === updatedGroup.id ? updatedGroup : g));
            alert(`You have left "${updatedGroup.groupName}".`);
        } catch (err) {
            setError("Failed to leave the group.");
        }
    }
    setActiveChatGroup(null);
  };

  const handleDeleteGroup = async (groupId: string, customMessage?: string) => {
    const group = allGroups.find(g => g.id === groupId);
    if (!group) return;
    
    if (currentUser && group.admin !== currentUser.username) {
        alert("Only the group admin can delete the group.");
        return;
    }

    const confirmMessage = customMessage ? `Are you sure? ${customMessage}` : `Are you sure you want to permanently delete the group "${group.groupName}"?`;
    if (window.confirm(confirmMessage)) {
      try {
        await api.deleteGroup(groupId);
        setAllGroups(prev => prev.filter(g => g.id !== groupId));
        if (customMessage) alert(customMessage);
        setActiveChatGroup(null);
      } catch (err) {
        setError("Failed to delete the group.");
      }
    }
  };

  if (!currentUser) {
    return <AuthScreen onLogin={handleLogin} onRegister={handleRegister} authError={error} setAuthError={setError} />;
  }

  if (activeChatGroup) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-6 lg:p-8 flex items-center justify-center">
          <div className="w-full max-w-4xl h-[85vh]">
            <GroupChat 
                group={activeChatGroup} 
                currentUser={currentUser} 
                onBack={() => setActiveChatGroup(null)}
                onUpdateGroup={handleUpdateGroup}
                onLeaveGroup={handleLeaveGroup}
                onDeleteGroup={handleDeleteGroup}
                allStudents={allStudents}
            />
          </div>
      </div>
    );
  }

  const TabButton: React.FC<{ tabId: ActiveTab; label: string; }> = ({ tabId, label }) => (
    <button
        onClick={() => setActiveTab(tabId)}
        className={`px-4 sm:px-5 py-2.5 text-sm font-bold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-400 ${
        activeTab === tabId
            ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20'
            : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
        }`}
    >
        {label}
    </button>
  );
  
  const myGroups = allGroups.filter(g => g.members.includes(currentUser.username));
  const otherGroups = allGroups.filter(g => !g.members.includes(currentUser.username));

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Header currentUser={currentUser} onLogout={handleLogout} />
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-1 flex flex-col gap-8">
            <ProfileForm student={currentUser} addStudent={handleProfileUpdate} isGenerating={isGenerating} />
          </div>
          <div className="lg:col-span-2 flex flex-col gap-8">
            
            {isGenerating && (
              <div className="text-center p-10 bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-700">
                <SparklesIcon className="w-16 h-16 mx-auto text-cyan-400 animate-pulse" />
                <p className="mt-4 text-xl font-bold text-slate-300">Finding the best matches for you...</p>
                <p className="text-slate-400">Our AI is analyzing profiles and resources.</p>
              </div>
            )}
            {error && <p className="text-red-300 bg-red-900/50 p-4 rounded-lg border border-red-700">{error}</p>}
            
            {!isGenerating && !error && (
                <>
                    {/* --- Tab Navigation --- */}
                    <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 p-2 rounded-xl flex items-center justify-center gap-2 flex-wrap">
                        <TabButton tabId="students" label="Matched Students" />
                        <TabButton tabId="matched-groups" label="Matched Groups" />
                        <TabButton tabId="my-groups" label="My Groups" />
                        <TabButton tabId="all-groups" label="All Groups" />
                        <TabButton tabId="resources" label="Online Resources" />
                    </div>

                    {/* --- Tab Content --- */}
                    <div className="space-y-8">
                        {activeTab === 'students' && suggestions && <SuggestedStudents students={suggestions.matchedStudents} onCreateGroup={handleCreateGroup} />}
                        {activeTab === 'matched-groups' && suggestions && <SuggestedGroups groups={suggestions.matchedGroups} onJoinGroup={handleJoinGroup} />}
                        
                        {activeTab === 'my-groups' && <MyGroupsView 
                          groups={myGroups}
                          onViewGroup={setActiveChatGroup} 
                          allStudents={allStudents}
                        />}
                        {activeTab === 'all-groups' && <GroupDirectory 
                          groups={otherGroups}
                          onJoinGroup={handleJoinGroup}
                          allStudents={allStudents}
                        />}
                        
                        {activeTab === 'resources' && suggestions && <OnlineResources resources={suggestions.onlineResources} error={null} isLoading={false}/>}
                        
                        {!suggestions && (activeTab === 'students' || activeTab === 'matched-groups' || activeTab === 'resources') && (
                             <div className="text-center p-10 bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-700 h-full flex flex-col justify-center items-center">
                                <UserCircleIcon className="w-24 h-24 mx-auto text-slate-600" />
                                <h2 className="mt-2 text-2xl font-bold text-white">Welcome, {currentUser.name}!</h2>
                                <p className="mt-2 text-slate-400 max-w-sm mx-auto">Update your profile with your courses, CGPA, and availability, then click "Get AI Suggestions" to discover your ideal study network.</p>
                            </div>
                        )}
                    </div>
                </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

// --- Authentication Screen Component ---
const AuthScreen: React.FC<{
  onLogin: (user: User) => void;
  onRegister: (user: User) => void;
  authError: string | null;
  setAuthError: (error: string | null) => void;
}> = ({ onLogin, onRegister, authError, setAuthError }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    // Clear auth error when switching between login/register
    setAuthError(null);
  }, [isLoginView, setAuthError]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!username || !password) {
      setAuthError('Username and password are required.');
      return;
    }
    if (isLoginView) {
        onLogin({ username, password });
    } else {
        onRegister({ username, password });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              AI Study Group Facilitator
            </h1>
            <p className="mt-3 text-lg text-slate-300">Sign in to unlock your potential.</p>
        </div>
        <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-2xl shadow-2xl p-8">
          <div className="flex border-b border-slate-600 mb-6">
            <button onClick={() => setIsLoginView(true)} className={`flex-1 pb-3 font-bold text-center transition ${isLoginView ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}>
              Login
            </button>
            <button onClick={() => setIsLoginView(false)} className={`flex-1 pb-3 font-bold text-center transition ${!isLoginView ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:text-white'}`}>
              Register
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-2">Username</label>
              <input id="username" type="text" value={username} onChange={e => setUsername(e.target.value)} required className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            </div>
            <div>
              <label htmlFor="password"className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500" />
            </div>
            {authError && <p className="text-red-400 text-sm text-center">{authError}</p>}
            <button type="submit" className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-cyan-500/20 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 ring-offset-2 ring-offset-slate-800 ring-cyan-400">
              {isLoginView ? 'Log In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};


export default App;
