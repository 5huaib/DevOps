import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import { Box, Folder, Workflow } from 'lucide-react';

export default function NewItem() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const parentId = searchParams.get('parentId');
    const [name, setName] = useState('');
    const [repoUrl, setRepoUrl] = useState('');
    const [selectedType, setSelectedType] = useState('pipeline');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;
        
        // Validation based on type
        if (selectedType === 'pipeline' && !repoUrl) {
            alert('Git Repository URL is required for Pipeline projects.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await api.post('/api/projects', {
                name,
                repoUrl: selectedType === 'folder' ? null : repoUrl,
                type: selectedType,
                parentId: parentId || null,
                userId: user?.id,
            });
            
            if (selectedType === 'freestyle') {
                // Navigate to the new specific configuration page for freestyle scripts
                navigate(`/project/${res.data.id}/configure`);
            } else {
                navigate('/');
            }
        } catch (err) {
            console.error('Failed to create project', err);
        }
        setSubmitting(false);
    };

    const itemTypes = [
        { id: 'pipeline', name: 'Pipeline', icon: <Workflow className="h-8 w-8 text-blue-400" />, desc: 'Build, test, and deploy using pipelines. Parses Jenkinsfiles to automatically extract build stages.' },
        { id: 'freestyle', name: 'Freestyle project', icon: <Box className="h-8 w-8 text-slate-500" />, desc: 'Classic job type. Executes single monolithic bash/shell scripts natively on the server without needing a Jenkinsfile.' },
        { id: 'folder', name: 'Folder', icon: <Folder className="h-8 w-8 text-slate-500" />, desc: 'Creates a container that stores nested items in it for organizational layout.' },
    ];

    return (
        <div className="w-full max-w-4xl pt-4">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400 mb-6">New Item</h1>
            
            <form onSubmit={handleSubmit} className="bg-[#0a0f18] text-slate-300">
                <div className="mb-8">
                    <label className="block text-sm font-medium mb-2 text-slate-400">Enter an item name</label>
                    <input 
                        type="text" 
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none px-3 py-2 text-slate-100"
                    />
                </div>

                <div className="mb-6">
                    <p className="text-sm font-medium mb-3 text-slate-400">Select an item type</p>
                    <div className="grid grid-cols-1 gap-1 border border-slate-800 rounded bg-slate-950/50">
                        {itemTypes.map((type) => (
                            <div 
                                key={type.id}
                                onClick={() => setSelectedType(type.id)}
                                className={`flex items-start gap-4 p-4 border-b border-slate-800/50 last:border-0 cursor-pointer transition-colors ${selectedType === type.id ? 'bg-blue-900/20 shadow-[inset_4px_0_0_0_#3b82f6]' : 'hover:bg-slate-900/50'}`}
                            >
                                <div className="mt-1">{type.icon}</div>
                                <div>
                                    <h3 className={`font-medium ${selectedType === type.id ? 'text-blue-400' : 'text-slate-200'}`}>{type.name}</h3>
                                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{type.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {selectedType !== 'folder' && (
                    <div className="mb-8 p-4 bg-slate-900/50 border border-slate-800 rounded">
                        <label className="block text-sm font-medium mb-2 text-slate-400">
                            Git Repository URL <span className="text-xs text-blue-400 ml-2">{selectedType === 'pipeline' ? '(Required for Pipelines)' : '(Optional)'}</span>
                        </label>
                        <input 
                            type="url" 
                            placeholder="https://github.com/user/repo"
                            value={repoUrl}
                            onChange={(e) => setRepoUrl(e.target.value)}
                            required={selectedType === 'pipeline'}
                            className="w-full max-w-xl bg-slate-950 border border-slate-700 rounded shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none px-3 py-2 text-slate-100 placeholder-slate-600"
                        />
                        {selectedType === 'freestyle' && (
                            <p className="text-xs text-slate-500 mt-2">If provided, ForgeCI will check out this codebase before executing your script.</p>
                        )}
                    </div>
                )}

                <div className="pt-6 border-t border-slate-800 flex gap-4">
                    <button 
                        type="submit" 
                        disabled={submitting || !name || (selectedType === 'pipeline' && !repoUrl)}
                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-2 rounded shadow transition-colors font-medium"
                    >
                        {submitting ? 'Saving...' : 'OK'}
                    </button>
                    <button 
                        type="button" 
                        onClick={() => navigate('/')}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-6 py-2 rounded shadow transition-colors font-medium"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
