import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import { Plus, Play, Sun, CloudRain, Cloud, CloudLightning, CircleDashed, Loader2, Folder, Workflow, Box } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [projects, setProjects] = useState<any[]>([]);

    const fetchProjects = async () => {
        try {
            const res = await api.get('/api/projects');
            setProjects(res.data.filter((p: any) => p.userId === user?.id && !p.parentId));
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchProjects();
        const interval = setInterval(fetchProjects, 3000);
        return () => clearInterval(interval);
    }, [user]);

    const handleTrigger = async (projectId: string) => {
        try {
            const res = await api.post(`/webhook/${projectId}`);
            if (res.data.pipelineId) {
                navigate(`/pipeline/${res.data.pipelineId}`);
            }
        } catch (err) {}
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

    return (
        <div className="w-full text-slate-200">
            {/* Jenkins Dashboard Table Layout */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden shadow-2xl shadow-black/60">
                {/* Tabs bar */}
                <div className="bg-slate-900 border-b border-slate-800 flex items-center px-4 pt-2 pb-0 gap-1">
                    <div className="bg-[#0a0f18] border border-b-0 border-slate-700 px-5 py-2 text-sm font-semibold rounded-t-md text-blue-400 shadow-[0_1px_0_0_#0a0f18] translate-y-[1px] relative">
                        All
                    </div>
                    <Link to="/new" className="px-3 py-2 text-slate-500 hover:text-white transition-colors">
                        <Plus className="h-4 w-4" />
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead>
                            <tr className="bg-slate-900/50 text-slate-400 font-medium border-b border-slate-800">
                                <th className="px-4 py-3 w-12 text-center" title="Status">S</th>
                                <th className="px-4 py-3 w-12 text-center" title="Weather">W</th>
                                <th className="px-4 py-3">Name ↓</th>
                                <th className="px-4 py-3">Last Success</th>
                                <th className="px-4 py-3">Last Failure</th>
                                <th className="px-4 py-3">Last Duration</th>
                                <th className="px-4 py-3 w-12 text-center"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50 cursor-pointer">
                            {projects.map((project, idx) => {
                                const m = getMetrics(project.pipelines);
                                const isFolder = project.type === 'folder';
                                return (
                                    <tr key={project.id} className={`${idx % 2 === 0 ? 'bg-[#0a0f18]' : 'bg-slate-950/50'} hover:bg-slate-800/40 transition-colors group relative`} onClick={(e) => {
                                        // Ignore clicks on play button
                                        if ((e.target as HTMLElement).closest('button')) return;
                                        navigate(`/project/${project.id}`);
                                    }}>
                                        <td className="px-4 py-3 text-center">
                                            {isFolder ? <Folder className="h-5 w-5 text-slate-500 mx-auto" fill="currentColor" /> : (
                                                <>
                                                    {m.status === 'success' && <div className="h-4 w-4 rounded-full bg-blue-500 mx-auto shadow-[0_0_10px_rgba(59,130,246,0.5)]" title="Success"></div>}
                                                    {m.status === 'failed' && <div className="h-4 w-4 rounded-full bg-red-500 mx-auto shadow-[0_0_10px_rgba(239,68,68,0.5)]" title="Failed"></div>}
                                                    {m.status === 'running' && <div title="Running" className="flex justify-center"><Loader2 className="h-4 w-4 text-blue-400 animate-spin" /></div>}
                                                    {m.status === 'none' && <div className="h-4 w-4 rounded-full border-2 border-slate-600 border-dashed mx-auto" title="Not Built"></div>}
                                                </>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center flex justify-center text-slate-400">
                                            {isFolder ? <span className="text-slate-600">-</span> : (
                                                <>
                                                    {m.weather === 'sun' && <div title="Healthy"><Sun className="h-5 w-5 text-yellow-500 drop-shadow-md" /></div>}
                                                    {m.weather === 'cloud' && <div title="Mostly Healthy"><Cloud className="h-5 w-5 text-slate-300" /></div>}
                                                    {m.weather === 'rain' && <div title="Unhealthy"><CloudRain className="h-5 w-5 text-blue-300" /></div>}
                                                    {m.weather === 'lightning' && <div title="Failing"><CloudLightning className="h-5 w-5 text-slate-500" /></div>}
                                                    {m.weather === 'none' && <div title="No Data"><CircleDashed className="h-5 w-5 text-slate-700" /></div>}
                                                </>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                {!isFolder && project.type === 'freestyle' && <Box className="h-3.5 w-3.5 text-slate-500" />}
                                                {!isFolder && (!project.type || project.type === 'pipeline') && <Workflow className="h-3.5 w-3.5 text-slate-500" />}
                                                <span className="text-blue-400 group-hover:underline group-hover:text-blue-300 font-medium">
                                                    {project.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-300">{isFolder ? '' : m.success}</td>
                                        <td className="px-4 py-3 text-slate-300">{isFolder ? '' : m.failure}</td>
                                        <td className="px-4 py-3 text-slate-300">{isFolder ? '' : m.duration}</td>
                                        <td className="px-4 py-3 text-center">
                                            {!isFolder && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleTrigger(project.id); }}
                                                    className="p-1.5 rounded bg-slate-800/50 hover:bg-green-500/20 text-slate-500 hover:text-green-400 transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Build Now"
                                                >
                                                    <Play className="h-4 w-4 fill-current" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                            
                            {projects.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                                        Welcome to PipelineX! Please create a new item to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* Optional Jenkins Footer Icon */}
            <div className="flex justify-between items-center mt-6 px-2 text-xs text-slate-500">
                <div className="flex items-center gap-1 font-mono">
                    <span>Icon:</span>
                    <span className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">&nbsp;S&nbsp;</span>
                    <span className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">&nbsp;M&nbsp;</span>
                    <span className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">&nbsp;L&nbsp;</span>
                </div>
                <div>REST API &nbsp;&nbsp;|&nbsp;&nbsp; Jenkins 2.x Wrapper</div>
            </div>
        </div>
    );
}
