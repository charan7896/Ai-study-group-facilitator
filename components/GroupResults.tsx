import React from 'react';
import { Group } from '../types';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';

interface Props {
  groups: Group[];
  onJoinGroup: (group: Group) => void;
}

const SuggestedGroups: React.FC<Props> = ({ groups, onJoinGroup }) => {
  if (groups.length === 0) return null;

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-2xl shadow-slate-950/50 border border-slate-700">
      <h2 className="text-2xl font-bold mb-4 text-cyan-400">Relevant Existing Groups</h2>
      <div className="space-y-5">
        {groups.map((group) => (
          <div key={group.id} className="bg-gradient-to-br from-slate-700/60 to-slate-800/40 p-5 rounded-xl shadow-lg border border-slate-700 transition-all hover:border-cyan-500/50 hover:shadow-cyan-500/10">
            <h3 className="font-bold text-xl text-cyan-300">{group.groupName}</h3>
            
            <div className="mt-4">
              <p className="font-semibold text-slate-300 text-sm mb-1">AI's Reasoning:</p>
              <p className="text-slate-300 text-sm italic bg-slate-900/30 p-3 rounded-md border-l-4 border-slate-600">{group.reasoning}</p>
            </div>

            <div className="mt-4">
              <p className="font-semibold text-slate-300 text-sm mb-2">Focus Courses:</p>
              <div className="flex flex-wrap gap-2">
                {group.focusCourses.map(course => (
                    <span key={course} className="bg-cyan-900 text-cyan-200 text-xs font-semibold px-2.5 py-1 rounded-full">{course}</span>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <p className="font-semibold text-slate-300 text-sm mb-2">Current Members ({group.members.length}):</p>
              <div className="flex flex-wrap gap-2">
                {group.members.map(member => (
                    <span key={member} className="bg-slate-600 text-white text-sm font-medium px-3 py-1 rounded-full">{member}</span>
                ))}
              </div>
            </div>
            
            <div className="mt-5 border-t border-slate-700 pt-4">
                 <button 
                    onClick={() => onJoinGroup(group)}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-2.5 px-4 rounded-lg shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-400"
                >
                    <ChatBubbleIcon className="w-5 h-5" />
                    Join Group & Chat
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SuggestedGroups;
