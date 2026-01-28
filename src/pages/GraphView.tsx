import { useEffect, useState, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useAuth } from '../contexts/AuthContext';
import { resourceService } from '../services/resourceService';
import { noteService } from '../services/noteService';
import { useNavigate } from 'react-router-dom';
import type { GraphData } from '../types';
import { useTranslation } from 'react-i18next';

const GraphView = () => {
    const { t } = useTranslation();
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
    const graphRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ w: 800, h: 600 });

    useEffect(() => {
        // Resize observer
        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    w: containerRef.current.clientWidth,
                    h: containerRef.current.clientHeight
                });
            }
        };

        window.addEventListener('resize', updateDimensions);
        updateDimensions(); // Initial

        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    useEffect(() => {
        if (!currentUser) return;

        const loadData = async () => {
            const resources = await resourceService.getUserResources(currentUser.uid);
            const notes = await noteService.getNotes(currentUser.uid);

            const nodes: any[] = [];
            const links: any[] = [];
            const processedNodes = new Set();

            // Add Resources as Nodes
            resources.forEach(r => {
                nodes.push({
                    id: r.id,
                    name: r.title,
                    type: 'resource',
                    val: 10,
                    group: 1
                });
                processedNodes.add(r.id);
            });

            // Add Notes as Nodes & Links
            notes.forEach(n => {
                // Determine if note is meaningful enough to show
                if (!processedNodes.has(n.id)) {
                    nodes.push({
                        id: n.id,
                        name: n.title,
                        type: 'note',
                        val: 5,
                        group: 2
                    });
                    processedNodes.add(n.id);
                }

                // Link Note -> Resource (if explicit)
                if (n.resourceId && processedNodes.has(n.resourceId)) {
                    links.push({
                        source: n.id,
                        target: n.resourceId
                    });
                }

                // Link Note -> other Resources (via WikiLinks)
                // Note: In a real graph, we'd need to fuzzy match titles or use IDs in wikilinks
                // For now, we assume simple connections if possible, or skip
            });

            setGraphData({ nodes, links });
        };

        loadData();
    }, [currentUser]);

    const handleNodeClick = (node: any) => {
        if (node.type === 'resource') {
            navigate(`/resource/${node.id}`);
        } else if (node.type === 'note') {
            // In future: Open note editor modal
            console.log("Clicked note:", node.name);
        }
    };

    return (
        <div className="h-full flex flex-col">
            <h2 className="text-3xl font-bold text-white mb-4">{t('home.features.graph.title')}</h2>
            <div
                ref={containerRef}
                className="flex-1 bg-slate-900/50 rounded-2xl border border-white/5 overflow-hidden shadow-inner relative"
            >
                {graphData.nodes.length > 0 ? (
                    <ForceGraph2D
                        ref={graphRef}
                        width={dimensions.w}
                        height={dimensions.h}
                        graphData={graphData}
                        nodeLabel="name"
                        nodeColor={(node: any) => node.group === 1 ? '#9333ea' : '#3b82f6'} // Purple for Video, Blue for Note
                        linkColor={() => 'rgba(255,255,255,0.2)'}
                        backgroundColor="transparent"
                        onNodeClick={handleNodeClick}
                        nodeRelSize={6}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                        <p>No connections found yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GraphView;
