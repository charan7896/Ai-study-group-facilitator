import React from 'react';
import { Group, Student } from '../types';
import { GroupCard } from './GroupCard';

interface Props {
  groups: Group[];
  onViewGroup: (group: Group) => void;
  allStudents: Student[];
}

const MyGroupsView: React.FC<Props> = ({ groups, onViewGroup, allStudents }) => {
  return (
    <div className="bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-2xl shadow-slate-950/50 border border-slate-700">
        <h2 className="text-2xl font-bold mb-4 text-cyan-400">My Groups ({groups.length})</h2>
        <div className="space-y-4">
          {groups.length === 0 ? (
            <p className="text-slate-400 text-center py-4">You haven't joined or created any groups yet.</p>
          ) : (
            groups.map(group => (
              <GroupCard key={group.id} group={group} action="view" onAction={onViewGroup} allStudents={allStudents} />
            ))
          )}
        </div>
    </div>
  );
};

export default MyGroupsView;
