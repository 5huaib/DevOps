import { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BuildHistory() {
    const { user } = useAuth();
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                // Fetch projects with their pipelines 
                const res = await api.get('/api/projects');
                const projects = res.data.filter((p: any) => p.userId === user?.id);
                
                // Flatten all pipelines into a single timeline array
                let allPipelines: any[] = [];
                projects.forEach((proj: any) => {
                    const mapped = proj.pipelines?.map((pipe: any) => ({
                        ...pipe,
                        projectName: proj.name,
                        projectId: proj.id
                    })) || [];
                    allPipelines = [...allPipelines, ...mapped];
                });

                // Sort purely by startedAt desc
                allPipelines.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
                setHistory(allPipelines);
            } catch (err) {
                console.error(err);
            }
        };

        fetchHistory();
        const interval = setInterval(fetchHistory, 4000);
        return () => clearInterval(interval);
    }, [user]);

    const formatTimeSince = (date: any) => {
        if (!date) return 'N/A';
        const diff = Date.now() - new Date(date).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins} min`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs} hr`;
        return `${Math.floor(hrs / 24)} days`;
    };

    return (
        <div className="w-full text-slate-200">
            <div className="mb-6">
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-200 shadow-sm border border-slate-800 px-4 py-1.5 rounded-full inline-block bg-slate-900/50">
                    Build History of ForgeCI
                </h1>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden shadow-2xl shadow-black/60">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead>
                            <tr className="bg-slate-900/50 text-slate-400 font-medium border-b border-slate-800">
                                <th className="px-4 py-3 w-12 text-center" title="Status">S</th>
                                <th className="px-4 py-3">Build</th>
                                <th className="px-4 py-3">Time Since ↓</th>
                                <th className="px-4 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {history.map((build, idx) => (
                                <tr key={build.id} className={`${idx % 2 === 0 ? 'bg-[#0a0f18]' : 'bg-slate-950/50'} hover:bg-slate-800/40 transition-colors`}>
                                    <td className="px-4 py-3 text-center">
                                        {build.status === 'success' && <div className="h-4 w-4 rounded-full bg-blue-500 mx-auto shadow-[0_0_10px_rgba(59,130,246,0.5)]" title="Success"></div>}
                                        {build.status === 'failed' && <div className="h-4 w-4 rounded-full bg-red-500 mx-auto shadow-[0_0_10px_rgba(239,68,68,0.5)]" title="Failed"></div>}
                                        {build.status === 'running' && <div title="Running" className="flex justify-center"><Loader2 className="h-4 w-4 text-blue-400 animate-spin" /></div>}
                                        {build.status === 'pending' && <div className="h-4 w-4 rounded-full border-2 border-slate-600 border-dashed mx-auto" title="Pending"></div>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col">
                                            <Link to={`/project/${build.projectId}`} className="text-blue-400 hover:text-blue-300 hover:underline font-medium">
                                                {build.projectName}
                                            </Link>
                                            <Link to={`/pipeline/${build.id}`} className="text-xs text-slate-500 hover:text-slate-300 font-mono">
                                                #{build.id.split('-')[0]}
                                            </Link>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-300">
                                        {formatTimeSince(build.startedAt)}
                                    </td>
                                    <td className="px-4 py-3 text-slate-300 capitalize">
                                        {build.status === 'success' && <span className="text-blue-400">Success</span>}
                                        {build.status === 'failed' && <span className="text-red-400">Failed</span>}
                                        {build.status === 'running' && <span className="text-slate-300">In Progress</span>}
                                        {build.status === 'pending' && <span className="text-slate-500">Pending</span>}
                                    </td>
                                </tr>
                            ))}
                            
                            {history.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-12 text-center text-slate-500">
                                        No builds found in the history.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div className="flex justify-between items-center mt-6 px-2 text-xs text-slate-500">
                <div className="flex items-center gap-1 font-mono">
                    <span>Icon:</span>
                    <span className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">&nbsp;S&nbsp;</span>
                    <span className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">&nbsp;M&nbsp;</span>
                    <span className="w-4 h-4 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">&nbsp;L&nbsp;</span>
                </div>
            </div>
        </div>
    );
}
