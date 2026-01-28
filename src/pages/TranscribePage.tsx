import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Loader2, Save, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { noteService } from '../services/noteService';
import { convertAudioToFloat32 } from '../utils/audioUtils';
import { useTranslation } from 'react-i18next';

// Import worker url
import workerUrl from '../utils/transcribeWorker.js?worker&url';

const TranscribePage: React.FC = () => {
    const { t } = useTranslation();
    const { currentUser } = useAuth();
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [progress, setProgress] = useState<any>(null); // For model download status

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const workerRef = useRef<Worker | null>(null);

    useEffect(() => {
        // Initialize Worker
        workerRef.current = new Worker(workerUrl, { type: 'module' });

        workerRef.current.onmessage = (event) => {
            const { type, data } = event.data;
            if (type === 'download') {
                // Model downloading progress
                // data.status, data.file, data.progress
                if (data.status === 'progress') {
                    setProgress(`${t('transcribe.processing')} ${Math.round(data.progress)}%`);
                } else if (data.status === 'initiate') {
                    setProgress(t('transcribe.processing'));
                } else if (data.status === 'done') {
                    setProgress(null);
                }
            } else if (type === 'complete') {
                setIsProcessing(false);
                setTranscript(data.text);
            } else if (type === 'error') {
                console.error("Transcription error", data);
                setIsProcessing(false);
                alert(t('transcribe.failed'));
            }
        };

        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' }); // Chrome default
                handleTranscription(audioBlob);
                stream.getTracks().forEach(track => track.stop()); // Stop mic
            };

            mediaRecorder.start();
            setIsRecording(true);
            setTranscript('');
        } catch (err) {
            console.error("Error accessing microphone", err);
            alert("Could not access microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleTranscription = async (audioBlob: Blob) => {
        setIsProcessing(true);
        setProgress(t('transcribe.processing'));
        try {
            const audioData = await convertAudioToFloat32(audioBlob);
            workerRef.current?.postMessage({ type: 'transcribe', audio: audioData });
        } catch (error) {
            console.error("Conversion error", error);
            setIsProcessing(false);
        }
    };

    const saveAsNote = async () => {
        if (!currentUser || !transcript) return;
        try {
            await noteService.addNote(currentUser.uid, `Voice  Memo - ${new Date().toLocaleString()}`, transcript);
            alert(t('transcribe.saved'));
            setTranscript('');
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 h-full flex flex-col items-center justify-center p-4">
            <div className="text-center space-y-2">
                <h1 className="text-4xl font-bold text-white">{t('transcribe.title')}</h1>
                <p className="text-slate-400">{t('transcribe.subtitle')}</p>
            </div>

            <div className="flex flex-col items-center gap-6 w-full max-w-md">
                {/* Record Button */}
                <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isProcessing}
                    className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${isRecording
                        ? 'bg-red-500/20 text-red-500 ring-4 ring-red-500/20 animate-pulse'
                        : isProcessing
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-purple-600 hover:bg-purple-500 text-white shadow-xl shadow-purple-900/30 hover:scale-105'
                        }`}
                >
                    {isProcessing ? (
                        <Loader2 size={48} className="animate-spin" />
                    ) : isRecording ? (
                        <Square size={48} fill="currentColor" />
                    ) : (
                        <Mic size={48} />
                    )}
                </button>

                <div className="text-sm font-medium text-slate-300 h-6">
                    {isRecording ? t('transcribe.recording') : progress ? progress : isProcessing ? t('transcribe.processing') : t('transcribe.tapToRecord')}
                </div>
            </div>

            {/* Result Area */}
            {transcript && (
                <div className="w-full bg-slate-900/50 border border-white/10 rounded-2xl p-6 space-y-4 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <div className="flex items-center gap-2 text-purple-400">
                            <FileText size={20} />
                            <h3 className="font-semibold">{t('transcribe.transcript')}</h3>
                        </div>
                        <button
                            onClick={saveAsNote}
                            className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            <Save size={16} />
                            {t('transcribe.saveNote')}
                        </button>
                    </div>
                    <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{transcript}</p>
                </div>
            )}

            {!transcript && !isProcessing && !isRecording && (
                <div className="text-center text-slate-600 text-sm">
                    <p>{t('transcribe.footer')}</p>
                </div>
            )}
        </div>
    );
};

export default TranscribePage;
