import React from 'react';
import { OnlineResource, OnlineResourceItem } from '../types';
import { GlobeIcon } from './icons/GlobeIcon';

interface Props {
  isLoading: boolean;
  resources: OnlineResource | null;
  error: string | null;
}

const ResourceCard: React.FC<{item: OnlineResourceItem}> = ({ item }) => (
    <div className="bg-gradient-to-br from-slate-700/50 to-slate-800/40 p-4 rounded-xl shadow-md border border-slate-700 flex flex-col justify-between transition-all hover:shadow-lg hover:shadow-emerald-500/10 hover:border-emerald-500/50 transform hover:-translate-y-1">
        <div>
            {item.youtubeVideoId && (
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="block mb-4 rounded-lg overflow-hidden group">
                <img 
                    src={`https://img.youtube.com/vi/${item.youtubeVideoId}/hqdefault.jpg`} 
                    alt={item.title}
                    className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </a>
            )}
            <span className="text-xs font-semibold bg-emerald-900 text-emerald-200 px-2.5 py-1 rounded-full">{item.category}</span>
            <h4 className="font-bold text-lg text-emerald-300 mt-3">{item.title}</h4>
            <p className="text-slate-300 text-sm mt-1 flex-grow">{item.description}</p>
        </div>
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-block text-sm text-cyan-400 hover:text-cyan-300 hover:underline transition-colors mt-4 font-semibold group">
            {item.youtubeVideoId ? 'Watch on YouTube' : 'Visit Resource'} <span className="transition-transform group-hover:translate-x-1 inline-block">&rarr;</span>
        </a>
    </div>
);


const OnlineResources: React.FC<Props> = ({ isLoading, resources, error }) => {
  const hasResources = resources && resources.resources && resources.resources.length > 0;

  if (isLoading || error || !hasResources) return null;

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-2xl shadow-slate-950/50 border border-slate-700">
        <h2 className="text-2xl font-bold mb-4 text-cyan-400">Curated Online Resources</h2>
        <div className="bg-slate-900/40 p-4 rounded-lg mb-6 border border-slate-700">
            <p className="text-slate-200 text-sm whitespace-pre-wrap">{resources.summary}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {resources.resources.slice(0, 4).map((item, index) => ( // Show top 4
                <ResourceCard key={`${item.url}-${index}`} item={item} />
            ))}
        </div>
    </div>
  );
};

export default OnlineResources;
