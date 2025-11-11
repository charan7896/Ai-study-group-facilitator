import React from 'react';
import { Group, Student } from '../types';
import { GroupCard } from './GroupCard';

interface Props {
  groups: Group[];
  onJoinGroup: (group: Group) => void;
  allStudents: Student[];
}

const GroupDirectory: React.FC<Props> = ({ groups, onJoinGroup, allStudents }) => {
  return (
    <div className="bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-2xl shadow-slate-950/50 border border-slate-700">
        <h2 className="text-2xl font-bold mb-4 text-cyan-400">Browse Other Groups ({groups.length})</h2>
        <div className="space-y-4">
            {groups.length === 0 ? (
                <p className="text-slate-400 text-center py-4">No other groups are available to join right now.</p>
            ) : (
                groups.map(group => (
                    <GroupCard key={group.id} group={group} action="join" onAction={onJoinGroup} allStudents={allStudents} />
                ))
            )}
        </div>
    </div>
  );
};

export default GroupDirectory;
