import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { Settings, Save, TerminalSquare } from 'lucide-react';

export default function FreestyleConfig() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState<any>(null);
    const [script, setScript] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const res = await api.get(`/api/projects/${id}`);
                setProject(res.data);
                setScript(res.data.script || '');
            } catch (err) {
                console.error(err);
            }
        };
        fetchProject();
    }, [id]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put(`/api/projects/${id}`, { script });
            navigate(`/project/${id}`); // Back to the project details
        } catch (err) {
            console.error('Failed to save configuration');
        }
        setSaving(false);
    };

    if (!project) return <div className="p-8 text-slate-400">Loading Configuration...</div>;

    return (
        <div className="w-full max-w-5xl py-6 text-slate-200">
            <div className="flex items-center gap-3 mb-8 border-b border-slate-800 pb-4">
                <Settings className="h-8 w-8 text-slate-400" />
                <div>
                    <h1 className="text-2xl font-bold">Configure {project.name}</h1>
                    <p className="text-slate-500 text-sm">Freestyle Project Configuration</p>
                </div>
            </div>

            <div className="bg-[#0a0f18] border border-slate-800 rounded-lg p-6 shadow-xl mb-8">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
                    <TerminalSquare className="h-5 w-5 text-blue-400" />
                    <h2 className="text-lg font-semibold text-slate-300">Execute shell</h2>
                </div>
                
                <p className="text-sm text-slate-400 mb-4">
                    Type raw shell scripting commands that will physically execute on the Jenkins Master (Built-In Node) when this job is triggered.
                </p>

                <div className="bg-slate-950 rounded-md border border-slate-700 overflow-hidden font-mono text-sm relative form-textarea-container">
                    <textarea 
                        value={script}
                        onChange={(e) => setScript(e.target.value)}
                        placeholder="#!/bin/bash&#10;echo 'Hello World'&#10;npm install&#10;npm test"
                        className="w-full h-80 bg-transparent text-green-400 p-4 focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-y"
                        spellCheck="false"
                    />
                </div>
            </div>

            <div className="flex gap-4">
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-2 rounded font-medium shadow transition-colors flex items-center gap-2"
                >
                    <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save'}
                </button>
                <button 
                    onClick={() => navigate(`/project/${id}`)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-6 py-2 rounded font-medium shadow transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
