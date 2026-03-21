import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { ArrowLeft, CheckCircle, XCircle, Loader2, Sparkles, Terminal } from 'lucide-react';

export default function PipelineDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [jobs, setJobs] = useState<any[]>([]);
    const [selectedJob, setSelectedJob] = useState<any>(null);
    const [aiSuggestion, setAiSuggestion] = useState<string>('');
    const [loadingAi, setLoadingAi] = useState(false);
    const logsEndRef = useRef<HTMLDivElement>(null);

    const fetchJobs = async () => {
        try {
            const res = await api.get(`/api/jobs/${id}`);
            setJobs(res.data);
            if (res.data.length > 0 && !selectedJob) {
                setSelectedJob(res.data[0]);
            } else if (selectedJob) {
                // Update selected job data if it changed
                const updated = res.data.find((j: any) => j.id === selectedJob.id);
                if (updated) setSelectedJob(updated);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchJobs();
        const interval = setInterval(fetchJobs, 2000);
        return () => clearInterval(interval);
    }, [id]);

    useEffect(() => {
        if (selectedJob?.status === 'failed' && !aiSuggestion && !loadingAi) {
            getAiSuggestion(selectedJob.logs);
        }
    }, [selectedJob]);

    // Auto scroll logs
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedJob?.logs]);

    const getAiSuggestion = async (logs: string) => {
        if (!logs) return;
        setLoadingAi(true);
        try {
            const res = await api.post('/api/jobs/ai-analyze', { logs });
            setAiSuggestion(res.data.suggestion);
        } catch (err) {
            setAiSuggestion('AI Assistant could not analyze these logs.');
        }
        setLoadingAi(false);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
            <div className="border-b border-slate-800 bg-slate-900/80 p-4">
                <div className="max-w-7xl mx-auto flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white"><ArrowLeft /></button>
                    <h1 className="text-xl font-bold">Pipeline Execution</h1>
                </div>
            </div>

            <div className="flex-1 max-w-7xl mx-auto w-full flex flex-col md:flex-row p-4 gap-6">
                {/* Stages Sidebar */}
                <div className="w-full md:w-64 space-y-2">
                    <h3 className="font-semibold text-slate-400 mb-4 px-2 uppercase text-sm tracking-wider">Stages</h3>
                    {jobs.map(job => (
                        <button
                            key={job.id}
                            onClick={() => setSelectedJob(job)}
                            className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between transition-colors ${selectedJob?.id === job.id ? 'bg-slate-800 border border-slate-700' : 'hover:bg-slate-900 border border-transparent'}`}
                        >
                            <span className="font-medium capitalize">{job.stageName}</span>
                            {job.status === 'success' && <CheckCircle className="h-5 w-5 text-green-500" />}
                            {job.status === 'failed' && <XCircle className="h-5 w-5 text-red-500" />}
                            {job.status === 'running' && <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />}
                            {job.status === 'pending' && <div className="h-5 w-5 rounded-full border-2 border-slate-600 border-dashed" />}
                        </button>
                    ))}
                </div>

                {/* Console Output */}
                <div className="flex-1 flex flex-col gap-4 min-w-0">
                    <div className="bg-[#0d1117] border border-slate-800 rounded-xl flex-1 flex flex-col overflow-hidden shadow-2xl">
                        <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center gap-2 text-sm text-slate-400">
                            <Terminal className="h-4 w-4" />
                            <span className="capitalize">{selectedJob?.stageName || 'Console'} Logs</span>
                        </div>
                        <div className="p-4 overflow-y-auto font-mono text-sm text-slate-300 flex-1 whitespace-pre-wrap">
                            {selectedJob?.logs || 'Waiting for logs...'}
                            <div ref={logsEndRef} />
                        </div>
                    </div>

                    {/* AI Assistant Panel */}
                    {(selectedJob?.status === 'failed' || loadingAi || aiSuggestion) && (
                        <div className="bg-slate-900 border border-indigo-500/30 rounded-xl p-5 shadow-lg shadow-indigo-900/20 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                            <div className="flex gap-4">
                                <div className="bg-indigo-500/20 p-2 rounded-lg h-fit">
                                    <Sparkles className="h-6 w-6 text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-indigo-100 mb-1">AI DevOps Assistant</h3>
                                    {loadingAi ? (
                                        <div className="flex items-center gap-2 text-indigo-300 text-sm">
                                            <Loader2 className="h-4 w-4 animate-spin" /> Analyzing failure...
                                        </div>
                                    ) : (
                                        <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                                            {aiSuggestion}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
