import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { Play, ArrowLeft, GitCommit, Clock, CheckCircle2, XCircle, AlertCircle, Plus, Folder, Workflow, Box, Loader2, Sun, CloudRain, Cloud, CloudLightning, CircleDashed } from 'lucide-react';

export default function ProjectDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const projRes = await api.get(`/api/projects/${id}`);
            setProject(projRes.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 3000); // Polling for updates
        return () => clearInterval(interval);
    }, [id]);

    const triggerPipeline = async () => {
        try {
            const res = await api.post(`/webhook/${id}`);
            if (res.data.pipelineId) {
                navigate(`/pipeline/${res.data.pipelineId}`);
            }
            fetchData();
        } catch (err) {
            console.error('Failed to trigger pipeline');
        }
    };

    const getMetrics = (pipelines: any[]) => {
        if (!pipelines || pipelines.length === 0) return { status: 'none', weather: 'none', success: 'N/A', failure: 'N/A', duration: 'N/A' };
        
        const latest = pipelines[0];
        const successes = pipelines.filter(p => p.status === 'success');
        const failures = pipelines.filter(p => p.status === 'failed');
        const successRate = pipelines.length > 0 ? successes.length / pipelines.length : 0;
        
        let weather = 'sun';
        if (successRate < 0.2) weather = 'lightning';
        else if (successRate <= 0.5) weather = 'rain';
        else if (successRate < 0.8) weather = 'cloud';
        
        const formatTime = (date: any) => {
            if (!date) return 'N/A';
            const diff = Date.now() - new Date(date).getTime();
            const mins = Math.floor(diff / 60000);
            if (mins < 60) return `${mins} min ago`;
            const hrs = Math.floor(mins / 60);
            if (hrs < 24) return `${hrs} hr ago`;
            return `${Math.floor(hrs / 24)} days ago`;
        };

        const duration = latest.endedAt && latest.startedAt ? 
            `${Math.floor((new Date(latest.endedAt).getTime() - new Date(latest.startedAt).getTime()) / 1000)} sec` : 
            'N/A';

        return {
            status: latest.status,
            weather,
            success: successes.length > 0 ? formatTime(successes[0].endedAt) : 'N/A',
            failure: failures.length > 0 ? formatTime(failures[0].endedAt) : 'N/A',
            duration: latest.status === 'running' ? 'In progress' : duration
        };
    };

    const triggerNestedProject = async (nestedId: string, e: any) => {
        e.stopPropagation();
        try {
            const res = await api.post(`/webhook/${nestedId}`);
            if (res.data.pipelineId) {
                navigate(`/pipeline/${res.data.pipelineId}`);
            }
        } catch (err) {}
    };

    if (loading) return <div className="min-h-screen bg-[#0a0f18] text-white flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>;

    const isFolder = project.type === 'folder';

    return (
        <div className="w-full text-slate-100 pb-20">
            <div className="border-b border-slate-800 bg-slate-900/50 -mt-6 -mx-6 px-6 mb-8 sticky top-0 z-40 backdrop-blur-md">
                <div className="max-w-7xl mx-auto py-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(project.parentId ? `/project/${project.parentId}` : '/')} className="text-slate-400 hover:text-white transition-colors bg-slate-800/50 p-2 rounded-full"><ArrowLeft className="h-5 w-5"/></button>
                        <div className="flex items-center gap-3">
                            {isFolder && <Folder className="h-7 w-7 text-slate-400" fill="currentColor" />}
                            {!isFolder && project.type === 'freestyle' && <Box className="h-7 w-7 text-blue-400" />}
                            {!isFolder && project.type === 'pipeline' && <Workflow className="h-7 w-7 text-blue-400" />}
                            <div>
                                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">{project?.name}</h1>
                                {!isFolder && <p className="text-sm text-slate-500 font-mono mt-0.5">{project?.repoUrl || 'No repository linked'}</p>}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {isFolder ? (
                            <Link
                                to={`/new?parentId=${project.id}`}
                                className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors border border-slate-700"
                            >
                                <Plus className="h-4 w-4" /> New Item
                            </Link>
                        ) : (
                            <>
                                {project.type === 'freestyle' && (
                                    <Link to={`/project/${project.id}/configure`} className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg font-medium transition-colors border border-slate-700">
                                        Configure
                                    </Link>
                                )}
                                <button
                                    onClick={triggerPipeline}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-lg shadow-blue-500/20"
                                >
                                    <Play className="h-4 w-4 fill-current" /> Build Now
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto">
                {isFolder ? (
                    <div>
                        <h2 className="text-lg font-medium mb-4 text-slate-300 px-1">Contents of {project.name}</h2>
                        <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden shadow-xl">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead>
                                    <tr className="bg-slate-900/50 text-slate-400 font-medium border-b border-slate-800">
                                        <th className="px-4 py-3 w-12 text-center">S</th>
                                        <th className="px-4 py-3 w-12 text-center">W</th>
                                        <th className="px-4 py-3">Name ↓</th>
                                        <th className="px-4 py-3">Last Success</th>
                                        <th className="px-4 py-3">Last Failure</th>
                                        <th className="px-4 py-3">Last Duration</th>
                                        <th className="px-4 py-3 w-12 text-center"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50 cursor-pointer">
                                    {(project.children || []).map((child: any, idx: number) => {
                                        const m = getMetrics(child.pipelines);
                                        const isChildFolder = child.type === 'folder';
                                        return (
                                            <tr key={child.id} className={`${idx % 2 === 0 ? 'bg-[#0a0f18]' : 'bg-slate-950/50'} hover:bg-slate-800/40 transition-colors group`} onClick={() => navigate(`/project/${child.id}`)}>
                                                <td className="px-4 py-3 text-center">
                                                    {isChildFolder ? <Folder className="h-5 w-5 text-slate-500 mx-auto" fill="currentColor" /> : (
                                                        <>
                                                            {m.status === 'success' && <div className="h-4 w-4 rounded-full bg-blue-500 mx-auto"></div>}
                                                            {m.status === 'failed' && <div className="h-4 w-4 rounded-full bg-red-500 mx-auto"></div>}
                                                            {m.status === 'running' && <div className="flex justify-center"><Loader2 className="h-4 w-4 text-blue-400 animate-spin" /></div>}
                                                            {m.status === 'none' && <div className="h-4 w-4 rounded-full border-2 border-slate-600 border-dashed mx-auto"></div>}
                                                        </>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-center flex justify-center">
                                                    {isChildFolder ? <span className="text-slate-600">-</span> : (
                                                        <>
                                                            {m.weather === 'sun' && <Sun className="h-5 w-5 text-yellow-500" />}
                                                            {m.weather === 'cloud' && <Cloud className="h-5 w-5 text-slate-400" />}
                                                            {m.weather === 'rain' && <CloudRain className="h-5 w-5 text-blue-400" />}
                                                            {m.weather === 'lightning' && <CloudLightning className="h-5 w-5 text-slate-500" />}
                                                            {m.weather === 'none' && <CircleDashed className="h-5 w-5 text-slate-700" />}
                                                        </>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        {!isChildFolder && child.type === 'freestyle' && <Box className="h-3.5 w-3.5 text-slate-500" />}
                                                        {!isChildFolder && (!child.type || child.type === 'pipeline') && <Workflow className="h-3.5 w-3.5 text-slate-500" />}
                                                        <span className="text-blue-400 group-hover:underline font-medium">{child.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-slate-400">{isChildFolder ? '' : m.success}</td>
                                                <td className="px-4 py-3 text-slate-400">{isChildFolder ? '' : m.failure}</td>
                                                <td className="px-4 py-3 text-slate-400">{isChildFolder ? '' : m.duration}</td>
                                                <td className="px-4 py-3 text-center">
                                                    {!isChildFolder && (
                                                        <button 
                                                            onClick={(e) => triggerNestedProject(child.id, e)}
                                                            className="p-1.5 rounded bg-slate-800/50 hover:bg-green-500/20 text-slate-500 hover:text-green-400 opacity-0 group-hover:opacity-100 transition-all"
                                                        >
                                                            <Play className="h-4 w-4 fill-current" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    
                                    {(!project.children || project.children.length === 0) && (
                                        <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">This folder is empty.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div>
                        <h2 className="text-lg font-medium mb-4 text-slate-300 px-1">Build History</h2>
                        <div className="space-y-3">
                            {(!project.pipelines || project.pipelines.length === 0) ? (
                                <div className="text-center py-16 bg-slate-900/30 rounded-xl border border-dashed border-slate-700">
                                    <Clock className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                                    <p className="text-slate-400 font-medium">No builds have been run yet.</p>
                                    <p className="text-slate-500 text-sm mt-1">Click Build Now to start your first pipeline.</p>
                                </div>
                            ) : (
                                project.pipelines.map((pipe: any) => (
                                    <Link
                                        key={pipe.id}
                                        to={`/pipeline/${pipe.id}`}
                                        className="block bg-slate-900/80 border border-slate-800 rounded-lg p-4 hover:border-slate-600 hover:bg-slate-800/50 transition-all shadow-sm group"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 bg-slate-950 rounded-full border border-slate-800 group-hover:border-slate-700 transition-colors">
                                                    {pipe.status === 'success' && <CheckCircle2 className="h-5 w-5 text-blue-500" />}
                                                    {pipe.status === 'failed' && <XCircle className="h-5 w-5 text-red-500" />}
                                                    {pipe.status === 'running' && <AlertCircle className="h-5 w-5 text-blue-400 animate-pulse" />}
                                                    {pipe.status === 'pending' && <Clock className="h-5 w-5 text-slate-500" />}
                                                </div>

                                                <div>
                                                    <div className="font-semibold text-[15px] flex items-center gap-3 text-slate-200">
                                                        Pipeline #{pipe.id.substring(0, 6)}
                                                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-950 text-slate-400 border border-slate-800 uppercase tracking-wider">
                                                            {pipe.status}
                                                        </span>
                                                    </div>
                                                    <div className="text-[13px] text-slate-500 flex items-center gap-2 mt-1 font-medium">
                                                        <GitCommit className="h-3.5 w-3.5 text-slate-600" /> {pipe.triggerType}
                                                        <span className="text-slate-700">•</span>
                                                        {new Date(pipe.createdAt).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-blue-500 text-sm font-medium group-hover:translate-x-1 transition-transform">Console Output &rarr;</div>
                                        </div>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
