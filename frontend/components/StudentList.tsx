import React, { useState } from 'react';
import { MatchedStudent } from '../types';
import { PlusIcon } from './icons/PlusIcon';

interface Props {
  students: MatchedStudent[];
  onCreateGroup: (selectedStudentUsernames: string[]) => void;
}

const Tag: React.FC<{ children: React.ReactNode; color: string; }> = ({ children, color }) => (
    <span className={`inline-block text-xs font-semibold mr-1.5 mb-1.5 px-3 py-1 rounded-full ${color}`}>
        {children}
    </span>
);

const SuggestedStudents: React.FC<Props> = ({ students, onCreateGroup }) => {
  const [selected, setSelected] = useState<string[]>([]); // Will store usernames

  const handleToggle = (username: string) => {
    setSelected(prev => 
      prev.includes(username) ? prev.filter(u => u !== username) : [...prev, username]
    );
  };

  const handleCreate = () => {
    onCreateGroup(selected);
    setSelected([]);
  }

  if (students.length === 0) return null;

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-2xl shadow-slate-950/50 border border-slate-700">
      <h2 className="text-2xl font-bold mb-4 text-cyan-400">Recommended Peers</h2>
      <div className="space-y-4">
        {students.map(student => (
          <div key={student.username} className={`bg-slate-700/50 p-4 rounded-xl shadow-md transition-all border ${selected.includes(student.username) ? 'border-cyan-500 bg-slate-700' : 'border-slate-700 hover:border-slate-600'}`}>
            <div className="flex items-start justify-between">
                <div className="flex-grow pr-4">
                    <div className="flex items-center gap-3">
                        <h3 className="font-bold text-lg text-white">{student.name}</h3>
                        <Tag color="bg-amber-900 text-amber-200">CGPA: {student.cgpa}</Tag>
                    </div>
                    <p className="text-sm text-slate-300 italic mt-2 bg-slate-900/30 p-2 rounded-md border-l-2 border-slate-600">{student.reasoning}</p>
                </div>
                <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-slate-600/50">
                    <input 
                        type="checkbox"
                        checked={selected.includes(student.username)}
                        onChange={() => handleToggle(student.username)}
                        className="form-checkbox h-5 w-5 bg-slate-600 border-slate-500 rounded text-cyan-500 focus:ring-cyan-500"
                    />
                    <span className="text-sm font-semibold text-slate-200">Select</span>
                </label>
            </div>
            <div className="mt-3">
                <p className="font-semibold text-slate-300 text-xs mb-2">Common Courses:</p>
                <div>{student.courses.length > 0 ? student.courses.map(c => <Tag key={c} color="bg-cyan-900 text-cyan-200">{c}</Tag>) : <span className="text-xs text-slate-400 italic ml-2">None listed</span>}</div>
            </div>
          </div>
        ))}
      </div>
      {selected.length > 0 && (
        <div className="mt-6 border-t border-slate-700 pt-4">
          <button onClick={handleCreate} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-emerald-500/20 transition-all transform hover:scale-105">
            <PlusIcon />
            Create Group with {selected.length} Student{selected.length > 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  );
};

export default SuggestedStudents;
