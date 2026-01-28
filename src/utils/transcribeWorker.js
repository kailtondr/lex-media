
import { pipeline } from '@xenova/transformers';

class TranscriptionPipeline {
    static task = 'automatic-speech-recognition';
    static model = 'Xenova/whisper-tiny'; // Multilingual model
    static instance = null;

    static async getInstance(progress_callback = null) {
        if (this.instance === null) {
            this.instance = await pipeline(this.task, this.model, { progress_callback });
        }
        return this.instance;
    }
}

self.addEventListener('message', async (event) => {
    const { type, audio } = event.data;
    if (type === 'transcribe') {
        try {
            const transcriber = await TranscriptionPipeline.getInstance((data) => {
                self.postMessage({ type: 'download', data });
            });

            const output = await transcriber(audio, {
                chunk_length_s: 30,
                stride_length_s: 5,
                // language: 'french', // Auto-detect or specify
                task: 'transcribe',
                return_timestamps: true,
            });

            self.postMessage({ type: 'complete', data: output });
        } catch (error) {
            self.postMessage({ type: 'error', data: error });
        }
    }
});
