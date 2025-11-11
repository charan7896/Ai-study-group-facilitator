import React from 'react';
import { UserGroupIcon } from './icons/UserGroupIcon';
import { Student } from '../types';

interface Props {
  currentUser: Student;
  onLogout: () => void;
}

const Header: React.FC<Props> = ({ currentUser, onLogout }) => {
  return (
    <header className="relative text-center py-4 px-6 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-700/50">
      <div className="flex items-center justify-center gap-4">
        <div className="p-3 bg-cyan-900/50 rounded-full hidden sm:block">
            <UserGroupIcon className="w-8 h-8 text-cyan-400" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
          AI Study Group Facilitator
        </h1>
      </div>
      <div className="absolute top-1/2 -translate-y-1/2 right-4 sm:right-6 flex items-center gap-4">
        <span className="text-sm text-slate-300 hidden md:inline">Welcome, <span className="font-bold text-white">{currentUser.name}</span></span>
        <button 
          onClick={onLogout}
          className="bg-slate-700 hover:bg-red-500/80 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors duration-300"
        >
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
