import { useState, useEffect } from 'react';
import { Monitor } from 'lucide-react';

export default function ManageNodes() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Create a deterministic but somewhat dynamic mock data to map to Jenkins screenshot precisely
    const mockDisk = mounted ? (10 + Math.random() * 2).toFixed(2) : "11.16";
    const mockSwap = mounted ? (16 + Math.random() * 2).toFixed(2) : "17.53";

    return (
        <div className="w-full text-slate-200">
            <div className="mb-6 flex justify-between items-center">
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-200 shadow-sm border border-slate-800 px-4 py-1.5 rounded-full inline-block bg-slate-900/50">
                    Nodes
                </h1>
                <div className="flex gap-3">
                    <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 text-sm font-medium rounded transition-colors">+ New Node</button>
                    <button className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-1.5 text-sm font-medium rounded transition-colors border border-slate-700">Configure Monitors</button>
                </div>
            </div>
            
            <p className="text-slate-400 text-sm mb-6 px-1">Add, remove, control and monitor the various nodes that PipelineX runs jobs on.</p>

            <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden shadow-2xl shadow-black/60">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead>
                            <tr className="bg-slate-900/50 text-slate-400 font-medium border-b border-slate-800">
                                <th className="px-4 py-3 w-12 text-center">S</th>
                                <th className="px-4 py-3">Name ↓</th>
                                <th className="px-4 py-3">Architecture</th>
                                <th className="px-4 py-3">Clock Difference</th>
                                <th className="px-4 py-3">Free Disk Space</th>
                                <th className="px-4 py-3">Free Swap Space</th>
                                <th className="px-4 py-3">Free Temp Space</th>
                                <th className="px-4 py-3">Response Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {/* Static Built-in node simulating Backend host */}
                            <tr className="bg-[#0a0f18] hover:bg-slate-800/40 transition-colors group">
                                <td className="px-4 py-4 text-center">
                                    <Monitor className="h-5 w-5 text-slate-400 mx-auto" />
                                </td>
                                <td className="px-4 py-4">
                                    <span className="text-blue-400 group-hover:underline group-hover:text-blue-300 font-medium cursor-pointer">Built-In Node</span>
                                </td>
                                <td className="px-4 py-4 text-slate-300">Windows 11 (amd64)</td>
                                <td className="px-4 py-4 text-slate-300">In sync</td>
                                <td className="px-4 py-4 text-slate-300">{mockDisk} GiB</td>
                                <td className="px-4 py-4 text-slate-300">{mockSwap} GiB</td>
                                <td className="px-4 py-4 text-slate-300">11.16 GiB</td>
                                <td className="px-4 py-4 text-slate-300">0ms</td>
                            </tr>
                            <tr className="bg-slate-950/30">
                                <td className="px-4 py-2 text-center text-slate-500 font-mono text-xs" colSpan={2}>
                                    Data obtained
                                </td>
                                <td className="px-4 py-2 text-slate-500 font-mono text-xs">4 min 36 sec</td>
                                <td className="px-4 py-2 text-slate-500 font-mono text-xs">4 min 36 sec</td>
                                <td className="px-4 py-2 text-slate-500 font-mono text-xs">4 min 36 sec</td>
                                <td className="px-4 py-2 text-slate-500 font-mono text-xs">4 min 36 sec</td>
                                <td className="px-4 py-2 text-slate-500 font-mono text-xs">4 min 36 sec</td>
                                <td className="px-4 py-2 text-slate-500 font-mono text-xs">4 min 36 sec</td>
                            </tr>
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
                <div>Legend</div>
            </div>
        </div>
    );
}
