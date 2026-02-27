import { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw, ArrowRight, Sparkles, MessageSquare } from 'lucide-react';

interface Model {
    id: string;
    name: string;
}

interface Config {
    models: {
        transcript: string;
        extract: string;
        verify: string;
        thread_writer: string;
        thread_judge: string;
    };
    prompts: {
        transcript: string;
        extract: string;
        verify: string;
        thread_writer: string;
        thread_judge: string;
    };
}

type FeatureTab = 'viral_segments' | 'tweet_thread';
type ViralStep = 'transcript' | 'extract' | 'verify';
type ThreadStep = 'thread_writer' | 'thread_judge';

export function ConfigPanel() {
    const [isOpen, setIsOpen] = useState(false);
    const [featureTab, setFeatureTab] = useState<FeatureTab>('viral_segments');
    const [viralStep, setViralStep] = useState<ViralStep>('extract');
    const [threadStep, setThreadStep] = useState<ThreadStep>('thread_writer');
    const [models, setModels] = useState<Model[]>([]);
    const [config, setConfig] = useState<Config | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Get the current active step based on feature tab
    const getActiveStep = () => {
        return featureTab === 'viral_segments' ? viralStep : threadStep;
    };

    useEffect(() => {
        if (isOpen && !config) {
            fetchData();
        }
    }, [isOpen]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [modelsRes, configRes] = await Promise.all([
                fetch('http://127.0.0.1:8000/api/models'),
                fetch('http://127.0.0.1:8000/api/config')
            ]);

            const modelsData = await modelsRes.json();
            const configData = await configRes.json();

            setModels(modelsData.models);
            setConfig(configData);
        } catch (error) {
            console.error('Failed to fetch config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!config) return;
        setSaving(true);
        try {
            await fetch('http://127.0.0.1:8000/api/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });
        } catch (error) {
            console.error('Failed to save config:', error);
        } finally {
            setSaving(false);
        }
    };

    const updateModel = (step: string, modelId: string) => {
        if (!config) return;
        setConfig({
            ...config,
            models: { ...config.models, [step]: modelId }
        });
    };

    const updatePrompt = (step: string, text: string) => {
        if (!config) return;
        setConfig({
            ...config,
            prompts: { ...config.prompts, [step]: text }
        });
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 p-4 bg-gray-900/80 backdrop-blur-md rounded-full border border-gray-700 hover:border-secondary transition-all shadow-lg group z-50"
            >
                <Settings className="w-6 h-6 text-gray-400 group-hover:text-secondary group-hover:rotate-90 transition-all duration-500" />
            </button>
        );
    }

    const activeStep = getActiveStep();

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-5xl h-[85vh] bg-[#0d1117] rounded-2xl border border-gray-700 shadow-2xl flex flex-col overflow-hidden">

                {/* Header */}
                <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-gradient-to-r from-gray-900/50 to-transparent">
                    <div className="flex items-center gap-3">
                        <Settings className="w-6 h-6 text-secondary" />
                        <h2 className="text-xl font-bold text-white">Configuration</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Configuration
                        </button>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="px-4 py-2 hover:bg-gray-800 text-gray-400 hover:text-white rounded-lg transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>

                {/* Feature Tabs */}
                <div className="flex border-b border-gray-800 bg-gray-950/50">
                    <button
                        onClick={() => setFeatureTab('viral_segments')}
                        className={`flex-1 py-3 px-6 text-sm font-medium transition-all flex items-center justify-center gap-2 ${featureTab === 'viral_segments'
                                ? 'bg-secondary/10 text-secondary border-b-2 border-secondary'
                                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/30'
                            }`}
                    >
                        <Sparkles className="w-4 h-4" />
                        Viral Segments
                    </button>
                    <button
                        onClick={() => setFeatureTab('tweet_thread')}
                        className={`flex-1 py-3 px-6 text-sm font-medium transition-all flex items-center justify-center gap-2 ${featureTab === 'tweet_thread'
                                ? 'bg-secondary/10 text-secondary border-b-2 border-secondary'
                                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/30'
                            }`}
                    >
                        <MessageSquare className="w-4 h-4" />
                        Tweet Thread
                    </button>
                </div>

                {/* Step Tabs */}
                <div className="flex border-b border-gray-800 bg-gray-900/30">
                    {featureTab === 'viral_segments' ? (
                        // Viral Segments: 3 steps
                        (['transcript', 'extract', 'verify'] as const).map((step, index) => (
                            <button
                                key={step}
                                onClick={() => setViralStep(step)}
                                className={`flex-1 py-4 px-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-3 relative group ${viralStep === step
                                    ? 'border-secondary text-secondary bg-secondary/5'
                                    : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
                                    }`}
                            >
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${viralStep === step
                                    ? 'bg-secondary text-white shadow-lg shadow-secondary/20'
                                    : 'bg-gray-800 border border-gray-700 text-gray-400 group-hover:border-gray-600'
                                    }`}>
                                    {index + 1}
                                </span>
                                <span className="capitalize tracking-wide">{step}</span>
                                {index < 2 && (
                                    <ArrowRight className="w-4 h-4 text-gray-700 absolute right-0 translate-x-1/2 md:static md:translate-x-0 md:ml-2 md:text-gray-700/50" />
                                )}
                            </button>
                        ))
                    ) : (
                        // Tweet Thread: 2 steps (Writer / Judge)
                        (['thread_writer', 'thread_judge'] as const).map((step, index) => (
                            <button
                                key={step}
                                onClick={() => setThreadStep(step)}
                                className={`flex-1 py-4 px-4 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-3 relative group ${threadStep === step
                                    ? 'border-secondary text-secondary bg-secondary/5'
                                    : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
                                    }`}
                            >
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${threadStep === step
                                    ? 'bg-secondary text-white shadow-lg shadow-secondary/20'
                                    : 'bg-gray-800 border border-gray-700 text-gray-400 group-hover:border-gray-600'
                                    }`}>
                                    {index + 1}
                                </span>
                                <span className="capitalize tracking-wide">{step === 'thread_writer' ? 'Writer' : 'Judge'}</span>
                                {index < 1 && (
                                    <ArrowRight className="w-4 h-4 text-gray-700 absolute right-0 translate-x-1/2 md:static md:translate-x-0 md:ml-2 md:text-gray-700/50" />
                                )}
                            </button>
                        ))
                    )}
                </div>

                {/* Content */}
                {loading || !config ? (
                    <div className="flex-1 flex items-center justify-center">
                        <RefreshCw className="w-8 h-8 text-gray-600 animate-spin" />
                    </div>
                ) : (
                    <div className="flex-1 overflow-hidden flex flex-col md:flex-row">

                        {/* Prompt Editor */}
                        <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto">
                            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">System Prompt</h3>
                            <textarea
                                value={(config.prompts as any)[activeStep] || ''}
                                onChange={(e) => updatePrompt(activeStep, e.target.value)}
                                className="flex-1 w-full bg-gray-900/50 border border-gray-700 rounded-xl p-4 text-gray-300 font-mono text-sm focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/50 resize-none leading-relaxed"
                                spellCheck={false}
                            />
                        </div>

                        {/* Sidebar */}
                        <div className="w-full md:w-80 border-l border-gray-800 bg-gray-900/30 p-6 flex flex-col gap-6 overflow-y-auto">

                            <div>
                                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Model Selection</h3>
                                <div className="space-y-2">
                                    <label className="text-xs text-gray-500">Active Model</label>
                                    <select
                                        value={(config.models as any)[activeStep] || ''}
                                        onChange={(e) => updateModel(activeStep, e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-secondary"
                                    >
                                        {models.map(model => (
                                            <option key={model.id} value={model.id}>
                                                {model.name || model.id}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Selected model will be used for the {activeStep.replace('_', ' ')} step.
                                    </p>
                                </div>
                            </div>

                            {featureTab === 'viral_segments' ? (
                                <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-500/30">
                                    <h4 className="text-blue-200 font-medium mb-2 text-sm">💡 Tip</h4>
                                    <p className="text-xs text-blue-300/80 leading-relaxed">
                                        Step 1 needs a fast model (Flash).<br />
                                        Step 2 needs creativity (Flash/Pro).<br />
                                        Step 3 needs strong reasoning (Pro/Ultra/Claude).
                                    </p>
                                </div>
                            ) : (
                                <div className="p-4 rounded-lg bg-purple-900/20 border border-purple-500/30">
                                    <h4 className="text-purple-200 font-medium mb-2 text-sm">🧵 Thread Generation</h4>
                                    <p className="text-xs text-purple-300/80 leading-relaxed">
                                        <strong>Writer:</strong> Generates tweet thread (creative model).<br />
                                        <strong>Judge:</strong> Evaluates quality & provides feedback.<br />
                                        <em>Max 3 iterations to avoid infinite loops.</em>
                                    </p>
                                </div>
                            )}

                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}
