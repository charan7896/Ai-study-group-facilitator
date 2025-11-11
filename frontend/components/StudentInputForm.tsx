import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Student } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';

interface Props {
  student: Student;
  addStudent: (student: Omit<Student, 'id' | 'username'>) => void;
  isGenerating: boolean;
}

const PREDEFINED_COURSES = ['Intro to CS', 'Data Structures', 'Algorithms', 'Discrete Mathematics', 'Operating Systems', 'Database Systems', 'Computer Networks', 'Software Engineering', 'Artificial Intelligence', 'Machine Learning', 'Web Development', 'Calculus II', 'Linear Algebra'];
const PREDEFINED_AVAILABILITY = ['Mon Morning', 'Mon Afternoon', 'Tue Morning', 'Tue Afternoon', 'Wed Morning', 'Wed Afternoon', 'Thu Morning', 'Thu Afternoon', 'Fri Morning', 'Fri Afternoon', 'Weekends'];

const MultiSelectCombobox: React.FC<{
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder: string;
  id: string;
}> = ({ options, selected, onChange, placeholder, id }) => {
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(option => !selected.includes(option) && option.toLowerCase().includes(inputValue.toLowerCase()));

  const handleSelect = (option: string) => {
    if (option && !selected.includes(option)) onChange([...selected, option]);
    setInputValue('');
    setIsOpen(false);
  };
  
  const handleRemove = (option: string) => onChange(selected.filter(item => item !== option));
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue) {
      e.preventDefault();
      handleSelect(inputValue.trim());
    } else if (e.key === 'Backspace' && !inputValue && selected.length > 0) {
      handleRemove(selected[selected.length - 1]);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="w-full bg-slate-700/70 border border-slate-600 text-white rounded-lg p-2 flex flex-wrap gap-2 items-center cursor-text focus-within:ring-2 focus-within:ring-cyan-500" onClick={() => setIsOpen(true)}>
        {selected.map(item => (
          <span key={item} className="bg-cyan-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5">
            {item}
            <button type="button" onClick={() => handleRemove(item)} className="text-cyan-200 hover:text-white font-bold text-base leading-none">&times;</button>
          </span>
        ))}
        <input id={id} type="text" value={inputValue} onChange={e => { setInputValue(e.target.value); setIsOpen(true); }} onKeyDown={handleKeyDown} onFocus={() => setIsOpen(true)} placeholder={selected.length === 0 ? placeholder : ''} className="bg-transparent flex-grow focus:outline-none text-sm p-1" />
      </div>
      {isOpen && (filteredOptions.length > 0 || inputValue) && (
        <div className="absolute z-10 w-full mt-1 bg-slate-800 border border-slate-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.map(option => <div key={option} className="p-2 hover:bg-slate-700 cursor-pointer text-sm" onClick={() => handleSelect(option)}>{option}</div>)}
          {inputValue && !filteredOptions.includes(inputValue) && !selected.includes(inputValue) && <div className="p-2 text-slate-400 text-sm">Press Enter to add <span className="font-semibold text-white">"{inputValue}"</span></div>}
        </div>
      )}
    </div>
  );
};

const ProfileForm: React.FC<Props> = ({ student, addStudent, isGenerating }) => {
  const [name, setName] = useState(student.name);
  const [courses, setCourses] = useState<string[]>(student.courses);
  const [cgpa, setCgpa] = useState<string>(student.cgpa);
  const [availability, setAvailability] = useState<string[]>(student.availability);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || courses.length === 0 || availability.length === 0 || !cgpa) {
      alert("Please fill in all fields: Name, Courses Needed, CGPA, and Availability.");
      return;
    }
    addStudent({ name, courses, cgpa, availability });
  };
  
  const hasProfileData = student.courses.length > 0;

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-2xl shadow-slate-950/50 border border-slate-700">
      <h2 className="text-2xl font-bold mb-4 text-cyan-400">Your Academic Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">Display Name</label>
          <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-700/70 border border-slate-600 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition" required />
        </div>
        <div>
          <label htmlFor="courses" className="block text-sm font-medium text-slate-300 mb-1">Courses Needed</label>
          <MultiSelectCombobox id="courses" options={PREDEFINED_COURSES} selected={courses} onChange={setCourses} placeholder="Type or select courses..." />
        </div>
         <div>
          <label htmlFor="cgpa" className="block text-sm font-medium text-slate-300 mb-1">Academic CGPA</label>
          <input type="text" id="cgpa" value={cgpa} onChange={e => setCgpa(e.target.value)} placeholder="e.g., 8.5 or 3.8/4.0" className="w-full bg-slate-700/70 border border-slate-600 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition" required />
        </div>
        <div>
          <label htmlFor="availability" className="block text-sm font-medium text-slate-300 mb-1">Availability</label>
          <MultiSelectCombobox id="availability" options={PREDEFINED_AVAILABILITY} selected={availability} onChange={setAvailability} placeholder="Select study times..." />
        </div>
        <button type="submit" disabled={isGenerating} className="w-full mt-2 flex items-center justify-center gap-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:cursor-not-allowed disabled:text-slate-400 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-400/30 transition-all transform hover:scale-105 disabled:scale-100 focus:outline-none focus:ring-4 focus:ring-cyan-400 focus:ring-opacity-50">
          <SparklesIcon />
          {isGenerating ? 'Analyzing...' : (hasProfileData ? 'Update & Get New Suggestions' : 'Get AI Suggestions')}
        </button>
      </form>
    </div>
  );
};

export default ProfileForm;
