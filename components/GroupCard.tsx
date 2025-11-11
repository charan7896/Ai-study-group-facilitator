import React from 'react';
import { Group, Student } from '../types';
import { ChatBubbleIcon } from './icons/ChatBubbleIcon';

interface Props {
  group: Group;
  action: 'join' | 'view';
  onAction: (group: Group) => void;
  allStudents: Student[];
}

export const GroupCard: React.FC<Props> = ({ group, action, onAction, allStudents }) => {
    const memberNames = group.members.map(username => 
        allStudents.find(s => s.username === username)?.name || username
    );

    return (
    <div className="bg-slate-700/50 p-4 rounded-xl shadow-md border border-slate-700 transition-all hover:border-amber-500/50 hover:shadow-amber-500/10">
      <div className="flex justify-between items-start gap-4">
          <div>
            <h3 className="font-bold text-xl text-amber-300">{group.groupName}</h3>
            <div className="flex flex-wrap gap-2 mt-2">
                {group.focusCourses.map(course => (
                    <span key={course} className="bg-cyan-900 text-cyan-200 text-xs font-semibold px-2.5 py-1 rounded-full">{course}</span>
                ))}
            </div>
          </div>
          <button 
            onClick={() => onAction(group)}
            className="flex-shrink-0 flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold text-sm py-2 px-4 rounded-lg shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-400"
            >
                <ChatBubbleIcon className="w-4 h-4" />
                {action === 'join' ? 'Join Chat' : 'View Chat'}
            </button>
      </div>

      <div className="mt-4 border-t border-slate-600/70 pt-3">
        <p className="font-semibold text-slate-300 text-sm mb-2">Members ({memberNames.length}):</p>
        <div className="flex flex-wrap gap-2">
          {memberNames.map(member => (
              <span key={member} className="bg-slate-600 text-white text-sm font-medium px-3 py-1 rounded-full">{member}</span>
          ))}
        </div>
      </div>
    </div>
)};
